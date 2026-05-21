/**
 * Haptics wrapper. Haptic feedback is native-only (SPEC §10) — every call is a
 * no-op on web so screens can fire haptics unconditionally.
 */
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export function hapticLight(): void {
  if (isNative) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function hapticMedium(): void {
  if (isNative) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function hapticSuccess(): void {
  if (isNative)
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function hapticWarning(): void {
  if (isNative)
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

export function hapticSelection(): void {
  if (isNative) void Haptics.selectionAsync();
}
