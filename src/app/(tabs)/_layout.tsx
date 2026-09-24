import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { useColors } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} color={color} size={size} />
  );
}

export default function TabsLayout() {
  const colors = useColors();
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: colors.primary }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Today', tabBarIcon: tabIcon('sunny-outline') }}
      />
      <Tabs.Screen name="goals" options={{ title: 'Goals', tabBarIcon: tabIcon('flag-outline') }} />
      <Tabs.Screen
        name="sessions"
        options={{ title: 'Sessions', tabBarIcon: tabIcon('calendar-outline') }}
      />
      <Tabs.Screen
        name="check-in"
        options={{ title: 'Check-in', tabBarIcon: tabIcon('create-outline') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: tabIcon('person-circle-outline') }}
      />
    </Tabs>
  );
}
