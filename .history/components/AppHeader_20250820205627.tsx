import { useRouter } from 'expo-router';
import React from 'react';
import {
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '../hooks/useThemeColor';
import { Logo } from './Logo';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface AppHeaderProps {
  title?: string;
  showProfile?: boolean;
}

export function AppHeader({ title, showProfile = true }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const handleProfilePress = () => {
    router.push('/(tabs)/profile');
  };

  return (
    <ThemedView style={[
      styles.headerContainer,
      { 
        paddingTop: insets.top,
        backgroundColor,
        borderBottomColor: borderColor,
      }
    ]}>
      <StatusBar 
        barStyle={backgroundColor === '#fff' ? 'dark-content' : 'light-content'} 
        backgroundColor={backgroundColor}
      />
      
      {/* 刘海设计 */}
      <View style={[styles.notchContainer, { backgroundColor }]}>
        {/* 左上角 Logo */}
        <View style={styles.leftSection}>
          <Logo size="small" showText={false} />
          {title && (
            <ThemedText style={[styles.appTitle, { color: textColor }]}>
              {title}
            </ThemedText>
          )}
        </View>

        {/* 右上角 Profile */}
        {showProfile && (
          <TouchableOpacity 
            style={[styles.profileButton, { borderColor: tintColor }]}
            onPress={handleProfilePress}
          >
            <View style={[styles.profileIcon, { backgroundColor: tintColor }]}>
              <ThemedText style={styles.profileIconText}>👤</ThemedText>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* 装饰性刘海边缘 */}
      <View style={[styles.notchEdge, { backgroundColor: borderColor }]} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  notchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 60,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  profileButton: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 2,
  },
  profileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
    fontSize: 16,
    color: 'white',
  },
  notchEdge: {
    height: 2,
    marginHorizontal: 40,
    borderRadius: 1,
    opacity: 0.3,
  },
});