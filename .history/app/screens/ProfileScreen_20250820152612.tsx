import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useThemeColor } from '../../hooks/useThemeColor';

interface UserProfile {
  name: string;
  email: string;
  campus: string;
  year: string;
  joinDate: string;
  eventsAttended: number;
  studiesCompleted: number;
  prayerRequestsSubmitted: number;
  profileImage?: string;
}

interface SettingsItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'navigation' | 'action';
  icon: string;
  value?: boolean;
  action?: () => void;
}

export default function ProfileScreen() {
  const [user, setUser] = useState<UserProfile>({
    name: 'Sarah Johnson',
    email: 'sarah.johnson@university.edu',
    campus: 'University of California',
    year: 'Junior',
    joinDate: 'September 2023',
    eventsAttended: 15,
    studiesCompleted: 8,
    prayerRequestsSubmitted: 3,
  });

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [prayerReminders, setPrayerReminders] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');

  const settingsSections = [
    {
      title: 'Notifications',
      items: [
        {
          id: 'push-notifications',
          title: 'Push Notifications',
          subtitle: 'Receive notifications for events and updates',
          type: 'toggle' as const,
          icon: '🔔',
          value: notifications,
          action: () => setNotifications(!notifications),
        },
        {
          id: 'event-reminders',
          title: 'Event Reminders',
          subtitle: 'Get reminded before events start',
          type: 'toggle' as const,
          icon: '📅',
          value: eventReminders,
          action: () => setEventReminders(!eventReminders),
        },
        {
          id: 'prayer-reminders',
          title: 'Prayer Reminders',
          subtitle: 'Daily prayer time reminders',
          type: 'toggle' as const,
          icon: '🙏',
          value: prayerReminders,
          action: () => setPrayerReminders(!prayerReminders),
        },
      ],
    },
    {
      title: 'Appearance',
      items: [
        {
          id: 'dark-mode',
          title: 'Dark Mode',
          subtitle: 'Use dark theme',
          type: 'toggle' as const,
          icon: '🌙',
          value: darkMode,
          action: () => setDarkMode(!darkMode),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'edit-profile',
          title: 'Edit Profile',
          subtitle: 'Update your personal information',
          type: 'navigation' as const,
          icon: '✏️',
          action: () => Alert.alert('Edit Profile', 'Edit profile feature coming soon!'),
        },
        {
          id: 'prayer-requests',
          title: 'My Prayer Requests',
          subtitle: 'View and manage your prayer requests',
          type: 'navigation' as const,
          icon: '🕊️',
          action: () => Alert.alert('Prayer Requests', 'Prayer requests management coming soon!'),
        },
        {
          id: 'bookmarks',
          title: 'Bookmarked Verses',
          subtitle: 'Your saved Bible verses',
          type: 'navigation' as const,
          icon: '📖',
          action: () => Alert.alert('Bookmarks', 'Bookmarks feature coming soon!'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help & Support',
          subtitle: 'Get help or contact us',
          type: 'navigation' as const,
          icon: '❓',
          action: () => Alert.alert('Help', 'Help center coming soon!'),
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          subtitle: 'Help us improve the app',
          type: 'navigation' as const,
          icon: '💬',
          action: () => Alert.alert('Feedback', 'Feedback form coming soon!'),
        },
        {
          id: 'about',
          title: 'About',
          subtitle: 'App version and information',
          type: 'navigation' as const,
          icon: 'ℹ️',
          action: () => Alert.alert('About', 'Christians on Campus v1.0.0\n\nBuilt with love for the campus ministry community.'),
        },
      ],
    },
    {
      title: 'Account Actions',
      items: [
        {
          id: 'logout',
          title: 'Sign Out',
          subtitle: 'Sign out of your account',
          type: 'action' as const,
          icon: '🚪',
          action: () => {
            Alert.alert(
              'Sign Out',
              'Are you sure you want to sign out?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: () => Alert.alert('Signed Out', 'Sign out functionality coming soon!') }
              ]
            );
          },
        },
      ],
    },
  ];

  const renderSettingsItem = (item: SettingsItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.settingsItem, { backgroundColor: cardBackground, borderBottomColor: borderColor }]}
      onPress={item.action}
      disabled={item.type === 'toggle'}
    >
      <View style={styles.settingsItemLeft}>
        <View style={styles.settingsIcon}>
          <ThemedText style={styles.settingsIconText}>{item.icon}</ThemedText>
        </View>
        <View style={styles.settingsItemText}>
          <ThemedText style={styles.settingsItemTitle}>{item.title}</ThemedText>
          {item.subtitle && (
            <ThemedText style={styles.settingsItemSubtitle}>{item.subtitle}</ThemedText>
          )}
        </View>
      </View>
      
      {item.type === 'toggle' && (
        <Switch
          value={item.value}
          onValueChange={item.action}
          trackColor={{ false: '#e0e0e0', true: '#45b7d1' }}
          thumbColor={item.value ? '#ffffff' : '#ffffff'}
        />
      )}
      
      {item.type === 'navigation' && (
        <ThemedText style={styles.chevron}>›</ThemedText>
      )}
      
      {item.type === 'action' && item.id === 'logout' && (
        <ThemedText style={[styles.chevron, { color: '#e74c3c' }]}>›</ThemedText>
      )}
    </TouchableOpacity>
  );

  const renderStatsCard = () => (
    <View style={[styles.statsCard, { backgroundColor: cardBackground, borderColor }]}>
      <ThemedText style={styles.statsTitle}>My Activity</ThemedText>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statNumber}>{user.eventsAttended}</ThemedText>
          <ThemedText style={styles.statLabel}>Events Attended</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statNumber}>{user.studiesCompleted}</ThemedText>
          <ThemedText style={styles.statLabel}>Studies Completed</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statNumber}>{user.prayerRequestsSubmitted}</ThemedText>
          <ThemedText style={styles.statLabel}>Prayer Requests</ThemedText>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor }]} 
      contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <ThemedView style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <ThemedText style={styles.headerTitle}>Profile</ThemedText>
      </ThemedView>

      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: cardBackground, borderColor }]}>
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImagePlaceholder}>
              <ThemedText style={styles.profileImageText}>
                {user.name.split(' ').map(n => n[0]).join('')}
              </ThemedText>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => Alert.alert('Edit Profile', 'Edit profile feature coming soon!')}
          >
            <ThemedText style={styles.editButtonText}>Edit</ThemedText>
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.profileName}>{user.name}</ThemedText>
        <ThemedText style={styles.profileEmail}>{user.email}</ThemedText>

        <View style={styles.profileDetails}>
          <View style={styles.profileDetailRow}>
            <ThemedText style={styles.profileDetailLabel}>🎓 Campus:</ThemedText>
            <ThemedText style={styles.profileDetailValue}>{user.campus}</ThemedText>
          </View>
          <View style={styles.profileDetailRow}>
            <ThemedText style={styles.profileDetailLabel}>📚 Year:</ThemedText>
            <ThemedText style={styles.profileDetailValue}>{user.year}</ThemedText>
          </View>
          <View style={styles.profileDetailRow}>
            <ThemedText style={styles.profileDetailLabel}>📅 Joined:</ThemedText>
            <ThemedText style={styles.profileDetailValue}>{user.joinDate}</ThemedText>
          </View>
        </View>
      </View>

      {/* Stats Card */}
      {renderStatsCard()}

      {/* Settings Sections */}
      {settingsSections.map((section) => (
        <View key={section.title} style={styles.settingsSection}>
          <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
          <View style={[styles.settingsCard, { backgroundColor: cardBackground, borderColor }]}>
            {section.items.map((item, index) => (
              <View key={item.id}>
                {renderSettingsItem(item)}
                {index < section.items.length - 1 && (
                  <View style={[styles.settingsDivider, { borderBottomColor: borderColor }]} />
                )}
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Version Info */}
      <View style={styles.versionInfo}>
        <ThemedText style={styles.versionText}>Christians on Campus v1.0.0</ThemedText>
        <ThemedText style={styles.versionSubtext}>Made with ❤️ for campus ministry</ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 34,
    paddingTop: 5,
  },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  profileImageContainer: {
    alignItems: 'center',
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#45b7d1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#45b7d1',
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 20,
    textAlign: 'center',
  },
  profileDetails: {
    gap: 8,
  },
  profileDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileDetailLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  profileDetailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#45b7d1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
    opacity: 0.8,
  },
  settingsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsIconText: {
    fontSize: 16,
  },
  settingsItemText: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingsItemSubtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  settingsDivider: {
    borderBottomWidth: 0.5,
    marginLeft: 64,
  },
  chevron: {
    fontSize: 18,
    opacity: 0.4,
    marginLeft: 8,
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    opacity: 0.5,
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 12,
    opacity: 0.4,
  },
});