import * as Keychain from 'react-native-keychain';
import QuickCrypto from 'react-native-quick-crypto';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export class KeystoreService {
  private static readonly PRIVATE_KEY_ALIAS = 'wol_app_private_key';
  private static readonly PUBLIC_KEY_ALIAS = 'wol_app_public_key';
  private static readonly KEY_EXPIRY_ALIAS = 'wol_app_key_expiry';
  private static readonly SERVER_PUBLIC_KEY_ALIAS = 'wol_app_server_public_key';
  private static readonly JWT_TOKEN_ALIAS = 'wol_app_jwt_token';

  static async generateKeyPair(): Promise<KeyPair> {
    try {
      const keyPair = QuickCrypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      const publicKey = keyPair.publicKey as any as string;
      const privateKey = keyPair.privateKey as any as string;
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + 24);
      await Keychain.setInternetCredentials(
        this.PRIVATE_KEY_ALIAS,
        'private_key',
        privateKey as any as string,
      );
      await Keychain.setInternetCredentials(
        this.PUBLIC_KEY_ALIAS,
        'public_key',
        publicKey as any as string,
      );

      await Keychain.setInternetCredentials(
        this.KEY_EXPIRY_ALIAS,
        'expiry',
        expiryTime.toISOString(),
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
        this.PRIVATE_KEY_ALIAS,
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

  static async getPublicKey(): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(
        this.PUBLIC_KEY_ALIAS,
      );
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Failed to retrieve public key:', error);
      return null;
    }
  }

  static async storeServerPublicKey(serverPublicKey: string): Promise<void> {
    try {
      await Keychain.setInternetCredentials(
        this.SERVER_PUBLIC_KEY_ALIAS,
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
        this.SERVER_PUBLIC_KEY_ALIAS,
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
        this.JWT_TOKEN_ALIAS,
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
        this.JWT_TOKEN_ALIAS,
      );
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Failed to retrieve JWT token:', error);
      return null;
    }
  }

  static async getKeyExpiryTime(): Promise<Date | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(
        this.KEY_EXPIRY_ALIAS,
      );
      if (!credentials) {
        return null;
      }
      return new Date(credentials.password);
    } catch (error) {
      console.error('Failed to retrieve key expiry time:', error);
      return null;
    }
  }

  static async isKeyExpired(): Promise<boolean> {
    try {
      const expiryTime = await this.getKeyExpiryTime();
      if (!expiryTime) {
        return true;
      }
      return new Date() > expiryTime;
    } catch (error) {
      console.error('Failed to check key expiry:', error);
      return true;
    }
  }

  static async clearAllKeys(): Promise<void> {
    const clearKey = async (alias: string) => {
      try {
        // Try to reset the credential
        await (Keychain.resetInternetCredentials as any)(alias);
      } catch (error) {
        // If reset fails, ignore since the key might not exist
        console.debug(`Key ${alias} cleared or didn't exist`);
      }
    };

    try {
      await Promise.all([
        clearKey(this.PRIVATE_KEY_ALIAS),
        clearKey(this.PUBLIC_KEY_ALIAS),
        clearKey(this.KEY_EXPIRY_ALIAS),
        clearKey(this.SERVER_PUBLIC_KEY_ALIAS),
        clearKey(this.JWT_TOKEN_ALIAS),
      ]);
    } catch (error) {
      console.error('Failed to clear keys:', error);
    }
  }

  static async hasAnyKeys(): Promise<boolean> {
    try {
      const [privateKey, publicKey, jwtToken, serverKey, expiryTime] =
        await Promise.all([
          this.getPrivateKey(),
          this.getPublicKey(),
          this.getJwtToken(),
          this.getServerPublicKey(),
          this.getKeyExpiryTime(),
        ]);

      return !!(privateKey || publicKey || jwtToken || serverKey || expiryTime);
    } catch (error) {
      console.error('Failed to check if keys exist:', error);
      return false;
    }
  }

  static async hasValidKeys(): Promise<boolean> {
    try {
      const [privateKey, publicKey, jwtToken, isExpired] = await Promise.all([
        this.getPrivateKey(),
        this.getPublicKey(),
        this.getJwtToken(),
        this.isKeyExpired(),
      ]);

      return !!(privateKey && publicKey && jwtToken && !isExpired);
    } catch (error) {
      console.error('Failed to check key validity:', error);
      return false;
    }
  }
}
