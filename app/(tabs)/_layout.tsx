import { Tabs } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const tabBarStyle = {
  position: 'absolute' as const,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%' as const,
  margin: 0,
  padding: 0,
  borderRadius: 0,
  elevation: 0,
  shadowOpacity: 0,
  shadowOffset: { width: 0, height: 0 },
  shadowRadius: 0,
  borderTopWidth: 1,
  borderTopColor: '#eee',
  height: 65,
  backgroundColor: '#fff',
};

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle,
          tabBarItemStyle: {
            flex: 1,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            marginBottom: 4,
          },
        }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
    </SafeAreaView>
  );
}
