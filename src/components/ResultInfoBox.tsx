import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

/**
 * Row data structure for ResultInfoBox
 */
export interface ResultRow {
  /** Label text to display */
  label: string;
  /** Value text to display */
  value: string;
  /** Use monospace font for value (useful for IPs, MACs, etc.) */
  monospace?: boolean;
  /** Number of lines before truncating */
  numberOfLines?: number;
  /** How to truncate text if needed */
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  /** Custom label style */
  labelStyle?: TextStyle;
  /** Custom value style */
  valueStyle?: TextStyle;
}

/**
 * Props for ResultInfoBox component
 */
export interface ResultInfoBoxProps {
  /** Whether the operation was successful */
  success: boolean;
  /** Main title to display */
  title: string;
  /** Array of row data to display */
  rows?: ResultRow[];
  /** Callback when clear button is pressed */
  onClear?: () => void;
  /** Dark mode flag */
  isDarkMode?: boolean;
  /** Additional container styles */
  style?: ViewStyle;
  /** Custom success icon name */
  successIcon?: string;
  /** Custom failure icon name */
  failureIcon?: string;
  /** Custom success color */
  successColor?: string;
  /** Custom failure color */
  failureColor?: string;
  /** Show/hide the status icon */
  showIcon?: boolean;
  /** Custom icon size */
  iconSize?: number;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Props for ResultInfoBoxCustom component
 */
export interface ResultInfoBoxCustomProps {
  /** Whether the operation was successful */
  success: boolean;
  /** Main title to display */
  title: string;
  /** Callback when clear button is pressed */
  onClear?: () => void;
  /** Dark mode flag */
  isDarkMode?: boolean;
  /** Additional container styles */
  style?: ViewStyle;
  /** Custom success icon name */
  successIcon?: string;
  /** Custom failure icon name */
  failureIcon?: string;
  /** Custom success color */
  successColor?: string;
  /** Custom failure color */
  failureColor?: string;
  /** Show/hide the status icon */
  showIcon?: boolean;
  /** Custom icon size */
  iconSize?: number;
  /** Custom content to render */
  children: React.ReactNode;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Reusable ResultInfoBox Component with TypeScript support
 * 
 * @example
 * ```tsx
 * <ResultInfoBox
 *   success={true}
 *   title="Operation Successful"
 *   rows={[
 *     { label: 'Status', value: 'Connected' },
 *     { label: 'IP', value: '192.168.1.1', monospace: true }
 *   ]}
 *   onClear={() => console.log('Clear')}
 *   isDarkMode={false}
 * />
 * ```
 */
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
  testID,
}) => {
  const iconName = success ? successIcon : failureIcon;
  const iconColor = success ? successColor : failureColor;

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
            accessibilityLabel="Clear results"
            accessibilityRole="button"
          >
            <Icon name="clear" style={{ padding: 1 }} size={20} color="#666" />
          </TouchableOpacity>
        )}
        {showIcon && (
          <Icon
            name={iconName}
            size={iconSize}
            color={iconColor}
            testID={`${testID}-status-icon`}
          />
        )}
        <Text
          style={[
            styles.resultTitle,
            {
              color: iconColor,
              marginLeft: showIcon ? 8 : 0,
            },
          ]}
          testID={`${testID}-title`}
        >
          {title}
        </Text>
      </View>

      {rows.length > 0 && (
        <View style={styles.deviceInfo} testID={`${testID}-rows`}>
          {rows.map((row, index) => (
            <View key={index} style={styles.resultRow} testID={`${testID}-row-${index}`}>
              <Text
                style={[
                  styles.resultLabel,
                  { color: isDarkMode ? '#999' : '#666' },
                  row.labelStyle,
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
                ]}
                numberOfLines={row.numberOfLines || 1}
                ellipsizeMode={row.ellipsizeMode || 'tail'}
              >
                {row.value}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

/**
 * Alternative component for more complex content with custom children
 * 
 * @example
 * ```tsx
 * <ResultInfoBoxCustom
 *   success={false}
 *   title="Error Occurred"
 *   onClear={() => console.log('Clear')}
 *   isDarkMode={false}
 * >
 *   <View>
 *     <Text>Custom error details here</Text>
 *     <Button title="Retry" onPress={retry} />
 *   </View>
 * </ResultInfoBoxCustom>
 * ```
 */
export const ResultInfoBoxCustom: React.FC<ResultInfoBoxCustomProps> = ({
  success,
  title,
  onClear,
  isDarkMode = false,
  style,
  successIcon = 'check-circle',
  failureIcon = 'cancel',
  successColor = '#34C759',
  failureColor = '#FF3B30',
  showIcon = true,
  iconSize = 24,
  children,
  testID,
}) => {
  const iconName = success ? successIcon : failureIcon;
  const iconColor = success ? successColor : failureColor;

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
            accessibilityLabel="Clear results"
            accessibilityRole="button"
          >
            <Icon name="clear" style={{ padding: 1 }} size={20} color="#666" />
          </TouchableOpacity>
        )}
        {showIcon && (
          <Icon
            name={iconName}
            size={iconSize}
            color={iconColor}
            testID={`${testID}-status-icon`}
          />
        )}
        <Text
          style={[
            styles.resultTitle,
            {
              color: iconColor,
              marginLeft: showIcon ? 8 : 0,
            },
          ]}
          testID={`${testID}-title`}
        >
          {title}
        </Text>
      </View>

      {children}
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
    flex: 1,
  },
});

export default ResultInfoBox;