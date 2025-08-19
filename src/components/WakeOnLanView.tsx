import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DeviceDropdown from './DeviceDropdown';
import { ApiService, Device } from '../services/ApiService';
import { BookmarkService } from '../services/BookmarkService';
import { ERROR_MESSAGES } from '../utils/constants';

interface WakeOnLanViewProps {
  isDarkMode: boolean;
}

const WakeOnLanView: React.FC<WakeOnLanViewProps> = ({ isDarkMode }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState<Device[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);

  useEffect(() => {
    loadDevicesAndBookmarks();
  }, []);

  // New combined function
  const loadDevicesAndBookmarks = async () => {
    try {
      setIsLoading(true);
      await loadDevices();
    } catch (error) {
      console.error('Failed to load devices and bookmarks:', error);
    } finally {
      await loadBookmarkedDevices();
      setIsLoading(false);
    }
  };

  // Keep your existing loadDevices function
  const loadDevices = async () => {
    try {
      const deviceList = await ApiService.scanDevices();
      setDevices(deviceList);
    } catch (error) {
      console.error('Failed to load devices:', error);
      Alert.alert('Error', 'Failed to load devices. Please try again.');
      throw error; // Re-throw to handle in parent
    }
  };

  // Fixed loadBookmarkedDevices function (you had a bug using 'devices' instead of 'fetchedBookmarks')
  const loadBookmarkedDevices = async () => {
    try {
      const fetchedBookmarks = await BookmarkService.getBookmarks();
      setBookmarks(fetchedBookmarks);
      if (fetchedBookmarks.length === 0 && showBookmarks) {
        setShowBookmarks(false);
      }
      // Update devices with bookmark status
      setDevices(prevDevices =>
        prevDevices.map(device => ({
          ...device,
          isBookmarked: fetchedBookmarks.some(b => b.mac === device.mac),
        })),
      );
    } catch (error) {
      console.error('Failed to load bookmarked devices:', error);
      throw error; // Re-throw to handle in parent
    }
  };

  const handleSelectBookmark = (device: Device) => {
    setSelectedDevice(device);
    setShowBookmarks(false);
  };

  const handleDeleteBookmark = async (deviceMac: string) => {
    try {
      await BookmarkService.removeBookmark(deviceMac);
      await loadBookmarkedDevices();
      Alert.alert('Success', 'Bookmark deleted successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete bookmark.');
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
        <Text
          style={[styles.loadingText, { color: isDarkMode ? '#fff' : '#000' }]}
        >
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
        handleBookmarkToggle={async device => {
          try {
            if (device.isBookmarked) {
              await BookmarkService.removeBookmark(device.mac);
            } else {
              await BookmarkService.saveBookmark(device);
            }
            await loadBookmarkedDevices();
          } catch (error) {
            console.error('Bookmark toggle failed:', error);
            Alert.alert('Error', 'Failed to toggle bookmark.');
          }
        }}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.refreshButton]}
          onPress={loadDevices}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.refreshButtonText}>Refresh</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.bookmarkListButton,
            bookmarks.length === 0 && styles.disabledButton,
          ]}
          onPress={() => setShowBookmarks(true)}
          disabled={bookmarks.length === 0}
        >
          <View style={styles.buttonContent}>
            <Icon
              name="bookmark"
              size={16}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.bookmarkListButtonText}>Bookmarks</Text>
          </View>
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

      {/* Bookmarks Modal */}
      <Modal
        visible={showBookmarks}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBookmarks(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowBookmarks(false)}
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: isDarkMode ? '#333' : '#fff' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: isDarkMode ? '#fff' : '#000' },
                ]}
              >
                Bookmarked Devices
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowBookmarks(false)}
              >
                <Icon
                  name="close"
                  size={24}
                  color={isDarkMode ? '#fff' : '#000'}
                />
              </TouchableOpacity>
            </View>

            {bookmarks.length !== 0 && (
              <FlatList
                data={bookmarks}
                keyExtractor={item => item.mac}
                style={styles.bookmarksList}
                renderItem={({ item: bookmark }) => (
                  <View
                    style={[
                      styles.bookmarkItem,
                      {
                        backgroundColor: isDarkMode ? '#444' : '#f9f9f9',
                        borderBottomColor: isDarkMode ? '#555' : '#eee',
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.bookmarkContent}
                      onPress={() => handleSelectBookmark(bookmark)}
                    >
                      <Text
                        style={[
                          styles.bookmarkName,
                          { color: isDarkMode ? '#fff' : '#000' },
                        ]}
                      >
                        {bookmark.name}
                      </Text>
                      <Text
                        style={[
                          styles.bookmarkDetails,
                          { color: isDarkMode ? '#999' : '#666' },
                        ]}
                      >
                        {bookmark.ip}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBookmarkButton}
                      onPress={() => handleDeleteBookmark(bookmark.mac)}
                    >
                      <Icon name="delete" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        </Pressable>
      </Modal>
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
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
  bookmarkListButton: {
    backgroundColor: '#FF9500',
  },
  bookmarkListButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addBookmarkButton: {
    backgroundColor: '#FFD60A',
  },
  removeBookmarkButton: {
    backgroundColor: '#FF9F0A',
  },
  bookmarkButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  bookmarksList: {
    maxHeight: 400,
    marginVertical: 5,
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginHorizontal: 10,
    marginVertical: 5,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  bookmarkContent: {
    flex: 1,
  },
  bookmarkName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bookmarkDetails: {
    fontSize: 14,
  },
  deleteBookmarkButton: {
    padding: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default WakeOnLanView;
