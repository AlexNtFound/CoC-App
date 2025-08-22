// CoC-App/components/DeveloperSettings.tsx - Bulletproof version with global sync control
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useInviteCode } from '../contexts/InviteCodeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import type { UserRole } from '../contexts/UserRoleContext';
import { useUserRole } from '../contexts/UserRoleContext';
import { useRoleSync } from '../hooks/useRoleSync';
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
  const { disableSync, isSyncDisabled } = useRoleSync();
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

  // 🔥 BULLETPROOF: Direct role change with global sync disable
  const handleDirectRoleChange = (targetRole: UserRole) => {
    console.log('🔧 Direct role change initiated:', targetRole);
    
    Alert.alert(
      '🔧 Direct Role Change',
      `Change role directly to ${targetRole}?\n\nThis will disable role sync globally to prevent any conflicts.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change Role',
          onPress: async () => {
            try {
              console.log('🔧 Before role change:', userRole);
              
              // 🔥 STEP 1: Disable role sync GLOBALLY before anything else
              console.log('🔧 Disabling role sync globally...');
              disableSync(20000); // 20 seconds - plenty of time
              
              // 🔥 STEP 2: Wait for the disable to propagate
              await new Promise(resolve => setTimeout(resolve, 200));
              
              // 🔥 STEP 3: Clear invite session if authenticated
              if (currentSession.isAuthenticated) {
                console.log('🔧 Logging out from invite code session...');
                await logout();
                await new Promise(resolve => setTimeout(resolve, 300));
              }
              
              // 🔥 STEP 4: Update the role
              console.log('🔧 Calling updateUserRole with:', targetRole);
              await updateUserRole(targetRole);
              
              // 🔥 STEP 5: Wait for the role change to complete
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // 🔥 STEP 6: Verify the change
              const storedRole = await AsyncStorage.getItem('user_role');
              console.log('🔧 Verification after role change:', {
                targetRole,
                storedRole,
                currentState: userRole.role,
                canCreateEvents: userRole.permissions.canCreateEvents,
                syncDisabled: isSyncDisabled
              });
              
              const isSuccess = userRole.role === targetRole && storedRole === targetRole;
              
              Alert.alert(
                isSuccess ? 'Role Change Success!' : 'Role Change Status',
                `${isSuccess ? '✅' : '⚠️'} Role Change ${isSuccess ? 'Complete' : 'Partial'}\n\n` +
                `Target: ${targetRole}\n` +
                `Current State: ${userRole.role}\n` +
                `Storage: ${storedRole}\n` +
                `Can Create Events: ${userRole.permissions.canCreateEvents}\n\n` +
                `Sync Status: ${isSyncDisabled ? 'DISABLED (Global)' : 'ENABLED'}\n\n` +
                `${isSuccess ? 'Success! Role sync will re-enable automatically in 20 seconds.' : 'Check console for details.'}`,
                [{ text: 'OK' }]
              );
              
            } catch (error) {
              console.error('🔧 Error in direct role change:', error);
              Alert.alert(
                'Error', 
                `Failed to change role: ${error instanceof Error ? error.message : 'Unknown error'}\n\nRole sync will re-enable automatically.\n\nCheck console for details.`
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
      'Select a role to test different permissions:\n\n(Role sync will be disabled globally during the change)',
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
        if (key.includes('role') || key.includes('session') || key.includes('invite')) {
          info += `${key}: ${value}\n\n`;
        } else {
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

  const checkRoleSync = async () => {
    const userRoleContextRole = userRole.role;
    const inviteCodeContextRole = currentSession.role;
    const isAuthenticated = currentSession.isAuthenticated;
    
    const storedRole = await AsyncStorage.getItem('user_role');
    const storedSession = await AsyncStorage.getItem('current_user_session');
    
    const syncStatus = userRoleContextRole === inviteCodeContextRole ? '✅ SYNCED' : '❌ OUT OF SYNC';
    
    console.log('🔧 Full role sync check:', {
      userRoleContextRole,
      inviteCodeContextRole,
      isAuthenticated,
      storedRole,
      storedSession: storedSession ? JSON.parse(storedSession) : null,
      permissions: userRole.permissions,
      isSyncDisabled
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
      `Sync Status: ${syncStatus}\n` +
      `Global Sync: ${isSyncDisabled ? 'DISABLED' : 'ENABLED'}\n\n` +
      `Check console for full debug info.`
    );
  };

  const testUserRoleContext = () => {
    Alert.alert(
      '🧪 Test UserRole Context',
      'This will test the UserRole context by cycling through all roles with global sync disabled.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Run Test',
          onPress: async () => {
            const roles: UserRole[] = ['student', 'core_member', 'admin'];
            
            try {
              // Disable sync globally for the entire test
              console.log('🧪 Starting role cycle test...');
              disableSync(30000); // 30 seconds
              await new Promise(resolve => setTimeout(resolve, 200));
              
              // Clear invite session
              if (currentSession.isAuthenticated) {
                await logout();
                await new Promise(resolve => setTimeout(resolve, 500));
              }
              
              for (let i = 0; i < roles.length; i++) {
                const role = roles[i];
                console.log(`🧪 Testing role ${i + 1}/3: ${role}`);
                
                await updateUserRole(role);
                await new Promise(resolve => setTimeout(resolve, 1500)); // Longer wait
                
                const storedRole = await AsyncStorage.getItem('user_role');
                console.log(`🧪 After setting ${role}:`, {
                  stateRole: userRole.role,
                  canCreateEvents: userRole.permissions.canCreateEvents,
                  storedRole,
                  syncDisabled: isSyncDisabled
                });
              }
              
              // Final verification
              const finalStoredRole = await AsyncStorage.getItem('user_role');
              
              Alert.alert(
                'Test Complete', 
                `✅ Role cycle test finished!\n\n` +
                `Final role should be: admin\n` +
                `Current state: ${userRole.role}\n` +
                `Storage: ${finalStoredRole}\n` +
                `Can create events: ${userRole.permissions.canCreateEvents}\n` +
                `Global sync: ${isSyncDisabled ? 'DISABLED' : 'ENABLED'}\n\n` +
                `Role sync will automatically re-enable in 30 seconds.\n\n` +
                `Check console for detailed results.`
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
      subtitle: `UserRole: ${getRoleDisplayText()} | Auth: ${currentSession.isAuthenticated ? 'Yes' : 'No'} | Global Sync: ${isSyncDisabled ? 'DISABLED' : 'ENABLED'}`,
      action: checkRoleSync,
    },
    {
      id: 'test-user-role',
      title: '🧪 Test UserRole Context',
      subtitle: 'Cycle through all roles with global sync disabled',
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
          
          {isSyncDisabled && (
            <ThemedText style={styles.syncDisabledWarning}>
              🔄 Role sync is GLOBALLY DISABLED. It will re-enable automatically.
            </ThemedText>
          )}
          
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
            <ThemedText style={[
              styles.infoText, 
              { 
                color: isSyncDisabled ? '#f39c12' : '#27ae60',
                fontWeight: 'bold' 
              }
            ]}>
              Global Sync: {isSyncDisabled ? '🔄 DISABLED' : '✅ ENABLED'}
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
  syncDisabledWarning: {
    fontSize: 12,
    color: '#f39c12',
    fontWeight: 'bold',
    padding: 12,
    backgroundColor: '#f39c1220',
    margin: 12,
    marginTop: 0,
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