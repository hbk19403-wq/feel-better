import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { Colors } from '../../src/constants/colors';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text style={{ fontSize: 10, color: focused ? Colors.primaryMid : Colors.textSecondary, fontWeight: focused ? '700' : '400' }}>
        {label}
      </Text>
    </View>
  );
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 80,
          paddingBottom: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} /> }}
      />
      <Tabs.Screen
        name="match"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🤝" label="Connect" focused={focused} /> }}
      />
      <Tabs.Screen
        name="resources"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📚" label="Library" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Me" focused={focused} /> }}
      />
      <Tabs.Screen name="session" options={{ href: null }} />
    </Tabs>
  );
}
