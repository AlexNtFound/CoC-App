// CoC-App/components/DeveloperSettings.tsx (Fixed async version)
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useInviteCode } from '../contexts/InviteCodeContext';
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
  const { currentSession, logout } = useInviteCode();
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

  // 🔥 FIXED: Direct role change with proper async handling
  const handleDirectRoleChange = (targetRole: UserRole) => {
    console.log('🔧 Direct role change initiated:', targetRole);
    
    Alert.alert(
      '🔧 Direct Role Change',
      `Change role directly to ${targetRole}?\n\nThis will bypass invite code system and update UserRoleContext directly.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change Role',
          onPress: async () => {
            try {
              console.log('🔧 Before role change:', userRole);
              
              // Clear invite code session first
              if (currentSession.isAuthenticated) {
                console.log('🔧 Logging out from invite code session...');
                await logout();
              }
              
              // 🔥 FIXED: Await the async updateUserRole function
              console.log('🔧 Calling updateUserRole with:', targetRole);
              await updateUserRole(targetRole);
              
              // Wait a moment then check storage and state
              setTimeout(async () => {
                try {
                  const storedRole = await AsyncStorage.getItem('user_role');
                  console.log('🔧 Role in storage after update:', storedRole);
                  console.log('🔧 Current userRole state:', userRole);
                  
                  Alert.alert(
                    'Role Change Complete',
                    `✅ Success!\n\n` +
                    `Target: ${targetRole}\n` +
                    `Stored: ${storedRole}\n` +
                    `State: ${userRole.role}\n` +
                    `Can Create Events: ${userRole.permissions.canCreateEvents}\n\n` +
                    `Check console for detailed logs.`
                  );
                } catch (error) {
                  console.error('🔧 Error in verification:', error);
                }
              }, 1000); // Wait 1 second for state updates
              
            } catch (error) {
              console.error('🔧 Error in direct role change:', error);
              Alert.alert(
                'Error', 
                `Failed to change role: ${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck console for details.`
              );
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
          onPress: () => handleDirectRoleChange(role)
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
        // Show full value for role-related keys
        if (key.includes('role') || key.includes('session') || key.includes('invite')) {
          info += `${key}: ${value}\n\n`;
        } else {
          // Truncate long values for readability
          const displayValue = value && value.length > 100 
            ? value.substring(0, 100) + '...' 
            : value;
          info += `${key}: ${displayValue}\n\n`;
        }
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

  // 🔥 Enhanced role sync check
  const checkRoleSync = async () => {
    const userRoleContextRole = userRole.role;
    const inviteCodeContextRole = currentSession.role;
    const isAuthenticated = currentSession.isAuthenticated;
    
    // Check storage
    const storedRole = await AsyncStorage.getItem('user_role');
    const storedSession = await AsyncStorage.getItem('current_user_session');
    
    const syncStatus = userRoleContextRole === inviteCodeContextRole ? '✅ SYNCED' : '❌ OUT OF SYNC';
    
    console.log('🔧 Full role sync check:', {
      userRoleContextRole,
      inviteCodeContextRole,
      isAuthenticated,
      storedRole,
      storedSession: storedSession ? JSON.parse(storedSession) : null,
      permissions: userRole.permissions
    });
    
    Alert.alert(
      '🔄 Detailed Role Sync Status',
      `UserRoleContext: ${getRoleDisplayText()}\n` +
      `InviteCodeContext: ${inviteCodeContextRole}\n` +
      `Authenticated: ${isAuthenticated ? 'Yes' : 'No'}\n\n` +
      `Storage:\n` +
      `• Stored Role: ${storedRole || 'null'}\n` +
      `• Can Create Events: ${userRole.permissions.canCreateEvents}\n` +
      `• Is Admin: ${userRole.role === 'admin'}\n\n` +
      `Status: ${syncStatus}\n\n` +
      `Check console for full debug info.`
    );
  };

  // 🔥 FIXED: Test UserRole context with proper async handling
  const testUserRoleContext = () => {
    Alert.alert(
      '🧪 Test UserRole Context',
      'This will test the UserRole context directly by cycling through roles.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Run Test',
          onPress: async () => {
            const roles: UserRole[] = ['student', 'core_member', 'admin'];
            
            try {
              for (let i = 0; i < roles.length; i++) {
                const role = roles[i];
                console.log(`🧪 Testing role: ${role}`);
                
                // 🔥 FIXED: Await the async function
                await updateUserRole(role);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                
                const storedRole = await AsyncStorage.getItem('user_role');
                console.log(`🧪 After setting ${role}:`, {
                  stateRole: userRole.role,
                  canCreateEvents: userRole.permissions.canCreateEvents,
                  storedRole
                });
              }
              
              Alert.alert(
                'Test Complete', 
                `✅ Test finished!\n\nFinal role should be admin.\nCurrent state: ${userRole.role}\nCan create events: ${userRole.permissions.canCreateEvents}\n\nCheck console for detailed results.`
              );
            } catch (error) {
              console.error('🧪 Test failed:', error);
              Alert.alert('Test Failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }
      ]
    );
  };

  const developerActions = [
    {
      id: 'check-role-sync',
      title: '🔄 Check Role Sync',
      subtitle: `UserRole: ${getRoleDisplayText()} | Auth: ${currentSession.isAuthenticated ? 'Yes' : 'No'}`,
      action: checkRoleSync,
    },
    {
      id: 'test-user-role',
      title: '🧪 Test UserRole Context',
      subtitle: 'Test role changes directly',
      action: testUserRoleContext,
    },
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
              🔐 Authenticated: {currentSession.isAuthenticated ? 'Yes' : 'No'}
            </ThemedText>
            <ThemedText style={styles.infoText}>
              🎫 Invite Code Role: {currentSession.role}
            </ThemedText>
            <ThemedText style={styles.infoText}>
              Build Mode: {__DEV__ ? 'Development' : 'Production'}
            </ThemedText>
            <ThemedText style={[
              styles.infoText, 
              { 
                color: userRole.role === currentSession.role ? '#27ae60' : '#e74c3c',
                fontWeight: 'bold' 
              }
            ]}>
              Role Sync: {userRole.role === currentSession.role ? '✅ SYNCED' : '❌ OUT OF SYNC'}
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