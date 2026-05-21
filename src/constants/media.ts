/**
 * Bundled sample media.
 *
 * The MVP ships two short clips so the upload flow (S4) and the split-screen
 * comparison player (S9) are fully demoable with no backend or camera roll.
 *
 * ⚠️  These are generic placeholder clips, NOT real badminton footage. A real
 * build should replace them with side-view badminton clips and the backend
 * should return per-analysis `userVideoUrl` / `proVideoUrl` values. Swapping the
 * two `require()`s below is the only change needed.
 */
import type { ImageSourcePropType } from 'react-native';

// Metro resolves these to a playable asset module that expo-video accepts.
export const SAMPLE_USER_CLIP =
  require('../../assets/videos/sample-rally.mp4') as number;

export const SAMPLE_PRO_CLIP =
  require('../../assets/videos/sample-pro.mp4') as number;

/** App icon, reused for in-app branding marks. */
export const APP_ICON =
  require('../../assets/images/icon.png') as ImageSourcePropType;

/** A source accepted by expo-video: a bundled asset module or a remote URI. */
export type VideoSource = number | { uri: string };

/**
 * Resolve an `Analysis` video URL to an expo-video source. Mock analyses use
 * `sample://` markers; a real backend returns plain URLs that fall through.
 */
export function resolveVideoSource(url: string): VideoSource {
  if (url === 'sample://user') return SAMPLE_USER_CLIP;
  if (url === 'sample://pro') return SAMPLE_PRO_CLIP;
  return { uri: url };
}
