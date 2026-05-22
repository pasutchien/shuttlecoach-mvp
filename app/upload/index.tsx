/**
 * S4–S7 — Video Upload & Payment flow.
 *
 * A single full-screen modal with three internal steps (0 = Trim, 1 = Stroke,
 * 2 = Court Calibration) plus an S7 Payment BottomSheet that opens after
 * completing step 2. Navigation between steps is managed via local `step` state
 * so the shared header/step-indicator stays mounted throughout.
 *
 * Missing i18n keys (reported, not added):
 *   - upload.sampleClipNote  ← already present in en.json ✓
 *   All required keys are present in en.json.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PanResponder,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { X, Check, Camera, ChevronRight } from 'lucide-react-native';

import { Text, Button, BottomSheet } from '@/src/components/ui';
import {
  StepIndicator,
  StrokeIcon,
  ProAvatar,
} from '@/src/components/shared';
import { useTranslation } from '@/src/hooks/useTranslation';
import { hapticLight, hapticSelection, hapticMedium } from '@/src/lib/haptics';
import { colors } from '@/src/theme';

import { api, ApiError } from '@/src/services';
import {
  useUploadStore,
  trimDuration,
  TRIM_MIN_SEC,
  TRIM_MAX_SEC,
} from '@/src/store/upload';
import { useCreditStore } from '@/src/store/credits';
import { useUserStore } from '@/src/store/user';
import { STROKE_TYPES, type AnalysisRequest } from '@/src/types';
import { SAMPLE_USER_CLIP } from '@/src/constants/media';
import { matchProPlayer } from '@/src/constants/proPlayers';
import { ANALYSIS_COST } from '@/src/constants/packages';

/* -------------------------------------------------------------------------- */
/*  Types                                                                       */
/* -------------------------------------------------------------------------- */

type Step = 0 | 1 | 2;

/* -------------------------------------------------------------------------- */
/*  Step 0 — Trim                                                               */
/* -------------------------------------------------------------------------- */

interface TrimStepProps {
  onContinue: () => void;
}

