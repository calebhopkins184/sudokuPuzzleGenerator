import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { GoalCard } from '@/components/GoalCard';
import { SessionCard } from '@/components/SessionCard';
import { Body, Card, CheckRow, Muted, SectionHeader, Screen, Title } from '@/components/ui';
import { spacing, useColors } from '@/constants/theme';
import { currentStreak, greeting, toDateKey } from '@/lib/dates';
import { useCoaching } from '@/store/CoachingStore';

export default function TodayScreen() {
  const { data, dispatch } = useCoaching();
  const colors = useColors();
  const today = toDateKey();

  const nextSession = data.sessions
    .filter((s) => new Date(s.startsAt).getTime() > Date.now())
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];

  const doneToday = data.habits.filter((h) => h.completedOn.includes(today)).length;
  const checkedInToday = data.checkIns.some((c) => c.date === today);

  return (
    <Screen>
      <View>
        <Title>
          {greeting()}, {data.clientName}
        </Title>
        <Muted>
          {doneToday}/{data.habits.length} habits done today
          {checkedInToday ? ' · Checked in ✓' : ''}
        </Muted>
      </View>

      <SectionHeader title="Next session" />
      {nextSession ? (
        <SessionCard session={nextSession} />
      ) : (
        <Card>
          <Muted>No upcoming sessions. Reach out to your coach to book one.</Muted>
        </Card>
      )}

      <SectionHeader title="Daily habits" />
      <Card>
        {data.habits.map((habit) => (
          <CheckRow
            key={habit.id}
            label={habit.title}
            checked={habit.completedOn.includes(today)}
            onToggle={() => dispatch({ type: 'toggleHabit', habitId: habit.id, date: today })}
            trailing={<Muted>🔥 {currentStreak(habit.completedOn)}</Muted>}
          />
        ))}
      </Card>

      {!checkedInToday && (
        <Link href="/check-in" asChild>
          <Pressable>
            <Card style={[styles.cta, { backgroundColor: colors.primary }]}>
              <Body style={{ color: colors.primaryText, fontWeight: '600' }}>
                How are you feeling today? Tap to check in →
              </Body>
            </Card>
          </Pressable>
        </Link>
      )}

      <SectionHeader title="Active goals" />
      {data.goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cta: { borderWidth: 0, gap: spacing.xs },
});
