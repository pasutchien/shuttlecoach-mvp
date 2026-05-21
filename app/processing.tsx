/**
 * S8 — AI Processing / Loading screen (SPEC §4 S8, §6.3, §10.3).
 *
 * Full-screen navy background. The user has already paid 100 credits; this
 * screen maintains trust while the CV pipeline runs (30–90 s).
 *
 * Responsibilities:
 *  - Poll `api.getAnalysisStatus(jobId)` every ~1 s, drive the ProgressRing
 *    and countdown ETA.
 *  - Rotate 5 coaching tips every 8 s.
 *  - On `done`: fetch result, refresh stores, navigate to analysis screen.
 *  - On `failed`: issue a credit refund (once), show toast, show blocking
 *    ConfirmationModal with re-upload / get-help options.
 *  - Cancel flow: confirmation modal → refund → home.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Text, ConfirmationModal, toast } from '@/src/components/ui';
import { ProgressRing, PoseSkeleton } from '@/src/components/shared';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';
import { hapticLight, hapticSuccess, hapticWarning } from '@/src/lib/haptics';
import { colors } from '@/src/theme';

import { api } from '@/src/services';
import { useCreditStore } from '@/src/store/credits';
import { useAnalysisStore } from '@/src/store/analyses';
import { PROCESSING_TIPS } from '@/src/constants/tips';

/* -------------------------------------------------------------------------- */
/*  Constants                                                                   */
/* -------------------------------------------------------------------------- */

const POLL_INTERVAL_MS = 1000;
const TIP_INTERVAL_MS = 8000;

/* -------------------------------------------------------------------------- */
/*  Screen                                                                      */
/* -------------------------------------------------------------------------- */

