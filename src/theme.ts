/** Dark-first palette: footage reads best on a dark surround, and gyms are bright. */
export const colors = {
  background: '#0B0D10',
  surface: '#15191F',
  surfaceRaised: '#1E232B',
  border: '#2A303A',
  text: '#F2F4F7',
  textMuted: '#9AA3AF',
  accent: '#E5484D', // mat red
  accentText: '#FFFFFF',
  danger: '#FF6369',
  warning: '#F5A524',
  success: '#3DD68C',
  // Timeline marker colors (keep in sync with the contract)
  note: '#F5A524',
  link: '#4C9AFF',
  clip: '#B67CFF',
  replay: '#3DD68C',
  track: '#2A303A',
  scrim: 'rgba(0,0,0,0.6)',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 6, md: 10, lg: 16, pill: 999 } as const;

/** Apple HIG minimum touch target. */
export const MIN_TOUCH = 44;

export const type = {
  title: { fontSize: 28, fontWeight: '700' },
  heading: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22 },
  caption: { fontSize: 13, lineHeight: 18 },
  mono: { fontSize: 14, fontVariant: ['tabular-nums'] as ['tabular-nums'] },
} as const;
