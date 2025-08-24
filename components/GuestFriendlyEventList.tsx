// CoC-App/components/GuestFriendlyEventList.tsx - 支持访客浏览的事件列表
import { useRouter } from 'expo-router';
import {
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFirebaseEvents } from '../contexts/FirebaseEventContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useOpenAccessAuth } from '../contexts/OpenAccessAuthContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

export default function GuestFriendlyEventList() {
  const { t } = useLanguage();
  const { events, rsvpEvent, cancelRsvp, getUserRsvpStatus } = useFirebaseEvents();
  const { isGuest, currentUser, userProfile, canRegisterForEvents } = useOpenAccessAuth();
  const router = useRouter();

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'tint');
  const mutedColor = textColor + '60';

  const handleEventPress = (event: any) => {
    // 访客和登录用户都可以查看事件详情
    Alert.alert(
      event.title,
      `📅 ${event.date} at ${event.time}\n📍 ${event.location}\n👤 ${event.organizer}\n\n${event.description}${
        event.requirements ? `\n\n⚠️ Requirements: ${event.requirements}` : ''
      }`,
      [
        { text: 'Close', style: 'cancel' },
        ...(canRegisterForEvents ? [{
          text: getUserRsvpStatus(event.id, currentUser?.uid || '') === 'registered' ? 'Cancel Registration' : 'Register',
          onPress: () => handleRsvpToggle(event)
        }] : []),
        ...(isGuest ? [{
          text: 'Sign Up to Register',
          onPress: () => router.push('/login')
        }] : [])
      ]
    );
  };

  const handleRsvpToggle = async (event: any) => {
    if (!currentUser || !userProfile) {
      Alert.alert('Sign In Required', 'Please sign in to register for events.');
      return;
    }

    try {
      const currentStatus = getUserRsvpStatus(event.id, currentUser.uid);
      
      if (currentStatus === 'registered') {
        // 取消注册
        await cancelRsvp(event.id, currentUser.uid);
        Alert.alert('Registration Cancelled', 'You have been removed from this event.');
      } else {
        // 注册事件
        const result = await rsvpEvent(event.id, currentUser.uid, userProfile.displayName);
        
        if (result === 'registered') {
          Alert.alert('Registration Confirmed! 🎉', 'You have successfully registered for this event.');
        } else if (result === 'waiting_list') {
          Alert.alert('Added to Waiting List', 'This event is full, but you have been added to the waiting list.');
        }
      }
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Failed to register for event');
    }
  };

  const getEventCategoryInfo = (category: string) => {
    const categories = {
      worship: { emoji: '🙏', name: 'Worship', color: '#FF6B6B' },
      study: { emoji: '📖', name: 'Bible Study', color: '#4ECDC4' },
      fellowship: { emoji: '🤝', name: 'Fellowship', color: '#45B7D1' },
      blending: { emoji: '❤️', name: 'Blending', color: '#FFA726' },
      prayer: { emoji: '🕊️', name: 'Prayer', color: '#AB47BC' },
    };
    return categories[category as keyof typeof categories] || { emoji: '📅', name: 'Event', color: accentColor };
  };

  const renderEventCard = ({ item: event }: { item: any }) => {
    const categoryInfo = getEventCategoryInfo(event.category);
    const userRsvpStatus = currentUser ? getUserRsvpStatus(event.id, currentUser.uid) : 'not_registered';
    const isRegistered = userRsvpStatus === 'registered';
    const isWaitingList = userRsvpStatus === 'waiting_list';

    return (
      <TouchableOpacity
        style={[styles.eventCard, { backgroundColor: cardBackground, borderColor }]}
        onPress={() => handleEventPress(event)}
      >
        {/* Event Header */}
        <View style={styles.eventHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + '20' }]}>
            <ThemedText style={styles.categoryEmoji}>{categoryInfo.emoji}</ThemedText>
            <ThemedText style={[styles.categoryText, { color: categoryInfo.color }]}>
              {categoryInfo.name}
            </ThemedText>
          </View>
          
          {isRegistered && (
            <View style={[styles.statusBadge, { backgroundColor: '#34C759' }]}>
              <ThemedText style={styles.statusText}>✓ Registered</ThemedText>
            </View>
          )}
          
          {isWaitingList && (
            <View style={[styles.statusBadge, { backgroundColor: '#FF9500' }]}>
              <ThemedText style={styles.statusText}>⏳ Waiting List</ThemedText>
            </View>
          )}
        </View>

        {/* Event Content */}
        <View style={styles.eventContent}>
          <ThemedText style={styles.eventTitle}>{event.title}</ThemedText>
          
          <View style={styles.eventMeta}>
            <View style={styles.metaRow}>
              <ThemedText style={styles.metaIcon}>📅</ThemedText>
              <ThemedText style={styles.metaText}>
                {new Date(event.date).toLocaleDateString()} at {event.time}
              </ThemedText>
            </View>
            
            <View style={styles.metaRow}>
              <ThemedText style={styles.metaIcon}>📍</ThemedText>
              <ThemedText style={styles.metaText}>{event.location}</ThemedText>
            </View>
            
            <View style={styles.metaRow}>
              <ThemedText style={styles.metaIcon}>👤</ThemedText>
              <ThemedText style={styles.metaText}>Organized by {event.organizer}</ThemedText>
            </View>
          </View>

          {event.description && (
            <ThemedText style={styles.eventDescription} numberOfLines={2}>
              {event.description}
            </ThemedText>
          )}
        </View>

        {/* Event Footer */}
        <View style={styles.eventFooter}>
          <View style={styles.attendeeInfo}>
            <ThemedText style={styles.attendeeCount}>
              👥 {event.attendeeCount}/{event.maxAttendees || '∞'} registered
            </ThemedText>
            {event.waitingListCount > 0 && (
              <ThemedText style={[styles.waitingCount, { color: mutedColor }]}>
                +{event.waitingListCount} waiting
              </ThemedText>
            )}
          </View>

          {/* Action Button */}
          {isGuest ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: accentColor }]}
              onPress={() => router.push('/login')}
            >
              <ThemedText style={styles.actionButtonText}>Sign Up to Register</ThemedText>
            </TouchableOpacity>
          ) : canRegisterForEvents ? (
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: isRegistered ? '#FF3B30' : accentColor,
                  opacity: event.attendeeCount >= event.maxAttendees && !isRegistered ? 0.6 : 1
                }
              ]}
              onPress={() => handleRsvpToggle(event)}
              disabled={event.attendeeCount >= event.maxAttendees && !isRegistered}
            >
              <ThemedText style={styles.actionButtonText}>
                {isRegistered 
                  ? 'Cancel Registration' 
                  : event.attendeeCount >= event.maxAttendees 
                    ? 'Join Waiting List' 
                    : 'Register'
                }
              </ThemedText>
            </TouchableOpacity>
          ) : (
            <ThemedText style={[styles.guestNote, { color: mutedColor }]}>
              Sign in to register for events
            </ThemedText>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <ThemedText style={styles.emptyStateEmoji}>📅</ThemedText>
      <ThemedText style={styles.emptyStateTitle}>No Events Yet</ThemedText>
      <ThemedText style={styles.emptyStateMessage}>
        Check back soon for upcoming Christian fellowship events and activities!
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header Info for Guests */}
      {isGuest && (
        <View style={[styles.guestHeader, { backgroundColor: cardBackground, borderColor }]}>
          <ThemedText style={styles.guestHeaderTitle}>👋 Welcome, Guest!</ThemedText>
          <ThemedText style={styles.guestHeaderMessage}>
            You can browse events below. Sign up to register for events and connect with the community.
          </ThemedText>
          <TouchableOpacity
            style={[styles.signUpPrompt, { backgroundColor: accentColor }]}
            onPress={() => router.push('/login')}
          >
            <ThemedText style={styles.signUpPromptText}>Create Account</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={events}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  guestHeader: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  guestHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  guestHeaderMessage: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
    marginBottom: 12,
  },
  signUpPrompt: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  signUpPromptText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  eventCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  eventContent: {
    marginBottom: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  eventMeta: {
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
  },
  metaText: {
    fontSize: 14,
    opacity: 0.7,
    flex: 1,
  },
  eventDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
    marginTop: 8,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeCount: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  waitingCount: {
    fontSize: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  guestNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 20,
    maxWidth: 250,
  },
});