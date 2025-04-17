import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { lightThemeColors } from "../assets/Colors";
import { auth, db } from "../../my_firebase";
import { addDoc, collection, doc, documentId, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import PressableOpacity from "../assets/MyElements";

export type PostViewRouteParams = {
    item: {name: string},
}

export function LostPostViewScreen({ navigation, route }: { navigation: any, route: any }) {
    const [item, setItem] = useState({});

    const [author, setAuthor] = useState({});

    const [post, setPost] = useState({});

    const [chats, setChats] = useState([]);

    const [message, setMessage] = useState("");
    
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [isAuthor, setIsAuthor] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    
    const createChat = () => {
        try {
            setIsNavigating(true);
            const chatData = {
                userIds: [auth.currentUser?.uid, author._id],
            };

            addDoc(collection(db, "chats"), chatData).then((dRef) => {
                let postData = {_id: dRef.id, ...route.params!.post};
                postData.chatIds.push(dRef.id);
                setPost(postData);
                return Promise.all([dRef, updateDoc(doc(db, "lostPosts", route.params!.post!._id), postData)]);
            }).then(([dRef]) => {
                navigation.navigate("Chat", {id: dRef.id, chat: chatData});
            }).catch(err => {
                console.warn(err);
            });
        } catch (err) {
            console.warn(err);
        } finally {
            setIsNavigating(false);
        }
    }

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
        if (!(post?.chatIds) || post.chatIds.length == 0) return;

        const unsubscribe = onSnapshot(query(collection(db, "chats"), where(documentId(), "in", post.chatIds)), (snapshot) => {
            setChats(snapshot.docs.map((doc) => ({_id: doc.id, ...doc.data()})));
        });
        
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!isLoggedIn) return;
        const itemData = {...route.params!.item};
        itemData.imageSrc = {uri: route.params!.item.imageSrc};
        setItem(itemData);
        setAuthor(route.params!.author);
        setPost(route.params!.post);
        setMessage(route.params!.post.message);
        if (auth.currentUser!.uid == itemData._id) setIsOwner(true);
        if (auth.currentUser!.uid == route.params!.author._id) setIsAuthor(true);
        console.log(route.params!.item.imageSrc);
    }, [isLoggedIn]);

    const chatOptions = () => {
        if (!isAuthor && chats.length == 0) {
            return (
                <View>
                    <PressableOpacity onPress={createChat} disabled={isNavigating}>
                        <Text>Start chat with {author.name || "owner"}</Text>
                    </PressableOpacity>
                </View>
            );
        }
    }

    if (post?._id == "") {
        return (
            <View>
                <Text>Post not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
                <View style={styles.itemContainer}>
                    <View style={[styles.horizontal, {width: "100%", justifyContent: "flex-start", alignItems: "center", padding: 4}]}>
                        <Image
                            style={styles.pfp}
                            source={author.pfpUrl ? {uri: author.pfpUrl} : undefined}
                            defaultSource={require("../assets/defaultpfp.jpg")} />
                        <View>
                            <Text style={styles.userName}>{author.name}</Text>
                            <Text style={styles.timestamp}>
                                {item.createdAt ? new Date((item.createdAt)!.seconds*1000).toLocaleDateString() : "unknown time"}
                            </Text>
                        </View>
                    </View>
                    <PressableOpacity
                        onPress={() => { navigation.navigate("Item View", { itemId: item._id, itemName: item.name }) }}
                        disabled={isNavigating}>
                        <Image source={item.imageSrc ? {uri: item.imageSrc} : undefined} style={styles.itemImage} defaultSource={require("../assets/defaultimg.jpg")} />
                        <View style={styles.itemListItemView}>
                            <Text style={styles.itemTitle}>{item.name}</Text>
                        </View>
                    </PressableOpacity>
                </View>
                <View>
                    <TextInput
                        multiline={true}
                        placeholder="Where did you last put this item?"
                        onChangeText={text => setMessage(text)}
                        value={message}
                        editable={isAuthor && !isNavigating}
                        selectTextOnFocus={false} />
                </View>
                {chatOptions()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    itemContainer: {
        width: "100%",
    },
    horizontal: {
        flexDirection: "row",
    },
    addItemTitle: {
        margin: 20,
        color: lightThemeColors.textLight,
    },
    imagePressableContainer: {
        alignItems: 'center',
    },
    imageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pfp: {
        borderRadius: 99999,
        width: 42, 
        aspectRatio: 1/1,
        marginRight: 12,
    },
    userName: {
        fontSize: 15,
        fontWeight: "600",
    },
    timestamp: {
        fontSize: 12,
        margin: 2,
    },
    itemImage: {
        aspectRatio: 1 / 1,
    },
    postTitle: {
        fontSize: 20,
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
    },
});


export default LostPostViewScreen;