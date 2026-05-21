/**
 * S9 — Analysis & Comparison screen + S10 How To Fix drill sheet.
 *
 * Hero screen of the product. Split-screen synchronized video comparison
 * (user vs. pro), animated score reveal, mistake highlight cards, checkpoint
 * breakdown, and the S10 drill detail bottom sheet — all in one file.
 *
 * Route: /analysis/[id]
 * Params:
 *   id    — the Analysis id to load
 *   first — if "1" this is the user's first ever analysis (SPEC §6.5)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Share2,
  X,
} from 'lucide-react-native';

import type { Analysis, Drill, MistakeCard, ProPlayer } from '@/src/types';
import { api, ApiError } from '@/src/services';
import {
  BottomSheet,
  Button,
  Skeleton,
  Text,
  Toggle,
  toast,
} from '@/src/components/ui';
import {
  CheckpointBar,
  ConfettiOverlay,
  MistakeHighlightCard,
  PoseSkeleton,
  ProAvatar,
  ScoreCircle,
  SelectSheet,
  SponsorBadge,
} from '@/src/components/shared';
import { resolveVideoSource } from '@/src/constants/media';
import {
  PRO_ACCENT,
  getProPlayer,
  prosForStroke,
} from '@/src/constants/proPlayers';
import { scoreBand } from '@/src/lib/score';
import { colors } from '@/src/theme';
import { hapticLight, hapticMedium, hapticSuccess } from '@/src/lib/haptics';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';
import { useTranslation } from '@/src/hooks/useTranslation';

/* -------------------------------------------------------------------------- */
/*  Types                                                                       */
/* -------------------------------------------------------------------------- */

type ScreenState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; analysis: Analysis };

type PlaybackSpeed = 0.25 | 0.5 | 1.0;

const SPEEDS: PlaybackSpeed[] = [0.25, 0.5, 1.0];
const FRAME_STEP = 1 / 30; // ~1 frame at 30fps

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function formatSpeed(s: PlaybackSpeed): string {
  if (s === 1.0) return '1×';
  if (s === 0.5) return '0.5×';
  return '0.25×';
}

/* -------------------------------------------------------------------------- */
/*  Sub-component: SkeletonLoading                                              */
/* -------------------------------------------------------------------------- */

