// CoC-App/components/InitialSetupScreen.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Language } from '../contexts/LanguageContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

const { width: screenWidth } = Dimensions.get('window');

interface InitialSetupScreenProps {
  visible: boolean;
  onComplete: () => void;
}

type ThemeMode = 'light' | 'dark' | 'system';

const SETUP_COMPLETE_KEY = 'initial_setup_complete';

export default function InitialSetupScreen({ visible, onComplete }: InitialSetupScreenProps) {
  const { language, setLanguage, t } = useLanguage();
  const { themeMode, setThemeMode, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>(themeMode);
  const [currentStep, setCurrentStep] = useState(0);
  
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const accentColor = useThemeColor({}, 'tint');

  // 根据当前主题选择logo
  const logoSource = isDark 
    ? require('../assets/images/adaptive-icon.png')
    : require('../assets/images/icon.png');

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Christians on Campus!',
      titleZh: '欢迎来到校园基督徒！',
      subtitle: 'Let\'s set up your experience',
      subtitleZh: '让我们设置您的体验',
    },
    {
      id: 'language',
      title: 'Choose Your Language',
      titleZh: '选择您的语言',
      subtitle: 'Select your preferred language',
      subtitleZh: '选择您偏好的语言',
    },
    {
      id: 'theme',
      title: 'Choose Your Theme',
      titleZh: '选择您的主题',
      subtitle: 'Select your preferred appearance',
      subtitleZh: '选择您偏好的外观',
    },
  ];

  const languageOptions = [
    {
      key: 'en' as Language,
      title: 'English',
      subtitle: 'Use English interface',
      icon: '🇺🇸',
    },
    {
      key: 'zh' as Language,
      title: '中文',
      subtitle: '使用中文界面',
      icon: '🇨🇳',
    },
  ];

  const themeOptions = [
    {
      key: 'system' as ThemeMode,
      title: 'Follow System',
      titleZh: '跟随系统',
      subtitle: 'Automatically match your device settings',
      subtitleZh: '自动匹配您的设备设置',
      icon: '📱',
    },
    {
      key: 'light' as ThemeMode,
      title: 'Light Theme',
      titleZh: '浅色主题',
      subtitle: 'Use light appearance',
      subtitleZh: '使用浅色外观',
      icon: '☀️',
    },
    {
      key: 'dark' as ThemeMode,
      title: 'Dark Theme',
      titleZh: '深色主题',
      subtitle: 'Use dark appearance',
      subtitleZh: '使用深色外观',
      icon: '🌙',
    },
  ];

  const handleNext = () => {
    // Language is already applied in handleLanguageSelection
    // Theme is already applied in handleThemeSelection
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Final theme setting is already applied in handleThemeSelection
      // Just mark setup as complete
      await AsyncStorage.setItem(SETUP_COMPLETE_KEY, 'true');
      
      onComplete();
    } catch (error) {
      console.error('Error saving initial setup:', error);
      // Still complete the setup even if saving fails
      onComplete();
    }
  };

  const handleSkip = async () => {
    try {
      // Mark setup as complete without changing settings
      await AsyncStorage.setItem(SETUP_COMPLETE_KEY, 'true');
      onComplete();
    } catch (error) {
      console.error('Error saving initial setup:', error);
      onComplete();
    }
  };

  const getCurrentTitle = () => {
    const step = steps[currentStep];
    return selectedLanguage === 'zh' ? step.titleZh : step.title;
  };

  const getCurrentSubtitle = () => {
    const step = steps[currentStep];
    return selectedLanguage === 'zh' ? step.subtitleZh : step.subtitle;
  };

  const getButtonText = (key: string) => {
    if (selectedLanguage === 'zh') {
      switch (key) {
        case 'next': return '下一步';
        case 'back': return '返回';
        case 'complete': return '完成';
        case 'skip': return '跳过';
        default: return key;
      }
    } else {
      switch (key) {
        case 'next': return 'Next';
        case 'back': return 'Back';
        case 'complete': return 'Complete';
        case 'skip': return 'Skip';
        default: return key;
      }
    }
  };

  const renderWelcomeStep = () => (
    <View style={styles.welcomeStepContent}>
      <View style={styles.welcomeContainer}>
        <Image source={logoSource} style={styles.welcomeLogo} />
        <ThemedText style={styles.stepTitle}>{getCurrentTitle()}</ThemedText>
        <ThemedText style={styles.stepSubtitle}>{getCurrentSubtitle()}</ThemedText>
        
        {/* <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <ThemedText style={styles.featureIcon}>📖</ThemedText>
            <ThemedText style={styles.featureText}>
              {selectedLanguage === 'zh' ? '阅读圣经' : 'Read Bible'}
            </ThemedText>
          </View>
          <View style={styles.featureItem}>
            <ThemedText style={styles.featureIcon}>📅</ThemedText>
            <ThemedText style={styles.featureText}>
              {selectedLanguage === 'zh' ? '参加活动' : 'Join Events'}
            </ThemedText>
          </View>
          <View style={styles.featureItem}>
            <ThemedText style={styles.featureIcon}>🤝</ThemedText>
            <ThemedText style={styles.featureText}>
              {selectedLanguage === 'zh' ? '弟兄姊妹交通' : 'Fellowship'}
            </ThemedText>
          </View>
        </View> */}
      </View>
    </View>
  );

  const handleLanguageSelection = async (lang: Language) => {
    setSelectedLanguage(lang);
    // 立即应用语言变化，这样用户可以看到实时预览
    try {
      await setLanguage(lang);
    } catch (error) {
      console.error('Error applying language:', error);
    }
  };

  const renderLanguageStep = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>{getCurrentTitle()}</ThemedText>
      <ThemedText style={styles.stepSubtitle}>{getCurrentSubtitle()}</ThemedText>
      
      <View style={styles.optionsContainer}>
        {languageOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.optionButton,
              { backgroundColor: cardBackground, borderColor },
              selectedLanguage === option.key && { 
                backgroundColor: accentColor + '20', 
                borderColor: accentColor 
              }
            ]}
            onPress={() => handleLanguageSelection(option.key)}
          >
            <ThemedText style={styles.optionIcon}>{option.icon}</ThemedText>
            <View style={styles.optionText}>
              <ThemedText style={[
                styles.optionTitle,
                selectedLanguage === option.key && { color: accentColor }
              ]}>
                {option.title}
              </ThemedText>
              <ThemedText style={styles.optionSubtitle}>{option.subtitle}</ThemedText>
            </View>
            {selectedLanguage === option.key && (
              <ThemedText style={[styles.checkmark, { color: accentColor }]}>✓</ThemedText>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const handleThemeSelection = async (theme: ThemeMode) => {
    setSelectedTheme(theme);
    // 立即应用主题变化，这样用户可以看到实时预览
    try {
      await setThemeMode(theme);
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  };

  const renderThemeStep = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>{getCurrentTitle()}</ThemedText>
      <ThemedText style={styles.stepSubtitle}>{getCurrentSubtitle()}</ThemedText>
      
      <View style={styles.optionsContainer}>
        {themeOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.optionButton,
              { backgroundColor: cardBackground, borderColor },
              selectedTheme === option.key && { 
                backgroundColor: accentColor + '20', 
                borderColor: accentColor 
              }
            ]}
            onPress={() => handleThemeSelection(option.key)}
          >
            <ThemedText style={styles.optionIcon}>{option.icon}</ThemedText>
            <View style={styles.optionText}>
              <ThemedText style={[
                styles.optionTitle,
                selectedTheme === option.key && { color: accentColor }
              ]}>
                {selectedLanguage === 'zh' ? option.titleZh : option.title}
              </ThemedText>
              <ThemedText style={styles.optionSubtitle}>
                {selectedLanguage === 'zh' ? option.subtitleZh : option.subtitle}
              </ThemedText>
            </View>
            {selectedTheme === option.key && (
              <ThemedText style={[styles.checkmark, { color: accentColor }]}>✓</ThemedText>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderWelcomeStep();
      case 1:
        return renderLanguageStep();
      case 2:
        return renderThemeStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
    >
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  { backgroundColor: borderColor },
                  index <= currentStep && { backgroundColor: accentColor }
                ]}
              />
            ))}
          </View>

          {/* Step Content */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderStepContent()}
          </ScrollView>

          {/* Navigation Buttons */}
          <View style={[styles.buttonContainer, { paddingBottom: insets.bottom }]}>
            <View style={styles.buttonRow}>
              {currentStep > 0 ? (
                <TouchableOpacity
                  style={[styles.button, styles.backButton, { borderColor }]}
                  onPress={handleBack}
                >
                  <ThemedText style={styles.backButtonText}>
                    {getButtonText('back')}
                  </ThemedText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.skipButton]}
                  onPress={handleSkip}
                >
                  <ThemedText style={styles.skipButtonText}>
                    {getButtonText('skip')}
                  </ThemedText>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.button, styles.nextButton, { backgroundColor: accentColor }]}
                onPress={handleNext}
              >
                <ThemedText style={styles.nextButtonText}>
                  {currentStep === steps.length - 1 ? getButtonText('complete') : getButtonText('next')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 10, // 添加垂直padding确保内容不被裁剪
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    gap: 8,
    paddingVertical: 10, // 添加垂直padding
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
    paddingTop: 10, // 添加顶部padding防止内容被裁剪
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start', // 保持第2、3页从顶部开始
    minHeight: 400,
    paddingVertical: 20,
    paddingTop: 40,
  },
  // 专门为第一页（欢迎页）创建的样式
  welcomeStepContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', // 第一页居中对齐
    minHeight: 400,
    paddingVertical: 20,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20, // 恢复第一页的垂直padding
  },
  welcomeLogo: {
    width: 280,
    height: 280,
    resizeMode: 'contain',
    marginBottom: 48, // 恢复第一页的较大边距
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36, // 添加行高防止裁剪
    paddingHorizontal: 10, // 添加水平padding
  },
  stepSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 40, // 恢复第一页的较大边距
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  featureList: {
    gap: 20,
    alignItems: 'flex-start',
    paddingVertical: 10, // 添加垂直padding
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4, // 添加垂直padding防止裁剪
  },
  featureIcon: {
    fontSize: 24,
    lineHeight: 30, // 添加行高防止裁剪
    textAlign: 'center',
    minWidth: 30, // 确保有足够空间
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24, // 添加行高防止裁剪
    flex: 1,
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
    marginTop: 20,
    paddingHorizontal: 4, // 添加水平padding防止边缘裁剪
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    minHeight: 70, // 确保有足够高度
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 16,
    lineHeight: 30, // 添加行高防止裁剪
    textAlign: 'center',
    minWidth: 30, // 确保有足够空间
  },
  optionText: {
    flex: 1,
    paddingVertical: 4, // 添加垂直padding
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 22, // 添加行高防止裁剪
  },
  optionSubtitle: {
    fontSize: 14,
    opacity: 0.6,
    lineHeight: 20, // 添加行高防止裁剪
  },
  checkmark: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 24, // 添加行高防止裁剪
    textAlign: 'center',
    minWidth: 24, // 确保有足够空间
  },
  buttonContainer: {
    paddingTop: 20,
    paddingHorizontal: 4, // 添加水平padding防止边缘裁剪
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52, // 确保按钮有足够高度
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  skipButton: {
    backgroundColor: 'transparent',
  },
  nextButton: {
    // backgroundColor set dynamically
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20, // 添加行高防止裁剪
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.6,
    lineHeight: 20, // 添加行高防止裁剪
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    lineHeight: 20, // 添加行高防止裁剪
  },
});

// Export utility function to check if setup is complete
export const checkSetupComplete = async (): Promise<boolean> => {
  try {
    const setupComplete = await AsyncStorage.getItem(SETUP_COMPLETE_KEY);
    return setupComplete === 'true';
  } catch (error) {
    console.error('Error checking setup status:', error);
    return false;
  }
};

// Export utility function to reset setup for development/testing
export const resetSetupForDevelopment = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SETUP_COMPLETE_KEY);
    console.log('🔧 Development: Initial setup has been reset');
  } catch (error) {
    console.error('Error resetting setup status:', error);
  }
};