{
  description = "Android build Docker image for CI";
  inputs = { nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable"; };

  outputs = { self, nixpkgs }:
    let
      supportedSystems = [ "x86_64-linux" "aarch64-linux" ];
      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;
      nixpkgsFor = forAllSystems (system:
        import nixpkgs {
          inherit system;
          config = {
            allowUnfree = true;
            android_sdk.accept_license = true;
          };
        });
    in {
      packages = forAllSystems (system:
        let
          pkgs = nixpkgsFor.${system};

          # Android SDK composition for CI builds
          androidComposition = pkgs.androidenv.composeAndroidPackages {
            cmdLineToolsVersion = "8.0";
            platformToolsVersion = "34.0.5";
            buildToolsVersions = [ "34.0.0" ];
            platformVersions = [ "33" "34" ];
            includeEmulator = false;
            includeSystemImages = false;
            includeSources = false;
            includeNDK = true;
            ndkVersions = [ "26.1.10909125" ];
            useGoogleAPIs = false;
            cmakeVersions = [ "3.22.1" ];
          };

          dockerImage = pkgs.dockerTools.buildLayeredImage {
            name = "android-ci";
            tag = "latest";
            contents = with pkgs; [
              bash
              coreutils
              findutils
              gnugrep
              gnused
              gawk
              git
              nodejs_20
              yarn
              python3
              unzip
              cmake
              openjdk17_headless
              cacert
              which
              androidComposition.androidsdk
            ];
            config = {
              WorkingDir = "/workspace";
              Env = [
                "NIX_SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt"
                "JAVA_HOME=${pkgs.openjdk17_headless}/lib/openjdk"
                "ANDROID_HOME=${androidComposition.androidsdk}/libexec/android-sdk"
                "ANDROID_SDK_ROOT=${androidComposition.androidsdk}/libexec/android-sdk"
                "ANDROID_NDK_HOME=${androidComposition.androidsdk}/libexec/android-sdk/ndk-bundle"
                "NDK_HOME=${androidComposition.androidsdk}/libexec/android-sdk/ndk-bundle"
                ("PATH=${pkgs.coreutils}/bin:${pkgs.findutils}/bin:${pkgs.gnugrep}/bin:${pkgs.gnused}/bin:${pkgs.gawk}/bin"
                  + ":${pkgs.git}/bin:${pkgs.nodejs_20}/bin:${pkgs.yarn}/bin:${pkgs.python3}/bin:${pkgs.cmake}/bin:${pkgs.which}/bin"
                  + ":${androidComposition.androidsdk}/libexec/android-sdk/platform-tools"
                  + ":${androidComposition.androidsdk}/libexec/android-sdk/cmdline-tools/latest/bin"
                  + ":${androidComposition.androidsdk}/libexec/android-sdk/build-tools/34.0.0"
                  + ":${androidComposition.androidsdk}/libexec/android-sdk/ndk-bundle/toolchains/llvm/prebuilt/linux-x86_64/bin"
                  + ":${androidComposition.androidsdk}/libexec/android-sdk/cmake/3.22.1/bin")
                "GRADLE_OPTS=-Dorg.gradle.daemon=false -Dorg.gradle.jvmargs=-Xmx4g -Dfile.encoding=UTF-8 -Dorg.gradle.parallel=true"
                "GRADLE_USER_HOME=/tmp/.gradle"
                "CI=true"
                "ANDROID_COMPILE_SDK=34"
                "ANDROID_BUILD_TOOLS=34.0.0"
                "ANDROID_SDK_TOOLS=34.0.5"
              ];
            };
          };

          # Script to build and push to GitLab registry
          pushScript = pkgs.writeShellScriptBin "push-docker" ''
            set -euo pipefail

            # Check arguments
            if [ $# -lt 1 ]; then
              echo "Error: Access token is required"
              usage
            fi

            ACCESS_TOKEN="$1"
            TAG="''${2:-latest}"
            PROJECT_PATH="neupengasse/wake-on-lan/wol-app"

            if [ -z "$PROJECT_PATH" ]; then
              echo "Error: Project path must be provided either as argument or GITLAB_PROJECT_PATH environment variable"
              echo "Example: your-username/your-project"
              usage
            fi
            GITLAB_REGISTRY="registry.neupengasse.mooo.com"
            IMAGE_NAME="android-ci"
            FULL_IMAGE_TAG="''${GITLAB_REGISTRY}/''${PROJECT_PATH}/''${IMAGE_NAME}:''${TAG}"
            echo "Pushing Docker image to GitLab registry: ''${FULL_IMAGE_TAG}"
            echo "🔨 Building Docker image with Nix..."
            nix build .#android-ci

            echo "📦 Loading image into Docker..."
            ${pkgs.docker}/bin/docker load < result

            echo "🏷️  Tagging image for GitLab registry..."
            ${pkgs.docker}/bin/docker tag "''${IMAGE_NAME}:latest" "''${FULL_IMAGE_TAG}"

            echo "🔐 Logging into GitLab registry..."
            # For Project Access Tokens, use the token name as username
            # For Personal Access Tokens, you can use your GitLab username or gitlab-ci-token
            echo "$ACCESS_TOKEN" | ${pkgs.docker}/bin/docker login "''${GITLAB_REGISTRY}" --username "HS-id7kRdY_hWNmDp5-e" --password-stdin

            echo "🚀 Pushing to GitLab registry..."
            ${pkgs.docker}/bin/docker push "''${FULL_IMAGE_TAG}"

            echo "✅ Image pushed successfully!"
            echo "📍 Registry: ''${FULL_IMAGE_TAG}"
            echo "🐳 Pull with: docker pull ''${FULL_IMAGE_TAG}"

            # Logout for security
            ${pkgs.docker}/bin/docker logout "''${GITLAB_REGISTRY}"
          '';

        in {
          default = dockerImage;
          android-ci = dockerImage;
          push-docker = pushScript; 
        });
    };
}
