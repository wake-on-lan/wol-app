import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  StatusBar,
  useColorScheme,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import LoginForm from 'src/components/LoginForm';
import StatusIndicator from 'src/components/StatusIndicator';
import MainMenu from 'src/components/MainMenu';
import { useAuth } from 'src/hooks/useAuth';
import { ApiService } from 'src/services/ApiService';
import { KeystoreService } from 'src/services/KeystoreService';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const {
    isAuthenticated,
    login,
    logout,
    serverPublicKeyExpiryTime,
    jwtTokenExpiryTime,
    isLoading: authLoading,
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('Wake on LAN');
  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setTitle('Wake on LAN');
    } else {
      setTitle('Home');
    }
  }, [isAuthenticated]);

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

  return isLoading || authLoading ? (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text
        style={[styles.loadingText, { color: isDarkMode ? '#fff' : '#000' }]}
      >
        {'Loading...'}
      </Text>
    </View>
  ) : (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <SafeAreaView style={[styles.container, backgroundStyle]}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text
              style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}
            >
              {title}
            </Text>
            {isAuthenticated && (
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={logout}
                disabled={isLoading}
              >
                <Icon name="logout" size={20} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
          {isAuthenticated && (
            <View style={styles.statusContainer}>
              <StatusIndicator
                keyExpiryTime={jwtTokenExpiryTime}
                name="Authentication"
                onTimeOut={async () => {
                  await logout();
                }}
                isDarkMode={isDarkMode}
              />
              <StatusIndicator
                keyExpiryTime={serverPublicKeyExpiryTime}
                name="Server Public Key"
                onTimeOut={async () => {
                  await KeystoreService.clearServerPublicKey();
                  await ApiService.getServerPublicKey();
                }}
                isDarkMode={isDarkMode}
              />
            </View>
          )}
        </View>

        <View style={styles.content}>
          {!isAuthenticated ? (
            <View style={styles.contentCentered}>
              <LoginForm
                onLogin={handleLogin}
                isLoading={isLoading}
                isDarkMode={isDarkMode}
              />
            </View>
          ) : (
            <MainMenu isDarkMode={isDarkMode} setTitle={setTitle} />
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
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusContainer: {
    paddingHorizontal: 20,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent', // Remove red background
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentCentered: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  contentTop: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  mainContent: {
    flex: 1,
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
  placeholderView: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
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

export default App;
