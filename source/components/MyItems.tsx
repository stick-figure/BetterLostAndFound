import { query, collection, where, doc, getDocs, setDoc, DocumentData, onSnapshot } from "firebase/firestore";
import { SetStateAction, useEffect, useLayoutEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { auth, db } from "../../firebase";
import firebase from "firebase/compat/app";
import { FAB, ListItem } from "react-native-elements";
import { lightThemeColors } from "../assets/Colors";


export function MyItemsScreen({ navigation }: {navigation: any}) {
    const [items, setItems] = useState([{
        _id: "",
        name: "",
        description: "",
        owner: "",
        isLost: false,
    }]);


    useEffect(() => {
        const unsubscribe = onSnapshot(query(collection(db, 'items'), where("owner", "==", auth.currentUser?.uid)), (snapshot: { docs: any[]; }) => setItems(
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
        <SafeAreaProvider>
            <View style={styles.container}>
                <FlatList
                        keyExtractor={item => item._id.toString()}
                        data={items}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                key={item._id.toString()}
                                onPress={() => {navigation.navigate("Item Info", {itemId: item._id, itemName: item.name})}}>
                                    <ListItem key={`${item._id}`} bottomDivider topDivider>
                                        <ListItem.Title style={styles.itemTitle}>
                                            <Text style={styles.itemTitle}>{item.name}</Text>
                                        </ListItem.Title>
                                        <ListItem.Subtitle style={styles.itemSubtitle}>
                                            
                                        </ListItem.Subtitle>
                                        <ListItem.Content>
                                            <Text style={styles.itemContent}>{item.description}</Text>
                                        </ListItem.Content>
                                    </ListItem>
                            </TouchableOpacity>
                        )}
                    />
                <FAB
                    icon={{
                    name: 'add',
                    size: 20,
                    color: 'white',
                    }}
                    placement="right"
                    onPress={() => {navigation.navigate("Add Item")}}
                    buttonStyle={styles.fab} />
            </View>
        </SafeAreaProvider>
    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    itemTitle: {
        color: lightThemeColors.textLight,
        flex: 1,
    },
    itemSubtitle: {
        color: lightThemeColors.textLight,
        flex: 0,
    },
    itemContent: {
        color: lightThemeColors.textLight,
    },
    fab: {
        borderRadius: 90,
        alignItems: "center",
        backgroundColor: lightThemeColors.primary,
    },
});

export default MyItemsScreen;