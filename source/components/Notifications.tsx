import { useMemo } from 'react';
import { View, Button, StyleSheet, useColorScheme } from 'react-native';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';


function NotificationsScreen({ navigation }: {navigation: any}) {
    
    const isDarkMode = useColorScheme() === 'dark';
    const colors = isDarkMode ? DarkThemeColors : LightThemeColors;
    const styles = useMemo(() => StyleSheet.create({

    }), [isDarkMode]);
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Button onPress={() => navigation.goBack()} title='im skibidi and i know it' />
        </View>
    );
}

export default NotificationsScreen;