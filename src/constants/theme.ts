import { useColorScheme } from 'react-native';

const light = {
  background: '#F5F6FA',
  surface: '#FFFFFF',
  text: '#11181C',
  textMuted: '#687076',
  border: '#E3E5EA',
  primary: '#2F6FED',
  primaryText: '#FFFFFF',
  success: '#1F9D55',
  danger: '#D93F3F',
  track: '#E6EAF2',
};

const dark: typeof light = {
  background: '#0E1116',
  surface: '#171B22',
  text: '#ECEDEE',
  textMuted: '#9BA1A6',
  border: '#262C36',
  primary: '#5B8CFF',
  primaryText: '#FFFFFF',
  success: '#3CC47C',
  danger: '#F06262',
  track: '#262C36',
};

export type Colors = typeof light;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 8, md: 14, lg: 20, pill: 999 } as const;
