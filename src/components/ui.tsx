import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { radius, spacing, useColors } from '@/constants/theme';

export function Screen({ children }: { children: ReactNode }) {
  const colors = useColors();
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}
    >
      {children}
    </View>
  );
}

type TextProps = { children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number };

export function Title({ children, style }: TextProps) {
  const colors = useColors();
  return <Text style={[styles.title, { color: colors.text }, style]}>{children}</Text>;
}

export function Heading({ children, style }: TextProps) {
  const colors = useColors();
  return <Text style={[styles.heading, { color: colors.text }, style]}>{children}</Text>;
}

export function Body({ children, style, numberOfLines }: TextProps) {
  const colors = useColors();
  return (
    <Text numberOfLines={numberOfLines} style={[styles.body, { color: colors.text }, style]}>
      {children}
    </Text>
  );
}

export function Muted({ children, style, numberOfLines }: TextProps) {
  const colors = useColors();
  return (
    <Text numberOfLines={numberOfLines} style={[styles.muted, { color: colors.textMuted }, style]}>
      {children}
    </Text>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Heading>{title}</Heading>
      {action}
    </View>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const colors = useColors();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={[styles.track, { backgroundColor: colors.track }]}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', disabled }: ButtonProps) {
  const colors = useColors();
  const bg =
    variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : colors.surface;
  const fg = variant === 'secondary' ? colors.text : colors.primaryText;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor: colors.border,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text style={[styles.buttonLabel, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

type IconName = ComponentProps<typeof Ionicons>['name'];

export function CheckRow({
  label,
  checked,
  onToggle,
  trailing,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  trailing?: ReactNode;
}) {
  const colors = useColors();
  const icon: IconName = checked ? 'checkmark-circle' : 'ellipse-outline';
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      style={styles.checkRow}
    >
      <Ionicons name={icon} size={26} color={checked ? colors.success : colors.textMuted} />
      <Body
        style={[
          { flex: 1 },
          checked && { textDecorationLine: 'line-through', color: colors.textMuted },
        ]}
      >
        {label}
      </Body>
      {trailing}
    </Pressable>
  );
}

export function Pill({ label }: { label: string }) {
  const colors = useColors();
  return (
    <View style={[styles.pill, { backgroundColor: colors.track }]}>
      <Text style={[styles.pillText, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: { fontSize: 28, fontWeight: '700' },
  heading: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22 },
  muted: { fontSize: 14, lineHeight: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  track: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  button: {
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  buttonLabel: { fontSize: 16, fontWeight: '600' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pillText: { fontSize: 12, fontWeight: '600' },
});
