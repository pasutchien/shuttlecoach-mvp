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
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { Camera, Check, ChevronRight, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PanResponder,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProAvatar, StepIndicator, StrokeIcon } from "@/src/components/shared";
import { BottomSheet, Button, Text } from "@/src/components/ui";
import { useTranslation } from "@/src/hooks/useTranslation";
import { hapticLight, hapticMedium, hapticSelection } from "@/src/lib/haptics";
import { colors } from "@/src/theme";

import { SAMPLE_USER_CLIP } from "@/src/constants/media";
import { ANALYSIS_COST } from "@/src/constants/packages";
import { matchProPlayer } from "@/src/constants/proPlayers";
import { api, ApiError } from "@/src/services";
import { useCreditStore } from "@/src/store/credits";
import {
  TRIM_MAX_SEC,
  TRIM_MIN_SEC,
  trimDuration,
  useUploadStore,
} from "@/src/store/upload";
import { useUserStore } from "@/src/store/user";
import { type AnalysisRequest, type StrokeType } from "@/src/types";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type Step = 0 | 1 | 2;

/* -------------------------------------------------------------------------- */
/*  Step 0 — Trim                                                             */
/* -------------------------------------------------------------------------- */

interface TrimStepProps {
  onContinue: () => void;
}

function TrimStep({ onContinue }: TrimStepProps) {
  const { t } = useTranslation();

  // ── Store ──────────────────────────────────────────────────────────────────
  const clipRef = useUploadStore((s) => s.clipRef);
  const clipDurationSec = useUploadStore((s) => s.clipDurationSec);
  const trimStartSec = useUploadStore((s) => s.trimStartSec);
  const trimEndSec = useUploadStore((s) => s.trimEndSec);
  const setTrim = useUploadStore((s) => s.setTrim);
  const setClip = useUploadStore((s) => s.setClip);
  const setClipDuration = useUploadStore((s) => s.setClipDuration);

  const duration = trimDuration({ trimStartSec, trimEndSec });
  const isValid = duration >= TRIM_MIN_SEC && duration <= TRIM_MAX_SEC;
  const hasRealVideo = clipRef !== "sample://user";

  // ── Pick video ─────────────────────────────────────────────────────────────
  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      // asset.duration is unreliable for .mov and web — use 60s as a safe
      // placeholder. The real duration is read from the player once it loads.
      const durationSec =
        asset.duration && asset.duration > 0 ? asset.duration / 1000 : 60;
      setClip(asset.uri, durationSec);
    }
  };

  // ── Video player (loops the whole clip) ───────────────────────────────────
  const player = useVideoPlayer(
    hasRealVideo ? { uri: clipRef } : SAMPLE_USER_CLIP,
    (p) => {
      p.muted = true;
      p.loop = true;
      p.play();
    },
  );
  useEffect(() => {
    player.replace(
      clipRef === "sample://user" ? SAMPLE_USER_CLIP : { uri: clipRef },
    );
  }, [clipRef]);

  // Once the player has loaded the video, read its actual duration and
  // correct the store. This handles .mov and other formats where
  // asset.duration from ImagePicker is unreliable or wrong.
  useEffect(() => {
    if (!hasRealVideo) return;
    const sub = player.addListener("statusChange", ({ status }) => {
      if (status === "readyToPlay" && player.duration > 0) {
        setClipDuration(player.duration);
      }
    });
    return () => sub.remove();
  }, [clipRef]);

  // ── Scrubber ───────────────────────────────────────────────────────────────
  // Track width is measured via onLayout so the math always uses the real
  // rendered width regardless of screen size or padding.
  const [trackWidth, setTrackWidth] = useState(0);

  // Single ref holding all mutable drag state.
  const drag = useRef({
    tw: 0, // track pixel width
    dur: clipDurationSec,
    startSec: trimStartSec,
    endSec: trimEndSec,
    active: null as "start" | "end" | null,
    valAt0: 0, // trim value at gesture start
  });

  // Inline sync — runs during render so the ref is always current
  drag.current.dur = clipDurationSec;
  drag.current.startSec = trimStartSec;
  drag.current.endSec = trimEndSec;

  const r1 = (v: number) => Math.round(v * 10) / 10;

  const makeScrubberPan = useCallback(
    (handle: "start" | "end") =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // Prevent ScrollView from capturing the swipe
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          hapticSelection();
          drag.current.active = handle;
          drag.current.valAt0 =
            handle === "start" ? drag.current.startSec : drag.current.endSec;
          player.pause(); // Pause to show the exact frame the user is scrubbing to
        },
        onPanResponderMove: (_e, g) => {
          const { tw, dur, startSec, endSec, active, valAt0 } = drag.current;
          if (!active || tw <= 0 || dur <= 0) return;

          // Use PanResponder's delta `g.dx` rather than pageX for more reliable math
          const rawSec = Math.max(0, Math.min(dur, valAt0 + (g.dx / tw) * dur));

          if (active === "start") {
            const sec = r1(Math.min(rawSec, endSec - TRIM_MIN_SEC));
            drag.current.startSec = sec;
            setTrim(sec, drag.current.endSec);
            player.currentTime = sec; // Scrub frame visualization
          } else {
            const sec = r1(
              Math.min(
                Math.max(rawSec, startSec + TRIM_MIN_SEC),
                Math.min(dur, startSec + TRIM_MAX_SEC),
              ),
            );
            drag.current.endSec = sec;
            setTrim(drag.current.startSec, sec);
            player.currentTime = sec; // Scrub frame visualization
          }
        },
        onPanResponderRelease: () => {
          drag.current.active = null;
          // Intentionally omitting player.play() to keep video paused on the final frame
        },
        onPanResponderTerminate: () => {
          drag.current.active = null;
          // Intentionally omitting player.play() to keep video paused on the final frame
        },
      }),
    [player, setTrim],
  );

  const panResponders = useMemo(
    () => ({
      start: makeScrubberPan("start"),
      end: makeScrubberPan("end"),
    }),
    [makeScrubberPan],
  );

  // Pixel positions for rendering — derived fresh from store on every render.
  const startPx =
    clipDurationSec > 0 ? (trimStartSec / clipDurationSec) * trackWidth : 0;
  const endPx =
    clipDurationSec > 0 ? (trimEndSec / clipDurationSec) * trackWidth : 0;

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Video preview */}
      <View className="w-full bg-navy" style={{ aspectRatio: 16 / 9 }}>
        <VideoView
          player={player}
          style={{ flex: 1 }}
          contentFit="cover"
          nativeControls={false}
          accessibilityLabel="Clip preview"
        />
        <View className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5">
          <Text variant="mono" className="text-[11px] text-white">
            {trimStartSec.toFixed(1)}s – {trimEndSec.toFixed(1)}s
          </Text>
        </View>
      </View>

      <View className="px-5 pt-4 gap-4">
        {/* Pick / change video */}
        <Button
          label={hasRealVideo ? t("upload.changeVideo") : t("upload.pickVideo")}
          variant={hasRealVideo ? "secondary" : "primary"}
          size="md"
          icon={
            <Camera
              size={16}
              color={hasRealVideo ? colors.primary : colors.white}
            />
          }
          onPress={() => {
            hapticLight();
            void pickVideo();
          }}
        />

        {/* Camera-angle guide */}
        <Pressable
          onPress={() => router.push("/recording-tips")}
          accessibilityRole="button"
          accessibilityLabel={t("upload.cameraGuide")}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          className="flex-row items-center gap-3 rounded-card border border-tip-border bg-tip-bg p-3"
        >
          <View className="h-9 w-9 items-center justify-center rounded-full bg-white">
            <Camera size={18} color={colors.primary} />
          </View>
          <Text variant="body" className="flex-1 text-ink">
            {t("upload.cameraGuide")}
          </Text>
          <ChevronRight size={16} color={colors.slate} />
        </Pressable>

        {/* Instruction */}
        <Text variant="body" className="text-slate text-center">
          {t("upload.trimInstruction")}
        </Text>

        {/* Duration counter */}
        <Text variant="label" className="text-ink text-center">
          {t("upload.trimSelected", { seconds: duration.toFixed(1) })}
        </Text>

        {/* Dual-handle scrubber */}
        <View
          className="h-11 justify-center"
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            setTrackWidth(w);
            drag.current.tw = w;
          }}
        >
          {trackWidth > 0 && (
            <>
              {/* Track background */}
              <View className="absolute h-2 w-full rounded-full bg-border" />

              {/* Selected region */}
              <View
                className="absolute h-2 rounded-full bg-primary/30"
                style={{ left: startPx, width: Math.max(0, endPx - startPx) }}
              />

              {/* Start handle */}
              <View
                {...panResponders.start.panHandlers}
                style={{ position: "absolute", left: startPx - 22 }}
                className="h-11 w-11 items-center justify-center"
              >
                <View className="h-5 w-5 rounded-full bg-primary shadow-md" />
              </View>

              {/* End handle */}
              <View
                {...panResponders.end.panHandlers}
                style={{ position: "absolute", left: endPx - 22 }}
                className="h-11 w-11 items-center justify-center"
              >
                <View className="h-5 w-5 rounded-full bg-primary shadow-md" />
              </View>
            </>
          )}
        </View>

        {/* Validation warning */}
        {!isValid && (
          <Text variant="caption" className="text-score-red text-center">
            {t("upload.trimWarning")}
          </Text>
        )}

        {/* Continue */}
        <Button
          label={t("common.continue")}
          variant="primary"
          size="lg"
          disabled={!isValid || !hasRealVideo}
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
/*  Step 1 — Stroke Type                                                      */
/* -------------------------------------------------------------------------- */