function TrimStep({ onContinue }: TrimStepProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  const clipDurationSec = useUploadStore((s) => s.clipDurationSec);
  const trimStartSec = useUploadStore((s) => s.trimStartSec);
  const trimEndSec = useUploadStore((s) => s.trimEndSec);
  const setTrim = useUploadStore((s) => s.setTrim);

  const duration = trimDuration({ trimStartSec, trimEndSec });
  const isValid = duration >= TRIM_MIN_SEC && duration <= TRIM_MAX_SEC;

  // Video player (muted, looping sample)
  const player = useVideoPlayer(SAMPLE_USER_CLIP, (p) => {
    p.loop = true;
    p.muted = true;
  });

  /* ---- Dual-handle scrubber via PanResponder ---- */
  const SCRUBBER_H_PADDING = 20; // px-5 horizontal padding
  const scrubberWidth = width - SCRUBBER_H_PADDING * 2;

  // Refs hold the current positions so PanResponder callbacks always see
  // the latest value without stale closures.
  const startFracRef = useRef(trimStartSec / clipDurationSec);
  const endFracRef = useRef(trimEndSec / clipDurationSec);

  // Re-sync refs when store values change externally.
  useEffect(() => {
    startFracRef.current = trimStartSec / clipDurationSec;
    endFracRef.current = trimEndSec / clipDurationSec;
  }, [trimStartSec, trimEndSec, clipDurationSec]);

  /** Clamp a fraction to [0, 1]. */
  const clamp = (v: number) => Math.max(0, Math.min(1, v));

  /** Convert a fraction to seconds (rounded to 1 decimal). */
  const toSec = (frac: number) =>
    Math.round(frac * clipDurationSec * 10) / 10;

  // Snapshot fractions at the start of each drag (g.dx is cumulative from press
  // origin, so we need the fraction at press-down to compute absolute position).
  const startDragOriginRef = useRef(0);
  const endDragOriginRef = useRef(0);

  // Start-handle pan
  const startHandlePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        hapticSelection();
        startDragOriginRef.current = startFracRef.current;
      },
      onPanResponderMove: (_e, g) => {
        const newFrac = clamp(startDragOriginRef.current + g.dx / scrubberWidth);
        const minFrac = TRIM_MIN_SEC / clipDurationSec;
        const newStart = Math.min(newFrac, endFracRef.current - minFrac);
        startFracRef.current = newStart;
        setTrim(toSec(newStart), toSec(endFracRef.current));
      },
    }),
  ).current;

  // End-handle pan
  const endHandlePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        hapticSelection();
        endDragOriginRef.current = endFracRef.current;
      },
      onPanResponderMove: (_e, g) => {
        const newFrac = clamp(endDragOriginRef.current + g.dx / scrubberWidth);
        const minFrac = TRIM_MIN_SEC / clipDurationSec;
        const maxFrac = TRIM_MAX_SEC / clipDurationSec;
        const newEnd = Math.min(
          Math.max(newFrac, startFracRef.current + minFrac),
          Math.min(1, startFracRef.current + maxFrac),
        );
        endFracRef.current = newEnd;
        setTrim(toSec(startFracRef.current), toSec(newEnd));
      },
    }),
  ).current;

  const startPct =
    `${(trimStartSec / clipDurationSec) * 100}%` as `${number}%`;
  const endPct = `${(trimEndSec / clipDurationSec) * 100}%` as `${number}%`;
  const widthPct =
    `${((trimEndSec - trimStartSec) / clipDurationSec) * 100}%` as `${number}%`;

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Video Preview */}
      <View className="w-full bg-navy" style={{ aspectRatio: 16 / 9 }}>
        <VideoView
          player={player}
          style={{ flex: 1 }}
          contentFit="cover"
          nativeControls={false}
          accessibilityLabel="Clip preview"
        />
        {/* Timestamp overlay */}
        <View className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5">
          <Text variant="mono" className="text-[11px] text-white">
            {trimStartSec.toFixed(1)}s – {trimEndSec.toFixed(1)}s
          </Text>
        </View>
      </View>

      <View className="px-5 pt-4 gap-4">
        {/* Sample clip note */}
        <View className="rounded-input bg-primary/10 px-3 py-2">
          <Text variant="caption" className="text-primary text-center">
            {t('upload.sampleClipNote')}
          </Text>
        </View>

        {/* Camera-angle guide (SPEC §9.1 — shown before trim) — tappable to recording tips */}
        <Pressable
          onPress={() => router.push('/recording-tips')}
          accessibilityRole="button"
          accessibilityLabel={t('upload.cameraGuide')}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          className="flex-row items-center gap-3 rounded-card border border-tip-border bg-tip-bg p-3"
        >
          <View className="h-9 w-9 items-center justify-center rounded-full bg-white">
            <Camera size={18} color={colors.primary} />
          </View>
          <Text variant="body" className="flex-1 text-ink">
            {t('upload.cameraGuide')}
          </Text>
          <ChevronRight size={16} color={colors.slate} />
        </Pressable>

        {/* Instruction */}
        <Text variant="body" className="text-slate text-center">
          {t('upload.trimInstruction')}
        </Text>

        {/* Duration counter */}
        <Text variant="label" className="text-ink text-center">
          {t('upload.trimSelected', { seconds: duration.toFixed(1) })}
        </Text>

        {/* Dual-handle scrubber */}
        <View className="h-11 justify-center">
          {/* Track background */}
          <View className="h-2 w-full rounded-full bg-border" />

          {/* Selected region (light blue fill) */}
          <View
            className="absolute h-2 rounded-full bg-primary/30"
            style={{ left: startPct, width: widthPct }}
          />

          {/* Handles — absolutely positioned, 44pt touch targets */}
          {/* Start handle */}
          <View
            {...startHandlePan.panHandlers}
            style={{ position: 'absolute', left: startPct, marginLeft: -22 }}
            className="h-11 w-11 items-center justify-center"
          >
            <View className="h-5 w-5 rounded-full bg-primary shadow-md" />
          </View>

          {/* End handle */}
          <View
            {...endHandlePan.panHandlers}
            style={{ position: 'absolute', left: endPct, marginLeft: -22 }}
            className="h-11 w-11 items-center justify-center"
          >
            <View className="h-5 w-5 rounded-full bg-primary shadow-md" />
          </View>
        </View>

        {/* Validation warning */}
        {!isValid && (
          <Text variant="caption" className="text-score-red text-center">
            {t('upload.trimWarning')}
          </Text>
        )}

        {/* Continue */}
        <Button
          label={t('common.continue')}
          variant="primary"
          size="lg"
          disabled={!isValid}
          onPress={() => {
            hapticLight();
            onContinue();
          }}
        />
      </View>
    </ScrollView>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 1 — Stroke Type                                                        */
