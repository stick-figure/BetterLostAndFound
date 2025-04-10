import { collection, deleteDoc, deleteField, doc, DocumentReference, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { useState, useEffect, useCallback } from "react";
import { View, Text, Button, StyleSheet, Pressable, Alert } from "react-native";
import { auth, db } from "../../firebase";
import { Icon, Image } from "react-native-elements";
import { deleteObject, getDownloadURL, getStorage, ref, StorageError, StorageErrorCode, StorageReference } from "firebase/storage";
import { TouchableOpacity } from "react-native-gesture-handler";
import { lightThemeColors } from "../assets/Colors";
import { CommonActions, RouteProp } from "@react-navigation/native";

export type ItemViewRouteParams = {
    itemId: string,
    itemName: string,
}

export function ItemViewScreen({ navigation, route }: { navigation: any, route: any }) {
    const [item, setItem] = useState({
        _id: "",
        name: "",
        description: "",
        ownerId: "",
        isLost: false,
        secretCode: "",
        createdAt: -1,
        imageSrc: require("../assets/defaultimg.jpg"),
    });
    
    const [owner, setOwner] = useState({
        _id: "",
        name: "",
        pfpUrl: "",
    });

    const [itemRef, setItemRef] = useState<DocumentReference>();
    const [imageRef, setImageRef] = useState<StorageReference>();

    const [isOwner, setIsOwner] = useState(false);

    const redirectToNewFoundPost = () => {
        navigation.navigate("New Found Post", { item: item, owner: owner });
    }

    const redirectToNewLostPost = () => {
        navigation.navigate("New Lost Post", { item: item, owner: owner });
    }
    
    const deleteItemAlert = () => {
        Alert.alert('Delete Item?', 'You cannot undo this action!', [
            {
                text: 'Cancel',
                onPress: () => console.log('Cancel Pressed'),
                style: 'cancel',
            },
            { text: 'OK', onPress: deleteItem },
        ]);
    }

    const deleteItem = () => {
        navigation.navigate("Loading");
        Promise.all([deleteObject(imageRef!), deleteDoc(itemRef!)]).then(() => {
            // File deleted successfully
            navigation.navigate("My Items");
        }).catch((error) => {
            console.warn(error);
            // Uh-oh, an error occurred!
        });
    }

    const setItemInfo = useCallback(() => {
        getDoc(doc(collection(db, "items"), route.params!.itemId)).then((snapshot) => {
            if (snapshot.get("ownerId") as string == auth.currentUser!.uid) setIsOwner(true);
            
            setItemRef(snapshot.ref);
            
            const storage = getStorage();
            const imageRef = ref(storage, 'images/items/' + route.params!.itemId);

            setImageRef(imageRef);
            
            getDownloadURL(imageRef!).then((url) => {
                console.log(url);
                setItem({
                    _id: route.params!.itemId,
                    name: snapshot.get("name") as string,
                    description: snapshot.get("description") as string,
                    ownerId: snapshot.get("ownerId") as string,
                    isLost: snapshot.get("name") as boolean,
                    createdAt: snapshot.get("createdAt") as number || -1,
                    secretCode: snapshot.get("secretCode") as string || "",
                    imageSrc: url ? { uri: url } : require("../assets/defaultimg.jpg"),
                });
            }).catch((error) => {
                console.warn(error);
            });

            if (snapshot.get("ownerId") as string) {
                getDoc(doc(collection(db, "users"), snapshot.get("ownerId") as string)).then((snapshot) => {
                    setOwner({
                        _id: snapshot.id,
                        name: snapshot.get("name") as string,
                        pfpUrl: snapshot.get("pfpUrl") as string,
                    });
                });
            }
        });
    }, []);

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
        
        setItemInfo();
    }, [isLoggedIn]);

    if (isOwner) return (
        <View style={styles.container}>
            <Image
                style={styles.itemImage}
                source={item.imageSrc} />
            <View style={{margin: 5}}>
                <Text style={styles.description}>{item.description}</Text>
                <View style={{ display:"flex", alignItems: "center", flexDirection: "row" }}>
                    <TouchableOpacity
                        onPress={redirectToNewLostPost}
                        style={styles.postButton}>
                        <Text style={styles.buttonText}>Report item as lost</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={deleteItemAlert}
                        style={styles.deleteItemButton}>
                        <Icon name="delete" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
    
    return (
        <View style={styles.container}>
            <Image
                style={styles.itemImage}
                source={item.imageSrc} />
            <Text style={styles.description}>{item.description}</Text>
            <View style={{ width: "100%", alignContent: "center", flexDirection: "row" }}>
                <Text>{owner.name}</Text>
                <TouchableOpacity
                    onPress={redirectToNewFoundPost}
                    style={styles.postButton}>
                    <Text style={styles.buttonText}>Report item as found</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    buttonText: {
        textAlign: 'left',
        color: "#FFF",
        fontSize: 15,
    },
    itemImage: {
        width: "100%",
        marginBottom: 12,
        aspectRatio: 1 / 1,
    },
    description: {
        fontSize: 16,
        margin: 5,
        marginHorizontal: 10,
    },
    postButton: {
        backgroundColor: lightThemeColors.primary,
        height: 40,
        paddingHorizontal: 10,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: "center",
    },
    deleteItemButton: {
        backgroundColor: lightThemeColors.red,
        height: 40,
        borderRadius: 10,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: "center",
    },
});

export default ItemViewScreen;