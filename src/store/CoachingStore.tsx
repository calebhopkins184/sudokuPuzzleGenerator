import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';

import { createSeedData } from '@/data/seed';
import type { CheckIn, CoachingData, Goal } from '@/data/types';
import { createId } from '@/lib/id';

const STORAGE_KEY = 'coaching-app/data/v1';

type Action =
  | { type: 'hydrate'; data: CoachingData }
  | { type: 'reset' }
  | { type: 'addGoal'; goal: Omit<Goal, 'id' | 'createdAt'> }
  | { type: 'deleteGoal'; goalId: string }
  | { type: 'toggleMilestone'; goalId: string; milestoneId: string }
  | { type: 'toggleHabit'; habitId: string; date: string }
  | { type: 'saveCheckIn'; checkIn: Omit<CheckIn, 'id'> }
  | { type: 'updateSessionNotes'; sessionId: string; notes: string };

function reducer(state: CoachingData, action: Action): CoachingData {
  switch (action.type) {
    case 'hydrate':
      return action.data;
    case 'reset':
      return createSeedData();
    case 'addGoal':
      return {
        ...state,
        goals: [
          ...state.goals,
          { ...action.goal, id: createId('goal'), createdAt: new Date().toISOString() },
        ],
      };
    case 'deleteGoal':
      return { ...state, goals: state.goals.filter((g) => g.id !== action.goalId) };
    case 'toggleMilestone':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id !== action.goalId
            ? g
            : {
                ...g,
                milestones: g.milestones.map((m) =>
                  m.id === action.milestoneId ? { ...m, done: !m.done } : m,
                ),
              },
        ),
      };
    case 'toggleHabit':
      return {
        ...state,
        habits: state.habits.map((h) => {
          if (h.id !== action.habitId) return h;
          const done = h.completedOn.includes(action.date);
          return {
            ...h,
            completedOn: done
              ? h.completedOn.filter((d) => d !== action.date)
              : [...h.completedOn, action.date],
          };
        }),
      };
    case 'saveCheckIn': {
      // One check-in per day: replace today's if it already exists.
      const others = state.checkIns.filter((c) => c.date !== action.checkIn.date);
      return {
        ...state,
        checkIns: [{ ...action.checkIn, id: createId('checkin') }, ...others].sort((a, b) =>
          b.date.localeCompare(a.date),
        ),
      };
    }
    case 'updateSessionNotes':
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.sessionId ? { ...s, notes: action.notes } : s,
        ),
      };
  }
}

type Store = {
  data: CoachingData;
  ready: boolean;
  dispatch: React.Dispatch<Action>;
};

const CoachingContext = createContext<Store | null>(null);

export function CoachingProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, createSeedData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) dispatch({ type: 'hydrate', data: JSON.parse(raw) as CoachingData });
      })
      .catch((error) => console.warn('Failed to load coaching data', error))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch((error) =>
      console.warn('Failed to save coaching data', error),
    );
  }, [data, ready]);

  const value = useMemo(() => ({ data, ready, dispatch }), [data, ready]);
  return <CoachingContext.Provider value={value}>{children}</CoachingContext.Provider>;
}

export function useCoaching(): Store {
  const store = useContext(CoachingContext);
  if (!store) throw new Error('useCoaching must be used inside <CoachingProvider>');
  return store;
}

export function goalProgress(goal: Goal): number {
  if (goal.milestones.length === 0) return 0;
  return goal.milestones.filter((m) => m.done).length / goal.milestones.length;
}
