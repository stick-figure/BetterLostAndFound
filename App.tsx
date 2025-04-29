import React, { useEffect, useState } from 'react';
import {
    Image,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from 'react-native';

import { DarkTheme, DefaultTheme, DrawerActions, NavigationAction, NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { auth } from './ModularFirebase';
import { HomeTabParamList, MyDrawerParamList, MyStackParamList, RootStackParamList } from './source/navigation/Types';

import { SafeAreaProvider } from 'react-native-safe-area-view';

import { HomeScreen } from './source/components/Home';
import { LoginScreen } from './source/components/Login';
import { RegisterScreen } from './source/components/Register';
import { ChatRoomScreen } from './source/components/ChatRoom';
import { ErrorScreen } from './source/components/Error';
import { LoadingScreen } from './source/components/Loading';
import { MyItemsScreen } from './source/components/MyItems';
import { AddItemScreen } from './source/components/AddItem';
import NotificationsScreen from './source/components/Notifications';
import { ScanCodeScreen } from './source/components/ScanCode';
import { ReturnItemScreen } from './source/components/ReturnItem';
import { ViewItemScreen } from './source/components/ViewItem';
import { SettingsScreen } from './source/components/Settings';
import NewLostPostScreen from './source/components/NewLostPost';
import ViewLostPostScreen from './source/components/ViewLostPost';
import SearchItemsScreen from './source/components/SearchItems';
import NewFoundPostScreen from './source/components/NewFoundPost';
import { Icon } from 'react-native-elements';
import { DarkThemeColors, LightThemeColors } from './source/assets/Colors';
import { PostLostItemScreen } from './source/components/PostLostItem';
import MyChatRoomsScreen from './source/components/MyChatRooms';
import { PressableOpacity } from './source/hooks/MyElements';
import WhoFoundScreen from './source/components/WhoFound';

const RootStack = createStackNavigator<RootStackParamList>();
const Stack = createStackNavigator<MyStackParamList>();
const Tab = createBottomTabNavigator<HomeTabParamList>();
const Drawer = createDrawerNavigator<MyDrawerParamList>();

function HomeTab() {
    const scheme = useColorScheme();
    const colors = scheme === 'dark' ? DarkThemeColors : LightThemeColors;

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false, 
                tabBarActiveTintColor: colors.primary,
                tabBarActiveBackgroundColor: colors.card,
                tabBarInactiveTintColor: colors.border,
                tabBarInactiveBackgroundColor: colors.card,
                headerStyle: {
                    backgroundColor: colors.card,
                },
                tabBarStyle: {
                    backgroundColor: colors.card,
                }
            }}
            initialRouteName={'Home'}>
            <Tab.Screen 
                name='Home' 
                component={HomeScreen} 
                options={{ 
                    title: 'Home', 
                    headerShown: false, 
                    tabBarIcon: ({ focused, color, size }) => {
                        return <Icon name={focused ? 'home' : 'home-outline'} type='material-community' size={size} color={color} />;
                    },
                }} />
            <Tab.Screen 
                name='Post Lost Item' 
                component={PostLostItemScreen} 
                options={{ 
                    title: 'Post Lost Item', 
                    headerShown: false, 
                    tabBarIcon: ({ focused, color, size }) => {
                        if (focused) return <Icon name='post' type='material-community' size={size} color={color} />;
                        return <Icon name='post-outline' type='material-community' size={size} color={color} />;
                    },
                }} />
            <Tab.Screen 
                name='Return Item' 
                component={ReturnItemScreen} 
                options={{
                    title: 'Return Item', 
                    headerShown: false, 
                    tabBarIcon: ({ focused, color, size }) => {
                        if (focused) return <Icon name='hand-holding-heart' type='font-awesome-5' size={size} color={color} />;
                        return <Icon name='hand-holding' type='font-awesome-5' size={size} color={color} />;
                    },
                }} />
            <Tab.Screen 
                name='My Chat Rooms' 
                component={MyChatRoomsScreen} 
                options={{ 
                    title: 'Chats', 
                    headerShown: false, 
                    tabBarIcon({ focused, color, size }) {
                        return <Icon name={focused ? 'message' : 'message-outline'} type='material-community' size={size} color={color} />;
                    },
                }} />
            <Tab.Screen 
                name='My Items' 
                component={MyItemsScreen} 
                options={{ 
                    title: 'My Stuff', 
                    headerShown: false, 
                    tabBarIcon({ focused, color, size }) {
                        return <Icon name={focused ? 'person' : 'person-outline'} type='material-icons' size={size} color={color} />;
                    },
                }} />
        </Tab.Navigator>
    );
}
function MyDrawer() {
    const scheme = useColorScheme();
    const colors = scheme === 'dark' ? DarkThemeColors : LightThemeColors;
    const navigation = useNavigation();

    return (
        <Drawer.Navigator
            screenOptions={{
                drawerType: 'slide',
                drawerActiveTintColor: colors.primary,
                headerTitleStyle: {
                    color: colors.text,
                },
                headerStyle: {
                    backgroundColor: colors.card,
                    elevation: 0,
                    shadowOpacity: 0.5,
                    shadowOffset: {width: 3, height: 3},
                },
                drawerStyle: {
                    backgroundColor: colors.card,
                },
                drawerInactiveTintColor: colors.text,
                headerTintColor: colors.primary,
                headerLeft: ({ tintColor, pressColor, pressOpacity, labelVisible }) => {
                    return (
                        <PressableOpacity 
                            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                            activeOpacity={pressOpacity}
                            style={{
                                height: '100%', 
                                alignItems: 'stretch', 
                                justifyContent: 'center',
                                aspectRatio: 1}}>
                            <Icon name='menu' type='material-icons' size={24} color={tintColor} />
                        </PressableOpacity>
                    );
                },
            }}
            initialRouteName={'Home Tabs'}
            >
            <Drawer.Screen 
                name='Home Tabs' 
                component={HomeTab} 
                options={{
                    title: 'Home Tabs',
                    headerTitle: 'Better Lost and Found', 
                    headerShown: true, 
                    drawerItemStyle: {
                        height: 150,
                        flexDirection: 'column-reverse',
                    },
                    

                    drawerIcon({ focused, color, size }) {
                        if (focused) return (
                            <View style={{flexDirection: 'row'}}>
                                <Text style={{fontSize: size, color: color, fontWeight: '700'}}>Better Lost and Found</Text>
                            </View>
                        );
                        return (
                            <Icon name='home' type='material-icons' size={size} color={color} />
                        );
                    },
                    drawerLabel({ focused, color }) {
                        if (focused) return (
                            <Text></Text>
                        );
                        return (
                            <Text style={{color: color}}>Home</Text>
                        );
                    },
                }} />
            <Drawer.Screen 
                name='Notifications' 
                component={NotificationsScreen} 
                options={{ 
                    title: 'Notifications',
                    headerTitle: 'Notifications',
                    drawerIcon({ focused, color, size }) {
                        return <Icon name='notifications' type='material-icons' size={size} color={color} />;
                    },
                }} />
            <Drawer.Screen 
                name='Settings' 
                component={SettingsScreen} 
                options={{ 
                    title: 'Settings',
                    headerTitle: 'Settings', 
                    drawerIcon({ focused, color, size }) {
                        return <Icon name='settings' type='material-icons' size={size} color={color} />;
                    },
                }} />
        </Drawer.Navigator>
    );
}

