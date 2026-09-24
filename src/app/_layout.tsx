import { DarkTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Alert, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/Toast';
import { Button, StateView } from '@/components/ui';
import { SessionsProvider, useSessions } from '@/features/sessions/SessionsStore';
import { colors } from '@/theme';

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

function AppStack() {
  const { status, retryLoad, startFresh } = useSessions();

  if (status.kind === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.text} accessibilityLabel="Loading sessions" />
      </View>
    );
  }

  if (status.kind === 'error') {
    return (
      <StateView
        icon="warning-outline"
        tone="error"
        title="Couldn't open your sessions"
        message={`${status.message} Your footage files are untouched.`}
      >
        <Button label="Try again" onPress={retryLoad} />
        <Button
          label="Start with an empty library"
          variant="danger"
          onPress={() =>
            Alert.alert(
              'Start with an empty library?',
              'The unreadable data is kept as a backup on this device, but sessions will not appear in the app.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Start fresh', style: 'destructive', onPress: () => void startFresh() },
              ],
            )
          }
        />
      </StateView>
    );
  }

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Mat Review' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="session/new" options={{ title: 'New session', presentation: 'modal' }} />
      <Stack.Screen name="session/[id]/index" options={{ title: '' }} />
      <Stack.Screen
        name="session/[id]/note"
        options={{ title: 'Add note', presentation: 'modal' }}
      />
      <Stack.Screen
        name="session/[id]/link"
        options={{ title: 'Add link', presentation: 'modal' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider value={navTheme}>
        <ToastProvider>
          <SessionsProvider>
            <AppStack />
          </SessionsProvider>
          <StatusBar style="light" />
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
