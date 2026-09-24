import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Button, Heading } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

type Props = {
  visible: boolean;
  title: string;
  initialValue: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
};

/** Cross-platform text prompt (Alert.prompt is iOS-only). */
export function TextPrompt({
  visible,
  title,
  initialValue,
  confirmLabel = 'Save',
  onCancel,
  onConfirm,
}: Props) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  const submit = () => {
    if (value.trim()) onConfirm(value.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityLabel="Dismiss"
        />
        <View style={styles.card} accessibilityViewIsModal>
          <Heading>{title}</Heading>
          <TextInput
            value={value}
            onChangeText={setValue}
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
            onSubmitEditing={submit}
            maxLength={80}
            style={styles.input}
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={title}
          />
          <View style={styles.row}>
            <Button label="Cancel" variant="secondary" onPress={onCancel} style={styles.flex} />
            <Button
              label={confirmLabel}
              onPress={submit}
              disabled={!value.trim()}
              style={styles.flex}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  input: {
    backgroundColor: colors.background,
    color: colors.text,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    fontSize: 16,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
