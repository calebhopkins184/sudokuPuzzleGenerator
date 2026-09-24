import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { Field, TimeAdjuster } from '@/components/Field';
import { Button, Caption, StateView } from '@/components/ui';
import type { ImportSource } from '@/features/media/importVideo';
import { useVideoImport } from '@/features/media/useVideoImport';
import { useSession, useSessions } from '@/features/sessions/SessionsStore';
import { createId } from '@/lib/id';
import { spacing } from '@/theme';

export default function InsertClipScreen() {
  const { id, t } = useLocalSearchParams<{ id: string; t?: string }>();
  const session = useSession(id);
  const { dispatch } = useSessions();
  const { importVideo, busy, overlay } = useVideoImport();
  const [timeSec, setTimeSec] = useState(() => Math.max(0, Number(t) || 0));
  const [label, setLabel] = useState(() => `Clip ${(session?.clips.length ?? 0) + 1}`);

  if (!session) return <StateView icon="alert-circle-outline" title="Session not found" />;
  const duration = session.mainMediaId ? (session.media[session.mainMediaId]?.durationSec ?? 0) : 0;

  const add = async (source: ImportSource) => {
    const media = await importVideo(source);
    if (!media) return;
    dispatch({
      type: 'addClip',
      sessionId: session.id,
      media,
      clip: {
        id: createId('clip'),
        timeSec,
        mediaId: media.id,
        label: label.trim() || 'Clip',
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
        <Caption>
          The clip plays when the match reaches this moment (or when you tap it), then playback
          returns here.
        </Caption>
        <TimeAdjuster value={timeSec} max={duration} onChange={setTimeSec} />
        <Field
          label="Label"
          placeholder="e.g. Drill: high-crotch finish"
          value={label}
          onChangeText={setLabel}
          maxLength={80}
        />
        <Button
          label="Choose clip from library"
          icon="images-outline"
          onPress={() => void add('library')}
          disabled={busy}
        />
        <Button
          label="Record clip"
          icon="videocam-outline"
          variant="secondary"
          onPress={() => void add('camera')}
          disabled={busy}
        />
      </ScrollView>
      {overlay}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
});
