import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export interface ResultRow {
  label: string;
  value: string;
  monospace?: boolean;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  labelStyle?: TextStyle;
  valueStyle?: TextStyle;
}

export interface ResultInfoBoxProps {
  success: boolean;
  title: string;
  rows?: ResultRow[];
  onClear?: () => void;
  isDarkMode?: boolean;
  style?: ViewStyle;
  successIcon?: string;
  failureIcon?: string;
  successColor?: string;
  failureColor?: string;
  showIcon?: boolean;
  iconSize?: number;
  horizontalScroll?: boolean; // 👈 new flag
  testID?: string;
}

const ResultInfoBox: React.FC<ResultInfoBoxProps> = ({
  success,
  title,
  rows = [],
  onClear,
  isDarkMode = false,
  style,
  successIcon = 'check-circle',
  failureIcon = 'cancel',
  successColor = '#34C759',
  failureColor = '#FF3B30',
  showIcon = true,
  iconSize = 24,
  horizontalScroll = false, // 👈 default false
  testID,
}) => {
  const iconName = success ? successIcon : failureIcon;
  const iconColor = success ? successColor : failureColor;

  const rowsContent = (
    <View style={styles.deviceInfo} testID={`${testID}-rows`}>
      {rows.map((row, index) => (
        <View
          key={index}
          style={[
            styles.resultRow,
            horizontalScroll && { justifyContent: 'space-between' }, // 👈 push apart
          ]}
          testID={`${testID}-row-${index}`}
        >
          <Text
            style={[
              styles.resultLabel,
              { color: isDarkMode ? '#999' : '#666' },
              row.labelStyle,
              horizontalScroll && { flex: 0 }, // 👈 shrink to content
            ]}
          >
            {row.label}:
          </Text>
          <Text
            style={[
              styles.resultValue,
              {
                color: isDarkMode ? '#fff' : '#000',
                ...(row.monospace && { fontFamily: 'monospace' }),
              },
              row.valueStyle,
              horizontalScroll && { flex: 0, textAlign: 'left' },
            ]}
            numberOfLines={row.numberOfLines}
            ellipsizeMode={row.ellipsizeMode || 'tail'}
          >
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <View
      style={[
        styles.resultContainer,
        { backgroundColor: isDarkMode ? '#333' : '#f9f9f9' },
        style,
      ]}
      testID={testID}
    >
      <View style={styles.resultHeader}>
        {onClear && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onClear}
            testID={`${testID}-clear-button`}
          >
            <Icon name="clear" style={{ padding: 1 }} size={20} color="#666" />
          </TouchableOpacity>
        )}
        {showIcon && <Icon name={iconName} size={iconSize} color={iconColor} />}
        <Text
          style={[
            styles.resultTitle,
            { color: iconColor, marginLeft: showIcon ? 8 : 0 },
          ]}
          testID={`${testID}-title`}
        >
          {title}
        </Text>
      </View>

      {rows.length > 0 &&
        (horizontalScroll ? (
          <ScrollView horizontal nestedScrollEnabled>
            {rowsContent}
          </ScrollView>
        ) : (
          <ScrollView nestedScrollEnabled>{rowsContent}</ScrollView>
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  resultContainer: {
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
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
  clearButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#666',
    borderRadius: 25,
    marginRight: 12,
  },
  deviceInfo: {
    paddingBottom: 8,
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  resultLabel: {
    fontSize: 14,
    flex: 1,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});

export default ResultInfoBox;
