import React, { useEffect } from 'react';
import {
  StyleSheet,
} from 'react-native';

import { NavigationAction, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { auth } from './firebase';

import { HomeScreen } from './source/components/Home';
import { LoginScreen } from './source/components/Login';
import { RegisterScreen } from './source/components/Register';
import { ChatScreen } from './source/components/Chat';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorScreen } from './source/components/Error';
import { LoadingScreen } from './source/components/Loading';
import { MyItemsScreen } from './source/components/MyItems';
import AddItemScreen from './source/components/AddItem';
import NotificationsScreen from './source/components/Notifications';
import ScanCodeScreen from './source/components/ScanCode';
import { ReturnItemScreen } from './source/components/ReturnItem';
import ItemInfoScreen from './source/components/ItemInfo';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTab() {
  return (
    <Tab.Navigator>
      <Tab.Screen name='Home' component={HomeScreen} />
      <Tab.Screen name='My Items' component={MyItemsScreen} />
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
            <Stack.Screen name="Home Tab" options={{headerShown: false}} component={HomeTab} />

            <Stack.Screen name="Add Item" component={AddItemScreen} />
            <Stack.Screen name="Return Item" component={ReturnItemScreen} />
            <Stack.Screen name="Item Info" component={ItemInfoScreen} />
            <Stack.Screen name="Scan Code" component={ScanCodeScreen} />
          </Stack.Group>
          {/* Auth screens */}
          <Stack.Group screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </Stack.Group>
          {/* Common modal screens */}
          <Stack.Group screenOptions={{ presentation: 'modal' }}>
            <Stack.Screen name="Error" component={ErrorScreen} />
            <Stack.Screen name="Loading" component={LoadingScreen} />
          </Stack.Group>
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;