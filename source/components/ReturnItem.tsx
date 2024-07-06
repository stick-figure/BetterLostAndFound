import { NavigationProp, NavigationState, ParamListBase, Route } from "@react-navigation/native";
import { Button, View } from "react-native";


export function ReturnItemScreen({ navigation }: {navigation: any}) {
    return (
        <View>
            <Button title="Scan Code" onPress={() => {navigation.navigate("Scan Code")}}/>
        </View>
    );
}

export default ReturnItemScreen;