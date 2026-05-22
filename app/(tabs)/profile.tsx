/**
 * S14 — Profile & Settings (SPEC §4 S14).
 *
 * Sections:
 *  - Profile header (Avatar + display name + Edit Profile button).
 *  - Physical Stats (height / weight).
 *  - Athletic Preferences (fav pro, play style, experience).
 *  - Notification toggles.
 *  - Language selector.
 *  - Professional extras: Progress chart (with per-stroke filter) + full
 *    Achievements grid (SPEC §10).
 *  - Account actions (Sign Out / Delete Account).
 *  - About (link, SponsorBadge, version).
 *
 * Edit Profile opens a BottomSheet with Input / NumberStepper / SelectSheet /
 * SegmentedControl / Slider fields; saving calls useUserStore.updateProfile().
 */
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import {
  Award,
  ChevronRight,
  Flame,
  Layers,
  Star,
  Target,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react-native';
import type { ExperienceLevel, PlayStyle, StrokeType, UserProfile } from '@/src/types';
import { EXPERIENCE_LEVELS, STROKE_TYPES } from '@/src/types';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useUserStore, useAnalysisStore } from '@/src/store';
import { PRO_PLAYERS, getProPlayer } from '@/src/constants/proPlayers';
import {
  AppHeader,
  ProgressChart,
  ScreenContainer,
  SelectSheet,
  SponsorBadge,
  type ChartPoint,
  type SelectOption,
} from '@/src/components/shared';
import {
  Avatar,
  BottomSheet,
  Button,
  Chip,
  ConfirmationModal,
  Input,
  NumberStepper,
  SegmentedControl,
  Slider,
  Text,
  Toggle,
  cardShadow,
  toast,
} from '@/src/components/ui';
import type { SegmentOption } from '@/src/components/ui';
import { colors } from '@/src/theme';
import { formatDate } from '@/src/lib/format';
import type { AppLocale } from '@/src/i18n';
import { getAchievements } from '@/src/lib/achievements';
import type { Achievement } from '@/src/lib/achievements';

/* ─── types ─────────────────────────────────────────────────────────────── */

/** Local patch being built inside the edit sheet. */
type ProfilePatch = {
  fullName: string;
  displayName: string;
  heightCm: number;
  weightKg?: number;
  favoriteProId?: string;
  playStyle: PlayStyle;
  experienceLevel: ExperienceLevel;
};

/* ─── icon map ───────────────────────────────────────────────────────────── */

/** Typed map from Achievement.icon string to the corresponding Lucide component. */
const ACHIEVEMENT_ICON_MAP: Record<Achievement['icon'], LucideIcon> = {
  Award,
  Flame,
  Target,
  TrendingUp,
  Layers,
  Star,
};

/* ─── helpers ────────────────────────────────────────────────────────────── */

const PLAY_STYLE_OPTIONS: SegmentOption<PlayStyle>[] = [
  { value: 'Singles', label: 'Singles' },
  { value: 'Doubles', label: 'Doubles' },
  { value: 'Both', label: 'Both' },
];

const EXP_LABELS: Record<ExperienceLevel, string> = {
  Beginner: 'Beginner',
  Lower_Intermediate: 'Lower Int.',
  Intermediate: 'Intermediate',
  Upper_Intermediate: 'Upper Int.',
  Advanced: 'Advanced',
};

function expToIndex(exp: ExperienceLevel): number {
  return EXPERIENCE_LEVELS.indexOf(exp);
}
function indexToExp(i: number): ExperienceLevel {
  return EXPERIENCE_LEVELS[Math.round(i)] ?? 'Intermediate';
}

function buildProfilePatch(profile: UserProfile): ProfilePatch {
  return {
    fullName: profile.fullName,
    displayName: profile.displayName,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    favoriteProId: profile.favoriteProId,
    playStyle: profile.playStyle,
    experienceLevel: profile.experienceLevel,
  };
}

/** Null means "All" filter is active. */
type StrokeFilter = StrokeType | null;

/* ─── component ──────────────────────────────────────────────────────────── */

