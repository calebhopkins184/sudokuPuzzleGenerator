import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { Field, TimeAdjuster } from '@/components/Field';
import { Button, Caption, StateView } from '@/components/ui';
import { useSession, useSessions } from '@/features/sessions/SessionsStore';
import { createId } from '@/lib/id';
import { hostOf, normalizeUrl } from '@/lib/url';
import { colors, spacing } from '@/theme';

export default function AddLinkScreen() {
  const { id, t } = useLocalSearchParams<{ id: string; t?: string }>();
  const session = useSession(id);
  const { dispatch } = useSessions();
  const [timeSec, setTimeSec] = useState(() => Math.max(0, Number(t) || 0));
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [source, setSource] = useState<'manual' | 'youtube'>('manual');

  if (!session) return <StateView icon="alert-circle-outline" title="Session not found" />;
  const duration = session.mainMediaId ? (session.media[session.mainMediaId]?.durationSec ?? 0) : 0;

  const normalized = normalizeUrl(url);
  const showUrlError = url.trim().length > 0 && !normalized;

  const save = () => {
    if (!normalized) return;
    dispatch({
      type: 'addAnnotation',
      sessionId: session.id,
      annotation: {
        id: createId('link'),
        kind: 'link',
        timeSec,
        url: normalized,
        title: title.trim() || hostOf(normalized),
        source,
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
          label="Link"
          placeholder="https://…"
          value={url}
          onChangeText={(v) => {
            setUrl(v);
            setSource('manual');
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          textContentType="URL"
        />
        {showUrlError ? (
          <Caption style={{ color: colors.danger }}>Enter a web address like youtube.com/…</Caption>
        ) : null}
        <Field
          label="Title (optional)"
          placeholder="e.g. Single-leg finish drill"
          value={title}
          onChangeText={setTitle}
          maxLength={200}
        />
        <Button label="Save link" icon="checkmark" onPress={save} disabled={!normalized} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
});
