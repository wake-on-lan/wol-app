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
import ResultInfoBox, { ResultRow } from './ResultInfoBox';

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

  const formatTime = (time: number | 'unknown'): string => {
    if (time === 'unknown') return 'N/A';
    return `${time.toFixed(1)}ms`;
  };

  const formatPacketLoss = (packetLoss: string): string => {
    return packetLoss === 'unknown' ? 'N/A' : `${packetLoss}%`;
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
              },
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
        </View>

        {/* Results Section */}
        {pingResult &&
          (() => {
            // Build rows dynamically based on ping result
            const rows: ResultRow[] = [
              {
                label: 'Target',
                value: pingResult.host,
              },
            ];

            // Add IP if available
            if (pingResult.numeric_host) {
              rows.push({
                label: 'IP',
                value: pingResult.numeric_host,
                monospace: true,
              });
            }

            // Add alive-specific details
            if (pingResult.alive) {
              rows.push(
                {
                  label: 'Response Time',
                  value: formatTime(pingResult.time),
                },
                {
                  label: 'Average',
                  value:
                    pingResult.avg === 'unknown'
                      ? 'N/A'
                      : `${pingResult.avg}ms`,
                },
                {
                  label: 'Packet Loss',
                  value: formatPacketLoss(pingResult.packetLoss),
                  valueStyle: {
                    color:
                      pingResult.packetLoss === '0.000' ? '#34C759' : '#FF9500',
                  },
                },
              );
            }

            return (
              <ResultInfoBox
                success={pingResult.alive}
                title={
                  pingResult.alive ? 'Host is reachable' : 'Host is unreachable'
                }
                onClear={clearResults}
                rows={rows}
                isDarkMode={isDarkMode}
                testID="ping-result"
              />
            );
          })()}
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
});

export default PingView;
