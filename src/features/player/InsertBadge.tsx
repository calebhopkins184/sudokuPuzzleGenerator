import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { formatTime } from '@/lib/time';
import { colors, radius, spacing } from '@/theme';

import type { Mode } from './engine';

/** Shows that a replay/slow-mo insert is running and offers an immediate return. */
export function InsertBadge({ mode, onReturn }: { mode: Mode; onReturn: (t: number) => void }) {
  if (mode.kind !== 'insert') return null;
  const label = mode.variant === 'slow' ? 'Slow-mo' : 'Replay';
  return (
    <Pressable
      onPress={() => onReturn(mode.returnTo)}
      style={styles.badge}
      accessibilityRole="button"
      accessibilityLabel={`${label} playing. Tap to return to ${formatTime(mode.returnTo)} now`}
      accessibilityLiveRegion="polite"
    >
      <Ionicons
        name={mode.variant === 'slow' ? 'timer-outline' : 'refresh'}
        size={16}
        color={colors.background}
      />
      <Text style={styles.text}>
        {label} · back to {formatTime(mode.returnTo, true)}
      </Text>
      <Ionicons name="play-skip-forward" size={14} color={colors.background} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.replay,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    minHeight: 36,
  },
  text: { color: colors.background, fontWeight: '700', fontSize: 13 },
});
