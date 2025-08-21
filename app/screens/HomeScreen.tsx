import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useLanguage } from '../../contexts/LanguageContext';
import { useThemeColor } from '../../hooks/useThemeColor';

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  type: 'general' | 'prayer' | 'urgent';
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

export default function HomeScreen() {
  const { t } = useLanguage();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');

  // Mock data - replace with actual API calls later
  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    setAnnouncements([
      {
        id: '1',
        title: 'Weekly Bible Study',
        content: 'Join us this Thursday at 7 PM in the Student Center for our study on Romans. Bring your Bible and a friend!',
        author: 'Pastor John',
        date: '2025-08-19',
        type: 'general'
      },
      {
        id: '2',
        title: 'Prayer Meeting',
        content: 'Please pray for Sarah who is going through a difficult time with her family. Let\'s lift her up in prayer.',
        author: 'Ministry Team',
        date: '2025-08-18',
        type: 'prayer'
      },
      {
        id: '3',
        title: 'Urgent: Event Location Changed',
        content: 'This Friday\'s fellowship dinner has been moved to Room 205 due to maintenance in the original location.',
        author: 'Event Team',
        date: '2025-08-17',
        type: 'urgent'
      }
    ]);

    setUpcomingEvents([
      {
        id: '1',
        title: 'Bible Study - Romans',
        date: '2025-08-22',
        time: '7:00 PM',
        location: 'Student Center Room 101',
        description: 'Weekly Bible study focusing on the book of Romans'
      },
      {
        id: '2',
        title: 'Fellowship Dinner',
        date: '2025-08-23',
        time: '6:30 PM',
        location: 'Campus Cafeteria Room 205',
        description: 'Monthly fellowship dinner for all members'
      },
      {
        id: '3',
        title: 'Worship Night',
        date: '2025-08-25',
        time: '7:30 PM',
        location: 'Main Auditorium',
        description: 'Special worship service with guest speaker'
      }
    ]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      loadMockData();
      setRefreshing(false);
    }, 1000);
  };

  const handleAnnouncementPress = (announcement: Announcement) => {
    Alert.alert(announcement.title, announcement.content);
  };

  const handleEventPress = (event: Event) => {
    Alert.alert(event.title, `${event.date} at ${event.time}\n${event.location}\n\n${event.description}`);
  };

  const getAnnouncementColor = (type: string) => {
    switch (type) {
      case 'urgent': return '#ff6b6b';
      case 'prayer': return '#4ecdc4';
      case 'general': return '#45b7d1';
      default: return '#45b7d1';
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en', { month: 'short' });
    return { day: day.toString(), month };
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* Header Component */}
      <Header />
      
      <ScrollView 
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <ThemedView style={styles.welcomeSection}>
          <ThemedText style={styles.welcomeText}>{t('home.welcome')}</ThemedText>
        </ThemedView>

        {/* Announcements Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('home.announcements')}</ThemedText>
          {announcements.map((announcement) => (
            <TouchableOpacity 
              key={announcement.id}
              style={[
                styles.announcementCard,
                { backgroundColor: cardBackground, borderColor }
              ]}
              onPress={() => handleAnnouncementPress(announcement)}
            >
              <ThemedView 
                style={[
                  styles.announcementType,
                  { backgroundColor: getAnnouncementColor(announcement.type) }
                ]}
              />
              <ThemedView style={styles.announcementContent}>
                <ThemedText style={styles.announcementTitle}>
                  {announcement.title}
                </ThemedText>
                <ThemedText style={styles.announcementText} numberOfLines={2}>
                  {announcement.content}
                </ThemedText>
                <ThemedView style={styles.announcementMeta}>
                  <ThemedText style={styles.metaText}>
                    {t('home.by')} {announcement.author}
                  </ThemedText>
                  <ThemedText style={styles.metaText}>
                    {announcement.date}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </TouchableOpacity>
          ))}
        </ThemedView>

        {/* Upcoming Events Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('home.events')}</ThemedText>
          {upcomingEvents.map((event) => {
            const eventDate = formatEventDate(event.date);
            return (
              <TouchableOpacity 
                key={event.id}
                style={[
                  styles.eventCard,
                  { backgroundColor: cardBackground, borderColor }
                ]}
                onPress={() => handleEventPress(event)}
              >
                <ThemedView style={styles.eventDate}>
                  <ThemedText style={styles.eventDateText}>{eventDate.day}</ThemedText>
                  <ThemedText style={styles.eventMonthText}>{eventDate.month}</ThemedText>
                </ThemedView>
                <ThemedView style={styles.eventDetails}>
                  <ThemedText style={styles.eventTitle}>{event.title}</ThemedText>
                  <ThemedText style={styles.eventTime}>{event.time}</ThemedText>
                  <ThemedText style={styles.eventLocation}>{event.location}</ThemedText>
                </ThemedView>
              </TouchableOpacity>
            );
          })}
        </ThemedView>

        {/* Quick Actions */}
        {/* <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('home.quickActions')}</ThemedText>
          <ThemedView style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/screens/BibleScreen')}
            >
              <ThemedText style={styles.actionButtonText}>{t('home.readBible')}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => Alert.alert(t('home.prayerRequest'), t('profile.featureComingSoon'))}
            >
              <ThemedText style={styles.actionButtonText}>{t('home.prayerRequest')}</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView> */}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  welcomeSection: {
    padding: 20,
    paddingBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    opacity: 0.7,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  announcementCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  announcementType: {
    width: 4,
  },
  announcementContent: {
    flex: 1,
    padding: 16,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  announcementText: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
    marginBottom: 8,
  },
  announcementMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    opacity: 0.6,
  },
  eventCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  eventDate: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 50,
  },
  eventDateText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  eventMonthText: {
    fontSize: 12,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 14,
    opacity: 0.6,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#45b7d1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});