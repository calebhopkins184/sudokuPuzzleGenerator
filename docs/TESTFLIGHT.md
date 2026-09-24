# TestFlight beta prep (milestone 11)

These steps need your Apple Developer account and Replit, so they can't be done from this repo.

## Confirm before building

| Item | Current value | Action |
| --- | --- | --- |
| App name | `Mat Review` (`app.json` → `expo.name`) | Confirm the name is available in App Store Connect |
| Bundle ID | `com.calebhopkins.matreview` | **Must be unique.** Change it in `app.json` if it's taken, before the first build (it can't be changed afterward) |
| Version / build | `1.0.0` / `1` | Increase `ios.buildNumber` for every upload |
| Permission text | Camera, Microphone, Photos (through the `expo-image-picker` plugin) | Review the wording; App Review reads it |
| Encryption | `ITSAppUsesNonExemptEncryption: false` | Correct: the app uses only HTTPS |
| Icon | `assets/icon.png` (Expo placeholder) | **Replace** with a 1024×1024 PNG with no transparency |
| iPad | `supportsTablet: false` | iPhone-only for the beta |
| YouTube search | `EXPO_PUBLIC_MAT_REVIEW_API_URL` | Set it to your proxy's URL in Replit Secrets, or leave it empty (search then shows "not set up") |

The config is a static `app.json`. There's no dynamic `app.config.js`, as the plan requires.

## Build and submit

1. Open the repo on **replit.com** (the iOS Replit app can't build native apps).
2. Run `npm install`, then `npx expo-doctor`. All checks should pass there, including the two that need network access.
3. Use **Replit Expo Launch** to build and submit to App Store Connect. Sign in with the Apple Developer account when prompted.
4. In App Store Connect, wait for the build to finish processing, then add it to a TestFlight group and invite testers.
5. Run the on-device script in [ACCEPTANCE_REVIEW.md](ACCEPTANCE_REVIEW.md) on the TestFlight build.
