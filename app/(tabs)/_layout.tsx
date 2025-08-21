// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { HapticTab } from '../../components/HapticTab';
import { IconSymbol } from '../../components/ui/IconSymbol';
import { useLanguage } from '../../contexts/LanguageContext';
import { useColorScheme } from '../../hooks/useColorScheme';
import { useThemeColor } from '../../hooks/useThemeColor';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useLanguage();
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const inactiveColor = useThemeColor({}, 'tabIconDefault');

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tintColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: backgroundColor,
          borderTopColor: useThemeColor({}, 'icon'),
          borderTopWidth: 0.5,
          ...Platform.select({
            ios: {
              position: 'absolute' as const,
            },
            default: {},
          }),
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab.home'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: t('tab.events'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      {/* Profile tab 已移除 - 只通过Header访问 */}
    </Tabs>
  );
}