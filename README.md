# Wake-on-LAN React Native App

This is a [**React Native**](https://reactnative.dev) project for Wake-on-LAN functionality, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

## Development Setup

### Using Nix Flake (Recommended)

This project includes a Nix flake for reproducible development environments with all Android SDK dependencies pre-configured.

#### Prerequisites
- [Nix](https://nixos.org/download.html) with flakes enabled
- [Direnv](https://direnv.net/) (optional but recommended)

#### Quick Start
```bash
# Enter the development shell
nix develop
```

The development shell includes:
- Node.js 20
- Yarn package manager
- Android SDK (API levels 33, 35, 36)
- Build tools (35.0.0, 36.0.0)
- NDK (27.1.12297006, 27.0.12077973)
- Java 21
- Required build tools and utilities

### Traditional Setup

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android app:

### Android

```sh
# OR using Yarn
yarn android
```
## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

## Building Release APK Locally

To build the app locally for installation on your device, use the Nix development environment:

```bash
# Enter the development shell (includes all Android SDK dependencies)
nix develop

# Replace the BASE_URL in constants with your server URL
# (GitLab CI uses: sed -i "s|'http://gandalf.lan:3000'|'$BASE_URL'|g" src/utils/constants.ts)
# Edit src/utils/constants.ts and change API_CONFIG.BASE_URL to your server URL
yarn install --frozen-lockfile
# Build the release APK
cd android
./gradlew assembleRelease

# Install on connected device
adb install -r app/build/outputs/apk/release/app-release.apk
```