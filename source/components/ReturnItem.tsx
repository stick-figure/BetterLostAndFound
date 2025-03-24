import { CommonActions, NavigationProp, NavigationState, ParamListBase, Route } from "@react-navigation/native";
import { useEffect } from "react";
import { Button, View } from "react-native";
import { auth } from "../../firebase";


export function ReturnItemScreen({ navigation }: { navigation: any }) {
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {

            } else {
                navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
            }
        });

        return unsubscribe;
    }, []);
    
    return (
        <View>
            <Button title="Scan Code" onPress={() => { navigation.navigate("Scan Code") }} />
        </View>
    );
}

export default ReturnItemScreen;