export default function ProcessingScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

  const { jobId, first } = useLocalSearchParams<{
    jobId: string;
    first?: string;
  }>();

  const isFirst = first === '1';

  /* ---- progress state ---- */
  const [progress, setProgress] = useState(0);
  const [etaSeconds, setEtaSeconds] = useState(60);
  const [tipIndex, setTipIndex] = useState(0);

  /* ---- modal / error state ---- */
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Track whether we've already refunded (prevents double-refund on re-render)
  const refundedRef = useRef(false);
  // Guard: true once a terminal state (done/failed/cancelled) is reached so
  // the interval never fires a second handler call.
  const terminalRef = useRef(false);
  // Hold the poll interval so we can clear it
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Hold the tip rotation interval
  const tipRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---- Breathing animation for the ring/skeleton ---- */
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduced) return;
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1200 }),
        withTiming(1.0, { duration: 1200 }),
      ),
      -1,
      false,
    );
  }, [reduced, scale]);

  const breathingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  /* ---- Tip rotation ---- */
  useEffect(() => {
    tipRef.current = setInterval(() => {
      setTipIndex((i) => (i + 1) % PROCESSING_TIPS.length);
    }, TIP_INTERVAL_MS);
    return () => {
      if (tipRef.current !== null) clearInterval(tipRef.current);
    };
  }, []);

  /* ---- Polling ---- */
  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const handleDone = useCallback(
    async (resolvedJobId: string) => {
      if (terminalRef.current) return;
      terminalRef.current = true;
      stopPolling();
      try {
        const analysis = await api.getAnalysisResult(resolvedJobId);
        await useAnalysisStore.getState().refresh();
        await useCreditStore.getState().refreshBalance();
        hapticSuccess();
        router.replace(`/analysis/${analysis.id}?first=${isFirst ? '1' : '0'}`);
      } catch {
        // If result fetch fails, show generic error
        stopPolling();
        setErrorMessage(t('error.UNKNOWN'));
        setErrorModalVisible(true);
        hapticWarning();
      }
    },
    [stopPolling, isFirst, t],
  );

  const handleFailed = useCallback(
    async (messageKey: string, refundable: boolean) => {
      if (terminalRef.current) return;
      terminalRef.current = true;
      stopPolling();
      const message = t(messageKey);
      setErrorMessage(message);

      if (refundable && !refundedRef.current) {
        refundedRef.current = true;
        try {
          await useCreditStore.getState().refund(jobId, message);
          toast(t('error.refundToast', { reason: message }), 'success');
        } catch {
          // Refund failed silently — the backend should handle idempotently
        }
      }

      hapticWarning();
      setErrorModalVisible(true);
    },
    [stopPolling, jobId, t],
  );

  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const status = await api.getAnalysisStatus(jobId);
        setProgress(status.progress);
        setEtaSeconds(Math.max(0, Math.round(status.etaSeconds)));

        if (status.status === 'done') {
          void handleDone(jobId);
        } else if (status.status === 'failed' && status.error) {
          void handleFailed(
            status.error.messageKey,
            status.error.refundable,
          );
        }
      } catch {
        // Network hiccup — keep polling
      }
    };

    // Kick off immediately then start interval
    void poll();
    pollRef.current = setInterval(() => void poll(), POLL_INTERVAL_MS);

    return () => stopPolling();
  }, [jobId, handleDone, handleFailed, stopPolling]);

  /* ---- Cancel handlers ---- */
  const handleCancelPress = useCallback(() => {
    hapticLight();
    setCancelModalVisible(true);
  }, []);

  const handleCancelConfirm = useCallback(async () => {
    if (terminalRef.current) return;
    terminalRef.current = true;
    setCancelLoading(true);
    stopPolling();
    try {
      await useCreditStore.getState().refund(jobId, 'Cancelled');
      toast(t('error.refundToast', { reason: 'Cancelled' }), 'success');
    } catch {
      // Silently ignore refund error — navigate home regardless
    } finally {
      setCancelLoading(false);
      setCancelModalVisible(false);
      router.replace('/(tabs)/home');
    }
  }, [stopPolling, jobId, t]);

  const handleCancelDismiss = useCallback(() => {
    setCancelModalVisible(false);
  }, []);

  /* ---- Error modal handlers ---- */
  const handleReupload = useCallback(() => {
    setErrorModalVisible(false);
    router.replace('/upload');
  }, []);

  const handleGetHelp = useCallback(() => {
    setErrorModalVisible(false);
    Alert.alert(
      t('error.recordingTipsTitle'),
      t('error.recordingTips'),
      [{ text: t('common.done'), style: 'default' }],
    );
  }, [t]);

  /* ---- Render ---- */
  const currentTip = PROCESSING_TIPS[tipIndex];

  return (
    <View
      className="flex-1 bg-navy items-center justify-center px-5"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
    >
      {/* Progress ring with breathing skeleton */}
      <Animated.View style={reduced ? undefined : breathingStyle}>
        <ProgressRing progress={progress} size={220} color={colors.mint}>
          <PoseSkeleton size={120} color={colors.white} jointColor={colors.mint} />
        </ProgressRing>
      </Animated.View>

      {/* Headline */}
      <Text
        variant="h1"
        className="text-white text-[22px] text-center mt-8"
      >
        {t('processing.headline')}
      </Text>

      {/* ETA */}
      <Text variant="caption" className="text-slate text-center mt-2">
        {t('processing.eta', { seconds: etaSeconds })}
      </Text>

      {/* Rotating tip */}
      <View className="mt-6 px-4">
        <Text
          variant="body"
          className="text-slate text-[13px] text-center"
          numberOfLines={5}
        >
          {t(currentTip.textKey)}
        </Text>
      </View>

      {/* Cancel link */}
      <Pressable
        onPress={handleCancelPress}
        accessibilityRole="button"
        accessibilityLabel={t('processing.cancelLink')}
        className="mt-10 py-2"
        hitSlop={12}
      >
        <Text variant="body" className="text-slate text-[13px] underline">
          {t('processing.cancelLink')}
        </Text>
      </Pressable>

      {/* Cancel confirmation modal */}
      <ConfirmationModal
        visible={cancelModalVisible}
        title={t('processing.cancelTitle')}
        message={t('processing.cancelBody')}
        confirmLabel={t('processing.cancelConfirm')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => void handleCancelConfirm()}
        onCancel={handleCancelDismiss}
        confirmLoading={cancelLoading}
      />

      {/* Error / failure modal (non-dismissable per SPEC §6.3) */}
      <ConfirmationModal
        visible={errorModalVisible}
        title={t('error.title')}
        message={errorMessage}
        confirmLabel={t('error.reupload')}
        cancelLabel={t('common.getHelp')}
        dismissable={false}
        onConfirm={handleReupload}
        onCancel={handleGetHelp}
      />
    </View>
  );
}