function MyStack() {
    const scheme = useColorScheme();
    const colors = scheme === 'dark' ? DarkThemeColors : LightThemeColors;

    return (
        <Stack.Navigator
            screenOptions={{
                headerTintColor: colors.text,
                headerBackTitleStyle: {
                    color: colors.primary,
                },
                headerStyle: {
                    backgroundColor: colors.card,
                    elevation: 0,
                    shadowOpacity: 0.5,
                    shadowOffset: {width: 3, height: 3},
                },
            }}
            initialRouteName={'Login'}
            >
            {/* Screens for logged in users */}
            <Stack.Group>
                <Stack.Screen name='Add Item' component={AddItemScreen} options={{ title: 'Add Item' }} />
                <Stack.Screen name='View Item' options={({ route }) => ({
                    title: route.params?.itemName,
                    headerBackTitle: 'Back',
                    headerShown: false,
                })}
                    component={ViewItemScreen} />
                <Stack.Screen name='Scan Code' component={ScanCodeScreen} options={{ title: 'Scan Code' }} />
                <Stack.Screen name='New Lost Post' component={NewLostPostScreen} options={{ title: 'New Post' }} />
                <Stack.Screen name='View Lost Post' component={ViewLostPostScreen} options={{ title: 'View Lost Post', headerShown: false }} />
                <Stack.Screen name='Search Items' component={SearchItemsScreen} options={{ 
                    title: 'Search Items', 
                    headerShown: false}} />
                <Stack.Screen name='New Found Post' component={NewFoundPostScreen} options={{ title: 'New Post' }} />
                <Stack.Screen name='Chat Room' component={ChatRoomScreen} options={{title: 'Chat Room'}} />
            </Stack.Group>
            
            {/* Auth screens */}
            <Stack.Group screenOptions={{ headerShown: false }}>
                <Stack.Screen name='Login' component={LoginScreen} options={{ title: 'Login' }} />
                <Stack.Screen name='Register' component={RegisterScreen} options={{ title: 'Register' }} />
            </Stack.Group>

            

            {/* Common modal screens */}
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
                <Stack.Screen name='Error' component={ErrorScreen} options={{ title: 'Error' }} />
                <Stack.Screen name='Loading' component={LoadingScreen} options={{ title: 'Loading' }} />
                <Stack.Screen name='Who Found' component={WhoFoundScreen} options={{ title: 'Who found your item?' }} />
            </Stack.Group>
        </Stack.Navigator>
    );
}

export function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <RootStack.Navigator 
                    initialRouteName={'My Stack'}
                    screenOptions={{headerShown: false}}>
                    <RootStack.Screen name='My Drawer' component={MyDrawer} options={{title: 'My Drawer'}}/>
                    <RootStack.Screen name='My Stack' component={MyStack} options={{title: 'My Stack'}}/>
                </RootStack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default App;