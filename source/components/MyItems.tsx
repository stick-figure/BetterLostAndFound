import { query, collection, where, doc, getDocs, setDoc, DocumentData, onSnapshot, DocumentSnapshot, getDoc } from "firebase/firestore";
import { SetStateAction, useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { auth, db } from "../../firebase";
import { Button, FAB, ListItem } from "react-native-elements";
import { lightThemeColors } from "../assets/Colors";
import { TouchableOpacity } from "react-native-gesture-handler";
import { CommonActions } from "@react-navigation/native";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

interface ItemTile {
    _id: string,
    name: string,
    description: string,
    ownerName: string,
    isLost: boolean,
    imageSrc: object,
}

export function MyItemsScreen({ navigation }: { navigation: any }) {
    const [items, setItems] = useState<Array<ItemTile>>([]);
        
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

    useEffect(() => {
        if (!isLoggedIn) return;

        const unsubscribe = onSnapshot(query(collection(db, 'items'), where("ownerId", "==", auth.currentUser!.uid)), (snapshot: { docs: any[]; }) => {
            const storage = getStorage();
            const promises = snapshot.docs.map(async (itemDoc) => {
                const imageRef = ref(storage, 'images/items/' + itemDoc.id);

                let owner;
                try {
                    owner = await getDoc(doc(db, "users", itemDoc.data().ownerId));
                } catch (err) {
                    
                }
                
                return {
                    _id: itemDoc.id,
                    name: itemDoc.data().name,
                    description: itemDoc.data().description,
                    ownerName: (owner?.data() ? (owner as DocumentSnapshot).data()!.name : itemDoc.data().ownerId) || "Unknown User",
                    isLost: itemDoc.data().isLost,
                    imageSrc: (itemDoc.data().imageSrc ? { uri: itemDoc.data().imageSrc } : require("../assets/defaultimg.jpg")),
                };
            });

            Promise.all(promises).then((res) => setItems(res)).catch((error) => {console.warn(error)});
        });

        return unsubscribe;
    }, [isLoggedIn]);

    return (
        <View style={styles.container}>
            <View style={[styles.horizontal, {width:'100%', alignItems: "flex-end", justifyContent: 'space-between'}]}>
                <Text>My Items</Text>
                <Button title='Add Item' onPress={() => navigation.navigate("Add Item")} titleStyle={styles.addItemTitle} />
            </View>
            <View style={styles.itemList}>
                <FlatList
                    horizontal={true}
                    keyExtractor={item => item._id.toString()}
                    ListEmptyComponent={<ActivityIndicator size="large" />}
                    data={items}
                    renderItem={({ item }) => (
                        <View style={styles.itemListItem}>
                            <TouchableOpacity
                                key={item._id.toString()}
                                onPress={() => { navigation.navigate("Item View", { itemId: item._id, itemName: item.name }) }}>
                                <Image source={item.imageSrc} style={styles.itemImage} />
                                <View style={styles.itemListItemView}>
                                    <Text style={styles.itemTitle}>{item.name}</Text>
                                    <Text style={styles.itemSubtitle}>{item.ownerName}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
    },
    horizontal: {
        flexDirection: "row",
    },
    text: {
        textAlign: "center",
        color: lightThemeColors.textDark,
        fontSize: 18,
    },
    itemList: {
        width: "100%",
        height: 200,
        margin: 10,
        backgroundColor: "white",
    },
    itemListItem: {
        width: 120,
        marginLeft: 10,
        paddingTop: 10,
        paddingBottom: 10,
    },
    itemListItemView: {
        margin: 4,
    },
    itemImage: {
        width: "100%",
        maxWidth: 120,
        maxHeight: 120,
        aspectRatio: 1,
    },
    itemTitle: {
        color: lightThemeColors.textLight,
        fontWeight: "bold",
        fontSize: 16,
    },
    itemSubtitle: {
        color: lightThemeColors.textLight,
        fontSize: 12,
    },
    itemContent: {
        color: lightThemeColors.textLight,
        fontSize: 14,
    },
    addItemTitle: {
        fontSize: 14,
    },
});

export default MyItemsScreen;