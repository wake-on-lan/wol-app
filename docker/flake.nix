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
            buildToolsVersions = [ "35.0.0" "36.0.0" ];
            platformVersions = [ "33" "35" "36" ];
            includeEmulator = false;
            includeSystemImages = false;
            includeSources = false;
            includeNDK = true;
            ndkVersions =
              [ "27.1.12297006" "27.0.12077973" ]; # Matches your ndkVersion
            useGoogleAPIs = false;
            cmakeVersions = [ "3.22.1" ];
          };

          dockerImage = pkgs.dockerTools.buildLayeredImage {
            name = "android-ci";
            tag = "latest";
            created = "now";
            fromImage = pkgs.dockerTools.pullImage {
              imageName = "debian";
              imageDigest =
                "sha256:6d87375016340817ac2391e670971725a9981cfc24e221c47734681ed0f6c0f5";
              sha256 = "sha256-44sfsrMrk9tHriniFIqv1JMXrfAJg2SZ9KAMq7TkrXo=";
              finalImageTag = "bookworm-slim";
            };

            contents = with pkgs; [
              curl
              jq
              coreutils
              gnused
              yarn
              python3
              node-gyp
              nodejs_20
              claude-code
              jdk17
              androidComposition.androidsdk
            ];
            config = {
              WorkingDir = "/workspace";
              Env = [
                "JAVA_HOME=${pkgs.jdk17}/lib/openjdk"
                "PATH=/bin:/usr/bin:${pkgs.jdk17}/bin:${androidComposition.androidsdk}/libexec/android-sdk/platform-tools:${androidComposition.androidsdk}/libexec/android-sdk/tools/bin"
                "ANDROID_HOME=${androidComposition.androidsdk}/libexec/android-sdk"
                "ANDROID_SDK_ROOT=${androidComposition.androidsdk}/libexec/android-sdk"
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
