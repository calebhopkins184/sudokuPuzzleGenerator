import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { TextField } from '@/components/TextField';
import { Body, Button, Card, Muted, SectionHeader, Screen } from '@/components/ui';
import { radius, spacing, useColors } from '@/constants/theme';
import { formatDate, toDateKey } from '@/lib/dates';
import { useCoaching } from '@/store/CoachingStore';

const MOODS = ['😞', '😕', '😐', '🙂', '😄'];
const ENERGY = ['1', '2', '3', '4', '5'];

function Scale({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: number;
  onChange: (value: number) => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.scale}>
      {options.map((label, i) => {
        const selected = value === i + 1;
        return (
          <Pressable
            key={label}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(i + 1)}
            style={[
              styles.scaleItem,
              {
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.track : colors.surface,
              },
            ]}
          >
            <Text style={[styles.scaleLabel, { color: colors.text }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function CheckInScreen() {
  const { data, dispatch } = useCoaching();
  const today = toDateKey();
  const existing = data.checkIns.find((c) => c.date === today);

  const [mood, setMood] = useState(existing?.mood ?? 3);
  const [energy, setEnergy] = useState(existing?.energy ?? 3);
  const [reflection, setReflection] = useState(existing?.reflection ?? '');

  const save = () => {
    dispatch({
      type: 'saveCheckIn',
      checkIn: { date: today, mood, energy, reflection: reflection.trim() },
    });
    Alert.alert('Check-in saved', 'Your coach will see this before your next session.');
  };

  const history = data.checkIns.filter((c) => c.date !== today).slice(0, 14);

  return (
    <Screen>
      <Card>
        <Body style={styles.label}>Mood</Body>
        <Scale options={MOODS} value={mood} onChange={setMood} />
        <Body style={styles.label}>Energy</Body>
        <Scale options={ENERGY} value={energy} onChange={setEnergy} />
        <TextField
          label="Reflection"
          placeholder="Wins, struggles, anything on your mind…"
          multiline
          value={reflection}
          onChangeText={setReflection}
        />
        <Button label={existing ? 'Update check-in' : 'Save check-in'} onPress={save} />
      </Card>

      {history.length > 0 && <SectionHeader title="Recent check-ins" />}
      {history.map((c) => (
        <Card key={c.id}>
          <Body style={styles.label}>
            {formatDate(c.date)} · {MOODS[c.mood - 1]} · Energy {c.energy}/5
          </Body>
          {c.reflection ? <Muted>{c.reflection}</Muted> : null}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '600' },
  scale: { flexDirection: 'row', gap: spacing.sm },
  scaleItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1.5,
  },
  scaleLabel: { fontSize: 20 },
});
