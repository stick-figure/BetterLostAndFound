import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TextInput, Pressable } from 'react-native'
import { auth } from '../../ModularFirebase';
import { AuthErrorCodes, signInWithEmailAndPassword } from 'firebase/auth';
import { lightThemeColors } from '../assets/Colors';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { CommonActions } from '@react-navigation/native';
import PressableOpacity from '../assets/MyElements';
import { Input } from 'react-native-elements';
import SafeAreaView from 'react-native-safe-area-view';

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
            console.warn(error);
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

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Better Lost and Found</Text>
            <Input
                label='Email'
                leftIcon={{
                    name: 'email',
                    type: 'material-community'
                }}
                placeholder='Enter your email'
                value={email}
                editable={!signingIn}
                onChangeText={text => setEmail(text)}
            />
            
            <Input
                label='Password'
                leftIcon={{
                    name: 'lock',
                    type: 'material-community'
                }}
                placeholder='Enter your password'
                value={password}
                editable={!signingIn}
                onChangeText={text => setPassword(text)}
                secureTextEntry
            />
            <Text style={styles.errorText}>{errorText}</Text>
            <PressableOpacity style={styles.signupButton} onPress={openRegisterScreen} disabled={signingIn}>
                <Text style={styles.signupButtonText}>Sign Up</Text>
            </PressableOpacity>
            <PressableOpacity style={styles.loginButton} onPress={signIn} disabled={password == ''}>
                <Text style={styles.loginButtonText}>Log In</Text>
            </PressableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
        paddingTop: 100,
        backgroundColor: lightThemeColors.background,
    },
    horizontal: {
        flexDirection: 'row',
    },
    title: {
        fontSize: 24,
        textAlign: 'center',
        fontWeight: 'bold',
        color: lightThemeColors.textLight,
        marginVertical: 15,
    },
    errorText: {
        color: lightThemeColors.redder,
    },
    textInput: {
        textDecorationStyle: 'dotted',
        fontWeight: 600,
        fontSize: 20,
        width: '80%', 
        overflow: 'hidden',
        borderBottomWidth: 2,
        borderColor: lightThemeColors.dullGrey,
        borderRadius: 1,
        padding: 6,
        margin: 10,
    },
    buttonDisabled: {
        opacity: 0.1,
    },
    loginButton: {
        width: 370,
        marginTop: 10,
        padding: 10,
        backgroundColor: lightThemeColors.secondary,
        borderRadius: 7,
    },
    loginButtonText: {
        textAlign: 'center',
        color: lightThemeColors.textLight,
        fontSize: 16,
        fontWeight: 'bold',
    },
    signupButton: {
        width: 370,
        marginTop: 10,
        padding: 10,
        backgroundColor: lightThemeColors.primary,
        borderRadius: 7,
    },
    signupButtonText: {
        textAlign: 'center',
        color: lightThemeColors.textDark,
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default LoginScreen;