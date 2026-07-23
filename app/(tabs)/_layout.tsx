import React from 'react';
import { View } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import FloatingTabBar from '@/components/FloatingTabBar';
import type { TabBarItem } from '@/components/FloatingTabBar';

const TABS: TabBarItem[] = [
  { name: '(home)', route: '/(tabs)/(home)', icon: 'home', label: 'Today' },
  { name: '(map)', route: '/(tabs)/(map)', icon: 'map', label: 'Map' },
  { name: '(insights)', route: '/(tabs)/(insights)', icon: 'insights', label: 'Insights' },
  { name: '(profile)', route: '/(tabs)/(profile)', icon: 'person', label: 'Profile' },
];

export default function TabLayout() {
  const pathname = usePathname();
  const hideTabBar = pathname.startsWith('/checkin') || pathname.startsWith('/report') || pathname.startsWith('/insights/');

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen name="(home)" />
        <Stack.Screen name="(map)" />
        <Stack.Screen name="(insights)" />
        <Stack.Screen name="(profile)" />
      </Stack>
      {!hideTabBar && (
        <FloatingTabBar
          tabs={TABS}
          containerWidth={340}
          borderRadius={35}
          bottomMargin={20}
        />
      )}
    </View>
  );
}
