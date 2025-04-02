import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native'
import { Input, Button } from 'react-native-elements';
import { auth } from '../../firebase';
import { AuthErrorCodes, signInWithEmailAndPassword } from 'firebase/auth';
import Icon from 'react-native-vector-icons/FontAwesome';
import { lightThemeColors } from '../assets/Colors';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { CommonActions } from '@react-navigation/native';

export function LoginScreen({ navigation }: { navigation: any }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [signingIn, setSigningIn] = useState(false);
    const [errorText, setErrorText] = useState("");
    
    const openRegisterScreen = () => {
        navigation.navigate('Register', { email: email, password: password });
    };

    const signIn = () => {
        //        navigation.navigate('Loading');
        signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
            navigation.replace("Home Tab", { screen: 'Home' });

        }).catch((error) => {
            console.log(Object.prototype.toString.call(error));
            switch (error.code) {
                case AuthErrorCodes.INVALID_PASSWORD:
                    setErrorText("Wrong password.");
                    break;
                case AuthErrorCodes.INVALID_LOGIN_CREDENTIALS:
                    setErrorText("Invalid username or password.");
                    break;
                case AuthErrorCodes.INVALID_EMAIL:
                    setErrorText("Invalid email.");
                    break;
                default:
                    setErrorText(error.code + " " + error.message);
            }
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Better Lost and Found</Text>
            <Input
                placeholder='Enter your email'
                label='Email'
                leftIcon={{ type: 'MaterialIcons', name: 'email' }}
                value={email}
                disabled={signingIn}
                onChangeText={text => setEmail(text)}
            />
            <Input
                placeholder='Enter your password'
                label='Password'
                leftIcon={{ type: 'MaterialIcons', name: 'lock' }}
                value={password}
                disabled={signingIn}
                onChangeText={text => setPassword(text)}
                secureTextEntry
            />
            <Text style={styles.errorText}>{errorText}</Text>
            <TouchableOpacity style={styles.signupButton} onPress={openRegisterScreen} disabled={signingIn}>
                <Text style={styles.signupButtonText}>Sign Up</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.loginButton} onPress={signIn} disabled={password == ""}>
                <Text style={styles.loginButtonText}>Log In</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
        paddingTop: 100,
    },
    title: {
        fontSize: 24,
        textAlign: "center",
        fontWeight: "bold",
        color: lightThemeColors.textLight,
        marginVertical: 15,
    },
    errorText: {
        color: "red",
    },
    loginButton: {
        width: 370,
        marginTop: 10,
        padding: 10,
        backgroundColor: lightThemeColors.secondary,
        borderRadius: 7,
    },
    signupButton: {
        width: 370,
        marginTop: 10,
        padding: 10,
        backgroundColor: lightThemeColors.primary,
        borderRadius: 7,
    },
    loginButtonText: {
        textAlign: "center",
        color: lightThemeColors.textLight,
        fontSize: 16,
        fontWeight: "bold",
    },
    signupButtonText: {
        textAlign: "center",
        color: lightThemeColors.textDark,
        fontSize: 16,
        fontWeight: "bold",
    }
});

export default LoginScreen;