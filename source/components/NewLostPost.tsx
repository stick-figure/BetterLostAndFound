import { addDoc, collection } from "firebase/firestore";
import { getStorage, ref, uploadBytes } from "firebase/storage";
import { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, Image, Pressable, ImageSourcePropType, TextInput } from "react-native";
import { Input } from "react-native-elements";
import { launchImageLibrary, MediaType } from 'react-native-image-picker';

import { auth, db } from "../../firebase";
import { lightThemeColors } from "../assets/Colors";
import { TouchableOpacity } from "react-native-gesture-handler";
import { CommonActions } from "@react-navigation/native";


export function NewLostPostScreen({ navigation, route }: { navigation: any, route: any }) {
    const [item, setItem] = useState({
        _id: "",
        name: "",
        description: "",
        owner: "",
        isLost: false,
    });
    const [message, setMessage] = useState("");

    const [useLocation, setUseLocation] = useState(false);

    const [uploading, setUploading] = useState(false);

    const uploadPost = () => {
        const postData = {
            itemID: item._id,
            message: message,
            authorId: auth.currentUser?.uid,
            createdAt: Date.now(),
            resolved: false,
            resolvedAt: -1,
            chats: [],
        };

        navigation.navigate("Loading");

        addDoc(collection(db, "items"), postData).then(() => {
            
        });
    }
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {

            } else {
                navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
            }
        });

        return unsubscribe;
    }, );

    if (uploading) {
        return (
            <View style={styles.container}>
                <Text>Uploading...</Text>
            </View>);
    }
    return (
        <View style={styles.container}>
            <Input
                multiline={true}
                placeholder="Describe some identifying features"
                onChangeText={text => setMessage(text)}
                value={message}
            />
            <TouchableOpacity
                style={styles.saveButton}
                disabled={message.trim().length < 1}
                onPress={uploadPost}
            >
                <Text style={styles.saveButtonText}>Post</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
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
        flex: 1,
        aspectRatio: 1 / 1,
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