interface StrokeStepProps {
  onContinue: () => void;
}

// Backend currently only supports Smash analysis.
const SUPPORTED_STROKES: StrokeType[] = ["Smash"];

function StrokeStep({ onContinue }: StrokeStepProps) {
  const { t } = useTranslation();
  const strokeType = useUploadStore((s) => s.strokeType);
  const setStroke = useUploadStore((s) => s.setStroke);

  // Auto-select Smash since it is the only supported stroke.
  useEffect(() => {
    if (strokeType === null) setStroke("Smash");
  }, []);

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingBottom: 24,
        gap: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Instruction */}
      <Text variant="body" className="text-slate text-center pt-2">
        {t("upload.strokeInstruction")}
      </Text>

      {/* 2-column grid */}
      <View className="flex-row flex-wrap gap-3">
        {SUPPORTED_STROKES.map((s) => {
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
              style={{ width: "47%" }}
              className={[
                "rounded-card p-4 items-center gap-2 border-2",
                selected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-white",
              ].join(" ")}
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
                className={selected ? "text-primary" : "text-ink"}
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
        label={t("common.continue")}
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
/*  Step 2 — Court Calibration                                                */
/* -------------------------------------------------------------------------- */

interface CourtStepProps {
  onContinue: () => void;
}

type PinKey = "tl" | "tr" | "bl" | "br";
const PIN_KEYS: PinKey[] = ["tl", "tr", "bl", "br"];
const PIN_LABELS: Record<PinKey, string> = {
  tl: "TL",
  tr: "TR",
  bl: "BL",
  br: "BR",
};

function CourtStep({ onContinue }: CourtStepProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  const clipRef = useUploadStore((s) => s.clipRef);
  const courtCorners = useUploadStore((s) => s.courtCorners);
  const courtTouched = useUploadStore((s) => s.courtTouched);
  const setCorners = useUploadStore((s) => s.setCorners);
  const markCourtTouched = useUploadStore((s) => s.markCourtTouched);

  // The calibration frame is displayed at a 16:9 aspect ratio.
  const frameHeight = width * (9 / 16);

  const trimStartSec = useUploadStore((s) => s.trimStartSec);

  // Video player — paused at trimStartSec so pins are placed on the exact frame
  // the pipeline will process.
  const player = useVideoPlayer(
    clipRef === "sample://user" ? SAMPLE_USER_CLIP : { uri: clipRef },
    (p) => {
      p.loop = false;
      p.muted = true;
      // Don't seek/pause here — the video isn't loaded yet and will show black.
    },
  );

  // Use a ref so the statusChange listener always reads the latest trimStartSec
  // without needing to be recreated every time it changes.
  const trimStartRef = useRef(trimStartSec);
  trimStartRef.current = trimStartSec;

  // Seek to trimStartSec and freeze once the video is actually ready.
  // Seeking before statusChange='readyToPlay' produces a black frame on web.
  useEffect(() => {
    const sub = player.addListener("statusChange", ({ status }) => {
      if (status === "readyToPlay") {
        player.currentTime = trimStartRef.current;
        player.pause();
      }
    });
    return () => sub.remove();
  }, [player]);

  // Replace source when the clip changes (rare, but keeps state consistent).
  useEffect(() => {
    player.replace(
      clipRef === "sample://user" ? SAMPLE_USER_CLIP : { uri: clipRef },
    );
  }, [clipRef]);

  // Keep live refs to avoid stale closures inside PanResponder callbacks.
  const cornersRef = useRef(courtCorners);
  const touchedRef = useRef(courtTouched);
  useEffect(() => {
    cornersRef.current = courtCorners;
  }, [courtCorners]);
  useEffect(() => {
    touchedRef.current = courtTouched;
  }, [courtTouched]);
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
  const panResponders = useRef<
    Record<PinKey, ReturnType<typeof PanResponder.create>>
  >({
    tl: makePinPan("tl"),
    tr: makePinPan("tr"),
    bl: makePinPan("bl"),
    br: makePinPan("br"),
  });

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
                position: "absolute",
                left: corner.x * width - 22,
                top: corner.y * frameHeight - 22,
              }}
              className="h-11 w-11 items-center justify-center"
              accessibilityLabel={`Court corner ${PIN_LABELS[key]}`}
            >
              <View className="h-7 w-7 rounded-full bg-orange border-2 border-white shadow items-center justify-center">
                <Text
                  variant="caption"
                  className="text-white text-[9px] font-bold"
                >
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
                {t("upload.courtGuideHint")}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View className="px-5 pt-4 gap-4">
        {/* Instruction */}
        <Text variant="body" className="text-slate text-center">
          {t("upload.courtInstruction")}
        </Text>

        {/* Continue — always enabled */}
        <Button
          label={t("common.continue")}
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
/*  S7 Payment Bottom Sheet                                                   */
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
      if (err instanceof ApiError && err.code === "INSUFFICIENT_CREDITS") {
        setApiError(t("upload.insufficient", { balance, shortfall }));
      } else {
        setApiError(t("error.UNKNOWN"));
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
    // Keep sheet open (visible stays true in parent) and navigate to wallet.
    // `topup=1` tells Wallet to show a back chevron so the user can return
    // here after purchasing (SPEC §6.4).
    router.push("/(tabs)/wallet?topup=1");
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
      <Text
        variant="h1"
        className="text-[18px] text-ink font-semibold mb-4 mt-1"
      >
        {t("upload.confirmTitle")}
      </Text>

      {/* Summary rows */}
      <View className="gap-3 mb-4">
        {/* Duration */}
        <View className="flex-row justify-between items-center">
          <Text variant="body" className="text-slate">
            {t("upload.summaryDuration")}
          </Text>
          <Text variant="label" className="text-ink">
            {duration.toFixed(1)}s
          </Text>
        </View>

        {/* Stroke */}
        <View className="flex-row justify-between items-center">
          <Text variant="body" className="text-slate">
            {t("upload.summaryStroke")}
          </Text>
          <Text variant="label" className="text-ink">
            {t(`stroke.${strokeType}`)}
          </Text>
        </View>

        {/* Pro Player */}
        {matchedPro !== null && (
          <View className="flex-row justify-between items-center">
            <Text variant="body" className="text-slate">
              {t("upload.summaryPro")}
            </Text>
            <ProAvatar player={matchedPro} size={28} showName />
          </View>
        )}

        {/* Cost */}
        <View className="flex-row justify-between items-center">
          <Text variant="body" className="text-slate">
            {t("upload.summaryCost")}
          </Text>
          <Text variant="mono" className="text-orange font-medium">
            {`-${ANALYSIS_COST} ${t("common.creditsLabel")}`}
          </Text>
        </View>

        {/* Divider */}
        <View className="h-px bg-border" />

        {/* Balance after */}
        <View className="flex-row justify-between items-center">
          <Text variant="body" className="text-slate">
            {t("upload.balanceAfter", { balance: balanceAfter })}
          </Text>
          <Text
            variant="mono"
            className={
              hasSufficientCredits ? "text-score-green" : "text-score-red"
            }
          >
            {`${balanceAfter} ${t("common.creditsLabel")}`}
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
            {t("upload.insufficient", { balance, shortfall })}
          </Text>
        </View>
      )}

      {/* CTA */}
      {hasSufficientCredits ? (
        <Button
          label={t("upload.confirmCta")}
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
          label={t("upload.topUpCta")}
          variant="orange"
          size="lg"
          onPress={handleTopUp}
        />
      )}

      {/* Cancel link */}
      <Button
        label={t("upload.cancelLink")}
        variant="text"
        size="md"
        onPress={onClose}
        className="mt-1"
      />
    </BottomSheet>
  );
}

