import { query, collection, where, doc, getDocs, setDoc, DocumentData, onSnapshot, DocumentSnapshot, getDoc } from "firebase/firestore";
import { SetStateAction, useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, Button, FlatList, Image, StyleSheet, Text, View } from "react-native";
import SafeAreaView, { SafeAreaProvider } from "react-native-safe-area-view";
import { auth, db } from "../../ModularFirebase";
import { lightThemeColors } from "../assets/Colors";
import { TouchableOpacity } from "react-native-gesture-handler";
import { CommonActions } from "@react-navigation/native";
import PressableOpacity from "../assets/MyElements";
import { Icon } from "react-native-elements";

interface ItemTile {
    _id: string,
    name: string,
    description: string,
    ownerName: string,
    isLost: boolean,
    imageSrc: object,
}

export function MyItemsScreen({ navigation }: { navigation: any }) {
    const [items, setItems] = useState<ItemTile[]>([]);
    const [sortedItems, setSortedItems] = useState<ItemTile[]>([]);
    const [userData, setUserData] = useState({});

    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    
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
            setIsLoading(true);
            const promises = snapshot.docs.map(async (itemDoc) => {
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
                    imageSrc: (itemDoc.data().imageSrc ? { uri: itemDoc.data().imageSrc } : undefined),
                };
            });

            Promise.all(promises).then((res) => {
                setItems(res);
                setIsLoading(false);
            }).catch((error) => {console.warn(error)});
        });

        return unsubscribe;
    }, [isLoggedIn]);

    useEffect(() => {
        setSortedItems(items.sort((a, b) => {
            return a.isLost - b.isLost;
        }));
    }, [items]);
    
    useEffect(() => {
        if (!isLoggedIn) return;
        
        const unsubscribe = onSnapshot(doc(db, "users", auth.currentUser!.uid), (snapshot) => {
            setUserData({...snapshot.data()});
        });

        return unsubscribe;
    }, [isLoggedIn]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.horizontal, {alignSelf:"flex-start"}]}>
                <Image 
                    source={{uri: userData?.pfpUrl}} 
                    style={styles.pfp}
                    defaultSource={require("../assets/defaultpfp.jpg")}
                    />
                <View>
                    <Text style={styles.userName}>{userData?.name}</Text>
                </View>
            </View>
            <View style={[styles.horizontal, {width: "100%", justifyContent: "space-around"}]}>
                <PressableOpacity onPress={() => {}}>
                    <Text style={styles.addItemTitle}>My Posts</Text>
                </PressableOpacity>
                <PressableOpacity onPress={() => {}}>
                    <Text style={styles.addItemTitle}>a</Text>
                </PressableOpacity>
                <PressableOpacity onPress={() => {}}>
                    <Text style={styles.addItemTitle}>My Items</Text>
                </PressableOpacity>
            </View>
            
            <View style={[styles.horizontal, {width:'100%', alignItems: "flex-end", justifyContent: 'space-between'}]}>
                <Text style={{fontSize: 16, color: lightThemeColors.textLight, margin: 4}}>My Items</Text>
                <PressableOpacity onPress={() => navigation.navigate("My Stack", {screen: "Add Item"})} style={styles.smallButton}>
                    <Text style={styles.addItemTitle}>Add Item</Text>
                </PressableOpacity>
            </View>
            <View style={styles.itemList}>
                <FlatList
                    keyExtractor={item => item._id.toString()}
                    ListEmptyComponent={
                        <View style={{flex: 1, alignContent: "center", alignSelf: "stretch", justifyContent: "center"}}>
                            {isLoading ? <ActivityIndicator size="large" /> : <Icon name="cactus" type="material-community" />}
                        </View>
                    }
                    data={sortedItems}
                    renderItem={({ item }) => (
                        <View style={styles.itemListItem}>
                            <PressableOpacity
                                key={item._id.toString()}
                                onPress={() => { navigation.navigate("My Stack", {screen: "Item View", params: { itemId: item._id, itemName: item.name } }) }}>
                                <Image source={item.imageSrc} style={styles.itemImage} defaultSource={require("../assets/defaultimg.jpg")}/>
                                <View style={styles.itemListItemView}>
                                    <Text style={styles.itemTitle}>{item.name}</Text>
                                </View>
                            </PressableOpacity>
                        </View>
                    )}
                    numColumns={3}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
        backgroundColor: lightThemeColors.background,
    },
    horizontal: {
        flexDirection: "row",
    },
    text: {
        textAlign: "center",
        color: lightThemeColors.textLight,
        fontSize: 18,
    },
    smallButton: {
        padding: 6,
        backgroundColor: lightThemeColors.primary,
        borderRadius: 8,
    },
    smallButtonText: {
        color: lightThemeColors.textDark,
    },
    userName: {
        fontSize: 28,
        fontWeight: "bold",
        color: lightThemeColors.textLight,
    },
    pfp: {
        width: 128,
        aspectRatio: 1/1,
        borderRadius: 999999,
        margin: 8,
        marginRight: 12,
        color: lightThemeColors.textLight,
    },
    itemList: {
        width: "100%",
        flexGrow: 1,
        margin: 10,
        backgroundColor: lightThemeColors.foreground,
    },
    itemListItem: {
        flex: 1,
        maxWidth: "33%",
        paddingLeft: 10,
        paddingTop: 10,
        paddingBottom: 10,
    },
    itemListItemView: {
        margin: 4,
    },
    itemImage: {
        width: 120,
        height: 120,
        aspectRatio: 1,
    },
    itemTitle: {
        color: lightThemeColors.textLight,
        fontWeight: "400",
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
        color: lightThemeColors.textDark,
    },
});

export default MyItemsScreen;