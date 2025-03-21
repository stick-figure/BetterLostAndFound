import firebase from "firebase/compat/app";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { auth, db } from '../../firebase';

export function LoadingScreen({navigation}: {navigation: any}) {
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                navigation.navigate('Home');
            } else {
                navigation.navigate('Login');
            }
        });
        return unsubscribe;
    });

    return (
        <View>
          <ActivityIndicator size="large" />
        </View>
      );
}

export default LoadingScreen;