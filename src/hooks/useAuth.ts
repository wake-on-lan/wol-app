import { useState, useEffect, useCallback } from 'react';
import { ApiService } from '../services/ApiService';
import { KeystoreService } from '../services/KeystoreService';

export interface AuthState {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  keyExpiryTime: Date | null;
  isLoading: boolean;
}

export const useAuth = (): AuthState => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [keyExpiryTime, setKeyExpiryTime] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Monitor key expiry
  useEffect(() => {
    if (!isAuthenticated || !keyExpiryTime) {
      return;
    }

    const checkExpiry = () => {
      const now = new Date();
      const timeUntilExpiry = keyExpiryTime.getTime() - now.getTime();
      
      // Log out if expired
      if (timeUntilExpiry <= 0) {
        logout();
        return;
      }

      // Show warning 1 hour before expiry (3600000 ms)
      if (timeUntilExpiry <= 3600000 && timeUntilExpiry > 3540000) {
        // You can add a warning notification here
        console.warn('Keys will expire in less than 1 hour');
      }
    };

    const interval = setInterval(checkExpiry, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isAuthenticated, keyExpiryTime]);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const hasValidKeys = await KeystoreService.hasValidKeys();
      
      if (hasValidKeys) {
        const needsReauth = await ApiService.needsReauth();
        if (!needsReauth) {
          const expiry = await KeystoreService.getKeyExpiryTime();
          setKeyExpiryTime(expiry);
          setIsAuthenticated(true);
        } else {
          const hasAnyKeys = await KeystoreService.hasAnyKeys();
          if (hasAnyKeys) {
            await KeystoreService.clearAllKeys();
          }
          setIsAuthenticated(false);
          setKeyExpiryTime(null);
        }
      } else {
        setIsAuthenticated(false);
        setKeyExpiryTime(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setKeyExpiryTime(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (username: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Clear any existing keys first
      const hasAnyKeys = await KeystoreService.hasAnyKeys();
      if (hasAnyKeys) {
        await KeystoreService.clearAllKeys();
      }
      // Perform full authentication flow
      await ApiService.performFullAuth(username, password);
      
      // Update state
      const expiry = await KeystoreService.getKeyExpiryTime();
      setKeyExpiryTime(expiry);
      setIsAuthenticated(true);
    } catch (error) {
      // Ensure we're logged out on failure
      const hasAnyKeys = await KeystoreService.hasAnyKeys();
      if (hasAnyKeys) {
        await KeystoreService.clearAllKeys();
      }
      setIsAuthenticated(false);
      setKeyExpiryTime(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      const hasAnyKeys = await KeystoreService.hasAnyKeys();
      if (hasAnyKeys) {
        await KeystoreService.clearAllKeys();
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsAuthenticated(false);
      setKeyExpiryTime(null);
      setIsLoading(false);
    }
  }, []);

  return {
    isAuthenticated,
    login,
    logout,
    keyExpiryTime,
    isLoading,
  };
};