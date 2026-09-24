/** Data model — see docs/PRODUCT_CONTRACT.md. */

export type MediaRef = {
  id: string;
  /** Relative to the app's media directory. Never store absolute, device-specific URIs. */
  fileName: string;
  thumbFileName: string | null;
  source: 'library' | 'camera';
  originalName: string | null;
  durationSec: number | null;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  compressed: boolean;
  createdAt: string;
};

export type NoteAnnotation = {
  id: string;
  kind: 'note';
  timeSec: number;
  text: string;
  createdAt: string;
};

export type LinkAnnotation = {
  id: string;
  kind: 'link';
  timeSec: number;
  url: string;
  title: string;
  source: 'manual' | 'youtube';
  createdAt: string;
};

export type Annotation = NoteAnnotation | LinkAnnotation;

export type ClipInsert = {
  id: string;
  timeSec: number;
  mediaId: string;
  label: string;
  createdAt: string;
};

export type Session = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  mainMediaId: string | null;
  media: Record<string, MediaRef>;
  annotations: Annotation[];
  clips: ClipInsert[];
  lastPositionSec: number;
};

export const REPLAY_WINDOWS = [3, 5, 8, 10] as const;
export const SLOW_RATES = [0.25, 0.5] as const;

export type Settings = {
  replayWindowSec: (typeof REPLAY_WINDOWS)[number];
  slowRate: (typeof SLOW_RATES)[number];
  autoPlayClips: boolean;
  compressOnImport: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  replayWindowSec: 5,
  slowRate: 0.5,
  autoPlayClips: true,
  compressOnImport: false,
};

export type PersistedState = {
  version: 1;
  sessions: Session[];
  settings: Settings;
};