function SkeletonLoading() {
  return (
    <View className="flex-1 bg-navy">
      {/* Video area */}
      <View className="flex-row" style={{ aspectRatio: 16 / 9 }}>
        <Skeleton className="flex-1 m-0.5" />
        <Skeleton className="flex-1 m-0.5" />
      </View>
      {/* Controls */}
      <View className="bg-deep-navy px-4 py-3 gap-2">
        <Skeleton className="h-1 w-full rounded-full" />
        <View className="flex-row justify-center gap-6">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </View>
      </View>
      {/* Bottom cards */}
      <ScrollView className="flex-1 bg-light px-4 pt-4">
        <Skeleton className="h-24 w-full mb-3 rounded-card" />
        <Skeleton className="h-24 w-full mb-3 rounded-card" />
        <Skeleton className="h-24 w-full rounded-card" />
      </ScrollView>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-component: S10 Drill Sheet                                              */
/* -------------------------------------------------------------------------- */

interface DrillSheetProps {
  mistake: MistakeCard | null;
  onClose: () => void;
}

function DrillSheet({ mistake, onClose }: DrillSheetProps) {
  const { t } = useTranslation();
  const [drill, setDrill] = useState<Drill | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const visible = mistake !== null;

  useEffect(() => {
    if (!mistake) {
      setDrill(null);
      setError(false);
      return;
    }
    setLoading(true);
    setError(false);
    api
      .getDrill(mistake.drillId)
      .then((d) => setDrill(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [mistake?.drillId]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      heightRatio={0.78}
      scrollable
    >
      {/* Header */}
      <View className="flex-row items-start justify-between mb-4">
        <Text
          variant="h1"
          className="flex-1 pr-4 text-[18px] font-semibold text-ink"
        >
          {mistake?.title ?? ''}
        </Text>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        >
          <X size={22} color={colors.slate} />
        </Pressable>
      </View>

      {loading ? (
        <View className="items-center py-10">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <Text variant="body" className="text-center text-score-red py-8">
          {t('error.loadFailed')}
        </Text>
      ) : drill ? (
        <>
          {/* Drill name */}
          <Text variant="label" className="text-primary mb-4 text-[14px]">
            {t('drill.label', { name: drill.name })}
          </Text>

          {/* Steps */}
          {drill.steps.map((step, i) => (
            <View
              key={i}
              className="flex-row items-start gap-3 mb-4"
              accessibilityLabel={`Step ${i + 1}: ${step}`}
            >
              {/* Circled number */}
              <View
                className="items-center justify-center rounded-full"
                style={{
                  width: 28,
                  height: 28,
                  backgroundColor: colors.primary,
                  flexShrink: 0,
                }}
              >
                <Text
                  className="text-white font-label text-[13px]"
                  variant="caption"
                >
                  {i + 1}
                </Text>
              </View>
              <Text
                variant="body"
                className="flex-1 text-ink leading-[22px] pt-0.5"
              >
                {step}
              </Text>
            </View>
          ))}

          {/* Pro-tip box */}
          <View
            className="rounded-card p-4 my-2"
            style={{
              backgroundColor: colors.tipBg,
              borderLeftWidth: 4,
              borderLeftColor: colors.mint,
            }}
          >
            <Text
              variant="label"
              className="text-mint text-[12px] mb-1 uppercase"
              style={{ letterSpacing: 0.5 }}
            >
              {t('drill.coachTip')}
            </Text>
            <Text variant="body" className="text-ink text-[14px] leading-[21px]">
              {drill.coachTip}
            </Text>
          </View>

          {/* Related video placeholder */}
          <View
            className="rounded-card border border-border mt-4 mb-2 p-4 items-center justify-center"
            style={{ height: 88, backgroundColor: colors.light, opacity: 0.7 }}
          >
            <Text
              variant="caption"
              className="text-slate text-center text-[13px]"
            >
              {t('drill.videoComingSoon')}
            </Text>
          </View>
        </>
      ) : null}

      {/* Done button */}
      <View className="mt-4">
        <Button
          label={t('drill.doneCta')}
          variant="primary"
          size="lg"
          onPress={onClose}
        />
      </View>
    </BottomSheet>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-component: Share Card Modal                                             */
/* -------------------------------------------------------------------------- */

interface ShareCardProps {
  visible: boolean;
  analysis: Analysis;
  proPlayer: ProPlayer | undefined;
  onClose: () => void;
}

function ShareCardModal({
  visible,
  analysis,
  proPlayer,
  onClose,
}: ShareCardProps) {
  const { t } = useTranslation();
  const band = scoreBand(analysis.overallScore);
  const topMistake = analysis.mistakes[0];

  const handleShare = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      await Share.share({
        title: t('common.appName'),
        message: [
          `🏸 ${t('common.appName')} — ${t('stroke.' + analysis.strokeType)}`,
          `${t('analysis.shareScore')}: ${analysis.overallScore}/100`,
          topMistake
            ? `${t('analysis.shareTopMistake')}: ${topMistake.title}`
            : '',
          t('common.sponsor'),
        ]
          .filter(Boolean)
          .join('\n'),
      });
    } catch {
      // User cancelled or web
    }
  }, [analysis, t, topMistake]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <Pressable
          className="absolute inset-0"
          onPress={onClose}
          accessibilityLabel={t('common.close')}
        />
        <View className="w-full max-w-[320px] rounded-2xl bg-navy overflow-hidden">
          {/* Header stripe */}
          <View className="bg-deep-navy px-5 pt-5 pb-4">
            <Text className="font-display text-[28px] text-primary">
              {t('common.appName')}
            </Text>
            <Text variant="caption" className="text-slate mt-0.5">
              {t('splash.tagline')}
            </Text>
          </View>

          {/* Score + stroke */}
          <View className="px-5 pt-5 pb-2 flex-row items-center gap-4">
            <ScoreCircle score={analysis.overallScore} size={80} />
            <View className="flex-1">
              <Text variant="h2" className="text-white text-[16px]">
                {t('stroke.' + analysis.strokeType)}
              </Text>
              <Text
                variant="label"
                className="text-[14px] mt-0.5"
                style={{ color: band.hex }}
              >
                {t(band.labelKey)}
              </Text>
              {proPlayer ? (
                <Text variant="caption" className="text-slate mt-1">
                  {t('analysis.comparedWith', { name: proPlayer.name })}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Top mistake */}
          {topMistake ? (
            <View className="mx-5 mb-4 p-3 rounded-card bg-deep-navy">
              <Text variant="caption" className="text-slate mb-0.5">
                {t('analysis.shareTopMistake')}
              </Text>
              <Text variant="label" className="text-white text-[13px]">
                {topMistake.title}
              </Text>
            </View>
          ) : null}

          {/* Sponsor */}
          <View className="items-center pb-5">
            <SponsorBadge variant="plain" />
          </View>

          {/* Actions */}
          <View className="px-5 pb-5 gap-2">
            <Button
              label={t('analysis.shareTitle')}
              variant="primary"
              size="md"
              icon={<Share2 size={16} color={colors.white} />}
              onPress={handleShare}
            />
            <Button
              label={t('common.close')}
              variant="text"
              size="md"
              onPress={onClose}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main screen                                                                 */
/* -------------------------------------------------------------------------- */

export default function AnalysisScreen() {
  const { t } = useTranslation();
  const { id, first } = useLocalSearchParams<{ id: string; first?: string }>();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const reduced = useReducedMotion();

  const isFirstAnalysis = first === '1';

  /* ---- Screen state ---- */
  const [state, setState] = useState<ScreenState>({ phase: 'loading' });

  /* ---- Video playback state ---- */
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(0.5);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [flashRed, setFlashRed] = useState(false);
  const scrubbing = useRef(false);

  /* ---- UI overlay state ---- */
  const [skeletonOn, setSkeletonOn] = useState(false);
  const [showProPicker, setShowProPicker] = useState(false);
  const [currentProPlayer, setCurrentProPlayer] = useState<
    ProPlayer | undefined
  >(undefined);
  const [activeDrillMistake, setActiveDrillMistake] =
    useState<MistakeCard | null>(null);
  const [showShareCard, setShowShareCard] = useState(false);
  const [showConfetti, setShowConfetti] = useState(isFirstAnalysis);

  /* ---- Cards staged entrance ---- */
  const [cardsVisible, setCardsVisible] = useState(false);

  /* ---- Video players (null source until analysis loads) ---- */
  const userPlayer = useVideoPlayer(null, (p) => {
    p.loop = true;
    p.muted = true;
    p.playbackRate = 0.5;
  });

  const proPlayer = useVideoPlayer(null, (p) => {
    p.loop = true;
    p.muted = true;
    p.playbackRate = 0.5;
  });

  /* ---- Load analysis ---- */
  useEffect(() => {
    if (!id) {
      setState({ phase: 'error', message: t('error.title') });
      return;
    }
    let cancelled = false;
    api
      .getAnalysis(id)
      .then((analysis) => {
        if (cancelled) return;
        const pro = getProPlayer(analysis.proPlayerId);
        setCurrentProPlayer(pro);
        setDuration(analysis.durationSec);
        setState({ phase: 'ready', analysis });

        // Load video sources into the players.
        userPlayer.replace(resolveVideoSource(analysis.userVideoUrl));
        proPlayer.replace(resolveVideoSource(analysis.proVideoUrl));

        // Show "Saved to History" toast
        toast(t('analysis.savedToast'), 'success');

        // First-analysis celebration
        if (isFirstAnalysis) {
          toast(t('analysis.firstAnalysisToast'), 'success');
          hapticSuccess();
          setTimeout(() => setShowConfetti(false), 2500);
        }

        // Stagger card entrance after score count-up (1.2s)
        setTimeout(() => setCardsVisible(true), reduced ? 0 : 1400);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg =
          err instanceof ApiError ? err.message : t('error.title');
        setState({ phase: 'error', message: msg });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ---- Keep time indicator updated ---- */
  useEffect(() => {
    if (!playing || scrubbing.current) return;
    const iv = setInterval(() => {
      setCurrentTime(userPlayer.currentTime);
    }, 100);
    return () => clearInterval(iv);
  }, [playing, userPlayer]);

  /* ---- Playback controls ---- */
  const togglePlay = useCallback(() => {
    hapticLight();
    if (playing) {
      userPlayer.pause();
      proPlayer.pause();
      setPlaying(false);
    } else {
      userPlayer.play();
      proPlayer.play();
      setPlaying(true);
    }
  }, [playing, userPlayer, proPlayer]);

  const stepFrame = useCallback(
    (direction: 'back' | 'forward') => {
      hapticLight();
      const delta = direction === 'back' ? -FRAME_STEP : FRAME_STEP;
      const next = Math.max(0, Math.min(duration, currentTime + delta));
      userPlayer.currentTime = next;
      proPlayer.currentTime = next;
      setCurrentTime(next);
    },
    [currentTime, duration, userPlayer, proPlayer],
  );

  const setPlaybackSpeed = useCallback(
    (s: PlaybackSpeed) => {
      hapticLight();
      setSpeed(s);
      userPlayer.playbackRate = s;
      proPlayer.playbackRate = s;
    },
    [userPlayer, proPlayer],
  );

  const seekTo = useCallback(
    (sec: number) => {
      const clamped = Math.max(0, Math.min(duration, sec));
      userPlayer.currentTime = clamped;
      proPlayer.currentTime = clamped;
      setCurrentTime(clamped);
    },
    [duration, userPlayer, proPlayer],
  );

  const jumpToTimestamp = useCallback(
    (timestampSec: number) => {
      hapticMedium();
      // Pause and jump
      userPlayer.pause();
      proPlayer.pause();
      setPlaying(false);
      seekTo(timestampSec);
      // Flash red
      setFlashRed(true);
      setTimeout(() => setFlashRed(false), 350);
    },
    [userPlayer, proPlayer, seekTo],
  );

  /* ---- Timeline scrubber PanResponder ---- */
  const scrubberWidth = useRef(0);
  const scrubPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        scrubbing.current = true;
        const ratio =
          scrubberWidth.current > 0
            ? Math.max(0, Math.min(1, e.nativeEvent.locationX / scrubberWidth.current))
            : 0;
        const seek = ratio * (duration || 1);
        seekTo(seek);
      },
      onPanResponderMove: (e) => {
        const ratio =
          scrubberWidth.current > 0
            ? Math.max(0, Math.min(1, e.nativeEvent.locationX / scrubberWidth.current))
            : 0;
        const seek = ratio * (duration || 1);
        seekTo(seek);
      },
      onPanResponderRelease: () => {
        scrubbing.current = false;
      },
    }),
  ).current;

  /* ---- Pro player picker options ---- */
  const proOptions =
    state.phase === 'ready'
      ? prosForStroke(state.analysis.strokeType).map((p) => ({
          value: p.id,
          label: p.name,
          subtitle: `${p.nationality} · ${p.heightCm} cm`,
        }))
      : [];

  /* ---- Flash overlay animated style ---- */
  const flashOpacity = useSharedValue(0);
  useEffect(() => {
    if (flashRed) {
      flashOpacity.value = withTiming(0.45, { duration: 80 });
      const timer = setTimeout(() => {
        flashOpacity.value = withTiming(0, { duration: 220 });
      }, 140);
      return () => clearTimeout(timer);
    }
  }, [flashRed, flashOpacity]);
  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  /* ---- Layout constants ---- */
  const videoHeight = Math.round(screenHeight * 0.38);
  const halfWidth = Math.floor(screenWidth / 2);

  /* ========== RENDER: loading ========== */
  if (state.phase === 'loading') {
    return (
      <View className="flex-1" style={{ paddingTop: insets.top }}>
        <SkeletonLoading />
      </View>
    );
  }

  /* ========== RENDER: error ========== */
  if (state.phase === 'error') {
    return (
      <View
        className="flex-1 items-center justify-center bg-navy px-8 gap-4"
        style={{ paddingTop: insets.top }}
      >
        <Text variant="h1" className="text-white text-center">
          {t('error.title')}
        </Text>
        <Text variant="body" className="text-slate text-center">
          {state.message}
        </Text>
        <Button
          label={t('common.back')}
          variant="secondary"
          size="md"
          block={false}
          onPress={() => router.replace('/(tabs)/home')}
        />
      </View>
    );
  }

  /* ========== RENDER: ready ========== */
  const { analysis } = state;
  const band = scoreBand(analysis.overallScore);
  const scrubFraction = duration > 0 ? currentTime / duration : 0;

  return (
    <View className="flex-1 bg-navy" style={{ paddingTop: insets.top }}>
      {/* ------------------------------------------------------------------ */}
      {/* TOOLBAR                                                              */}
      {/* ------------------------------------------------------------------ */}
      <View className="flex-row items-center justify-between px-4 pb-2">
        <Pressable
          onPress={() => {
            hapticLight();
            router.replace('/(tabs)/home');
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          className="flex-row items-center gap-1"
        >
          <ArrowLeft size={18} color={colors.white} />
          <Text variant="label" className="text-white text-[14px]">
            {t('common.back')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            hapticLight();
            setShowShareCard(true);
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('analysis.shareTitle')}
        >
          <Share2 size={22} color={colors.white} />
        </Pressable>
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* SPLIT-SCREEN VIDEO AREA                                              */}
      {/* ------------------------------------------------------------------ */}
      <View style={{ height: videoHeight }} className="flex-row">
        {/* LEFT — User video */}
        <View style={{ width: halfWidth, height: videoHeight }} className="relative overflow-hidden">
          <VideoView
            player={userPlayer}
            style={{ width: halfWidth, height: videoHeight }}
            contentFit="cover"
            nativeControls={false}
            accessibilityLabel="Your swing video"
          />

          {/* Skeleton overlay */}
          {skeletonOn ? (
            <View
              style={StyleSheet.absoluteFillObject}
              className="items-center justify-center"
              pointerEvents="none"
            >
              <PoseSkeleton
                size={Math.min(halfWidth, videoHeight) * 0.85}
                color="rgba(255,255,255,0.55)"
                jointColor={colors.mint}
              />
            </View>
          ) : null}

          {/* Flash red overlay */}
          <Animated.View
            style={[StyleSheet.absoluteFillObject, flashStyle, { backgroundColor: colors.scoreRed }]}
            pointerEvents="none"
          />

          {/* Score badge */}
          <View className="absolute top-2 left-2">
            <ScoreCircle
              score={analysis.overallScore}
              size={68}
              strokeWidth={5}
              animated={!reduced}
              label={t(band.labelKey)}
            />
          </View>

          {/* Label */}
          <View
            className="absolute bottom-0 left-0 right-0 px-2 py-1"
            style={{ backgroundColor: 'rgba(10,22,40,0.65)' }}
          >
            <Text variant="caption" className="text-white text-[11px]">
              {t('analysis.youLabel')}
            </Text>
          </View>
        </View>

        {/* RIGHT — Pro video */}
        <View style={{ width: halfWidth, height: videoHeight }} className="relative overflow-hidden">
          <VideoView
            player={proPlayer}
            style={{ width: halfWidth, height: videoHeight }}
            contentFit="cover"
            nativeControls={false}
            accessibilityLabel={`${currentProPlayer?.name ?? 'Pro'} reference video`}
          />

          {/* Skeleton overlay */}
          {skeletonOn ? (
            <View
              style={StyleSheet.absoluteFillObject}
              className="items-center justify-center"
              pointerEvents="none"
            >
              <PoseSkeleton
                size={Math.min(halfWidth, videoHeight) * 0.85}
                color="rgba(0,200,150,0.55)"
                jointColor={colors.orange}
              />
            </View>
          ) : null}

          {/* Pro player label */}
          {currentProPlayer ? (
            <View
              className="absolute bottom-0 left-0 right-0 px-2 py-1"
              style={{ backgroundColor: 'rgba(10,22,40,0.65)' }}
            >
              <Text
                variant="caption"
                className="text-white text-[11px]"
                numberOfLines={1}
              >
                {currentProPlayer.name}
              </Text>
            </View>
          ) : null}

          {/* Accent border */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: 2,
              backgroundColor: PRO_ACCENT[currentProPlayer?.id ?? ''] ?? colors.mint,
            }}
          />
        </View>
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* PLAYBACK CONTROLS                                                    */}
      {/* ------------------------------------------------------------------ */}
      <View className="bg-deep-navy px-4 pt-2 pb-3">
        {/* Timeline scrubber */}
        <View
          className="h-[22px] justify-center mb-2"
          {...scrubPan.panHandlers}
          onLayout={(e) => {
            scrubberWidth.current = e.nativeEvent.layout.width;
          }}
          accessibilityRole="adjustable"
          accessibilityLabel="Video timeline"
          accessibilityValue={{ now: currentTime, min: 0, max: duration }}
        >
          <View className="h-1.5 w-full rounded-full bg-border/40 overflow-hidden">
            <View
              className="h-full rounded-full bg-primary"
              style={{ width: `${scrubFraction * 100}%` }}
            />
          </View>
          {/* Thumb */}
          <View
            className="absolute h-4 w-4 rounded-full bg-white"
            style={{
              left: `${scrubFraction * 100}%`,
              marginLeft: -8,
              top: 3,
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowRadius: 3,
              elevation: 3,
            }}
          />
        </View>

        {/* Time display */}
        <View className="flex-row justify-between mb-2">
          <Text variant="mono" className="text-slate text-[11px]">
            {currentTime.toFixed(1)}s
          </Text>
          <Text variant="mono" className="text-slate text-[11px]">
            {duration.toFixed(1)}s
          </Text>
        </View>

        {/* Control buttons row */}
        <View className="flex-row items-center justify-center gap-5">
          {/* Frame back */}
          <Pressable
            onPress={() => stepFrame('back')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Step back one frame"
            className="h-11 w-11 items-center justify-center"
          >
            <ChevronLeft size={26} color={colors.white} />
          </Pressable>

          {/* Play / Pause */}
          <Pressable
            onPress={togglePlay}
            accessibilityRole="button"
            accessibilityLabel={playing ? 'Pause' : 'Play'}
            className="h-12 w-12 items-center justify-center rounded-full bg-primary"
          >
            {playing ? (
              <Pause size={22} color={colors.white} fill={colors.white} />
            ) : (
              <Play size={22} color={colors.white} fill={colors.white} />
            )}
          </Pressable>

          {/* Frame forward */}
          <Pressable
            onPress={() => stepFrame('forward')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Step forward one frame"
            className="h-11 w-11 items-center justify-center"
          >
            <ChevronRight size={26} color={colors.white} />
          </Pressable>

          {/* Speed selector */}
          <View className="flex-row items-center gap-1 ml-2">
            {SPEEDS.map((s) => (
              <Pressable
                key={s}
                onPress={() => setPlaybackSpeed(s)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={`Speed ${formatSpeed(s)}`}
                accessibilityState={{ selected: speed === s }}
                className="px-2 py-1 rounded-input"
                style={{
                  backgroundColor:
                    speed === s ? colors.primary : 'rgba(255,255,255,0.1)',
                }}
              >
                <Text
                  variant="mono"
                  className="text-[12px]"
                  style={{
                    color: speed === s ? colors.white : colors.placeholder,
                  }}
                >
                  {formatSpeed(s)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Toggle bar */}
        <View className="flex-row items-center justify-between mt-3 pt-2 border-t border-white/10">
          {/* Switch Pro Player */}
          <Pressable
            onPress={() => {
              hapticLight();
              setShowProPicker(true);
            }}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={t('analysis.switchPro')}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-input border border-white/20"
          >
            {currentProPlayer ? (
              <ProAvatar player={currentProPlayer} size={20} />
            ) : null}
            <Text variant="label" className="text-white text-[12px]">
              {t('analysis.switchPro')}
            </Text>
          </Pressable>

          {/* Skeleton overlay toggle */}
          <View className="flex-row items-center gap-2">
            <Text variant="caption" className="text-slate text-[12px]">
              {skeletonOn ? t('analysis.skeletonOn') : t('analysis.skeletonOff')}
            </Text>
            <Toggle
              value={skeletonOn}
              onValueChange={(v) => {
                hapticLight();
                setSkeletonOn(v);
              }}
              accessibilityLabel="Skeleton overlay"
            />
          </View>
        </View>
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* SCROLLABLE BOTTOM SECTION                                            */}
      {/* ------------------------------------------------------------------ */}
      <ScrollView
        className="flex-1 bg-light"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Mistakes header */}
        <View className="px-4 pt-4 pb-2">
          <Text variant="h2" className="text-ink text-[16px]">
            {t('analysis.mistakesHeader')}
          </Text>
        </View>

        {/* Mistake cards */}
        {analysis.mistakes.length === 0 ? (
          <View className="px-4 py-6 items-center">
            <Text variant="body" className="text-center text-slate">
              {t('analysis.noMistakes')}
            </Text>
          </View>
        ) : (
          <View className="px-4">
            {analysis.mistakes.map((mistake, index) =>
              cardsVisible ? (
                <Animated.View
                  key={mistake.id}
                  entering={
                    reduced
                      ? undefined
                      : FadeInRight.delay(index * 80).duration(280)
                  }
                >
                  <MistakeHighlightCard
                    mistake={mistake}
                    severityLabel={t('severity.' + mistake.severity)}
                    howToFixLabel={t('analysis.howToFix')}
                    readMoreLabel={t('common.readMore')}
                    readLessLabel={t('common.readLess')}
                    onPress={() => jumpToTimestamp(mistake.timestampSec)}
                    onHowToFix={() => {
                      hapticLight();
                      setActiveDrillMistake(mistake);
                    }}
                  />
                </Animated.View>
              ) : (
                // Placeholder while score is counting
                <Skeleton
                  key={mistake.id}
                  className="h-24 w-full mb-3 rounded-card"
                />
              ),
            )}
          </View>
        )}

        {/* Checkpoint breakdown */}
        {analysis.checkpoints.length > 0 ? (
          <View className="px-4 pt-2 pb-2">
            <Text variant="h2" className="text-ink text-[16px] mb-3">
              {t('analysis.checkpointsTitle')}
            </Text>
            <View className="bg-white rounded-card p-4 gap-3">
              {analysis.checkpoints.map((cp) => (
                <CheckpointBar
                  key={cp.key}
                  label={t('checkpoint.' + cp.key)}
                  score={cp.score}
                />
              ))}
            </View>
          </View>
        ) : null}

        {/* Sponsor footer */}
        <View className="items-center pt-4 pb-2">
          <SponsorBadge variant="plain" />
        </View>
      </ScrollView>

      {/* ------------------------------------------------------------------ */}
      {/* OVERLAYS & SHEETS                                                    */}
      {/* ------------------------------------------------------------------ */}

      {/* Confetti (first analysis) */}
      <ConfettiOverlay active={showConfetti} />

      {/* Pro player picker */}
      <SelectSheet
        visible={showProPicker}
        onClose={() => setShowProPicker(false)}
        title={t('analysis.switchProTitle')}
        options={proOptions}
        selectedValue={currentProPlayer?.id}
        onSelect={(proId) => {
          const newPro = getProPlayer(proId);
          if (newPro) {
            setCurrentProPlayer(newPro);
            hapticSuccess();
          }
        }}
        heightRatio={0.55}
      />

      {/* S10 Drill sheet */}
      <DrillSheet
        mistake={activeDrillMistake}
        onClose={() => setActiveDrillMistake(null)}
      />

      {/* Share card modal */}
      {showShareCard ? (
        <ShareCardModal
          visible={showShareCard}
          analysis={analysis}
          proPlayer={currentProPlayer}
          onClose={() => setShowShareCard(false)}
        />
      ) : null}
    </View>
  );
}