/* -------------------------------------------------------------------------- */

interface StrokeStepProps {
  onContinue: () => void;
}

function StrokeStep({ onContinue }: StrokeStepProps) {
  const { t } = useTranslation();
  const strokeType = useUploadStore((s) => s.strokeType);
  const setStroke = useUploadStore((s) => s.setStroke);

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Instruction */}
      <Text variant="body" className="text-slate text-center pt-2">
        {t('upload.strokeInstruction')}
      </Text>

      {/* 2-column grid */}
      <View className="flex-row flex-wrap gap-3">
        {STROKE_TYPES.map((s) => {
          const selected = strokeType === s;
          return (
            <Pressable
              key={s}
              onPress={() => {
                hapticSelection();
                setStroke(s);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={t(`stroke.${s}`)}
              style={{ width: '47%' }}
              className={[
                'rounded-card p-4 items-center gap-2 border-2',
                selected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-white',
              ].join(' ')}
            >
              {/* Checkmark */}
              {selected && (
                <View className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary items-center justify-center">
                  <Check size={12} color={colors.white} />
                </View>
              )}

              <StrokeIcon
                stroke={s}
                size={40}
                color={selected ? colors.primary : colors.slate}
              />
              <Text
                variant="label"
                className={selected ? 'text-primary' : 'text-ink'}
              >
                {t(`stroke.${s}`)}
              </Text>
              {/* Thai description */}
              <Text variant="caption" className="text-slate text-center">
                {t(`stroke.${s}Desc`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Continue */}
      <Button
        label={t('common.continue')}
        variant="primary"
        size="lg"
        disabled={strokeType === null}
        onPress={() => {
          hapticLight();
          onContinue();
        }}
      />
    </ScrollView>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 2 — Court Calibration                                                  */
/* -------------------------------------------------------------------------- */

interface CourtStepProps {
  onContinue: () => void;
}

type PinKey = 'tl' | 'tr' | 'bl' | 'br';
const PIN_KEYS: PinKey[] = ['tl', 'tr', 'bl', 'br'];
const PIN_LABELS: Record<PinKey, string> = {
  tl: 'TL',
  tr: 'TR',
  bl: 'BL',
  br: 'BR',
};

function CourtStep({ onContinue }: CourtStepProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  const courtCorners = useUploadStore((s) => s.courtCorners);
  const courtTouched = useUploadStore((s) => s.courtTouched);
  const setCorners = useUploadStore((s) => s.setCorners);
  const markCourtTouched = useUploadStore((s) => s.markCourtTouched);

  // The calibration frame is displayed at a 16:9 aspect ratio.
  const frameHeight = width * (9 / 16);

  // Video player (paused at frame 0 to show the calibration frame)
  const player = useVideoPlayer(SAMPLE_USER_CLIP, (p) => {
    p.loop = false;
    p.muted = true;
    p.pause();
  });

  // Keep live refs to avoid stale closures inside PanResponder callbacks.
  const cornersRef = useRef(courtCorners);
  const touchedRef = useRef(courtTouched);
  useEffect(() => { cornersRef.current = courtCorners; }, [courtCorners]);
  useEffect(() => { touchedRef.current = courtTouched; }, [courtTouched]);
  // Capture the fractional start position when a drag begins.
  const dragStartRef = useRef<Record<PinKey, { x: number; y: number }>>({
    tl: { x: 0, y: 0 },
    tr: { x: 0, y: 0 },
    bl: { x: 0, y: 0 },
    br: { x: 0, y: 0 },
  });

  /** Build a stable PanResponder for a given corner pin. */
  const makePinPan = useCallback(
    (key: PinKey) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          hapticSelection();
          if (!touchedRef.current) markCourtTouched();
          // Snapshot the current position at drag start.
          dragStartRef.current[key] = { ...cornersRef.current[key] };
        },
        onPanResponderMove: (_e, g) => {
          const start = dragStartRef.current[key];
          const newX = Math.max(0, Math.min(1, start.x + g.dx / width));
          const newY = Math.max(0, Math.min(1, start.y + g.dy / frameHeight));
          setCorners({ ...cornersRef.current, [key]: { x: newX, y: newY } });
        },
      }),
    // markCourtTouched and setCorners are stable Zustand actions; width and
    // frameHeight may change on orientation but we only target portrait.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Build pan responders once per mount (stable thanks to makePinPan).
  const panResponders = useRef<Record<PinKey, ReturnType<typeof PanResponder.create>>>(
    {
      tl: makePinPan('tl'),
      tr: makePinPan('tr'),
      bl: makePinPan('bl'),
      br: makePinPan('br'),
    },
  );

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Court frame with draggable pins */}
      <View
        style={{ width, height: frameHeight }}
        className="relative bg-navy overflow-hidden"
      >
        <VideoView
          player={player}
          style={{ flex: 1 }}
          contentFit="cover"
          nativeControls={false}
          accessibilityLabel="Court calibration frame"
        />

        {/* Guide overlay — faint rectangle, disappears after first drag */}
        {!courtTouched && (
          <View
            className="absolute border-2 border-dashed border-white/50"
            style={{
              left: courtCorners.tl.x * width,
              top: courtCorners.tl.y * frameHeight,
              width: (courtCorners.tr.x - courtCorners.tl.x) * width,
              height: (courtCorners.bl.y - courtCorners.tl.y) * frameHeight,
            }}
          />
        )}

        {/* Draggable corner pins */}
        {PIN_KEYS.map((key) => {
          const corner = courtCorners[key];
          return (
            <View
              key={key}
              {...panResponders.current[key].panHandlers}
              style={{
                position: 'absolute',
                left: corner.x * width - 22,
                top: corner.y * frameHeight - 22,
              }}
              className="h-11 w-11 items-center justify-center"
              accessibilityLabel={`Court corner ${PIN_LABELS[key]}`}
            >
              <View className="h-7 w-7 rounded-full bg-orange border-2 border-white shadow items-center justify-center">
                <Text variant="caption" className="text-white text-[9px] font-bold">
                  {PIN_LABELS[key]}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Hint when not yet touched */}
        {!courtTouched && (
          <View className="absolute bottom-2 left-0 right-0 items-center">
            <View className="bg-black/60 rounded-full px-3 py-1">
              <Text variant="caption" className="text-white">
                {t('upload.courtGuideHint')}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View className="px-5 pt-4 gap-4">
        {/* Instruction */}
        <Text variant="body" className="text-slate text-center">
          {t('upload.courtInstruction')}
        </Text>

        {/* Continue — always enabled */}
        <Button
          label={t('common.continue')}
          variant="primary"
          size="lg"
          onPress={() => {
            hapticLight();
            onContinue();
          }}
        />
      </View>
    </ScrollView>
  );
}

/* -------------------------------------------------------------------------- */
/*  S7 Payment Bottom Sheet                                                     */
/* -------------------------------------------------------------------------- */

interface PaymentSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (jobId: string, isFirst: boolean, strokeType: string) => void;
}

function PaymentSheet({ visible, onClose, onSuccess }: PaymentSheetProps) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const balance = useCreditStore((s) => s.balance);
  const profile = useUserStore((s) => s.profile);

  const { trimStartSec, trimEndSec, strokeType, courtCorners, clipRef } =
    useUploadStore();
  const duration = trimDuration({ trimStartSec, trimEndSec });

  const hasSufficientCredits = balance >= ANALYSIS_COST;
  const shortfall = ANALYSIS_COST - balance;

  // Matched pro player
  const matchedPro =
    strokeType !== null
      ? matchProPlayer(
          strokeType,
          profile?.heightCm ?? 170,
          profile?.favoriteProId,
        )
      : null;

  const balanceAfter = balance - ANALYSIS_COST;

  const handleConfirm = useCallback(async () => {
    if (!strokeType || !profile) return;
    setConfirming(true);
    setApiError(null);
    try {
      const request: AnalysisRequest = {
        clipRef,
        trimStartSec,
        trimEndSec,
        strokeType,
        courtCorners,
        userProfileSnapshot: {
          heightCm: profile.heightCm,
          favoriteProId: profile.favoriteProId,
        },
      };
      const { jobId } = await api.submitAnalysis(request);
      const isFirst = profile.hasCompletedFirstAnalysis === false;
      onSuccess(jobId, isFirst, strokeType);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INSUFFICIENT_CREDITS') {
        setApiError(t('upload.insufficient', { balance, shortfall }));
      } else {
        setApiError(t('error.UNKNOWN'));
      }
    } finally {
      setConfirming(false);
    }
  }, [
    strokeType,
    profile,
    clipRef,
    trimStartSec,
    trimEndSec,
    courtCorners,
    balance,
    shortfall,
    t,
    onSuccess,
  ]);

  const handleTopUp = useCallback(() => {
    // Keep sheet open (visible stays true in parent) and navigate to wallet
    router.push('/(tabs)/wallet');
  }, []);

  if (strokeType === null) return null;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      heightRatio={0.55}
      scrollable
    >
      {/* Title */}
      <Text variant="h1" className="text-[18px] text-ink font-semibold mb-4 mt-1">
        {t('upload.confirmTitle')}
      </Text>

      {/* Summary rows */}
      <View className="gap-3 mb-4">
        {/* Duration */}
        <View className="flex-row justify-between items-center">
          <Text variant="body" className="text-slate">
            {t('upload.summaryDuration')}
          </Text>
          <Text variant="label" className="text-ink">
            {duration.toFixed(1)}s
          </Text>
        </View>

        {/* Stroke */}
        <View className="flex-row justify-between items-center">
          <Text variant="body" className="text-slate">
            {t('upload.summaryStroke')}
          </Text>
          <Text variant="label" className="text-ink">
            {t(`stroke.${strokeType}`)}
          </Text>
        </View>

        {/* Pro Player */}
        {matchedPro !== null && (
          <View className="flex-row justify-between items-center">
            <Text variant="body" className="text-slate">
              {t('upload.summaryPro')}
            </Text>
            <ProAvatar player={matchedPro} size={28} showName />
          </View>
        )}

        {/* Cost */}
        <View className="flex-row justify-between items-center">
          <Text variant="body" className="text-slate">
            {t('upload.summaryCost')}
          </Text>
          <Text variant="mono" className="text-orange font-medium">
            {`-${ANALYSIS_COST} ${t('common.creditsLabel')}`}
          </Text>
        </View>

        {/* Divider */}
        <View className="h-px bg-border" />

        {/* Balance after */}
        <View className="flex-row justify-between items-center">
          <Text variant="body" className="text-slate">
            {t('upload.balanceAfter', { balance: balanceAfter })}
          </Text>
          <Text
            variant="mono"
            className={hasSufficientCredits ? 'text-score-green' : 'text-score-red'}
          >
            {`${balanceAfter} ${t('common.creditsLabel')}`}
          </Text>
        </View>
      </View>

      {/* API error */}
      {apiError !== null && (
        <View className="mb-3 rounded-input bg-score-red/10 px-3 py-2">
          <Text variant="caption" className="text-score-red text-center">
            {apiError}
          </Text>
        </View>
      )}

      {/* Insufficient credits warning */}
      {!hasSufficientCredits && (
        <View className="mb-3 rounded-input bg-score-amber/10 px-3 py-2">
          <Text variant="caption" className="text-score-amber text-center">
            {t('upload.insufficient', { balance, shortfall })}
          </Text>
        </View>
      )}

      {/* CTA */}
      {hasSufficientCredits ? (
        <Button
          label={t('upload.confirmCta')}
          variant="orange"
          size="lg"
          loading={confirming}
          onPress={() => {
            hapticMedium();
            void handleConfirm();
          }}
        />
      ) : (
        <Button
          label={t('upload.topUpCta')}
          variant="orange"
          size="lg"
          onPress={handleTopUp}
        />
      )}

      {/* Cancel link */}
      <Button
        label={t('upload.cancelLink')}
        variant="text"
        size="md"
        onPress={onClose}
        className="mt-1"
      />
    </BottomSheet>
  );
}

/* -------------------------------------------------------------------------- */
/*  Root screen                                                                 */
/* -------------------------------------------------------------------------- */

export default function UploadScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>(0);
  const [paymentVisible, setPaymentVisible] = useState(false);

  // Initialise the store on mount.
  useEffect(() => {
    useUploadStore.getState().start();
  }, []);

  const steps = [
    t('upload.stepTrim'),
    t('upload.stepStroke'),
    t('upload.stepCourt'),
    t('upload.stepConfirm'),
  ];

  // StepIndicator current: 0–2 for the three main steps, 3 when payment is open.
  const indicatorCurrent = paymentVisible ? 3 : step;

  const handleClose = useCallback(() => {
    useUploadStore.getState().reset();
    router.back();
  }, []);

  const handleContinue = useCallback(() => {
    if (step < 2) {
      setStep((s) => (s + 1) as Step);
    } else {
      // Step 2 → open payment sheet
      setPaymentVisible(true);
    }
  }, [step]);

  const handlePaymentClose = useCallback(() => {
    setPaymentVisible(false);
    // Return to step 2 (court)
    setStep(2);
  }, []);

  const handlePaymentSuccess = useCallback(
    (jobId: string, isFirst: boolean, strokeType: string) => {
      useUploadStore.getState().reset();
      router.replace({
        pathname: '/processing',
        params: { jobId, first: isFirst ? '1' : '0', stroke: strokeType },
      });
    },
    [],
  );

  return (
    <View className="flex-1 bg-light" style={{ paddingTop: insets.top }}>
      {/* Header row */}
      <View className="flex-row items-center px-5 py-3">
        {/* Step indicator (flex-1 to fill space) */}
        <View className="flex-1 mr-3">
          <StepIndicator steps={steps} current={indicatorCurrent} />
        </View>

        {/* Close button */}
        <Pressable
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          className="h-11 w-11 items-center justify-center rounded-full bg-border/40"
          hitSlop={8}
        >
          <X size={20} color={colors.slate} />
        </Pressable>
      </View>

      {/* Step title */}
      <View className="px-5 pb-3">
        <Text variant="h1" className="text-[20px] text-ink">
          {step === 0
            ? t('upload.trimTitle')
            : step === 1
              ? t('upload.strokeTitle')
              : t('upload.courtTitle')}
        </Text>
      </View>

      {/* Step content */}
      <View className="flex-1">
        {step === 0 && <TrimStep onContinue={handleContinue} />}
        {step === 1 && <StrokeStep onContinue={handleContinue} />}
        {step === 2 && <CourtStep onContinue={handleContinue} />}
      </View>

      {/* Payment bottom sheet (S7) */}
      <PaymentSheet
        visible={paymentVisible}
        onClose={handlePaymentClose}
        onSuccess={handlePaymentSuccess}
      />
    </View>
  );
}
