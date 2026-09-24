# Acceptance review

This review checks the implementation against the checklist in [PRODUCT_CONTRACT.md](PRODUCT_CONTRACT.md).
**Automated** means it's covered by type checks, unit tests or bundling in this repo. **Device** means it has to be confirmed on a real iPhone. The web preview can't verify camera, file access or native video playback.

## Automated checks (all passing)

| Check | Command | Result |
| --- | --- | --- |
| Type check | `npm run typecheck` | ✅ Clean |
| Unit tests | `npm test` | ✅ 42 tests in 4 suites (engine boundary cases, reducer and persistence, URL helpers, YouTube client) |
| Dependency check | `npx expo-doctor` | ✅ 19 of 21 pass. The other 2 (config schema, React Native Directory) need network access to Expo's servers, which the build sandbox blocks. Re-run them on Replit. |
| Production iOS bundle | `npx expo export --platform ios` | ✅ Hermes bytecode bundle built without errors |
| iOS permission strings | `npx expo config --type introspect` | ✅ Camera, microphone and photo-library descriptions and `ITSAppUsesNonExemptEncryption=false` are all present |

## Checklist status

| Item | Status | Where |
| --- | --- | --- |
| Create a session from the library, camera or empty; rename; delete (deleting also removes copied media) | Implemented. Reducer and `orphanedFiles` are unit-tested. **Device:** picker and camera | `app/session/new.tsx`, `app/index.tsx`, `features/sessions/*` |
| Reopening restores sessions, annotations, clips and the resume position | Implemented. Parse round-trip is tested. Saves are debounced, and flush when the app backgrounds. **Device:** force-quit test | `SessionsStore.tsx`, `useMainPlayer.ts` |
| Play/pause, time, ±5 s, frame step, 0.25×/0.5×/1× | Implemented. **Device** | `TransportBar.tsx`, `useMainPlayer.ts` |
| Scrubber doesn't jump back during updates; seeks on release | Implemented. Local drag state, throttled preview seeks, playback paused while scrubbing. **Device** | `Timeline.tsx` |
| Color-coded note, link and clip markers | Implemented | `Timeline.tsx` |
| Replay and slow motion return to T; boundary cases 1–10 | Implemented. **Each case is unit-tested.** **Device:** check timing feel | `engine.ts`, `__tests__/engine.test.ts` |
| Inserted clips are chosen or recorded, play at T, and return | Implemented. Engine is tested. **Device:** overlay playback | `ClipOverlay.tsx`, `app/session/[id]/clip.tsx` |
| Notes and links: add, delete, jump to time, open | Implemented | `MarksList.tsx`, `note.tsx`, `link.tsx` |
| YouTube search fills in URL and title; offline and not-configured states | Client, parsing and error mapping are tested. **Needs the server proxy** (see below) | `features/youtube/*` |
| Portrait and landscape layouts, safe areas, 44 pt targets | Implemented. Rotating doesn't remount the players. **Device:** check on a small phone (SE) and a notched phone | `Editor.tsx` |
| Permission, missing-media, import, player and storage errors | Implemented, each with a next step | `useVideoImport.tsx`, `FootageStates.tsx`, `PlayerSurface.tsx`, `_layout.tsx` |

## Assumptions made

1. **No original source was available.** Behavior comes from the rebuild plan. Where the old app differed, the old behavior should win; tell me what's different.
2. **Library imports aren't compressed.** iOS's photo picker ignores the deprecated export presets, so "Compress" applies only to in-app recording (medium quality). For library imports the app asks the coach to import the original or cancel, rather than silently skipping compression.
3. **Recording uses the system camera UI** (`expo-image-picker`), not a custom camera screen. It's more reliable and needs fewer permissions. Switch to `expo-camera` if you need custom recording controls.
4. **Replay plays at the coach's chosen speed.** Slow motion uses the Settings slow rate (0.25× or 0.5×). Both return to the original moment at the chosen speed.
5. **Inserted clips auto-play** when normal playback crosses their moment. This can be turned off in Settings. Clips at the same moment play one after another.
6. **Media paths are stored as file names** relative to `Documents/media`, because iOS changes the app container path when the app is updated.

## On-device test script (before TestFlight)

1. Airplane mode on. Create a session from the library, add notes and a link manually, force-quit, reopen, and confirm everything is there.
2. Deny camera access, tap Record, confirm the "Open Settings" path, enable access in Settings, and record.
3. Replay at 0:00.1 should show a "Nothing to replay" toast. Replay at 0:02 should play 0:00–0:02 and return. Slow-mo at the last second should end parked at the end.
4. Tap Replay three times quickly. It should always return to the first moment. Scrub during a slow-mo: the speed resets and your scrub position wins.
5. Add two clips at the same moment. Play through them: both play, then playback returns once.
6. Missing footage: in a development build, remove a file from the app's `Documents/media` folder (Xcode → Devices → download the container, delete one video, replace the container). Reopen the session: it shows "Footage not found" with Relink and Remove, and the notes are still there.
7. Rotate the phone mid-replay and mid-clip. Playback continues, and the controls fit on an iPhone SE.
