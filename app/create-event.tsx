// CoC-App/app/create-event.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
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
import type { EventData } from '../contexts/EventContext';
import { useEvents } from '../contexts/EventContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { useUserRole } from '../contexts/UserRoleContext';
import { useThemeColor } from '../hooks/useThemeColor';

interface CreateEventForm {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: EventData['category'];
  maxAttendees: string;
  requirements: string;
  contactInfo: string;
}

export default function CreateEventScreen() {
  const { t } = useLanguage();
  const { user } = useUser();
  const { canCreateEvents } = useUserRole();
  const { createEvent } = useEvents();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'tint');
  const placeholderColor = textColor + '60';

  const [formData, setFormData] = useState<CreateEventForm>({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: 'study',
    maxAttendees: '',
    requirements: '',
    contactInfo: user?.email || '',
  });

  const [errors, setErrors] = useState<Partial<CreateEventForm>>({});
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    { key: 'study', label: 'Bible Study', icon: '📖' },
    { key: 'worship', label: 'Worship', icon: '🙏' },
    { key: 'fellowship', label: 'Fellowship', icon: '🤝' },
    { key: 'blending', label: 'Blending', icon: '❤️' },
    { key: 'prayer', label: 'Prayer', icon: '🕊️' },
  ] as const;

  // Redirect if user doesn't have permission
  React.useEffect(() => {
    if (!canCreateEvents) {
      Alert.alert(
        'Permission Denied',
        'You do not have permission to create events. Only core members can create events.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    }
  }, [canCreateEvents, router]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateEventForm> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Event description is required';
    }

    if (!formData.date.trim()) {
      newErrors.date = 'Event date is required';
    } else {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.date)) {
        newErrors.date = 'Please use format: YYYY-MM-DD';
      } else {
        const eventDate = new Date(formData.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (eventDate < today) {
          newErrors.date = 'Event date cannot be in the past';
        }
      }
    }

    if (!formData.time.trim()) {
      newErrors.time = 'Event time is required';
    } else {
      // Validate time format (HH:MM AM/PM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s?(AM|PM|am|pm)$/;
      if (!timeRegex.test(formData.time.trim())) {
        newErrors.time = 'Please use format: HH:MM AM/PM';
      }
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Event location is required';
    }

    if (formData.maxAttendees && isNaN(Number(formData.maxAttendees))) {
      newErrors.maxAttendees = 'Please enter a valid number';
    }

    if (formData.maxAttendees && Number(formData.maxAttendees) < 1) {
      newErrors.maxAttendees = 'Maximum attendees must be at least 1';
    }

    if (!formData.contactInfo.trim()) {
      newErrors.contactInfo = 'Contact information is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const eventData: Omit<EventData, 'id' | 'attendees' | 'waitingList' | 'createdAt' | 'updatedAt'> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: formData.date.trim(),
        time: formData.time.trim(),
        location: formData.location.trim(),
        organizer: user?.name || 'Unknown',
        organizerId: user?.email || 'unknown', // Using email as ID for now
        category: formData.category,
        maxAttendees: formData.maxAttendees ? Number(formData.maxAttendees) : undefined,
        isPublished: true,
        requirements: formData.requirements.trim() || undefined,
        contactInfo: formData.contactInfo.trim(),
      };

      const eventId = await createEvent(eventData);

      Alert.alert(
        'Success',
        'Event created successfully!',
        [
          {
            text: 'View Event',
            onPress: () => {
              router.back();
              // TODO: Navigate to event detail view
            },
          },
          {
            text: 'Create Another',
            onPress: () => {
              // Reset form
              setFormData({
                title: '',
                description: '',
                date: '',
                time: '',
                location: '',
                category: 'study',
                maxAttendees: '',
                requirements: '',
                contactInfo: user?.email || '',
              });
            },
          },
          {
            text: 'Back to Events',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create event. Please try again.');
      console.error('Error creating event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Event',
      'Are you sure you want to discard this event?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  const updateField = (field: keyof CreateEventForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCategorySelect = () => {
    Alert.alert(
      'Select Category',
      'Choose the event category',
      [
        { text: 'Cancel', style: 'cancel' },
        ...categories.map(category => ({
          text: `${category.icon} ${category.label}`,
          onPress: () => updateField('category', category.key),
        })),
      ]
    );
  };

  const getCategoryDisplay = () => {
    const category = categories.find(c => c.key === formData.category);
    return category ? `${category.icon} ${category.label}` : 'Select Category';
  };

  if (!canCreateEvents) {
    return null; // Component will redirect via useEffect
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Header 
        title="Create Event"
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
          {/* Basic Information Section */}
          <View style={[styles.section, { backgroundColor: cardBackground, borderColor }]}>
            <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>
            
            {/* Event Title */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.fieldLabel}>Event Title *</ThemedText>
              <TextInput
                style={[
                  styles.textInput, 
                  { 
                    borderColor: errors.title ? '#e74c3c' : borderColor,
                    color: textColor,
                    backgroundColor: backgroundColor
                  }
                ]}
                value={formData.title}
                onChangeText={(text) => updateField('title', text)}
                placeholder="Enter event title"
                placeholderTextColor={placeholderColor}
                maxLength={100}
              />
              {errors.title && <ThemedText style={styles.errorText}>{errors.title}</ThemedText>}
            </View>

            {/* Event Description */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.fieldLabel}>Description *</ThemedText>
              <TextInput
                style={[
                  styles.textAreaInput, 
                  { 
                    borderColor: errors.description ? '#e74c3c' : borderColor,
                    color: textColor,
                    backgroundColor: backgroundColor
                  }
                ]}
                value={formData.description}
                onChangeText={(text) => updateField('description', text)}
                placeholder="Describe your event"
                placeholderTextColor={placeholderColor}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
              {errors.description && <ThemedText style={styles.errorText}>{errors.description}</ThemedText>}
              <ThemedText style={styles.characterCount}>
                {formData.description.length}/500
              </ThemedText>
            </View>

            {/* Category */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.fieldLabel}>Category *</ThemedText>
              <TouchableOpacity
                style={[
                  styles.pickerButton,
                  { borderColor, backgroundColor }
                ]}
                onPress={handleCategorySelect}
              >
                <ThemedText style={[styles.pickerText, { color: textColor }]}>
                  {getCategoryDisplay()}
                </ThemedText>
                <ThemedText style={styles.chevron}>›</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Schedule Section */}
          <View style={[styles.section, { backgroundColor: cardBackground, borderColor }]}>
            <ThemedText style={styles.sectionTitle}>Schedule</ThemedText>
            
            {/* Date */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.fieldLabel}>Date * (YYYY-MM-DD)</ThemedText>
              <TextInput
                style={[
                  styles.textInput, 
                  { 
                    borderColor: errors.date ? '#e74c3c' : borderColor,
                    color: textColor,
                    backgroundColor: backgroundColor
                  }
                ]}
                value={formData.date}
                onChangeText={(text) => updateField('date', text)}
                placeholder="2025-08-25"
                placeholderTextColor={placeholderColor}
                maxLength={10}
              />
              {errors.date && <ThemedText style={styles.errorText}>{errors.date}</ThemedText>}
            </View>

            {/* Time */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.fieldLabel}>Time * (HH:MM AM/PM)</ThemedText>
              <TextInput
                style={[
                  styles.textInput, 
                  { 
                    borderColor: errors.time ? '#e74c3c' : borderColor,
                    color: textColor,
                    backgroundColor: backgroundColor
                  }
                ]}
                value={formData.time}
                onChangeText={(text) => updateField('time', text)}
                placeholder="7:00 PM"
                placeholderTextColor={placeholderColor}
                maxLength={8}
              />
              {errors.time && <ThemedText style={styles.errorText}>{errors.time}</ThemedText>}
            </View>

            {/* Location */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.fieldLabel}>Location *</ThemedText>
              <TextInput
                style={[
                  styles.textInput, 
                  { 
                    borderColor: errors.location ? '#e74c3c' : borderColor,
                    color: textColor,
                    backgroundColor: backgroundColor
                  }
                ]}
                value={formData.location}
                onChangeText={(text) => updateField('location', text)}
                placeholder="Student Center Room 101"
                placeholderTextColor={placeholderColor}
                maxLength={100}
              />
              {errors.location && <ThemedText style={styles.errorText}>{errors.location}</ThemedText>}
            </View>
          </View>

          {/* Registration Section */}
          <View style={[styles.section, { backgroundColor: cardBackground, borderColor }]}>
            <ThemedText style={styles.sectionTitle}>Registration</ThemedText>
            
            {/* Max Attendees */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.fieldLabel}>Maximum Attendees (Optional)</ThemedText>
              <TextInput
                style={[
                  styles.textInput, 
                  { 
                    borderColor: errors.maxAttendees ? '#e74c3c' : borderColor,
                    color: textColor,
                    backgroundColor: backgroundColor
                  }
                ]}
                value={formData.maxAttendees}
                onChangeText={(text) => updateField('maxAttendees', text)}
                placeholder="Leave empty for unlimited"
                placeholderTextColor={placeholderColor}
                keyboardType="number-pad"
                maxLength={4}
              />
              {errors.maxAttendees && <ThemedText style={styles.errorText}>{errors.maxAttendees}</ThemedText>}
              <ThemedText style={styles.helperText}>
                Leave empty for unlimited registration
              </ThemedText>
            </View>

            {/* Requirements */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.fieldLabel}>Requirements (Optional)</ThemedText>
              <TextInput
                style={[
                  styles.textAreaInput, 
                  { 
                    borderColor,
                    color: textColor,
                    backgroundColor: backgroundColor
                  }
                ]}
                value={formData.requirements}
                onChangeText={(text) => updateField('requirements', text)}
                placeholder="e.g., Please bring your Bible, RSVP by Friday"
                placeholderTextColor={placeholderColor}
                multiline
                numberOfLines={3}
                maxLength={200}
                textAlignVertical="top"
              />
              <ThemedText style={styles.characterCount}>
                {formData.requirements.length}/200
              </ThemedText>
            </View>

            {/* Contact Info */}
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.fieldLabel}>Contact Information *</ThemedText>
              <TextInput
                style={[
                  styles.textInput, 
                  { 
                    borderColor: errors.contactInfo ? '#e74c3c' : borderColor,
                    color: textColor,
                    backgroundColor: backgroundColor
                  }
                ]}
                value={formData.contactInfo}
                onChangeText={(text) => updateField('contactInfo', text)}
                placeholder="Email or phone number"
                placeholderTextColor={placeholderColor}
                maxLength={100}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.contactInfo && <ThemedText style={styles.errorText}>{errors.contactInfo}</ThemedText>}
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
                styles.createButton,
                { backgroundColor: accentColor, opacity: isLoading ? 0.6 : 1 }
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <ThemedText style={styles.createButtonText}>
                {isLoading ? 'Creating...' : 'Create Event'}
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
  section: {
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
  helperText: {
    fontSize: 12,
    opacity: 0.6,
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
  createButton: {
    // backgroundColor set dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});