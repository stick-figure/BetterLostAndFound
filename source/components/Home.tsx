import { useEffect, useState } from "react";
import { View, Button, StyleSheet, Text, FlatList } from "react-native";
import { FAB, Input, ListItem } from "react-native-elements";
import { TouchableOpacity } from "react-native-gesture-handler";
import { lightThemeColors } from "../assets/Colors";
import { onSnapshot, query, collection, where } from "firebase/firestore";
import { db, auth } from "../../firebase";

export function HomeScreen({navigation}: {navigation: any}) {
    const [items, setItems] = useState([{
        _id: "",
        name: "",
        description: "",
        owner: "",
        isLost: false,
    }]);


    useEffect(() => {
        auth.onAuthStateChanged((user) => {
            if (user) {
                
            } else {
                navigation.replace('Login');
            }
        });
        const unsubscribe = onSnapshot(query(collection(db, 'items')), (snapshot: { docs: any[]; }) => setItems(
            snapshot.docs.map(((doc) => ({
                _id: doc.id,
                name: doc.data().name,
                description: doc.data().description,
                owner: doc.data().owner,
                isLost: doc.data().isLost,
            })))
        ));

        return () => {
          unsubscribe();
        };
    });

    return (
        <View style={styles.container}>
            <TouchableOpacity 
                onPress={()=> navigation.navigate("Return Item")}
                style={styles.returnItemButton}>
                <Text style={styles.text}>Return Item</Text>
            </TouchableOpacity>
            <FlatList 
            horizontal={true}
            keyExtractor={item => item._id.toString()}
            data={items}
            renderItem={({ item }) => (
                <TouchableOpacity
                    key={item._id.toString()}
                    onPress={() => {}}>
                        <ListItem key={`${item._id}`} bottomDivider topDivider>
                            <ListItem.Title style={styles.itemTitle}>
                                <Text style={styles.itemTitle}>{item.name}</Text>
                            </ListItem.Title>
                            <ListItem.Subtitle style={styles.itemSubtitle}>
                            <Text style={styles.itemTitle}>{item.owner}</Text>
                            </ListItem.Subtitle>
                            <ListItem.Content>
                                <Text style={styles.itemContent}>{item.description}</Text>
                            </ListItem.Content>
                        </ListItem>
                </TouchableOpacity>
                )}
            />
            <Text>Home</Text>
            
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
    },
    text: {
        textAlign: "center",
        color: lightThemeColors.textDark,
        fontSize: 18,
    },
    itemTitle: {
        color: lightThemeColors.textLight,
    },
    itemSubtitle: {
        color: lightThemeColors.textLight,
    },
    itemContent: {
        color: lightThemeColors.textLight,
    },
    returnItemButton: {
        width: 370,
        marginTop: 10,
        padding: 10,
        backgroundColor: lightThemeColors.primary,
        borderRadius: 7,
    },
});
export default HomeScreen;