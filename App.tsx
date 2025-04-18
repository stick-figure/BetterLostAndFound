import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
} from 'react-native';

import { NavigationAction, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { auth } from './my_firebase';

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
import LostPostViewScreen, { PostViewRouteParams } from './source/components/LostPostView';
import SearchItemsScreen from './source/components/SearchItems';
import NewFoundPostScreen from './source/components/NewFoundPost';
import { Icon } from 'react-native-elements';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTab() {
    return (
        <Tab.Navigator
            initialRouteName={'Bottom Tabs'}>
            <Tab.Screen 
                name='Home' 
                component={HomeScreen} 
                options={{ 
                    title: "Home", 
                    headerShown: false, 
                    tabBarIcon: ({ focused, color, size }) => {
                        return <Icon name="home" type="material-community" size={size} color={color} />;
                    },
                }} 
            />
            <Tab.Screen 
                name='Search Items' 
                component={SearchItemsScreen} 
                options={{
                    title: "Search Items", 
                    headerShown: false, 
                    tabBarIcon: ({ focused, color, size }) => {
                        return <Icon name="search" type="material-icons" size={size} color={color} />;
                    },
                }}
                />
            <Tab.Screen 
                name='My Items' 
                component={MyItemsScreen} 
                options={{ 
                    title: "My Items", 
                    headerShown: false, 
                    tabBarIcon: ({ focused, color, size }) => {
                        return <Icon name="person" type="material-icons" size={size} color={color} />;
                    },
                }}
                />
            <Tab.Screen name='Settings' component={SettingsScreen} options={{ title: "Settings" }} />
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
                        <Stack.Screen name="Bottom Tabs" options={{ title: "Home", headerShown: false }} component={HomeTab} />

                        <Stack.Screen name="Add Item" component={AddItemScreen} options={{ title: "Add Item" }} />
                        <Stack.Screen name="Return Item" component={ReturnItemScreen} options={{ title: "Return Item", headerBackTitle: "Back" }} />
                        <Stack.Screen name="Item View" options={({ route }) => ({
                            title: (route!.params as ItemViewRouteParams).itemName,
                            headerBackTitle: "My Items",
                        })}
                            component={ItemViewScreen} />
                        <Stack.Screen name="Scan Code" component={ScanCodeScreen} options={{ title: "Scan Code" }} />
                        <Stack.Screen name="New Lost Post" component={NewLostPostScreen} options={{ title: "New Post" }} />
                        <Stack.Screen name="Lost Post View" component={LostPostViewScreen} options={({ route }) => ({
                            title: "Missing " + (route!.params as PostViewRouteParams).item.name,
                        })} />
                        <Stack.Screen name="Search Items" component={SearchItemsScreen} options={{ title: "Search Items" }} />
                        <Stack.Screen name="New Found Post" component={NewFoundPostScreen} options={{ title: "New Post" }} />
                        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "Chat" }} />
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