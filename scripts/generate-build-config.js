#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get BASE_URL from environment variable or use default
const baseUrl = process.env.BASE_URL || 'http://gandalf.lan:3000';

console.log(`Generating build config with BASE_URL: ${baseUrl}`);

// Generate the build config file
const configContent = `// Build-time configuration - Generated automatically
// This file can be replaced during build process to override default values

export interface BuildConfig {
  BASE_URL: string;
}

export const DEFAULT_CONFIG: BuildConfig = {
  BASE_URL: '${baseUrl}',
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
`;

// Write the config file
const configPath = path.join(__dirname, '..', 'src', 'config', 'build-config.ts');
fs.writeFileSync(configPath, configContent, 'utf8');

console.log(`✅ Build config generated at: ${configPath}`);
console.log(`📡 BASE_URL set to: ${baseUrl}`);