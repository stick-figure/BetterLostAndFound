import { View, Button, StyleSheet, Text } from "react-native";
import { FAB, Input } from "react-native-elements";


export function HomeScreen({navigation}: {navigation: any}) {
    return (
        <View style={styles.container}>
            <Text>Home</Text>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
        marginTop: 100,
    },
    button: {
        width: 370,
        marginTop: 10
    }
});
export default HomeScreen;