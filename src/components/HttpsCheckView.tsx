import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ApiService, UpResult } from '../services/ApiService';

interface HttpsCheckViewProps {
  isDarkMode: boolean;
}

const HttpsCheckView: React.FC<HttpsCheckViewProps> = ({ isDarkMode }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<UpResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateUrl = (urlString: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const formatUrl = (urlString: string): string => {
    // 1. Check if it already has https:// - do nothing
    if (urlString.startsWith('https://')) {
      return urlString;
    }

    // 2. Check if it has http:// - replace with https://
    if (urlString.startsWith('http://')) {
      return urlString.replace('http://', 'https://');
    }

    // 3. Neither https nor http - add https://
    return `https://${urlString}`;
  };

  const handleHttpsCheck = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a URL to check.');
      return;
    }

    const formattedUrl = formatUrl(url.trim());

    setIsLoading(true);
    setError(null);
    setCheckResult(null);

    try {
      const result = await ApiService.checkHttpsAvailability(formattedUrl);
      setCheckResult(result);
    } catch (error) {
      console.error('HTTPS check failed:', error);
      setError(
        (error as Error).message || 'Failed to check HTTPS availability',
      );
      Alert.alert(
        'Error',
        'Failed to check HTTPS availability. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setCheckResult(null);
    setError(null);
  };

  const isValidInput = (input: string): boolean => {
    if (!input.trim()) return false;
    const formattedUrl = formatUrl(input.trim());
    return validateUrl(formattedUrl);
  };

  const handleUrlChange = (text: string) => {
    setUrl(text);
    // Clear previous results when user starts typing
    if (checkResult || error) {
      clearResults();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: isDarkMode ? '#fff' : '#000' }]}>
            Website URL
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDarkMode ? '#333' : '#fff',
                borderColor: isDarkMode ? '#555' : '#ddd',
                color: isDarkMode ? '#fff' : '#000',
              },
            ]}
            value={url}
            onChangeText={handleUrlChange}
            placeholder="e.g., https://google.com or example.com"
            placeholderTextColor={isDarkMode ? '#999' : '#666'}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!isLoading}
          />
          <Text
            style={[styles.helperText, { color: isDarkMode ? '#999' : '#666' }]}
          >
            You can enter a URL with or without https:// prefix
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.checkButton,
              (!isValidInput(url) || isLoading) && styles.disabledButton,
            ]}
            onPress={handleHttpsCheck}
            disabled={!isValidInput(url) || isLoading}
          >
            <View style={styles.buttonContent}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="https" size={20} color="#fff" />
              )}
              <Text style={styles.buttonText}>
                {isLoading ? 'Checking...' : 'Check HTTPS'}
              </Text>
            </View>
          </TouchableOpacity>

          {(checkResult || error) && (
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={clearResults}
            >
              <Icon name="clear" size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Results Section */}
        {checkResult && (
          <View
            style={[
              styles.resultContainer,
              { backgroundColor: isDarkMode ? '#333' : '#f9f9f9' },
            ]}
          >
            <View style={styles.resultHeader}>
              <Icon
                name={checkResult.reachable ? 'check-circle' : 'cancel'}
                size={24}
                color={checkResult.reachable ? '#34C759' : '#FF3B30'}
              />
              <Text
                style={[
                  styles.resultTitle,
                  {
                    color: checkResult.reachable ? '#34C759' : '#FF3B30',
                    marginLeft: 8,
                  },
                ]}
              >
                {checkResult.reachable
                  ? 'HTTPS Available'
                  : 'HTTPS Unavailable'}
              </Text>
            </View>

            <View style={styles.resultDetails}>
              <View style={styles.resultRow}>
                <Text
                  style={[
                    styles.resultLabel,
                    { color: isDarkMode ? '#999' : '#666' },
                  ]}
                >
                  URL:
                </Text>
                <Text
                  style={[
                    styles.resultValue,
                    { color: isDarkMode ? '#fff' : '#000' },
                  ]}
                >
                  {checkResult.hostname}
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text
                  style={[
                    styles.resultLabel,
                    { color: isDarkMode ? '#999' : '#666' },
                  ]}
                >
                  Status:
                </Text>
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusIndicator,
                      {
                        backgroundColor: checkResult.reachable
                          ? '#34C759'
                          : '#FF3B30',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.resultValue,
                      {
                        color: checkResult.reachable ? '#34C759' : '#FF3B30',
                        fontWeight: '600',
                      },
                    ]}
                  >
                    {checkResult.reachable ? 'Reachable' : 'Not Reachable'}
                  </Text>
                </View>
              </View>

              {checkResult.reachable && (
                <View style={styles.successMessage}>
                  <Icon name="info" size={16} color="#34C759" />
                  <Text
                    style={[
                      styles.infoText,
                      { color: isDarkMode ? '#999' : '#666' },
                    ]}
                  >
                    The website is accessible via HTTPS and responding to
                    requests.
                  </Text>
                </View>
              )}

              {!checkResult.reachable && (
                <View style={styles.failureMessage}>
                  <Icon name="warning" size={16} color="#FF9500" />
                  <Text
                    style={[
                      styles.infoText,
                      { color: isDarkMode ? '#999' : '#666' },
                    ]}
                  >
                    The website may be down, blocking requests, or doesn't
                    support HTTPS.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {error && (
          <View
            style={[
              styles.errorContainer,
              { backgroundColor: isDarkMode ? '#4D1F1F' : '#FFEBEE' },
            ]}
          >
            <Icon name="error" size={20} color="#FF3B30" />
            <Text style={[styles.errorText, { color: '#FF3B30' }]}>
              {error}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButton: {
    backgroundColor: '#007AFF',
    flex: 1,
    marginRight: 12,
  },
  clearButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
    paddingHorizontal: 12,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultContainer: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  resultDetails: {
    gap: 12,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  resultLabel: {
    fontSize: 14,
    flex: 1,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  failureMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 16,
    marginLeft: 6,
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});

export default HttpsCheckView;