export default function ProfileScreen() {
  const { t, locale, setLocale } = useTranslation();
  const profile = useUserStore((s) => s.profile);
  const analyses = useAnalysisStore((s) => s.analyses);

  // Edit sheet state
  const [editOpen, setEditOpen] = useState(false);
  const [patch, setPatch] = useState<ProfilePatch | null>(null);
  const [proSheetOpen, setProSheetOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Per-stroke filter for progress chart
  const [strokeFilter, setStrokeFilter] = useState<StrokeFilter>(null);

  // Account modals
  const [signOutVisible, setSignOutVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);

  if (!profile) {
    // Should not happen (splash guards this), but handle gracefully.
    return (
      <View className="flex-1 items-center justify-center bg-light">
        <Text variant="body" className="text-slate">
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  /* ── Edit sheet helpers ─────────────────────────────────────────────── */

  function openEdit() {
    setPatch(buildProfilePatch(profile!));
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!patch) return;
    setSavingProfile(true);
    try {
      await useUserStore.getState().updateProfile(patch);
      setEditOpen(false);
      toast(t('profile.saveToast'), 'success');
    } catch {
      toast(t('error.title'), 'error');
    } finally {
      setSavingProfile(false);
    }
  }

  /* ── Pro player select options ─────────────────────────────────────── */

  const proOptions: SelectOption[] = PRO_PLAYERS.map((p) => ({
    value: p.id,
    label: p.name,
    subtitle: `${p.nationality} · ${p.heightCm} cm`,
  }));

  /* ── Progress chart data (filtered) ───────────────────────────────── */

  const filteredAnalyses = strokeFilter
    ? analyses.filter((a) => a.strokeType === strokeFilter)
    : analyses;

  const chartPoints: ChartPoint[] = [...filteredAnalyses]
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .map((a) => ({
      label: formatDate(a.createdAt, locale).split(' ').slice(0, 2).join(' '),
      value: a.overallScore,
    }));

  /* ── Achievements ─────────────────────────────────────────────────── */

  const achievements = getAchievements(analyses);
  const earnedCount = achievements.filter((a) => a.earned).length;

  /* ── Favourite pro display ─────────────────────────────────────────── */

  const favPro = profile.favoriteProId
    ? getProPlayer(profile.favoriteProId)
    : undefined;

  /* ── Language options ─────────────────────────────────────────────── */

  const langOptions: SegmentOption<AppLocale>[] = [
    { value: 'th', label: t('profile.languageThai') },
    { value: 'en', label: t('profile.languageEnglish') },
  ];

  /* ── Notification toggle helper ────────────────────────────────────── */

  async function toggleNotification(
    key: keyof UserProfile['notifications'],
    value: boolean,
  ) {
    const current = useUserStore.getState().profile;
    if (!current) return;
    await useUserStore.getState().updateProfile({
      notifications: { ...current.notifications, [key]: value },
    });
  }

  /* ── Account actions ────────────────────────────────────────────────── */

  async function handleSignOut() {
    setAccountLoading(true);
    try {
      await useUserStore.getState().signOut();
      router.replace('/');
    } finally {
      setAccountLoading(false);
      setSignOutVisible(false);
    }
  }

  async function handleDeleteAccount() {
    setAccountLoading(true);
    try {
      await useUserStore.getState().deleteAccount();
      router.replace('/');
    } finally {
      setAccountLoading(false);
      setDeleteVisible(false);
    }
  }

  /* ── render ─────────────────────────────────────────────────────────── */

  return (
    <ScreenContainer header={<AppHeader title={t('profile.title')} />}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile header ─────────────────────────────────────────────── */}
        <View className="bg-white px-5 py-5 mb-4 flex-row items-center gap-4">
          <Avatar name={profile.displayName} size={56} />
          <View className="flex-1">
            <Text variant="h2" className="text-[18px]">
              {profile.displayName}
            </Text>
            <Text variant="caption" className="text-slate">
              {profile.fullName}
            </Text>
          </View>
          <Button
            label={t('profile.editProfile')}
            variant="secondary"
            size="sm"
            block={false}
            onPress={openEdit}
          />
        </View>

        {/* ── Physical Stats ─────────────────────────────────────────────── */}
        <SectionCard title={t('profile.physicalStats')}>
          <Text variant="body" className="text-ink">
            {profile.weightKg
              ? t('profile.heightWeight', {
                  height: profile.heightCm,
                  weight: profile.weightKg,
                })
              : t('profile.heightOnly', { height: profile.heightCm })}
          </Text>
        </SectionCard>

        {/* ── Athletic Preferences ───────────────────────────────────────── */}
        <SectionCard title={t('profile.athleticPreferences')}>
          {favPro ? (
            <InfoRow label={t('onboarding.favoritePro')} value={favPro.name} />
          ) : null}
          <InfoRow
            label={t('onboarding.playStyle')}
            value={t(`playStyle.${profile.playStyle}`)}
          />
          <InfoRow
            label={t('onboarding.experienceLevel')}
            value={EXP_LABELS[profile.experienceLevel]}
          />
        </SectionCard>

        {/* ── Notifications ──────────────────────────────────────────────── */}
        <SectionCard title={t('profile.notificationSettings')}>
          <ToggleRow
            label={t('profile.notifyAnalysis')}
            value={profile.notifications.analysisComplete}
            onValueChange={(v) => toggleNotification('analysisComplete', v)}
          />
          <View className="border-t border-border mt-3 pt-3">
            <ToggleRow
              label={t('profile.notifyWeekly')}
              value={profile.notifications.weeklySummary}
              onValueChange={(v) => toggleNotification('weeklySummary', v)}
            />
          </View>
        </SectionCard>

        {/* ── Language ───────────────────────────────────────────────────── */}
        <SectionCard title={t('profile.language')}>
          <SegmentedControl
            options={langOptions}
            value={locale}
            onChange={setLocale}
          />
        </SectionCard>

        {/* ── Your Progress (SPEC §10) ───────────────────────────────────── */}
        <SectionCard title={t('profile.progressTitle')}>
          {/* Per-stroke filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
          >
            <Chip
              label={t('profile.progressFilterAll')}
              active={strokeFilter === null}
              onPress={() => setStrokeFilter(null)}
            />
            {STROKE_TYPES.map((s) => (
              <Chip
                key={s}
                label={t(`stroke.${s}`)}
                active={strokeFilter === s}
                onPress={() => setStrokeFilter(s)}
              />
            ))}
          </ScrollView>

          <ProgressChart points={chartPoints} height={140} />
        </SectionCard>

        {/* ── Achievements ──────────────────────────────────────────────── */}
        <SectionCard title={t('achv.title')}>
          {/* Earned count sub-label */}
          <Text variant="caption" className="text-slate mb-4">
            {t('achv.earnedCount', {
              earned: earnedCount,
              total: achievements.length,
            })}
          </Text>

          {/* 2-column badge grid */}
          <View className="flex-row flex-wrap gap-3">
            {achievements.map((achv) => (
              <AchievementCard key={achv.id} achievement={achv} t={t} />
            ))}
          </View>
        </SectionCard>

        {/* ── Account ────────────────────────────────────────────────────── */}
        <SectionCard title={t('profile.account')}>
          <Pressable
            onPress={() => setSignOutVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={t('profile.signOut')}
            className="py-2"
          >
            <Text variant="label" className="text-score-red">
              {t('profile.signOut')}
            </Text>
          </Pressable>
          <View className="border-t border-border mt-3 pt-3">
            <Pressable
              onPress={() => setDeleteVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={t('profile.deleteAccount')}
              className="py-2"
            >
              <Text variant="label" className="text-score-red">
                {t('profile.deleteAccount')}
              </Text>
            </Pressable>
          </View>
        </SectionCard>

        {/* ── About ──────────────────────────────────────────────────────── */}
        <SectionCard title={t('profile.about')}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.aboutApp')}
            className="flex-row items-center justify-between py-2"
          >
            <Text variant="label" className="text-primary">
              {t('profile.aboutApp')}
            </Text>
            <ChevronRight size={16} color={colors.primary} />
          </Pressable>
          <View className="border-t border-border mt-3 pt-4 items-center gap-2">
            <SponsorBadge variant="light" />
            <Text variant="caption" className="text-slate">
              {t('profile.version', { version: '1.0.0' })}
            </Text>
          </View>
        </SectionCard>
      </ScrollView>

      {/* ══════════════════════════════════════════════════════════════════
          Edit Profile Bottom Sheet
      ══════════════════════════════════════════════════════════════════ */}
      <BottomSheet
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        heightRatio={0.9}
        scrollable
      >
        {patch ? (
          <EditProfileForm
            patch={patch}
            onChange={setPatch}
            proOptions={proOptions}
            proSheetOpen={proSheetOpen}
            setProSheetOpen={setProSheetOpen}
            onSave={saveEdit}
            onCancel={() => setEditOpen(false)}
            saving={savingProfile}
          />
        ) : null}
      </BottomSheet>

      {/* ── Sign Out confirmation ─────────────────────────────────────────── */}
      <ConfirmationModal
        visible={signOutVisible}
        title={t('profile.signOutConfirm')}
        confirmLabel={t('profile.signOut')}
        cancelLabel={t('common.cancel')}
        destructive
        confirmLoading={accountLoading}
        onConfirm={handleSignOut}
        onCancel={() => setSignOutVisible(false)}
      />

      {/* ── Delete Account confirmation ───────────────────────────────────── */}
      <ConfirmationModal
        visible={deleteVisible}
        title={t('profile.deleteConfirmTitle')}
        message={t('profile.deleteConfirmBody')}
        confirmLabel={t('profile.deleteAccount')}
        cancelLabel={t('common.cancel')}
        destructive
        dismissable={false}
        confirmLoading={accountLoading}
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteVisible(false)}
      />
    </ScreenContainer>
  );
}

/* ─── Achievement card ───────────────────────────────────────────────────── */

function AchievementCard({
  achievement,
  t,
}: {
  achievement: Achievement;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const IconComponent = ACHIEVEMENT_ICON_MAP[achievement.icon];
  const { earned } = achievement;

  return (
    <View
      className="rounded-card border p-3"
      style={[
        {
          // Each card takes just under half the grid width (accounting for gap).
          flex: 1,
          minWidth: '45%',
          opacity: earned ? 1 : 0.45,
          borderColor: earned ? colors.mintTint : colors.border,
          backgroundColor: earned ? colors.white : colors.lightAlt,
        },
        earned ? cardShadow : null,
      ]}
    >
      {/* Icon circle */}
      <View
        className="h-10 w-10 items-center justify-center rounded-full mb-2"
        style={{
          backgroundColor: earned ? colors.mintTint : colors.border,
        }}
      >
        <IconComponent
          size={20}
          color={earned ? colors.mintStrong : colors.inkMuted}
        />
      </View>

      {/* Title */}
      <Text
        variant="bodyMedium"
        className="text-[13px] leading-[18px]"
        style={{ color: earned ? colors.ink : colors.inkMuted }}
      >
        {t(achievement.titleKey)}
      </Text>

      {/* Description */}
      <Text
        variant="caption"
        className="text-[11px] leading-[15px] mt-0.5"
        style={{ color: earned ? colors.inkSoft : colors.inkMuted }}
      >
        {t(achievement.descKey)}
      </Text>
    </View>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mx-5 mb-4 rounded-card bg-white p-4" style={cardShadow}>
      <Text variant="h2" className="mb-3 text-[15px] text-slate uppercase tracking-wide">
        {title}
      </Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text variant="caption" className="text-slate">
        {label}
      </Text>
      <Text variant="bodyMedium" className="text-ink text-[14px]">
        {value}
      </Text>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text variant="body" className="flex-1 text-ink">
        {label}
      </Text>
      <Toggle value={value} onValueChange={onValueChange} accessibilityLabel={label} />
    </View>
  );
}

/* ─── Edit Profile form ───────────────────────────────────────────────────── */

function EditProfileForm({
  patch,
  onChange,
  proOptions,
  proSheetOpen,
  setProSheetOpen,
  onSave,
  onCancel,
  saving,
}: {
  patch: ProfilePatch;
  onChange: (p: ProfilePatch) => void;
  proOptions: SelectOption[];
  proSheetOpen: boolean;
  setProSheetOpen: (v: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const { t } = useTranslation();
  const set = (partial: Partial<ProfilePatch>) =>
    onChange({ ...patch, ...partial });

  const expIndex = expToIndex(patch.experienceLevel);

  const selectedProName =
    proOptions.find((o) => o.value === patch.favoriteProId)?.label ?? '';

  return (
    <View className="gap-4 pb-6">
      <Text variant="h2" className="mb-1 text-[18px]">
        {t('profile.editProfile')}
      </Text>

      {/* Full name */}
      <Input
        label={t('onboarding.fullName')}
        value={patch.fullName}
        onChangeText={(v) => set({ fullName: v })}
        placeholder={t('onboarding.fullNamePlaceholder')}
        autoCorrect={false}
      />

      {/* Display name */}
      <Input
        label={t('onboarding.displayName')}
        value={patch.displayName}
        onChangeText={(v) => set({ displayName: v })}
        placeholder={t('onboarding.displayNamePlaceholder')}
        autoCorrect={false}
      />

      {/* Height */}
      <NumberStepper
        label={t('onboarding.height')}
        value={patch.heightCm}
        onChange={(v) => set({ heightCm: v })}
        min={100}
        max={220}
        suffix="cm"
      />

      {/* Weight */}
      <NumberStepper
        label={`${t('onboarding.weight')} (${t('common.optional')})`}
        value={patch.weightKg ?? 60}
        onChange={(v) => set({ weightKg: v })}
        min={30}
        max={200}
        suffix="kg"
      />

      {/* Favourite Pro — triggers a SelectSheet */}
      <View>
        <Text variant="caption" className="mb-1.5 text-slate">
          {t('onboarding.favoritePro')}
        </Text>
        <Pressable
          onPress={() => setProSheetOpen(true)}
          accessibilityRole="button"
          className="h-12 flex-row items-center justify-between rounded-input border border-border bg-white px-3.5"
        >
          <Text variant="body" className={selectedProName ? 'text-ink' : 'text-placeholder'}>
            {selectedProName || t('onboarding.favoriteProPlaceholder')}
          </Text>
          <ChevronRight size={16} color={colors.slate} />
        </Pressable>
      </View>

      {/* Play Style */}
      <View>
        <Text variant="caption" className="mb-1.5 text-slate">
          {t('onboarding.playStyle')}
        </Text>
        <SegmentedControl
          options={PLAY_STYLE_OPTIONS}
          value={patch.playStyle}
          onChange={(v) => set({ playStyle: v })}
        />
      </View>

      {/* Experience */}
      <View>
        <Text variant="caption" className="mb-1.5 text-slate">
          {t('onboarding.experienceLevel')}
        </Text>
        <Slider
          value={expIndex}
          onChange={(v) => set({ experienceLevel: indexToExp(v) })}
          min={0}
          max={EXPERIENCE_LEVELS.length - 1}
          step={1}
          marks
          accessibilityLabel={t('onboarding.experienceLevel')}
        />
        <View className="flex-row justify-between mt-1">
          {EXPERIENCE_LEVELS.map((e) => (
            <Text key={e} variant="caption" className="text-[9px] text-slate">
              {EXP_LABELS[e].slice(0, 5)}
            </Text>
          ))}
        </View>
        <Text variant="caption" className="mt-1 text-center text-primary">
          {EXP_LABELS[patch.experienceLevel]}
        </Text>
      </View>

      {/* Action buttons */}
      <View className="mt-2 gap-2">
        <Button
          label={t('common.save')}
          variant="primary"
          loading={saving}
          onPress={onSave}
        />
        <Button
          label={t('common.cancel')}
          variant="text"
          onPress={onCancel}
        />
      </View>

      {/* Nested pro player SelectSheet */}
      <SelectSheet
        visible={proSheetOpen}
        onClose={() => setProSheetOpen(false)}
        title={t('onboarding.favoritePro')}
        options={proOptions}
        selectedValue={patch.favoriteProId}
        onSelect={(v) => set({ favoriteProId: v })}
        searchable
        searchPlaceholder={t('common.search')}
        heightRatio={0.65}
      />
    </View>
  );
}
