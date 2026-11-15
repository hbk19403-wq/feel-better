# 1800-FeelBetter — Beta Testing Guide

The app is an Expo (expo-router) React Native app. Beta distribution uses **EAS Build**
+ internal distribution (Android APK / iOS ad-hoc or TestFlight).

## Prerequisites (accounts you provision)
- **Expo account** (free) — https://expo.dev
- **Apple Developer Program** ($99/yr) — required for any iOS device install / TestFlight
- **Google Play Console** ($25 one-time) — required for Play internal testing (APK sideload works without it)

## One-time setup
```bash
cd mobile
npm install -g eas-cli          # or: npx eas-cli@latest
eas login                       # your Expo account
eas init                        # creates the project + writes extra.eas.projectId into app.json
```

## Build a beta (internal testers)
```bash
# Android — produces an installable .apk you can share via link/QR
eas build --profile preview --platform android

# iOS — ad-hoc build for registered test devices (or use TestFlight, below)
eas build --profile preview --platform ios
```
EAS returns a download/QR link. Android testers install the APK directly; iOS
testers must have their device UDID registered (`eas device:create`) before the build.

## TestFlight (recommended for iOS beta)
```bash
eas build --profile production --platform ios
eas submit --profile production --platform ios     # uploads to App Store Connect → TestFlight
```
Then add testers in App Store Connect → TestFlight.

## Play Internal Testing (recommended for Android beta)
```bash
eas build --profile production --platform android
eas submit --profile production --platform android # uploads an .aab to Play Console
```
Then create an Internal testing track in Play Console and add testers by email.

## Config notes
- API base URL is baked in via `EXPO_PUBLIC_API_URL` in `eas.json` (currently the
  production backend). Change per-environment there.
- Bundle IDs: iOS `com.feelbetter.app`, Android `com.feelbetter.app` (see `app.json`).
- Before a public store release you'll also need: privacy policy URL, app-store
  screenshots, and (for iOS) an App Privacy questionnaire — this app collects
  account + wellness data, so declare that.
