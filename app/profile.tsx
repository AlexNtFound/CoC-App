// CoC-App/app/profile.tsx - 带权限升级功能的Profile页面
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { useLanguage } from '../contexts/LanguageContext';
import { useOpenAccessAuth } from '../contexts/OpenAccessAuthContext';
import { useThemeColor } from '../hooks/useThemeColor';

export default function ProfileScreen() {
  const { t } = useLanguage();
  const { 
    currentUser, 
    userProfile, 
    isGuest, 
    upgradeRole, 
    signOut,
    updateProfile
  } = useOpenAccessAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'tint');
  const dangerColor = '#FF3B30';
  const successColor = '#34C759';

  const [inviteCode, setInviteCode] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showUpgradeForm, setShowUpgradeForm] = useState(false);

  // 如果是访客，显示登录提示
  if (isGuest) {
    return (
      <ThemedView style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
        <Header 
          title="Profile"
          showBackButton={true}
          onBackPress={() => router.back()}
        />
        
        <View style={styles.guestContainer}>
          <ThemedText style={styles.guestTitle}>👤 Guest Access</ThemedText>
          <ThemedText style={styles.guestMessage}>
            You're browsing as a guest. Create an account to register for events and connect with your community.
          </ThemedText>
          
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: accentColor }]}
            onPress={() => router.push('/login')}
          >
            <ThemedText style={styles.primaryButtonText}>
              Create Account or Sign In
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const handleUpgradeRole = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    setIsUpgrading(true);

    try {
      const newRole = await upgradeRole(inviteCode.trim());
      
      Alert.alert(
        'Role Upgraded! 🎉',
        `Your role has been successfully upgraded to ${newRole === 'core_member' ? 'Core Member' : 'Administrator'}.\n\n${
          newRole === 'core_member' 
            ? 'You can now create and manage events!' 
            : 'You now have full administrative access!'
        }`,
        [
          {
            text: 'Awesome!',
            onPress: () => {
              setInviteCode('');
              setShowUpgradeForm(false);
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Upgrade Failed', error.message);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(tabs)');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to sign out: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const getRoleInfo = () => {
    if (!userProfile) return { name: 'Unknown', color: borderColor, description: '', emoji: '❓' };
    
    switch (userProfile.role) {
      case 'student':
        return {
          name: 'Student',
          color: '#007AFF',
          description: 'Can browse and register for events',
          emoji: '📚'
        };
      case 'core_member':
        return {
          name: 'Core Member',
          color: '#FF9500',
          description: 'Can create and manage events',
          emoji: '⭐'
        };
      case 'admin':
        return {
          name: 'Administrator',
          color: '#FF3B30',
          description: 'Full administrative access',
          emoji: '👑'
        };
      default:
        return {
          name: 'Unknown',
          color: borderColor,
          description: '',
          emoji: '❓'
        };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <ThemedView style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
      <Header 
        title="Profile"
        showBackButton={true}
        onBackPress={() => router.back()}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* User Info Card */}
          <View style={[styles.userCard, { backgroundColor: cardBackground, borderColor }]}>
            <View style={styles.userHeader}>
              <View style={styles.avatarContainer}>
                <ThemedText style={styles.avatarText}>
                  {userProfile?.displayName.charAt(0).toUpperCase() || '?'}
                </ThemedText>
              </View>
              <View style={styles.userInfo}>
                <ThemedText style={styles.userName}>{userProfile?.displayName || 'Unknown User'}</ThemedText>
                <ThemedText style={styles.userEmail}>{currentUser?.email}</ThemedText>
                <ThemedText style={styles.userCampus}>{userProfile?.campus}</ThemedText>
              </View>
            </View>

            {/* Role Badge */}
            <View style={[styles.roleBadge, { backgroundColor: roleInfo.color + '20' }]}>
              <ThemedText style={[styles.roleEmoji]}>{roleInfo.emoji}</ThemedText>
              <View style={styles.roleInfo}>
                <ThemedText style={[styles.roleName, { color: roleInfo.color }]}>
                  {roleInfo.name}
                </ThemedText>
                <ThemedText style={styles.roleDescription}>
                  {roleInfo.description}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Account Actions */}
          <View style={[styles.section, { backgroundColor: cardBackground, borderColor }]}>
            <ThemedText style={styles.sectionTitle}>Account</ThemedText>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => router.push('/profile-edit')}
            >
              <ThemedText style={styles.actionIcon}>✏️</ThemedText>
              <View style={styles.actionContent}>
                <ThemedText style={styles.actionTitle}>Edit Profile</ThemedText>
                <ThemedText style={styles.actionSubtitle}>Update your name and campus</ThemedText>
              </View>
              <ThemedText style={[styles.chevron, { color: borderColor }]}>›</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => {
                Alert.alert('Change Password', 'Password change feature coming soon!');
              }}
            >
              <ThemedText style={styles.actionIcon}>🔒</ThemedText>
              <View style={styles.actionContent}>
                <ThemedText style={styles.actionTitle}>Change Password</ThemedText>
                <ThemedText style={styles.actionSubtitle}>Update your account password</ThemedText>
              </View>
              <ThemedText style={[styles.chevron, { color: borderColor }]}>›</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Role Upgrade Section */}
          {userProfile?.role !== 'admin' && (
            <View style={[styles.section, { backgroundColor: cardBackground, borderColor }]}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>🚀 Upgrade Your Role</ThemedText>
                {userProfile?.role === 'student' && (
                  <ThemedText style={styles.sectionSubtitle}>
                    Get invite codes from your campus leaders to unlock additional permissions
                  </ThemedText>
                )}
              </View>

              {!showUpgradeForm ? (
                <TouchableOpacity 
                  style={[styles.upgradeButton, { backgroundColor: accentColor }]}
                  onPress={() => setShowUpgradeForm(true)}
                >
                  <ThemedText style={styles.upgradeButtonText}>
                    Enter Invite Code
                  </ThemedText>
                </TouchableOpacity>
              ) : (
                <View style={styles.upgradeForm}>
                  <TextInput
                    style={[styles.inviteInput, { color: textColor, borderColor }]}
                    value={inviteCode}
                    onChangeText={(text) => setInviteCode(text.toUpperCase())}
                    placeholder="Enter invite code (e.g., CM-XXXX-XXXX-XXXX-XXXX)"
                    placeholderTextColor={textColor + '60'}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                  
                  <View style={styles.upgradeActions}>
                    <TouchableOpacity 
                      style={[styles.cancelButton, { borderColor }]}
                      onPress={() => {
                        setShowUpgradeForm(false);
                        setInviteCode('');
                      }}
                    >
                      <ThemedText style={[styles.cancelButtonText, { color: textColor }]}>
                        Cancel
                      </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.submitButton, { backgroundColor: successColor }]}
                      onPress={handleUpgradeRole}
                      disabled={isUpgrading || !inviteCode.trim()}
                    >
                      <ThemedText style={styles.submitButtonText}>
                        {isUpgrading ? 'Upgrading...' : 'Upgrade Role'}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Role Benefits */}
              <View style={styles.benefitsContainer}>
                <ThemedText style={styles.benefitsTitle}>Available Upgrades:</ThemedText>
                
                {userProfile?.role === 'student' && (
                  <View style={styles.benefitItem}>
                    <ThemedText style={styles.benefitEmoji}>⭐</ThemedText>
                    <View style={styles.benefitContent}>
                      <ThemedText style={styles.benefitName}>Core Member</ThemedText>
                      <ThemedText style={styles.benefitDescription}>
                        Create and manage events, moderate discussions
                      </ThemedText>
                    </View>
                  </View>
                )}

                {(userProfile?.role === 'student' || userProfile?.role === 'core_member') && (
                  <View style={styles.benefitItem}>
                    <ThemedText style={styles.benefitEmoji}>👑</ThemedText>
                    <View style={styles.benefitContent}>
                      <ThemedText style={styles.benefitName}>Administrator</ThemedText>
                      <ThemedText style={styles.benefitDescription}>
                        Full access: manage users, generate invite codes
                      </ThemedText>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Admin/Core Member Actions */}
          {(userProfile?.role === 'admin' || userProfile?.role === 'core_member') && (
            <View style={[styles.section, { backgroundColor: cardBackground, borderColor }]}>
              <ThemedText style={styles.sectionTitle}>Leadership</ThemedText>
              
              {userProfile?.role === 'core_member' && (
                <TouchableOpacity 
                  style={styles.actionItem}
                  onPress={() => router.push('/create-event')}
                >
                  <ThemedText style={styles.actionIcon}>➕</ThemedText>
                  <View style={styles.actionContent}>
                    <ThemedText style={styles.actionTitle}>Create Event</ThemedText>
                    <ThemedText style={styles.actionSubtitle}>Organize new events and activities</ThemedText>
                  </View>
                  <ThemedText style={[styles.chevron, { color: borderColor }]}>›</ThemedText>
                </TouchableOpacity>
              )}

              {userProfile?.role === 'admin' && (
                <>
                  <TouchableOpacity 
                    style={styles.actionItem}
                    onPress={() => router.push('/user-management')}
                  >
                    <ThemedText style={styles.actionIcon}>👥</ThemedText>
                    <View style={styles.actionContent}>
                      <ThemedText style={styles.actionTitle}>Manage Users</ThemedText>
                      <ThemedText style={styles.actionSubtitle}>View and manage all users</ThemedText>
                    </View>
                    <ThemedText style={[styles.chevron, { color: borderColor }]}>›</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.actionItem}
                    onPress={() => router.push('/invite-code-management')}
                  >
                    <ThemedText style={styles.actionIcon}>🎟️</ThemedText>
                    <View style={styles.actionContent}>
                      <ThemedText style={styles.actionTitle}>Invite Codes</ThemedText>
                      <ThemedText style={styles.actionSubtitle}>Generate and manage invite codes</ThemedText>
                    </View>
                    <ThemedText style={[styles.chevron, { color: borderColor }]}>›</ThemedText>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* Account Statistics */}
          <View style={[styles.section, { backgroundColor: cardBackground, borderColor }]}>
            <ThemedText style={styles.sectionTitle}>Statistics</ThemedText>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>
                  {new Date(userProfile?.createdAt || '').toLocaleDateString()}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Member Since</ThemedText>
              </View>
              
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>
                  {userProfile?.roleHistory?.length || 0}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Role Upgrades</ThemedText>
              </View>
            </View>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity 
            style={[styles.signOutButton, { borderColor: dangerColor }]}
            onPress={handleSignOut}
          >
            <ThemedText style={[styles.signOutText, { color: dangerColor }]}>
              Sign Out
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  guestMessage: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
    marginBottom: 32,
  },
  userCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  userCampus: {
    fontSize: 14,
    opacity: 0.7,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  roleEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  roleDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 28,
    textAlign: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
  },
  upgradeButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  upgradeForm: {
    marginBottom: 16,
  },
  inviteInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  upgradeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  benefitsContainer: {
    marginTop: 16,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    opacity: 0.8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitEmoji: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
    textAlign: 'center',
  },
  benefitContent: {
    flex: 1,
  },
  benefitName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 12,
    opacity: 0.7,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});