// app/profile-edit.tsx
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import ThemedProfileIcon from '../components/ThemedProfileIcon';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext'; // 添加UserContext导入
import { useThemeColor } from '../hooks/useThemeColor';

interface EditableUserProfile {
  name: string;
  email: string;
  campus: string;
  year: string;
  bio?: string;
  phone?: string;
}

export default function ProfileEditScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useUser(); // 使用UserContext
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = textColor + '60'; // Add transparency

  // Form state - Initialize with current user data from context
  const [formData, setFormData] = useState<EditableUserProfile>({
    name: user.name,
    email: user.email,
    campus: user.campus,
    year: user.year,
    bio: user.bio || '',
    phone: user.phone || '',
  });

  const [errors, setErrors] = useState<Partial<EditableUserProfile>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Update form data when user context changes
  useEffect(() => {
    setFormData({
      name: user.name,
      email: user.email,
      campus: user.campus,
      year: user.year,
      bio: user.bio || '',
      phone: user.phone || '',
    });
  }, [user]);

  // Year options
  const yearOptions = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'Other'];

  const validateForm = (): boolean => {
    const newErrors: Partial<EditableUserProfile> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.campus.trim()) {
      newErrors.campus = 'Campus is required';
    }

    if (!formData.year) {
      newErrors.year = 'Year is required';
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Update the user context with new data
      updateUser(formData);
      
      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() }
      ]
    );
  };

  const handleYearSelect = () => {
    Alert.alert(
      'Select Year',
      'Choose your current academic year',
      [
        { text: 'Cancel', style: 'cancel' },
        ...yearOptions.map(year => ({
          text: year,
          onPress: () => setFormData(prev => ({ ...prev, year }))
        }))
      ]
    );
  };

  const updateField = (field: keyof EditableUserProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <Header 
        title="Edit Profile"
        showBackButton={true}
        showProfile={false}
        onBackPress={handleCancel}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.contentContainer, 
            { paddingBottom: insets.bottom + 20 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Image Section */}
          <View style={[styles.imageSection, { backgroundColor: cardBackground, borderColor }]}>
            <ThemedProfileIcon size={100} />
            <TouchableOpacity style={styles.changePhotoButton}>
              <ThemedText style={styles.changePhotoText}>Change Photo</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={[styles.formSection, { backgroundColor: cardBackground, borderColor }]}>
            <ThemedText style={styles.sectionTitle}>Personal Information</ThemedText>
            
            {/* Name Field */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.fieldLabel}>Full Name *</ThemedText>
              <TextInput
                style={[
                  styles.textInput, 
                  { 
                    borderColor: errors.name ? '#e74c3c' : borderColor,
                    color: textColor,
                    backgroundColor: backgroundColor
                  }
                ]}
                value={formData.name}
                onChangeText={(text) => updateField('name', text)}
                placeholder="Enter your full name"
                placeholderTextColor={placeholderColor}
                maxLength={50}
              />
              {errors.name && <ThemedText style={styles.errorText}>{errors.name}</ThemedText>}
            </View>

            {/* Email Field */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.fieldLabel}>Email *</ThemedText>
              <TextInput
                style={[
                  styles.textInput, 
                  { 
                    borderColor: errors.email ? '#e74c3c' : borderColor,
                    color: textColor,
                    backgroundColor: backgroundColor
                  }
                ]}
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                placeholder="Enter your email"
                placeholderTextColor={placeholderColor}
                keyboardType="email-address"
                autoCapitalize="none"
                maxLength={100}
              />
              {errors.email && <ThemedText style={styles.errorText}>{errors.email}</ThemedText>}
            </View>

            {/* Campus Field */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.fieldLabel}>Campus *</ThemedText>
              <TextInput
                style={[
                  styles.textInput, 
                  { 
                    borderColor: errors.campus ? '#e74c3c' : borderColor,
                    color: textColor,
                    backgroundColor: backgroundColor
                  }
                ]}
                value={formData.campus}
                onChangeText={(text) => updateField('campus', text)}
                placeholder="Enter your campus/university"
                placeholderTextColor={placeholderColor}
                maxLength={100}
              />
              {errors.campus && <ThemedText style={styles.errorText}>{errors.campus}</ThemedText>}
            </View>

            {/* Year Field - Picker */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.fieldLabel}>Academic Year *</ThemedText>
              <TouchableOpacity
                style={[
                  styles.pickerButton,
                  { 
                    borderColor: errors.year ? '#e74c3c' : borderColor,
                    backgroundColor: backgroundColor
                  }
                ]}
                onPress={handleYearSelect}
              >
                <ThemedText style={[
                  styles.pickerText,
                  { color: formData.year ? textColor : placeholderColor }
                ]}>
                  {formData.year || 'Select your academic year'}
                </ThemedText>
                <ThemedText style={styles.chevron}>›</ThemedText>
              </TouchableOpacity>
              {errors.year && <ThemedText style={styles.errorText}>{errors.year}</ThemedText>}
            </View>

            {/* Phone Field */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.fieldLabel}>Phone Number</ThemedText>
              <TextInput
                style={[
                  styles.textInput, 
                  { 
                    borderColor: errors.phone ? '#e74c3c' : borderColor,
                    color: textColor,
                    backgroundColor: backgroundColor
                  }
                ]}
                value={formData.phone}
                onChangeText={(text) => updateField('phone', text)}
                placeholder="Enter your phone number (optional)"
                placeholderTextColor={placeholderColor}
                keyboardType="phone-pad"
                maxLength={20}
              />
              {errors.phone && <ThemedText style={styles.errorText}>{errors.phone}</ThemedText>}
            </View>

            {/* Bio Field */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.fieldLabel}>Bio</ThemedText>
              <TextInput
                style={[
                  styles.textAreaInput, 
                  { 
                    borderColor: borderColor,
                    color: textColor,
                    backgroundColor: backgroundColor
                  }
                ]}
                value={formData.bio}
                onChangeText={(text) => updateField('bio', text)}
                placeholder="Tell us a little about yourself (optional)"
                placeholderTextColor={placeholderColor}
                multiline
                numberOfLines={4}
                maxLength={200}
                textAlignVertical="top"
              />
              <ThemedText style={styles.characterCount}>
                {formData.bio?.length || 0}/200
              </ThemedText>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor }]}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <ThemedText style={[styles.buttonText, { color: textColor }]}>
                Cancel
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button, 
                styles.saveButton,
                { opacity: isLoading ? 0.6 : 1 }
              ]}
              onPress={handleSave}
              disabled={isLoading}
            >
              <ThemedText style={styles.saveButtonText}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  imageSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 30,
    marginBottom: 20,
    alignItems: 'center',
  },
  changePhotoButton: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changePhotoText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#45b7d1',
  },
  formSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
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
  textAreaInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  pickerButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  pickerText: {
    fontSize: 16,
  },
  chevron: {
    fontSize: 18,
    opacity: 0.5,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'right',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  saveButton: {
    backgroundColor: '#45b7d1',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});