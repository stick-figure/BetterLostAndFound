import { useEffect, useState } from "react";
import { View, Button, StyleSheet, Text, FlatList, Image } from "react-native";
import { FAB, Input, ListItem } from "react-native-elements";
import { TouchableOpacity } from "react-native-gesture-handler";
import { lightThemeColors } from "../assets/Colors";
import { onSnapshot, query, collection, where } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

interface Item {
    _id: string,
    name: string,
    description: string,
    owner: string, 
    isLost: boolean,
    imageSrc: object,
}

export function HomeScreen({navigation}: {navigation: any}) {
    const [items, setItems] = useState<Array<Item>>([]);


    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                
            } else {
                navigation.replace('Login');
            }
        });

        return unsubscribe;
    });
    
    useEffect(() => {
        const unsubscribe = onSnapshot(query(collection(db, 'items')), (snapshot: { docs: any[]; }) => {
            let promises = snapshot.docs.map(async (doc) => {
                const storage = getStorage();
                const imageRef = ref(storage, 'images/items/' + doc.id);
                const url = await getDownloadURL(imageRef!);
                return {
                    _id: doc.id,
                    name: doc.data().name,
                    description: doc.data().description,
                    owner: doc.data().owner,
                    isLost: doc.data().isLost,
                    imageSrc: {uri: url},
                };
            });
            
            Promise.all(promises).then((res) => setItems(res));
        });

        return unsubscribe;
    });

    return (
        <View style={styles.container}>
            <TouchableOpacity 
                onPress={()=> navigation.navigate("Return Item")}
                style={styles.returnItemButton}>
                <Text style={styles.text}>Return Item</Text>
            </TouchableOpacity>
            <FlatList 
            horizontal={false}
            keyExtractor={item => item._id.toString()}
            data={items}
            renderItem={({ item }) => (
                <TouchableOpacity
                    key={item._id.toString()}
                    onPress={() => {navigation.navigate("Item Info", {itemId: item._id, itemName: item.name})}}>
                        <Image style={styles.image} source={item.imageSrc} />
                        <Text style={styles.itemTitle}>{item.name}</Text>
                        <Text style={styles.itemTitle}>{item.owner}</Text>
                        <Text style={styles.itemContent}>{item.description}</Text>
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
    image: {
        width: 100,
        height: 100
    }
});
export default HomeScreen;