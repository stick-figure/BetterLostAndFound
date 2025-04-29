import { useMemo } from 'react';
import { View, Button, StyleSheet, useColorScheme } from 'react-native';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import { MyDrawerScreenProps } from '../navigation/Types';
import { useNavigation } from '@react-navigation/native';


function NotificationsScreen({navigation, route}: MyDrawerScreenProps<'Notifications'>) {
    const isDarkMode = useColorScheme() === 'dark';
    const colors = isDarkMode ? DarkThemeColors : LightThemeColors;
    const styles = useMemo(() => StyleSheet.create({

    }), [isDarkMode]);
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Button onPress={() => navigation.goBack()} title='work in progress' />
        </View>
    );
}

export default NotificationsScreen;