import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { TextField } from '@/components/TextField';
import { Body, Button, Card, Muted, SectionHeader, Screen, Title } from '@/components/ui';
import { formatDate, formatTime } from '@/lib/dates';
import { useCoaching } from '@/store/CoachingStore';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, dispatch } = useCoaching();
  const session = data.sessions.find((s) => s.id === id);
  const [notes, setNotes] = useState(session?.notes ?? '');

  if (!session) {
    return (
      <Screen>
        <Muted>This session no longer exists.</Muted>
      </Screen>
    );
  }

  const dirty = notes !== session.notes;

  return (
    <Screen>
      <Stack.Screen options={{ title: session.title }} />
      <Title>{session.title}</Title>
      <Muted>
        {formatDate(session.startsAt)} · {formatTime(session.startsAt)} · {session.durationMinutes}{' '}
        min · {session.location}
      </Muted>

      <SectionHeader title="Agenda" />
      <Card>
        {session.agenda.map((item) => (
          <Body key={item}>• {item}</Body>
        ))}
      </Card>

      <SectionHeader title="Notes" />
      <TextField
        label="Your notes"
        placeholder="Takeaways, action items, questions for next time…"
        multiline
        value={notes}
        onChangeText={setNotes}
      />
      <Button
        label="Save notes"
        disabled={!dirty}
        onPress={() => dispatch({ type: 'updateSessionNotes', sessionId: session.id, notes })}
      />
    </Screen>
  );
}
