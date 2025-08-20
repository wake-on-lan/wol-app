import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusIndicatorProps {
  keyExpiryTime: Date | null;
  isDarkMode: boolean;
  name?: string;
  onTimeOut?: () => Promise<void>;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  keyExpiryTime,
  isDarkMode,
  name,
  onTimeOut
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isHandlingTimeout, setIsHandlingTimeout] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusText = () => {
    if (!keyExpiryTime) {
      return '';
    }

    const timeUntilExpiry = keyExpiryTime.getTime() - currentTime.getTime();
    
    if (timeUntilExpiry <= 0) {
      if (isHandlingTimeout) {
        return ' expired (refreshing...)';
      }
      
      if (onTimeOut && !isHandlingTimeout) {
        setIsHandlingTimeout(true);
        onTimeOut().finally(() => {
          setIsHandlingTimeout(false);
        });
      }
      
      return ' expired';
    }

    const hoursUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
    const minutesUntilExpiry = Math.floor(
      (timeUntilExpiry % (1000 * 60 * 60)) / (1000 * 60),
    );
    const secondsUntilExpiry = Math.floor(
      (timeUntilExpiry % (1000 * 60)) / 1000,
    );

    const paddedHours = hoursUntilExpiry.toString().padStart(2, '0');
    const paddedMinutes = minutesUntilExpiry.toString().padStart(2, '0');
    const paddedSeconds = secondsUntilExpiry.toString().padStart(2, '0');

    if (hoursUntilExpiry > 0) {
      return ` expires in ${paddedHours}h ${paddedMinutes}m ${paddedSeconds}s`;
    } else if (minutesUntilExpiry > 0) {
      return ` expires in ${paddedMinutes}m ${paddedSeconds}s`;
    } else {
      return ` expires in ${paddedSeconds}s`;
    }
  };

  const getStatusColor = () => {
    if (!keyExpiryTime) {
      return '#FF9500'; // Orange
    }

    const timeUntilExpiry = keyExpiryTime.getTime() - currentTime.getTime();
    
    if (timeUntilExpiry <= 0) {
      return isHandlingTimeout ? '#FF9500' : '#FF3B30'; // Orange while refreshing, red if expired
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
      <View style={{ flex: 1 }}>
        {name && (
          <Text style={[styles.nameText, { color: textColor }]}>{name}</Text>
        )}
      </View>
      <View>
        <Text style={[styles.statusText, { color: textColor }]}>
          {getStatusText()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 0,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  nameText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 14,
    flex: 1,
  },
});

export default StatusIndicator;