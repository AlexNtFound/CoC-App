// CoC-App/app/screens/ProfileScreen.tsx
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import DeveloperSettings from '../../components/DeveloperSettings';
import Header from '../../components/Header';
import ThemedProfileIcon from '../../components/ThemedProfileIcon';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useInviteCode } from '../../contexts/InviteCodeContext';
import type { Language } from '../../contexts/LanguageContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { useUserRole, type UserRole } from '../../contexts/UserRoleContext';
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
  const { userRole, updateUserRole } = useUserRole(); // 🔥 CRITICAL: Get updateUserRole function
  const { currentSession, activateInviteCode, logout } = useInviteCode();
  
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);
  const [showInviteCodeInput, setShowInviteCodeInput] = useState(false);
  const [inviteCodeForm, setInviteCodeForm] = useState({
    code: '',
    name: user?.name || '',
    campus: 'University of California',
    email: user?.email || '',
  });
  const [isActivatingCode, setIsActivatingCode] = useState(false);
  
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
  
  const handleActivateInviteCode = async () => {
    if (!inviteCodeForm.code.trim()) {
      Alert.alert('Validation Error', 'Please enter an invite code.');
      return;
    }
  
    if (!inviteCodeForm.name.trim()) {
      Alert.alert('Validation Error', 'Please enter your name.');
      return;
    }
  
    setIsActivatingCode(true);
  
    try {
      // 🔥 CRITICAL FIX: Pass updateUserRole function to activateInviteCode
      await activateInviteCode(
        inviteCodeForm.code.trim(), 
        {
          name: inviteCodeForm.name.trim(),
          campus: inviteCodeForm.campus.trim(),
          email: inviteCodeForm.email.trim() || undefined,
        },
        updateUserRole // This will update the UserRoleContext
      );
  
      Alert.alert(
        'Success!',
        'Your invite code has been activated successfully. You now have enhanced permissions!',
        [{ text: 'Great!', onPress: () => setShowInviteCodeInput(false) }]
      );
  
      // Reset form
      setInviteCodeForm({
        code: '',
        name: user?.name || '',
        campus: 'University of California',
        email: user?.email || '',
      });
    } catch (error) {
      Alert.alert(
        'Activation Failed',
        error instanceof Error ? error.message : 'Failed to activate invite code. Please try again.'
      );
    } finally {
      setIsActivatingCode(false);
    }
  };

  // 格式化邀请码输入
  const formatInviteCode = (input: string): string => {
    // 移除所有非字母数字字符（除了已有的连字符）
    const cleaned = input.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    
    // 如果长度小于等于2，直接返回
    if (cleaned.length <= 2) {
      return cleaned;
    }
    
    // 分割成段：前2个字符，然后每4个字符一段
    let result = cleaned.substring(0, 2);
    let remaining = cleaned.substring(2);
    
    // 添加第一个连字符
    if (remaining.length > 0) {
      result += '-';
    }
    
    // 处理剩余的字符，每4个字符添加一个连字符
    while (remaining.length > 0) {
      const segment = remaining.substring(0, 4);
      result += segment;
      remaining = remaining.substring(4);
      
      // 只有在还有剩余字符时才添加连字符
      if (remaining.length > 0) {
        result += '-';
      }
    }
    
    return result;
  };
  
  // 渲染邀请码激活部分
  const renderInviteCodeSection = () => {
    if (currentSession.isAuthenticated) {
      // 已认证用户显示当前状态
      return (
        <View style={styles.settingsSection}>
          <ThemedText style={styles.sectionTitle}>Account Status</ThemedText>
          <View style={[styles.sectionContent, { backgroundColor: cardBackground, borderColor }]}>
            <View style={styles.settingsItem}>
              <View style={styles.settingsItemContent}>
                <ThemedText style={styles.settingsItemIcon}>🔐</ThemedText>
                <View style={styles.settingsItemText}>
                  <ThemedText style={styles.settingsItemTitle}>Authenticated</ThemedText>
                  <ThemedText style={styles.settingsItemSubtitle}>
                    Role: {getRoleIcon(userRole.role)} {getRoleDisplayName(userRole.role)}
                  </ThemedText>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: '#27ae60' }]}>
                  <ThemedText style={styles.statusBadgeText}>✓ ACTIVE</ThemedText>
                </View>
              </View>
            </View>
            
            <View style={[styles.separator, { backgroundColor: borderColor }]} />
            
            <TouchableOpacity style={styles.settingsItem} onPress={handleSignOut}>
              <View style={styles.settingsItemContent}>
                <ThemedText style={styles.settingsItemIcon}>🚪</ThemedText>
                <View style={styles.settingsItemText}>
                  <ThemedText style={styles.settingsItemTitle}>Sign Out</ThemedText>
                  <ThemedText style={styles.settingsItemSubtitle}>
                    Clear authentication and role permissions
                  </ThemedText>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  
    // 未认证用户显示激活选项
    return (
      <View style={styles.settingsSection}>
        <ThemedText style={styles.sectionTitle}>Account Enhancement</ThemedText>
        <View style={[styles.sectionContent, { backgroundColor: cardBackground, borderColor }]}>
          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={() => setShowInviteCodeInput(!showInviteCodeInput)}
          >
            <View style={styles.settingsItemContent}>
              <ThemedText style={styles.settingsItemIcon}>🎫</ThemedText>
              <View style={styles.settingsItemText}>
                <ThemedText style={styles.settingsItemTitle}>Activate Invite Code</ThemedText>
                <ThemedText style={styles.settingsItemSubtitle}>
                  Get core member or admin permissions
                </ThemedText>
              </View>
              <ThemedText style={[
                styles.chevron, 
                { 
                  transform: [{ rotate: showInviteCodeInput ? '90deg' : '0deg' }] 
                }
              ]}>
                ›
              </ThemedText>
            </View>
          </TouchableOpacity>
  
          {showInviteCodeInput && (
            <View style={styles.inviteCodeForm}>
              <View style={[styles.separator, { backgroundColor: borderColor }]} />
              
              <View style={styles.formField}>
                <ThemedText style={styles.fieldLabel}>Invite Code *</ThemedText>
                <TextInput
                   style={[
                     styles.textInput,
                     { borderColor, color: textColor, backgroundColor }
                   ]}
                   value={inviteCodeForm.code}
                   onChangeText={(text: string) => {
                     setInviteCodeForm(prev => ({ 
                       ...prev, 
                       code: text.toUpperCase()
                     }));
                   }}
                   placeholder="Paste your invite code here"
                   placeholderTextColor={borderColor}
                   autoCapitalize="characters"
                   autoCorrect={false}
                 />
              </View>
  
              <View style={styles.formField}>
                <ThemedText style={styles.fieldLabel}>Your Name *</ThemedText>
                <TextInput
                  style={[
                    styles.textInput,
                    { borderColor, color: textColor, backgroundColor }
                  ]}
                  value={inviteCodeForm.name}
                  onChangeText={(text: string) => setInviteCodeForm(prev => ({ ...prev, name: text }))}
                  placeholder="Enter your full name"
                  placeholderTextColor={borderColor}
                  maxLength={50}
                />
              </View>
  
              <View style={styles.formField}>
                <ThemedText style={styles.fieldLabel}>Campus/University *</ThemedText>
                <TextInput
                  style={[
                    styles.textInput,
                    { borderColor, color: textColor, backgroundColor }
                  ]}
                  value={inviteCodeForm.campus}
                  onChangeText={(text: string) => setInviteCodeForm(prev => ({ ...prev, campus: text }))}
                  placeholder="Enter your university"
                  placeholderTextColor={borderColor}
                  maxLength={100}
                />
              </View>
  
              <View style={styles.formField}>
                <ThemedText style={styles.fieldLabel}>Email (Optional)</ThemedText>
                <TextInput
                  style={[
                    styles.textInput,
                    { borderColor, color: textColor, backgroundColor }
                  ]}
                  value={inviteCodeForm.email}
                  onChangeText={(text: string) => setInviteCodeForm(prev => ({ ...prev, email: text }))}
                  placeholder="Enter your email"
                  placeholderTextColor={borderColor}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  maxLength={100}
                />
              </View>
  
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton, { borderColor }]}
                  onPress={() => setShowInviteCodeInput(false)}
                  disabled={isActivatingCode}
                >
                  <ThemedText style={[styles.formButtonText, { color: textColor }]}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
  
                <TouchableOpacity
                  style={[
                    styles.formButton, 
                    styles.activateButton,
                    { 
                      backgroundColor: accentColor,
                      opacity: isActivatingCode ? 0.6 : 1 
                    }
                  ]}
                  onPress={handleActivateInviteCode}
                  disabled={isActivatingCode}
                >
                  <ThemedText style={styles.activateButtonText}>
                    {isActivatingCode ? 'Activating...' : 'Activate Code'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };
  
  // 添加辅助函数
  const getRoleDisplayName = (role: UserRole): string => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'core_member': return 'Core Member';
      case 'student': return 'Student';
      default: return role;
    }
  };
  
  const getRoleIcon = (role: UserRole): string => {
    switch (role) {
      case 'admin': return '👑';
      case 'core_member': return '⭐';
      case 'student': return '👤';
      default: return '👤';
    }
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

  // 更新用户信息显示部分：
  const renderUserProfile = () => {
    // 使用邀请码系统的用户信息
    const displayUser = currentSession.userInfo || {
      name: 'Guest User',
      campus: 'Unknown Campus',
      email: undefined,
    };

    return (
      <View style={[styles.profileHeader, { backgroundColor: cardBackground, borderColor }]}>
        <ThemedProfileIcon size={80} />
        <View style={styles.profileInfo}>
          <ThemedText style={styles.userName}>{displayUser.name}</ThemedText>
          <ThemedText style={styles.userDetails}>
            🎓 {displayUser.campus}
          </ThemedText>
          <ThemedText style={styles.userDetails}>
            {getRoleIcon(userRole.role)} {getRoleDisplayName(userRole.role)}
          </ThemedText>
          {currentSession.authenticatedAt && (
            <ThemedText style={styles.userDetails}>
              📅 Joined: {new Date(currentSession.authenticatedAt).toLocaleDateString()}
            </ThemedText>
          )}
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
    );
  };

  // 添加登出处理函数：
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? You will lose your current role permissions.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // 🔥 CRITICAL FIX: Await the async updateUserRole function
              await updateUserRole('student');
              Alert.alert('Signed Out', 'You have been signed out successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        },
      ]
    );
  };

  // 更新renderStatsCard函数以使用真实的用户数据：
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
        
        {/* 添加认证状态显示 */}
        <View style={styles.authStatus}>
          <ThemedText style={styles.authStatusText}>
            🔐 Authenticated • Role: {getRoleIcon(userRole.role)} {getRoleDisplayName(userRole.role)}
          </ThemedText>
          {currentSession.inviteCode && (
            <ThemedText style={styles.inviteCodeHint}>
              Code: {currentSession.inviteCode.substring(0, 8)}...
            </ThemedText>
          )}
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
    // 新增：管理员功能部分
  // 管理员功能部分 - 更新为包含邀请码管理
  ...(userRole.role === 'admin' ? [{
    title: 'Administration',
    items: [
      {
        id: 'invite-code-management',
        title: '🎫 Invite Code Management',
        subtitle: 'Generate and manage invite codes',
        type: 'navigation' as const,
        icon: '🔑',
        action: () => router.push('/invite-code-management'),
      },
      // {
      //   id: 'user-management',
      //   title: '👥 User Management',
      //   subtitle: 'View and manage users (Legacy)',
      //   type: 'navigation' as const,
      //   icon: '⚙️',
      //   action: () => router.push('/user-management'),
      // },
      {
        id: 'system-analytics',
        title: '📊 System Analytics',
        subtitle: 'View app usage and statistics',
        type: 'navigation' as const,
        icon: '📈',
        action: () => Alert.alert('System Analytics', 'Analytics feature coming soon!'),
      },
    ],
  }] : []),
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
  // 账户操作部分
  {
    title: 'Account Actions',
    items: [
      // {
      //   id: 'device-info',
      //   title: '📱 Device Information',
      //   subtitle: 'View current device binding',
      //   type: 'navigation' as const,
      //   icon: '🔒',
      //   action: () => {
      //     if (currentSession.deviceFingerprint) {
      //       Alert.alert(
      //         'Device Information',
      //         `Device: ${currentSession.deviceFingerprint.brand} ${currentSession.deviceFingerprint.model}\n` +
      //         `System: ${currentSession.deviceFingerprint.systemVersion}\n` +
      //         `Device ID: ${currentSession.deviceFingerprint.deviceId.substring(0, 8)}...`
      //       );
      //     }
      //   },
      // },
      {
        id: 'logout',
        title: 'Sign Out',
        subtitle: 'Sign out of your account',
        type: 'action' as const,
        icon: '🚪',
        action: handleSignOut,
      },
    ],
  },
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
        {/* 使用新的用户资料渲染函数 */}
        {renderUserProfile()}

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
      
        {/* 邀请码激活部分 */}
        {renderInviteCodeSection()}
        
        <DeveloperSettings />

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
  authStatus: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  authStatusText: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  inviteCodeHint: {
    fontSize: 10,
    opacity: 0.5,
    textAlign: 'center',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  inviteCodeForm: {
    padding: 16,
    paddingTop: 0,
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  inviteCodeInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
    letterSpacing: 1,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  formButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  activateButton: {
    // backgroundColor set dynamically
  },
  formButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
});