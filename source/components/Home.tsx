import { useEffect, useState } from "react";
import { View, Button, StyleSheet, Text, FlatList, Image, ActivityIndicator } from "react-native";
import { FAB, Input, ListItem } from "react-native-elements";
import { TouchableOpacity } from "react-native-gesture-handler";
import { lightThemeColors } from "../assets/Colors";
import { onSnapshot, query, collection, where, getDoc, DocumentSnapshot, doc, FieldValue, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { CommonActions } from "@react-navigation/native";
import { Icon } from "react-native-vector-icons/Icon";

interface LostPostListItem {
    _id: string,
    title: string,
    message: string,
    authorName: string,
    pfpSrc: object,
    imageSrc: object,
    createdAt: FieldValue,
}

export function HomeScreen({ navigation }: { navigation: any }) {
    const [lostPosts, setLostPosts] = useState<Array<LostPostListItem>>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setIsLoggedIn(true);
            } else {
                navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
            }
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!isLoggedIn) return;

        const unsubscribe = onSnapshot(query(collection(db, 'lostPosts')), (snapshot: { docs: any[]; }) => {
            const storage = getStorage();
            const promises = snapshot.docs.map(async (postDoc) => {
                let item;
                try {
                    item = await getDoc(doc(db, "items", postDoc.data().itemId));
                } catch (err) {
                    console.warn(err);
                }

                let owner;
                try {
                    owner = await getDoc(doc(db, "users", postDoc.data().authorId));
                } catch (err) {
                    console.warn(err);
                }
                
                return {
                    _id: postDoc.id,
                    title: postDoc.data().title,
                    message: postDoc.data().message,
                    authorName: (owner?.data() ? (owner as DocumentSnapshot).data()!.name : postDoc.data().ownerId) || "Unknown User",
                    pfpSrc: (owner?.data() ? { uri: (owner as DocumentSnapshot).data()!.pfpUrl } : require("../assets/defaultpfp.jpg")),
                    imageSrc: (item?.data() ? { uri: (item as DocumentSnapshot).data()!.imageSrc } : require("../assets/defaultimg.jpg")),
                    createdAt: postDoc.data().createdAt,
                };
            });

            Promise.all(promises).then((res) => setLostPosts(res)).catch((error) => {console.warn(error)});
        });

        return unsubscribe;
    }, [isLoggedIn]);

    
    const navigateToPost = async (postId: string) => {
        try {
            const postData = (await getDoc(doc(db, "lostPosts", postId))).data()!;
            const itemData = (await getDoc(doc(db, "items", postData!.itemId))).data()!;
            itemData._id = postData!.itemId;
            const authorData = (await getDoc(doc(db, "users", postData!.authorId))).data()!;
            authorData._id = postData!.authorId;
            navigation.navigate("Lost Post View", {post: postData, item: itemData, author: authorData});
        } catch (err) {
            console.warn(err);
        }

    }

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={() => navigation.navigate("Return Item")}
                style={styles.returnItemButton}>
                <Text style={styles.text}>Report Item as Found</Text>
            </TouchableOpacity>
            <View style={styles.itemList}>
                <FlatList
                    keyExtractor={lostPost => lostPost._id.toString()}
                    ListEmptyComponent={<ActivityIndicator size="large" />}
                    data={lostPosts}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => navigateToPost(item._id)}>
                            <View style={styles.itemListItemView}>
                                <View style={[styles.horizontal, {width: "100%", justifyContent: "flex-start", alignItems: "center"}]}>
                                    <Image
                                        style={styles.pfp}
                                        source={item.pfpSrc} />
                                    <View>
                                        <Text style={styles.userName}>{item.authorName}</Text>
                                    </View>
                                </View>
                                <Text style={styles.itemTitle}>{item.title}</Text>
                                <Text style={styles.timestamp}>{new Date((item.createdAt).seconds*1000).toLocaleDateString()}</Text>
                                <Text style={styles.itemContent}>{item.message}</Text>
                                <Image source={item.imageSrc} style={styles.itemImage} />
                            </View>
                        </TouchableOpacity>
                        
                        )}
                />
            </View>

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
    horizontal: {
        flexDirection: "row",
    },
    text: {
        textAlign: "center",
        color: lightThemeColors.textDark,
        fontSize: 18,
    },
    itemList: {
        width: "100%",
        margin: 10,
        backgroundColor: "white",
    },
    itemListItemView: {
        margin: 4,
        alignSelf: 'stretch',
    },
    itemImage: {
        alignSelf: 'stretch',
        aspectRatio: 1,
    },
    itemTitle: {
        color: lightThemeColors.textLight,
        fontWeight: "bold",
        fontSize: 18,
    },
    itemSubtitle: {
        color: lightThemeColors.textLight,
        fontSize: 12,
    },
    itemContent: {
        color: lightThemeColors.textLight,
        fontSize: 14,
        overflow: "hidden",
    },
    returnItemButton: {
        width: 370,
        marginTop: 10,
        padding: 10,
        backgroundColor: lightThemeColors.primary,
        borderRadius: 7,
    },
    pfp: {
        borderRadius: 99999,
        width: 42, 
        aspectRatio: 1/1,
    },
    userName: {
        fontSize: 15,
        marginHorizontal: 12,
        fontWeight: "600",
    },
    timestamp: {
        fontSize: 12,
        margin: 2,
    },
});
export default HomeScreen;