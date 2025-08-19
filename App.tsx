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
import Icon from 'react-native-vector-icons/MaterialIcons';

import LoginForm from 'src/components/LoginForm';
import StatusIndicator from 'src/components/StatusIndicator';
import MainMenu, { MenuOption } from 'src/components/MainMenu';
import WakeOnLanView from 'src/components/WakeOnLanView';
import { useAuth } from 'src/hooks/useAuth';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const {
    isAuthenticated,
    login,
    logout,
    serverPublicKeyExpiryTime,
    jwtTokenExpiryTime,
  } = useAuth();
  const [currentView, setCurrentView] = useState<MenuOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
  };

  // Reset view when authentication changes
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentView(null);
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

  const handleMenuSelect = (option: MenuOption) => {
    setCurrentView(option);
  };

  const handleBackToMenu = () => {
    setCurrentView(null);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'wol':
        return (
          <WakeOnLanView isDarkMode={isDarkMode} onBack={handleBackToMenu} />
        );
      case 'commands':
        return (
          <View style={styles.placeholderView}>
            <TouchableOpacity
              onPress={handleBackToMenu}
              style={styles.backButton}
            >
              <Text style={[styles.backButtonText, { color: '#007AFF' }]}>
                <Icon name="arrow-back" size={20} /> Back
              </Text>
            </TouchableOpacity>
            <Text
              style={[
                styles.placeholderText,
                { color: isDarkMode ? '#fff' : '#000' },
              ]}
            >
              Commands functionality coming soon...
            </Text>
          </View>
        );
      case 'ping':
        return (
          <View style={styles.placeholderView}>
            <TouchableOpacity
              onPress={handleBackToMenu}
              style={styles.backButton}
            >
              <Text style={[styles.backButtonText, { color: '#007AFF' }]}>
                <Icon name="arrow-back" size={20} /> Back
              </Text>
            </TouchableOpacity>
            <Text
              style={[
                styles.placeholderText,
                { color: isDarkMode ? '#fff' : '#000' },
              ]}
            >
              Ping functionality coming soon...
            </Text>
          </View>
        );
      case 'https-check':
        return (
          <View style={styles.placeholderView}>
            <TouchableOpacity
              onPress={handleBackToMenu}
              style={styles.backButton}
            >
              <Text style={[styles.backButtonText, { color: '#007AFF' }]}>
                <Icon name="arrow-back" size={20} /> Back
              </Text>
            </TouchableOpacity>
            <Text
              style={[
                styles.placeholderText,
                { color: isDarkMode ? '#fff' : '#000' },
              ]}
            >
              HTTPS Check functionality coming soon...
            </Text>
          </View>
        );
      default:
        return (
          <MainMenu isDarkMode={isDarkMode} onMenuSelect={handleMenuSelect} />
        );
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
          <View style={styles.headerTop}>
            <Text
              style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}
            >
              {isAuthenticated ? 'Home' : 'Wake on LAN'}
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
                isDarkMode={isDarkMode}
              />
              <StatusIndicator
                keyExpiryTime={serverPublicKeyExpiryTime}
                name="Server Public Key"
                isDarkMode={isDarkMode}
              />
            </View>
          )}
        </View>

        <View style={styles.content}>
          {!isAuthenticated ? (
            <LoginForm
              onLogin={handleLogin}
              isLoading={isLoading}
              isDarkMode={isDarkMode}
            />
          ) : (
            <View style={styles.mainContent}>{renderCurrentView()}</View>
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
  logoutIcon: {
    fontSize: 18,
    color: '#FF3B30', // Make the icon red instead
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
});

export default App;
