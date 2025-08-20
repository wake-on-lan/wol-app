import { KeystoreService } from './KeystoreService';
import { CryptoService, EncryptedMessage } from './CryptoService';
import { API_CONFIG } from '../utils/constants';
import { KeyPairKey } from 'react-native-quick-crypto/lib/typescript/src/Cipher';

export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface ServerPublicKeyResponse {
  publicKey: string;
  expiresAt: string;
}

export interface RegisterKeyDto {
  publicKey: string;
}

export interface RegisterKeyResponse {
  id: number;
  expiresAt: string;
  isActive: boolean;
  publicKeyPem: string;
  createdAt: string;
}

export interface Device {
  name: string;
  mac: string;
  ip: string;
  isBookmarked?: boolean;
}

export interface WakeOnLanDto {
  macAddress: string;
}

export interface WakeOnLanResponse {
  success: boolean;
  message?: string;
  target?: {
    macAddress: string;
  };
  timestamp: string;
  error?: string;
}

export interface PingResponse {
  inputHost: string;
  host: string;
  numeric_host?: string;
  alive: boolean;
  output: string;
  time: number | 'unknown';
  times: number[];
  min: string;
  max: string;
  avg: string;
  stddev: string;
  packetLoss: string;
}

export interface UpResult {
  hostname: string;
  reachable: boolean;
}

export interface ShellCommandDto {
  host: string;
  port: number;
  user: string;
  command: string;
  password?: string;
  privateKey?: string;
}

export interface ShellCommandResponse {
  success: boolean;
  command: string;
  exitStatus: number;
  message: string;
  timestamp: string;
}

export class ApiService {
  private static readonly BASE_URL = API_CONFIG.BASE_URL;

  private static async makeRequest(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const url = `${this.BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      return response;
    } catch (error) {
      console.error('API request error:', error);
      if (
        error instanceof TypeError &&
        error.message.includes('Network request failed')
      ) {
        throw new Error(
          `Cannot connect to server at ${this.BASE_URL}. Please check if the server is running and your network connection.`,
        );
      }
      throw error;
    }
  }

  private static async makeAuthenticatedRequest(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const token = await KeystoreService.getJwtToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    return await this.makeRequest(endpoint, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  }

  private static async makeEncryptedRequest(
    endpoint: string,
    payload?: any,
    method: string = 'POST',
  ): Promise<any> {
    const clientPrivateKey = await KeystoreService.getPrivateKey();
    if (!clientPrivateKey) {
      throw new Error('Missing encryption keys');
    }
    let encryptedPayload: EncryptedMessage | undefined;
    if (payload) {
      const serverPublicKey =
        (await KeystoreService.getServerPublicKey()) as any as string;

      encryptedPayload = await CryptoService.encryptForServer(
        payload,
        serverPublicKey,
      );
    }
    const response = await this.makeAuthenticatedRequest(endpoint, {
      method,
      body: encryptedPayload ? JSON.stringify(encryptedPayload) : undefined,
    });
    const encryptedResponse = (await response.json()) as EncryptedMessage;
    return await CryptoService.decryptFromServer(
      encryptedResponse,
      clientPrivateKey,
    );
  }

  // Authentication
  static async login(credentials: LoginDto): Promise<LoginResponse> {
    const response = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    const result = (await response.json()) as LoginResponse;
    // Store JWT token
    await KeystoreService.storeJwtToken(result.access_token);

    return result;
  }

  // Key Management
  static async getServerPublicKey(): Promise<ServerPublicKeyResponse> {
    const response = await this.makeAuthenticatedRequest('/keys/server-public');
    const result = (await response.json()) as ServerPublicKeyResponse;

    // Store server public key for encryption
    await KeystoreService.storeServerPublicKey(result.publicKey);

    return result;
  }

  static async registerClientPublicKey(
    publicKey: string,
  ): Promise<RegisterKeyResponse> {
    const payload: RegisterKeyDto = { publicKey };
    const response = await this.makeAuthenticatedRequest('/keys/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return (await response.json()) as RegisterKeyResponse;
  }

  static async getMyKey(): Promise<RegisterKeyResponse | null> {
    return this.makeEncryptedRequest('/keys/my-key', undefined, 'GET');
  }

  // Device Management
  static async scanDevices(): Promise<Device[]> {
    return await this.makeEncryptedRequest(
      '/commands/scan-devices',
      undefined,
      'GET',
    );
  }

  // Wake-on-LAN
  static async wakeOnLan(macAddress: string): Promise<WakeOnLanResponse> {
    const payload: WakeOnLanDto = { macAddress };
    return this.makeEncryptedRequest('/commands/wake-on-lan', payload);
  }

  // Ping
  static async ping(hostname: string): Promise<PingResponse> {
    return this.makeEncryptedRequest(
      `/commands/ping?hostname=${encodeURIComponent(hostname)}`,
      undefined,
      'GET',
    );
  }

  // Health Check
  static async checkDeviceStatus(
    hostname: string,
  ): Promise<{ alive: boolean; time: number }> {
    return this.makeEncryptedRequest(
      `/commands/up?hostname=${encodeURIComponent(hostname)}`,
      undefined,
      'GET',
    );
  }

  static async checkHttpsAvailability(hostname: string): Promise<UpResult> {
    return this.makeEncryptedRequest(
      `/commands/checkHttpsAvailability?hostname=${encodeURIComponent(hostname)}`,
      undefined,
      'GET',
    );
  }

  // Shell Command
  static async sendShellCommand(shellCommand: ShellCommandDto): Promise<ShellCommandResponse> {
    return this.makeEncryptedRequest('/commands/shell', shellCommand);
  }

  // Complete Authentication Flow
  static async performFullAuth(
    username: string,
    password: string,
  ): Promise<void> {
    try {
      // 1. Login and get JWT
      await this.login({ username, password });
      // 2. Get server public key
      await this.getServerPublicKey();

      // // 3. Generate client key pair
      const keyPair = await KeystoreService.generateKeyPair();
      // // 4. Register client public key with server
      await this.registerClientPublicKey(keyPair.publicKey);
    } catch (error) {
      // Clean up on failure
      await KeystoreService.clearAllKeys();
      throw error;
    }
  }
}
