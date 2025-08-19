import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Modal, 
  FlatList, 
  Pressable 
} from 'react-native';
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
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleDeviceSelect = (device: Device | null) => {
    onDeviceSelect(device);
    setIsModalVisible(false);
  };

  const renderItem = ({ item }: { item: Device }) => (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        {
          backgroundColor: isDarkMode ? '#444' : '#f9f9f9',
          borderBottomColor: isDarkMode ? '#555' : '#eee',
        }
      ]}
      onPress={() => handleDeviceSelect(item)}
    >
      <Text style={[
        styles.dropdownItemText,
        { color: isDarkMode ? '#fff' : '#000' }
      ]}>
        {item.name} ({item.ip})
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          {
            borderColor: isDarkMode ? '#555' : '#ddd',
            backgroundColor: isDarkMode ? '#333' : '#fff',
          }
        ]}
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={[
          styles.dropdownButtonText,
          { 
            color: selectedDevice 
              ? (isDarkMode ? '#fff' : '#000') 
              : (isDarkMode ? '#999' : '#666')
          }
        ]}>
          {selectedDevice 
            ? `${selectedDevice.name} (${selectedDevice.ip})` 
            : 'Select Device...'
          }
        </Text>
        <Text style={[
          styles.dropdownArrow,
          { color: isDarkMode ? '#999' : '#666' }
        ]}>
          ▼
        </Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setIsModalVisible(false)}
        >
          <View style={[
            styles.modalContent,
            { backgroundColor: isDarkMode ? '#333' : '#fff' }
          ]}>
            <TouchableOpacity
              style={[
                styles.dropdownItem,
                {
                  backgroundColor: isDarkMode ? '#444' : '#f9f9f9',
                  borderBottomColor: isDarkMode ? '#555' : '#eee',
                }
              ]}
              onPress={() => handleDeviceSelect(null)}
            >
              <Text style={[
                styles.dropdownItemText,
                { color: isDarkMode ? '#999' : '#666' }
              ]}>
                Select Device...
              </Text>
            </TouchableOpacity>
            <FlatList
              data={devices}
              renderItem={renderItem}
              keyExtractor={(item) => item.mac}
              style={styles.dropdownList}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 48,
  },
  dropdownButtonText: {
    fontSize: 16,
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '60%',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 16,
  },
});

export default DeviceDropdown;