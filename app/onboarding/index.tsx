/**
 * S2 — Onboarding: Profile Setup (SPEC §4 S2).
 *
 * Single screen with internal step state (0–3). A linear progress bar sits at
 * the top; each step collects a slice of the user's profile. On completion the
 * profile is written to the backend (which also gifts 100 free Credits) and the
 * user is forwarded to the Home tab.
 */
import { useState, useCallback } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  Chip,
  Input,
  NumberStepper,
  SegmentedControl,
  Slider,
  Text,
  toast,
} from '@/src/components/ui';
import { ProAvatar, SelectSheet } from '@/src/components/shared';
import type { SelectOption } from '@/src/components/shared';

import { useTranslation } from '@/src/hooks/useTranslation';
import { useUserStore } from '@/src/store';
import { PRO_PLAYERS } from '@/src/constants/proPlayers';
import {
  EXPERIENCE_LEVELS,
  GOALS,
  type ExperienceLevel,
  type Goal,
  type PlayStyle,
  type ProPlayer,
} from '@/src/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;

const PLAY_STYLE_OPTIONS: { label: string; value: PlayStyle }[] = [
  { label: 'Singles', value: 'Singles' },
  { label: 'Doubles', value: 'Doubles' },
  { label: 'Both', value: 'Both' },
];

// ─── Step-validation helpers ──────────────────────────────────────────────────

