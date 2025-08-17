import QuickCrypto from 'react-native-quick-crypto';
import { Buffer } from '@craftzdog/react-native-buffer';

export interface EncryptedMessage {
  data: string; // Base64-encoded AES-encrypted JSON
  key: string; // Base64-encoded RSA-encrypted AES key
  iv: string; // Base64-encoded RSA-encrypted IV
}

export class CryptoService {
  private static rsaEncrypt(data: string, publicKeyPem: string): string {
    const buffer = Buffer.from(data, 'base64');
    return QuickCrypto.publicEncrypt(
      {
        key: publicKeyPem,
        padding: QuickCrypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buffer,
    ).toString('base64');
  }

  private static rsaDecrypt(
    encryptedData: string,
    privateKeyPem: string,
  ): Buffer {
    const decrypted = QuickCrypto.privateDecrypt(
      {
        key: privateKeyPem,
        padding: QuickCrypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(encryptedData, 'base64'),
    );
    return decrypted;
  }

  static async encryptForServer(
    payload: any,
    serverPublicKey: string,
  ): Promise<EncryptedMessage> {
    try {
      const json =
        typeof payload === 'string' ? payload : JSON.stringify(payload);
      const aesKey = QuickCrypto.randomBytes(32);
      const iv = QuickCrypto.randomBytes(16);

      // Convert payload to JSON string
      const jsonPayload = JSON.stringify(payload);

      // Encrypt payload with AES-256-CBC
      const cipher = QuickCrypto.createCipheriv('aes-256-cbc', aesKey, iv);
      let encrypted = cipher.update(json, 'utf-8', 'base64') as any as string;
      encrypted += cipher.final('base64');

      return {
        data: encrypted,
        key: this.rsaEncrypt(aesKey.toString('base64'), serverPublicKey),
        iv: this.rsaEncrypt(iv.toString('base64'), serverPublicKey),
      };
    } catch (error) {
      throw new Error(`Failed to encrypt message: ${error}`);
    }
  }

  static async decryptFromServer(
    encryptedMessage: EncryptedMessage,
    clientPrivateKey: string,
  ): Promise<any> {
    try {
      const { data, key, iv } = encryptedMessage;

      const aesKeyBuffer = this.rsaDecrypt(key, clientPrivateKey);
      const ivBuffer = this.rsaDecrypt(iv, clientPrivateKey);

      const decipher = QuickCrypto.createDecipheriv(
        'aes-256-cbc',
        aesKeyBuffer,
        ivBuffer,
      );

      let decrypted = decipher.update(data, 'base64', 'utf-8') as any as string;
      decrypted += decipher.final('utf-8');

      if (!decrypted) {
        throw new Error('Decrypted string is empty');
      }

      const result = JSON.parse(decrypted);
      return result;
    } catch (error) {
      console.error('Decryption failed at step:', error);

      // If we get a PKCS_DECODING_ERROR, the keys are incompatible
      if (error && error.toString().includes('PKCS_DECODING_ERROR')) {
        console.warn(
          'Detected incompatible key format, keys may need to be regenerated',
        );
      }

      throw new Error(`Failed to decrypt message: ${error}`);
    }
  }

  static isValidPemFormat(key: string): boolean {
    const publicKeyRegex =
      /^-----BEGIN PUBLIC KEY-----[\s\S]*-----END PUBLIC KEY-----$/;
    const privateKeyRegex =
      /^-----BEGIN PRIVATE KEY-----[\s\S]*-----END PRIVATE KEY-----$/;

    return publicKeyRegex.test(key.trim()) || privateKeyRegex.test(key.trim());
  }

  static extractPublicKeyFromPrivate(privateKeyPem: string): string {
    // Note: react-native-rsa-native should provide this functionality
    // This is a placeholder - you might need to use a different method
    // depending on the actual library implementation
    throw new Error(
      'Public key extraction not implemented - generate key pair instead',
    );
  }
}
