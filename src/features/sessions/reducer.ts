import {
  DEFAULT_SETTINGS,
  REPLAY_WINDOWS,
  SLOW_RATES,
  type Annotation,
  type ClipInsert,
  type MediaRef,
  type PersistedState,
  type Session,
  type Settings,
} from './types';

export type SessionsAction =
  | { type: 'createSession'; session: Session }
  | { type: 'renameSession'; sessionId: string; title: string }
  | { type: 'deleteSession'; sessionId: string }
  | { type: 'setMainMedia'; sessionId: string; media: MediaRef; keepPosition?: boolean }
  | { type: 'removeMedia'; sessionId: string; mediaId: string }
  | { type: 'addAnnotation'; sessionId: string; annotation: Annotation }
  | { type: 'deleteAnnotation'; sessionId: string; annotationId: string }
  | { type: 'addClip'; sessionId: string; clip: ClipInsert; media: MediaRef }
  | { type: 'deleteClip'; sessionId: string; clipId: string }
  | { type: 'setLastPosition'; sessionId: string; positionSec: number }
  | { type: 'updateSettings'; settings: Partial<Settings> };

const now = () => new Date().toISOString();

function updateSession(
  state: PersistedState,
  sessionId: string,
  update: (session: Session) => Session,
  touch = true,
): PersistedState {
  let changed = false;
  const sessions = state.sessions.map((s) => {
    if (s.id !== sessionId) return s;
    changed = true;
    const next = update(s);
    return touch ? { ...next, updatedAt: now() } : next;
  });
  return changed ? { ...state, sessions } : state;
}

const byTime = <T extends { timeSec: number; createdAt: string }>(a: T, b: T) =>
  a.timeSec - b.timeSec || a.createdAt.localeCompare(b.createdAt);

export function sessionsReducer(state: PersistedState, action: SessionsAction): PersistedState {
  switch (action.type) {
    case 'createSession':
      return { ...state, sessions: [action.session, ...state.sessions] };

    case 'renameSession': {
      const title = action.title.trim();
      if (!title) return state;
      return updateSession(state, action.sessionId, (s) => ({ ...s, title }));
    }

    case 'deleteSession':
      return { ...state, sessions: state.sessions.filter((s) => s.id !== action.sessionId) };

    case 'setMainMedia':
      return updateSession(state, action.sessionId, (s) => {
        const media = { ...s.media };
        if (s.mainMediaId) delete media[s.mainMediaId];
        media[action.media.id] = action.media;
        return {
          ...s,
          media,
          mainMediaId: action.media.id,
          lastPositionSec: action.keepPosition ? s.lastPositionSec : 0,
        };
      });

    case 'removeMedia':
      return updateSession(state, action.sessionId, (s) => {
        const media = { ...s.media };
        delete media[action.mediaId];
        return {
          ...s,
          media,
          mainMediaId: s.mainMediaId === action.mediaId ? null : s.mainMediaId,
          clips: s.clips.filter((c) => c.mediaId !== action.mediaId),
        };
      });

    case 'addAnnotation':
      return updateSession(state, action.sessionId, (s) => ({
        ...s,
        annotations: [...s.annotations, action.annotation].sort(byTime),
      }));

    case 'deleteAnnotation':
      return updateSession(state, action.sessionId, (s) => ({
        ...s,
        annotations: s.annotations.filter((a) => a.id !== action.annotationId),
      }));

    case 'addClip':
      return updateSession(state, action.sessionId, (s) => ({
        ...s,
        media: { ...s.media, [action.media.id]: action.media },
        clips: [...s.clips, action.clip].sort(byTime),
      }));

    case 'deleteClip':
      return updateSession(state, action.sessionId, (s) => {
        const clip = s.clips.find((c) => c.id === action.clipId);
        if (!clip) return s;
        const media = { ...s.media };
        delete media[clip.mediaId];
        return { ...s, media, clips: s.clips.filter((c) => c.id !== action.clipId) };
      });

    case 'setLastPosition':
      return updateSession(
        state,
        action.sessionId,
        (s) => ({ ...s, lastPositionSec: Math.max(0, action.positionSec) }),
        false,
      );

    case 'updateSettings':
      return { ...state, settings: { ...state.settings, ...action.settings } };
  }
}

