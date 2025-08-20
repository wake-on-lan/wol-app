{
  description = "Claude Code development environment with auto VSCode launch";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config = {
            allowUnfree = true;
            allowUnfreePredicate = _: true;
            android_sdk.accept_license = true;
          };
        };

        # Android SDK composition matching your stable app configuration
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

        devEnv = pkgs.buildEnv {
          name = "claude-dev-env";
          paths = with pkgs; [
            curl
            jq
            yarn
            python3
            node-gyp
            nodejs_20
            claude-code
            jdk21
            androidComposition.androidsdk
          ];
        };
      in {
        # Development shell
        devShells.default = pkgs.mkShell {
          name = "claude-dev-shell";
          buildInputs = [ devEnv ];

          # Set Android environment variables
          ANDROID_HOME = "${androidComposition.androidsdk}/libexec/android-sdk";
          ANDROID_SDK_ROOT =
            "${androidComposition.androidsdk}/libexec/android-sdk";

          shellHook = ''
            echo "Android SDK initialized:"
            echo "  Platforms: API 33, 35, 36"
            echo "  Build Tools: 35.0.0, 36.0.0"
            echo "  ANDROID_HOME: $ANDROID_HOME"
            code .
          '';
        };
      });
}
