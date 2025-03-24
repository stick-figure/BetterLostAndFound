import { useEffect, useState } from "react";
import { View, Button, StyleSheet, Text, FlatList, Image, ActivityIndicator } from "react-native";
import { FAB, Input, ListItem } from "react-native-elements";
import { TouchableOpacity } from "react-native-gesture-handler";
import { lightThemeColors } from "../assets/Colors";
import { onSnapshot, query, collection, where, getDoc, DocumentSnapshot, doc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { CommonActions } from "@react-navigation/native";

interface ItemTile {
    _id: string,
    name: string,
    description: string,
    ownerName: string,
    isLost: boolean,
    imageSrc: object,
}

export function HomeScreen({ navigation }: { navigation: any }) {
    const [items, setItems] = useState<Array<ItemTile>>([]);


    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {

            } else {
                navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
            }
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!auth.currentUser) return;

        const unsubscribe = onSnapshot(query(collection(db, 'items')), (snapshot: { docs: any[]; }) => {
            const storage = getStorage();
            const promises = snapshot.docs.map(async (itemDoc) => {
                const imageRef = ref(storage, 'images/items/' + itemDoc.id);

                let url;
                try {
                    url = await getDownloadURL(imageRef!);
                } catch (err) {
                    
                }

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
                    imageSrc: (url ? { uri: url } : require("../assets/defaultimg.jpg")),
                };
            });

            Promise.all(promises).then((res) => setItems(res)).catch((error) => {console.warn(error)});
        });

        return unsubscribe;
    });

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={() => navigation.navigate("Return Item")}
                style={styles.returnItemButton}>
                <Text style={styles.text}>Report Item as Found</Text>
            </TouchableOpacity>
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
                                    <Text style={styles.itemContent}>{item.description}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            </View>

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
    itemList: {
        width: "100%",
        height: "40%",
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
    returnItemButton: {
        width: 370,
        marginTop: 10,
        padding: 10,
        backgroundColor: lightThemeColors.primary,
        borderRadius: 7,
    },

});
export default HomeScreen;