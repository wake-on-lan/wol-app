// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://gandalf.lan:3000', // Update this to your backend URL
  TIMEOUT: 30000, // 30 seconds
};

// Security Configuration
export const SECURITY_CONFIG = {
  RSA_KEY_SIZE: 2048,
  AES_KEY_SIZE: 256,
  IV_SIZE: 128,
  KEY_EXPIRY_HOURS: 24,
  KEY_WARNING_HOURS: 1,
};

// Storage Keys
export const STORAGE_KEYS = {
  PRIVATE_KEY: 'wol_app_private_key',
  PUBLIC_KEY: 'wol_app_public_key',
  SERVER_PUBLIC_KEY: 'wol_app_server_public_key',
  JWT_TOKEN: 'wol_app_jwt_token',
  KEY_EXPIRY: 'wol_app_key_expiry',
} as const;

// Validation Patterns
export const VALIDATION = {
  MAC_ADDRESS: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,50}$/,
  PASSWORD_MIN_LENGTH: 3,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTHENTICATION_FAILED: 'Authentication failed. Please check your credentials.',
  KEY_GENERATION_FAILED: 'Failed to generate encryption keys.',
  ENCRYPTION_FAILED: 'Failed to encrypt data.',
  DECRYPTION_FAILED: 'Failed to decrypt response.',
  INVALID_MAC_ADDRESS: 'Invalid MAC address format.',
  NO_DEVICE_SELECTED: 'Please select a device first.',
  KEYS_EXPIRED: 'Encryption keys have expired. Please log in again.',
} as const;

// App Configuration
export const APP_CONFIG = {
  NAME: 'WOL Manager',
  VERSION: '1.0.0',
  COMPANY: 'Wake-on-LAN Solutions',
} as const;