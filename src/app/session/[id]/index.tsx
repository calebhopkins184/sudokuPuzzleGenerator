import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { TextPrompt } from '@/components/TextPrompt';
import { IconButton, StateView } from '@/components/ui';
import { MissingFootage, NoFootage } from '@/features/media/FootageStates';
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
        <NoFootage session={session} />
      ) : missing ? (
        <MissingFootage session={session} media={main} />
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
