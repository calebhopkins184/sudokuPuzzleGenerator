# Mat Review

An iOS-first Expo app for wrestling coaches to review match footage on a phone. Coaches keep sessions on the device, replay key sequences, slow down technique, and attach notes, links and extra clips to exact moments.

- **Product contract** (screens, data model, playback rules, checklist): [docs/PRODUCT_CONTRACT.md](docs/PRODUCT_CONTRACT.md)
- **Acceptance review** and on-device test script: [docs/ACCEPTANCE_REVIEW.md](docs/ACCEPTANCE_REVIEW.md)
- **TestFlight prep:** [docs/TESTFLIGHT.md](docs/TESTFLIGHT.md)

## Run it

```bash
npm install
npm start            # open in Expo Go, or a development build, on a real iPhone
```

The web preview can't verify the camera, file access or video playback. Test those on a device.

## Checks

```bash
npm run typecheck    # tsc --noEmit
npm test             # jest: playback engine, persistence, URL and search client
npm run doctor       # expo-doctor
npm run bundle:ios   # production iOS bundle (expo export)
```

Add native packages with `npx expo install <pkg>` so their versions match the Expo SDK (57).

## Structure

```
src/
  app/                        Expo Router screens
    index.tsx                 Sessions list (rename/delete)
    settings.tsx              Replay window, slow rate, auto-play clips, compression, storage
    session/new.tsx           New session: library / record / empty
    session/[id]/index.tsx    Editor (or no-footage / missing-footage states)
    session/[id]/note.tsx     Add note at a moment
    session/[id]/link.tsx     Add link (+ YouTube search)
    session/[id]/clip.tsx     Insert clip at a moment
  features/
    sessions/                 Data model, reducer, AsyncStorage store
    media/                    Import/record, file storage, footage states
    player/                   Playback engine, player hook, timeline, transport, clip overlay
    editor/                   Editor layout (portrait/landscape), marks list
    youtube/                  Search client for the server proxy
  components/                 Shared UI (buttons, states, toast, prompts, fields)
  theme.ts                    Colors, spacing, touch sizes
```

## YouTube search

The app never calls YouTube directly. It calls `GET {EXPO_PUBLIC_MAT_REVIEW_API_URL}/youtube/search?q=…`, and your server adds the API key. Copy `.env.example` to `.env.local` and set the proxy URL. **Never put API keys in `EXPO_PUBLIC_*` variables**, because they're compiled into the app.
