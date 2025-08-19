import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type MenuOption = 'commands' | 'wol' | 'ping' | 'https-check';

interface MainMenuProps {
  isDarkMode: boolean;
  onMenuSelect: (option: MenuOption) => void;
}

interface MenuItemProps {
  title: string;
  description: string;
  option: MenuOption;
  isDarkMode: boolean;
  onPress: (option: MenuOption) => void;
}

const MenuItem: React.FC<MenuItemProps> = ({
  title,
  description,
  option,
  isDarkMode,
  onPress,
}) => {
  const textColor = isDarkMode ? '#fff' : '#000';
  const descriptionColor = isDarkMode ? '#ccc' : '#666';

  return (
    <TouchableOpacity
      style={[
        styles.menuItem,
        { backgroundColor: isDarkMode ? '#333' : '#f8f8f8' }
      ]}
      onPress={() => onPress(option)}
    >
      <Text style={[styles.menuTitle, { color: textColor }]}>{title}</Text>
      <Text style={[styles.menuDescription, { color: descriptionColor }]}>
        {description}
      </Text>
    </TouchableOpacity>
  );
};

const MainMenu: React.FC<MainMenuProps> = ({ isDarkMode, onMenuSelect }) => {
  const menuItems = [
    {
      title: 'Commands',
      description: 'Execute custom commands on remote devices',
      option: 'commands' as MenuOption,
    },
    {
      title: 'Wake on LAN',
      description: 'Wake up devices on your network',
      option: 'wol' as MenuOption,
    },
    {
      title: 'Ping',
      description: 'Check device connectivity and response times',
      option: 'ping' as MenuOption,
    },
    {
      title: 'HTTPS Check Availability',
      description: 'Test HTTPS endpoint availability and response',
      option: 'https-check' as MenuOption,
    },
  ];

  return (
    <View style={styles.container}>
      {menuItems.map((item, index) => (
        <MenuItem
          key={index}
          title={item.title}
          description={item.description}
          option={item.option}
          isDarkMode={isDarkMode}
          onPress={onMenuSelect}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  menuItem: {
    padding: 20,
    marginBottom: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  menuDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default MainMenu;