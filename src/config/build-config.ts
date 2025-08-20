// Build-time configuration
// This file can be replaced during build process to override default values

export interface BuildConfig {
  BASE_URL: string;
}

export const DEFAULT_CONFIG: BuildConfig = {
  BASE_URL: 'http://gandalf.lan:3000',
};

// This will be replaced during CI builds
let buildConfig: BuildConfig = DEFAULT_CONFIG;

// Check if we have a build-time override
declare global {
  var __BUILD_CONFIG__: BuildConfig | undefined;
}

if (typeof global !== 'undefined' && global.__BUILD_CONFIG__) {
  buildConfig = { ...DEFAULT_CONFIG, ...global.__BUILD_CONFIG__ };
}

export { buildConfig };