/**
 * Upload-flow store — the transient draft built across S4–S7. Not persisted;
 * `reset()` is called whenever the upload modal is dismissed or completed.
 */
import { create } from 'zustand';
import type { CourtCorners, StrokeType } from '@/src/types';

/** Length of the bundled demo source clip, in seconds. */
export const SAMPLE_CLIP_DURATION = 10;

/** Trim length bounds enforced by S4 (SPEC §4 S4). */
export const TRIM_MIN_SEC = 1;
export const TRIM_MAX_SEC = 15;

/** AI-estimated initial court corners (normalised 0–1), adjusted by the user. */
const DEFAULT_CORNERS: CourtCorners = {
  tl: { x: 0.2, y: 0.34 },
  tr: { x: 0.8, y: 0.34 },
  bl: { x: 0.08, y: 0.9 },
  br: { x: 0.92, y: 0.9 },
};

interface UploadState {
  /** Reference to the clip being analysed (bundled sample on the demo build). */
  clipRef: string;
  /** Full duration of the source clip. */
  clipDurationSec: number;
  trimStartSec: number;
  trimEndSec: number;
  strokeType: StrokeType | null;
  courtCorners: CourtCorners;
  /** True once any court pin has been dragged (hides the guide overlay). */
  courtTouched: boolean;

  /** Begin a fresh upload from the bundled sample clip. */
  start: () => void;
  setTrim: (startSec: number, endSec: number) => void;
  setStroke: (stroke: StrokeType) => void;
  setCorners: (corners: CourtCorners) => void;
  markCourtTouched: () => void;
  reset: () => void;
}

const initialState = {
  clipRef: 'sample://user',
  clipDurationSec: SAMPLE_CLIP_DURATION,
  trimStartSec: 1,
  trimEndSec: 6,
  strokeType: null as StrokeType | null,
  courtCorners: DEFAULT_CORNERS,
  courtTouched: false,
};

export const useUploadStore = create<UploadState>((set) => ({
  ...initialState,

  start: () => set({ ...initialState }),
  setTrim: (trimStartSec, trimEndSec) => set({ trimStartSec, trimEndSec }),
  setStroke: (strokeType) => set({ strokeType }),
  setCorners: (courtCorners) => set({ courtCorners }),
  markCourtTouched: () => set({ courtTouched: true }),
  reset: () => set({ ...initialState }),
}));

/** Selected trim length in seconds. */
export function trimDuration(s: Pick<UploadState, 'trimStartSec' | 'trimEndSec'>) {
  return s.trimEndSec - s.trimStartSec;
}
