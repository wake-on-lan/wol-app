import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ApiService,
  ShellCommandDto,
  ShellCommandResponse,
} from '../services/ApiService';
import { isDarkModeProps } from './MainMenu';
import ResultInfoBox, { ResultRow } from './ResultInfoBox';
import { KeystoreService } from '../services/KeystoreService';
import { pick, types, isErrorWithCode } from '@react-native-documents/picker';
import { btoa } from 'react-native-quick-base64';

type AuthMethod = 'password' | 'privateKey';

type SavedConfig = {
  id: string;
  name: string;
  host: string;
  port: string;
  user: string;
  command: string;
  authMethod: AuthMethod;
  selectedKeyId?: string | null;
  selectedKeyFileName?: string | null; // just the label, not the content
  createdAt: string;
};

const STORAGE_KEY_CONFIGS = '@saved_command_configs';

const CommandsView: React.FC<isDarkModeProps> = ({ isDarkMode }) => {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('22');
  const [user, setUser] = useState('');
  const [command, setCommand] = useState('');
  const [password, setPassword] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('password');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShellCommandResponse | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showSaveKeyModal, setShowSaveKeyModal] = useState(false);
  const [savedKeys, setSavedKeys] = useState<
    Array<{ id: string; name: string; createdAt: string }>
  >([]);
  const [keyName, setKeyName] = useState('');
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [selectedKeyFile, setSelectedKeyFile] = useState<{
    name: string;
    uri: string;
  } | null>(null);

  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [saveConfigModalVisible, setSaveConfigModalVisible] = useState(false);
  const [configs, setConfigs] = useState<SavedConfig[]>([]);
  const [configSearch, setConfigSearch] = useState('');
  const [newConfigName, setNewConfigName] = useState('');

  const textColor = isDarkMode ? '#fff' : '#000';
  const inputBackgroundColor = isDarkMode ? '#333' : '#fff';
  const borderColor = isDarkMode ? '#555' : '#ddd';
  const buttonColor = isDarkMode ? '#007AFF' : '#007AFF';
  const disabledButtonColor = isDarkMode ? '#444' : '#ccc';

  const isValidInput = (): boolean => {
    if (!host.trim() || !user.trim() || !command.trim()) return false;
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) return false;
    if (authMethod === 'password' && !password.trim()) return false;
    if (authMethod === 'privateKey' && !selectedKeyFile && !privateKey.trim())
      return false;
    return true;
  };

  const handleExecuteCommand = async () => {
    if (!isValidInput()) {
      Alert.alert(
        'Invalid Input',
        'Please fill in all required fields with valid values.',
      );
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const shellCommand: ShellCommandDto = {
        host: host.trim(),
        port: parseInt(port),
        user: user.trim(),
        command: command.trim(),
      };

      if (authMethod === 'password') {
        shellCommand.password = password;
      } else {
        const keyToUse = selectedKeyFile
          ? await readPrivateKeyFile(selectedKeyFile.uri)
          : privateKey;
        shellCommand.privateKey = keyToUse;
      }

      const response = await ApiService.sendShellCommand(shellCommand);
      setResult(response);
    } catch (error: any) {
      Alert.alert(
        'Command Execution Failed',
        error.message || 'An error occurred while executing the command.',
      );
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => setResult(null);

  const loadSavedKeys = async () => {
    try {
      const keys = await KeystoreService.getSSHPrivateKeyList();
      setSavedKeys(keys);
    } catch (error) {
      console.error('Failed to load saved keys:', error);
    }
  };

  const handleSaveKey = async () => {
    if (!keyName.trim() || !privateKey.trim()) {
      Alert.alert('Invalid Input', 'Please provide both key name and private key.');
      return;
    }
    try {
      await KeystoreService.saveSSHPrivateKey(keyName.trim(), privateKey.trim());
      setShowSaveKeyModal(false);
      setKeyName('');
      Alert.alert('Success', 'Private key saved successfully!');
      await loadSavedKeys();
    } catch (error: any) {
      Alert.alert('Save Failed', error.message || 'Failed to save private key.');
    }
  };

  const handleLoadKey = async (keyId: string) => {
    try {
      const savedKey = await KeystoreService.getSSHPrivateKey(keyId);
      if (savedKey) {
        setPrivateKey(savedKey.privateKey);
        setSelectedKeyId(keyId);
        setSelectedKeyFile(null);
        setShowKeyModal(false);
      }
    } catch (error: any) {
      Alert.alert('Load Failed', error.message || 'Failed to load private key.');
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    Alert.alert('Delete Key', 'Are you sure you want to delete this private key?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await KeystoreService.deleteSSHPrivateKey(keyId);
            await loadSavedKeys();
            if (selectedKeyId === keyId) {
              setSelectedKeyId(null);
              setPrivateKey('');
            }
          } catch (error: any) {
            Alert.alert('Delete Failed', error.message || 'Failed to delete private key.');
          }
        },
      },
    ]);
  };

  const readPrivateKeyFile = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const text = await response.text();
      return btoa(text);
    } catch {
      throw new Error('Failed to read private key file');
    }
  };

  const handlePickKeyFile = async () => {
    try {
      const result = await pick({ type: [types.allFiles], allowMultiSelection: false });
      if (result && result.length > 0) {
        const file = result[0];
        setSelectedKeyFile({ name: file.name || 'Unknown', uri: file.uri });
        setSelectedKeyId(null);
        setPrivateKey('');
      }
    } catch (error: any) {
      if (!isErrorWithCode(error)) {
        Alert.alert('File Selection Failed', error.message || 'Failed to select private key file.');
      }
    }
  };

  const handleSaveCurrentKey = async () => {
    if (!selectedKeyFile) return;
    try {
      const keyContent = await readPrivateKeyFile(selectedKeyFile.uri);
      await KeystoreService.saveSSHPrivateKey(selectedKeyFile.name, keyContent);
      Alert.alert('Success', 'Private key file saved successfully!');
      await loadSavedKeys();
    } catch (error: any) {
      Alert.alert('Save Failed', error.message || 'Failed to save private key file.');
    }
  };

  React.useEffect(() => {
    loadSavedKeys();
    loadConfigs(); // 🔖 load saved configs at mount
  }, []);

  // ---------- 🔖 Bookmarks: storage helpers ----------
  const loadConfigs = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_CONFIGS);
      if (raw) setConfigs(JSON.parse(raw));
      else setConfigs([]);
    } catch (e) {
      console.warn('Failed to load configs', e);
    }
  };

  const persistConfigs = async (next: SavedConfig[]) => {
    setConfigs(next);
    await AsyncStorage.setItem(STORAGE_KEY_CONFIGS, JSON.stringify(next));
  };

  const saveCurrentAsConfig = async () => {
    if (!newConfigName.trim()) {
      Alert.alert('Name required', 'Please enter a name for this configuration.');
      return;
    }
    const cfg: SavedConfig = {
      id: Date.now().toString(),
      name: newConfigName.trim(),
      host,
      port,
      user,
      command,
      authMethod,
      selectedKeyId: selectedKeyId || null,
      selectedKeyFileName: selectedKeyFile?.name || null,
      createdAt: new Date().toISOString(),
    };
    const next = [...configs, cfg];
    await persistConfigs(next);
    setNewConfigName('');
    setSaveConfigModalVisible(false);
    Alert.alert('Saved', 'Configuration bookmarked.');
  };

  const deleteConfig = async (id: string) => {
    const next = configs.filter(c => c.id !== id);
    await persistConfigs(next);
  };

  const applyConfig = async (cfg: SavedConfig) => {
    setHost(cfg.host);
    setPort(cfg.port);
    setUser(cfg.user);
    setCommand(cfg.command);
    setAuthMethod(cfg.authMethod);
    setSelectedKeyFile(null);
    setSelectedKeyId(cfg.selectedKeyId || null);
    setPrivateKey('');

    // If private key auth via saved key, load the key (will prompt biometrics)
    if (cfg.authMethod === 'privateKey' && cfg.selectedKeyId) {
      try {
        const savedKey = await KeystoreService.getSSHPrivateKey(cfg.selectedKeyId);
        if (savedKey) {
          setPrivateKey(savedKey.privateKey);
        } else {
          Alert.alert('Key Missing', 'Saved private key could not be found.');
        }
      } catch (e: any) {
        Alert.alert('Authentication Failed', e?.message || 'Could not unlock private key.');
      }
    }

    setConfigModalVisible(false);
  };

  // ---------- UI ----------
  return (
    <ScrollView style={styles.container}>
      {/* Top row: title + bookmark actions */}
      <View style={styles.topRow}>
        <Text style={[styles.bookmarkTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
          SSH Command
        </Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setConfigModalVisible(true)}
            accessibilityLabel="Open saved configurations"
          >
            <MaterialIcons name="bookmarks" size={22} color={buttonColor} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setSaveConfigModalVisible(true)}
            accessibilityLabel="Save current configuration"
          >
            <MaterialIcons name="bookmark-add" size={22} color={buttonColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Inputs */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: isDarkMode ? '#fff' : '#000' }]}>Host *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackgroundColor, borderColor, color: textColor }]}
          value={host}
          onChangeText={setHost}
          placeholder="Enter hostname or IP address"
          placeholderTextColor={isDarkMode ? '#888' : '#999'}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: textColor }]}>Port *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackgroundColor, borderColor, color: textColor }]}
          value={port}
          onChangeText={setPort}
          placeholder="SSH port (default: 22)"
          placeholderTextColor={isDarkMode ? '#888' : '#999'}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: textColor }]}>Username *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackgroundColor, borderColor, color: textColor }]}
          value={user}
          onChangeText={setUser}
          placeholder="SSH username"
          placeholderTextColor={isDarkMode ? '#888' : '#999'}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: textColor }]}>Command *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackgroundColor, borderColor, color: textColor }]}
          value={command}
          onChangeText={setCommand}
          placeholder="Shell command to execute"
          placeholderTextColor={isDarkMode ? '#888' : '#999'}
          multiline
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: textColor }]}>Authentication</Text>
        <TouchableOpacity
          style={[styles.authSelector, { backgroundColor: inputBackgroundColor, borderColor }]}
          onPress={() => setShowAuthModal(true)}
        >
          <MaterialIcons name={authMethod === 'password' ? 'lock' : 'vpn-key'} size={20} color={buttonColor} />
          <Text style={[styles.authSelectorText, { color: textColor }]}>
            {authMethod === 'password' ? 'Password Authentication' : 'Private Key Authentication'}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color={textColor} />
        </TouchableOpacity>
      </View>

      {authMethod === 'password' ? (
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColor }]}>Password *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBackgroundColor, borderColor, color: textColor }]}
            value={password}
            onChangeText={setPassword}
            placeholder="SSH password"
            placeholderTextColor={isDarkMode ? '#888' : '#999'}
            secureTextEntry
          />
        </View>
      ) : (
        <View style={styles.inputGroup}>
          <View style={styles.keyHeaderRow}>
            <Text style={[styles.label, { color: textColor }]}>Private Key File *</Text>
            <View style={styles.keyActions}>
              <TouchableOpacity
                style={styles.keyActionButton}
                onPress={() => {
                  loadSavedKeys();
                  setShowKeyModal(true);
                }}
              >
                <MaterialIcons name="folder" size={20} color={buttonColor} />
              </TouchableOpacity>
              {selectedKeyFile && (
                <TouchableOpacity style={styles.keyActionButton} onPress={handleSaveCurrentKey}>
                  <MaterialIcons name="save" size={20} color={buttonColor} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.filePickerButton, { backgroundColor: inputBackgroundColor, borderColor }]}
            onPress={handlePickKeyFile}
          >
            <MaterialIcons name="attach-file" size={24} color={buttonColor} />
            <Text style={[styles.filePickerText, { color: textColor }]}>
              {selectedKeyFile ? selectedKeyFile.name : 'Select private key file'}
            </Text>
          </TouchableOpacity>

          {selectedKeyId && <Text style={[styles.selectedKeyText, { color: buttonColor }]}>✓ Using saved key</Text>}
          {selectedKeyFile && !selectedKeyId && (
            <Text style={[styles.selectedKeyText, { color: buttonColor }]}>✓ File selected: {selectedKeyFile.name}</Text>
          )}
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: isValidInput() ? buttonColor : disabledButtonColor }]}
          onPress={handleExecuteCommand}
          disabled={!isValidInput() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialIcons name="terminal" size={20} color="#fff" />
              <Text style={styles.buttonText}>Execute Command</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {result &&
        (() => {
          const rows: ResultRow[] = [
            { label: 'Command', value: result.command, monospace: true },
            { label: 'Exit Status', value: result.exitStatus.toString(), monospace: true },
            { label: 'Timestamp', value: result.timestamp },
          ];
          if (result.message) {
            rows.push({ label: 'Output', value: result.message, monospace: true });
          }
          return (
            <ResultInfoBox
              success={result.success}
              title={result.success ? 'Command executed successfully' : 'Command execution failed'}
              onClear={clearResults}
              rows={rows}
              style={{ marginBottom: 40 }}
              isDarkMode={isDarkMode}
              horizontalScroll
              testID="command-result"
            />
          );
        })()}

      {/* Auth Method Modal */}
      <Modal
        visible={showAuthModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAuthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#333' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Select Authentication Method</Text>

            <TouchableOpacity
              style={[styles.authOption, authMethod === 'password' && styles.selectedAuthOption]}
              onPress={() => {
                setAuthMethod('password');
                setShowAuthModal(false);
              }}
            >
              <MaterialIcons name="lock" size={24} color={buttonColor} />
              <Text style={[styles.authOptionText, { color: textColor }]}>Password Authentication</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.authOption, authMethod === 'privateKey' && styles.selectedAuthOption]}
              onPress={() => {
                setAuthMethod('privateKey');
                setShowAuthModal(false);
              }}
            >
              <MaterialIcons name="vpn-key" size={24} color={buttonColor} />
              <Text style={[styles.authOptionText, { color: textColor }]}>Private Key Authentication</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowAuthModal(false)}>
              <Text style={[styles.closeModalText, { color: buttonColor }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🔖 Config Selector Modal */}
      <Modal
        visible={configModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setConfigModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.keyModalContent, { backgroundColor: isDarkMode ? '#333' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Saved Configurations</Text>

            <View style={{ marginBottom: 10 }}>
              <TextInput
                style={[styles.input, { backgroundColor: inputBackgroundColor, borderColor, color: textColor }]}
                value={configSearch}
                onChangeText={setConfigSearch}
                placeholder="Search configs..."
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
              />
            </View>

            <ScrollView style={styles.keyList}>
              {configs
                .filter(c => c.name.toLowerCase().includes(configSearch.toLowerCase()))
                .map(c => (
                  <View key={c.id} style={styles.keyItem}>
                    <TouchableOpacity
                      style={[styles.keyItemContent, { borderColor }]}
                      onPress={() => applyConfig(c)}
                    >
                      <MaterialIcons name="bookmark" size={22} color={buttonColor} />
                      <View style={styles.keyItemDetails}>
                        <Text style={[styles.keyItemName, { color: textColor }]}>{c.name}</Text>
                        <Text style={[styles.keyItemDate, { color: isDarkMode ? '#888' : '#666' }]}>
                          {c.host}:{c.port} • {c.user} • {c.authMethod === 'password' ? 'Password' : 'Private Key'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteKeyButton} onPress={() => deleteConfig(c.id)}>
                      <MaterialIcons name="delete" size={20} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                ))}
              {configs.length === 0 && (
                <Text style={[styles.noKeysText, { color: textColor }]}>No configurations saved</Text>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeModalButton} onPress={() => setConfigModalVisible(false)}>
              <Text style={[styles.closeModalText, { color: buttonColor }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🔖 Save Config Modal */}
      <Modal
        visible={saveConfigModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSaveConfigModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#333' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Save Configuration</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBackgroundColor, borderColor, color: textColor, marginBottom: 20 }]}
              value={newConfigName}
              onChangeText={setNewConfigName}
              placeholder="Name (e.g., Prod DB Server)"
              placeholderTextColor={isDarkMode ? '#888' : '#999'}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: buttonColor }]} onPress={saveCurrentAsConfig}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: isDarkMode ? '#555' : '#ccc' }]}
                onPress={() => {
                  setSaveConfigModalVisible(false);
                  setNewConfigName('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: textColor }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Saved Keys Modal (existing) */}
      <Modal
        visible={showKeyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowKeyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.keyModalContent, { backgroundColor: isDarkMode ? '#333' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Select Private Key</Text>

            <ScrollView style={styles.keyList}>
              {savedKeys.length === 0 ? (
                <Text style={[styles.noKeysText, { color: textColor }]}>No saved private keys found</Text>
              ) : (
                savedKeys.map(key => (
                  <View key={key.id} style={styles.keyItem}>
                    <TouchableOpacity
                      style={[styles.keyItemContent, { borderColor }]}
                      onPress={() => handleLoadKey(key.id)}
                    >
                      <MaterialIcons name="vpn-key" size={24} color={buttonColor} />
                      <View style={styles.keyItemDetails}>
                        <Text style={[styles.keyItemName, { color: textColor }]}>{key.name}</Text>
                        <Text style={[styles.keyItemDate, { color: isDarkMode ? '#888' : '#666' }]}>
                          {new Date(key.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteKeyButton} onPress={() => handleDeleteKey(key.id)}>
                      <MaterialIcons name="delete" size={20} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowKeyModal(false)}>
              <Text style={[styles.closeModalText, { color: buttonColor }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Save Key Modal (existing) */}
      <Modal
        visible={showSaveKeyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSaveKeyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#333' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Save Private Key</Text>

            <TextInput
              style={[styles.input, { backgroundColor: inputBackgroundColor, borderColor, color: textColor, marginBottom: 20 }]}
              value={keyName}
              onChangeText={setKeyName}
              placeholder="Enter a name for this key"
              placeholderTextColor={isDarkMode ? '#888' : '#999'}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: buttonColor }]} onPress={handleSaveKey}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: isDarkMode ? '#555' : '#ccc' }]}
                onPress={() => {
                  setShowSaveKeyModal(false);
                  setKeyName('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: textColor }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    justifyContent: 'space-between',
  },
  bookmarkTitle: { fontSize: 16, fontWeight: '700' },
  iconBtn: { padding: 6, marginLeft: 6 },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },

  authSelector: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, padding: 12 },
  authSelectorText: { flex: 1, fontSize: 16, marginLeft: 8 },

  buttonContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  button: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },

  authOption: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  selectedAuthOption: { borderColor: '#007AFF' },
  authOptionText: { fontSize: 16, marginLeft: 10 },

  closeModalButton: { marginTop: 10, padding: 10, alignItems: 'center' },
  closeModalText: { fontSize: 16, fontWeight: '600' },

  keyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  keyActions: { flexDirection: 'row', gap: 10 },
  keyActionButton: { padding: 8, borderRadius: 4 },
  selectedKeyText: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  filePickerButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, padding: 12 },
  filePickerText: { flex: 1, fontSize: 16, marginLeft: 8 },

  keyModalContent: { maxHeight: '80%' },
  keyList: { maxHeight: 300, marginBottom: 20 },
  noKeysText: { textAlign: 'center', fontSize: 16, padding: 20 },
  keyItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  keyItemContent: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 15, borderWidth: 1, borderRadius: 8, marginRight: 10 },
  keyItemDetails: { flex: 1, marginLeft: 10 },
  keyItemName: { fontSize: 16, fontWeight: '600' },
  keyItemDate: { fontSize: 12, marginTop: 2 },
  deleteKeyButton: { padding: 10 },

  modalButtons: { flexDirection: 'row', gap: 10 },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default CommandsView;
