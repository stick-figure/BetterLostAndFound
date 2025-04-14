import { collection, deleteDoc, deleteField, doc, DocumentReference, getDoc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
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
        lostPostId: "",
        timesLost: -1,
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

    const redirectToCurrentLostPost = async () => {
        try {
            const postData = (await getDoc(doc(collection(db, "lostPosts"), item.lostPostId))).data()!;
            postData._id = item.lostPostId;
            navigation.navigate("Lost Post View", { item: item, author: owner, post: postData });
        } catch (error) {
            console.warn(error);
        }
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
            const storage = getStorage();
            
            setItemRef(snapshot.ref);
            setImageRef(ref(storage, "images/items/" + route));
            
            setItem({
                _id: route.params!.itemId,
                name: snapshot.get("name") as string,
                description: snapshot.get("description") as string,
                ownerId: snapshot.get("ownerId") as string,
                isLost: snapshot.get("isLost") as boolean,
                timesLost: snapshot.get("timesLost") as number,
                lostPostId: snapshot.get("lostPostId") as string,
                createdAt: snapshot.get("createdAt") as number || -1,
                secretCode: snapshot.get("secretCode") as string || "",
                imageSrc: snapshot.get("imageSrc") ? { uri: snapshot.get("imageSrc") as string } : require("../assets/defaultimg.jpg"),
            });

            if (snapshot.get("ownerId") as string) {
                getDoc(doc(collection(db, "users"), snapshot.get("ownerId") as string)).then((user_snapshot) => {
                    setOwner({
                        _id: user_snapshot.id,
                        name: user_snapshot.get("name") as string,
                        pfpUrl: user_snapshot.get("pfpUrl") as string,
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
            <View style={{margin: 5}}>
                <Image
                    style={styles.itemImage}
                    source={item.imageSrc} />
                <Text style={styles.description}>{item.description}</Text>
                <View style={[styles.horizontal, { display:"flex", alignItems: "center", }]}>
                    {item.isLost ?  
                        (<View>
                            <TouchableOpacity
                            onPress={redirectToCurrentLostPost}
                            style={styles.postButton}>
                            <Text style={styles.buttonText}>Go to lost post</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={redirectToNewLostPost}
                            style={styles.postButton}>
                            <Text style={styles.buttonText}>Mark item as lost</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        onPress={redirectToNewFoundPost}
                        style={styles.postButton}>
                        <Text style={styles.buttonText}>Report item as found</Text>
                    </TouchableOpacity>
                    
                    
                    <TouchableOpacity
                        onPress={deleteItemAlert}
                        style={styles.deleteItemButton}>
                        <Icon name="delete" />
                    </TouchableOpacity>
                </View>
                <Text>Posts mentioning this item</Text>
            </View>
        </View>
    );
    
    return (
        <View style={styles.container}>
            <View style={[styles.horizontal, {width: "100%", justifyContent: "flex-start"}]}>
                <Image
                    style={styles.pfp}
                    source={owner.pfpUrl != "" ? {uri: owner.pfpUrl} : require("../assets/defaultpfp.jpg")} />
                <Text>{owner.name}</Text>
            </View>
            
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
    horizontal: {
        flexDirection: "row",
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
    pfp: {
        borderRadius: 99999,
        width: 48, 
        aspectRatio: 1/1,
    },
    userName: {
        fontSize: 16,
        textAlignVertical: "center", 
        marginHorizontal: 8,
        fontWeight: "600",
    },
});

export default ItemViewScreen;