import React, { useEffect, useState } from 'react';
import {
    Image,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { DrawerActions, NavigationAction, NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { auth } from './ModularFirebase';

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
import { ItemViewScreen, ItemViewRouteParams } from './source/components/ItemView';
import { SettingsScreen } from './source/components/Settings';
import NewLostPostScreen from './source/components/NewLostPost';
import LostPostViewScreen, { PostViewRouteParams } from './source/components/LostPostView';
import SearchItemsScreen from './source/components/SearchItems';
import NewFoundPostScreen from './source/components/NewFoundPost';
import { Icon } from 'react-native-elements';
import { lightThemeColors } from './source/assets/Colors';
import PressableOpacity from './source/assets/MyElements';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function HomeTab() {
    return (
        <Tab.Navigator
            initialRouteName={'Bottom Tabs'}
            screenOptions={{
                tabBarActiveTintColor: lightThemeColors.primaryVibrant,
                tabBarActiveBackgroundColor: lightThemeColors.foreground,
                tabBarInactiveTintColor: lightThemeColors.dullGrey,
                tabBarInactiveBackgroundColor: lightThemeColors.foreground,
            }}>
            <Tab.Screen 
                name='Home' 
                component={HomeScreen} 
                options={{ 
                    title: "Home", 
                    headerShown: false, 
                    tabBarIcon: ({ focused, color, size }) => {
                        return <Icon name="home" type="material-community" size={size} color={color} />;
                    },
                }} />
            <Tab.Screen 
                name='Return Item' 
                component={ReturnItemScreen} 
                options={{
                    title: "Return Item", 
                    headerShown: false, 
                    tabBarIcon: ({ focused, color, size }) => {
                        return <Icon name="search" type="material-icons" size={size} color={color} />;
                    },
                }} />
            <Tab.Screen 
                name='My Items' 
                component={MyItemsScreen} 
                options={{ 
                    title: "My Items", 
                    headerShown: false, 
                    tabBarIcon({ focused, color, size }) {
                        return <Icon name="person" type="material-icons" size={size} color={color} />;
                    },
                }} />
        </Tab.Navigator>
    );
}
function MyDrawer() {
    return (
        <Drawer.Navigator
            initialRouteName={'Drawer'}
            screenOptions={{
                drawerType: "slide",
            }}>
            <Drawer.Screen 
                name='Home Tabs' 
                component={HomeTab} 
                options={{ 
                    
                    title: "Better Lost and Found", 
                    headerShown: true, 
                    drawerItemStyle: {
                        height: 150,
                        flexDirection: "column-reverse",
                    },
                    

                    drawerIcon({ focused, color, size }) {
                        if (focused) return (
                            <View style={{flexDirection: "row"}}>
                                <Text style={{fontSize: size, color: color, fontWeight: "700"}}>Better Lost and Found</Text>
                            </View>
                        );
                        return (
                            <Icon name="home" type="material-icons" size={size} color={color} />
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
                    title: "Notifications",
                    drawerIcon({ focused, color, size }) {
                        return <Icon name="notifications" type="material-icons" size={size} color={color} />;
                    },
                }} />
            <Drawer.Screen 
                name='Settings' 
                component={SettingsScreen} 
                options={{ 
                    title: "Settings", 
                    drawerIcon({ focused, color, size }) {
                        return <Icon name="settings" type="material-icons" size={size} color={color} />;
                    },
                }} />
        </Drawer.Navigator>
    );
}

function MyStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerTintColor: lightThemeColors.textLight,
                headerBackTitleStyle: {
                    color: lightThemeColors.primaryVibrant,
                },
                headerStyle: {
                    backgroundColor: lightThemeColors.foreground,
                    elevation: 0,
                    shadowOpacity: 0.5,
                    shadowOffset: {width: 3, height: 3},
                },
            }}>
            {/* Screens for logged in users */}
            <Stack.Group>
                <Stack.Screen name="Add Item" component={AddItemScreen} options={{ title: "Add Item" }} />
                <Stack.Screen name="Item View" options={({ route }) => ({
                    title: (route!.params as ItemViewRouteParams).itemName,
                    headerBackTitle: "Back",
                })}
                    component={ItemViewScreen} />
                <Stack.Screen name="Scan Code" component={ScanCodeScreen} options={{ title: "Scan Code" }} />
                <Stack.Screen name="New Lost Post" component={NewLostPostScreen} options={{ title: "New Post" }} />
                <Stack.Screen name="Lost Post View" component={LostPostViewScreen} options={{ title: "", headerShown: true }} />
                <Stack.Screen name="Search Items" component={SearchItemsScreen} options={{ title: "Search Items" }} />
                <Stack.Screen name="New Found Post" component={NewFoundPostScreen} options={{ title: "New Post" }} />
                <Stack.Screen name="Chat Room" component={ChatRoomScreen} options={({route, navigation}: {route: any, navigation: any}) => {
                    
                    return { 
                        title: route.params!.room.users.filter((user) => user._id != auth.currentUser?.uid)
                                                        .map((user) => user.name)
                                                        .join(", "), 
                        headerLeft(props) {
                            return (
                                <View style={{}}>
                                    <Image 
                                        source={{uri: route.params!.room.users.find((user) => user._id != auth.currentUser?.uid).pfpSrc}} 
                                        defaultSource={require("./source/assets/defaultpfp.jpg")} />
                                </View>
                            );
                        } 
                    };
                }} />
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
                <Stack.Navigator screenOptions={{headerShown: false}}>
                    <Stack.Screen name="My Drawer" component={MyDrawer} options={{title: "Home"}}/>
                    <Stack.Screen name="My Stack" component={MyStack} options={{title: ""}}/>
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default App;