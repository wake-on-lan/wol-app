/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from 'react';
import { ApiService } from '../services/ApiService';
import { KeystoreService } from '../services/KeystoreService';
import { jwtDecode } from 'jwt-decode';
import QuickCrypto from 'react-native-quick-crypto';

export interface AuthState {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  serverPublicKeyExpiryTime: Date | null;
  jwtTokenExpiryTime: Date | null;
  isLoading: boolean;
  refreshServerPublicKey: () => Promise<void>;
}

export const useAuth = (): AuthState => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [jwtTokenExpiryTime, setJwtTokenExpiryTime] = useState<Date | null>(
    null,
  );
  const refreshServerPublicKey = async () => {
    await KeystoreService.clearServerPublicKey();
    const key = await ApiService.getServerPublicKey();
    // assume the API returns expiry, update state
    setServerPublicKeyExpiryTime(new Date(key.expiresAt));
  };

  const [serverPublicKeyExpiryTime, setServerPublicKeyExpiryTime] =
    useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !jwtTokenExpiryTime) {
      return;
    }

    const checkExpiry = () => {
      const now = new Date();
      const timeJwt = jwtTokenExpiryTime.getTime() - now.getTime();

      if (timeJwt <= 0) {
        logout();
        return;
      }
    };

    const interval = setInterval(checkExpiry, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isAuthenticated, jwtTokenExpiryTime]);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      if (await KeystoreService.hasKeysStored()) {
        setIsAuthenticated(true);
        const publicKey = QuickCrypto.createPublicKey(
          (await KeystoreService.getPrivateKey()) as any as string,
        );
        ApiService.registerClientPublicKey(
          publicKey.export({ type: 'spki', format: 'pem' }) as any as string,
        );
        await getServerPublickeyInfo();
        await getJwtTokenInfo();
      } else {
        logout();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (username: string, password: string) => {
    try {
      setIsLoading(true);
      await ApiService.performFullAuth(username, password);
      await getServerPublickeyInfo();
      await getJwtTokenInfo();
      setIsAuthenticated(true);
    } catch (error) {
      await KeystoreService.clearAllKeys();
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await KeystoreService.clearAllKeys();
      setIsAuthenticated(false);
      setServerPublicKeyExpiryTime(null);
      setJwtTokenExpiryTime(null);
    } catch (error) {
      console.error('Error during logout:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getServerPublickeyInfo = async () => {
    const serverPublicKey = await ApiService.getServerPublicKey();
    if (serverPublicKey && serverPublicKey.expiresAt) {
      setServerPublicKeyExpiryTime(new Date(serverPublicKey.expiresAt));
    }
  };

  const getJwtTokenInfo = async () => {
    const jwtToken = await KeystoreService.getJwtToken();
    if (jwtToken) {
      const tokenInfo = jwtDecode(jwtToken);
      setJwtTokenExpiryTime(new Date((tokenInfo.exp ?? 0) * 1000));
    }
  };

  return {
    isAuthenticated,
    login,
    logout,
    jwtTokenExpiryTime,
    serverPublicKeyExpiryTime,
    refreshServerPublicKey,
    isLoading,
  };
};
