// CoC-App/contexts/EventContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface EventData {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  organizerId: string; // 创建者ID
  category: 'worship' | 'study' | 'fellowship' | 'blending' | 'prayer';
  maxAttendees?: number;
  attendees: string[]; // Array of user IDs
  waitingList: string[]; // Array of user IDs on waiting list
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  requirements?: string; // 报名要求
  contactInfo?: string; // 联系方式
}

export interface EventFilter {
  category: string;
  timeRange: 'all' | 'today' | 'week' | 'month';
  status: 'all' | 'upcoming' | 'past' | 'my_events';
}

interface EventContextType {
  events: EventData[];
  filteredEvents: EventData[];
  filter: EventFilter;
  loading: boolean;
  createEvent: (eventData: Omit<EventData, 'id' | 'attendees' | 'waitingList' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateEvent: (eventId: string, eventData: Partial<EventData>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  rsvpEvent: (eventId: string, userId: string) => Promise<boolean>;
  cancelRsvp: (eventId: string, userId: string) => Promise<void>;
  setFilter: (filter: EventFilter) => void;
  refreshEvents: () => Promise<void>;
  getUserRsvpStatus: (eventId: string, userId: string) => 'not_registered' | 'registered' | 'waiting_list';
  getMyEvents: (userId: string) => EventData[];
  getMyRsvpEvents: (userId: string) => EventData[];
}

const EventContext = createContext<EventContextType | undefined>(undefined);

const EVENTS_STORAGE_KEY = 'events_data';

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>([]);
  const [filter, setFilterState] = useState<EventFilter>({
    category: 'all',
    timeRange: 'all',
    status: 'all'
  });
  const [loading, setLoading] = useState(false);

  // Load events from storage on mount
  useEffect(() => {
    loadEvents();
  }, []);

  // Apply filters when events or filter changes
  useEffect(() => {
    applyFilters();
  }, [events, filter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const savedEvents = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
      if (savedEvents) {
        const parsedEvents: EventData[] = JSON.parse(savedEvents);
        setEvents(parsedEvents);
      } else {
        // Initialize with sample data if no events exist
        await initializeSampleEvents();
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveEvents = async (newEvents: EventData[]) => {
    try {
      await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(newEvents));
    } catch (error) {
      console.error('Error saving events:', error);
    }
  };

  const generateEventId = (): string => {
    return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  const createEvent = async (eventData: Omit<EventData, 'id' | 'attendees' | 'waitingList' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const newEvent: EventData = {
      ...eventData,
      id: generateEventId(),
      attendees: [],
      waitingList: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    await saveEvents(updatedEvents);
    
    return newEvent.id;
  };

  const updateEvent = async (eventId: string, eventData: Partial<EventData>): Promise<void> => {
    const updatedEvents = events.map(event => 
      event.id === eventId 
        ? { ...event, ...eventData, updatedAt: new Date().toISOString() }
        : event
    );
    
    setEvents(updatedEvents);
    await saveEvents(updatedEvents);
  };

  const deleteEvent = async (eventId: string): Promise<void> => {
    const updatedEvents = events.filter(event => event.id !== eventId);
    setEvents(updatedEvents);
    await saveEvents(updatedEvents);
  };

  const rsvpEvent = async (eventId: string, userId: string): Promise<boolean> => {
    const event = events.find(e => e.id === eventId);
    if (!event) return false;

    let updatedEvent: EventData;
    
    if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
      // Add to waiting list if event is full
      if (!event.waitingList.includes(userId)) {
        updatedEvent = {
          ...event,
          waitingList: [...event.waitingList, userId],
          updatedAt: new Date().toISOString(),
        };
      } else {
        return false; // Already on waiting list
      }
    } else {
      // Add to attendees if space available
      if (!event.attendees.includes(userId)) {
        updatedEvent = {
          ...event,
          attendees: [...event.attendees, userId],
          updatedAt: new Date().toISOString(),
        };
      } else {
        return false; // Already registered
      }
    }

    const updatedEvents = events.map(e => e.id === eventId ? updatedEvent : e);
    setEvents(updatedEvents);
    await saveEvents(updatedEvents);
    
    return true;
  };

  const cancelRsvp = async (eventId: string, userId: string): Promise<void> => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    let updatedEvent = { ...event };

    // Remove from attendees
    if (event.attendees.includes(userId)) {
      updatedEvent.attendees = event.attendees.filter(id => id !== userId);
      
      // If there's someone on waiting list, move them to attendees
      if (event.waitingList.length > 0) {
        const nextUserId = event.waitingList[0];
        updatedEvent.attendees.push(nextUserId);
        updatedEvent.waitingList = event.waitingList.filter(id => id !== nextUserId);
      }
    }

    // Remove from waiting list
    if (event.waitingList.includes(userId)) {
      updatedEvent.waitingList = event.waitingList.filter(id => id !== userId);
    }

    updatedEvent.updatedAt = new Date().toISOString();

    const updatedEvents = events.map(e => e.id === eventId ? updatedEvent : e);
    setEvents(updatedEvents);
    await saveEvents(updatedEvents);
  };

  const applyFilters = () => {
    let filtered = [...events];
    const now = new Date();

    // Filter by category
    if (filter.category !== 'all') {
      filtered = filtered.filter(event => event.category === filter.category);
    }

    // Filter by time range
    if (filter.timeRange !== 'all') {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date);
        const timeDiff = eventDate.getTime() - now.getTime();
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

    // Filter by status
    if (filter.status !== 'all') {
      switch (filter.status) {
        case 'upcoming':
          filtered = filtered.filter(event => new Date(event.date) >= now);
          break;
        case 'past':
          filtered = filtered.filter(event => new Date(event.date) < now);
          break;
      }
    }

    // Sort by date
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setFilteredEvents(filtered);
  };

  const setFilter = (newFilter: EventFilter) => {
    setFilterState(newFilter);
  };

  const refreshEvents = async () => {
    await loadEvents();
  };

  const getUserRsvpStatus = (eventId: string, userId: string): 'not_registered' | 'registered' | 'waiting_list' => {
    const event = events.find(e => e.id === eventId);
    if (!event) return 'not_registered';

    if (event.attendees.includes(userId)) return 'registered';
    if (event.waitingList.includes(userId)) return 'waiting_list';
    return 'not_registered';
  };

  const getMyEvents = (userId: string): EventData[] => {
    return events.filter(event => event.organizerId === userId);
  };

  const getMyRsvpEvents = (userId: string): EventData[] => {
    return events.filter(event => 
      event.attendees.includes(userId) || event.waitingList.includes(userId)
    );
  };

  const initializeSampleEvents = async () => {
    const sampleEvents: EventData[] = [
      {
        id: 'sample_event_1',
        title: 'Weekly Bible Study - Romans',
        description: 'Join us for an in-depth study of the book of Romans. We\'ll explore themes of grace, faith, and righteousness.',
        date: '2025-08-25',
        time: '7:00 PM',
        location: 'Student Center Room 101',
        organizer: 'Pastor John',
        organizerId: 'user_001',
        category: 'study',
        maxAttendees: 25,
        attendees: ['user_002', 'user_003'],
        waitingList: [],
        isPublished: true,
        createdAt: '2025-08-20T10:00:00Z',
        updatedAt: '2025-08-20T10:00:00Z',
        requirements: 'Please bring your Bible',
        contactInfo: 'john@example.com',
      },
      {
        id: 'sample_event_2',
        title: 'Fellowship Dinner',
        description: 'Monthly fellowship dinner where we share food, stories, and build deeper relationships.',
        date: '2025-08-26',
        time: '6:30 PM',
        location: 'Campus Cafeteria Room 205',
        organizer: 'Fellowship Team',
        organizerId: 'user_004',
        category: 'fellowship',
        maxAttendees: 50,
        attendees: Array.from({ length: 45 }, (_, i) => `user_${100 + i}`),
        waitingList: ['user_145', 'user_146'],
        isPublished: true,
        createdAt: '2025-08-18T14:30:00Z',
        updatedAt: '2025-08-22T09:15:00Z',
        requirements: 'Please RSVP by August 24th',
        contactInfo: 'fellowship@campus.org',
      },
    ];

    setEvents(sampleEvents);
    await saveEvents(sampleEvents);
  };

  return (
    <EventContext.Provider value={{
      events,
      filteredEvents,
      filter,
      loading,
      createEvent,
      updateEvent,
      deleteEvent,
      rsvpEvent,
      cancelRsvp,
      setFilter,
      refreshEvents,
      getUserRsvpStatus,
      getMyEvents,
      getMyRsvpEvents,
    }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = (): EventContextType => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};