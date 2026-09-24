import Constants from 'expo-constants';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Body, Caption, Heading } from '@/components/ui';
import { formatBytes, mediaUsageBytes } from '@/features/media/mediaFiles';
import { useSessions } from '@/features/sessions/SessionsStore';
import { REPLAY_WINDOWS, SLOW_RATES } from '@/features/sessions/types';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';

function Segmented<T extends number>({
  options,
  value,
  format,
  onChange,
  label,
}: {
  options: readonly T[];
  value: T;
  format: (v: T) => string;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <View style={styles.segmented} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option)}
            style={[styles.segment, selected && { backgroundColor: colors.accent }]}
          >
            <Text style={[styles.segmentText, selected && { color: colors.accentText }]}>
              {format(option)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ToggleRow({
  title,
  detail,
  value,
  onChange,
}: {
  title: string;
  detail: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1, gap: 2 }}>
        <Body>{title}</Body>
        <Caption>{detail}</Caption>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={title}
        trackColor={{ true: colors.accent }}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const { state, dispatch } = useSessions();
  const { settings } = state;
  const update = (partial: Partial<typeof settings>) =>
    dispatch({ type: 'updateSettings', settings: partial });
  const usage = useMemo(() => formatBytes(mediaUsageBytes()), [state.sessions]);

  return (
    <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
      <Heading>Replay</Heading>
      <Caption>
        How far back Replay and Slow-mo rewind before returning to the moment you tapped.
      </Caption>
      <Segmented
        label="Replay window"
        options={REPLAY_WINDOWS}
        value={settings.replayWindowSec}
        format={(v) => `${v}s`}
        onChange={(replayWindowSec) => update({ replayWindowSec })}
      />
      <Caption>Slow-motion speed</Caption>
      <Segmented
        label="Slow-motion speed"
        options={SLOW_RATES}
        value={settings.slowRate}
        format={(v) => `${v}×`}
        onChange={(slowRate) => update({ slowRate })}
      />

      <Heading style={styles.section}>Playback</Heading>
      <ToggleRow
        title="Auto-play inserted clips"
        detail="Play attached clips when playback reaches their moment, then return."
        value={settings.autoPlayClips}
        onChange={(autoPlayClips) => update({ autoPlayClips })}
      />

      <Heading style={styles.section}>Import</Heading>
      <ToggleRow
        title="Compress new recordings"
        detail="Records at medium quality to save space. If compression isn't supported for an import, you'll be asked before continuing."
        value={settings.compressOnImport}
        onChange={(compressOnImport) => update({ compressOnImport })}
      />

      <Heading style={styles.section}>Storage</Heading>
      <Body>Footage stored in Mat Review: {usage}</Body>
      <Caption>
        All sessions and footage live only on this device. Deleting the app deletes them.
      </Caption>

      <Caption style={styles.section}>
        Mat Review {Constants.expoConfig?.version ?? ''} (
        {Constants.expoConfig?.ios?.buildNumber ?? '—'})
      </Caption>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  section: { marginTop: spacing.lg },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    minHeight: MIN_TOUCH - 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  segmentText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: MIN_TOUCH },
});
