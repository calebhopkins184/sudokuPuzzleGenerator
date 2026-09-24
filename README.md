# Coach — Expo coaching app

A cross-platform (iPhone + Android) coaching app built with [Expo](https://expo.dev) SDK 57, Expo Router and TypeScript. It runs in **Expo Go**: no Xcode or Android Studio needed.

## Features

- **Today**: greeting, next coaching session, daily habit checklist with streaks, and a prompt to check in.
- **Goals**: goals with categories, target dates and milestones. Ticking off milestones moves the progress bar. You can add and delete goals.
- **Sessions**: upcoming and past coaching sessions, each with an agenda and your own notes.
- **Check-in**: a daily mood and energy check with a written reflection, plus recent history.
- **Profile**: your coach's details (with an email link), stats, and a reset to the sample data.

All data is stored on the device with AsyncStorage. The first launch loads sample data from `src/data/seed.ts`.

## Getting started

```bash
npm install
npm start          # then scan the QR code with Expo Go (Android) or the Camera app (iOS)
```

Other scripts:

```bash
npm run typecheck  # tsc --noEmit
npm run doctor     # expo-doctor
```

Add dependencies with `npx expo install <package>` so the versions stay compatible with the SDK.

## Project structure

```
src/
  app/                  # Expo Router routes (every file is a screen)
    _layout.tsx         # Root stack, theme, and data provider
    (tabs)/             # Bottom tabs: Today, Goals, Sessions, Check-in, Profile
    goal/[id].tsx       # Goal detail
    goal/new.tsx        # New-goal modal
    session/[id].tsx    # Session detail and notes
  components/           # Shared UI (cards, buttons, progress bar, text field…)
  constants/theme.ts    # Light and dark color palettes, spacing, radius
  data/                 # Types and sample seed data
  lib/                  # Date and id helpers
  store/CoachingStore.tsx  # App state (reducer + context), saved to AsyncStorage
```

## Next steps

- Replace the AsyncStorage store with a backend (for example Supabase or Firebase) so coaches and clients share data.
- Add authentication and a coach-side view with a client list.
- Add push notifications for session reminders (`expo-notifications`).
- Build and ship with EAS: `npx eas-cli@latest build`.
