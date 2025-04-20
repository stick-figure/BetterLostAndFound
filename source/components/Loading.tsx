import firebase from "firebase/compat/app";
import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { auth, db } from '../../ModularFirebase';
import SafeAreaView from "react-native-safe-area-view";
import { lightThemeColors } from "../assets/Colors";

export function LoadingScreen({ navigation }: { navigation: any }) {
    return (
        <SafeAreaView style={style.container}>
            <ActivityIndicator size="large" />
        </SafeAreaView>
    );
}

const style = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: lightThemeColors.background,
    }
});

export default LoadingScreen;