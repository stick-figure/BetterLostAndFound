import { query, collection, where, doc, getDocs, setDoc, DocumentData, onSnapshot, DocumentSnapshot, getDoc } from "firebase/firestore";
import { SetStateAction, useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, View } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { auth, db } from "../../ModularFirebase";
import { lightThemeColors } from "../assets/Colors";
import { TouchableOpacity } from "react-native-gesture-handler";
import { CommonActions } from "@react-navigation/native";
import { Icon, SearchBar } from "react-native-elements";
import PressableOpacity from "../assets/MyElements";

interface ItemTile {
    _id: string,
    name: string,
    description: string,
    ownerName: string,
    isLost: boolean,
    imageSrc: object,
}

export function SearchItemsScreen({ navigation }: { navigation: any }) {
    const [items, setItems] = useState<ItemTile[]>([]);
    const [itemQuery, setItemQuery] =  useState<ItemTile[]>([]);
    const [search, setSearch] = useState("");
    
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

        const unsubscribe = onSnapshot(query(collection(db, 'items')), (snapshot: { docs: any[]; }) => {
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
        updateSearch(search);
    }, [items]);

    const updateSearch = (searchText: string) => {
        setSearch(searchText);
        let myItemQuery = items.filter((value, index, array) => {
            return searchText == "" || value.name.toLowerCase().includes(searchText.toLowerCase());
        });
        setItemQuery(myItemQuery);
    };

    return (
        <SafeAreaView style={styles.container}>
            <SearchBar
                placeholder="Type Here..."
                onChangeText={(text) => updateSearch(text)}
                value={search}
                containerStyle={styles.searchBar} 
                />
            <View style={styles.itemList}>
                <FlatList
                    horizontal={false}
                    keyExtractor={item => item._id.toString()}
                    ListEmptyComponent={
                        <View style={{flex: 1, alignContent: "center", alignSelf: "stretch", justifyContent: "center"}}>
                            {isLoading ? <ActivityIndicator size="large" /> : <Icon name="cactus" type="material-community" />}
                        </View>
                    }
                    data={itemQuery}
                    renderItem={({ item }) => (
                        <View style={styles.itemListItem}>
                            <PressableOpacity
                                key={item._id.toString()}
                                onPress={() => { navigation.navigate("Item View", { itemId: item._id, itemName: item.name }) }}>    
                            
                                <Image source={item.imageSrc} style={styles.itemImage} defaultSource={require("../assets/defaultimg.jpg")}/>
                                <View style={styles.itemListItemView}>
                                    <Text style={styles.itemTitle}>{item.name}</Text>
                                    <Text style={styles.itemSubtitle}>{item.ownerName}</Text>
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
        color: lightThemeColors.textDark,
        fontSize: 18,
    },
    searchBar: {
        width: "100%",
        borderWidth: 0,
    },
    itemList: {
        width: "100%",
        flexGrow: 1,
        margin: 10,
        backgroundColor: lightThemeColors.foreground,
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

export default SearchItemsScreen;