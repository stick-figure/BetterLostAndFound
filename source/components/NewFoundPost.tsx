import { serverTimestamp, addDoc, collection, updateDoc, doc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Input } from "react-native-elements";
import { auth, db } from "../../firebase";
import { lightThemeColors } from "../assets/Colors";
import { CommonActions } from "@react-navigation/native";

export function NewLostPostScreen({ navigation, route }: { navigation: any, route: any }) {
    const [item, setItem] = useState({
        _id: "",
        name: "",
        description: "",
        ownerId: "",
        isLost: false,
        timesLost: -1,
        secretCode: "",
        createdAt: -1,
        imageSrc: require("../assets/defaultimg.jpg"),
    });
    const [owner, setOwner] = useState({
        _id: "",
        name: "",
        pfpUrl: "",
    });

    const [message, setMessage] = useState("");

    const [useLocation, setUseLocation] = useState(false);

    const [uploading, setUploading] = useState(false);

    const uploadPost = () => {
        const postData = {
            itemId: item._id,
            itemOwnerId: item.ownerId,
            message: message,
            authorId: auth.currentUser?.uid,
            createdAt: serverTimestamp(),
            resolved: false,
            resolvedAt: -1,
            resolveReason: "",
            views: 0,
        };

        navigation.navigate("Loading");

        addDoc(collection(db, "lostPosts"), postData).then((postRef) => {
            return updateDoc(doc(db, "items", item._id), {isLost: true, lostPostId: postRef.id, timesLost: item.timesLost + 1});
        }).then(() => {
            navigation.dispatch((state: {routes: any[]}) => {
                const topScreen = state.routes[0];
                const thisScreen = state.routes[state.routes.length - 1];
                const routes = [topScreen, thisScreen];
                return CommonActions.reset({
                    ...state,
                    index: routes.length - 1,
                    routes,
                });
            });
//            navigation.navigate("Lost Post View", {item: item, owner: owner, author: owner, post: postData});
        });
    }

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
        if (route.params?.item) setItem(route.params!.item);
        if (route.params?.owner) setOwner(route.params!.owner);
    }, [isLoggedIn]);

    if (uploading) {
        return (
            <View style={styles.container}>
                <Text>Uploading...</Text>
            </View>);
    }

    return (
        <View style={styles.container}>
            <View style={styles.horizontal}>
                <View style={styles.itemContainer}>
                    <TouchableOpacity
                        onPress={() => { navigation.navigate("Item View", { itemId: item._id, itemName: item.name }) }}>
                        <Image source={item.imageSrc} style={styles.itemImage} />
                        <View style={styles.itemListItemView}>
                            <Text style={styles.itemTitle}>{item.name}</Text>
                            <Text style={styles.itemSubtitle}>{owner.name}</Text>
                            <Text style={styles.itemSubtitle}>{item.description}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <View>
                    <Input
                        multiline={true}
                        placeholder="Describe some identifying features"
                        onChangeText={text => setMessage(text)}
                        value={message}
                    />
                    <TouchableOpacity
                        style={styles.saveButton}
                        disabled={message.trim().length <= 0}
                        onPress={uploadPost}
                    >
                        <Text style={styles.saveButtonText}>Post</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
    },
    itemContainer: {
        width: 100,
    },
    horizontal: {
        flexDirection: "row",
    },
    addItemTitle: {
        margin: 20,
        color: lightThemeColors.textLight,
    },
    imagePressableContainer: {
        width: "100%",
        alignItems: 'center',
    },
    imageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemImage: {
        width: "100%",
        aspectRatio: 1 / 1,
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
    imageLabel: {
        fontSize: 16,
        textAlign: "center",
        color: lightThemeColors.textLight,
        fontWeight: "bold",
    },
    saveButton: {
        width: 280,
        backgroundColor: lightThemeColors.primary,
        borderRadius: 7,
        padding: 10,
    },
    saveButtonText: {
        fontSize: 16,
        textAlign: "center",
        color: lightThemeColors.textDark,
        fontWeight: "bold",
    }
});


export default NewLostPostScreen;