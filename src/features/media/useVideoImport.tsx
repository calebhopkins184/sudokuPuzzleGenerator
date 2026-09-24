import { useCallback, useState } from 'react';
import { Alert, Linking } from 'react-native';

import { LoadingOverlay } from '@/components/ui';
import { useSessions } from '@/features/sessions/SessionsStore';
import type { MediaRef } from '@/features/sessions/types';

import {
  compressionSupported,
  ensurePermission,
  importAsset,
  pickVideo,
  type ImportSource,
} from './importVideo';

type Choice = 'confirm' | 'cancel';

function ask(title: string, message: string, confirm: string, cancel = 'Cancel'): Promise<Choice> {
  return new Promise((resolve) =>
    Alert.alert(
      title,
      message,
      [
        { text: cancel, style: 'cancel', onPress: () => resolve('cancel') },
        { text: confirm, onPress: () => resolve('confirm') },
      ],
      { cancelable: true, onDismiss: () => resolve('cancel') },
    ),
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong while importing.';
}

/**
 * Orchestrates import/record with explicit user choices for every failure path:
 * permission denial, unsupported compression, picker errors and copy failures.
 */
export function useVideoImport() {
  const { state } = useSessions();
  const [busy, setBusy] = useState(false);

  const importVideo = useCallback(
    async (source: ImportSource): Promise<MediaRef | null> => {
      // 1. Permission
      const permission = await ensurePermission(source);
      if (permission !== 'granted') {
        if (permission === 'blocked') {
          const choice = await ask(
            'Camera access is off',
            'To record footage, allow Camera access for Mat Review in Settings. You can still import videos from your library.',
            'Open Settings',
            'Not now',
          );
          if (choice === 'confirm') void Linking.openSettings();
        } else {
          Alert.alert(
            'Camera access needed',
            'Mat Review needs the camera to record footage. You can try again or import from your library instead.',
          );
        }
        return null;
      }

      // 2. Compression: never silently substitute behavior.
      let compress = state.settings.compressOnImport;
      if (compress && !compressionSupported(source)) {
        const choice = await ask(
          'Compression not available',
          source === 'library'
            ? 'Videos chosen from your library can’t be compressed on import. Import the original file instead?'
            : 'Recording compression isn’t supported on this device. Record at full quality instead?',
          source === 'library' ? 'Import original' : 'Record full quality',
        );
        if (choice === 'cancel') return null;
        compress = false;
      }

      // 3. Pick or record
      let picked;
      try {
        picked = await pickVideo(source, compress);
      } catch (error) {
        Alert.alert(
          source === 'camera' ? 'Couldn’t open the camera' : 'Couldn’t open your library',
          `${errorMessage(error)}${source === 'camera' ? ' Recording requires a real device with a camera.' : ''}`,
        );
        return null;
      }
      if (picked.kind === 'canceled') return null;

      // 4. Copy into app storage, with retry on failure
      for (;;) {
        setBusy(true);
        try {
          return await importAsset(picked.asset, source, compress);
        } catch (error) {
          setBusy(false);
          const choice = await ask('Import failed', errorMessage(error), 'Try again');
          if (choice === 'cancel') return null;
        } finally {
          setBusy(false);
        }
      }
    },
    [state.settings.compressOnImport],
  );

  const overlay = <LoadingOverlay visible={busy} message="Copying footage…" />;
  return { importVideo, busy, overlay };
}
