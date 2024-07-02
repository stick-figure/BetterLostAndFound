import React, { useEffect } from 'react';
import {
  StyleSheet,
} from 'react-native';

import { createStackNavigator } from '@react-navigation/stack'
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from './source/components/Login';
import RegisterScreen from './source/components/Register';
import { ChatScreen } from './source/components/Chat';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorScreen } from './source/components/Error';
import { LoadingScreen } from './source/components/Loading';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from './source/components/Home';
import { auth } from './firebase';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTab() {
  return (
    <Tab.Navigator>
      <Tab.Screen name='Home' component={HomeScreen} />
      <Tab.Screen name='Chat' component={ChatScreen} />
    </Tab.Navigator>
  );
}

export function App() {
  let isLoggedIn: boolean = false;

  useEffect(() => {
      auth.onAuthStateChanged((user) => {
          if (user) {
            isLoggedIn = true;
          } else {
            isLoggedIn = false;
          }
      })
  });

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator>
          {/* Screens for logged in users */}
          <Stack.Group>
            <Stack.Screen name="HomeTab" options={{headerShown: false}} component={HomeTab} />
          </Stack.Group>
          {/* Auth screens */}
          <Stack.Group screenOptions={{ headerShown: false }}>
            <Stack.Screen name='Login' component={LoginScreen} />
            <Stack.Screen name='Register' component={RegisterScreen} />
          </Stack.Group>
          {/* Common modal screens */}
          <Stack.Group screenOptions={{ presentation: 'modal' }}>
            <Stack.Screen name="Error" component={ErrorScreen} />
          </Stack.Group>
        </Stack.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;