import { SessionCard } from '@/components/SessionCard';
import { Card, Muted, SectionHeader, Screen } from '@/components/ui';
import { useCoaching } from '@/store/CoachingStore';

export default function SessionsScreen() {
  const { data } = useCoaching();
  const now = Date.now();
  const sorted = [...data.sessions].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const upcoming = sorted.filter((s) => new Date(s.startsAt).getTime() >= now);
  const past = sorted.filter((s) => new Date(s.startsAt).getTime() < now).reverse();

  return (
    <Screen>
      <SectionHeader title="Upcoming" />
      {upcoming.length === 0 ? (
        <Card>
          <Muted>Nothing scheduled.</Muted>
        </Card>
      ) : (
        upcoming.map((s) => <SessionCard key={s.id} session={s} />)
      )}

      <SectionHeader title="Past" />
      {past.length === 0 ? (
        <Card>
          <Muted>No past sessions yet.</Muted>
        </Card>
      ) : (
        past.map((s) => <SessionCard key={s.id} session={s} />)
      )}
    </Screen>
  );
}
