import QuickCrypto from "react-native-quick-crypto";

// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://gandalf.lan:3000', // Update this to your backend URL
  TIMEOUT: 30000, // 30 seconds
};

// Security Configuration
export const SECURITY_CONFIG = {
  RSA_KEY_SIZE: 2048,
  AES_ALGORITHM: 'aes-256-cbc',
  RSA_PADDING: QuickCrypto.constants.RSA_PKCS1_OAEP_PADDING,
  RSA_OAEP_HASH: 'sha256',
};

// Storage Keys
export const STORAGE_KEYS = {
  PRIVATE_KEY: 'wol_app_private_key',
  SERVER_PUBLIC_KEY: 'wol_app_server_public_key',
  JWT_TOKEN: 'wol_app_jwt_token',
  SSH_PRIVATE_KEY_PREFIX: 'wol_app_ssh_key_',
  SSH_PRIVATE_KEY_LIST: 'wol_app_ssh_key_list',
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
