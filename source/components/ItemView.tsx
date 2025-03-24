import { collection, deleteDoc, deleteField, doc, DocumentReference, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { useState, useEffect, useCallback } from "react";
import { View, Text, Button, StyleSheet, Pressable, Alert } from "react-native";
import { auth, db } from "../../firebase";
import { Image } from "react-native-elements";
import { deleteObject, getDownloadURL, getStorage, ref, StorageError, StorageErrorCode, StorageReference } from "firebase/storage";
import { TouchableOpacity } from "react-native-gesture-handler";
import { lightThemeColors } from "../assets/Colors";
import { CommonActions, RouteProp, useFocusEffect } from "@react-navigation/native";

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
    });

    const [owner, setOwner] = useState({
        _id: "",
        name: "",
        pfpUrl: "",
    });

    const [imageSrc, setImageSrc] = useState(require("../assets/defaultimg.jpg"));
    const [itemRef, setItemRef] = useState<DocumentReference>();
    const [imageRef, setImageRef] = useState<StorageReference>();

    const [isOwner, setIsOwner] = useState(false);

    const redirectToNewFoundPost = () => {
        navigation.navigate("New Found Post", { item: item, owner: owner });
    }

    const redirectToNewLostPost = () => {
        navigation.navigate("New Lost Post", { item: item,  });
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
            setItem({
                _id: route.params!.itemId,
                name: snapshot.get("name") as string,
                description: snapshot.get("description") as string,
                ownerId: snapshot.get("ownerId") as string,
                isLost: snapshot.get("name") as boolean,
            });

            if (snapshot.get("ownerId") as string == auth.currentUser!.uid) setIsOwner(true);
            
            setItemRef(snapshot.ref);
            
            const storage = getStorage();
            const imageRef = ref(storage, 'images/items/' + route.params!.itemId);

            setImageRef(imageRef);
            
            getDownloadURL(imageRef!).then((url) => {
                console.log(url);
                setImageSrc({ uri: url });
            }).catch((error) => {
                console.warn(error);
            });

            if (snapshot.get("owner") as string) {
                getDoc(doc(collection(db, "users"), snapshot.get("owner") as string)).then((snapshot) => {
                    setOwner({
                        _id: snapshot.id,
                        name: snapshot.get("name") as string,
                        pfpUrl: snapshot.get("pfpUrl") as string,
                    });
                });
            }
        });
    }, []);

    useEffect(() => {
        if (!auth.currentUser) return;
        
        setItemInfo();
    }, []);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                setItemInfo();
            } else {
                navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
            }
        });

        return unsubscribe;
    }, []);

    if (isOwner) return (
        <View style={styles.container}>
            <Image
                style={styles.itemImage}
                source={imageSrc} />
            <Text style={styles.description}>{item.description}</Text>
            <View style={{ width: "100%", alignContent: "center" }}>
                <TouchableOpacity
                    onPress={redirectToNewLostPost}
                    style={styles.markAsLostButton}>
                    <Text style={styles.buttonText}>Report item as lost</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={deleteItemAlert}
                    style={styles.deleteItemButton}>
                    <Text style={styles.buttonText}>Delete item</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
    
    return (
        <View style={styles.container}>
            <Image
                style={styles.itemImage}
                source={imageSrc} />
            <Text style={styles.description}>{item.description}</Text>
            <View style={{ width: "100%", alignContent: "center" }}>
                <TouchableOpacity
                    onPress={redirectToNewFoundPost}
                    style={styles.markAsLostButton}>
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

export default ItemViewScreen;