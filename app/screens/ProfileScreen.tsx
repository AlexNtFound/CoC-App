// app/screens/ProfileScreen.tsx
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Header from '../../components/Header';
import ThemedProfileIcon from '../../components/ThemedProfileIcon';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { useThemeColor } from '../../hooks/useThemeColor';

interface SettingsItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'toggle' | 'navigation' | 'action' | 'theme-option';
  icon: string;
  value?: boolean;
  action?: () => void;
  selected?: boolean;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t, language, setLanguage } = useLanguage();
  const { user } = useUser();
  const { themeMode, setThemeMode, isDark } = useTheme();
  
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'tint');

  const handleEditProfile = () => {
    router.push('/profile-edit');
  };

  const handleSystemThemeToggle = () => {
    if (themeMode === 'system') {
      // If currently system, switch to manual mode using current appearance
      setThemeMode(isDark ? 'dark' : 'light');
    } else {
      // If currently manual, switch back to system
      setThemeMode('system');
    }
  };

  const handleManualThemeSelection = (mode: 'light' | 'dark') => {
    setThemeMode(mode);
  };

  const handleLanguagePress = () => {
    Alert.alert(
      t('profile.language'),
      t('profile.selectLanguage'),
      [
        { text: 'English', onPress: () => setLanguage('en') },
        { text: '中文', onPress: () => setLanguage('zh') },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const getLanguageDisplayText = () => {
    return language === 'en' ? 'English' : '中文';
  };

  const getThemeDisplayText = () => {
    switch (themeMode) {
      case 'system':
        return t('theme.system');
      case 'light':
        return t('theme.light');
      case 'dark':
        return t('theme.dark');
      default:
        return t('theme.system');
    }
  };

  const renderStatsCard = () => {
    return (
      <View style={[styles.statsCard, { backgroundColor: cardBackground, borderColor }]}>
        <ThemedText style={styles.statsTitle}>{t('profile.myActivity')}</ThemedText>
        <View style={styles.statsContent}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>12</ThemedText>
            <ThemedText style={styles.statLabel}>{t('profile.eventsAttended')}</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>8</ThemedText>
            <ThemedText style={styles.statLabel}>{t('profile.studiesCompleted')}</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>5</ThemedText>
            <ThemedText style={styles.statLabel}>{t('profile.prayerRequests')}</ThemedText>
          </View>
        </View>
      </View>
    );
  };

  const renderThemeOption = (item: SettingsItem) => {
    const isSelected = item.selected;
    return (
      <TouchableOpacity
        style={[
          styles.themeOptionContainer,
          isSelected && { backgroundColor: accentColor + '20', borderColor: accentColor }
        ]}
        onPress={item.action}
      >
        <View style={styles.themeOptionContent}>
          <ThemedText style={styles.themeOptionIcon}>{item.icon}</ThemedText>
          <View style={styles.themeOptionText}>
            <ThemedText style={[styles.settingsItemTitle, isSelected && { color: accentColor }]}>
              {item.title}
            </ThemedText>
            <ThemedText style={styles.settingsItemSubtitle}>{item.subtitle}</ThemedText>
          </View>
          {isSelected && (
            <ThemedText style={[styles.checkmark, { color: accentColor }]}>✓</ThemedText>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSettingsItem = (item: SettingsItem) => {
    if (item.type === 'theme-option') {
      return renderThemeOption(item);
    }

    return (
      <TouchableOpacity
        style={styles.settingsItemContainer}
        onPress={item.action}
        disabled={item.type === 'toggle'}
      >
        <View style={styles.settingsItemContent}>
          <ThemedText style={styles.settingsItemIcon}>{item.icon}</ThemedText>
          <View style={styles.settingsItemText}>
            <ThemedText style={styles.settingsItemTitle}>{item.title}</ThemedText>
            <ThemedText style={styles.settingsItemSubtitle}>{item.subtitle}</ThemedText>
          </View>
          {item.type === 'toggle' && (
            <Switch
              value={item.value}
              onValueChange={item.action}
              trackColor={{ false: borderColor, true: accentColor }}
              thumbColor={item.value ? '#ffffff' : '#f4f3f4'}
            />
          )}
          {item.type === 'navigation' && (
            <ThemedText style={styles.chevron}>›</ThemedText>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Create theme-related settings
  const themeItems: SettingsItem[] = [
    {
      id: 'system-theme',
      title: t('theme.followSystem'),
      subtitle: t('theme.followSystemDesc'),
      type: 'toggle' as const,
      icon: '📱',
      value: themeMode === 'system',
      action: handleSystemThemeToggle,
    }
  ];

  // Add manual theme options if not following system
  if (themeMode !== 'system') {
    themeItems.push(
      {
        id: 'light-theme',
        title: t('theme.light'),
        subtitle: t('theme.lightDesc'),
        type: 'theme-option' as const,
        icon: '☀️',
        selected: themeMode === 'light',
        action: () => handleManualThemeSelection('light'),
      },
      {
        id: 'dark-theme',
        title: t('theme.dark'),
        subtitle: t('theme.darkDesc'),
        type: 'theme-option' as const,
        icon: '🌙',
        selected: themeMode === 'dark',
        action: () => handleManualThemeSelection('dark'),
      }
    );
  }

  const settingsSections: SettingsSection[] = [
    {
      title: t('theme.appearance'),
      items: themeItems,
    },
    {
      title: t('profile.preferences'),
      items: [
        {
          id: 'language',
          title: t('profile.language'),
          subtitle: `${t('common.current')}: ${getLanguageDisplayText()}`,
          type: 'navigation' as const,
          icon: '🌍',
          action: handleLanguagePress,
        },
      ],
    },
    {
      title: t('profile.account'),
      items: [
        {
          id: 'edit-profile',
          title: t('profile.editProfile'),
          subtitle: t('profile.editProfileDesc'),
          type: 'navigation' as const,
          icon: '👤',
          action: handleEditProfile,
        },
        {
          id: 'prayer-requests',
          title: t('profile.myPrayerRequests'),
          subtitle: t('profile.myPrayerRequestsDesc'),
          type: 'navigation' as const,
          icon: '🙏',
          action: () => Alert.alert(t('profile.myPrayerRequests'), t('profile.featureComingSoon')),
        },
        {
          id: 'bookmarked-verses',
          title: t('profile.bookmarkedVerses'),
          subtitle: t('profile.bookmarkedVersesDesc'),
          type: 'navigation' as const,
          icon: '📖',
          action: () => Alert.alert(t('profile.bookmarkedVerses'), t('profile.featureComingSoon')),
        },
      ],
    },
    {
      title: t('profile.support'),
      items: [
        {
          id: 'help-support',
          title: t('profile.helpSupport'),
          subtitle: t('profile.helpSupportDesc'),
          type: 'navigation' as const,
          icon: '❓',
          action: () => Alert.alert(t('profile.helpSupport'), t('profile.featureComingSoon')),
        },
        {
          id: 'send-feedback',
          title: t('profile.sendFeedback'),
          subtitle: t('profile.sendFeedbackDesc'),
          type: 'navigation' as const,
          icon: '💬',
          action: () => Alert.alert(t('profile.sendFeedback'), t('profile.featureComingSoon')),
        },
        {
          id: 'about',
          title: t('profile.about'),
          subtitle: t('profile.aboutDesc'),
          type: 'navigation' as const,
          icon: 'ℹ️',
          action: () => Alert.alert(t('profile.about'), t('profile.version') + '\n\n' + t('profile.madeWith')),
        },
      ],
    },
    {
      title: t('profile.accountActions'),
      items: [
        {
          id: 'logout',
          title: t('profile.signOut'),
          subtitle: t('profile.signOutDesc'),
          type: 'action' as const,
          icon: '🚪',
          action: () => {
            Alert.alert(
              t('profile.signOut'),
              t('profile.signOutConfirm'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                { 
                  text: t('profile.signOut'), 
                  style: 'destructive',
                  onPress: () => {
                    // Implement sign out logic here
                    Alert.alert(t('profile.signedOut'));
                  }
                },
              ]
            );
          },
        },
      ],
    },
  ];

  return (
    <ThemedView style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
      <Header 
        title={t('profile.title')} 
        showBackButton={false}
        showProfile={false}
      />
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: cardBackground, borderColor }]}>
          {/* Edit Button - Positioned absolutely in top right */}
          <TouchableOpacity 
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <ThemedText style={styles.editButtonText}>{t('profile.edit')}</ThemedText>
          </TouchableOpacity>

          {/* Centered Profile Image */}
          <View style={styles.profileImageContainer}>
            <ThemedProfileIcon size={80} />
          </View>

          <ThemedText style={styles.profileName}>{user.name}</ThemedText>
          <ThemedText style={styles.profileEmail}>{user.email}</ThemedText>

          <View style={styles.profileDetails}>
            <View style={styles.profileDetailRow}>
              <ThemedText style={styles.profileDetailLabel}>{t('profile.campus')}</ThemedText>
              <ThemedText style={styles.profileDetailValue}>{user.campus}</ThemedText>
            </View>
            <View style={styles.profileDetailRow}>
              <ThemedText style={styles.profileDetailLabel}>{t('profile.year')}</ThemedText>
              <ThemedText style={styles.profileDetailValue}>{user.year}</ThemedText>
            </View>
            <View style={styles.profileDetailRow}>
              <ThemedText style={styles.profileDetailLabel}>{t('profile.joined')}</ThemedText>
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
                  {index < section.items.length - 1 && item.type !== 'theme-option' && (
                    <View style={[styles.settingsDivider, { borderBottomColor: borderColor }]} />
                  )}
                  {/* Add spacing between theme options */}
                  {item.type === 'theme-option' && index < section.items.length - 1 && (
                    <View style={styles.themeOptionSpacing} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <ThemedText style={styles.versionText}>{t('profile.version')}</ThemedText>
          <ThemedText style={styles.versionSubtext}>{t('profile.madeWith')}</ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    position: 'relative',
  },
  editButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#45b7d1',
    zIndex: 1,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  profileImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 20,
    marginBottom: 16,
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
    paddingVertical: 4,
  },
  profileDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  profileDetailValue: {
    fontSize: 14,
    opacity: 0.8,
  },
  statsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingsItemContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingsItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsItemIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
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
    opacity: 0.7,
  },
  chevron: {
    fontSize: 18,
    opacity: 0.5,
    marginLeft: 8,
  },
  settingsDivider: {
    borderBottomWidth: 1,
    marginHorizontal: 16,
  },
  // Theme option specific styles
  themeOptionContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  themeOptionText: {
    flex: 1,
  },
  themeOptionIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  themeOptionSpacing: {
    height: 4,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingBottom: 40,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.8,
  },
  versionSubtext: {
    fontSize: 12,
    opacity: 0.6,
  },
});