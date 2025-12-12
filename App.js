import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RegisterScreen from './screens/RegisterScreen';
import HabitScreen from './screens/HabitScreen';
import DashboardScreen from './screens/DashboardScreen';

const Stack = createStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null); // null = loading

  useEffect(() => {
    const checkHabits = async () => {
      try {
        const stored = await AsyncStorage.getItem('habits');
        const habits = stored ? JSON.parse(stored) : [];
        setInitialRoute(habits.length > 0 ? 'Dashboard' : 'Register');
      } catch (error) {
        console.error('Error checking habits:', error);
        setInitialRoute('Register'); // fallback
      }
    };
    checkHabits();
  }, []);

  if (initialRoute === null) {
    // Optional: Show a splash/loading screen here
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ title: 'Welcome to SpiritQuest' }} 
        />
        <Stack.Screen 
          name="Habit" 
          component={HabitScreen} 
          options={{ title: 'Create Habit' }} 
        />
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
          options={{ title: 'Dashboard' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}