import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Body, Card, Muted } from '@/components/ui';
import { spacing, useColors } from '@/constants/theme';
import type { Session } from '@/data/types';
import { formatDate, formatTime } from '@/lib/dates';

export function SessionCard({ session }: { session: Session }) {
  const colors = useColors();
  return (
    <Link href={{ pathname: '/session/[id]', params: { id: session.id } }} asChild>
      <Pressable>
        <Card style={styles.row}>
          <Ionicons name="calendar-outline" size={24} color={colors.primary} />
          <View style={styles.text}>
            <Body style={styles.title}>{session.title}</Body>
            <Muted>
              {formatDate(session.startsAt)} · {formatTime(session.startsAt)} ·{' '}
              {session.durationMinutes} min
            </Muted>
            <Muted>{session.location}</Muted>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Card>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { flex: 1, gap: 2 },
  title: { fontWeight: '600' },
});
