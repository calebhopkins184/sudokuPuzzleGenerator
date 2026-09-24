import { Image } from 'expo-image';
import { useNetworkState } from 'expo-network';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Banner, Body, Button, Caption } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

import { SearchError, searchBaseUrl, searchYouTube, type YouTubeResult } from './search';

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; results: YouTubeResult[] }
  | { kind: 'error'; message: string };

export function YouTubeSearch({ onSelect }: { onSelect: (result: YouTubeResult) => void }) {
  const network = useNetworkState();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const requestId = useRef(0);

  const configured = searchBaseUrl() !== null;
  // Treat "unknown" as online; only a definite false means offline.
  const offline = network.isConnected === false || network.isInternetReachable === false;

  const run = async () => {
    const q = query.trim();
    if (!q) return;
    const id = ++requestId.current;
    setStatus({ kind: 'loading' });
    try {
      const results = await searchYouTube(q);
      if (id === requestId.current) setStatus({ kind: 'done', results });
    } catch (error) {
      if (id !== requestId.current) return;
      setStatus({
        kind: 'error',
        message: error instanceof SearchError ? error.message : 'Search failed. Try again.',
      });
    }
  };

  if (!configured) {
    return (
      <Banner
        icon="search-outline"
        message="YouTube search isn’t set up for this build. You can still paste any link below."
      />
    );
  }

  return (
    <View style={styles.wrap}>
      {offline ? (
        <Banner
          icon="cloud-offline-outline"
          message="You’re offline. Search needs a connection — you can still paste a link."
        />
      ) : null}
      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search YouTube (e.g. single leg finish)"
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          onSubmitEditing={() => void run()}
          style={styles.input}
          accessibilityLabel="Search YouTube"
          autoCorrect={false}
        />
        <Button
          label="Search"
          onPress={() => void run()}
          disabled={!query.trim() || offline}
          loading={status.kind === 'loading'}
        />
      </View>

      {status.kind === 'loading' ? <ActivityIndicator color={colors.text} /> : null}
      {status.kind === 'error' ? (
        <Banner icon="warning-outline" tone="error" message={status.message} />
      ) : null}
      {status.kind === 'done' && status.results.length === 0 ? (
        <Caption>No videos found. Try different words.</Caption>
      ) : null}
      {status.kind === 'done'
        ? status.results.map((r) => {
            const selected = r.videoId === selectedId;
            return (
              <Pressable
                key={r.videoId}
                onPress={() => {
                  setSelectedId(r.videoId);
                  onSelect(r);
                }}
                style={[styles.result, selected && styles.resultSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${r.title}${r.channelTitle ? `, ${r.channelTitle}` : ''}`}
                accessibilityHint="Fills in the link and title"
              >
                <View style={styles.thumb}>
                  {r.thumbnailUrl ? (
                    <Image
                      source={{ uri: r.thumbnailUrl }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                    />
                  ) : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Body numberOfLines={2}>{r.title}</Body>
                  {r.channelTitle ? <Caption numberOfLines={1}>{r.channelTitle}</Caption> : null}
                </View>
              </Pressable>
            );
          })
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  searchRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    fontSize: 16,
  },
  result: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  resultSelected: { borderColor: colors.link },
  thumb: {
    width: 96,
    height: 54,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
});
