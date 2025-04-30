import React, { useMemo, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import { CommonActions, NavigationProp, useNavigation, useRoute, useTheme } from '@react-navigation/native';
import { MyStackScreenProps } from '../navigation/Types';
import { FirebaseError } from 'firebase/app';

const debugMode = true;

export const navigateToErrorScreen = (navigation: NavigationProp<any>, error: unknown) => {
    if (error instanceof FirebaseError) {
        navigation.navigate('My Stack', {
            screen: 'Error', 
            params: {
                error: error, 
            }
        });
    } else {
        navigation.navigate('My Stack', {
            screen: 'Error', 
            params: {
                error: error, 
            }
        });
    }
}

type AnyFunction = (...args: any[]) => any;

export const popupOnError = <Func extends AnyFunction>(
        navigation: NavigationProp<any>, fn: Func, onFinally?: () => any,
    ): ((...args: Parameters<Func>) => ReturnType<Func> | undefined) => {
    const wrappedFn = (...args: Parameters<Func>): ReturnType<Func> | undefined => {
        // your code here
        try {
            return fn(...args);
        } catch (e) {
            navigateToErrorScreen(navigation, e);
        } finally {
            if (onFinally !== undefined) return onFinally();
        } 
    };
    return wrappedFn;
};
export function ErrorScreen({ navigation, route }: MyStackScreenProps<'Error'>) {
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
        if (route.params.error.code) {
            return (
                <View>
                    <Text style={styles.text}>{route.params.error?.code ?? 'No error code'}</Text>
                    <Text style={styles.text}>{route.params.error?.message ?? 'No error given'}</Text>
                </View>
            );
        }

        return (
            <View>
                <Text style={styles.text}>{route.params?.error ? route.params?.error.toString() : 'No error given'}</Text>
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

