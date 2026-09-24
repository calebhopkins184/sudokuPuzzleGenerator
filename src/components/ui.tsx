import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { MIN_TOUCH, colors, radius, spacing, type } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type TextProps = {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export function Title({ children, style, numberOfLines }: TextProps) {
  return (
    <Text accessibilityRole="header" numberOfLines={numberOfLines} style={[styles.title, style]}>
      {children}
    </Text>
  );
}

export function Heading({ children, style, numberOfLines }: TextProps) {
  return (
    <Text numberOfLines={numberOfLines} style={[styles.heading, style]}>
      {children}
    </Text>
  );
}

export function Body({ children, style, numberOfLines }: TextProps) {
  return (
    <Text numberOfLines={numberOfLines} style={[styles.body, style]}>
      {children}
    </Text>
  );
}

export function Caption({ children, style, numberOfLines }: TextProps) {
  return (
    <Text numberOfLines={numberOfLines} style={[styles.caption, style]}>
      {children}
    </Text>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled,
  loading,
  style,
  accessibilityHint,
}: ButtonProps) {
  const bg = {
    primary: colors.accent,
    secondary: colors.surfaceRaised,
    ghost: 'transparent',
    danger: colors.surfaceRaised,
  }[variant];
  const fg =
    variant === 'danger' ? colors.danger : variant === 'primary' ? colors.accentText : colors.text;
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: inactive ? 0.5 : pressed ? 0.75 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={20} color={fg} /> : null}
          <Text style={[styles.buttonLabel, { color: fg }]} numberOfLines={1}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

type IconButtonProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  size?: number;
  disabled?: boolean;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Icon-only button with a 44pt hit area and a required accessibility label. */
export function IconButton({
  icon,
  label,
  onPress,
  color = colors.text,
  size = 24,
  disabled,
  active,
  style,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.iconButton,
        active && { backgroundColor: colors.surfaceRaised },
        { opacity: disabled ? 0.35 : pressed ? 0.6 : 1 },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

type StateProps = {
  icon: IconName;
  title: string;
  message?: string;
  children?: ReactNode;
  tone?: 'neutral' | 'error' | 'warning';
};

/** Shared layout for empty, error, permission and offline states. */
export function StateView({ icon, title, message, children, tone = 'neutral' }: StateProps) {
  const iconColor =
    tone === 'error' ? colors.danger : tone === 'warning' ? colors.warning : colors.textMuted;
  return (
    <View style={styles.state} accessibilityRole="summary">
      <Ionicons name={icon} size={44} color={iconColor} />
      <Heading style={styles.center}>{title}</Heading>
      {message ? <Body style={[styles.center, { color: colors.textMuted }]}>{message}</Body> : null}
      {children ? <View style={styles.stateActions}>{children}</View> : null}
    </View>
  );
}

export function LoadingOverlay({ visible, message }: { visible: boolean; message: string }) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay} accessibilityViewIsModal accessibilityLiveRegion="polite">
        <View style={styles.overlayCard}>
          <ActivityIndicator size="large" color={colors.text} />
          <Body>{message}</Body>
        </View>
      </View>
    </Modal>
  );
}

export function Banner({
  icon,
  message,
  tone = 'warning',
}: {
  icon: IconName;
  message: string;
  tone?: 'warning' | 'error';
}) {
  const color = tone === 'error' ? colors.danger : colors.warning;
  return (
    <View style={[styles.banner, { borderColor: color }]} accessibilityRole="alert">
      <Ionicons name={icon} size={18} color={color} />
      <Caption style={{ flex: 1, color: colors.text }}>{message}</Caption>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...type.title, color: colors.text },
  heading: { ...type.heading, color: colors.text },
  body: { ...type.body, color: colors.text },
  caption: { ...type.caption, color: colors.textMuted },
  center: { textAlign: 'center' },
  button: {
    minHeight: MIN_TOUCH,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonLabel: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
  iconButton: {
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  stateActions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.sm },
  overlay: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 200,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
});
