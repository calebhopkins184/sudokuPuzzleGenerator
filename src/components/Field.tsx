import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Caption, IconButton } from '@/components/ui';
import { formatTime } from '@/lib/time';
import { colors, radius, spacing, type } from '@/theme';

export function Field({ label, style, multiline, ...rest }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Caption>{label}</Caption>
      <TextInput
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        accessibilityLabel={label}
        style={[styles.input, multiline && styles.multiline, style]}
        {...rest}
      />
    </View>
  );
}

/** Timestamp with fine adjustment, so a note can land on the exact frame of a takedown. */
export function TimeAdjuster({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (t: number) => void;
}) {
  const nudge = (d: number) => onChange(Math.min(max || Infinity, Math.max(0, value + d)));
  return (
    <View style={styles.adjuster}>
      <Caption>At</Caption>
      <IconButton icon="remove" label="One second earlier" onPress={() => nudge(-1)} />
      <IconButton
        icon="chevron-back"
        label="A tenth of a second earlier"
        onPress={() => nudge(-0.1)}
      />
      <Caption style={styles.time}>{formatTime(value, true)}</Caption>
      <IconButton
        icon="chevron-forward"
        label="A tenth of a second later"
        onPress={() => nudge(0.1)}
      />
      <IconButton icon="add" label="One second later" onPress={() => nudge(1)} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
    fontSize: 16,
  },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  adjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  time: { ...type.mono, color: colors.text, minWidth: 64, textAlign: 'center' },
});
