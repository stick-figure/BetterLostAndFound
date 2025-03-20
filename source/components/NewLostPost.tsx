import { addDoc, collection } from "firebase/firestore";
import { getStorage, ref, uploadBytes } from "firebase/storage";
import { useState } from "react";
import { View, Text, Button, StyleSheet, Image, Pressable, ImageSourcePropType } from "react-native";
import { Input } from "react-native-elements";
import { launchImageLibrary, MediaType } from 'react-native-image-picker';

import { auth, db } from "../../firebase";
import { lightThemeColors } from "../assets/Colors";
import { TouchableOpacity } from "react-native-gesture-handler";


export function NewLostPostScreen({ navigation, route }: {navigation: any, route: any}) {
    const [itemID, setItemID] = useState("");
    const [item, setItem] = useState();
    const [message, setMessage] = useState("");
    const [tags, setLocationTags] = useState("");
    
    const [uploading, setUploading] = useState(false);
    
    const uploadPost = () => {
      const postData = {
        itemID: itemID,
        message: message,
        author: auth.currentUser?.uid,
      };

      navigation.navigate("Loading");

      const docRef = addDoc(collection(db, "items"), postData);
      
    }

    if (uploading) {
      return (
        <View style={styles.container}>
          <Text>Uploading...</Text>
        </View>);
    }
    return
    return (
        <View style={styles.container}>
            <Input
                label="Name"
                placeholder="What is this item called?"
                onChangeText={text => setName(text)}
                value={name}
            />
            <Input
                label="Description"
                placeholder="Describe some identifying features"
                onChangeText={text => setDescription(text)}
                value={description}
            />
            <TouchableOpacity 
              style={styles.saveButton}
              disabled={name.trim().length < 1 || description.trim().length < 1 || imgSrc.uri == ""}
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