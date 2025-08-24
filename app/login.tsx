// CoC-App/app/login.tsx - 支持访客访问的登录界面
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
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

type AuthMode = 'signin' | 'signup';

export default function LoginScreen() {
  const { t } = useLanguage();
  const { signIn, signUp } = useOpenAccessAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'tint');
  const placeholderColor = textColor + '60';

  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [isLoading, setIsLoading] = useState(false);
  
  // 表单数据
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    campus: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (authMode === 'signup') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      
      if (!formData.displayName.trim()) {
        newErrors.displayName = 'Name is required';
      }
      
      if (!formData.campus.trim()) {
        newErrors.campus = 'Campus is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      await signIn(formData.email.trim(), formData.password);
      
      Alert.alert(
        'Welcome Back!',
        'You have successfully signed in.',
        [
          {
            text: 'Continue',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      await signUp(
        formData.email.trim(),
        formData.password,
        formData.displayName.trim(),
        formData.campus.trim()
      );
      
      Alert.alert(
        'Welcome!',
        'Your account has been created successfully. You can now register for events!\n\nTo get additional permissions (like creating events), you can upgrade your role in the Profile section.',
        [
          {
            text: 'Continue',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    Alert.alert(
      'Continue as Guest',
      'As a guest, you can browse events but cannot register for them. You can create an account anytime to join events.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => router.back()
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <Header 
          title="Join Our Community"
          showBackButton={true}
          onBackPress={() => router.back()}
        />

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.formContainer, { backgroundColor: cardBackground }]}>
            {/* Welcome Message */}
            <View style={styles.welcomeSection}>
              <ThemedText style={styles.title}>Christians on Campus</ThemedText>
              <ThemedText style={styles.subtitle}>
                {authMode === 'signin' 
                  ? 'Welcome back! Sign in to register for events and connect with your community.'
                  : 'Create your account to join events and connect with Christians on your campus.'
                }
              </ThemedText>
            </View>

            {/* Auth Mode Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  { borderColor },
                  authMode === 'signin' && { backgroundColor: accentColor }
                ]}
                onPress={() => setAuthMode('signin')}
              >
                <ThemedText style={[
                  styles.tabText,
                  authMode === 'signin' && styles.activeTabText
                ]}>
                  Sign In
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tab,
                  { borderColor },
                  authMode === 'signup' && { backgroundColor: accentColor }
                ]}
                onPress={() => setAuthMode('signup')}
              >
                <ThemedText style={[
                  styles.tabText,
                  authMode === 'signup' && styles.activeTabText
                ]}>
                  Create Account
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Form Content */}
            <View style={styles.formContent}>
              {/* Email Input */}
              <View style={[styles.inputGroup, { borderColor }]}>
                <ThemedText style={styles.label}>Email *</ThemedText>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor }]}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="your.email@example.com"
                  placeholderTextColor={placeholderColor}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.email && <ThemedText style={styles.errorText}>{errors.email}</ThemedText>}
              </View>

              {/* Password Input */}
              <View style={[styles.inputGroup, { borderColor }]}>
                <ThemedText style={styles.label}>Password *</ThemedText>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor }]}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  placeholder="Enter your password"
                  placeholderTextColor={placeholderColor}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.password && <ThemedText style={styles.errorText}>{errors.password}</ThemedText>}
              </View>

              {/* Sign Up Additional Fields */}
              {authMode === 'signup' && (
                <>
                  <View style={[styles.inputGroup, { borderColor }]}>
                    <ThemedText style={styles.label}>Confirm Password *</ThemedText>
                    <TextInput
                      style={[styles.input, { color: textColor, borderColor }]}
                      value={formData.confirmPassword}
                      onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                      placeholder="Confirm your password"
                      placeholderTextColor={placeholderColor}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {errors.confirmPassword && <ThemedText style={styles.errorText}>{errors.confirmPassword}</ThemedText>}
                  </View>

                  <View style={[styles.inputGroup, { borderColor }]}>
                    <ThemedText style={styles.label}>Full Name *</ThemedText>
                    <TextInput
                      style={[styles.input, { color: textColor, borderColor }]}
                      value={formData.displayName}
                      onChangeText={(text) => setFormData({ ...formData, displayName: text })}
                      placeholder="Your full name"
                      placeholderTextColor={placeholderColor}
                      autoCapitalize="words"
                    />
                    {errors.displayName && <ThemedText style={styles.errorText}>{errors.displayName}</ThemedText>}
                  </View>

                  <View style={[styles.inputGroup, { borderColor }]}>
                    <ThemedText style={styles.label}>Campus *</ThemedText>
                    <TextInput
                      style={[styles.input, { color: textColor, borderColor }]}
                      value={formData.campus}
                      onChangeText={(text) => setFormData({ ...formData, campus: text })}
                      placeholder="Your campus/university"
                      placeholderTextColor={placeholderColor}
                      autoCapitalize="words"
                    />
                    {errors.campus && <ThemedText style={styles.errorText}>{errors.campus}</ThemedText>}
                  </View>
                </>
              )}

              {/* Action Button */}
              <TouchableOpacity 
                style={[styles.primaryButton, { backgroundColor: accentColor }]}
                onPress={authMode === 'signin' ? handleSignIn : handleSignUp}
                disabled={isLoading}
              >
                <ThemedText style={styles.primaryButtonText}>
                  {isLoading 
                    ? (authMode === 'signin' ? 'Signing In...' : 'Creating Account...') 
                    : (authMode === 'signin' ? 'Sign In' : 'Create Account')
                  }
                </ThemedText>
              </TouchableOpacity>

              {/* Guest Access Button */}
              <TouchableOpacity 
                style={[styles.guestButton, { borderColor }]}
                onPress={handleContinueAsGuest}
              >
                <ThemedText style={[styles.guestButtonText, { color: textColor }]}>
                  👤 Continue as Guest
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Info Sections */}
            <View style={styles.infoSection}>
              <View style={[styles.infoCard, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                <ThemedText style={styles.infoTitle}>
                  🎯 What you get with an account:
                </ThemedText>
                <View style={styles.benefitsList}>
                  <ThemedText style={styles.benefitItem}>• Register for events and activities</ThemedText>
                  <ThemedText style={styles.benefitItem}>• Connect with your campus community</ThemedText>
                  <ThemedText style={styles.benefitItem}>• Track your event history</ThemedText>
                  <ThemedText style={styles.benefitItem}>• Upgrade to leadership roles (with invite codes)</ThemedText>
                </View>
              </View>

              <View style={[styles.infoCard, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                <ThemedText style={styles.infoTitle}>
                  🔑 About Role Upgrades:
                </ThemedText>
                <ThemedText style={styles.infoText}>
                  All accounts start as <Text style={styles.roleText}>Student</Text> members. 
                  Campus leaders can provide invite codes to upgrade to <Text style={styles.roleText}>Core Member</Text> 
                  (create events) or <Text style={styles.roleText}>Admin</Text> (manage users). 
                  You can upgrade anytime in your profile settings.
                </ThemedText>
              </View>
            </View>

            {/* Alternative Actions */}
            <View style={styles.alternativeSection}>
              {authMode === 'signin' && (
                <>
                  <TouchableOpacity 
                    style={styles.textButton}
                    onPress={() => {
                      Alert.prompt(
                        'Reset Password',
                        'Please enter your email address:',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Send Reset Email', 
                            onPress: async (email) => {
                              if (email) {
                                try {
                                  // TODO: Implement password reset
                                  Alert.alert('Reset Email Sent', 'Check your email for reset instructions.');
                                } catch (error: any) {
                                  Alert.alert('Error', error.message);
                                }
                              }
                            }
                          }
                        ],
                        'plain-text',
                        formData.email
                      );
                    }}
                  >
                    <ThemedText style={[styles.textButtonText, { color: accentColor }]}>
                      Forgot Password?
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.textButton}
                    onPress={() => setAuthMode('signup')}
                  >
                    <ThemedText style={[styles.textButtonText, { color: accentColor }]}>
                      Don't have an account? Create one
                    </ThemedText>
                  </TouchableOpacity>
                </>
              )}

              {authMode === 'signup' && (
                <TouchableOpacity 
                  style={styles.textButton}
                  onPress={() => setAuthMode('signin')}
                >
                  <ThemedText style={[styles.textButtonText, { color: accentColor }]}>
                    Already have an account? Sign In
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  formContainer: {
    flex: 1,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },
  formContent: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  guestButton: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoSection: {
    marginTop: 32,
    gap: 16,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  benefitsList: {
    gap: 4,
  },
  benefitItem: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  roleText: {
    fontWeight: '600',
    fontStyle: 'italic',
  },
  alternativeSection: {
    marginTop: 24,
    alignItems: 'center',
    gap: 12,
  },
  textButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  textButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});