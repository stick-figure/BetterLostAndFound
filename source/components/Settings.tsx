import { Text, View } from "react-native";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import { TouchableOpacity } from "react-native-gesture-handler";


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
    
    return (
    <View>
        <TouchableOpacity
            onPress={signOutNow}
            >
                <Text>Sign out now</Text>
        </TouchableOpacity>
        
    </View>);
}