/** Returns true when the required fields for a given step are filled. */
function isStepValid(
  step: number,
  fullName: string,
  heightCm: number,
): boolean {
  if (step === 0) return fullName.trim().length > 0;
  if (step === 1) return heightCm >= 120 && heightCm <= 220;
  // Steps 2 and 3 have no strictly required fields.
  return true;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);

  // ── Navigation state ──────────────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // ── Step 1: Identity ──────────────────────────────────────────────────────
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');

  // ── Step 2: Physical stats ────────────────────────────────────────────────
  const [heightCm, setHeightCm] = useState(170);
  const [weightEnabled, setWeightEnabled] = useState(false);
  const [weightKg, setWeightKg] = useState(65);

  // ── Step 3: Style ─────────────────────────────────────────────────────────
  const [favoriteProId, setFavoriteProId] = useState<string | undefined>();
  const [proSheetVisible, setProSheetVisible] = useState(false);
  const [playStyle, setPlayStyle] = useState<PlayStyle>('Singles');

  // ── Step 4: Level & goals ─────────────────────────────────────────────────
  const [experienceIndex, setExperienceIndex] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<Set<Goal>>(new Set());

  // ── Derived values ────────────────────────────────────────────────────────
  // The slider is bounded to [0, EXPERIENCE_LEVELS.length-1], so this access
  // is always defined; fall back to 'Intermediate' to satisfy the type.
  const experienceLevel: ExperienceLevel =
    EXPERIENCE_LEVELS[experienceIndex] ?? 'Intermediate';
  const selectedPro: ProPlayer | undefined = PRO_PLAYERS.find(
    (p) => p.id === favoriteProId,
  );

  const canContinue = isStepValid(step, fullName, heightCm);
  const isFinalStep = step === TOTAL_STEPS - 1;

  // ── PRO player sheet options ──────────────────────────────────────────────
  const proOptions: SelectOption[] = PRO_PLAYERS.map((p) => ({
    value: p.id,
    label: p.name,
    subtitle: `${p.nationality} · ${p.heightCm} cm`,
  }));

  const renderProOption = useCallback(
    (opt: SelectOption, _selected: boolean) => {
      const player = PRO_PLAYERS.find((p) => p.id === opt.value);
      if (!player) return null;
      return (
        <ProAvatar player={player} showName showNationality size={36} />
      );
    },
    [],
  );

  // ── Goal toggle ───────────────────────────────────────────────────────────
  const toggleGoal = useCallback((goal: Goal) => {
    setSelectedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(goal)) {
        next.delete(goal);
      } else {
        next.add(goal);
      }
      return next;
    });
  }, []);

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  const handleContinue = useCallback(async () => {
    if (!canContinue) return;

    if (!isFinalStep) {
      setStep((s) => s + 1);
      return;
    }

    // Final step: submit the profile.
    setSubmitting(true);
    try {
      await completeOnboarding({
        fullName: fullName.trim(),
        displayName: displayName.trim() || fullName.trim(),
        heightCm,
        ...(weightEnabled ? { weightKg } : {}),
        ...(favoriteProId ? { favoriteProId } : {}),
        playStyle,
        experienceLevel,
        goals: Array.from(selectedGoals),
      });
      toast(t('onboarding.giftToast'), 'success');
      router.replace('/(tabs)/home');
    } finally {
      setSubmitting(false);
    }
  }, [
    canContinue,
    isFinalStep,
    completeOnboarding,
    fullName,
    displayName,
    heightCm,
    weightEnabled,
    weightKg,
    favoriteProId,
    playStyle,
    experienceLevel,
    selectedGoals,
    t,
  ]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-light" style={{ paddingTop: insets.top }}>
      {/* ── Top bar: back button + progress bar ────────────────────────── */}
      <View className="px-5 pt-3 pb-2">
        {/* Back button — hidden on step 0 */}
        <View className="mb-3 h-9 justify-center">
          {step > 0 ? (
            <Pressable
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              hitSlop={8}
            >
              <Text variant="label" className="text-primary">
                {t('common.back')}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* Step label */}
        <Text variant="caption" className="mb-2 text-slate">
          {t('onboarding.stepLabel', {
            current: step + 1,
            total: TOTAL_STEPS,
          })}
        </Text>

        {/* Segmented progress bar — completed = mint, active = blue,
            remaining = light (SPEC §4 S2). */}
        <View className="flex-row gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              className={
                i < step
                  ? 'h-1.5 flex-1 rounded-full bg-mint'
                  : i === step
                    ? 'h-1.5 flex-1 rounded-full bg-primary'
                    : 'h-1.5 flex-1 rounded-full bg-border'
              }
            />
          ))}
        </View>
      </View>

      {/* ── Headline + subheadline ─────────────────────────────────────── */}
      <View className="px-5 pt-4 pb-2">
        <Text variant="h1" className="text-ink">
          {t('onboarding.headline')}
        </Text>
        <Text variant="body" className="mt-1.5 text-slate">
          {t('onboarding.subheadline')}
        </Text>
      </View>

      {/* ── Scrollable step content ────────────────────────────────────── */}
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <StepIdentity
            fullName={fullName}
            displayName={displayName}
            onFullNameChange={setFullName}
            onDisplayNameChange={setDisplayName}
          />
        )}

        {step === 1 && (
          <StepPhysical
            heightCm={heightCm}
            onHeightChange={setHeightCm}
            weightEnabled={weightEnabled}
            onWeightEnabledChange={setWeightEnabled}
            weightKg={weightKg}
            onWeightChange={setWeightKg}
          />
        )}

        {step === 2 && (
          <StepStyle
            selectedPro={selectedPro}
            onOpenProSheet={() => setProSheetVisible(true)}
            playStyle={playStyle}
            onPlayStyleChange={setPlayStyle}
          />
        )}

        {step === 3 && (
          <StepGoals
            experienceIndex={experienceIndex}
            experienceLevel={experienceLevel}
            onExperienceChange={setExperienceIndex}
            selectedGoals={selectedGoals}
            onToggleGoal={toggleGoal}
          />
        )}
      </ScrollView>

      {/* ── Fixed bottom CTA ──────────────────────────────────────────── */}
      <View
        className="px-5 pt-3 bg-light border-t border-border"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Button
          label={isFinalStep ? t('onboarding.finalCta') : t('common.continue')}
          variant={isFinalStep ? 'orange' : 'primary'}
          size="lg"
          block
          disabled={!canContinue || submitting}
          loading={submitting}
          onPress={handleContinue}
        />
      </View>

      {/* ── Pro player select sheet ────────────────────────────────────── */}
      <SelectSheet
        visible={proSheetVisible}
        onClose={() => setProSheetVisible(false)}
        title={t('onboarding.favoritePro')}
        options={proOptions}
        selectedValue={favoriteProId}
        onSelect={setFavoriteProId}
        searchable
        searchPlaceholder={t('common.search')}
        renderOption={renderProOption}
        heightRatio={0.72}
      />
    </View>
  );
}

