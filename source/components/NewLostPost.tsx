import { addDoc, collection } from "firebase/firestore";
import { getStorage, ref, uploadBytes } from "firebase/storage";
import { useState } from "react";
import { View, Text, Button, StyleSheet, Image, Pressable, ImageSourcePropType, TouchableOpacity } from "react-native";
import { Input } from "react-native-elements";
import { launchImageLibrary, MediaType } from 'react-native-image-picker';

import { auth, db } from "../../firebase";
import { lightThemeColors } from "../assets/Colors";


export function NewLostPostScreen({ navigation, route }: {navigation: any, route: any}) {
    const [item, setItem] = useState<Item>();
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");

    const [imgSrc, setImgSrc] = useState({uri: ""});
    const [uploading, setUploading] = useState(false);
    const [transferred, setTransferred] = useState(0);
    
    const selectImage = () => {
      const options = {
        mediaType: "photo" as MediaType,
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
        selectionLimit: 1,
      };

      launchImageLibrary(options, (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          console.log('ImagePicker Error: ', response.errorMessage);
        } else if (response.assets) {
          const source = { uri: response.assets[0].uri! };
          setImgSrc(source);
        }
      }).catch(()=> {console.log("whoop de doo")});
    };

    const uploadImage = async (imageId: string) => {
        setUploading(true);
        navigation.navigate("Loading");
        const response = await fetch(imgSrc.uri);
        const blob = await response.blob();

        const storage = getStorage();
        const storageRef = ref(storage, "images/items/" + imageId);
        console.log(storageRef.fullPath);
        
        uploadBytes(storageRef, blob).then((snapshot) => {
            setUploading(false)
            setImgSrc({uri: ""});
        }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            navigation.navigate("Error", {code: errorCode, message: errorMessage});
        });
    }

    const uploadItem = () => {
      const lostPostData = {
        title: title,
        message: message,
        author: auth.currentUser?.uid,
        itemId: item?._id,
        created: Date.now(),
      };
      
      navigation.navigate("Loading");

      const docRef = addDoc(collection(db, "lostPosts"), lostPostData);
      docRef.then((dRef) => {
        uploadImage(dRef.id).then(() => {
          navigation.navigate("Home");
        });
      });
    }

    if (uploading) {
      return (
        <View style={styles.container}>
          <Text>Uploading...</Text>
        </View>);
    }
    
    return (
        <View style={styles.container}>
            <Input
                placeholder="Title"
                onChangeText={text => setTitle(text)}
                value={title}
            />
            <Input
                label="Message"
                placeholder="Where did I last put this item? Which room? What does it look like?"
                onChangeText={text => setMessage(text)}
                value={message}
            />
            <TouchableOpacity 
              style={styles.saveButton}
              disabled={title.trim().length == 0 || message.trim().length == 0}
              onPress={uploadItem}
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
      aspectRatio: 1/1,
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