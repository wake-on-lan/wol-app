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

# Or with direnv (after allowing)
echo "use flake" > .envrc
direnv allow
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

## GitLab CI/CD Docker Image

This project uses a custom Docker image for GitLab CI builds that includes all necessary Android SDK components.

### Building the Docker Image

The Docker image is built using Nix flakes for reproducible builds:

```bash
# Build the Docker image
nix build .#android-ci

# Load the image into Docker
docker load < result
```

### Pushing to GitLab Registry

Use the provided push script to build and push the image to your GitLab Container Registry:

```bash
# Push with a GitLab access token
nix run .#push-docker -- <YOUR_ACCESS_TOKEN> <TAG>

# Example:
nix run .#push-docker -- glpat-xxxxxxxxxxxxxxxxxxxx v1.0.0
```

#### Setting up GitLab Access Token

1. Go to your GitLab project → Settings → Access Tokens
2. Create a new token with `write_registry` scope
3. Use the token with the push script above

The script will:
1. Build the Docker image with Nix
2. Load it into Docker
3. Tag it for your GitLab registry
4. Push it to `registry.neupengasse.mooo.com/neupengasse/wake-on-lan/wol-app/android-ci:TAG`

### GitLab CI Configuration

The `.gitlab-ci.yml` uses the custom Docker image for consistent builds:

```yaml
android-release:
  image: $CI_REGISTRY/neupengasse/wake-on-lan/wol-app/android-ci:$CI_COMMIT_TAG
  # ... rest of the configuration
```

## Deployment

### Automated Deployment Script

Use the included deployment script to fetch artifacts from GitLab CI and install on your device:

```bash
# Make script executable (if not already)
chmod +x android/deploy.zsh

# Deploy a specific version
./android/deploy.zsh v1.0.0
```

The script requires:
- Your GitLab project ID and access token (edit the script)
- `adb` (Android SDK platform tools)
- `jq` and `curl`
- Connected Android device with USB debugging enabled

# React Native **Android Release Build** (Local-Only / Sideload)

You’re not shipping to the Play Store, so you only need a **signed release APK** you can install locally via **ADB** (USB or Wi-Fi). Below is a lean, reliable setup.

---

## 0) Do you actually need “release”?
If you only test locally and don’t care about optimizations or release behavior, a **debug APK** is simpler and already signed with the debug keystore:

```bash
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```