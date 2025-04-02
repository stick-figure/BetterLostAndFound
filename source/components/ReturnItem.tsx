import { CommonActions, NavigationProp, NavigationState, ParamListBase, Route } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { auth } from "../../firebase";
import { Button, Input } from "react-native-elements";


export function ReturnItemScreen({ navigation }: { navigation: any }) {
    const [code, setCode] = useState("");

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
            <Input 
                placeholder=''
                label='Enter code manually'
                value={code}
                onChangeText={text => setCode(text)}
            />
            <Button title="Scan Code" onPress={() => { navigation.navigate("Scan Code") }} />
        </View>
    );
}

export default ReturnItemScreen;