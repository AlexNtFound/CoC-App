// CoC-App/components/InviteCodeActivationScreen.tsx
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInviteCode } from '../contexts/InviteCodeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

const { width: screenWidth } = Dimensions.get('window');

interface InviteCodeActivationScreenProps {
  visible: boolean;
  onComplete: () => void;
}

interface UserRegistrationForm {
  name: string;
  campus: string;
  email: string;
  inviteCode: string;
}

export default function InviteCodeActivationScreen({ 
  visible, 
  onComplete 
}: InviteCodeActivationScreenProps) {
  const { language, t } = useLanguage();
  const { isDark } = useTheme();
  const { activateInviteCode } = useInviteCode();
  const insets = useSafeAreaInsets();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<UserRegistrationForm>({
    name: '',
    campus: '',
    email: '',
    inviteCode: '',
  });

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const accentColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = textColor + '60';

  // 根据当前主题选择logo
  const logoSource = isDark 
    ? require('../assets/images/adaptive-icon.png')
    : require('../assets/images/icon.png');

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome!',
      titleZh: '欢迎！',
      subtitle: 'Join Christians on Campus',
      subtitleZh: '加入校园基督徒',
    },
    {
      id: 'invite-code',
      title: 'Enter Invite Code',
      titleZh: '输入邀请码',
      subtitle: 'Enter the code you received',
      subtitleZh: '输入您收到的邀请码',
    },
    {
      id: 'user-info',
      title: 'Your Information',
      titleZh: '您的信息',
      subtitle: 'Tell us about yourself',
      subtitleZh: '告诉我们关于您的信息',
    },
  ];

  const getCurrentTitle = () => {
    const step = steps[currentStep];
    return language === 'zh' ? step.titleZh : step.title;
  };

  const getCurrentSubtitle = () => {
    const step = steps[currentStep];
    return language === 'zh' ? step.subtitleZh : step.subtitle;
  };

  const getButtonText = (key: string) => {
    if (language === 'zh') {
      switch (key) {
        case 'next': return '下一步';
        case 'back': return '返回';
        case 'complete': return '完成注册';
        case 'getStarted': return '开始使用';
        default: return key;
      }
    } else {
      switch (key) {
        case 'next': return 'Next';
        case 'back': return 'Back';
        case 'complete': return 'Complete Registration';
        case 'getStarted': return 'Get Started';
        default: return key;
      }
    }
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // Welcome step
        return true;
      case 1: // Invite code step
        return formData.inviteCode.trim().length > 0;
      case 2: // User info step
        return formData.name.trim().length > 0 && formData.campus.trim().length > 0;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) {
      Alert.alert(
        'Validation Error',
        'Please fill in all required fields before continuing.'
      );
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!validateCurrentStep()) {
      Alert.alert(
        'Validation Error',
        'Please fill in all required information.'
      );
      return;
    }

    setIsLoading(true);

    try {
      await activateInviteCode(formData.inviteCode.trim(), {
        name: formData.name.trim(),
        campus: formData.campus.trim(),
        email: formData.email.trim() || undefined,
      });

      Alert.alert(
        'Welcome!',
        'Your account has been successfully activated. Welcome to Christians on Campus!',
        [
          {
            text: 'Get Started',
            onPress: onComplete,
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Activation Failed',
        error instanceof Error ? error.message : 'Failed to activate invite code. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatInviteCode = (input: string): string => {
    // Remove any non-alphanumeric characters except hyphens
    const cleaned = input.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    
    // Auto-format as user types
    if (cleaned.length <= 2) {
      return cleaned;
    }
    
    // Split into segments of 4 characters
    const segments = [];
    let remaining = cleaned;
    
    // First segment is the prefix (2 chars)
    if (remaining.length >= 2) {
      segments.push(remaining.substr(0, 2));
      remaining = remaining.substr(2);
    }
    
    // Add separator after prefix
    if (segments.length > 0 && remaining.length > 0) {
      segments[0] += '-';
    }
    
    // Remaining segments are 4 characters each
    while (remaining.length > 0) {
      const segment = remaining.substr(0, 4);
      segments.push(segment);
      remaining = remaining.substr(4);
      
      if (remaining.length > 0) {
        segments[segments.length - 1] += '-';
      }
    }
    
    return segments.join('');
  };

  const updateField = (field: keyof UserRegistrationForm, value: string) => {
    if (field === 'inviteCode') {
      value = formatInviteCode(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderWelcomeStep = () => (
    <View style={styles.welcomeStepContent}>
      <View style={styles.welcomeContainer}>
        <Image source={logoSource} style={styles.welcomeLogo} />
        <ThemedText style={styles.stepTitle}>{getCurrentTitle()}</ThemedText>
        <ThemedText style={styles.stepSubtitle}>{getCurrentSubtitle()}</ThemedText>
        
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <ThemedText style={styles.featureIcon}>📖</ThemedText>
            <ThemedText style={styles.featureText}>
              {language === 'zh' ? '阅读圣经' : 'Read Bible'}
            </ThemedText>
          </View>
          <View style={styles.featureItem}>
            <ThemedText style={styles.featureIcon}>📅</ThemedText>
            <ThemedText style={styles.featureText}>
              {language === 'zh' ? '参加活动' : 'Join Events'}
            </ThemedText>
          </View>
          <View style={styles.featureItem}>
            <ThemedText style={styles.featureIcon}>🤝</ThemedText>
            <ThemedText style={styles.featureText}>
              {language === 'zh' ? '弟兄姊妹交通' : 'Fellowship'}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );

  const renderInviteCodeStep = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>{getCurrentTitle()}</ThemedText>
      <ThemedText style={styles.stepSubtitle}>{getCurrentSubtitle()}</ThemedText>
      
      <View style={styles.inputContainer}>
        <ThemedText style={styles.inputLabel}>
          {language === 'zh' ? '邀请码 *' : 'Invite Code *'}
        </ThemedText>
        <TextInput
          style={[
            styles.inviteCodeInput,
            { 
              borderColor,
              color: textColor,
              backgroundColor: cardBackground
            }
          ]}
          value={formData.inviteCode}
          onChangeText={(text) => updateField('inviteCode', text)}
          placeholder="AD-2025-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
          placeholderTextColor={placeholderColor}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={44} // AD- + 6 segments of 4 chars + 6 hyphens
        />
        <ThemedText style={styles.helpText}>
          {language === 'zh' 
            ? '输入您从团体领袖那里收到的邀请码' 
            : 'Enter the invite code you received from your group leader'
          }
        </ThemedText>
      </View>
    </View>
  );

  const renderUserInfoStep = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>{getCurrentTitle()}</ThemedText>
      <ThemedText style={styles.stepSubtitle}>{getCurrentSubtitle()}</ThemedText>
      
      <View style={styles.inputContainer}>
        <ThemedText style={styles.inputLabel}>
          {language === 'zh' ? '全名 *' : 'Full Name *'}
        </ThemedText>
        <TextInput
          style={[
            styles.textInput,
            { 
              borderColor,
              color: textColor,
              backgroundColor: cardBackground
            }
          ]}
          value={formData.name}
          onChangeText={(text) => updateField('name', text)}
          placeholder={language === 'zh' ? '请输入您的全名' : 'Enter your full name'}
          placeholderTextColor={placeholderColor}
          maxLength={50}
        />
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.inputLabel}>
          {language === 'zh' ? '校园/大学 *' : 'Campus/University *'}
        </ThemedText>
        <TextInput
          style={[
            styles.textInput,
            { 
              borderColor,
              color: textColor,
              backgroundColor: cardBackground
            }
          ]}
          value={formData.campus}
          onChangeText={(text) => updateField('campus', text)}
          placeholder={language === 'zh' ? '请输入您的学校名称' : 'Enter your university name'}
          placeholderTextColor={placeholderColor}
          maxLength={100}
        />
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.inputLabel}>
          {language === 'zh' ? '邮箱 (可选)' : 'Email (Optional)'}
        </ThemedText>
        <TextInput
          style={[
            styles.textInput,
            { 
              borderColor,
              color: textColor,
              backgroundColor: cardBackground
            }
          ]}
          value={formData.email}
          onChangeText={(text) => updateField('email', text)}
          placeholder={language === 'zh' ? '输入您的邮箱地址' : 'Enter your email address'}
          placeholderTextColor={placeholderColor}
          keyboardType="email-address"
          autoCapitalize="none"
          maxLength={100}
        />
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderWelcomeStep();
      case 1:
        return renderInviteCodeStep();
      case 2:
        return renderUserInfoStep();
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
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
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
              keyboardShouldPersistTaps="handled"
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
                    disabled={isLoading}
                  >
                    <ThemedText style={styles.backButtonText}>
                      {getButtonText('back')}
                    </ThemedText>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.button} />
                )}

                <TouchableOpacity
                  style={[
                    styles.button, 
                    styles.nextButton, 
                    { 
                      backgroundColor: accentColor,
                      opacity: (isLoading || !validateCurrentStep()) ? 0.6 : 1
                    }
                  ]}
                  onPress={handleNext}
                  disabled={isLoading || !validateCurrentStep()}
                >
                  <ThemedText style={styles.nextButtonText}>
                    {isLoading ? 'Processing...' : 
                     currentStep === steps.length - 1 ? getButtonText('complete') : getButtonText('next')}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    gap: 8,
    paddingVertical: 10,
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
    paddingTop: 10,
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 400,
    paddingVertical: 20,
    paddingTop: 40,
  },
  welcomeStepContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
    paddingVertical: 20,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  welcomeLogo: {
    width: 280,
    height: 280,
    resizeMode: 'contain',
    marginBottom: 48,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
    paddingHorizontal: 10,
  },
  stepSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  featureList: {
    gap: 20,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  featureIcon: {
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
    minWidth: 30,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    flex: 1,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  inviteCodeInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    minHeight: 48,
    letterSpacing: 1,
  },
  helpText: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  buttonContainer: {
    paddingTop: 20,
    paddingHorizontal: 4,
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
    minHeight: 52,
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  nextButton: {
    // backgroundColor set dynamically
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    lineHeight: 20,
  },
});