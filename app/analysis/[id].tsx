/**
 * S9 — Analysis & Comparison screen + S10 How To Fix drill sheet.
 *
 * Hero screen of the product. Split-screen synchronized video comparison
 * (user vs. pro), animated score reveal, mistake highlight cards, checkpoint
 * breakdown with RadarChart at-a-glance view, and the S10 drill detail bottom
 * sheet — all in one file.
 *
 * Route: /analysis/[id]
 * Params:
 *   id    — the Analysis id to load
 *   first — if "1" this is the user's first ever analysis (SPEC §6.5)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Animated, {
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Repeat2,
  Share2,
  X,
} from "lucide-react-native";
import { captureRef } from "react-native-view-shot";

import type { Analysis, Drill, MistakeCard, ProPlayer } from "@/src/types";
import { api, ApiError } from "@/src/services";
import {
  BottomSheet,
  Button,
  Skeleton,
  Text,
  Toggle,
  cardShadow,
  toast,
} from "@/src/components/ui";
import {
  AppHeader,
  ConfettiOverlay,
  PoseSkeleton,
  ProAvatar,
  ScoreCircle,
  ScreenContainer,
  SponsorBadge,
} from "@/src/components/shared";
import { resolveVideoSource } from "@/src/constants/media";
import { getProPlayer } from "@/src/constants/proPlayers";
import { scoreBand } from "@/src/lib/score";
import { colors } from "@/src/theme";
import { hapticLight, hapticMedium, hapticSuccess } from "@/src/lib/haptics";
import { useReducedMotion } from "@/src/hooks/useReducedMotion";
import { useTranslation } from "@/src/hooks/useTranslation";

/* -------------------------------------------------------------------------- */
/*  Types                                                                       */
/* -------------------------------------------------------------------------- */

type ScreenState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; analysis: Analysis };

type PlaybackSpeed = 0.25 | 0.5 | 1.0;

