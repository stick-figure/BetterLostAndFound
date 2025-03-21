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
import { AddItemScreen } from './source/components/AddItem';
import NotificationsScreen from './source/components/Notifications';
import { ScanCodeScreen } from './source/components/ScanCode';
import { ReturnItemScreen } from './source/components/ReturnItem';
import {ItemInfoScreen, ItemInfoRouteParams } from './source/components/ItemInfo';
import { SettingsScreen } from './source/components/Settings';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTab() {
  return (
    <Tab.Navigator>
      <Tab.Screen name='Home' component={HomeScreen} options={{title: "Home"}} />
      <Tab.Screen name='My Items' component={MyItemsScreen} options={{title: "My Items"}} />
      <Tab.Screen name='Settings' component={SettingsScreen} options={{title: "Settings"}} />
      {/*<Tab.Screen name='Chat' component={ChatScreen} />*/}
    </Tab.Navigator>
  );
}

export function App() {
  let isLoggedIn: boolean = false;

  useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
          if (user) {
            isLoggedIn = true;
          } else {
            isLoggedIn = false;
          }
      });
      return unsubscribe;
  });

  return (
    <SafeAreaProvider>
      <NavigationContainer>

        {/* Auth screens */}
        <Stack.Navigator> 
          <Stack.Group screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} options={{title: "Login"}} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{title: "Register"}} />
          </Stack.Group>

          {/* Screens for logged in users */}
          <Stack.Group>
            <Stack.Screen name="Home Tab" options={{title: "Home", headerShown: false}} component={HomeTab}  />

            <Stack.Screen name="Add Item" component={AddItemScreen} options={{title: "Add Item"}} />
            <Stack.Screen name="Return Item" component={ReturnItemScreen} options={{title: "Return Item"}} />
            <Stack.Screen name="Item Info" options={({ route }) => ({ 
                title: (route!.params as ItemInfoRouteParams).itemName,
                headerBackTitle: "My Items",
              })} 
              component={ItemInfoScreen} />
            <Stack.Screen name="Scan Code" component={ScanCodeScreen} options={{title: "Scan Code"}} />
          </Stack.Group>

          {/* Common modal screens */}
          <Stack.Group screenOptions={{ presentation: 'modal' }}>
            <Stack.Screen name="Error" component={ErrorScreen} options={{title: "Error"}}/>
            <Stack.Screen name="Loading" component={LoadingScreen} options={{title: "Loading"}}/>
          </Stack.Group>

        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;