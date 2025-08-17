import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusIndicatorProps {
  isAuthenticated: boolean;
  keyExpiryTime: Date | null;
  isDarkMode: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  isAuthenticated,
  keyExpiryTime,
  isDarkMode,
}) => {
  const getStatusText = () => {
    if (!isAuthenticated) {
      return 'Not authenticated';
    }

    if (!keyExpiryTime) {
      return 'Authenticated (no expiry info)';
    }

    const now = new Date();
    const timeUntilExpiry = keyExpiryTime.getTime() - now.getTime();
    
    if (timeUntilExpiry <= 0) {
      return 'Keys expired';
    }

    const hoursUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
    const minutesUntilExpiry = Math.floor((timeUntilExpiry % (1000 * 60 * 60)) / (1000 * 60));

    if (hoursUntilExpiry > 0) {
      return `Authenticated (expires in ${hoursUntilExpiry}h ${minutesUntilExpiry}m)`;
    } else {
      return `Authenticated (expires in ${minutesUntilExpiry}m)`;
    }
  };

  const getStatusColor = () => {
    if (!isAuthenticated) {
      return '#FF3B30'; // Red
    }

    if (!keyExpiryTime) {
      return '#FF9500'; // Orange
    }

    const now = new Date();
    const timeUntilExpiry = keyExpiryTime.getTime() - now.getTime();
    
    if (timeUntilExpiry <= 0) {
      return '#FF3B30'; // Red
    }

    if (timeUntilExpiry <= 3600000) { // Less than 1 hour
      return '#FF9500'; // Orange
    }

    return '#34C759'; // Green
  };

  const textColor = isDarkMode ? '#fff' : '#000';

  return (
    <View style={styles.container}>
      <View style={[styles.indicator, { backgroundColor: getStatusColor() }]} />
      <Text style={[styles.statusText, { color: textColor }]}>
        {getStatusText()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 14,
    flex: 1,
  },
});

export default StatusIndicator;