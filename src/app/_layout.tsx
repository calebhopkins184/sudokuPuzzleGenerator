import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, useColorScheme } from 'react-native';

import { useColors } from '@/constants/theme';
import { CoachingProvider, useCoaching } from '@/store/CoachingStore';

function RootStack() {
  const { ready } = useCoaching();
  const colors = useColors();

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="goal/[id]" options={{ title: 'Goal' }} />
      <Stack.Screen name="goal/new" options={{ title: 'New goal', presentation: 'modal' }} />
      <Stack.Screen name="session/[id]" options={{ title: 'Session' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <CoachingProvider>
        <RootStack />
        <StatusBar style="auto" />
      </CoachingProvider>
    </ThemeProvider>
  );
}
