import { VALIDATION, ERROR_MESSAGES } from './constants';

export class ValidationUtils {
  static validateMacAddress(macAddress: string): { isValid: boolean; error?: string } {
    if (!macAddress || typeof macAddress !== 'string') {
      return { isValid: false, error: 'MAC address is required' };
    }

    const trimmed = macAddress.trim();
    if (!VALIDATION.MAC_ADDRESS.test(trimmed)) {
      return { isValid: false, error: ERROR_MESSAGES.INVALID_MAC_ADDRESS };
    }

    return { isValid: true };
  }

  static validateUsername(username: string): { isValid: boolean; error?: string } {
    if (!username || typeof username !== 'string') {
      return { isValid: false, error: 'Username is required' };
    }

    const trimmed = username.trim();
    if (trimmed.length < 3) {
      return { isValid: false, error: 'Username must be at least 3 characters long' };
    }

    if (!VALIDATION.USERNAME.test(trimmed)) {
      return { isValid: false, error: 'Username can only contain letters, numbers, hyphens, and underscores' };
    }

    return { isValid: true };
  }

  static validatePassword(password: string): { isValid: boolean; error?: string } {
    if (!password || typeof password !== 'string') {
      return { isValid: false, error: 'Password is required' };
    }

    if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      return { isValid: false, error: `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters long` };
    }

    return { isValid: true };
  }

  static validateLoginCredentials(username: string, password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    const usernameValidation = this.validateUsername(username);
    if (!usernameValidation.isValid && usernameValidation.error) {
      errors.push(usernameValidation.error);
    }

    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.isValid && passwordValidation.error) {
      errors.push(passwordValidation.error);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static normalizedMacAddress(macAddress: string): string {
    // Convert to uppercase and ensure consistent format (XX:XX:XX:XX:XX:XX)
    return macAddress
      .toUpperCase()
      .replace(/[:-]/g, ':')
      .replace(/(.{2})(?=.)/g, '$1:');
  }

  static isValidPemKey(key: string): boolean {
    if (!key || typeof key !== 'string') {
      return false;
    }

    const publicKeyRegex = /^-----BEGIN PUBLIC KEY-----[\s\S]*-----END PUBLIC KEY-----$/;
    const privateKeyRegex = /^-----BEGIN PRIVATE KEY-----[\s\S]*-----END PRIVATE KEY-----$/;
    
    return publicKeyRegex.test(key.trim()) || privateKeyRegex.test(key.trim());
  }
}