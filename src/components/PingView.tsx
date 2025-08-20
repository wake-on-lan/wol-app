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
import { ApiService, PingResponse } from '../services/ApiService';

interface PingViewProps {
  isDarkMode: boolean;
}

const PingView: React.FC<PingViewProps> = ({ isDarkMode }) => {
  const [hostname, setHostname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pingResult, setPingResult] = useState<PingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePing = async () => {
    if (!hostname.trim()) {
      Alert.alert('Error', 'Please enter a hostname or IP address.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPingResult(null);

    try {
      const result = await ApiService.ping(hostname.trim());
      setPingResult(result);
    } catch (error) {
      console.error('Ping failed:', error);
      setError((error as Error).message || 'Failed to ping host');
      Alert.alert('Error', 'Failed to ping host. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setPingResult(null);
    setError(null);
  };

  const formatTime = (time: number | "unknown"): string => {
    if (time === "unknown") return "N/A";
    return `${time.toFixed(1)}ms`;
  };

  const formatPacketLoss = (packetLoss: string): string => {
    return packetLoss === "unknown" ? "N/A" : `${packetLoss}%`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: isDarkMode ? '#fff' : '#000' }]}>
            Hostname or IP Address
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDarkMode ? '#333' : '#fff',
                borderColor: isDarkMode ? '#555' : '#ddd',
                color: isDarkMode ? '#fff' : '#000',
              }
            ]}
            value={hostname}
            onChangeText={setHostname}
            placeholder="e.g., google.com or 192.168.1.1"
            placeholderTextColor={isDarkMode ? '#999' : '#666'}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.pingButton,
              (!hostname.trim() || isLoading) && styles.disabledButton,
            ]}
            onPress={handlePing}
            disabled={!hostname.trim() || isLoading}
          >
            <View style={styles.buttonContent}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="network-ping" size={20} color="#fff" />
              )}
              <Text style={styles.buttonText}>
                {isLoading ? 'Pinging...' : 'Ping'}
              </Text>
            </View>
          </TouchableOpacity>

          {(pingResult || error) && (
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={clearResults}
            >
              <Icon name="clear" size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Results Section */}
        {pingResult && (
          <View style={[
            styles.resultContainer,
            { backgroundColor: isDarkMode ? '#333' : '#f9f9f9' }
          ]}>
            <View style={styles.resultHeader}>
              <Icon 
                name={pingResult.alive ? 'check-circle' : 'cancel'} 
                size={24} 
                color={pingResult.alive ? '#34C759' : '#FF3B30'} 
              />
              <Text style={[
                styles.resultTitle,
                { 
                  color: pingResult.alive ? '#34C759' : '#FF3B30',
                  marginLeft: 8,
                }
              ]}>
                {pingResult.alive ? 'Host is reachable' : 'Host is unreachable'}
              </Text>
            </View>

            <View style={styles.resultDetails}>
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, { color: isDarkMode ? '#999' : '#666' }]}>
                  Target:
                </Text>
                <Text style={[styles.resultValue, { color: isDarkMode ? '#fff' : '#000' }]}>
                  {pingResult.host}
                </Text>
              </View>

              {pingResult.numeric_host && (
                <View style={styles.resultRow}>
                  <Text style={[styles.resultLabel, { color: isDarkMode ? '#999' : '#666' }]}>
                    IP:
                  </Text>
                  <Text style={[styles.resultValue, { color: isDarkMode ? '#fff' : '#000' }]}>
                    {pingResult.numeric_host}
                  </Text>
                </View>
              )}

              {pingResult.alive && (
                <>
                  <View style={styles.resultRow}>
                    <Text style={[styles.resultLabel, { color: isDarkMode ? '#999' : '#666' }]}>
                      Response Time:
                    </Text>
                    <Text style={[styles.resultValue, { color: isDarkMode ? '#fff' : '#000' }]}>
                      {formatTime(pingResult.time)}
                    </Text>
                  </View>

                  <View style={styles.resultRow}>
                    <Text style={[styles.resultLabel, { color: isDarkMode ? '#999' : '#666' }]}>
                      Average:
                    </Text>
                    <Text style={[styles.resultValue, { color: isDarkMode ? '#fff' : '#000' }]}>
                      {pingResult.avg === "unknown" ? "N/A" : `${pingResult.avg}ms`}
                    </Text>
                  </View>

                  <View style={styles.resultRow}>
                    <Text style={[styles.resultLabel, { color: isDarkMode ? '#999' : '#666' }]}>
                      Packet Loss:
                    </Text>
                    <Text style={[
                      styles.resultValue, 
                      { 
                        color: pingResult.packetLoss === "0.000" ? '#34C759' : '#FF9500' 
                      }
                    ]}>
                      {formatPacketLoss(pingResult.packetLoss)}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {error && (
          <View style={[
            styles.errorContainer,
            { backgroundColor: isDarkMode ? '#4D1F1F' : '#FFEBEE' }
          ]}>
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
  pingButton: {
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
    gap: 8,
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

export default PingView;