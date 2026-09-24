import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

import {
  Body,
  Button,
  Card,
  CheckRow,
  Muted,
  Pill,
  ProgressBar,
  SectionHeader,
  Screen,
  Title,
} from '@/components/ui';
import { formatDate } from '@/lib/dates';
import { goalProgress, useCoaching } from '@/store/CoachingStore';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, dispatch } = useCoaching();
  const goal = data.goals.find((g) => g.id === id);

  if (!goal) {
    return (
      <Screen>
        <Muted>This goal no longer exists.</Muted>
      </Screen>
    );
  }

  const progress = goalProgress(goal);

  const confirmDelete = () =>
    Alert.alert('Delete goal?', `"${goal.title}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          dispatch({ type: 'deleteGoal', goalId: goal.id });
          router.back();
        },
      },
    ]);

  return (
    <Screen>
      <Stack.Screen options={{ title: goal.title }} />
      <Title>{goal.title}</Title>
      <Pill label={goal.category} />
      {goal.description ? <Body>{goal.description}</Body> : null}
      <Card>
        <ProgressBar value={progress} />
        <Muted>
          {Math.round(progress * 100)}% complete · Target {formatDate(goal.targetDate)}
        </Muted>
      </Card>

      <SectionHeader title="Milestones" />
      <Card>
        {goal.milestones.length === 0 ? (
          <Muted>No milestones.</Muted>
        ) : (
          goal.milestones.map((m) => (
            <CheckRow
              key={m.id}
              label={m.title}
              checked={m.done}
              onToggle={() =>
                dispatch({ type: 'toggleMilestone', goalId: goal.id, milestoneId: m.id })
              }
            />
          ))
        )}
      </Card>

      <Button label="Delete goal" variant="danger" onPress={confirmDelete} />
    </Screen>
  );
}
