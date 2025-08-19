import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  StatusBar,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import LoginForm from 'src/components/LoginForm';
import DeviceDropdown from 'src/components/DeviceDropdown';
import StatusIndicator from 'src/components/StatusIndicator';
import { useAuth } from 'src/hooks/useAuth';
import { ApiService, Device } from 'src/services/ApiService';
import { ERROR_MESSAGES } from 'src/utils/constants';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const {
    isAuthenticated,
    login,
    logout,
    serverPublicKeyExpiryTime,
    jwtTokenExpiryTime,
  } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
  };

  // Load devices when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadDevices();
    } else {
      setDevices([]);
      setSelectedDevice(null);
    }
  }, [isAuthenticated]);

  const loadDevices = async () => {
    try {
      setIsLoading(true);
      const deviceList = await ApiService.scanDevices();
      setDevices(deviceList);
    } catch (error) {
      console.error('Failed to load devices:', error);
      Alert.alert('Error', 'Failed to load devices. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      await login(username, password);
    } catch (error) {
      Alert.alert(
        'Login Failed',
        'Please check your credentials and try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleWakeDevice = async () => {
    if (!selectedDevice) {
      Alert.alert(
        ERROR_MESSAGES.NO_DEVICE_SELECTED,
        'Please select a device to wake.',
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await ApiService.wakeOnLan(selectedDevice.mac);

      if (result.success) {
        Alert.alert(
          'Success',
          result.message || `Wake-on-LAN signal sent to ${selectedDevice.name}`,
        );
      } else {
        Alert.alert(
          'Warning',
          result.error ||
            result.message ||
            'Wake-on-LAN signal sent but status unknown',
        );
      }
    } catch (error) {
      console.error('Wake-on-LAN failed:', error);
      Alert.alert(
        'Error',
        'Failed to send Wake-on-LAN signal. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <SafeAreaView style={[styles.container, backgroundStyle]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>
            WOL Manager
          </Text>
        </View>

        <View style={styles.content}>
          {isAuthenticated && (
            <>
              <StatusIndicator
                keyExpiryTime={jwtTokenExpiryTime}
                name="Authentication"
                isDarkMode={isDarkMode}
              />
              <StatusIndicator
                keyExpiryTime={serverPublicKeyExpiryTime}
                name="Server Public Key"
                isDarkMode={isDarkMode}
              />
            </>
          )}
          {!isAuthenticated ? (
            <LoginForm
              onLogin={handleLogin}
              isLoading={isLoading}
              isDarkMode={isDarkMode}
            />
          ) : (
            <View style={styles.mainContent}>
              <DeviceDropdown
                devices={devices}
                selectedDevice={selectedDevice}
                onDeviceSelect={setSelectedDevice}
                isDarkMode={isDarkMode}
              />

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.refreshButton]}
                  onPress={loadDevices}
                  disabled={isLoading}
                >
                  <Text style={styles.refreshButtonText}>
                    {isLoading ? 'Loading...' : 'Refresh Devices'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.wakeButton,
                    (!selectedDevice || isLoading) && styles.disabledButton,
                  ]}
                  onPress={handleWakeDevice}
                  disabled={!selectedDevice || isLoading}
                >
                  <Text style={[styles.buttonText, styles.wakeButtonText]}>
                    Wake Device
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.logoutButton]}
                  onPress={logout}
                  disabled={isLoading}
                >
                  <Text style={[styles.buttonText, styles.logoutButtonText]}>
                    Logout
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  mainContent: {
    marginTop: 20,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#34C759',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  wakeButton: {
    backgroundColor: '#007AFF',
  },
  wakeButtonText: {
    color: '#fff',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
  },
  logoutButtonText: {
    color: '#fff',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default App;
