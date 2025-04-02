import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { auth, db } from "../../firebase";
import { deleteUser, signOut } from "firebase/auth";
import { TouchableOpacity } from "react-native-gesture-handler";
import { collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { CommonActions } from "@react-navigation/native";

export function SettingsScreen({ navigation }: { navigation: any }) {

    const signOutNow = () => {
//        navigation.navigate("Loading");
        signOut(auth).then(() => {
            // Sign-out successful.
            navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
        }).catch((error) => {
            // An error happened.
            const errorCode = error.code;
            const errorMessage = error.message;
            navigation.navigate("Error", { code: errorCode, message: errorMessage });
        });
    }

    const deleteAccount = () => {
        navigation.navigate("Loading");
        let userId = auth.currentUser!.uid;
        deleteUser(auth.currentUser!).then(() => {
            // Sign-out successful.
            return deleteDoc(doc(db, "users", userId));
        }).then(() => {
            
        }).then(() => {
            navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
        }).catch((error) => {
            // An error happened.
            const errorCode = error.code;
            const errorMessage = error.message;
            navigation.navigate("Error", {code: errorCode, message: errorMessage});
        });
    }

    const [isLoggedIn, setIsLoggedIn] = useState(false);
     
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setIsLoggedIn(true);
            } else {
                setIsLoggedIn(false);
            }
        });

        return unsubscribe;
    }, []);

    return (
        <View>
            <TouchableOpacity
                onPress={signOutNow}
            >
                <Text>Sign out now</Text>
            </TouchableOpacity>

        </View>
    );
}