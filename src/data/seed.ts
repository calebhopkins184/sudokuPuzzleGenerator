import { addDays, toDateKey } from '@/lib/dates';

import type { CoachingData } from './types';

function at(daysFromNow: number, hour: number, minute = 0): string {
  const date = addDays(new Date(), daysFromNow);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

const day = (daysFromNow: number) => toDateKey(addDays(new Date(), daysFromNow));

/** Sample data shown on first launch. Replace with your backend once one exists. */
export function createSeedData(): CoachingData {
  return {
    clientName: 'Alex',
    coach: {
      name: 'Jordan Rivera',
      title: 'Performance & Habits Coach',
      bio: 'Helping clients build sustainable routines through small, consistent wins.',
      email: 'coach@example.com',
    },
    goals: [
      {
        id: 'goal_run',
        title: 'Run a 10K',
        description: 'Build up to running 10K without stopping.',
        category: 'Fitness',
        targetDate: day(60),
        createdAt: new Date().toISOString(),
        milestones: [
          { id: 'm1', title: 'Run 3K non-stop', done: true },
          { id: 'm2', title: 'Run 5K non-stop', done: false },
          { id: 'm3', title: 'Run 8K non-stop', done: false },
          { id: 'm4', title: 'Complete a 10K', done: false },
        ],
      },
      {
        id: 'goal_sleep',
        title: 'Sleep 7+ hours',
        description: 'Consistent bedtime routine on weeknights.',
        category: 'Mindset',
        targetDate: day(30),
        createdAt: new Date().toISOString(),
        milestones: [
          { id: 'm1', title: 'Set a fixed bedtime', done: true },
          { id: 'm2', title: 'No screens 30 min before bed', done: true },
          { id: 'm3', title: 'Hit 7 hours for 5 nights in a row', done: false },
        ],
      },
    ],
    sessions: [
      {
        id: 'session_past',
        title: 'Kickoff call',
        startsAt: at(-7, 17),
        durationMinutes: 45,
        location: 'Video call',
        agenda: ['Introductions', 'Set initial goals', 'Agree on check-in cadence'],
        notes: 'Focus on consistency over intensity for the first month.',
      },
      {
        id: 'session_next',
        title: 'Weekly check-in',
        startsAt: at(2, 17, 30),
        durationMinutes: 30,
        location: 'Video call',
        agenda: ['Review habit streaks', 'Adjust running plan', 'Q&A'],
        notes: '',
      },
      {
        id: 'session_later',
        title: 'Monthly review',
        startsAt: at(9, 12),
        durationMinutes: 60,
        location: 'Studio',
        agenda: ['Progress review', 'Set next month goals'],
        notes: '',
      },
    ],
    habits: [
      { id: 'habit_water', title: 'Drink 2L of water', completedOn: [day(-1), day(-2), day(-3)] },
      { id: 'habit_walk', title: '20 minute walk', completedOn: [day(-1)] },
      { id: 'habit_journal', title: 'Evening reflection', completedOn: [] },
    ],
    checkIns: [],
  };
}
