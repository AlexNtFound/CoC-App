import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useThemeColor } from '../../hooks/useThemeColor';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  category: 'worship' | 'study' | 'fellowship' | 'outreach' | 'prayer';
  attendeeCount: number;
  maxAttendees?: number;
  isRSVPed: boolean;
  imageUrl?: string;
}

interface EventFilter {
  category: string;
  timeRange: 'all' | 'today' | 'week' | 'month';
}

export default function EventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<EventFilter>({ category: 'all', timeRange: 'all' });

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');

  const categories = [
    { key: 'all', label: 'All', icon: '📅' },
    { key: 'worship', label: 'Worship', icon: '🙏' },
    { key: 'study', label: 'Study', icon: '📖' },
    { key: 'fellowship', label: 'Fellowship', icon: '🤝' },
    { key: 'outreach', label: 'Outreach', icon: '❤️' },
    { key: 'prayer', label: 'Prayer', icon: '🕊️' },
  ];

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, filter, searchQuery]);

  const loadEvents = () => {
    // Mock events data - replace with API call
    const mockEvents: Event[] = [
      {
        id: '1',
        title: 'Weekly Bible Study',
        description: 'Join us for an in-depth study of the book of Romans. We\'ll explore themes of grace, faith, and righteousness. Perfect for both new believers and mature Christians.',
        date: '2025-08-22',
        time: '7:00 PM',
        location: 'Student Center Room 101',
        organizer: 'Pastor John',
        category: 'study',
        attendeeCount: 15,
        maxAttendees: 25,
        isRSVPed: true,
      },
      {
        id: '2',
        title: 'Fellowship Dinner',
        description: 'Come hungry! We\'re hosting a potluck dinner where everyone brings a dish to share. Great opportunity to meet new people and strengthen friendships.',
        date: '2025-08-23',
        time: '6:30 PM',
        location: 'Student Center Room 205',
        organizer: 'Events Team',
        category: 'fellowship',
        attendeeCount: 28,
        maxAttendees: 40,
        isRSVPed: false,
      },
      {
        id: '3',
        title: 'Worship Night',
        description: 'An evening of praise and worship with live music, testimonies, and prayer. Come as you are and experience God\'s presence with us.',
        date: '2025-08-25',
        time: '8:00 PM',
        location: 'Chapel',
        organizer: 'Worship Team',
        category: 'worship',
        attendeeCount: 45,
        maxAttendees: 80,
        isRSVPed: true,
      },
      {
        id: '4',
        title: 'Community Outreach',
        description: 'Join us as we serve the local community by volunteering at the food bank. Help pack meals and distribute groceries to families in need.',
        date: '2025-08-27',
        time: '9:00 AM',
        location: 'Downtown Food Bank',
        organizer: 'Outreach Ministry',
        category: 'outreach',
        attendeeCount: 12,
        maxAttendees: 20,
        isRSVPed: false,
      },
      {
        id: '5',
        title: 'Prayer Meeting',
        description: 'Come together for a time of corporate prayer. We\'ll pray for our campus, our nation, and personal requests. All are welcome.',
        date: '2025-08-29',
        time: '7:30 PM',
        location: 'Student Center Room 103',
        organizer: 'Prayer Ministry',
        category: 'prayer',
        attendeeCount: 8,
        isRSVPed: false,
      },
      {
        id: '6',
        title: 'Campus Revival Night',
        description: 'Special guest speaker Dr. Sarah Johnson will be sharing about spiritual awakening on college campuses. Don\'t miss this powerful evening!',
        date: '2025-09-01',
        time: '7:00 PM',
        location: 'Main Auditorium',
        organizer: 'Leadership Team',
        category: 'worship',
        attendeeCount: 65,
        maxAttendees: 200,
        isRSVPed: false,
      },
    ];

    setEvents(mockEvents);
  };

  const filterEvents = () => {
    let filtered = [...events];

    // Filter by category
    if (filter.category !== 'all') {
      filtered = filtered.filter(event => event.category === filter.category);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query)
      );
    }

    // Filter by time range
    const today = new Date();
    if (filter.timeRange !== 'all') {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date);
        const timeDiff = eventDate.getTime() - today.getTime();
        const daysDiff = timeDiff / (1000 * 3600 * 24);

        switch (filter.timeRange) {
          case 'today':
            return daysDiff >= 0 && daysDiff < 1;
          case 'week':
            return daysDiff >= 0 && daysDiff <= 7;
          case 'month':
            return daysDiff >= 0 && daysDiff <= 30;
          default:
            return true;
        }
      });
    }

    // Sort by date
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setFilteredEvents(filtered);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      loadEvents();
      setRefreshing(false);
    }, 1000);
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'worship': return '#9b59b6';
      case 'study': return '#3498db';
      case 'fellowship': return '#e67e22';
      case 'outreach': return '#e74c3c';
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

  const isEventSoon = (dateString: string) => {
    const today = new Date();
    const eventDate = new Date(dateString);
    const timeDiff = eventDate.getTime() - today.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    return daysDiff >= 0 && daysDiff <= 3;
  };

  const handleRSVP = (event: Event) => {
    const updatedEvents = events.map(e => 
      e.id === event.id 
        ? { 
            ...e, 
            isRSVPed: !e.isRSVPed,
            attendeeCount: e.isRSVPed ? e.attendeeCount - 1 : e.attendeeCount + 1
          }
        : e
    );
    setEvents(updatedEvents);

    Alert.alert(
      event.isRSVPed ? 'RSVP Cancelled' : 'RSVP Confirmed',
      event.isRSVPed 
        ? `You have cancelled your RSVP for "${event.title}"`
        : `You have successfully RSVP'd for "${event.title}"`
    );
  };

  const handleEventPress = (event: Event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const renderEvent = ({ item }: { item: Event }) => (
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
        {isEventToday(item.date) && (
          <View style={styles.todayBadge}>
            <ThemedText style={styles.todayText}>TODAY</ThemedText>
          </View>
        )}
        {isEventSoon(item.date) && !isEventToday(item.date) && (
          <View style={styles.soonBadge}>
            <ThemedText style={styles.soonText}>SOON</ThemedText>
          </View>
        )}
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
        </View>
      </View>

      <View style={styles.eventFooter}>
        <View style={styles.attendeeInfo}>
          <ThemedText style={styles.attendeeCount}>
            👥 {item.attendeeCount}{item.maxAttendees ? `/${item.maxAttendees}` : ''} attending
          </ThemedText>
        </View>
        <TouchableOpacity
          style={[
            styles.rsvpButton,
            { backgroundColor: item.isRSVPed ? '#e74c3c' : '#27ae60' }
          ]}
          onPress={() => handleRSVP(item)}
        >
          <ThemedText style={styles.rsvpButtonText}>
            {item.isRSVPed ? 'Cancel RSVP' : 'RSVP'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryFilter = () => (
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
              backgroundColor: filter.category === item.key ? '#45b7d1' : cardBackground,
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
      contentContainerStyle={styles.categoryList}
    />
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
          <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
            <TouchableOpacity onPress={() => setShowEventModal(false)}>
              <ThemedText style={styles.modalCloseButton}>✕</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.modalTitle}>Event Details</ThemedText>
            <View style={{ width: 30 }} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.modalEventHeader}>
              <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(selectedEvent.category) }]} />
              <ThemedText style={styles.modalCategoryText}>
                {getCategoryIcon(selectedEvent.category)} {categories.find(c => c.key === selectedEvent.category)?.label}
              </ThemedText>
            </View>

            <ThemedText style={styles.modalEventTitle}>{selectedEvent.title}</ThemedText>
            <ThemedText style={styles.modalEventDescription}>{selectedEvent.description}</ThemedText>

            <View style={styles.modalEventDetails}>
              <View style={styles.modalDetailRow}>
                <ThemedText style={styles.modalDetailLabel}>📅 Date:</ThemedText>
                <ThemedText style={styles.modalDetailValue}>{formatDate(selectedEvent.date)}</ThemedText>
              </View>
              <View style={styles.modalDetailRow}>
                <ThemedText style={styles.modalDetailLabel}>🕐 Time:</ThemedText>
                <ThemedText style={styles.modalDetailValue}>{selectedEvent.time}</ThemedText>
              </View>
              <View style={styles.modalDetailRow}>
                <ThemedText style={styles.modalDetailLabel}>📍 Location:</ThemedText>
                <ThemedText style={styles.modalDetailValue}>{selectedEvent.location}</ThemedText>
              </View>
              <View style={styles.modalDetailRow}>
                <ThemedText style={styles.modalDetailLabel}>👨‍💼 Organizer:</ThemedText>
                <ThemedText style={styles.modalDetailValue}>{selectedEvent.organizer}</ThemedText>
              </View>
              <View style={styles.modalDetailRow}>
                <ThemedText style={styles.modalDetailLabel}>👥 Attendees:</ThemedText>
                <ThemedText style={styles.modalDetailValue}>
                  {selectedEvent.attendeeCount}{selectedEvent.maxAttendees ? `/${selectedEvent.maxAttendees}` : ''} people
                </ThemedText>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalRSVPButton,
                  { backgroundColor: selectedEvent.isRSVPed ? '#e74c3c' : '#27ae60' }
                ]}
                onPress={() => {
                  handleRSVP(selectedEvent);
                  setShowEventModal(false);
                }}
              >
                <ThemedText style={styles.modalRSVPButtonText}>
                  {selectedEvent.isRSVPed ? 'Cancel RSVP' : 'RSVP for this Event'}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalShareButton, { borderColor }]}
                onPress={() => Alert.alert('Share', 'Share feature coming soon!')}
              >
                <ThemedText style={styles.modalShareButtonText}>📤 Share Event</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ThemedView>
      )}
    </Modal>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>Events</ThemedText>
        <TouchableOpacity onPress={() => Alert.alert('Add Event', 'Add event feature coming soon!')}>
          <ThemedText style={styles.addButton}>+ Add</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Search Bar */}
      <ThemedView style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { borderColor, color: textColor }]}
          placeholder="Search events..."
          placeholderTextColor={borderColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </ThemedView>

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
            <ThemedText style={styles.emptyText}>No events found</ThemedText>
            <ThemedText style={styles.emptySubtext}>Try adjusting your filters</ThemedText>
          </ThemedView>
        }
      />

      {renderEventModal()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 34,
    paddingTop: 5,
  },
  addButton: {
    fontSize: 16,
    color: '#45b7d1',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  categoryList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 1,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 3,
    minWidth: 65,
    alignItems: 'center',
  },
  categoryButtonText: {
    fontSize: 12,
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
  todayBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  soonBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  soonText: {
    color: 'white',
    fontSize: 10,
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
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    fontSize: 18,
    color: '#45b7d1',
    width: 30,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalCategoryText: {
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
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  modalDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  modalDetailValue: {
    fontSize: 14,
    opacity: 0.8,
    flex: 1,
    textAlign: 'right',
  },
  modalActions: {
    gap: 12,
  },
  modalRSVPButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalRSVPButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalShareButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalShareButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});