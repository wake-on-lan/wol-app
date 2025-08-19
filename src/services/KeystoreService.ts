import * as Keychain from 'react-native-keychain';
import QuickCrypto from 'react-native-quick-crypto';
import { SECURITY_CONFIG, STORAGE_KEYS } from '../utils/constants';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export class KeystoreService {
  static async generateKeyPair(): Promise<KeyPair> {
    try {
      const keyPair = QuickCrypto.generateKeyPairSync('rsa', {
        modulusLength: SECURITY_CONFIG.RSA_KEY_SIZE,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });

      const publicKey = keyPair.publicKey as any as string;

      const privateKey = keyPair.privateKey as any as string;

      await Keychain.setInternetCredentials(
        STORAGE_KEYS.PRIVATE_KEY,
        'private_key',
        privateKey
      );

      return {
        publicKey,
        privateKey,
      };
    } catch (error) {
      throw new Error(`Failed to generate key pair: ${error}`);
    }
  }

  static async getPrivateKey(): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(
        STORAGE_KEYS.PRIVATE_KEY,
      );
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Failed to retrieve private key:', error);

      // If we get a CryptoFailedException, the key is corrupted/incompatible
      // Clear all keys so we can regenerate them
      if (error && error.toString().includes('CryptoFailedException')) {
        console.warn('Detected corrupted keystore, clearing all keys');
        await this.clearAllKeys();
      }

      return null;
    }
  }

  static async storeServerPublicKey(serverPublicKey: string): Promise<void> {
    try {
      await Keychain.setInternetCredentials(
        STORAGE_KEYS.SERVER_PUBLIC_KEY,
        'server_public_key',
        serverPublicKey,
      );
    } catch (error) {
      throw new Error(`Failed to store server public key: ${error}`);
    }
  }

  static async getServerPublicKey(): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(
        STORAGE_KEYS.SERVER_PUBLIC_KEY,
      );
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Failed to retrieve server public key:', error);
      return null;
    }
  }

  static async storeJwtToken(token: string): Promise<void> {
    try {
      await Keychain.setInternetCredentials(
        STORAGE_KEYS.JWT_TOKEN,
        'jwt_token',
        token,
      );
    } catch (error) {
      throw new Error(`Failed to store JWT token: ${error}`);
    }
  }

  static async getJwtToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(
        STORAGE_KEYS.JWT_TOKEN,
      );
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Failed to retrieve JWT token:', error);
      return null;
    }
  }

  static async clearAllKeys(): Promise<void> {
    const clearKey = async (alias: string) => {
      try {
        // Try to reset the credential
        await Keychain.resetInternetCredentials({ server: alias });
      } catch (error) {
        // If reset fails, ignore since the key might not exist
        console.debug(`Key ${alias} cleared or didn't exist`);
      }
    };

    try {
      await Promise.all([
        clearKey(STORAGE_KEYS.PRIVATE_KEY),
        clearKey(STORAGE_KEYS.SERVER_PUBLIC_KEY),
        clearKey(STORAGE_KEYS.JWT_TOKEN),
      ]);
    } catch (error) {
      console.error('Failed to clear keys:', error);
    }
  }

  static async hasKeysStored(): Promise<boolean> {
    try {
      const [privateKey, serverPublicKey, jwtToken] = await Promise.all([
        this.getPrivateKey(),
        this.getServerPublicKey(),
        this.getJwtToken(),
      ]);

      return !!(privateKey && jwtToken && serverPublicKey);
    } catch (error) {
      console.error('Failed to check key validity:', error);
      return false;
    }
  }
}
