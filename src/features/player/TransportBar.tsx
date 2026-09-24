import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/components/ui';
import { formatTime } from '@/lib/time';
import { MIN_TOUCH, colors, radius, spacing, type } from '@/theme';

import { PLAYBACK_RATES, type MainPlayer } from './useMainPlayer';

export function TimeReadout({ time, duration }: { time: number; duration: number }) {
  return (
    <Text style={styles.time} accessibilityLabel={`${formatTime(time)} of ${formatTime(duration)}`}>
      {formatTime(time, true)} <Text style={styles.total}>/ {formatTime(duration)}</Text>
    </Text>
  );
}

export function TransportBar({ main, disabled }: { main: MainPlayer; disabled?: boolean }) {
  const { isPlaying, togglePlay, skip, stepFrame } = main;
  return (
    <View style={styles.row}>
      <IconButton
        icon="play-skip-back-outline"
        label="Back one frame"
        onPress={() => stepFrame(-1)}
        disabled={disabled}
      />
      <IconButton
        icon="play-back-outline"
        label="Back 5 seconds"
        onPress={() => skip(-5)}
        disabled={disabled}
      />
      <IconButton
        icon={isPlaying ? 'pause' : 'play'}
        label={isPlaying ? 'Pause' : 'Play'}
        onPress={togglePlay}
        size={34}
        disabled={disabled}
        style={styles.play}
      />
      <IconButton
        icon="play-forward-outline"
        label="Forward 5 seconds"
        onPress={() => skip(5)}
        disabled={disabled}
      />
      <IconButton
        icon="play-skip-forward-outline"
        label="Forward one frame"
        onPress={() => stepFrame(1)}
        disabled={disabled}
      />
    </View>
  );
}

export function RatePicker({ main, disabled }: { main: MainPlayer; disabled?: boolean }) {
  return (
    <View style={styles.rates} accessibilityRole="radiogroup" accessibilityLabel="Playback speed">
      {PLAYBACK_RATES.map((r) => {
        const selected = main.rate === r;
        return (
          <Pressable
            key={r}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
            accessibilityLabel={`${r} times speed`}
            disabled={disabled}
            onPress={() => main.setRate(r)}
            hitSlop={{ top: 6, bottom: 6 }}
            style={[styles.rate, selected && styles.rateSelected]}
          >
            <Text style={[styles.rateText, selected && { color: colors.background }]}>{r}×</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  play: { minWidth: 60, minHeight: 60, borderRadius: 30, backgroundColor: colors.surfaceRaised },
  time: { ...type.mono, color: colors.text },
  total: { color: colors.textMuted },
  rates: { flexDirection: 'row', gap: spacing.xs },
  rate: {
    minWidth: MIN_TOUCH,
    minHeight: 32,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  rateSelected: { backgroundColor: colors.text },
  rateText: { color: colors.text, fontWeight: '600', fontSize: 13 },
});
