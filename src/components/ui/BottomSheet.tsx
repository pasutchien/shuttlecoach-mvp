/**
 * Bottom sheet (SPEC §11.4). Spring slide-up, dim overlay, drag handle.
 * Used by S7 payment, S10 drill detail, and the dropdown/sort pickers.
 */
import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { cn } from '@/src/lib/cn';
import { shadows } from '@/src/theme';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Fixed height as a fraction of the screen (e.g. 0.5, 0.75). */
  heightRatio?: number;
  /** Wrap content in a ScrollView. */
  scrollable?: boolean;
  /** Tailwind classes for the inner content container. */
  contentClassName?: string;
}

export function BottomSheet({
  visible,
  onClose,
  children,
  heightRatio,
  scrollable = false,
  contentClassName,
}: BottomSheetProps) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [rendered, setRendered] = useState(visible);

  const translateY = useSharedValue(height);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) setRendered(true);
  }, [visible]);

  useEffect(() => {
    if (!rendered) return;
    if (visible) {
      overlayOpacity.value = reduced ? 1 : withTiming(1, { duration: 200 });
      translateY.value = reduced
        ? 0
        : withSpring(0, { damping: 20, stiffness: 180 });
    } else {
      overlayOpacity.value = reduced ? 0 : withTiming(0, { duration: 180 });
      if (reduced) {
        translateY.value = height;
        setRendered(false);
      } else {
        translateY.value = withTiming(
          height,
          { duration: 220 },
          (finished) => {
            if (finished) runOnJS(setRendered)(false);
          },
        );
      }
    }
  }, [visible, rendered, reduced, height, overlayOpacity, translateY]);

  // Drag-to-dismiss from the handle area.
  const dragStart = useRef(0);
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => g.dy > 4,
      onPanResponderGrant: () => {
        dragStart.current = translateY.value;
      },
      onPanResponderMove: (_e, g) => {
        translateY.value = Math.max(0, dragStart.current + g.dy);
      },
      onPanResponderRelease: (_e, g) => {
        if (g.dy > 90) {
          onClose();
        } else {
          translateY.value = withSpring(0, { damping: 20, stiffness: 180 });
        }
      },
    }),
  ).current;

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!rendered) return null;

  const sheetHeight = heightRatio ? height * heightRatio : undefined;

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        {/* Dim overlay — critical visual styles live on `style` (not className)
            because NativeWind classes are not reliably applied to a reanimated
            Animated.View, which would leave the sheet transparent. */}
        <Animated.View
          style={[
            overlayStyle,
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.45)',
            },
          ]}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
        </Animated.View>

        <Animated.View
          style={[
            sheetStyle,
            shadows.sheet,
            {
              height: sheetHeight,
              maxHeight: height * 0.92,
              paddingBottom: insets.bottom + 8,
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderTopWidth: 1,
              borderTopColor: 'rgba(203,213,225,0.5)',
            },
          ]}
        >
          {/* Drag handle */}
          <View {...pan.panHandlers} className="items-center pt-3 pb-1">
            <View className="h-1 w-9 rounded-full bg-border" />
          </View>

          {scrollable ? (
            <ScrollView
              className={cn('px-5', contentClassName)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {children}
            </ScrollView>
          ) : (
            <View className={cn('flex-1 px-5', contentClassName)}>
              {children}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
