// CoC-App/app/screens/ProfileScreen.tsx
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';

import Header from '../../components/Header';
import ThemedProfileIcon from '../../components/ThemedProfileIcon';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import type { Language } from '../../contexts/LanguageContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { useThemeColor } from '../../hooks/useThemeColor';

interface SettingsItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'toggle' | 'navigation' | 'action' | 'theme-option' | 'language-option';
  icon: string;
  value?: boolean;
  action?: () => void;
  selected?: boolean;
  isSubItem?: boolean;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

export default function ProfileScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { user } = useUser();
  const { themeMode, setThemeMode, isDark } = useTheme();
  
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);
  
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'tint');

  const handleBackPress = () => {
    router.back();
  };

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

  const handleLanguageSelection = (lang: Language) => {
    setLanguage(lang);
  };

  const handleLanguagePress = () => {
    console.log('Language pressed, current state:', showLanguageOptions);
    setShowLanguageOptions(!showLanguageOptions);
  };

  const handleHelpSupportPress = () => {
    const supportPhoneNumber = '+1-650-505-6637'; // 替换为实际的支持电话号码
    
    Alert.alert(
      t('profile.helpSupport'),
      t('profile.helpSupportDesc') + '\n\n' + supportPhoneNumber,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('profile.callSupport'), 
          onPress: () => {
            const phoneUrl = `tel:${supportPhoneNumber}`;
            Linking.canOpenURL(phoneUrl)
              .then(supported => {
                if (supported) {
                  Linking.openURL(phoneUrl);
                } else {
                  Alert.alert(
                    t('profile.callNotSupported'), 
                    t('profile.callNotSupportedDesc')
                  );
                }
              })
              .catch(err => {
                console.error('Error opening phone dialer:', err);
                Alert.alert(
                  t('profile.callError'), 
                  t('profile.callErrorDesc')
                );
              });
          }
        },
      ]
    );
  };

  const getLanguageDisplayText = (lang: Language) => {
    return lang === 'en' ? 'English' : '中文';
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
          item.isSubItem && styles.subItemContainer,
          isSelected && { backgroundColor: accentColor + '20', borderColor: accentColor }
        ]}
        onPress={item.action}
      >
        <View style={[styles.themeOptionContent, item.isSubItem && styles.subItemContent]}>
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

  const renderLanguageOption = (item: SettingsItem) => {
    const isSelected = item.selected;
    return (
      <TouchableOpacity
        style={[
          styles.languageOptionContainer,
          item.isSubItem && styles.subItemContainer,
          isSelected && { backgroundColor: accentColor + '20', borderColor: accentColor }
        ]}
        onPress={item.action}
      >
        <View style={[styles.languageOptionContent, item.isSubItem && styles.subItemContent]}>
          <ThemedText style={styles.languageOptionIcon}>{item.icon}</ThemedText>
          <View style={styles.languageOptionText}>
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
    
    if (item.type === 'language-option') {
      return renderLanguageOption(item);
    }

    return (
      <TouchableOpacity
        style={[styles.settingsItem, { backgroundColor: cardBackground, borderColor }]}
        onPress={() => {
          console.log('Settings item pressed:', item.id, item.action);
          item.action?.();
        }}
        disabled={!item.action}
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
              onValueChange={() => item.action?.()}
              trackColor={{ false: '#767577', true: accentColor }}
              thumbColor={item.value ? '#ffffff' : '#f4f3f4'}
            />
          )}
          {item.type === 'navigation' && (
            <ThemedText style={[
              styles.chevron, 
              { 
                transform: [{ 
                  rotate: showLanguageOptions && item.id === 'language' ? '90deg' : '0deg' 
                }] 
              }
            ]}>
              ›
            </ThemedText>
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

  // Add manual theme options only if NOT following system
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
        isSubItem: true,
      },
      {
        id: 'dark-theme',
        title: t('theme.dark'),
        subtitle: t('theme.darkDesc'),
        type: 'theme-option' as const,
        icon: '🌙',
        selected: themeMode === 'dark',
        action: () => handleManualThemeSelection('dark'),
        isSubItem: true,
      }
    );
  }

  // Create language-related settings
  const languageItems: SettingsItem[] = [
    {
      id: 'language',
      title: t('profile.language'),
      subtitle: `${t('common.current')}: ${getLanguageDisplayText(language)}`,
      type: 'navigation' as const,
      icon: '🌍',
      action: handleLanguagePress,
    }
  ];

  // Add language options only if dropdown is open
  if (showLanguageOptions) {
    console.log('Adding language options to menu');
    languageItems.push(
      {
        id: 'english-language',
        title: 'English',
        subtitle: 'Use English interface',
        type: 'language-option' as const,
        icon: '🇺🇸',
        selected: language === 'en',
        action: () => {
          console.log('English selected');
          handleLanguageSelection('en');
        },
        isSubItem: true,
      },
      {
        id: 'chinese-language',
        title: '中文',
        subtitle: '使用中文界面',
        type: 'language-option' as const,
        icon: '🇨🇳',
        selected: language === 'zh',
        action: () => {
          console.log('Chinese selected');
          handleLanguageSelection('zh');
        },
        isSubItem: true,
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
      items: languageItems,
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
          action: handleHelpSupportPress,
        },
        // {
        //   id: 'send-feedback',
        //   title: t('profile.sendFeedback'),
        //   subtitle: t('profile.sendFeedbackDesc'),
        //   type: 'navigation' as const,
        //   icon: '💬',
        //   action: () => Alert.alert(t('profile.sendFeedback'), t('profile.featureComingSoon')),
        // },
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
    // {
    //   title: t('profile.accountActions'),
    //   items: [
    //     {
    //       id: 'logout',
    //       title: t('profile.signOut'),
    //       subtitle: t('profile.signOutDesc'),
    //       type: 'action' as const,
    //       icon: '🚪',
    //       action: () => {
    //         Alert.alert(
    //           t('profile.signOut'),
    //           t('profile.signOutConfirm'),
    //           [
    //             { text: t('common.cancel'), style: 'cancel' },
    //             { 
    //               text: t('profile.signOut'), 
    //               style: 'destructive',
    //               onPress: () => {
    //                 // Implement sign out logic here
    //                 Alert.alert(t('profile.signedOut'));
    //               }
    //             },
    //           ]
    //         );
    //       },
    //     },
    //   ],
    // },
  ];

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Header 
        title={t('profile.title')}
        showBackButton={true}
        showProfile={false}
        onBackPress={handleBackPress}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: cardBackground, borderColor }]}>
          <ThemedProfileIcon size={80} />
          <View style={styles.profileInfo}>
            <ThemedText style={styles.userName}>{user?.name || 'Guest User'}</ThemedText>
            <ThemedText style={styles.userDetails}>
              {t('profile.campus')} {user?.campus || 'Unknown Campus'}
            </ThemedText>
            <ThemedText style={styles.userDetails}>
              {t('profile.year')} {user?.year || 'Unknown Year'}
            </ThemedText>
            <ThemedText style={styles.userDetails}>
              {t('profile.joined')} {user?.joinDate || 'Unknown Date'}
            </ThemedText>
          </View>
          <TouchableOpacity 
            style={[styles.editButton, { borderColor: accentColor }]}
            onPress={handleEditProfile}
          >
            <ThemedText style={[styles.editButtonText, { color: accentColor }]}>
              {t('profile.edit')}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Activity Stats */}
        {renderStatsCard()}

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.settingsSection}>
            <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
            <View style={[styles.sectionContent, { backgroundColor: cardBackground, borderColor }]}>
              {section.items.map((item, itemIndex) => (
                <View key={item.id}>
                  {renderSettingsItem(item)}
                  {itemIndex < section.items.length - 1 && (
                    <View style={[styles.separator, { backgroundColor: borderColor }]} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Bottom padding for safe area */}
        <View style={{ height: 20 }} />
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
    paddingHorizontal: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 20,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userDetails: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsCard: {
    padding: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 8,
  },
  settingsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    paddingLeft: 4,
    opacity: 0.8,
  },
  sectionContent: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingsItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 0,
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
    fontSize: 13,
    opacity: 0.6,
  },
  chevron: {
    fontSize: 20,
    opacity: 0.3,
  },
  themeOptionContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  themeOptionIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  themeOptionText: {
    flex: 1,
  },
  languageOptionContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  languageOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  languageOptionIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  languageOptionText: {
    flex: 1,
  },
  subItemContainer: {
    marginLeft: 32,
    marginRight: 16,
  },
  subItemContent: {
    paddingLeft: 8,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    marginLeft: 48,
  },
});