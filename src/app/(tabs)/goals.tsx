import { router } from 'expo-router';

import { GoalCard } from '@/components/GoalCard';
import { Button, Card, Muted, Screen } from '@/components/ui';
import { useCoaching } from '@/store/CoachingStore';

export default function GoalsScreen() {
  const { data } = useCoaching();
  return (
    <Screen>
      <Button label="+ New goal" onPress={() => router.push('/goal/new')} />
      {data.goals.length === 0 ? (
        <Card>
          <Muted>No goals yet. Add one to start tracking your progress.</Muted>
        </Card>
      ) : (
        data.goals.map((goal) => <GoalCard key={goal.id} goal={goal} />)
      )}
    </Screen>
  );
}