const SPEEDS: PlaybackSpeed[] = [0.25, 0.5, 1.0];
const FRAME_STEP = 1 / 30; // ~1 frame at 30fps

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function formatSpeed(s: PlaybackSpeed): string {
  if (s === 1.0) return "1×";
  if (s === 0.5) return "0.5×";
  return "0.25×";
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
/*  Sub-component: ClipPlayerSheet                                              */
/* -------------------------------------------------------------------------- */

interface ClipPlayerSheetProps {
  clipUrl: string | null;
  title: string;
  onClose: () => void;
}

function ClipPlayerSheet({ clipUrl, title, onClose }: ClipPlayerSheetProps) {
  const { t } = useTranslation();
  const clipPlayer = useVideoPlayer(
    clipUrl ? { uri: clipUrl } : null,
    (p) => {
      p.loop = true;
      p.muted = true;
      p.playbackRate = 0.5;
    },
  );

  // Auto-play as soon as the clip is ready
  useEffect(() => {
    const sub = clipPlayer.addListener('statusChange', ({ status }: { status: string }) => {
      if (status === 'readyToPlay') {
        clipPlayer.play();
      }
    });
    return () => sub.remove();
  }, [clipPlayer]);

  // Load source when URL changes
  useEffect(() => {
    if (clipUrl) {
      clipPlayer.replace({ uri: clipUrl });
      clipPlayer.loop = true;
    } else {
      clipPlayer.pause();
    }
  }, [clipUrl]);

  return (
    <BottomSheet visible={clipUrl !== null} onClose={onClose} heightRatio={0.6}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text variant="h1" className="flex-1 pr-4 text-[16px] font-semibold text-ink">
          {title}
        </Text>
        <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button">
          <X size={22} color={colors.slate} />
        </Pressable>
      </View>

      {/* Frame / video */}
      <View
        className="w-full rounded-card overflow-hidden bg-black"
        style={{ aspectRatio: 16 / 9 }}
      >
        {clipUrl && /\.(jpg|jpeg|png|webp)$/i.test(clipUrl) ? (
          <Image
            source={{ uri: clipUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        ) : clipUrl ? (
          <VideoView
            player={clipPlayer}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            nativeControls={false}
          />
        ) : null}
      </View>

      <Text variant="caption" className="text-slate text-center text-[12px] mt-2">
        Highlighted joints shown in white. Green = matches pro · Red = deviation detected.
      </Text>

      <View className="mt-4">
        <Button label={t('common.close')} variant="primary" size="lg" onPress={onClose} />
      </View>
    </BottomSheet>
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
          {mistake?.title ?? ""}
        </Text>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
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
          {t("error.loadFailed")}
        </Text>
      ) : drill ? (
        <>
          {/* Drill name */}
          <Text variant="label" className="text-primary mb-4 text-[14px]">
            {t("drill.label", { name: drill.name })}
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
              {t("drill.coachTip")}
            </Text>
            <Text
              variant="body"
              className="text-ink text-[14px] leading-[21px]"
            >
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
              {t("drill.videoComingSoon")}
            </Text>
          </View>
        </>
      ) : null}

      {/* Done button */}
      <View className="mt-4">
        <Button
          label={t("drill.doneCta")}
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

  /** Ref placed on the branded card View for image capture. */
  const cardRef = useRef<View>(null);

  const handleShare = useCallback(async () => {
    // Web: keep text share (view-shot is unreliable on web).
    if (Platform.OS === "web") {
      try {
        await Share.share({
          title: t("common.appName"),
          message: [
            `${t("common.appName")} — ${t("stroke." + analysis.strokeType)}`,
            `${t("analysis.shareScore")}: ${analysis.overallScore}/100`,
            topMistake
              ? `${t("analysis.shareTopMistake")}: ${topMistake.title}`
              : "",
            t("common.sponsor"),
          ]
            .filter(Boolean)
            .join("\n"),
        });
      } catch {
        // User cancelled or share not available.
      }
      return;
    }

    // Native: capture the branded card as a PNG and share it.
    try {
      const uri = await captureRef(cardRef, { format: "png", quality: 1 });
      await Share.share({ url: uri });
    } catch {
      // Fallback: text share if capture or native share fails.
      try {
        await Share.share({
          title: t("common.appName"),
          message: [
            `${t("common.appName")} — ${t("stroke." + analysis.strokeType)}`,
            `${t("analysis.shareScore")}: ${analysis.overallScore}/100`,
            topMistake
              ? `${t("analysis.shareTopMistake")}: ${topMistake.title}`
              : "",
            t("common.sponsor"),
          ]
            .filter(Boolean)
            .join("\n"),
        });
      } catch {
        // User cancelled — silently ignore.
      }
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
          accessibilityLabel={t("common.close")}
        />

        {/* Branded card — captured by captureRef on native */}
        <View
          ref={cardRef}
          collapsable={false}
          className="w-full max-w-[320px] rounded-2xl bg-navy overflow-hidden"
        >
          {/* Header stripe */}
          <View className="bg-deep-navy px-5 pt-5 pb-4">
            <Text className="font-display text-[28px] text-primary">
              {t("common.appName")}
            </Text>
            <Text variant="caption" className="text-on-dark-muted mt-0.5">
              {t("splash.tagline")}
            </Text>
          </View>

          {/* Score + stroke */}
          <View className="px-5 pt-5 pb-2 flex-row items-center gap-4">
            <ScoreCircle score={analysis.overallScore} size={80} />
            <View className="flex-1">
              <Text variant="h2" className="text-white text-[16px]">
                {t("stroke." + analysis.strokeType)}
              </Text>
              <Text
                variant="label"
                className="text-[14px] mt-0.5"
                style={{ color: band.hex }}
              >
                {t(band.labelKey)}
              </Text>
              {proPlayer ? (
                <Text variant="caption" className="text-on-dark-muted mt-1">
                  {t("analysis.comparedWith", { name: proPlayer.name })}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Top mistake */}
          {topMistake ? (
            <View className="mx-5 mb-4 p-3 rounded-card bg-deep-navy">
              <Text variant="caption" className="text-on-dark-muted mb-0.5">
                {t("analysis.shareTopMistake")}
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

          {/* Actions (outside the captured area is ideal but the card wraps them) */}
          <View className="px-5 pb-5 gap-2">
            <Button
              label={t("analysis.shareTitle")}
              variant="primary"
              size="md"
              icon={<Share2 size={16} color={colors.white} />}
              onPress={handleShare}
            />
            <Button
              label={t("common.close")}
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

  const isFirstAnalysis = first === "1";

  /* ---- Screen state ---- */
  const [state, setState] = useState<ScreenState>({ phase: "loading" });

  /* ---- Video playback state ---- */
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(0.5);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [flashRed, setFlashRed] = useState(false);
  const scrubbing = useRef(false);
  const durationRef = useRef(0);

  /* ---- UI overlay state ---- */
  const [skeletonOn, setSkeletonOn] = useState(false);
  const [currentProPlayer, setCurrentProPlayer] = useState<
    ProPlayer | undefined
  >(undefined);
  const [activeDrillMistake, setActiveDrillMistake] =
    useState<MistakeCard | null>(null);
  const [activeClip, setActiveClip] = useState<{ url: string; title: string } | null>(null);
  const [activePhase, setActivePhase] = useState<number | null>(null);
  const phaseLoopRef = useRef<{ start: number; end: number } | null>(null);
  const [showShareCard, setShowShareCard] = useState(false);
  const [showConfetti, setShowConfetti] = useState(isFirstAnalysis);

  /* ---- Cards staged entrance ---- */
  const [cardsVisible, setCardsVisible] = useState(false);

  /* ---- Video players (null source until analysis loads) ---- */
  const compPlayer = useVideoPlayer(null, (p) => {
    p.loop = true;
    p.muted = true;
    p.playbackRate = 0.5;
  });

  /* ---- Load analysis ---- */
  useEffect(() => {
    if (!id) {
      setState({ phase: "error", message: t("error.title") });
      return;
    }
    let cancelled = false;
    api
      .getAnalysis(id)
      .then((analysis) => {
        if (cancelled) return;
        const pro = getProPlayer(analysis.proPlayerId);
        setCurrentProPlayer(pro);
        setState({ phase: "ready", analysis });

        // Load the overlay comparison video.
        compPlayer.replace(resolveVideoSource(analysis.proVideoUrl));

        // Show "Saved to History" toast
        toast(t("analysis.savedToast"), "success");

        // First-analysis celebration
        if (isFirstAnalysis) {
          toast(t("analysis.firstAnalysisToast"), "success");
          hapticSuccess();
          setTimeout(() => setShowConfetti(false), 2500);
        }

        // Stagger card entrance after score count-up (1.2s)
        setTimeout(() => setCardsVisible(true), reduced ? 0 : 1400);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof ApiError ? err.message : t("error.title");
        setState({ phase: "error", message: msg });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ---- Poll currentTime and duration from the player ---- */
  useEffect(() => {
    const iv = setInterval(() => {
      const d = compPlayer.duration;
      if (d && isFinite(d) && d > 0) {
        durationRef.current = d;
        setDuration((prev) => (prev > 0 ? prev : d));
      }
      const loop = phaseLoopRef.current;
      if (loop) {
        const t = compPlayer.currentTime;
        if (isFinite(t) && t >= loop.end) {
          compPlayer.currentTime = loop.start;
          setCurrentTime(loop.start);
        } else if (!scrubbing.current && isFinite(t)) {
          setCurrentTime(t);
        }
      } else if (!scrubbing.current) {
        const t = compPlayer.currentTime;
        if (isFinite(t)) setCurrentTime(t);
      }
    }, 80);
    return () => clearInterval(iv);
  }, [compPlayer]);

  /* ---- Playback controls ---- */
  const togglePlay = useCallback(() => {
    hapticLight();
    if (playing) {
      compPlayer.pause();
      setPlaying(false);
    } else {
      compPlayer.play();
      setPlaying(true);
    }
  }, [playing, compPlayer]);

  const stepFrame = useCallback(
    (direction: "back" | "forward") => {
      hapticLight();
      const delta = direction === "back" ? -FRAME_STEP : FRAME_STEP;
      const next = Math.max(0, Math.min(duration, currentTime + delta));
      compPlayer.currentTime = next;
      setCurrentTime(next);
    },
    [currentTime, duration, compPlayer],
  );

  const setPlaybackSpeed = useCallback(
    (s: PlaybackSpeed) => {
      hapticLight();
      setSpeed(s);
      compPlayer.playbackRate = s;
    },
    [compPlayer],
  );

  const seekTo = useCallback(
    (sec: number) => {
      const clamped = Math.max(0, Math.min(duration, sec));
      compPlayer.currentTime = clamped;
      setCurrentTime(clamped);
    },
    [duration, compPlayer],
  );

  const jumpToTimestamp = useCallback(
    (timestampSec: number) => {
      hapticMedium();
      compPlayer.pause();
      setPlaying(false);
      seekTo(timestampSec);
      setFlashRed(true);
      setTimeout(() => setFlashRed(false), 350);
    },
    [compPlayer, seekTo],
  );

  /* ---- Timeline scrubber PanResponder ---- */
  const scrubberWidth = useRef(0);
  const startX = useRef(0); // Track the initial tap location

  const scrubPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true, // Ensure the responder claims the drag event
      onPanResponderGrant: (e) => {
        scrubbing.current = true;
        startX.current = e.nativeEvent.locationX; // Lock in the initial X position

        const ratio =
          scrubberWidth.current > 0
            ? Math.max(0, Math.min(1, startX.current / scrubberWidth.current))
            : 0;
        const t = ratio * (durationRef.current || 1);
        compPlayer.currentTime = t;
        setCurrentTime(t);
      },
      onPanResponderMove: (e, gestureState) => {
        // Calculate the current position by adding the drag delta (dx) to the start point
        const currentX = startX.current + gestureState.dx;

        const ratio =
          scrubberWidth.current > 0
            ? Math.max(0, Math.min(1, currentX / scrubberWidth.current))
            : 0;
        const t = ratio * (durationRef.current || 1);
        compPlayer.currentTime = t;
        setCurrentTime(t);
      },
      onPanResponderRelease: () => {
        scrubbing.current = false;
      },
      onPanResponderTerminate: () => {
        // Catch interruptions (like a scroll event taking over or an incoming call)
        scrubbing.current = false;
      },
    }),
  ).current;

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

  /* ========== RENDER: loading ========== */
  if (state.phase === "loading") {
    return (
      <View className="flex-1" style={{ paddingTop: insets.top }}>
        <SkeletonLoading />
      </View>
    );
  }

  /* ========== RENDER: error ========== */
  if (state.phase === "error") {
    return (
      <View
        className="flex-1 items-center justify-center bg-navy px-8 gap-4"
        style={{ paddingTop: insets.top }}
      >
        <Text variant="h1" className="text-white text-center">
          {t("error.title")}
        </Text>
        <Text variant="body" className="text-on-dark-muted text-center">
          {state.message}
        </Text>
        <Button
          label={t("common.back")}
          variant="secondary"
          size="md"
          block={false}
          onPress={() => router.replace("/(tabs)/home")}
        />
      </View>
    );
  }

  /* ========== RENDER: ready ========== */
  const { analysis } = state;
  const band = scoreBand(analysis.overallScore);
  const scrubFraction = duration > 0 ? currentTime / duration : 0;

  return (
    <ScreenContainer
      background="navy"
      header={
        <AppHeader
          showBack
          onBack={() => {
            hapticLight();
            router.replace("/(tabs)/home");
          }}
          right={
            <Pressable
              onPress={() => {
                hapticLight();
                setShowShareCard(true);
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t("analysis.shareTitle")}
              className="h-11 w-11 items-center justify-center"
            >
              <Share2 size={22} color={colors.white} />
            </Pressable>
          }
        />
      }
    >
      {/* ------------------------------------------------------------------ */}
      {/* COMPARISON VIDEO (overlay: user + pro skeleton on top)              */}
      {/* ------------------------------------------------------------------ */}
      <View
        style={{ height: videoHeight, width: screenWidth }}
        className="relative overflow-hidden bg-black"
      >
        <VideoView
          player={compPlayer}
          style={{ width: screenWidth, height: videoHeight }}
          contentFit="contain"
          nativeControls={false}
          accessibilityLabel="Swing comparison video"
        />

        {/* Skeleton overlay toggle */}
        {skeletonOn ? (
          <View
            style={StyleSheet.absoluteFillObject}
            className="items-center justify-center"
            pointerEvents="none"
          >
            <PoseSkeleton
              size={Math.min(screenWidth, videoHeight) * 0.85}
              color="rgba(255,255,255,0.55)"
              jointColor={colors.mint}
            />
          </View>
        ) : null}

        {/* Flash red overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            flashStyle,
            { backgroundColor: colors.scoreRed },
          ]}
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

        {/* Pro label */}
        {currentProPlayer ? (
          <View
            className="absolute bottom-0 left-0 right-0 px-3 py-1.5"
            style={{ backgroundColor: "rgba(10,22,40,0.65)" }}
          >
            <Text variant="caption" className="text-white text-[11px]">
              {t("analysis.youLabel")} vs {currentProPlayer.name}
            </Text>
          </View>
        ) : null}
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
              shadowColor: "#000",
              shadowOpacity: 0.25,
              shadowRadius: 3,
              elevation: 3,
            }}
          />
        </View>

        {/* Time display */}
        <View className="flex-row justify-between mb-2">
          <Text variant="mono" className="text-on-dark-muted text-[11px]">
            {currentTime.toFixed(1)}s
          </Text>
          <Text variant="mono" className="text-on-dark-muted text-[11px]">
            {duration.toFixed(1)}s
          </Text>
        </View>

        {/* Control buttons row */}
        <View className="flex-row items-center justify-center gap-5">
          {/* Frame back */}
          <Pressable
            onPress={() => stepFrame("back")}
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
            accessibilityLabel={playing ? "Pause" : "Play"}
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
            onPress={() => stepFrame("forward")}
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
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Speed ${formatSpeed(s)}`}
                accessibilityState={{ selected: speed === s }}
                className="px-2 py-1 rounded-input"
                style={{
                  backgroundColor:
                    speed === s ? colors.primary : "rgba(255,255,255,0.1)",
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

        {/* Skeleton overlay toggle */}
        <View className="flex-row items-center justify-end mt-3 pt-2 border-t border-white/10 gap-2">
          <Text variant="caption" className="text-on-dark-muted text-[12px]">
            {skeletonOn ? t("analysis.skeletonOn") : t("analysis.skeletonOff")}
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

      {/* ------------------------------------------------------------------ */}
      {/* SCROLLABLE BOTTOM SECTION                                            */}
      {/* ------------------------------------------------------------------ */}
      <ScrollView
        className="flex-1 bg-light"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Phase-grouped feedback */}
        <View className="px-4 pt-4 pb-2">
          <Text variant="h2" className="text-ink text-[16px] mb-3">
            {t("analysis.mistakesHeader")}
          </Text>

          {!cardsVisible ? (
            [0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full mb-3 rounded-card" />
            ))
          ) : analysis.phases && analysis.phases.length > 0 ? (
            // New 4-phase layout
            analysis.phases.map((phase) => {
              const phaseScoreColor =
                phase.score >= 70
                  ? colors.scoreGreen
                  : phase.score >= 40
                    ? colors.scoreAmber
                    : colors.scoreRed;
              const phaseScoreBg =
                phase.score >= 70
                  ? "rgba(34,197,94,0.12)"
                  : phase.score >= 40
                    ? "rgba(245,158,11,0.12)"
                    : "rgba(239,68,68,0.12)";
              return (
                <View key={phase.number} className="mb-5">
                  {/* Phase header */}
                  <View className="flex-row items-center mb-2">
                    <View
                      className="items-center justify-center rounded-full mr-2"
                      style={{
                        width: 22,
                        height: 22,
                        backgroundColor: colors.primary,
                      }}
                    >
                      <Text
                        variant="caption"
                        className="text-white font-bold"
                        style={{ fontSize: 10 }}
                      >
                        {phase.number}
                      </Text>
                    </View>
                    <Text
                      variant="label"
                      className="text-ink text-[14px] flex-1"
                    >
                      {phase.name}
                    </Text>
                    <View
                      className="px-2 py-0.5 rounded-full mr-2"
                      style={{ backgroundColor: phaseScoreBg }}
                    >
                      <Text
                        variant="mono"
                        className="text-[11px] font-bold"
                        style={{ color: phaseScoreColor }}
                      >
                        {phase.score}%
                      </Text>
                    </View>
                    {/* Phase loop toggle */}
                    {phase.startSec != null && phase.endSec != null ? (
                      <Pressable
                        onPress={() => {
                          hapticLight();
                          if (activePhase === phase.number) {
                            // Toggle off — free play
                            phaseLoopRef.current = null;
                            setActivePhase(null);
                          } else {
                            // Toggle on — loop this phase
                            phaseLoopRef.current = { start: phase.startSec, end: phase.endSec };
                            setActivePhase(phase.number);
                            compPlayer.currentTime = phase.startSec;
                            compPlayer.play();
                            setPlaying(true);
                          }
                        }}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`Loop phase ${phase.number}`}
                        className="h-7 w-7 items-center justify-center rounded-full"
                        style={{
                          backgroundColor:
                            activePhase === phase.number
                              ? colors.primary
                              : "rgba(255,255,255,0.08)",
                        }}
                      >
                        <Repeat2
                          size={13}
                          color={activePhase === phase.number ? colors.white : colors.slate}
                        />
                      </Pressable>
                    ) : null}
                  </View>

                  {/* Phase items */}
                  {phase.items.map((item, idx) => {
                    if (item.type === "good") {
                      return (
                        <View
                          key={idx}
                          className="flex-row items-start px-3 py-2.5 rounded-lg mb-2"
                          style={{
                            backgroundColor: "rgba(34,197,94,0.10)",
                            borderLeftWidth: 4,
                            borderLeftColor: colors.scoreGreen,
                          }}
                        >
                          <Check
                            size={14}
                            color={colors.scoreGreen}
                            style={{ marginTop: 2 }}
                          />
                          <Text
                            variant="body"
                            className="ml-2 text-[13px] flex-1 leading-[19px]"
                            style={{ color: "#166534" }}
                          >
                            {item.text}
                          </Text>
                          {item.clipUrl ? (
                            <Pressable
                              onPress={() => {
                                hapticLight();
                                setActiveClip({
                                  url: item.clipUrl!,
                                  title: item.text.slice(0, 60),
                                });
                              }}
                              hitSlop={8}
                              className="ml-2 px-2 py-1 rounded-input bg-mint/10"
                            >
                              <Text
                                variant="caption"
                                className="text-mint text-[11px] font-semibold"
                              >
                                View
                              </Text>
                            </Pressable>
                          ) : null}
                        </View>
                      );
                    }

                    if (item.type === "warning") {
                      return (
                        <View
                          key={idx}
                          className="flex-row items-start px-3 py-2.5 rounded-lg mb-2"
                          style={{
                            backgroundColor: "rgba(245,158,11,0.10)",
                            borderLeftWidth: 4,
                            borderLeftColor: colors.scoreAmber,
                          }}
                        >
                          <Text style={{ fontSize: 13, marginTop: 1 }}>⚠️</Text>
                          <Text
                            variant="body"
                            className="ml-2 text-[13px] flex-1 leading-[19px]"
                            style={{ color: "#92400e" }}
                          >
                            {item.text}
                          </Text>
                        </View>
                      );
                    }

                    // "bad" item
                    const borderColor =
                      item.severity === "Critical"
                        ? colors.scoreRed
                        : item.severity === "Major"
                          ? colors.scoreAmber
                          : colors.border;
                    const bgColor =
                      item.severity === "Critical"
                        ? "rgba(239,68,68,0.08)"
                        : item.severity === "Major"
                          ? "rgba(245,158,11,0.08)"
                          : "rgba(203,213,225,0.20)";

                    const mistakeFromItem: MistakeCard = {
                      id: item.drillId ?? `phase-${phase.number}-${idx}`,
                      title: item.text.split(" — ")[0].slice(0, 60),
                      description: item.text,
                      severity: item.severity ?? "Major",
                      phase: phase.name,
                      timestampSec: item.timestampSec ?? 0,
                      drillId: item.drillId ?? "",
                    };

                    return (
                      <Pressable
                        key={idx}
                        onPress={() => jumpToTimestamp(item.timestampSec ?? 0)}
                        className="flex-row items-start px-3 py-2.5 rounded-lg mb-2"
                        style={{
                          backgroundColor: bgColor,
                          borderLeftWidth: 4,
                          borderLeftColor: borderColor,
                        }}
                      >
                        <Text
                          variant="body"
                          className="flex-1 text-ink text-[13px] leading-[19px]"
                        >
                          {item.text}
                        </Text>
                        <View className="flex-col gap-1 ml-2 mt-0.5">
                          {item.clipUrl ? (
                            <Pressable
                              onPress={() => {
                                hapticLight();
                                setActiveClip({
                                  url: item.clipUrl!,
                                  title: mistakeFromItem.title,
                                });
                              }}
                              hitSlop={8}
                              className="px-2 py-1 rounded-input bg-mint/10"
                            >
                              <Text
                                variant="caption"
                                className="text-mint text-[11px] font-semibold"
                              >
                                View
                              </Text>
                            </Pressable>
                          ) : null}
                          {item.drillId ? (
                            <Pressable
                              onPress={() => {
                                hapticLight();
                                setActiveDrillMistake(mistakeFromItem);
                              }}
                              hitSlop={8}
                              className="px-2 py-1 rounded-input bg-primary/10"
                            >
                              <Text
                                variant="caption"
                                className="text-primary text-[11px] font-semibold"
                              >
                                {t("analysis.howToFix")}
                              </Text>
                            </Pressable>
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              );
            })
          ) : // Fallback: old mistake-based layout (mock API)
          analysis.mistakes.length === 0 ? (
            <View
              className="flex-row items-center px-3 py-3 rounded-lg"
              style={{
                backgroundColor: "rgba(34,197,94,0.10)",
                borderLeftWidth: 4,
                borderLeftColor: colors.scoreGreen,
              }}
            >
              <Check size={16} color={colors.scoreGreen} />
              <Text
                variant="body"
                className="ml-2 text-[13px]"
                style={{ color: colors.scoreGreen }}
              >
                No issues detected
              </Text>
            </View>
          ) : (
            analysis.mistakes.map((mistake) => {
              const borderColor =
                mistake.severity === "Critical"
                  ? colors.scoreRed
                  : mistake.severity === "Major"
                    ? colors.scoreAmber
                    : colors.border;
              const bgColor =
                mistake.severity === "Critical"
                  ? "rgba(239,68,68,0.08)"
                  : mistake.severity === "Major"
                    ? "rgba(245,158,11,0.08)"
                    : "rgba(203,213,225,0.20)";
              return (
                <Pressable
                  key={mistake.id}
                  onPress={() => jumpToTimestamp(mistake.timestampSec)}
                  className="flex-row items-start px-3 py-2.5 rounded-lg mb-2"
                  style={{
                    backgroundColor: bgColor,
                    borderLeftWidth: 4,
                    borderLeftColor: borderColor,
                  }}
                >
                  <View className="flex-1">
                    <Text
                      variant="label"
                      className="text-ink text-[13px] mb-0.5"
                    >
                      {mistake.title}
                    </Text>
                    <Text variant="caption" className="text-slate text-[12px]">
                      {mistake.description}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      hapticLight();
                      setActiveDrillMistake(mistake);
                    }}
                    hitSlop={8}
                    className="ml-2 mt-0.5 px-2 py-1 rounded-input bg-primary/10"
                  >
                    <Text
                      variant="caption"
                      className="text-primary text-[11px] font-semibold"
                    >
                      {t("analysis.howToFix")}
                    </Text>
                  </Pressable>
                </Pressable>
              );
            })
          )}
        </View>

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

      {/* Joint clip player */}
      <ClipPlayerSheet
        clipUrl={activeClip?.url ?? null}
        title={activeClip?.title ?? ''}
        onClose={() => setActiveClip(null)}
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
    </ScreenContainer>
  );
}
