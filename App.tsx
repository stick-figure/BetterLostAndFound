import React, { useEffect, useState } from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack'
import { RootStackParamList } from './source/navigation/Types';

import { SafeAreaProvider } from 'react-native-safe-area-view';

import MyDrawer from './source/navigation/MyDrawer';
import MyStack from './source/navigation/MyStack';

const RootStack = createStackNavigator<RootStackParamList>();

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