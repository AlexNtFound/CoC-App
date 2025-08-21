import React, { createContext, ReactNode, useContext, useState } from 'react';

export type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, ...args: (string | number)[]) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 翻译数据 - 使用嵌套结构
const translations = {
  en: {
    // Tab Navigation
    tab: {
      home: 'Home',
      bible: 'Bible',
      events: 'Events',
      profile: 'Profile',
    },
    
    // Home Screen
    home: {
      title: 'Christians on Campus',
      welcome: 'Welcome back!',
      announcements: 'Recent Announcements',
      events: 'Upcoming Events',
      quickActions: 'Quick Actions',
      readBible: '📖 Read Bible',
      prayerRequest: '🙏 Personal Prayer',
      by: 'By',
    },
    
    // Bible Screen
    bible: {
      title: 'Bible',
      selectBook: 'Select Book',
      back: '← Back',
      home: '← Home',
      searchVerses: 'Search verses...',
      chapter: 'Chapter',
      prev: '← Prev',
      next: 'Next →',
      loading: 'Loading...',
      chapters: 'chapters',
      verseOptions: 'Verse Options',
      bookmark: 'Bookmark',
      share: 'Share',
      bookmarked: 'Bookmarked!',
      bookmarkFeature: 'Bookmark feature coming soon!',
      shareFeature: 'Share feature coming soon!',
      searchFeature: 'Search feature coming soon!',
    },
    
    // Events Screen
    events: {
      title: 'Events',
      add: '+ Add',
      searchEvents: 'Search events...',
      all: 'All',
      worship: 'Worship',
      study: 'Study',
      fellowship: 'Fellowship',
      blending: 'Blending',
      prayer: 'Prayer',
      today: 'TODAY',
      soon: 'SOON',
      attending: 'attending',
      rsvp: 'RSVP',
      cancelRsvp: 'Cancel RSVP',
      noEvents: 'No events found',
      adjustFilters: 'Try adjusting your filters',
      eventDetails: 'Event Details',
      date: 'Date:',
      time: 'Time:',
      location: 'Location:',
      organizer: 'Organizer:',
      attendees: 'Attendees:',
      people: 'people',
      rsvpForEvent: 'RSVP for this Event',
      shareEvent: '📤 Share Event',
      rsvpConfirmed: 'RSVP Confirmed',
      rsvpCancelled: 'RSVP Cancelled',
      rsvpConfirmedMessage: 'You have successfully RSVP\'d for',
      rsvpCancelledMessage: 'You have cancelled your RSVP for',
      addEventFeature: 'Add event feature coming soon!',
      shareFeature: 'Share feature coming soon!',
    },
    
    // Profile Screen
    profile: {
      title: 'Profile',
      edit: 'Edit',
      campus: '🎓 Campus:',
      year: '📚 Year:',
      joined: '📅 Joined:',
      myActivity: 'My Activity',
      eventsAttended: 'Events Attended',
      studiesCompleted: 'Studies Completed',
      prayerRequests: 'Personal Prayer',
      notifications: 'Notifications',
      appearance: 'Appearance',
      account: 'Account',
      support: 'Support',
      accountActions: 'Account Actions',
      pushNotifications: 'Push Notifications',
      pushNotificationsDesc: 'Receive notifications for events and updates',
      eventReminders: 'Event Reminders',
      eventRemindersDesc: 'Get reminded before events start',
      prayerReminders: 'Prayer Reminders',
      prayerRemindersDesc: 'Daily prayer time reminders',
      darkMode: 'Dark Mode',
      darkModeDesc: 'Use dark theme',
      language: 'Language',
      languageDesc: 'Change app language',
      editProfile: 'Edit Profile',
      editProfileDesc: 'Update your personal information',
      myPrayerRequests: 'My Personal Prayer',
      myPrayerRequestsDesc: 'View and manage your personal prayer',
      bookmarkedVerses: 'Bookmarked Verses',
      bookmarkedVersesDesc: 'Your saved Bible verses',
      helpSupport: 'Help & Support',
      helpSupportDesc: 'Get help or contact us',
      sendFeedback: 'Send Feedback',
      sendFeedbackDesc: 'Help us improve the app',
      about: 'About',
      aboutDesc: 'App version and information',
      signOut: 'Sign Out',
      signOutDesc: 'Sign out of your account',
      signOutConfirm: 'Are you sure you want to sign out?',
      cancel: 'Cancel',
      signedOut: 'Signed Out',
      version: 'Christians on Campus v1.0.0',
      madeWith: 'Made with ❤️ for campus gospel ministry',
      featureComingSoon: 'feature coming soon!',
    },
    
    // Common
    common: {
      loading: 'Loading...',
      cancel: 'Cancel',
      ok: 'OK',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      share: 'Share',
      close: 'Close',
    },
    
    // Days and Months
    date: {
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun',
      january: 'Jan',
      february: 'Feb',
      march: 'Mar',
      april: 'Apr',
      may: 'May',
      june: 'Jun',
      july: 'Jul',
      august: 'Aug',
      september: 'Sep',
      october: 'Oct',
      november: 'Nov',
      december: 'Dec',
    },
  },
  zh: {
    // Tab Navigation
    tab: {
      home: '主页',
      bible: '圣经',
      events: '活动',
      profile: '个人',
    },
    
    // Home Screen
    home: {
      title: '校园基督徒',
      welcome: '欢迎回来！',
      announcements: '最新公告',
      events: '即将举行的活动',
      quickActions: '快捷操作',
      readBible: '📖 阅读圣经',
      prayerRequest: '🙏 个人祷告',
      by: '发布者',
    },
    
    // Bible Screen
    bible: {
      title: '圣经',
      selectBook: '选择书卷',
      back: '← 返回',
      home: '← 主页',
      searchVerses: '搜索经文...',
      chapter: '第 {0} 章',
      prev: '← 上一章',
      next: '下一章 →',
      loading: '加载中...',
      chapters: '章',
      verseOptions: '经文选项',
      bookmark: '书签',
      share: '分享',
      bookmarked: '已添加书签！',
      bookmarkFeature: '书签功能即将推出！',
      shareFeature: '分享功能即将推出！',
      searchFeature: '搜索功能即将推出！',
    },
    
    // Events Screen
    events: {
      title: '活动',
      add: '+ 添加',
      searchEvents: '搜索活动...',
      all: '全部',
      worship: '敬拜',
      study: '研读',
      fellowship: '交通',
      blending: '相调',
      prayer: '祷告',
      today: '今天',
      soon: '即将',
      attending: '人参加',
      rsvp: '报名',
      cancelRsvp: '取消报名',
      noEvents: '未找到活动',
      adjustFilters: '请尝试调整筛选条件',
      eventDetails: '活动详情',
      date: '日期：',
      time: '时间：',
      location: '地点：',
      organizer: '组织者：',
      attendees: '参与者：',
      people: '人',
      rsvpForEvent: '报名参加此活动',
      shareEvent: '📤 分享活动',
      rsvpConfirmed: '报名成功',
      rsvpCancelled: '取消报名',
      rsvpConfirmedMessage: '您已成功报名参加',
      rsvpCancelledMessage: '您已取消报名',
      addEventFeature: '添加活动功能即将推出！',
      shareFeature: '分享功能即将推出！',
    },
    
    // Profile Screen
    profile: {
      title: '个人资料',
      edit: '编辑',
      campus: '🎓 校园：',
      year: '📚 年级：',
      joined: '📅 加入时间：',
      myActivity: '我的活动',
      eventsAttended: '参加活动',
      studiesCompleted: '完成读经',
      prayerRequests: '个人祷告',
      notifications: '通知',
      appearance: '外观',
      account: '账户',
      support: '支持',
      accountActions: '账户操作',
      pushNotifications: '推送通知',
      pushNotificationsDesc: '接收活动和更新通知',
      eventReminders: '活动提醒',
      eventRemindersDesc: '在活动开始前获得提醒',
      prayerReminders: '祷告提醒',
      prayerRemindersDesc: '每日祷告时间提醒',
      darkMode: '深色模式',
      darkModeDesc: '使用深色主题',
      language: '语言',
      languageDesc: '更改应用语言',
      editProfile: '编辑资料',
      editProfileDesc: '更新您的个人信息',
      myPrayerRequests: '我的个人祷告',
      myPrayerRequestsDesc: '查看和管理您的个人祷告',
      bookmarkedVerses: '书签经文',
      bookmarkedVersesDesc: '您保存的圣经经文',
      helpSupport: '帮助与支持',
      helpSupportDesc: '获取帮助或联系我们',
      sendFeedback: '发送反馈',
      sendFeedbackDesc: '帮助我们改进应用',
      about: '关于',
      aboutDesc: '应用版本和信息',
      signOut: '退出登录',
      signOutDesc: '退出您的账户',
      signOutConfirm: '您确定要退出登录吗？',
      cancel: '取消',
      signedOut: '已退出登录',
      version: '校园基督徒 v1.0.0',
      madeWith: '在爱里为校园福音工作打造 ❤️',
      featureComingSoon: '功能即将推出！',
    },
    
    // Common
    common: {
      loading: '加载中...',
      cancel: '取消',
      ok: '确定',
      save: '保存',
      delete: '删除',
      edit: '编辑',
      share: '分享',
      close: '关闭',
    },
    
    // Days and Months
    date: {
      monday: '周一',
      tuesday: '周二',
      wednesday: '周三',
      thursday: '周四',
      friday: '周五',
      saturday: '周六',
      sunday: '周日',
      january: '1月',
      february: '2月',
      march: '3月',
      april: '4月',
      may: '5月',
      june: '6月',
      july: '7月',
      august: '8月',
      september: '9月',
      october: '10月',
      november: '11月',
      december: '12月',
    },
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  // 支持插值的翻译函数
  const t = (key: string, ...args: (string | number)[]): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        break;
      }
    }
    
    if (typeof value === 'string' && args.length > 0) {
      // 处理占位符插值，支持 {0}, {1}, {2} 等
      return value.replace(/\{(\d+)\}/g, (match, index) => {
        const argIndex = parseInt(index, 10);
        return args[argIndex] !== undefined ? String(args[argIndex]) : match;
      });
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};