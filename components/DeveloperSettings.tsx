// CoC-App/components/DeveloperSettings.tsx (Updated)
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import type { UserRole } from '../contexts/UserRoleContext';
import { useUserRole } from '../contexts/UserRoleContext';
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
  const { userRole, updateUserRole } = useUserRole();
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

  const handleRoleChange = () => {
    const roles: { role: UserRole; label: string; description: string }[] = [
      { role: 'student', label: '👤 Student', description: 'Can view and RSVP to events' },
      { role: 'core_member', label: '⭐ Core Member', description: 'Can create and manage events' },
      { role: 'admin', label: '👑 Admin', description: 'Full access to all features' },
    ];

    Alert.alert(
      '🔧 Change User Role',
      'Select a role to test different permissions:',
      [
        { text: 'Cancel', style: 'cancel' },
        ...roles.map(({ role, label, description }) => ({
          text: `${label}\n${description}`,
          onPress: () => {
            updateUserRole(role);
            Alert.alert(
              'Role Changed',
              `You are now a ${label.split(' ')[1]}. The app UI will update to reflect your new permissions.`,
              [{ text: 'OK' }]
            );
          }
        }))
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      '⚠️ Developer Tool',
      'Clear ALL app data? This will reset everything including theme, language, events, and setup status.',
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
        // Truncate long values for readability
        const displayValue = value && value.length > 100 
          ? value.substring(0, 100) + '...' 
          : value;
        info += `${key}: ${displayValue}\n\n`;
      });
      
      Alert.alert('Storage Info', info || 'No data found');
    } catch (error) {
      Alert.alert('Error', 'Failed to get storage info');
    }
  };

  const getRoleDisplayText = () => {
    switch (userRole.role) {
      case 'admin':
        return '👑 Admin';
      case 'core_member':
        return '⭐ Core Member';
      case 'student':
      default:
        return '👤 Student';
    }
  };

  const developerActions = [
    {
      id: 'change-role',
      title: '🎭 Change User Role',
      subtitle: `Current: ${getRoleDisplayText()}`,
      action: handleRoleChange,
    },
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
              User Role: {getRoleDisplayText()}
            </ThemedText>
            <ThemedText style={styles.infoText}>
              Can Create Events: {userRole.permissions.canCreateEvents ? 'Yes' : 'No'}
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