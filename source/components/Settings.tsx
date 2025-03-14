import { Text, TouchableOpacity, View } from "react-native";
import { auth, db } from "../../firebase";
import { deleteUser, signOut } from "firebase/auth";
import { query, collection, where, deleteDoc, getDocs } from "firebase/firestore";


export function SettingsScreen({navigation}: {navigation: any}) {
    const signOutNow = () => {
        navigation.navigate("Loading");
        signOut(auth).then(() => {
            // Sign-out successful.
            navigation.replace("Login");
        }).catch((error) => {
            // An error happened.
            const errorCode = error.code;
            const errorMessage = error.message;
            navigation.navigate("Error", {code: errorCode, message: errorMessage});
        });
    }
    const deleteAccount = () => {
        navigation.navigate("Loading");
        
        deleteUser(auth.currentUser!).then(() => {
            // Sign-out successful.
            navigation.replace("Login");
        }).catch((error) => {
            // An error happened.
            const errorCode = error.code;
            const errorMessage = error.message;
            navigation.navigate("Error", {code: errorCode, message: errorMessage});
        });
    }
    
    return (
    <View>
        <TouchableOpacity
            onPress={signOutNow}
            >
                <Text>Sign out now</Text>
        </TouchableOpacity>
        <TouchableOpacity
            onPress={deleteAccount}
            >
                <Text>Delete account</Text>
        </TouchableOpacity>
    </View>);
}