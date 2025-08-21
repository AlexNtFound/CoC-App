import React, { createContext, ReactNode, useContext, useState } from 'react';

export type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 翻译数据
const translations = {
  en: {
    // Tab Navigation
    'tab.home': 'Home',
    'tab.bible': 'Bible',
    'tab.events': 'Events',
    'tab.profile': 'Profile',
    
    // Home Screen
    'home.title': 'Christians on Campus',
    'home.welcome': 'Welcome back!',
    'home.announcements': 'Recent Announcements',
    'home.events': 'Upcoming Events',
    'home.quickActions': 'Quick Actions',
    'home.readBible': '📖 Read Bible',
    'home.prayerRequest': '🙏 Prayer Request',
    'home.by': 'By',
    
    // Bible Screen
    'bible.title': 'Bible',
    'bible.selectBook': 'Select Book',
    'bible.back': '← Back',
    'bible.home': '← Home',
    'bible.searchVerses': 'Search verses...',
    'bible.chapter': 'Chapter',
    'bible.prev': '← Prev',
    'bible.next': 'Next →',
    'bible.loading': 'Loading...',
    'bible.chapters': 'chapters',
    'bible.verseOptions': 'Verse Options',
    'bible.bookmark': 'Bookmark',
    'bible.share': 'Share',
    'bible.bookmarked': 'Bookmarked!',
    'bible.bookmarkFeature': 'Bookmark feature coming soon!',
    'bible.shareFeature': 'Share feature coming soon!',
    'bible.searchFeature': 'Search feature coming soon!',
    
    // Events Screen
    'events.title': 'Events',
    'events.add': '+ Add',
    'events.searchEvents': 'Search events...',
    'events.all': 'All',
    'events.worship': 'Worship',
    'events.study': 'Study',
    'events.fellowship': 'Fellowship',
    'events.outreach': 'Outreach',
    'events.prayer': 'Prayer',
    'events.today': 'TODAY',
    'events.soon': 'SOON',
    'events.attending': 'attending',
    'events.rsvp': 'RSVP',
    'events.cancelRsvp': 'Cancel RSVP',
    'events.noEvents': 'No events found',
    'events.adjustFilters': 'Try adjusting your filters',
    'events.eventDetails': 'Event Details',
    'events.date': 'Date:',
    'events.time': 'Time:',
    'events.location': 'Location:',
    'events.organizer': 'Organizer:',
    'events.attendees': 'Attendees:',
    'events.people': 'people',
    'events.rsvpForEvent': 'RSVP for this Event',
    'events.shareEvent': '📤 Share Event',
    'events.rsvpConfirmed': 'RSVP Confirmed',
    'events.rsvpCancelled': 'RSVP Cancelled',
    'events.rsvpConfirmedMessage': 'You have successfully RSVP\'d for',
    'events.rsvpCancelledMessage': 'You have cancelled your RSVP for',
    'events.addEventFeature': 'Add event feature coming soon!',
    'events.shareFeature': 'Share feature coming soon!',
    
    // Profile Screen
    'profile.title': 'Profile',
    'profile.edit': 'Edit',
    'profile.campus': '🎓 Campus:',
    'profile.year': '📚 Year:',
    'profile.joined': '📅 Joined:',
    'profile.myActivity': 'My Activity',
    'profile.eventsAttended': 'Events Attended',
    'profile.studiesCompleted': 'Studies Completed',
    'profile.prayerRequests': 'Prayer Requests',
    'profile.notifications': 'Notifications',
    'profile.appearance': 'Appearance',
    'profile.account': 'Account',
    'profile.support': 'Support',
    'profile.accountActions': 'Account Actions',
    'profile.pushNotifications': 'Push Notifications',
    'profile.pushNotificationsDesc': 'Receive notifications for events and updates',
    'profile.eventReminders': 'Event Reminders',
    'profile.eventRemindersDesc': 'Get reminded before events start',
    'profile.prayerReminders': 'Prayer Reminders',
    'profile.prayerRemindersDesc': 'Daily prayer time reminders',
    'profile.darkMode': 'Dark Mode',
    'profile.darkModeDesc': 'Use dark theme',
    'profile.language': 'Language',
    'profile.languageDesc': 'Change app language',
    'profile.editProfile': 'Edit Profile',
    'profile.editProfileDesc': 'Update your personal information',
    'profile.myPrayerRequests': 'My Prayer Requests',
    'profile.myPrayerRequestsDesc': 'View and manage your prayer requests',
    'profile.bookmarkedVerses': 'Bookmarked Verses',
    'profile.bookmarkedVersesDesc': 'Your saved Bible verses',
    'profile.helpSupport': 'Help & Support',
    'profile.helpSupportDesc': 'Get help or contact us',
    'profile.sendFeedback': 'Send Feedback',
    'profile.sendFeedbackDesc': 'Help us improve the app',
    'profile.about': 'About',
    'profile.aboutDesc': 'App version and information',
    'profile.signOut': 'Sign Out',
    'profile.signOutDesc': 'Sign out of your account',
    'profile.signOutConfirm': 'Are you sure you want to sign out?',
    'profile.cancel': 'Cancel',
    'profile.signedOut': 'Signed Out',
    'profile.version': 'Christians on Campus v1.0.0',
    'profile.madeWith': 'Made with ❤️ for campus ministry',
    'profile.featureComingSoon': 'feature coming soon!',
    
    // Common
    'common.loading': 'Loading...',
    'common.cancel': 'Cancel',
    'common.ok': 'OK',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.share': 'Share',
    'common.close': 'Close',
    
    // Days and Months
    'date.monday': 'Mon',
    'date.tuesday': 'Tue',
    'date.wednesday': 'Wed',
    'date.thursday': 'Thu',
    'date.friday': 'Fri',
    'date.saturday': 'Sat',
    'date.sunday': 'Sun',
    'date.january': 'Jan',
    'date.february': 'Feb',
    'date.march': 'Mar',
    'date.april': 'Apr',
    'date.may': 'May',
    'date.june': 'Jun',
    'date.july': 'Jul',
    'date.august': 'Aug',
    'date.september': 'Sep',
    'date.october': 'Oct',
    'date.november': 'Nov',
    'date.december': 'Dec',
  },
  zh: {
    // Tab Navigation
    'tab.home': '主页',
    'tab.bible': '圣经',
    'tab.events': '活动',
    'tab.profile': '个人',
    
    // Home Screen
    'home.title': '校园基督徒',
    'home.welcome': '欢迎回来！',
    'home.announcements': '最新公告',
    'home.events': '即将举行的活动',
    'home.quickActions': '快捷操作',
    'home.readBible': '📖 阅读圣经',
    'home.prayerRequest': '🙏 祷告请求',
    'home.by': '发布者',
    
    // Bible Screen
    'bible.title': '圣经',
    'bible.selectBook': '选择书卷',
    'bible.back': '← 返回',
    'bible.home': '← 主页',
    'bible.searchVerses': '搜索经文...',
    'bible.chapter': '第 {0} 章',
    'bible.prev': '← 上一章',
    'bible.next': '下一章 →',
    'bible.loading': '加载中...',
    'bible.chapters': '章',
    'bible.verseOptions': '经文选项',
    'bible.bookmark': '书签',
    'bible.share': '分享',
    'bible.bookmarked': '已添加书签！',
    'bible.bookmarkFeature': '书签功能即将推出！',
    'bible.shareFeature': '分享功能即将推出！',
    'bible.searchFeature': '搜索功能即将推出！',
    
    // Events Screen
    'events.title': '活动',
    'events.add': '+ 添加',
    'events.searchEvents': '搜索活动...',
    'events.all': '全部',
    'events.worship': '敬拜',
    'events.study': '查经',
    'events.fellowship': '团契',
    'events.outreach': '外展',
    'events.prayer': '祷告',
    'events.today': '今天',
    'events.soon': '即将',
    'events.attending': '人参加',
    'events.rsvp': '报名',
    'events.cancelRsvp': '取消报名',
    'events.noEvents': '未找到活动',
    'events.adjustFilters': '请尝试调整筛选条件',
    'events.eventDetails': '活动详情',
    'events.date': '日期：',
    'events.time': '时间：',
    'events.location': '地点：',
    'events.organizer': '组织者：',
    'events.attendees': '参与者：',
    'events.people': '人',
    'events.rsvpForEvent': '报名参加此活动',
    'events.shareEvent': '📤 分享活动',
    'events.rsvpConfirmed': '报名成功',
    'events.rsvpCancelled': '取消报名',
    'events.rsvpConfirmedMessage': '您已成功报名参加',
    'events.rsvpCancelledMessage': '您已取消报名',
    'events.addEventFeature': '添加活动功能即将推出！',
    'events.shareFeature': '分享功能即将推出！',
    
    // Profile Screen
    'profile.title': '个人资料',
    'profile.edit': '编辑',
    'profile.campus': '🎓 校园：',
    'profile.year': '📚 年级：',
    'profile.joined': '📅 加入时间：',
    'profile.myActivity': '我的活动',
    'profile.eventsAttended': '参加活动',
    'profile.studiesCompleted': '完成查经',
    'profile.prayerRequests': '祷告请求',
    'profile.notifications': '通知',
    'profile.appearance': '外观',
    'profile.account': '账户',
    'profile.support': '支持',
    'profile.accountActions': '账户操作',
    'profile.pushNotifications': '推送通知',
    'profile.pushNotificationsDesc': '接收活动和更新通知',
    'profile.eventReminders': '活动提醒',
    'profile.eventRemindersDesc': '在活动开始前获得提醒',
    'profile.prayerReminders': '祷告提醒',
    'profile.prayerRemindersDesc': '每日祷告时间提醒',
    'profile.darkMode': '深色模式',
    'profile.darkModeDesc': '使用深色主题',
    'profile.language': '语言',
    'profile.languageDesc': '更改应用语言',
    'profile.editProfile': '编辑资料',
    'profile.editProfileDesc': '更新您的个人信息',
    'profile.myPrayerRequests': '我的祷告请求',
    'profile.myPrayerRequestsDesc': '查看和管理您的祷告请求',
    'profile.bookmarkedVerses': '书签经文',
    'profile.bookmarkedVersesDesc': '您保存的圣经经文',
    'profile.helpSupport': '帮助与支持',
    'profile.helpSupportDesc': '获取帮助或联系我们',
    'profile.sendFeedback': '发送反馈',
    'profile.sendFeedbackDesc': '帮助我们改进应用',
    'profile.about': '关于',
    'profile.aboutDesc': '应用版本和信息',
    'profile.signOut': '退出登录',
    'profile.signOutDesc': '退出您的账户',
    'profile.signOutConfirm': '您确定要退出登录吗？',
    'profile.cancel': '取消',
    'profile.signedOut': '已退出登录',
    'profile.version': '校园基督徒 v1.0.0',
    'profile.madeWith': '为校园事工社区用心打造 ❤️',
    'profile.featureComingSoon': '功能即将推出！',
    
    // Common
    'common.loading': '加载中...',
    'common.cancel': '取消',
    'common.ok': '确定',
    'common.save': '保存',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.share': '分享',
    'common.close': '关闭',
    
    // Days and Months
    'date.monday': '周一',
    'date.tuesday': '周二',
    'date.wednesday': '周三',
    'date.thursday': '周四',
    'date.friday': '周五',
    'date.saturday': '周六',
    'date.sunday': '周日',
    'date.january': '1月',
    'date.february': '2月',
    'date.march': '3月',
    'date.april': '4月',
    'date.may': '5月',
    'date.june': '6月',
    'date.july': '7月',
    'date.august': '8月',
    'date.september': '9月',
    'date.october': '10月',
    'date.november': '11月',
    'date.december': '12月',
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        break;
      }
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