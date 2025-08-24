import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { useLanguage } from './LanguageContext';

export interface FirebaseEventData {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  organizerId: string;
  category: 'worship' | 'study' | 'fellowship' | 'blending' | 'prayer';
  maxAttendees?: number;
  attendees: string[];
  waitingList: string[];
  isPublished: boolean;
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
  requirements?: string;
  contactInfo: string;
  // 由前端派生：不写入 Firestore
  attendeeCount: number;
  waitingListCount: number;
}

export interface EventFilter {
  category: string;
  timeRange: 'all' | 'today' | 'week' | 'month';
  status: 'all' | 'upcoming' | 'past' | 'my_events';
}

interface FirebaseEventContextType {
  events: FirebaseEventData[];
  filteredEvents: FirebaseEventData[];
  filter: EventFilter;
  loading: boolean;
  error: string | null;

  // Event operations
  createEvent: (
    eventData: Omit<
      FirebaseEventData,
      'id' | 'attendees' | 'waitingList' | 'createdAt' | 'updatedAt' | 'attendeeCount' | 'waitingListCount'
    >
  ) => Promise<string>;
  updateEvent: (eventId: string, eventData: Partial<FirebaseEventData>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;

  // RSVP operations
  rsvpEvent: (eventId: string, userId: string, userName: string) => Promise<'registered' | 'waiting_list'>;
  cancelRsvp: (eventId: string, userId: string) => Promise<void>;

  // Filter operations
  setFilter: (filter: EventFilter) => void;

  // Query helpers
  getUserRsvpStatus: (eventId: string, userId: string) => 'not_registered' | 'registered' | 'waiting_list';
  getMyEvents: (userId: string) => FirebaseEventData[];
  getMyRsvpEvents: (userId: string) => FirebaseEventData[];

  // Usage monitoring
  todayUsage: { reads: number; writes: number };
  incrementUsage: (reads: number, writes: number) => void;
}

const FirebaseEventContext = createContext<FirebaseEventContextType | undefined>(undefined);

export const FirebaseEventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t } = useLanguage();
  const [events, setEvents] = useState<FirebaseEventData[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<FirebaseEventData[]>([]);
  const [filter, setFilterState] = useState<EventFilter>({
    category: 'all',
    timeRange: 'all',
    status: 'upcoming',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayUsage, setTodayUsage] = useState({ reads: 0, writes: 0 });

  // 实时监听所有已发布的活动
  useEffect(() => {
    console.log('🔥 Setting up Firebase event listener...');

    const eventsQuery = query(
      collection(db, 'events'),
      where('isPublished', '==', true),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(
      eventsQuery,
      (snapshot) => {
        console.log('🔥 Firebase events updated, got', snapshot.docs.length, 'events');

        const eventList: FirebaseEventData[] = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() as any;
          eventList.push({
            id: docSnap.id,
            ...data,
            attendeeCount: Array.isArray(data.attendees) ? data.attendees.length : 0,
            waitingListCount: Array.isArray(data.waitingList) ? data.waitingList.length : 0,
          } as FirebaseEventData);
        });

        setEvents(eventList);
        setLoading(false);
        setError(null);

        // 统计读取次数
        incrementUsage(snapshot.docs.length, 0);
      },
      (err) => {
        console.error('🔥 Firebase events listener error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      console.log('🔥 Cleaning up Firebase event listener');
      unsubscribe();
    };
  }, []);

  // 应用筛选器
  useEffect(() => {
    let filtered = [...events];
    const now = new Date();

    // 按类别筛选
    if (filter.category !== 'all') {
      filtered = filtered.filter((event) => event.category === filter.category);
    }

    // 按时间范围筛选
    if (filter.timeRange !== 'all') {
      filtered = filtered.filter((event) => {
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

    // 按状态筛选
    if (filter.status !== 'all') {
      switch (filter.status) {
        case 'upcoming':
          filtered = filtered.filter((event) => new Date(event.date) >= now);
          break;
        case 'past':
          filtered = filtered.filter((event) => new Date(event.date) < now);
          break;
        // 'my_events' 可在视图层结合 getMyEvents 使用
      }
    }

    setFilteredEvents(filtered);
  }, [events, filter]);

  // 使用监控
  const incrementUsage = (reads: number, writes: number) => {
    setTodayUsage((prev) => ({
      reads: prev.reads + reads,
      writes: prev.writes + writes,
    }));
  };

  // 创建活动（不写计数字段）
  const createEvent = async (
    eventData: Omit<
      FirebaseEventData,
      'id' | 'attendees' | 'waitingList' | 'createdAt' | 'updatedAt' | 'attendeeCount' | 'waitingListCount'
    >
  ): Promise<string> => {
    try {
      console.log('🔥 Creating event:', eventData.title);

      // 过滤掉所有 undefined 值
      const cleanEventData = Object.fromEntries(Object.entries(eventData).filter(([_, value]) => value !== undefined));

      const docRef = await addDoc(collection(db, 'events'), {
        ...cleanEventData,
        attendees: [],
        waitingList: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      incrementUsage(0, 1);
      console.log('🔥 Event created with ID:', docRef.id);
      return docRef.id;
    } catch (err) {
      console.error('🔥 Error creating event:', err);
      throw new Error('Failed to create event');
    }
  };

  // 更新活动（禁止客户端直接改计数字段；由规则与后端保障）
  const updateEvent = async (eventId: string, eventData: Partial<FirebaseEventData>): Promise<void> => {
    try {
      const { attendeeCount, waitingListCount, ...rest } = eventData as any; // 丢弃计数字段
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        ...rest,
        updatedAt: serverTimestamp(),
      });

      incrementUsage(0, 1);
    } catch (err) {
      console.error('🔥 Error updating event:', err);
      throw new Error('Failed to update event');
    }
  };

  // 删除活动
  const deleteEvent = async (eventId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'events', eventId));
      incrementUsage(0, 1);
    } catch (err) {
      console.error('🔥 Error deleting event:', err);
      throw new Error('Failed to delete event');
    }
  };

  // RSVP（事务版：只改数组，不写计数）
  const rsvpEvent = async (
    eventId: string,
    userId: string,
    userName: string
  ): Promise<'registered' | 'waiting_list'> => {
    try {
      const eventRef = doc(db, 'events', eventId);
      const result = await runTransaction(db, async (tx) => {
        const snap = await tx.get(eventRef);
        if (!snap.exists()) throw new Error('Event not found');
        const data = snap.data() as any;

        const max = data.maxAttendees as number | undefined;
        const attendees: string[] = Array.isArray(data.attendees) ? [...data.attendees] : [];
        const waiting: string[] = Array.isArray(data.waitingList) ? [...data.waitingList] : [];

        // 已存在则返回现状
        if (attendees.includes(userId)) return 'registered' as const;
        if (waiting.includes(userId)) return 'waiting_list' as const;

        let status: 'registered' | 'waiting_list' = 'registered';
        if (typeof max === 'number' && max > 0 && attendees.length >= max) {
          // 满员 -> 候补
          if (!waiting.includes(userId)) waiting.push(userId);
          status = 'waiting_list';
        } else {
          attendees.push(userId);
        }

        tx.update(eventRef, {
          attendees,
          waitingList: waiting,
          updatedAt: serverTimestamp(),
        });

        return status;
      });

      incrementUsage(0, 1);
      console.log(
        `🔥 User ${userName} ${result === 'registered' ? 'registered for' : 'joined waiting list for'} event: ${eventId}`
      );
      return result;
    } catch (err) {
      console.error('🔥 Error with RSVP:', err);
      throw new Error('Failed to RSVP for event');
    }
  };

  // 取消 RSVP（事务版：只改数组，不写计数；候补顶替）
  const cancelRsvp = async (eventId: string, userId: string): Promise<void> => {
    try {
      const eventRef = doc(db, 'events', eventId);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(eventRef);
        if (!snap.exists()) throw new Error('Event not found');
        const data = snap.data() as any;

        let attendees: string[] = Array.isArray(data.attendees) ? [...data.attendees] : [];
        let waiting: string[] = Array.isArray(data.waitingList) ? [...data.waitingList] : [];

        const wasAttendee = attendees.includes(userId);
        const wasWaiting = waiting.includes(userId);

        if (!wasAttendee && !wasWaiting) return;

        if (wasAttendee) {
          // 从参与者移除
          attendees = attendees.filter((uid) => uid !== userId);

          // 有候补则顶替第一个
          if (waiting.length > 0) {
            const nextUserId = waiting[0];
            waiting = waiting.slice(1);
            if (!attendees.includes(nextUserId)) attendees.push(nextUserId);
          }
        } else {
          // 候补中则移除
          waiting = waiting.filter((uid) => uid !== userId);
        }

        tx.update(eventRef, {
          attendees,
          waitingList: waiting,
          updatedAt: serverTimestamp(),
        });
      });

      incrementUsage(0, 1);
    } catch (err) {
      console.error('🔥 Error canceling RSVP:', err);
      throw new Error('Failed to cancel RSVP');
    }
  };

  // 设置筛选器
  const setFilter = (newFilter: EventFilter) => {
    setFilterState(newFilter);
  };

  // 获取用户RSVP状态
  const getUserRsvpStatus = (eventId: string, userId: string): 'not_registered' | 'registered' | 'waiting_list' => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return 'not_registered';

    if (event.attendees.includes(userId)) return 'registered';
    if (event.waitingList.includes(userId)) return 'waiting_list';
    return 'not_registered';
    };

  // 获取用户创建的活动
  const getMyEvents = (userId: string): FirebaseEventData[] => {
    return events.filter((event) => event.organizerId === userId);
  };

  // 获取用户报名的活动
  const getMyRsvpEvents = (userId: string): FirebaseEventData[] => {
    return events.filter((event) => event.attendees.includes(userId) || event.waitingList.includes(userId));
  };

  return (
    <FirebaseEventContext.Provider
      value={{
        events,
        filteredEvents,
        filter,
        loading,
        error,
        createEvent,
        updateEvent,
        deleteEvent,
        rsvpEvent,
        cancelRsvp,
        setFilter,
        getUserRsvpStatus,
        getMyEvents,
        getMyRsvpEvents,
        todayUsage,
        incrementUsage,
      }}
    >
      {children}
    </FirebaseEventContext.Provider>
  );
};

export const useFirebaseEvents = (): FirebaseEventContextType => {
  const context = useContext(FirebaseEventContext);
  if (!context) {
    throw new Error('useFirebaseEvents must be used within a FirebaseEventProvider');
  }
  return context;
};