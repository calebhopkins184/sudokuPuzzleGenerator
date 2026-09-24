import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Button, Caption } from '@/components/ui';
import type { ImportSource } from '@/features/media/importVideo';
import { useVideoImport } from '@/features/media/useVideoImport';
import { useSessions } from '@/features/sessions/SessionsStore';
import { colors, radius, spacing } from '@/theme';

function defaultTitle(): string {
  return `Match — ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

export default function NewSessionScreen() {
  const { createSession, dispatch, state } = useSessions();
  const { importVideo, busy, overlay } = useVideoImport();
  const [title, setTitle] = useState(defaultTitle);

  const open = (id: string) => router.replace({ pathname: '/session/[id]', params: { id } });

  // Import first so a canceled picker doesn't leave an empty session behind.
  const createWith = async (source: ImportSource) => {
    const media = await importVideo(source);
    if (!media) return;
    const session = createSession(title);
    dispatch({ type: 'setMainMedia', sessionId: session.id, media });
    open(session.id);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Caption>Session name</Caption>
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          maxLength={80}
          selectTextOnFocus
          placeholder="e.g. Finals vs. Central — 157"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Session name"
        />
        <View style={styles.actions}>
          <Button
            label="Choose from library"
            icon="images-outline"
            onPress={() => void createWith('library')}
            disabled={!title.trim() || busy}
          />
          <Button
            label="Record video"
            icon="videocam-outline"
            variant="secondary"
            onPress={() => void createWith('camera')}
            disabled={!title.trim() || busy}
          />
          <Button
            label="Create without footage"
            variant="ghost"
            onPress={() => open(createSession(title).id)}
            disabled={!title.trim() || busy}
          />
        </View>
        <Caption>
          Footage is copied into Mat Review and stays on this device.
          {state.settings.compressOnImport ? ' Compression is on (Settings).' : ''}
        </Caption>
      </ScrollView>
      {overlay}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    fontSize: 17,
  },
});
