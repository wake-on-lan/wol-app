import React from 'react';
import { View, StyleSheet } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { Device } from '../services/ApiService';

interface DeviceDropdownProps {
  devices: Device[];
  selectedDevice: Device | null;
  onDeviceSelect: (device: Device | null) => void;
  isDarkMode: boolean;
}

const DeviceDropdown: React.FC<DeviceDropdownProps> = ({
  devices,
  selectedDevice,
  onDeviceSelect,
  isDarkMode,
}) => {
  const pickerItems = devices.map(device => ({
    label: `${device.name} (${device.ip})`,
    value: device.mac,
    key: device.mac,
  }));

  const handleValueChange = (value: string | null) => {
    if (value) {
      const device = devices.find(d => d.mac === value);
      onDeviceSelect(device || null);
    } else {
      onDeviceSelect(null);
    }
  };

  const pickerStyle = {
    inputIOS: {
      fontSize: 16,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? '#555' : '#ddd',
      borderRadius: 8,
      color: isDarkMode ? '#fff' : '#000',
      backgroundColor: isDarkMode ? '#333' : '#fff',
      paddingRight: 30,
    },
    inputAndroid: {
      fontSize: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#555' : '#ddd',
      borderRadius: 8,
      color: isDarkMode ? '#fff' : '#000',
      backgroundColor: isDarkMode ? '#333' : '#fff',
      paddingRight: 30,
    },
    placeholder: {
      color: isDarkMode ? '#999' : '#666',
      fontSize: 16,
    },
  };

  return (
    <View style={styles.container}>
      <RNPickerSelect
        onValueChange={handleValueChange}
        items={pickerItems}
        style={pickerStyle}
        value={selectedDevice?.mac || null}
        placeholder={{
          label: 'Select Device...',
          value: null,
          color: isDarkMode ? '#999' : '#666',
        }}
        useNativeAndroidPickerStyle={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
});

export default DeviceDropdown;