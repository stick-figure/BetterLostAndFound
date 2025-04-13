import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { lightThemeColors } from "../assets/Colors";
import { auth } from "../../firebase";
import { getDownloadURL } from "firebase/storage";

export type PostViewRouteParams = {
    post: {title: string},
}

export function LostPostViewScreen({ navigation, route }: { navigation: any, route: any }) {
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
    const [author, setAuthor] = useState({
        _id: "",
        name: "",
        pfpUrl: "",
    });

    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    
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
        const itemData = {...route.params!.item};
        itemData.imageSrc = {uri: route.params!.item.imageSrc};
        setItem(itemData);
        setAuthor(route.params!.author);
        setTitle(route.params!.post.title);
        setMessage(route.params!.post.message);
        console.log(route.params!.item.imageSrc);
    }, [isLoggedIn]);

    return (
        <View style={styles.container}>
                <View style={styles.itemContainer}>
                    <TouchableOpacity
                        onPress={() => { navigation.navigate("Item View", { itemId: item._id, itemName: item.name }) }}>
                        <Image source={item.imageSrc} style={styles.itemImage} />
                        <View style={styles.itemListItemView}>
                            <Text style={styles.itemTitle}>{item.name}</Text>
                            <Text style={styles.itemSubtitle}>{author.name}</Text>
                            <Text style={styles.itemSubtitle}>{item.description}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <View>
                    <TextInput
                        placeholder="Title"
                        onChangeText={text => setTitle(text)}
                        value={title}
                    />
                    <TextInput
                        multiline={true}
                        placeholder="Where did you last put this item?"
                        onChangeText={text => setMessage(text)}
                        value={message}
                    />
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
        width: 100,
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


export default LostPostViewScreen;