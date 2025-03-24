import firebase from "firebase/compat/app";
import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { auth, db } from '../../firebase';

export function LoadingScreen({ navigation }: { navigation: any }) {
    return (
        <View style={style.container}>
            <ActivityIndicator size="large" />
        </View>
    );
}

const style = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default LoadingScreen;