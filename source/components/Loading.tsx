import firebase from 'firebase/compat/app';
import { useEffect, useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { auth, db } from '../../ModularFirebase';
import SafeAreaView from 'react-native-safe-area-view';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import { MyStackScreenProps } from '../navigation/Types';

export function LoadingScreen( {navigation, route}: MyStackScreenProps<'Loading'> ) {
    const isDarkMode = useColorScheme() === 'dark';
    const colors = isDarkMode ? DarkThemeColors : LightThemeColors;
    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.background,
        }
    }), [isDarkMode]);

    return (
        <SafeAreaView style={styles.container}>
            <ActivityIndicator size='large' color={colors.text} />
        </SafeAreaView>
    );
}

export default LoadingScreen;