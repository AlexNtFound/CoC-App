// CoC-App/components/DeveloperSettings.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { resetSetupForDevelopment } from './InitialSetupScreen';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface DeveloperSettingsProps {
  visible?: boolean;
}

export default function DeveloperSettings({ visible = __DEV__ }: DeveloperSettingsProps) {
  const { t } = useLanguage();
  const { themeMode } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const accentColor = useThemeColor({}, 'tint');

  // Only show in development mode
  if (!visible) {
    return null;
  }

  const handleResetInitialSetup = () => {
    Alert.alert(
      '🔧 Developer Tool',
      'Reset the initial setup? This will make the setup screen appear again on next app restart.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Setup',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetSetupForDevelopment();
              Alert.alert(
                'Success',
                'Initial setup has been reset. Restart the app to see the setup screen again.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to reset initial setup');
            }
          }
        }
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      '⚠️ Developer Tool',
      'Clear ALL app data? This will reset everything including theme, language, and setup status.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert(
                'Success',
                'All app data has been cleared. Restart the app to see changes.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to clear app data');
            }
          }
        }
      ]
    );
  };

  const handleShowStorageInfo = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const stores = await AsyncStorage.multiGet(keys);
      
      let info = 'Current AsyncStorage data:\n\n';
      stores.forEach(([key, value]) => {
        info += `${key}: ${value}\n`;
      });
      
      Alert.alert('Storage Info', info || 'No data found');
    } catch (error) {
      Alert.alert('Error', 'Failed to get storage info');
    }
  };

  const developerActions = [
    {
      id: 'reset-setup',
      title: '🔄 Reset Initial Setup',
      subtitle: 'Show setup screen on next restart',
      action: handleResetInitialSetup,
    },
    {
      id: 'storage-info',
      title: '📱 Show Storage Info',
      subtitle: 'View current AsyncStorage data',
      action: handleShowStorageInfo,
    },
    {
      id: 'clear-all',
      title: '🗑️ Clear All Data',
      subtitle: 'Reset everything (dangerous)',
      action: handleClearAllData,
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity
        style={[styles.header, { backgroundColor: cardBackground, borderColor }]}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>🔧 Developer Settings</ThemedText>
          <ThemedText style={[styles.chevron, { 
            transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] 
          }]}>
            ›
          </ThemedText>
        </View>
        <ThemedText style={styles.headerSubtitle}>
          Development tools (only visible in __DEV__ mode)
        </ThemedText>
      </TouchableOpacity>

      {isExpanded && (
        <View style={[styles.content, { backgroundColor: cardBackground, borderColor }]}>
          <ThemedText style={styles.warning}>
            ⚠️ These tools are for development only and can reset your app data.
          </ThemedText>
          
          {developerActions.map((action, index) => (
            <View key={action.id}>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={action.action}
              >
                <View style={styles.actionText}>
                  <ThemedText style={styles.actionTitle}>{action.title}</ThemedText>
                  <ThemedText style={styles.actionSubtitle}>{action.subtitle}</ThemedText>
                </View>
              </TouchableOpacity>
              {index < developerActions.length - 1 && (
                <View style={[styles.separator, { backgroundColor: borderColor }]} />
              )}
            </View>
          ))}
          
          <View style={styles.info}>
            <ThemedText style={styles.infoText}>
              Current Theme: {themeMode}
            </ThemedText>
            <ThemedText style={styles.infoText}>
              Build Mode: {__DEV__ ? 'Development' : 'Production'}
            </ThemedText>
          </View>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  header: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  chevron: {
    fontSize: 18,
    opacity: 0.5,
    fontWeight: 'bold',
  },
  content: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    overflow: 'hidden',
  },
  warning: {
    fontSize: 12,
    opacity: 0.7,
    padding: 12,
    backgroundColor: '#ff6b6b20',
    margin: 12,
    borderRadius: 8,
    textAlign: 'center',
  },
  actionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    opacity: 0.6,
  },
  separator: {
    height: 1,
    marginLeft: 16,
  },
  info: {
    padding: 12,
    backgroundColor: '#45b7d120',
    margin: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 11,
    opacity: 0.7,
    marginBottom: 2,
  },
});