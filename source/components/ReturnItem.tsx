import { CommonActions, NavigationProp, NavigationState, ParamListBase, Route } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Button, FlatList, Image, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, db } from "../../my_firebase";
import PressableOpacity from "../assets/MyElements";
import { Icon } from "react-native-elements";
import { lightThemeColors } from "../assets/Colors";
import { getDoc, doc, onSnapshot, query, collection } from "firebase/firestore";
import { getStorage } from "firebase/storage";


export function ReturnItemScreen({ navigation }: { navigation: any }) {
    const [lostPosts, setLostPosts] = useState<any[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    
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
            setIsLoading(true);
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
                    authorName: (owner?.data() ? owner.data()!.name : postDoc.data().ownerId) || "Unknown User",
                    pfpSrc: owner?.data()?.pfpUrl,
                    imageSrc: item?.data()?.imageSrc,
                    createdAt: postDoc.data().createdAt,
                };
            });

            Promise.all(promises).then((res) => {
                setLostPosts(res); setIsLoading(false);
            }).catch((error) => {console.warn(error)});
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
        <View>
            <PressableOpacity
                onPress={() => navigation.navigate("Search Items")}>
                <Text><Icon name="search" type="material-icons" />Search all items</Text>
            </PressableOpacity>

            <PressableOpacity
                onPress={() => {/*navigation.navigate("New Found Post")*/}}
                >
                <Text>Report uncataloged item</Text>
            </PressableOpacity>

            <View style={styles.itemList}>
                <FlatList
                    keyExtractor={lostPost => lostPost._id.toString()}
                    ListEmptyComponent={
                        <View style={{flex: 1, alignContent: "center", alignSelf: "stretch", justifyContent: "center"}}>
                            {isLoading ? <ActivityIndicator size="large" /> : <Icon name="cactus" type="material-community" />}
                        </View>
                    }
                    data={lostPosts}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => navigateToPost(item._id)}>
                            <View style={styles.itemListItemView}>
                                <View style={[styles.horizontal, {width: "100%", justifyContent: "flex-start", alignItems: "center"}]}>
                                    <Image
                                        style={styles.pfp}
                                        source={{uri: item?.pfpSrc}} 
                                        defaultSource={require("../assets/defaultpfp.jpg")} />
                                    <View>
                                        <Text style={styles.userName}>{item.authorName}</Text>
                                    </View>
                                </View>
                                <Text style={styles.itemTitle}>{item.title}</Text>
                                <Text style={styles.timestamp}>
                                    {item.createdAt ? new Date((item.createdAt)!.seconds*1000).toLocaleDateString() : "unknown time"}
                                </Text>
                                <Text style={styles.itemContent}>{item.message}</Text>
                                <Image source={item.imageSrc} style={styles.itemImage} defaultSource={require("../assets/defaultimg.jpg")} />
                            </View>
                        </TouchableOpacity>
                        
                        )}
                />
            </View>
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
        flex: 1,
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

export default ReturnItemScreen;