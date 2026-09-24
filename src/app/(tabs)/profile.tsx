import * as Linking from 'expo-linking';
import { Alert } from 'react-native';

import { Body, Button, Card, Heading, Muted, SectionHeader, Screen } from '@/components/ui';
import { useCoaching } from '@/store/CoachingStore';

export default function ProfileScreen() {
  const { data, dispatch } = useCoaching();
  const { coach } = data;

  const confirmReset = () =>
    Alert.alert('Reset data?', 'This replaces everything on this device with sample data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => dispatch({ type: 'reset' }) },
    ]);

  return (
    <Screen>
      <SectionHeader title="Your coach" />
      <Card>
        <Heading>{coach.name}</Heading>
        <Muted>{coach.title}</Muted>
        <Body>{coach.bio}</Body>
        <Button
          label="Email coach"
          variant="secondary"
          onPress={() => Linking.openURL(`mailto:${coach.email}`)}
        />
      </Card>

      <SectionHeader title="Stats" />
      <Card>
        <Body>Goals: {data.goals.length}</Body>
        <Body>Sessions: {data.sessions.length}</Body>
        <Body>Check-ins logged: {data.checkIns.length}</Body>
      </Card>

      <SectionHeader title="Settings" />
      <Button label="Reset to sample data" variant="danger" onPress={confirmReset} />
    </Screen>
  );
}
