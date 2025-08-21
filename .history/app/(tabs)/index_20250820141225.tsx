import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface Announcement {
  id: number;
  title: string;
  content: string;
  date: string;
  author: string;
  type: 'study' | 'prayer' | 'worship' | 'general';
}

export default function HomeScreen(): JSX.Element {
  // Mock data for now
  const announcements: Announcement[] = [
    {
      id: 1,
      title: 'Weekly Bible Study',
      content: 'Join us this Thursday at 7 PM in the student center for our weekly Bible study. This week we\'re studying Romans 8.',
      date: '2025-01-15',
      author: 'Sarah Johnson',
      type: 'study'
    },
    {
      id: 2,
      title: 'Prayer Meeting',
      content: 'Special prayer meeting for upcoming midterms. Come as you are, bring your burdens to the Lord.',
      date: '2025-01-12',
      author: 'Mike Chen',
      type: 'prayer'
    },
    {
      id: 3,
      title: 'Worship Night',
      content: 'Join us for an evening of worship and fellowship. Bring your instruments if you play!',
      date: '2025-01-10',
      author: 'Emily Davis',
      type: 'worship'
    }
  ];

  const getTypeIcon = (type: Announcement['type']): string => {
    switch (type) {
      case 'study': return 'book-outline';
      case 'prayer': return 'heart-outline';
      case 'worship': return 'musical-notes-outline';
      default: return 'information-circle-outline';
    }
  };

  const getTypeColor = (type: Announcement['type']): string => {
    switch (type) {
      case 'study': return '#4A90E2';
      case 'prayer': return '#E24A4A';
      case 'worship': return '#9B59B6';
      default: return '#7F8C8D';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome to Christians on Campus</Text>
        <Text style={styles.subText}>Stay connected with your community</Text>
      </View>
      
      <ScrollView style={styles.announcementsList}>
        {announcements.map(announcement => (
          <TouchableOpacity 
            key={announcement.id} 
            style={styles.announcementCard}
          >
            <View style={styles.cardHeader}>
              <View style={styles.typeContainer}>
                <Ionicons 
                  name={getTypeIcon(announcement.type) as any} 
                  size={20} 
                  color={getTypeColor(announcement.type)} 
                />
                <Text style={[styles.typeText, { color: getTypeColor(announcement.type) }]}>
                  {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
                </Text>
              </View>
              <Text style={styles.dateText}>{announcement.date}</Text>
            </View>
            
            <Text style={styles.titleText}>{announcement.title}</Text>
            <Text style={styles.contentText}>{announcement.content}</Text>
            
            <View style={styles.cardFooter}>
              <Text style={styles.authorText}>By {announcement.author}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2E8B57',
    padding: 20,
    paddingBottom: 30,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: '#E8F5E8',
    textAlign: 'center',
    marginTop: 5,
  },
  announcementsList: {
    flex: 1,
    padding: 15,
  },
  announcementCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  dateText: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  contentText: {
    fontSize: 14,
    color: '#34495E',
    lineHeight: 20,
    marginBottom: 10,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
    paddingTop: 8,
  },
  authorText: {
    fontSize: 12,
    color: '#7F8C8D',
    fontStyle: 'italic',
  },
});