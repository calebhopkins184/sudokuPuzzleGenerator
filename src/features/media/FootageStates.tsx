import { Alert } from 'react-native';

import { Button, StateView } from '@/components/ui';
import { useSessions } from '@/features/sessions/SessionsStore';
import type { MediaRef, Session } from '@/features/sessions/types';

import { useVideoImport } from './useVideoImport';

/** Shown when a session has no main footage yet. */
export function NoFootage({ session }: { session: Session }) {
  const { dispatch } = useSessions();
  const { importVideo, busy, overlay } = useVideoImport();

  const add = async (source: 'library' | 'camera') => {
    const media = await importVideo(source);
    if (media) dispatch({ type: 'setMainMedia', sessionId: session.id, media });
  };

  return (
    <StateView
      icon="film-outline"
      title="No footage yet"
      message="Import a match video or record one to start reviewing."
    >
      <Button
        label="Choose from library"
        icon="images-outline"
        onPress={() => void add('library')}
        disabled={busy}
      />
      <Button
        label="Record video"
        icon="videocam-outline"
        variant="secondary"
        onPress={() => void add('camera')}
        disabled={busy}
      />
      {overlay}
    </StateView>
  );
}

/**
 * Local media is device-specific: restoring a backup onto a new phone, or iOS
 * reclaiming storage, can leave a session without its file. Annotations are kept.
 */
export function MissingFootage({ session, media }: { session: Session; media: MediaRef }) {
  const { dispatch } = useSessions();
  const { importVideo, busy, overlay } = useVideoImport();

  const relink = async () => {
    const next = await importVideo('library');
    if (!next) return;
    // Keep annotations; carry the new file under the session's main slot.
    dispatch({ type: 'setMainMedia', sessionId: session.id, media: next, keepPosition: true });
  };

  const remove = () =>
    Alert.alert(
      'Remove missing footage?',
      'Notes, links and clips stay with the session. You can add footage again later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            dispatch({ type: 'removeMedia', sessionId: session.id, mediaId: media.id }),
        },
      ],
    );

  return (
    <StateView
      icon="alert-circle-outline"
      tone="warning"
      title="Footage not found on this device"
      message={`${media.originalName ?? 'The video file'} is no longer available here. Your notes, links and clips are safe — choose the same video again to keep reviewing.`}
    >
      <Button
        label="Relink footage"
        icon="link-outline"
        onPress={() => void relink()}
        disabled={busy}
      />
      <Button label="Remove missing footage" variant="danger" onPress={remove} disabled={busy} />
      {overlay}
    </StateView>
  );
}
