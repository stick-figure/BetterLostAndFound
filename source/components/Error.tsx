import React, { useMemo, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import { CommonActions, useNavigation, useRoute, useTheme } from '@react-navigation/native';

const debugMode = true;

export const navigateToErrorScreen = (navigation, error, func: any | undefined = undefined) => {
    if (![error.code, error.message].includes(undefined)) {
        
    }
    navigation.navigate('Error', {error: error, func: func});
}

export function popupOnError(navigation, func) {
    if (!debugMode) return func.apply(this, arguments)
    return () => {
        try {
            return func.apply(this, arguments);
        } catch (e) {
            navigateToErrorScreen(navigation, e, func)
        }
    }
};

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
        
        errorCode: {
            color: colors.text,
        },
        errorMessage: {
            color: colors.text,
        },
        kbd: {
            color: colors.red,
            fontFamily: 'courier',
            fontSize: 12,
        },
        button: {
            backgroundColor: colors.primary,
        },
    }), [isDarkMode]);

    function renderErrorContent() {
        
        return (
            <View>
                <Text style={styles.text}>{route.params?.error.toString() ?? 'No error given'}</Text>
            </View>
        );
    }
    
    return (
        <View style={styles.container}>
            <TextInput style={styles.text} value={Object.getPrototypeOf(route.params?.error).constructor.name} />
            {renderErrorContent()}
            <ScrollView>
                <TextInput style={styles.kbd} value={route.params?.error.stack} multiline/>
            </ScrollView>

            <View style={styles.button}>
                <Button
                    title='erm what the sigma'
                    onPress={route.params?.onClose !== undefined ? route.params!.onClose :
                        () => {
                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'Home' }],
                            })
                        );
                    }} />
            </View>
        </View>
    )
}

export default ErrorScreen;