/** Media files that are no longer referenced once `action` is applied — deleted from disk by the store. */
export function orphanedFiles(state: PersistedState, action: SessionsAction): string[] {
  const session =
    'sessionId' in action ? state.sessions.find((s) => s.id === action.sessionId) : undefined;
  if (!session) return [];
  const files = (m: MediaRef | undefined) =>
    m ? [m.fileName, m.thumbFileName].filter((f): f is string => !!f) : [];

  switch (action.type) {
    case 'deleteSession':
      return Object.values(session.media).flatMap(files);
    case 'setMainMedia':
      return session.mainMediaId ? files(session.media[session.mainMediaId]) : [];
    case 'removeMedia':
      return files(session.media[action.mediaId]);
    case 'deleteClip': {
      const clip = session.clips.find((c) => c.id === action.clipId);
      return clip ? files(session.media[clip.mediaId]) : [];
    }
    default:
      return [];
  }
}

export const EMPTY_STATE: PersistedState = { version: 1, sessions: [], settings: DEFAULT_SETTINGS };

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const num = (v: unknown, fallback = 0) =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);

function parseSession(raw: unknown): Session | null {
  if (!isObject(raw) || typeof raw.id !== 'string') return null;
  const media: Record<string, MediaRef> = {};
  if (isObject(raw.media)) {
    for (const [id, m] of Object.entries(raw.media)) {
      if (isObject(m) && typeof m.fileName === 'string') media[id] = m as unknown as MediaRef;
    }
  }
  const annotations = Array.isArray(raw.annotations)
    ? (raw.annotations.filter(
        (a) =>
          isObject(a) && (a.kind === 'note' || a.kind === 'link') && typeof a.timeSec === 'number',
      ) as Annotation[])
    : [];
  const clips = Array.isArray(raw.clips)
    ? (raw.clips.filter(
        (c) => isObject(c) && typeof c.mediaId === 'string' && typeof c.timeSec === 'number',
      ) as ClipInsert[])
    : [];
  const mainMediaId =
    typeof raw.mainMediaId === 'string' && media[raw.mainMediaId] ? raw.mainMediaId : null;
  const createdAt = str(raw.createdAt, new Date(0).toISOString());
  return {
    id: raw.id,
    title: str(raw.title, 'Untitled session'),
    createdAt,
    updatedAt: str(raw.updatedAt, createdAt),
    mainMediaId,
    media,
    annotations,
    clips: clips.filter((c) => media[c.mediaId]),
    lastPositionSec: num(raw.lastPositionSec),
  };
}

function parseSettings(raw: unknown): Settings {
  if (!isObject(raw)) return DEFAULT_SETTINGS;
  const replay = REPLAY_WINDOWS.find((w) => w === raw.replayWindowSec);
  const slow = SLOW_RATES.find((r) => r === raw.slowRate);
  return {
    replayWindowSec: replay ?? DEFAULT_SETTINGS.replayWindowSec,
    slowRate: slow ?? DEFAULT_SETTINGS.slowRate,
    autoPlayClips:
      typeof raw.autoPlayClips === 'boolean' ? raw.autoPlayClips : DEFAULT_SETTINGS.autoPlayClips,
    compressOnImport:
      typeof raw.compressOnImport === 'boolean'
        ? raw.compressOnImport
        : DEFAULT_SETTINGS.compressOnImport,
  };
}

/**
 * Parses stored JSON defensively. Unknown or damaged entries are dropped rather than
 * crashing the app; a completely unreadable blob throws so the UI can offer recovery.
 */
export function parsePersisted(raw: string | null): PersistedState {
  if (raw == null) return EMPTY_STATE;
  const data: unknown = JSON.parse(raw);
  if (!isObject(data) || data.version !== 1 || !Array.isArray(data.sessions)) {
    throw new Error('Saved data is in an unrecognized format.');
  }
  return {
    version: 1,
    sessions: data.sessions.map(parseSession).filter((s): s is Session => s !== null),
    settings: parseSettings(data.settings),
  };
}
