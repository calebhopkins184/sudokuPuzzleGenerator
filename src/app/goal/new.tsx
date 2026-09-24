import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TextField } from '@/components/TextField';
import { Button, Muted, Screen } from '@/components/ui';
import { radius, spacing, useColors } from '@/constants/theme';
import { GOAL_CATEGORIES, type GoalCategory } from '@/data/types';
import { addDays, toDateKey } from '@/lib/dates';
import { createId } from '@/lib/id';
import { useCoaching } from '@/store/CoachingStore';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default function NewGoalScreen() {
  const { dispatch } = useCoaching();
  const colors = useColors();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('Fitness');
  const [targetDate, setTargetDate] = useState(toDateKey(addDays(new Date(), 30)));
  const [milestones, setMilestones] = useState('');

  const valid = title.trim().length > 0 && DATE_PATTERN.test(targetDate);

  const save = () => {
    dispatch({
      type: 'addGoal',
      goal: {
        title: title.trim(),
        description: description.trim(),
        category,
        targetDate,
        milestones: milestones
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => ({ id: createId('milestone'), title: line, done: false })),
      },
    });
    router.back();
  };

  return (
    <Screen>
      <TextField
        label="Goal"
        placeholder="e.g. Run a half marathon"
        value={title}
        onChangeText={setTitle}
      />
      <TextField
        label="Why it matters"
        placeholder="Optional"
        multiline
        value={description}
        onChangeText={setDescription}
      />

      <View style={styles.categories}>
        {GOAL_CATEGORIES.map((c) => {
          const selected = c === category;
          return (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? colors.primary : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={{ color: selected ? colors.primaryText : colors.text, fontWeight: '600' }}
              >
                {c}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextField
        label="Target date (YYYY-MM-DD)"
        value={targetDate}
        onChangeText={setTargetDate}
        autoCapitalize="none"
        keyboardType="numbers-and-punctuation"
      />
      <TextField
        label="Milestones"
        placeholder={'One per line\nRun 5K\nRun 10K'}
        multiline
        value={milestones}
        onChangeText={setMilestones}
      />
      <Muted>Break the goal into small steps — each one you tick off moves the progress bar.</Muted>
      <Button label="Create goal" onPress={save} disabled={!valid} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
