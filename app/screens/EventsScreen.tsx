// CoC-App/app/screens/EventsScreen.tsx - 更新使用Firebase
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import type { FirebaseEventData } from '../../contexts/FirebaseEventContext';
import { useFirebaseEvents } from '../../contexts/FirebaseEventContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useUser } from '../../contexts/UserContext';
import { useUserRole } from '../../contexts/UserRoleContext';
import { useThemeColor } from '../../hooks/useThemeColor';

export default function EventsScreen() {
  const { t } = useLanguage();
  const { user } = useUser();
  const { canCreateEvents } = useUserRole();
  const {
    filteredEvents,
    filter,
    loading,
    error,
    rsvpEvent,
    cancelRsvp,
    setFilter,
    getUserRsvpStatus,
    todayUsage,
  } = useFirebaseEvents();
  
  const [selectedEvent, setSelectedEvent] = useState<FirebaseEventData | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');

  const categories = [
    { key: 'all', label: t('events.all'), icon: '📅' },
    { key: 'worship', label: t('events.worship'), icon: '🙏' },
    { key: 'study', label: t('events.study'), icon: '📖' },
    { key: 'fellowship', label: t('events.fellowship'), icon: '🤝' },
    { key: 'blending', label: t('events.blending'), icon: '❤️' },
    { key: 'prayer', label: t('events.prayer'), icon: '🕊️' },
  ];

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Firebase实时监听会自动更新，这里只是UI反馈
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'worship': return '#9b59b6';
      case 'study': return '#3498db';
      case 'fellowship': return '#e67e22';
      case 'blending': return '#e74c3c';
      case 'prayer': return '#1abc9c';
      default: return '#95a5a6';
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.key === category);
    return cat?.icon || '📅';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isEventToday = (dateString: string) => {
    const today = new Date();
    const eventDate = new Date(dateString);
    return today.toDateString() === eventDate.toDateString();
  };

  const getUserId = () => {
    return user?.email || 'anonymous';
  };

  const getUserName = () => {
    return user?.name || 'Anonymous User';
  };

  const handleRSVP = async (event: FirebaseEventData) => {
    const userId = getUserId();
    const userName = getUserName();
    const currentStatus = getUserRsvpStatus(event.id, userId);
    
    try {
      if (currentStatus === 'not_registered') {
        const result = await rsvpEvent(event.id, userId, userName);
        
        if (result === 'waiting_list') {
          const position = event.waitingList.indexOf(userId) + 1;
          Alert.alert(
            '🎫 Added to Queue',
            `The event is full, but you're #${position} in the queue. You'll be automatically registered if someone cancels!`,
            [{ text: 'Got it!' }]
          );
        } else {
          Alert.alert(
            '✅ Registration Confirmed',
            `You're registered for "${event.title}"!`,
            [{ text: 'Great!' }]
          );
        }
      } else {
        // Show confirmation for cancellation
        const confirmMessage = currentStatus === 'registered' 
          ? `Cancel your registration for "${event.title}"?`
          : `Remove yourself from the queue for "${event.title}"?`;
          
        Alert.alert(
          'Confirm Cancellation',
          confirmMessage,
          [
            { text: 'Keep Registration', style: 'cancel' },
            { 
              text: 'Yes, Cancel', 
              style: 'destructive',
              onPress: async () => {
                await cancelRsvp(event.id, userId);
                
                if (currentStatus === 'registered') {
                  Alert.alert(
                    '❌ Registration Cancelled',
                    `You've cancelled your registration for "${event.title}". If there's a queue, someone will be automatically registered.`
                  );
                } else {
                  Alert.alert(
                    '🚫 Removed from Queue',
                    `You've been removed from the queue for "${event.title}".`
                  );
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update registration. Please try again.');
      console.error('RSVP Error:', error);
    }
  };

  const handleEventPress = (event: FirebaseEventData) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleCreateEvent = () => {
    if (!canCreateEvents) {
      Alert.alert(
        'Permission Required', 
        'Only core members can create events. Please contact an administrator if you need to create events.'
      );
      return;
    }
    router.push('/create-event');
  };

  const getAttendeeCountText = (event: FirebaseEventData) => {
    const totalRegistered = event.attendeeCount || 0;
    const waitingListCount = event.waitingListCount || 0;
    
    if (event.maxAttendees) {
      let text = `👥 ${totalRegistered}/${event.maxAttendees} attending`;
      if (waitingListCount > 0) {
        text += ` • ${waitingListCount} waiting`;
      }
      return text;
    } else {
      let text = `👥 ${totalRegistered} attending`;
      if (waitingListCount > 0) {
        text += ` • ${waitingListCount} waiting`;
      }
      return text;
    }
  };

  const getRSVPButtonText = (event: FirebaseEventData) => {
    const userId = getUserId();
    const status = getUserRsvpStatus(event.id, userId);
    
    switch (status) {
      case 'registered':
        return '✅ Registered';
      case 'waiting_list':
        const position = event.waitingList.indexOf(userId) + 1;
        return `🎫 #${position} in Queue`;
      case 'not_registered':
      default:
        if (event.maxAttendees && event.attendeeCount >= event.maxAttendees) {
          return '🎫 Join Queue';
        }
        return '📝 Register';
    }
  };

  const getRSVPButtonColor = (event: FirebaseEventData) => {
    const userId = getUserId();
    const status = getUserRsvpStatus(event.id, userId);
    
    switch (status) {
      case 'registered':
        return '#27ae60'; // Green - registered
      case 'waiting_list':
        return '#f39c12'; // Orange - waiting
      case 'not_registered':
      default:
        if (event.maxAttendees && event.attendeeCount >= event.maxAttendees) {
          return '#3498db'; // Blue - join queue
        }
        return '#45b7d1'; // Default blue - register
    }
  };

  const renderEvent = ({ item }: { item: FirebaseEventData }) => {
    const userId = getUserId();
    const userStatus = getUserRsvpStatus(item.id, userId);
    const isEventFull = item.maxAttendees && item.attendeeCount >= item.maxAttendees;
    
    return (
      <TouchableOpacity
        style={[styles.eventCard, { backgroundColor: cardBackground, borderColor }]}
        onPress={() => handleEventPress(item)}
      >
        <View style={styles.eventHeader}>
          <View style={styles.eventCategory}>
            <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(item.category) }]} />
            <ThemedText style={styles.categoryText}>
              {getCategoryIcon(item.category)} {categories.find(c => c.key === item.category)?.label}
            </ThemedText>
          </View>
          
          {/* 状态标签组 */}
          <View style={styles.statusBadges}>
            {isEventToday(item.date) && (
              <View style={styles.todayBadge}>
                <ThemedText style={styles.todayText}>TODAY</ThemedText>
              </View>
            )}
            
            {isEventFull && (
              <View style={styles.fullBadge}>
                <ThemedText style={styles.fullText}>FULL</ThemedText>
              </View>
            )}
            
            {userStatus === 'registered' && (
              <View style={styles.registeredBadge}>
                <ThemedText style={styles.registeredText}>✓ REGISTERED</ThemedText>
              </View>
            )}
            
            {userStatus === 'waiting_list' && (
              <View style={styles.waitingBadge}>
                <ThemedText style={styles.waitingText}>
                  #{item.waitingList.indexOf(userId) + 1} IN QUEUE
                </ThemedText>
              </View>
            )}
          </View>
        </View>
  
        <ThemedText style={styles.eventTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.eventDescription} numberOfLines={2}>
          {item.description}
        </ThemedText>
  
        <View style={styles.eventDetails}>
          <View style={styles.eventMeta}>
            <ThemedText style={styles.eventDate}>📅 {formatDate(item.date)}</ThemedText>
            <ThemedText style={styles.eventTime}>🕐 {item.time}</ThemedText>
            <ThemedText style={styles.eventLocation}>📍 {item.location}</ThemedText>
            <ThemedText style={styles.eventOrganizer}>👤 {item.organizer}</ThemedText>
          </View>
        </View>
  
        <View style={styles.eventFooter}>
          <View style={styles.attendeeInfo}>
            <ThemedText style={styles.attendeeCount}>
              {getAttendeeCountText(item)}
            </ThemedText>
            
            {/* 候补列表提示 */}
            {item.waitingListCount > 0 && userStatus !== 'waiting_list' && (
              <ThemedText style={styles.queueHint}>
                Queue: {item.waitingListCount} people waiting
              </ThemedText>
            )}
          </View>
          
          <TouchableOpacity
            style={[
              styles.rsvpButton,
              { backgroundColor: getRSVPButtonColor(item) }
            ]}
            onPress={() => handleRSVP(item)}
          >
            <ThemedText style={styles.rsvpButtonText}>
              {getRSVPButtonText(item)}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategoryFilter = () => (
    <ThemedView style={[styles.categoryContainer, { backgroundColor: cardBackground }]}>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryButton,
              {
                backgroundColor: filter.category === item.key ? '#45b7d1' : backgroundColor,
                borderColor,
              }
            ]}
            onPress={() => setFilter({ ...filter, category: item.key })}
          >
            <ThemedText style={[
              styles.categoryButtonText,
              { color: filter.category === item.key ? 'white' : textColor }
            ]}>
              {item.icon} {item.label}
            </ThemedText>
          </TouchableOpacity>
        )}
      />
    </ThemedView>
  );

  const renderEventModal = () => (
    <Modal
      visible={showEventModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowEventModal(false)}
    >
      {selectedEvent && (
        <ThemedView style={[styles.modalContainer, { backgroundColor }]}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>{t('events.eventDetails')}</ThemedText>
            <TouchableOpacity 
              onPress={() => setShowEventModal(false)}
              style={styles.closeButton}
            >
              <ThemedText style={styles.closeButtonText}>×</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.modalEventHeader}>
              <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(selectedEvent.category) }]} />
              <ThemedText style={styles.modalCategory}>
                {getCategoryIcon(selectedEvent.category)} {categories.find(c => c.key === selectedEvent.category)?.label}
              </ThemedText>
            </View>

            <ThemedText style={styles.modalEventTitle}>{selectedEvent.title}</ThemedText>
            <ThemedText style={styles.modalEventDescription}>{selectedEvent.description}</ThemedText>

            <View style={styles.modalEventDetails}>
              <View style={styles.modalDetailRow}>
                <ThemedText style={styles.modalDetailLabel}>{t('events.date')}</ThemedText>
                <ThemedText style={styles.modalDetailValue}>{formatDate(selectedEvent.date)}</ThemedText>
              </View>
              <View style={styles.modalDetailRow}>
                <ThemedText style={styles.modalDetailLabel}>{t('events.time')}</ThemedText>
                <ThemedText style={styles.modalDetailValue}>{selectedEvent.time}</ThemedText>
              </View>
              <View style={styles.modalDetailRow}>
                <ThemedText style={styles.modalDetailLabel}>{t('events.location')}</ThemedText>
                <ThemedText style={styles.modalDetailValue}>{selectedEvent.location}</ThemedText>
              </View>
              <View style={styles.modalDetailRow}>
                <ThemedText style={styles.modalDetailLabel}>{t('events.organizer')}</ThemedText>
                <ThemedText style={styles.modalDetailValue}>{selectedEvent.organizer}</ThemedText>
              </View>
              <View style={styles.modalDetailRow}>
                <ThemedText style={styles.modalDetailLabel}>{t('events.attendees')}</ThemedText>
                <ThemedText style={styles.modalDetailValue}>
                  {getAttendeeCountText(selectedEvent)}
                </ThemedText>
              </View>
              {selectedEvent.requirements && (
                <View style={styles.modalDetailRow}>
                  <ThemedText style={styles.modalDetailLabel}>Requirements:</ThemedText>
                  <ThemedText style={styles.modalDetailValue}>{selectedEvent.requirements}</ThemedText>
                </View>
              )}
              <View style={styles.modalDetailRow}>
                <ThemedText style={styles.modalDetailLabel}>Contact:</ThemedText>
                <ThemedText style={styles.modalDetailValue}>{selectedEvent.contactInfo}</ThemedText>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalRSVPButton,
                  { backgroundColor: getRSVPButtonColor(selectedEvent) }
                ]}
                onPress={() => {
                  handleRSVP(selectedEvent);
                  setShowEventModal(false);
                }}
              >
                <ThemedText style={styles.modalRSVPButtonText}>
                  {getRSVPButtonText(selectedEvent)}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalShareButton, { borderColor }]}
                onPress={() => Alert.alert(t('events.shareEvent'), t('events.shareFeature'))}
              >
                <ThemedText style={styles.modalShareButtonText}>{t('events.shareEvent')}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ThemedView>
      )}
    </Modal>
  );

  // Show loading state
  if (loading && filteredEvents.length === 0) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <Header showBackButton={true} title={t('events.title')} />
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>🔥 Loading events from Firebase...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  // Show error state
  if (error) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <Header showBackButton={true} title={t('events.title')} />
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>❌ Error loading events</ThemedText>
          <ThemedText style={styles.errorSubtext}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <Header showBackButton={true} title={t('events.title')} />

      {/* Firebase Usage Indicator (Development) */}
      {__DEV__ && (
        <ThemedView style={[styles.usageIndicator, { backgroundColor: cardBackground, borderColor }]}>
          <ThemedText style={styles.usageText}>
            🔥 Today's usage: {todayUsage.reads} reads, {todayUsage.writes} writes
          </ThemedText>
        </ThemedView>
      )}

      {/* Add Event Button - Only show for core members */}
      {canCreateEvents && (
        <ThemedView style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.addEventButton}
            onPress={handleCreateEvent}
          >
            <ThemedText style={styles.addEventButtonText}>{t('events.add')}</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}

      {/* Category Filter */}
      {renderCategoryFilter()}

      {/* Events List */}
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        style={styles.eventsList}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>{t('events.noEvents')}</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              {loading ? 'Loading from Firebase...' : t('events.adjustFilters')}
            </ThemedText>
            {canCreateEvents && !loading && (
              <TouchableOpacity 
                style={[styles.createFirstEventButton, { borderColor }]}
                onPress={handleCreateEvent}
              >
                <ThemedText style={[styles.createFirstEventText, { color: textColor }]}>
                  Create First Event
                </ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>
        }
      />

      {/* Event Detail Modal */}
      {renderEventModal()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#45b7d1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  usageIndicator: {
    marginHorizontal: 20,
    marginVertical: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  usageText: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  headerActions: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'flex-end',
  },
  addEventButton: {
    backgroundColor: '#45b7d1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addEventButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  categoryContainer: {
    paddingVertical: 10,
    paddingLeft: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  eventsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  eventCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    opacity: 0.7,
    fontWeight: '500',
  },
  statusBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  todayBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  fullBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fullText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  registeredBadge: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  registeredText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  waitingBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  waitingText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
    marginBottom: 12,
  },
  eventDetails: {
    marginBottom: 12,
  },
  eventMeta: {
    gap: 4,
  },
  eventDate: {
    fontSize: 13,
    opacity: 0.7,
  },
  eventTime: {
    fontSize: 13,
    opacity: 0.7,
  },
  eventLocation: {
    fontSize: 13,
    opacity: 0.7,
  },
  eventOrganizer: {
    fontSize: 13,
    opacity: 0.7,
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
    fontSize: 12,
    opacity: 0.6,
  },
  queueHint: {
    fontSize: 11,
    opacity: 0.6,
    fontStyle: 'italic',
    marginTop: 2,
  },
  rsvpButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  rsvpButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    opacity: 0.6,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.4,
    marginBottom: 20,
  },
  createFirstEventButton: {
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstEventText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    opacity: 0.6,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalCategory: {
    fontSize: 14,
    opacity: 0.7,
    fontWeight: '500',
  },
  modalEventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalEventDescription: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
    marginBottom: 24,
  },
  modalEventDetails: {
    marginBottom: 32,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalDetailLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  modalDetailValue: {
    fontSize: 16,
    opacity: 0.7,
    flex: 2,
    textAlign: 'right',
  },
  modalActions: {
    gap: 12,
  },
  modalRSVPButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalRSVPButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalShareButton: {
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalShareButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});