// components/Header.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface HeaderProps {
  showBackButton?: boolean;
  title?: string;
  onBackPress?: () => void;
  showProfile?: boolean;
}

export default function Header({ showBackButton = false, title, onBackPress, showProfile = true }: HeaderProps) {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  
  // 根据主题选择logo
  const logoSource = isDark 
    ? require('../assets/images/adaptive-icon.png')
    : require('../assets/images/icon.png');

  const handleProfilePress = () => {
    // 使用正确的路由路径
    router.push('/profile');
  };

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const displayTitle = title || t('home.title');

  return (
    <ThemedView style={[
      styles.container, 
      { 
        backgroundColor,
        paddingTop: insets.top + 10,
        borderBottomColor: borderColor + '20' // 添加透明度
      }
    ]}>
      <ThemedView style={styles.headerContent}>
        {/* 左侧 - Logo 或返回按钮 */}
        <ThemedView style={styles.leftSection}>
          {showBackButton ? (
            <TouchableOpacity 
              onPress={handleBackPress}
              style={styles.backButton}
            >
              <ThemedText style={styles.backButtonText}>←</ThemedText>
            </TouchableOpacity>
          ) : (
            <Image source={logoSource} style={styles.logo} />
          )}
        </ThemedView>

        {/* 中间 - 标题 */}
        <ThemedView style={styles.centerSection}>
          <ThemedText style={styles.title} numberOfLines={1}>
            {displayTitle}
          </ThemedText>
        </ThemedView>

        {/* 右侧 - Profile入口 */}
        <ThemedView style={styles.rightSection}>
          {showProfile && (
            <TouchableOpacity 
              onPress={handleProfilePress}
              style={styles.profileButton}
            >
              <ThemedView style={styles.profileIcon}>
                <ThemedText style={styles.profileIconText}>👤</ThemedText>
              </ThemedView>
            </TouchableOpacity>
          )}
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    minHeight: 60,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  logo: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  profileButton: {
    padding: 4,
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#45b7d1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
    fontSize: 16,
    color: 'white',
  },
});