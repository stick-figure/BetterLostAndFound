import { useEffect, useState } from "react";
import { View, Button, StyleSheet, Text, FlatList, Image } from "react-native";
import { FAB, Input, ListItem } from "react-native-elements";
import { TouchableOpacity } from "react-native-gesture-handler";
import { lightThemeColors } from "../assets/Colors";
import { onSnapshot, query, collection, where, DocumentSnapshot } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { confirmPasswordReset, Unsubscribe } from "firebase/auth";

export function HomeScreen({navigation}: {navigation: any}) {
    const [items, setItems] = useState<Item[]>([]);

    const [lostPosts, setLostPosts] = useState([{

    }]);

    const [imageSrc, setImageSrc] = useState("")


    useEffect(() => {
        if (!auth.currentUser) {
            navigation.replace("Login")
        }
        auth.onAuthStateChanged((user) => {
            if (user) {

            } else {    
                navigation.replace('Login');
            }
        });
        
        const unsubscribe = onSnapshot(query(collection(db, 'items')), (snapshot: { docs: any[]; }) => {
            const promises = snapshot.docs.map((doc: DocumentSnapshot) => {
                return new Promise((resolve, reject) => {
                    const myItem = {
                        _id: doc.id,
                        name: doc.data()!.name,
                        description: doc.data()!.description,
                        owner: doc.data()!.owner,
                        isLost: doc.data()!.isLost,
                        imageSrc: "",
                    }
                    
                    const storage = getStorage();

                    getDownloadURL(ref(storage, 'images/items/' + doc.id)).then((url) => {
                        myItem.imageSrc = url;
                        resolve(myItem);
                    }).catch((error) => {
                        console.warn(error);
                    });
                });
            });
            Promise.all(promises).then((itemArray) => {
                setItems(itemArray as Item[]);
            });

            return unsubscribe;
        });
    }, []);

    return (
        <View style={styles.container}>
            <TouchableOpacity 
                onPress={() => navigation.navigate("Return Item")}
                style={styles.returnItemButton}>
                <Text style={styles.text}>Report Found Item i am a sigma boy sigma boy sigma boy</Text>
            </TouchableOpacity>
            <Text>Im 2 days into skibidi and im 3 kai cenat behind</Text>
            <FlatList 
            horizontal={true}
            keyExtractor={item => item._id.toString()}
            data={items}
            renderItem={({ item }) => (
                <TouchableOpacity
                    key={item._id.toString()}
                    onPress={() => {navigation.navigate("Item Info", {item: item})}}
                    style={styles.item}>
                    <Image 
                    style={styles.itemImage}
                    source={{"uri": item.imageSrc}}/>
                    <Text style={styles.itemTitle}>{item._id}</Text>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    <Text style={styles.itemContent}>{item.description}</Text>
                </TouchableOpacity>
                )}
            style={styles.list}
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
//        fontSize: 18,
    },
    item: {
        backgroundColor: "white",
        width: 90,
        height: 80,
    },
    itemTitle: {
        color: lightThemeColors.textLight,
    },
    itemImage: {
        width: 60,
        height: 80,
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
    list: {
        height: 50,
    },
});
export default HomeScreen;