// ─── Step sub-components ───────────────────────────────────────────────────────

// Step 1 — Identity
interface StepIdentityProps {
  fullName: string;
  displayName: string;
  onFullNameChange: (v: string) => void;
  onDisplayNameChange: (v: string) => void;
}

function StepIdentity({
  fullName,
  displayName,
  onFullNameChange,
  onDisplayNameChange,
}: StepIdentityProps) {
  const { t } = useTranslation();
  return (
    <View className="gap-y-5">
      <Text variant="h2" className="text-[18px] text-ink">
        {t('onboarding.step1Title')}
      </Text>
      <Input
        label={t('onboarding.fullName')}
        placeholder={t('onboarding.fullNamePlaceholder')}
        value={fullName}
        onChangeText={onFullNameChange}
        autoCapitalize="words"
        returnKeyType="next"
        autoFocus
      />
      <Input
        label={`${t('onboarding.displayName')} (${t('common.optional')})`}
        placeholder={t('onboarding.displayNamePlaceholder')}
        value={displayName}
        onChangeText={onDisplayNameChange}
        autoCapitalize="words"
        returnKeyType="done"
      />
    </View>
  );
}

// Step 2 — Physical stats
interface StepPhysicalProps {
  heightCm: number;
  onHeightChange: (v: number) => void;
  weightEnabled: boolean;
  onWeightEnabledChange: (v: boolean) => void;
  weightKg: number;
  onWeightChange: (v: number) => void;
}

function StepPhysical({
  heightCm,
  onHeightChange,
  weightEnabled,
  onWeightEnabledChange,
  weightKg,
  onWeightChange,
}: StepPhysicalProps) {
  const { t } = useTranslation();
  return (
    <View className="gap-y-6">
      <Text variant="h2" className="text-[18px] text-ink">
        {t('onboarding.step2Title')}
      </Text>

      {/* Height stepper — required */}
      <View>
        <NumberStepper
          label={t('onboarding.height')}
          value={heightCm}
          onChange={onHeightChange}
          min={120}
          max={220}
          step={1}
          suffix="cm"
        />
        <Text variant="caption" className="mt-2 text-slate">
          {t('onboarding.heightTooltip')}
        </Text>
      </View>

      {/* Weight stepper — optional, toggled */}
      <View>
        <Pressable
          onPress={() => onWeightEnabledChange(!weightEnabled)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: weightEnabled }}
          accessibilityLabel={t('onboarding.weight')}
          hitSlop={8}
          className="flex-row items-center gap-3 mb-3"
        >
          {/* Simple toggle-style checkbox */}
          <View
            className={`h-5 w-5 rounded border-2 items-center justify-center ${
              weightEnabled ? 'bg-primary border-primary' : 'border-border bg-white'
            }`}
          >
            {weightEnabled ? (
              <Text variant="caption" className="text-white text-[11px] font-bold">
                ✓
              </Text>
            ) : null}
          </View>
          <Text variant="label" className="text-ink">
            {t('onboarding.weight')} ({t('common.optional')})
          </Text>
        </Pressable>

        {weightEnabled ? (
          <NumberStepper
            value={weightKg}
            onChange={onWeightChange}
            min={30}
            max={150}
            step={1}
            suffix="kg"
          />
        ) : null}
      </View>
    </View>
  );
}

