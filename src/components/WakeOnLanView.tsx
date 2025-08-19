import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import DeviceDropdown from './DeviceDropdown';
import { ApiService, Device } from '../services/ApiService';
import { ERROR_MESSAGES } from '../utils/constants';

interface WakeOnLanViewProps {
  isDarkMode: boolean;
  onBack: () => void;
}

const WakeOnLanView: React.FC<WakeOnLanViewProps> = ({ isDarkMode, onBack }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDevices();
  }, []);

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

  const textColor = isDarkMode ? '#fff' : '#000';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: '#007AFF' }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: textColor }]}>Wake on LAN</Text>
      </View>

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
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
});

export default WakeOnLanView;