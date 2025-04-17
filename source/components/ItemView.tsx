import { collection, deleteDoc, deleteField, doc, DocumentReference, getDoc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { useState, useEffect, useCallback, ReactNode } from "react";
import { View, Text, Button, StyleSheet, Pressable, Alert, TextInput, Image } from "react-native";
import { auth, db } from "../../my_firebase";
import { deleteObject, getStorage, ref, StorageReference } from "firebase/storage";
import { TouchableOpacity } from "react-native-gesture-handler";
import { lightThemeColors } from "../assets/Colors";
import { CommonActions, RouteProp } from "@react-navigation/native";
import PressableOpacity from "../assets/MyElements";
import { Icon } from "react-native-elements";

export type ItemViewRouteParams = {
    itemId: string,
    itemName: string,
}

export function ItemViewScreen({ navigation, route }: { navigation: any, route: any }) {
    const [item, setItem] = useState({});
    
    const [owner, setOwner] = useState({});

    const [itemRef, setItemRef] = useState<DocumentReference>();
    const [imageRef, setImageRef] = useState<StorageReference>();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

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
                ...snapshot.data()
            });

            if (snapshot.get("ownerId") as string) {
                getDoc(doc(collection(db, "users"), snapshot.get("ownerId") as string)).then((user_snapshot) => {
                    setOwner({
                        _id: user_snapshot.id,
                        ...user_snapshot.data()
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

    const actionButtons = () => {
        let arr: ReactNode[] = [];

        if (item?.isLost) {
            arr.push(
                <View style={{ flex: 1 }}>
                    <PressableOpacity
                        onPress={redirectToCurrentLostPost}
                        style={styles.postButton}>
                        <Text style={styles.buttonText}>Go to lost post</Text>
                    </PressableOpacity>
                </View>
                
            );
            arr.push(
                <View style={{ flex: 1 }}>
                    <PressableOpacity
                        onPress={redirectToNewFoundPost}
                        style={styles.postButton}>
                        <Text style={styles.buttonText}>Report item as found</Text>
                    </PressableOpacity>
                </View>
            );
        } else if (isOwner) {
            arr.push(
                <View style={{ flex: 1 }}>
                    <PressableOpacity
                        onPress={redirectToNewLostPost}
                        style={styles.postButton}>
                        <Text style={styles.buttonText}>Mark item as lost</Text>
                    </PressableOpacity>
                </View>
            );
        }
        if (isOwner) {
            arr.push(
                <View>
                    <PressableOpacity
                        onPress={deleteItemAlert}
                        style={styles.deleteItemButton}>
                        <Icon name="delete" type="material-community" />
                    </PressableOpacity>
                </View>
            );
        }
        return (
            <View style={[styles.horizontal, {width: "100%", padding: 8, alignSelf: "center"}]}>
                <View style={[{flexDirection: "row", flex: 1, height: 40}]}>
                    {arr}
                </View>
            </View>
            
        );
    }

    if (isOwner) return (
        <View style={styles.container}>
            <View style={{margin: 5}}>
                <Image
                    style={styles.itemImage}
                    source={item.imageSrc ? {uri: item.imageSrc} : undefined} 
                    defaultSource={require("../assets/defaultimg.jpg")} />
                <TextInput 
                    style={styles.description}
                    value={description} />
                {actionButtons()}
                <Text>Posts mentioning this item</Text>
            </View>
        </View>
    );
    
    return (
        <View style={styles.container}>
            <View style={[styles.horizontal, {width: "100%", justifyContent: "flex-start"}]}>
                <Image
                    style={styles.pfp}
                    source={owner.pfpUrl ? {uri: owner.pfpUrl} : undefined}
                    defaultSource={require("../assets/defaultpfp.jpg")} />
                <Text>{owner.name}</Text>
            </View>
            
            <Image
                style={styles.itemImage}
                source={item.imageSrc ? {uri: item.imageSrc} : undefined}
                defaultSource={require("../assets/defaultimg.jpg")}/>
            <Text style={styles.description}>{item.description}</Text>
            {actionButtons()}
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
        width: "100%",
        height: "100%",
        paddingHorizontal: 10,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: "center",
        
    },
    deleteItemButton: {
        backgroundColor: lightThemeColors.red,
        height: "100%",
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