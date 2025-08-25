import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, BackHandler } from 'react-native';
import WakeOnLanView from './WakeOnLanView';
import PingView from './PingView';
import HttpsCheckView from './HttpsCheckView';
import CommandsView from './CommandsView';
import Icon from 'react-native-vector-icons/FontAwesome';

export interface isDarkModeProps {
  isDarkMode: boolean;
}

interface MainMenuProps {
  isDarkMode: boolean;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
}

interface MenuItem {
  title: string;
  description: string;
  component: React.ComponentType<isDarkModeProps>; // Changed this
}

interface MenuItemProps {
  menuItem: MenuItem;
  isDarkMode: boolean;
  onPress: (option: MenuItem) => void;
}




const MenuItem: React.FC<MenuItemProps> = ({
  menuItem,
  isDarkMode,
  onPress,
}) => {
  const textColor = isDarkMode ? '#fff' : '#000';
  const descriptionColor = isDarkMode ? '#ccc' : '#666';

  return (
    <TouchableOpacity
      style={[
        styles.menuItem,
        { backgroundColor: isDarkMode ? '#333' : '#f8f8f8' },
      ]}
      onPress={() => onPress(menuItem)}
    >
      <Text style={[styles.menuTitle, { color: textColor }]}>
        {menuItem.title}
      </Text>
      <Text style={[styles.menuDescription, { color: descriptionColor }]}>
        {menuItem.description}
      </Text>
    </TouchableOpacity>
  );
};

const MainMenu: React.FC<MainMenuProps> = ({ isDarkMode, setTitle }) => {
  const [ActiveComponent, setActiveComponent] =
    React.useState<React.ComponentType<isDarkModeProps> | null>(null);

  const menuItems: MenuItem[] = [
    {
      title: 'Commands',
      description: 'Execute custom commands on remote devices',
      component: CommandsView,
    },
    {
      title: 'Wake on LAN',
      description: 'Wake up devices on your network',
      component: WakeOnLanView,
    },
    {
      title: 'Ping',
      description: 'Check device connectivity and response times',
      component: PingView,
    },
    {
      title: 'HTTPS Check Availability',
      description: 'Test HTTPS endpoint availability and response',
      component: HttpsCheckView,
    },
  ];

  const handleMenuPress = (menuItem: MenuItem) => {
    setActiveComponent(() => menuItem.component); // Use function to set component
    setTitle(menuItem.title);
  };

  const handleBackToMenu = () => {
    setActiveComponent(null);
    setTitle('Home');
  };

  React.useEffect(() => {
    const backAction = () => {
      if (ActiveComponent) {
        handleBackToMenu();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [ActiveComponent]);

  return (
    <View style={styles.container}>
      {ActiveComponent ? (
        <View style={styles.componentContainer}>
          <TouchableOpacity
            onPress={handleBackToMenu}
            style={styles.backButton}
          >
            <Icon name="long-arrow-left" size={35} color="#fff" />
          </TouchableOpacity>

          {/* Render the active component */}
          <ActiveComponent isDarkMode={isDarkMode} />
        </View>
      ) : (
        menuItems.map((item, index) => (
          <MenuItem
            key={index}
            menuItem={item}
            isDarkMode={isDarkMode}
            onPress={handleMenuPress}
          />
        ))
      )}
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
  componentContainer: {
    flex: 1,
  },
  backButton: {
    marginBottom: 20,
    paddingVertical: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 18,
    textAlign: 'center',
  },
});

export default MainMenu;
