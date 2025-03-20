import { collection, deleteDoc, deleteField, doc, DocumentReference, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, Pressable } from "react-native";
import { auth, db } from "../../firebase";
import { Image } from "react-native-elements";
import { deleteObject, getDownloadURL, getStorage, ref, StorageReference } from "firebase/storage";
import { TouchableOpacity } from "react-native-gesture-handler";
import { lightThemeColors } from "../assets/Colors";

export type ItemInfoRouteParams = {
    itemId: string,
    itemName: string,
}

export function ItemInfoScreen({navigation, route}: {navigation: any, route: any}) {

    const [item, setItem] = useState({
        _id: "",
        name: "",
        description: "",
        owner: "",
        isLost: false,
    });
    const [imageSrc, setImageSrc] = useState(require("../assets/defaultimg.jpg"));
    const [itemRef, setItemRef] = useState<DocumentReference>();
    const [imageRef, setImageRef] = useState<StorageReference>();

    const deleteItem = () => {
        navigation.navigate("Loading");
        deleteObject(imageRef!).then(() => {
            // File deleted successfully
            
        }).catch((error) => {
            console.log(error);
            // Uh-oh, an error occurred!
        });

        deleteDoc(itemRef!).then(() => {
            navigation.navigate("My Items")
        }).catch((error) => {console.log(error)});
    }
    const [isCurrentUser, setIsCurrentUser] = useState(false);

    useEffect(() => {/*TODO 
        const checkUser = async () => {
        const user = auth.currentUser;
        if (user) {
            const userDoc = await collection("users").doc(user.uid).get();
            if (userDoc.exists) {
            setIsCurrentUser(true);
            }
        }
        };
    
        checkUser();*/


        getDoc(doc(collection(db, "items"), route.params!.itemId)).then((snapshot) => {
            setItem({
                _id: route.params!.itemId,
                name: snapshot.get("name") as string,
                description: snapshot.get("description") as string,
                owner: snapshot.get("owner") as string,
                isLost: snapshot.get("name") as boolean,
            });
            setItemRef(snapshot.ref);
            const storage = getStorage();
            const imageRef = ref(storage, 'images/items/' + route.params!.itemId);
            setImageRef(imageRef);
            try {
                getDownloadURL(imageRef!).then((url) => {
                    console.log(url);
                    setImageSrc({uri: url});
                }).catch((error) => {
                    console.warn(error);
                });
            } catch (error) {
                console.error('Error getting download URL:', error);
            }
        });
    }, []);
    
    if (item == null) {
        return (
            <View style={styles.container}>
                <Text>um what the sigma</Text>
            </View>
        );
    }

    if (item.owner != auth.currentUser?.uid) {
        return (
            <View style={styles.container}>
                <Image 
                style={styles.itemImage}
                source={imageSrc}/>
            <Text>{item.description}</Text>
            <Text>Item Owner: {item.owner}</Text>
            </View>
        );
    }
    
    return (
        <View style={styles.container}>
            <Image 
                style={styles.itemImage}
                source={imageSrc}/>
            <Text>{item.description}</Text>
            <View style={{width: "100%", alignContent: "center"}}>
                <TouchableOpacity
                    onPress={deleteItem}
                    style={styles.markAsLostButton}>
                    <Text style={styles.text}>Mark as lost</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={deleteItem}
                    style={styles.deleteItemButton}>
                    <Text style={styles.text}>Delete item</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    text: {
        textAlign: 'left',
        color: "#FFF",
        fontSize: 15,
    },
    itemImage: {
        width: "100%",
        marginBottom: 12,
        aspectRatio: 1/1,
    },
    markAsLostButton: {
        backgroundColor: lightThemeColors.primary,
        padding: 10,
        width: "90%",
        borderRadius: 5,
        alignItems: 'center',
    },
    deleteItemButton: {
        backgroundColor: lightThemeColors.red,
        padding: 10,
        width: "25%", 
        borderRadius: 5,
        alignItems: 'center',
    },
});

export default ItemInfoScreen;