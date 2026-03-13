import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import ScenariosScreen from '../screens/ScenariosScreen';
import TrainingCallScreen from '../screens/TrainingCallScreen';
import AnalysisScreen from '../screens/AnalysisScreen';
import HistoryScreen from '../screens/HistoryScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import GuidelinesScreen from '../screens/GuidelinesScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ color: focused ? '#3B82F6' : '#64748B', fontSize: 18 }}>
      {label}
    </Text>
  );
}

function MainTabs({ user }: { user: any }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1E293B',
          borderTopColor: '#334155',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#64748B',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ focused }) => <TabIcon label="⌂" focused={focused} />,
        }}
      >
        {(props) => (
          <DashboardScreen {...props} userName={user?.name} />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Historial',
          tabBarIcon: ({ focused }) => <TabIcon label="☰" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AnalyticsTab"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ focused }) => <TabIcon label="◈" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="GuidelinesTab"
        component={GuidelinesScreen}
        options={{
          tabBarLabel: 'Guidelines',
          tabBarIcon: ({ focused }) => <TabIcon label="✎" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ user }: { user: any }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0F172A' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Main">
        {() => <MainTabs user={user} />}
      </Stack.Screen>
      <Stack.Screen name="Scenarios" component={ScenariosScreen} />
      <Stack.Screen
        name="Training"
        component={TrainingCallScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="Analysis" component={AnalysisScreen} />
    </Stack.Navigator>
  );
}
