import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Body, Card, Muted, Pill, ProgressBar } from '@/components/ui';
import type { Goal } from '@/data/types';
import { formatDate } from '@/lib/dates';
import { goalProgress } from '@/store/CoachingStore';

export function GoalCard({ goal }: { goal: Goal }) {
  const progress = goalProgress(goal);
  return (
    <Link href={{ pathname: '/goal/[id]', params: { id: goal.id } }} asChild>
      <Pressable>
        <Card>
          <View style={styles.header}>
            <Body style={styles.title}>{goal.title}</Body>
            <Pill label={goal.category} />
          </View>
          <ProgressBar value={progress} />
          <Muted>
            {Math.round(progress * 100)}% complete · Target {formatDate(goal.targetDate)}
          </Muted>
        </Card>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { fontWeight: '600', flex: 1 },
});
