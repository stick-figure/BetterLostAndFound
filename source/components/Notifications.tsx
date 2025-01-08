import { View, Button } from "react-native";


function NotificationsScreen({ navigation }: {navigation: any}) {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Button onPress={() => navigation.goBack()} title="im skibidi and i know it" />
        </View>
    );
}

export default NotificationsScreen;