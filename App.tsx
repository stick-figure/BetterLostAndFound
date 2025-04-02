import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
} from 'react-native';

import { NavigationAction, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { auth } from './firebase';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HomeScreen } from './source/components/Home';
import { LoginScreen } from './source/components/Login';
import { RegisterScreen } from './source/components/Register';
import { ChatScreen } from './source/components/Chat';
import { ErrorScreen } from './source/components/Error';
import { LoadingScreen } from './source/components/Loading';
import { MyItemsScreen } from './source/components/MyItems';
import { AddItemScreen } from './source/components/AddItem';
import NotificationsScreen from './source/components/Notifications';
import { ScanCodeScreen } from './source/components/ScanCode';
import { ReturnItemScreen } from './source/components/ReturnItem';
import { ItemViewScreen, ItemViewRouteParams } from './source/components/ItemView';
import { SettingsScreen } from './source/components/Settings';
import NewLostPostScreen from './source/components/NewLostPost';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTab() {
    return (
        <Tab.Navigator
            initialRouteName={'Home Tab'}>
            <Tab.Screen name='Home' component={HomeScreen} options={{ title: "Home" }} />
            <Tab.Screen name='My Items' component={MyItemsScreen} options={{ title: "My Items" }} />
            <Tab.Screen name='Settings' component={SettingsScreen} options={{ title: "Settings" }} />
            {/*<Tab.Screen name='Chat' component={ChatScreen} />*/}
        </Tab.Navigator>
    );
}

export function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    /*
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setIsLoggedIn(true);
            } else {
                setIsLoggedIn(false);
            }
        });

        return unsubscribe;
    }, []);*/

    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <Stack.Navigator>
                    {/* Screens for logged in users */}
                    <Stack.Group>
                        <Stack.Screen name="Home Tab" options={{ title: "Home", headerShown: false }} component={HomeTab} />

                        <Stack.Screen name="Add Item" component={AddItemScreen} options={{ title: "Add Item" }} />
                        <Stack.Screen name="Return Item" component={ReturnItemScreen} options={{ title: "Return Item", headerBackTitle: "Back" }} />
                        <Stack.Screen name="Item View" options={({ route }) => ({
                            title: (route!.params as ItemViewRouteParams).itemName,
                            headerBackTitle: "My Items",
                        })}
                            component={ItemViewScreen} />
                        <Stack.Screen name="Scan Code" component={ScanCodeScreen} options={{ title: "Scan Code" }} />
                        <Stack.Screen name="New Lost Post" component={NewLostPostScreen} options={{ title: "New Post" }} />
                    </Stack.Group>
                    
                    {/* Auth screens */}
                    <Stack.Group screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Login" }} />
                        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Register" }} />
                    </Stack.Group>

                    

                    {/* Common modal screens */}
                    <Stack.Group screenOptions={{ presentation: 'modal' }}>
                        <Stack.Screen name="Error" component={ErrorScreen} options={{ title: "Error" }} />
                        <Stack.Screen name="Loading" component={LoadingScreen} options={{ title: "Loading" }} />
                    </Stack.Group>

                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default App;