import React, { useMemo, useState } from 'react';
import { Button, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import { useNavigation, useRoute, useTheme } from '@react-navigation/native';


export function ErrorScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const isDarkMode = useColorScheme() === 'dark';
    const colors = isDarkMode ? DarkThemeColors : LightThemeColors;
    const styles = useMemo(() => StyleSheet.create({
        container: {
            backgroundColor: colors.background,
        },
        text: {
            color: colors.text,
        },
        button: {
            color: colors.primary,
        },
    }), [isDarkMode]);

    return (
        <View style={styles.container}>
            <Text style={styles.text}>{route.params!.code}</Text>
            <Text style={styles.text}>{route.params!.message}</Text>
            <View style={styles.button}>
                <Button
                    title='erm what the sigma'
                    onPress={() => navigation.goBack()} />
            </View>
        </View>
    )
}

export default ErrorScreen;