// Step 3 — Badminton style
interface StepStyleProps {
  selectedPro: ProPlayer | undefined;
  onOpenProSheet: () => void;
  playStyle: PlayStyle;
  onPlayStyleChange: (v: PlayStyle) => void;
}

function StepStyle({
  selectedPro,
  onOpenProSheet,
  playStyle,
  onPlayStyleChange,
}: StepStyleProps) {
  const { t } = useTranslation();

  const playStyleOptions = PLAY_STYLE_OPTIONS.map((o) => ({
    ...o,
    label: t(`playStyle.${o.value}`),
  }));

  return (
    <View className="gap-y-6">
      <Text variant="h2" className="text-[18px] text-ink">
        {t('onboarding.step3Title')}
      </Text>

      {/* Favorite Pro Player — opens SelectSheet */}
      <View>
        <Text variant="caption" className="mb-1.5 text-slate">
          {t('onboarding.favoritePro')} ({t('common.optional')})
        </Text>
        <Pressable
          onPress={onOpenProSheet}
          accessibilityRole="button"
          className="h-12 flex-row items-center justify-between rounded-input border border-border bg-white px-3.5"
        >
          {selectedPro ? (
            <ProAvatar player={selectedPro} showName size={28} />
          ) : (
            <Text variant="body" className="text-placeholder text-[15px]">
              {t('onboarding.favoriteProPlaceholder')}
            </Text>
          )}
          {/* Chevron */}
          <Text variant="caption" className="text-slate">
            ›
          </Text>
        </Pressable>
      </View>

      {/* Play style segmented control */}
      <View>
        <Text variant="caption" className="mb-1.5 text-slate">
          {t('onboarding.playStyle')}
        </Text>
        <SegmentedControl
          options={playStyleOptions}
          value={playStyle}
          onChange={onPlayStyleChange}
        />
      </View>
    </View>
  );
}

// Step 4 — Experience & goals
interface StepGoalsProps {
  experienceIndex: number;
  experienceLevel: ExperienceLevel;
  onExperienceChange: (index: number) => void;
  selectedGoals: Set<Goal>;
  onToggleGoal: (goal: Goal) => void;
}

function StepGoals({
  experienceIndex,
  experienceLevel,
  onExperienceChange,
  selectedGoals,
  onToggleGoal,
}: StepGoalsProps) {
  const { t } = useTranslation();

  return (
    <View className="gap-y-6">
      <Text variant="h2" className="text-[18px] text-ink">
        {t('onboarding.step4Title')}
      </Text>

      {/* Experience level slider */}
      <View>
        <Text variant="caption" className="mb-1.5 text-slate">
          {t('onboarding.experienceLevel')}
        </Text>
        <Slider
          value={experienceIndex}
          onChange={(v) => onExperienceChange(Math.round(v))}
          min={0}
          max={EXPERIENCE_LEVELS.length - 1}
          step={1}
          marks
          accessibilityLabel={t('onboarding.experienceLevel')}
        />
        {/* Current level label, centered below slider */}
        <View className="mt-3 items-center">
          <View className="rounded-chip bg-primary px-4 py-1.5">
            <Text variant="label" className="text-white text-[13px]">
              {t(`experience.${experienceLevel}`)}
            </Text>
          </View>
        </View>
      </View>

      {/* Primary goals multi-select chips */}
      <View>
        <Text variant="caption" className="mb-1 text-slate">
          {t('onboarding.primaryGoals')}
        </Text>
        <Text variant="caption" className="mb-3 text-slate">
          {t('onboarding.primaryGoalsHint')}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {GOALS.map((goal) => (
            <Chip
              key={goal}
              label={t(`goals.${goal}`)}
              active={selectedGoals.has(goal)}
              onPress={() => onToggleGoal(goal)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
