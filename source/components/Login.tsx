import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text, TextInput, Pressable, useColorScheme } from 'react-native'
import { auth } from '../../ModularFirebase';
import { AuthErrorCodes, signInWithEmailAndPassword } from 'firebase/auth';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { CommonActions } from '@react-navigation/native';
import { CoolTextInput, MyInput, PressableOpacity } from '../hooks/MyElements';
import { Input } from 'react-native-elements';
import SafeAreaView from 'react-native-safe-area-view';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import { navigateToErrorScreen } from './Error';

export function LoginScreen({ navigation }: { navigation: any }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [signingIn, setSigningIn] = useState(false);
    const [errorText, setErrorText] = useState('');
    
    const openRegisterScreen = () => {
        navigation.navigate('Register', { email: email, password: password });
    };

    const signIn = () => {
        //        navigation.navigate('Loading');
        signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
            
            navigation.replace('My Drawer', { screen: 'Bottom Tabs' });

        }).catch((error) => {
            switch (error.code) {
                case AuthErrorCodes.INVALID_PASSWORD:
                    setErrorText('Wrong password.');
                    break;
                case AuthErrorCodes.INVALID_LOGIN_CREDENTIALS:
                    setErrorText('Invalid username or password.');
                    break;
                case AuthErrorCodes.INVALID_EMAIL:
                    setErrorText('Invalid email.');
                    break;
                default:
                    setErrorText(error.code + ' ' + error.message);
            }
        });
    };

    const isDarkMode = useColorScheme() === 'dark';
    const colors = isDarkMode ? DarkThemeColors : LightThemeColors;
    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            alignItems: 'center',
            padding: 10,
            paddingTop: 100,
            backgroundColor: colors.background,
        },
        horizontal: {
            flexDirection: 'row',
        },
        title: {
            fontSize: 24,
            textAlign: 'center',
            fontWeight: 'bold',
            color: colors.text,
            marginVertical: 15,
        },
        errorText: {
            color: "red",
        },
        buttonDisabled: {
            opacity: 0.1,
        },
        loginButton: {
            width: 370,
            marginTop: 10,
            padding: 10,
            backgroundColor: colors.secondary,
            borderRadius: 7,
        },
        loginButtonText: {
            textAlign: 'center',
            color: colors.secondaryContrastText,
            fontSize: 16,
            fontWeight: 'bold',
        },
        signupButton: {
            width: 370,
            marginTop: 10,
            padding: 10,
            backgroundColor: colors.primary,
            borderRadius: 7,
        },
        signupButtonText: {
            textAlign: 'center',
            color: colors.primaryContrastText,
            fontSize: 16,
            fontWeight: 'bold',
        }
    }), [isDarkMode]);

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Better Lost and Found</Text>
            <CoolTextInput
                label='Email'
                leftIcon={{
                    name: 'email',
                    type: 'material-community'
                }}
                placeholder='Enter your email'
                containerStyle={{width: '80%'}}
                value={email}
                editable={!signingIn}
                onChangeText={text => setEmail(text)}
                required
            />
            
            <CoolTextInput
                label='Password'
                leftIcon={{
                    name: 'lock',
                    type: 'material-community'
                }}
                placeholder='Enter your password'
                containerStyle={{width: '80%'}}
                value={password}
                editable={!signingIn}
                onChangeText={text => setPassword(text)}
                secureTextEntry
                required
            />
            <Text style={styles.errorText}>{errorText}</Text>
            <PressableOpacity style={styles.signupButton} onPress={openRegisterScreen} disabled={signingIn}>
                <Text style={styles.signupButtonText}>Sign Up</Text>
            </PressableOpacity>
            <PressableOpacity style={styles.loginButton} onPress={signIn} disabled={email ==  '' || password == ''}>
                <Text style={styles.loginButtonText}>Log In</Text>
            </PressableOpacity>
        </SafeAreaView>
    );
}

export default LoginScreen;