import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { TextPrompt } from '@/components/TextPrompt';
import { Button, IconButton, StateView } from '@/components/ui';
import { mediaExists } from '@/features/media/mediaFiles';
import { useSession, useSessions } from '@/features/sessions/SessionsStore';

export default function EditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSession(id);
  const { dispatch } = useSessions();
  const [renaming, setRenaming] = useState(false);

  if (!session) {
    return (
      <StateView
        icon="alert-circle-outline"
        title="Session not found"
        message="It may have been deleted."
      />
    );
  }

  const main = session.mainMediaId ? session.media[session.mainMediaId] : undefined;
  const missing = main ? !mediaExists(main.fileName) : false;

  return (
    <>
      <Stack.Screen
        options={{
          title: session.title,
          headerRight: () => (
            <IconButton
              icon="create-outline"
              label="Rename session"
              onPress={() => setRenaming(true)}
            />
          ),
        }}
      />
      {!main ? (
        <StateView
          icon="film-outline"
          title="No footage yet"
          message="Import or record footage to start reviewing."
        />
      ) : missing ? (
        <StateView
          icon="alert-circle-outline"
          tone="warning"
          title="Footage not found on this device"
          message="The video file for this session is no longer available. Your notes and links are safe."
        >
          <Button
            label="Remove missing footage"
            variant="danger"
            onPress={() =>
              dispatch({ type: 'removeMedia', sessionId: session.id, mediaId: main.id })
            }
          />
        </StateView>
      ) : (
        <StateView
          icon="play-circle-outline"
          title="Footage ready"
          message="The player arrives in a later milestone."
        />
      )}
      <TextPrompt
        visible={renaming}
        title="Rename session"
        initialValue={session.title}
        onCancel={() => setRenaming(false)}
        onConfirm={(title) => {
          dispatch({ type: 'renameSession', sessionId: session.id, title });
          setRenaming(false);
        }}
      />
    </>
  );
}
