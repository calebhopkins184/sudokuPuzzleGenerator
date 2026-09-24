import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { deleteMediaFile } from '@/features/media/mediaFiles';
import { createId } from '@/lib/id';

import {
  EMPTY_STATE,
  orphanedFiles,
  parsePersisted,
  sessionsReducer,
  type SessionsAction,
} from './reducer';
import type { PersistedState, Session } from './types';

const STORAGE_KEY = 'mat-review/sessions/v1';
const BACKUP_KEY = 'mat-review/sessions/v1.unreadable-backup';
const SAVE_DELAY_MS = 400;

type LoadStatus = { kind: 'loading' } | { kind: 'ready' } | { kind: 'error'; message: string };

type Store = {
  state: PersistedState;
  status: LoadStatus;
  dispatch: (action: SessionsAction) => void;
  createSession: (title: string) => Session;
  retryLoad: () => void;
  /** Keeps a backup of unreadable data, then starts with an empty library. */
  startFresh: () => Promise<void>;
};

const SessionsContext = createContext<Store | null>(null);

export function SessionsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(EMPTY_STATE);
  const [status, setStatus] = useState<LoadStatus>({ kind: 'loading' });
  const stateRef = useRef(state);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

  const load = useCallback(() => {
    setStatus({ kind: 'loading' });
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const parsed = parsePersisted(raw);
        stateRef.current = parsed;
        setState(parsed);
        setStatus({ kind: 'ready' });
      })
      .catch((error: unknown) => {
        setStatus({
          kind: 'error',
          message: error instanceof Error ? error.message : 'Saved sessions could not be read.',
        });
      });
  }, []);

  useEffect(load, [load]);

  const flush = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = null;
    if (!dirty.current) return;
    dirty.current = false;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stateRef.current)).catch((error) =>
      console.warn('Failed to save sessions', error),
    );
  }, []);

  // Save soon after changes, and immediately when the app is backgrounded.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') flush();
    });
    return () => {
      sub.remove();
      flush();
    };
  }, [flush]);

  const dispatch = useCallback(
    (action: SessionsAction) => {
      const prev = stateRef.current;
      const next = sessionsReducer(prev, action);
      if (next === prev) return;
      orphanedFiles(prev, action).forEach(deleteMediaFile);
      stateRef.current = next;
      setState(next);
      dirty.current = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(flush, SAVE_DELAY_MS);
    },
    [flush],
  );

  const createSession = useCallback(
    (title: string) => {
      const timestamp = new Date().toISOString();
      const session: Session = {
        id: createId('session'),
        title: title.trim() || 'Untitled session',
        createdAt: timestamp,
        updatedAt: timestamp,
        mainMediaId: null,
        media: {},
        annotations: [],
        clips: [],
        lastPositionSec: 0,
      };
      dispatch({ type: 'createSession', session });
      return session;
    },
    [dispatch],
  );

  const startFresh = useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
    if (raw) await AsyncStorage.setItem(BACKUP_KEY, raw).catch(() => undefined);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(EMPTY_STATE));
    stateRef.current = EMPTY_STATE;
    setState(EMPTY_STATE);
    setStatus({ kind: 'ready' });
  }, []);

  const value = useMemo(
    () => ({ state, status, dispatch, createSession, retryLoad: load, startFresh }),
    [state, status, dispatch, createSession, load, startFresh],
  );
  return <SessionsContext.Provider value={value}>{children}</SessionsContext.Provider>;
}

export function useSessions(): Store {
  const store = useContext(SessionsContext);
  if (!store) throw new Error('useSessions must be used inside <SessionsProvider>');
  return store;
}

export function useSession(sessionId: string | undefined): Session | undefined {
  const { state } = useSessions();
  return state.sessions.find((s) => s.id === sessionId);
}
