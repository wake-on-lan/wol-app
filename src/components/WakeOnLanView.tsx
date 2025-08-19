import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import DeviceDropdown from './DeviceDropdown';
import { ApiService, Device } from '../services/ApiService';
import { ERROR_MESSAGES } from '../utils/constants';

interface WakeOnLanViewProps {
  isDarkMode: boolean;
}

const WakeOnLanView: React.FC<WakeOnLanViewProps> = ({ isDarkMode }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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


  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={[styles.loadingText, { color: isDarkMode ? '#fff' : '#000' }]}>
          Loading devices...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.content}>
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
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.refreshButtonText}>Refresh Devices</Text>
          )}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
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
  disabledButton: {
    backgroundColor: '#ccc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
});

export default WakeOnLanView;