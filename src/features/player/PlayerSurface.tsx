import { VideoView } from 'expo-video';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Button, StateView } from '@/components/ui';
import { colors } from '@/theme';

import type { MainPlayer } from './useMainPlayer';

type Props = {
  main: MainPlayer;
  style?: StyleProp<ViewStyle>;
  /** Rendered above the video (e.g. inserted-clip overlay, replay badge). */
  children?: ReactNode;
};

export function PlayerSurface({ main, style, children }: Props) {
  const { player, status, error, togglePlay, retry, isPlaying } = main;

  return (
    <View style={[styles.frame, style]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
        allowsPictureInPicture={false}
      />
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={togglePlay}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause video' : 'Play video'}
      />
      {status === 'loading' || status === 'idle' ? (
        <View style={styles.center} pointerEvents="none">
          <ActivityIndicator color={colors.text} size="large" accessibilityLabel="Loading video" />
        </View>
      ) : null}
      {status === 'error' ? (
        <View style={[StyleSheet.absoluteFill, styles.errorBg]}>
          <StateView
            icon="warning-outline"
            tone="error"
            title="This video can’t be played"
            message={error ?? 'The file may be damaged or in an unsupported format.'}
          >
            <Button label="Retry" onPress={retry} />
          </StateView>
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { backgroundColor: '#000', overflow: 'hidden' },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  errorBg: { backgroundColor: colors.background },
});
