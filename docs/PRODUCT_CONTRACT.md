# Mat Review: product contract

Mat Review is an iOS-first Expo app for wrestling coaches to review match footage on a phone. Everything stays on the device.

> **Source note:** the original Mat Review code was not available to this rebuild (it isn't in any connected repository). This contract comes from the rebuild plan. Where it assumes original behavior, that's marked **(assumed)**. Please correct anything that differs from the old app.

## Scope

In scope: local sessions; importing and recording footage; a reliable player and timeline; replay and slow-motion inserts; inserted clips; timestamped notes and links; YouTube search for links (through a server proxy); portrait and landscape editor layouts; clear permission, loading, empty, error and offline states; readiness for TestFlight.

Out of scope: accounts; cloud video storage or sync; multi-coach collaboration; AI coaching advice, move recognition or transcription; exporting an edited video; share summaries; in-app YouTube playback.

## Screen map

| Route | Screen | Purpose |
| --- | --- | --- |
| `/` | **Sessions** | Lists sessions, newest first, with a thumbnail, title, date, duration and note count. The empty state points to "New session". Long-press or ⋯ opens Rename and Delete. |
| `/session/new` (modal) | **New session** | Title field plus three choices: *Choose from library*, *Record video*, or *Create empty* (footage added later). Includes the optional *Compress on import* toggle. |
| `/session/[id]` | **Editor** | The player, transport controls, timeline with markers, replay and slow-motion buttons, and the annotations list. The layout adapts to portrait or landscape. Handles missing footage by offering to relink. |
| `/session/[id]/note` (modal) | **Add note** | Note text stamped at the current playback time, which can be adjusted. |
| `/session/[id]/link` (modal) | **Add link** | URL and title fields, plus a YouTube search that fills in both. Stamped at the current time. |
| `/session/[id]/clip` (modal) | **Insert clip** | Choose or record extra footage, label it, and attach it at the current time. |
| `/settings` | **Settings** | Default replay window, slow-motion rate, auto-play of inserted clips, and default compression. Shows storage used, the app version and permission status. |

## Data model

Stored as JSON through AsyncStorage (`mat-review/sessions/v1`). Video files are copied into `Paths.document/media/`.

```ts
type MediaRef = {
  id: string;
  fileName: string;        // relative to Paths.document/media: never an absolute URI
  source: 'library' | 'camera';
  originalName: string | null;
  durationSec: number | null;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  compressed: boolean;
  createdAt: string;       // ISO
};

type Annotation =
  | { id: string; kind: 'note'; timeSec: number; text: string; createdAt: string }
  | { id: string; kind: 'link'; timeSec: number; url: string; title: string;
      source: 'manual' | 'youtube'; createdAt: string };

type ClipInsert = { id: string; timeSec: number; mediaId: string; label: string; createdAt: string };

type Session = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  mainMediaId: string | null;
  media: Record<string, MediaRef>;   // main footage + inserted clips
  annotations: Annotation[];
  clips: ClipInsert[];
  lastPositionSec: number;           // resume point
};

type Settings = {
  replayWindowSec: 3 | 5 | 8 | 10;
  slowRate: 0.25 | 0.5;
  autoPlayClips: boolean;
  compressOnImport: boolean;
};
```

**Why paths are relative:** iOS changes an app's container path when the app is reinstalled or updated. A stored absolute `file://` URI would break. We store `fileName` and work out the full URI at runtime. A device-local URI is never treated as portable.

**Missing media:** before playing, the editor checks `File.exists`. If the file is missing, it shows "Footage not found on this device" with *Relink footage* (pick again) and *Remove footage* options. Annotations are always kept.

## Playback semantics

- **Replay at T** (window `w`): play `[max(0, T − w), T]` at 1×, then seek back to T and continue in the play or pause state it had before.
- **Slow motion at T:** the same interval at `slowRate`, then back to T at 1×.
- **Inserted clip at T:** when normal playback crosses T and auto-play is on, or when the user taps the clip marker, the main video pauses, the clip plays in an overlay, and playback returns to T.

**Boundary cases.** Each one is covered by a unit test in `src/features/player/__tests__/engine.test.ts`:

1. T < 0.25 s: nothing to replay. Show a toast; the state doesn't change.
2. T near 0 but ≥ 0.25 s: the window is clamped to start at 0.
3. T at or past the end of the video: T is clamped to the duration. After the replay the player sits at the end, paused.
4. Tapping replay again mid-replay restarts from the *original* T. Replays never nest.
5. Switching between replay and slow motion mid-insert keeps the original T.
6. Seeking or scrubbing during a replay cancels it, resets the rate to 1×, and honors the user's seek.
7. Returning from a replay or clip does not re-trigger clips already crossed.
8. Clips next to each other, or at the same time, play one after another. Playback then returns to the last clip's T.
9. Seeking past a clip does not trigger it; only normal playback crossing it does.
10. A clip whose file is missing is skipped with a notice, not a crash.

## States

| Situation | Behavior |
| --- | --- |
| Photo-library or camera/mic permission not yet decided | The system prompt appears only when the user taps the action. |
| Permission denied | Explains why it's needed and offers an *Open Settings* button. Other features keep working. |
| Import in progress | A blocking progress overlay reading "Copying footage…". |
| Import failed | Shows the error with *Try again* and *Cancel*. |
| Compression requested but unsupported (library imports, and Android) | Asks the user to *Import original* or *Cancel*. Never silently skips compression. |
| No sessions | An empty state with a "New session" call to action. |
| Session with no footage | The editor offers *Choose* or *Record* footage. |
| Player error | The error message with *Retry*. |
| Offline | YouTube search shows "You're offline". Manual links and everything else keep working. |
| YouTube search not configured | Explains that search needs the server proxy. Manual links still work. |

## YouTube search contract (server side)

The app calls `GET {EXPO_PUBLIC_MAT_REVIEW_API_URL}/youtube/search?q=<query>`, which returns `{ items: [{ videoId, title, channelTitle, thumbnailUrl }] }`.
The YouTube Data API key lives **only on that server**. The `EXPO_PUBLIC_*` variable holds just the proxy's base URL, which is not a secret.

## Acceptance checklist

- [ ] Create a session from the library, from the camera, or empty. Rename it and delete it; deleting also removes its media files.
- [ ] Force-quit and reopen: sessions, annotations, clips and the resume position are all intact.
- [ ] Play, pause, current and total time, ±5 s skip, frame step, and 0.25×/0.5×/1× speed.
- [ ] The scrubber drags smoothly, doesn't jump back while time updates arrive, and seeks on release.
- [ ] The timeline shows note (amber), link (blue) and clip (purple) markers at the right positions.
- [ ] Replay and slow-motion return to the original moment and pass boundary cases 1–10.
- [ ] Inserted clips can be chosen or recorded, play at their time, and return to it.
- [ ] Notes and links can be added and deleted; tapping one jumps to its time; links open in the browser.
- [ ] YouTube search fills in the URL and title; offline and not-configured states are clear.
- [ ] The portrait editor stacks video, controls and list. Landscape puts the video beside the controls and list. Safe areas are respected and touch targets are at least 44 pt.
- [ ] Permission denials, missing media, import failures and player errors all show clear next steps.
- [ ] `npm run typecheck`, `npm test`, `npx expo-doctor` and `npx expo export --platform ios` all pass.
- [ ] Verified on a real iPhone. The web preview does **not** verify camera, file access or video playback.
