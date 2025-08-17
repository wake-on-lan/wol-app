import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<void>;
  isLoading: boolean;
  isDarkMode: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, isLoading, isDarkMode }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      return;
    }

    try {
      await onLogin(username.trim(), password);
    } catch (error) {
      // Error handling is done in parent component
      console.error('Login failed:', error);
    }
  };

  const textColor = isDarkMode ? '#fff' : '#000';
  const inputBackgroundColor = isDarkMode ? '#333' : '#fff';
  const inputBorderColor = isDarkMode ? '#555' : '#ddd';

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>Login</Text>
      
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: textColor }]}>Username:</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: inputBackgroundColor,
              borderColor: inputBorderColor,
              color: textColor,
            },
          ]}
          value={username}
          onChangeText={setUsername}
          placeholder="Enter username"
          placeholderTextColor={isDarkMode ? '#999' : '#666'}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: textColor }]}>Password:</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[
              styles.input,
              styles.passwordInput,
              {
                backgroundColor: inputBackgroundColor,
                borderColor: inputBorderColor,
                color: textColor,
              },
            ]}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor={isDarkMode ? '#999' : '#666'}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            <Text style={[styles.eyeIcon, { color: textColor }]}>
              {showPassword ? '🙈' : '👁'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.loginButton,
          (!username.trim() || !password.trim() || isLoading) && styles.disabledButton,
        ]}
        onPress={handleLogin}
        disabled={!username.trim() || !password.trim() || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.loginButtonText}>Generate Keys & Login</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  eyeIcon: {
    fontSize: 18,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginForm;