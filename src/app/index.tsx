import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TextPrompt } from '@/components/TextPrompt';
import { Body, Button, Caption, IconButton, StateView } from '@/components/ui';
import { mediaExists, mediaUri } from '@/features/media/mediaFiles';
import { useSessions } from '@/features/sessions/SessionsStore';
import type { Session } from '@/features/sessions/types';
import { formatDate, formatTime } from '@/lib/time';
import { colors, radius, spacing } from '@/theme';

function SessionRow({ session, onMore }: { session: Session; onMore: () => void }) {
  const main = session.mainMediaId ? session.media[session.mainMediaId] : undefined;
  const missing = main ? !mediaExists(main.fileName) : false;
  const thumb =
    main?.thumbFileName && mediaExists(main.thumbFileName) ? mediaUri(main.thumbFileName) : null;
  const marks = session.annotations.length + session.clips.length;

  const details = [
    formatDate(session.updatedAt),
    main?.durationSec ? formatTime(main.durationSec) : main ? null : 'No footage',
    marks ? `${marks} mark${marks === 1 ? '' : 's'}` : null,
  ].filter(Boolean);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/session/[id]', params: { id: session.id } })}
      onLongPress={onMore}
      accessibilityRole="button"
      accessibilityLabel={`${session.title}, ${details.join(', ')}${missing ? ', footage missing' : ''}`}
      accessibilityHint="Opens the session. Long press for rename and delete."
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceRaised }]}
    >
      <View style={styles.thumb}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <Ionicons name="film-outline" size={26} color={colors.textMuted} />
        )}
      </View>
      <View style={styles.rowText}>
        <Body numberOfLines={2} style={{ fontWeight: '600' }}>
          {session.title}
        </Body>
        <Caption numberOfLines={1}>{details.join(' · ')}</Caption>
        {missing ? (
          <Caption style={{ color: colors.warning }}>Footage not found on this device</Caption>
        ) : null}
      </View>
      <IconButton
        icon="ellipsis-horizontal"
        label={`More options for ${session.title}`}
        onPress={onMore}
      />
    </Pressable>
  );
}

export default function SessionsScreen() {
  const { state, dispatch } = useSessions();
  const insets = useSafeAreaInsets();
  const [renaming, setRenaming] = useState<Session | null>(null);

  const sessions = useMemo(
    () => [...state.sessions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [state.sessions],
  );

  const confirmDelete = (session: Session) =>
    Alert.alert(
      `Delete “${session.title}”?`,
      'Its notes, links, clips and the footage copied into Mat Review will be removed from this device. Originals in your photo library are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch({ type: 'deleteSession', sessionId: session.id }),
        },
      ],
    );

  const showMore = (session: Session) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: session.title,
          options: ['Rename', 'Delete', 'Cancel'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 2,
        },
        (index) => {
          if (index === 0) setRenaming(session);
          if (index === 1) confirmDelete(session);
        },
      );
    } else {
      Alert.alert(session.title, undefined, [
        { text: 'Rename', onPress: () => setRenaming(session) },
        { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(session) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton
              icon="settings-outline"
              label="Settings"
              onPress={() => router.push('/settings')}
            />
          ),
        }}
      />
      {sessions.length === 0 ? (
        <StateView
          icon="videocam-outline"
          title="No sessions yet"
          message="Create a session, then import match footage or record it. Everything stays on this device."
        >
          <Button label="New session" icon="add" onPress={() => router.push('/session/new')} />
        </StateView>
      ) : (
        <>
          <FlatList
            data={sessions}
            keyExtractor={(s) => s.id}
            renderItem={({ item }) => <SessionRow session={item} onMore={() => showMore(item)} />}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={{ paddingBottom: 96 + insets.bottom }}
            contentInsetAdjustmentBehavior="automatic"
          />
          <View style={[styles.fabWrap, { bottom: insets.bottom + spacing.lg }]}>
            <Button label="New session" icon="add" onPress={() => router.push('/session/new')} />
          </View>
        </>
      )}
      <TextPrompt
        visible={renaming !== null}
        title="Rename session"
        initialValue={renaming?.title ?? ''}
        onCancel={() => setRenaming(null)}
        onConfirm={(title) => {
          if (renaming) dispatch({ type: 'renameSession', sessionId: renaming.id, title });
          setRenaming(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  thumb: {
    width: 88,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rowText: { flex: 1, gap: 2 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 116 },
  fabWrap: { position: 'absolute', left: spacing.lg, right: spacing.lg },
});
