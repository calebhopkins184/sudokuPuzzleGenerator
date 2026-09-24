import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { Field, TimeAdjuster } from '@/components/Field';
import { Button, StateView } from '@/components/ui';
import { useSession, useSessions } from '@/features/sessions/SessionsStore';
import { createId } from '@/lib/id';
import { spacing } from '@/theme';

export default function AddNoteScreen() {
  const { id, t } = useLocalSearchParams<{ id: string; t?: string }>();
  const session = useSession(id);
  const { dispatch } = useSessions();
  const [timeSec, setTimeSec] = useState(() => Math.max(0, Number(t) || 0));
  const [text, setText] = useState('');

  if (!session) return <StateView icon="alert-circle-outline" title="Session not found" />;
  const duration = session.mainMediaId ? (session.media[session.mainMediaId]?.durationSec ?? 0) : 0;

  const save = () => {
    dispatch({
      type: 'addAnnotation',
      sessionId: session.id,
      annotation: {
        id: createId('note'),
        kind: 'note',
        timeSec,
        text: text.trim(),
        createdAt: new Date().toISOString(),
      },
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TimeAdjuster value={timeSec} max={duration} onChange={setTimeSec} />
        <Field
          label="Note"
          placeholder="e.g. Level change too high — hips back, head up."
          value={text}
          onChangeText={setText}
          multiline
          autoFocus
          maxLength={1000}
        />
        <Button label="Save note" icon="checkmark" onPress={save} disabled={!text.trim()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
});
