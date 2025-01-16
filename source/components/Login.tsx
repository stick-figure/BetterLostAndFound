import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native'
import { Input, Button } from 'react-native-elements';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import Icon from 'react-native-vector-icons/FontAwesome';
import { lightThemeColors } from '../assets/Colors';
import { TouchableOpacity } from 'react-native-gesture-handler';

export function LoginScreen({navigation}: {navigation: any}) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [signingIn, setSigningIn] = useState(false);

    const openRegisterScreen = () => {
      navigation.navigate('Register', {email: email, password: password});
    };

    const signIn = () => {
//        navigation.navigate('Loading');
        setSigningIn(true);
        signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
            navigation.replace("Home Tab", {screen: 'Home'});
        }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            navigation.navigate("Error", {code: errorCode, message: errorMessage});
        }).finally(() => {
            setSigningIn(false);
        });
    };

    useEffect(() => {
        auth.onAuthStateChanged((user) => {
            if (user) {
                setSigningIn(true);
                navigation.replace('Home Tab', {screen: 'Home'});
                setSigningIn(false);
            }
        });
    });

//    const emailRegex = /.*@scienceleadership.org/g;
    const emailRegex = /.*@.*/g;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Better Lost and Found</Text>
            <Input
                placeholder='Enter your email'
                label='Email'
                leftIcon={{ type: 'material', name: 'email' }}
                value={email}
                disabled={signingIn}
                onChangeText={text => setEmail(text)}
            />
            <Input
                placeholder='Enter your password'
                label='Password'
                leftIcon={{ type: 'material', name: 'lock' }}
                value={password}
                disabled={signingIn}
                onChangeText={text => setPassword(text)}
                secureTextEntry
            />
            <TouchableOpacity style={styles.signupButton} onPress={openRegisterScreen} disabled={signingIn}>
                <Text style={styles.signupButtonText}>Sign Up</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.loginButton} onPress={signIn} disabled={signingIn || email.match(emailRegex) == null || password == ""}>
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
        marginTop: 100,
    },
    title: {
        fontSize: 25,
        textAlign: "center",
        fontWeight: "bold",
        color: lightThemeColors.textLight,
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