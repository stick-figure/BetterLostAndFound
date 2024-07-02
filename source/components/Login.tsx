import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native'
import { Input, Button } from 'react-native-elements';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import Icon from 'react-native-vector-icons/FontAwesome';

export function LoginScreen({navigation}: {navigation: any}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const openRegisterScreen = () => {
      navigation.navigate('Register');
    };

    const signin = () => {
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            navigation.navigate('HomeTab', {screen: 'Home'});
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            navigation.navigate("Error", {code: errorCode, message: errorMessage});
        });
    };

    useEffect(() => {
    });

    return (
        <View style={styles.container}>
            <Input
                placeholder='Enter your email'
                label='Email'
                leftIcon={{ type: 'material', name: 'email' }}
                value={email}
                onChangeText={text => setEmail(text)}
            />
            <Input
                placeholder='Enter your password'
                label='Password'
                leftIcon={{ type: 'material', name: 'lock' }}
                value={password}
                onChangeText={text => setPassword(text)}
                secureTextEntry
            />
            <Button title="Log In" style={styles.button} onPress={signin} />
            <Button title="Sign Up" style={styles.button} onPress={openRegisterScreen} />
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
    button: {
        width: 370,
        marginTop: 10
    }
});

export default LoginScreen;