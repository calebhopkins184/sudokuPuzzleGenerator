import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput } from 'react-native';

import { Button, Caption } from '@/components/ui';
import { useSessions } from '@/features/sessions/SessionsStore';
import { colors, radius, spacing } from '@/theme';

function defaultTitle(): string {
  return `Match — ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

export default function NewSessionScreen() {
  const { createSession } = useSessions();
  const [title, setTitle] = useState(defaultTitle);

  const createEmpty = () => {
    const session = createSession(title);
    router.replace({ pathname: '/session/[id]', params: { id: session.id } });
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
        <Button label="Create session" icon="add" onPress={createEmpty} disabled={!title.trim()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
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