/* -------------------------------------------------------------------------- */
/*  Root screen                                                               */
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
    t("upload.stepTrim"),
    t("upload.stepStroke"),
    t("upload.stepCourt"),
    t("upload.stepConfirm"),
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

  /** In-flow step back (S4–S6). The close (X) still exits the whole modal. */
  const handleStepBack = useCallback(() => {
    hapticLight();
    setStep((s) => Math.max(0, s - 1) as Step);
  }, []);

  const handlePaymentClose = useCallback(() => {
    setPaymentVisible(false);
    // Return to step 2 (court)
    setStep(2);
  }, []);

  const handlePaymentSuccess = useCallback(
    (jobId: string, isFirst: boolean, strokeType: string) => {
      useUploadStore.getState().reset();
      router.replace({
        pathname: "/processing",
        params: { jobId, first: isFirst ? "1" : "0", stroke: strokeType },
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
          accessibilityLabel={t("common.close")}
          className="h-11 w-11 items-center justify-center rounded-full bg-border/40"
          hitSlop={8}
        >
          <X size={20} color={colors.slate} />
        </Pressable>
      </View>

      {/* Step title — with an in-flow Back text button on steps 2 & 3.
          The slot keeps a fixed height so the title never shifts. */}
      <View className="px-5 pb-3">
        <View className="h-6 justify-center">
          {step > 0 ? (
            <Pressable
              onPress={handleStepBack}
              accessibilityRole="button"
              accessibilityLabel={t("common.back")}
              hitSlop={8}
              className="self-start"
            >
              <Text variant="label" className="text-primary text-[14px]">
                {t("common.back")}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <Text variant="h1" className="text-[20px] text-ink mt-1">
          {step === 0
            ? t("upload.trimTitle")
            : step === 1
              ? t("upload.strokeTitle")
              : t("upload.courtTitle")}
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
