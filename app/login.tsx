// CoC-App/app/login.tsx - 支持访客访问的登录界面 + Google登录
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
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
  const { signIn, signUp, signInWithGoogle } = useOpenAccessAuth();
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
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
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Sign In Failed',
        error.message || 'An error occurred during sign in. Please try again.',
        [{ text: 'OK' }]
      );
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
        'Account Created!',
        'Your account has been created successfully. Welcome to Christians on Campus!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Sign Up Failed',
        error.message || 'An error occurred during sign up. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    
    try {
      await signInWithGoogle();
      // Note: 成功后会通过auth state change自动导航
      console.log('Google sign-in initiated successfully');
    } catch (error: any) {
      Alert.alert(
        'Google Sign In Failed',
        error.message || 'Failed to sign in with Google. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGuestAccess = () => {
    Alert.alert(
      'Continue as Guest',
      'You can browse events and content, but you won\'t be able to register for events or access member features.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Continue',
          onPress: () => router.replace('/(tabs)'),
        },
      ]
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Header title="Welcome" showBackButton={false} />
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
            <View style={styles.header}>
              <ThemedText style={styles.title}>
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                {authMode === 'signin' 
                  ? 'Welcome back! Sign in to your account.' 
                  : 'Join our campus community today.'}
              </ThemedText>
            </View>

            {/* Google Sign-In Button */}
            <TouchableOpacity 
              style={[styles.googleButton, { borderColor }]}
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
            >
              <Ionicons 
                name="logo-google" 
                size={20} 
                color="#4285F4" 
                style={styles.googleIcon} 
              />
              <ThemedText style={[styles.googleButtonText, { color: textColor }]}>
                {isGoogleLoading 
                  ? 'Signing in with Google...' 
                  : `${authMode === 'signin' ? 'Sign in' : 'Sign up'} with Google`}
              </ThemedText>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
              <ThemedText style={[styles.dividerText, { color: placeholderColor }]}>
                or continue with email
              </ThemedText>
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
            </View>

            <View style={styles.form}>
              {/* Email Input */}
              <View style={[styles.inputGroup, { borderColor }]}>
                <ThemedText style={styles.label}>Email *</ThemedText>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor }]}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Enter your email"
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
                disabled={isLoading || isGoogleLoading}
              >
                <ThemedText style={styles.primaryButtonText}>
                  {isLoading 
                    ? (authMode === 'signin' ? 'Signing In...' : 'Creating Account...') 
                    : (authMode === 'signin' ? 'Sign In' : 'Create Account')}
                </ThemedText>
              </TouchableOpacity>

              {/* Mode Switch */}
              <View style={styles.switchContainer}>
                <ThemedText style={[styles.switchText, { color: placeholderColor }]}>
                  {authMode === 'signin' 
                    ? "Don't have an account? " 
                    : "Already have an account? "}
                </ThemedText>
                <TouchableOpacity 
                  onPress={() => {
                    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                    setErrors({});
                    setFormData({
                      email: '',
                      password: '',
                      confirmPassword: '',
                      displayName: '',
                      campus: '',
                    });
                  }}
                  disabled={isLoading || isGoogleLoading}
                >
                  <ThemedText style={[styles.linkText, { color: accentColor }]}>
                    {authMode === 'signin' ? 'Sign Up' : 'Sign In'}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {/* Forgot Password - Only show for sign in */}
              {authMode === 'signin' && (
                <TouchableOpacity 
                  style={styles.forgotPasswordContainer}
                  onPress={() => {
                    // TODO: Implement forgot password functionality
                    Alert.alert('Forgot Password', 'This feature will be implemented soon.');
                  }}
                  disabled={isLoading || isGoogleLoading}
                >
                  <ThemedText style={[styles.forgotPasswordText, { color: accentColor }]}>
                    Forgot your password?
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Guest Access */}
          <TouchableOpacity 
            style={[styles.guestButton, { borderColor }]}
            onPress={handleGuestAccess}
            disabled={isLoading || isGoogleLoading}
          >
            <Ionicons name="person-outline" size={20} color={placeholderColor} />
            <ThemedText style={[styles.guestButtonText, { color: placeholderColor }]}>
              Continue as Guest
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
  },
  form: {
    gap: 16,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  switchText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});