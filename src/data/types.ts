export type Coach = {
  name: string;
  title: string;
  bio: string;
  email: string;
};

export type Milestone = {
  id: string;
  title: string;
  done: boolean;
};

export type Goal = {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  targetDate: string; // ISO date (YYYY-MM-DD)
  milestones: Milestone[];
  createdAt: string; // ISO timestamp
};

export const GOAL_CATEGORIES = ['Fitness', 'Nutrition', 'Mindset', 'Career', 'Other'] as const;
export type GoalCategory = (typeof GOAL_CATEGORIES)[number];

export type Session = {
  id: string;
  title: string;
  startsAt: string; // ISO timestamp
  durationMinutes: number;
  location: string;
  agenda: string[];
  notes: string;
};

export type Habit = {
  id: string;
  title: string;
  // ISO dates (YYYY-MM-DD) on which the habit was completed
  completedOn: string[];
};

export type CheckIn = {
  id: string;
  date: string; // ISO date (YYYY-MM-DD)
  mood: number; // 1-5
  energy: number; // 1-5
  reflection: string;
};

export type CoachingData = {
  clientName: string;
  coach: Coach;
  goals: Goal[];
  sessions: Session[];
  habits: Habit[];
  checkIns: CheckIn[];
};
