import { addDoc, collection } from "firebase/firestore";
import { getStorage, ref, uploadBytes } from "firebase/storage";
import { useState } from "react";
import { View, Text, Button, StyleSheet, Image, Pressable, ImageSourcePropType, TouchableOpacity } from "react-native";
import { Input } from "react-native-elements";
import { launchImageLibrary, MediaType } from 'react-native-image-picker';

import { auth, db } from "../../firebase";
import { lightThemeColors } from "../assets/Colors";


export function AddItemScreen({ navigation, route }: {navigation: any, route: any}) {
    const createNewItem = () => {

    }

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const [imgSrc, setImgSrc] = useState({uri:""});
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
      const itemData = {
        name: name,
        description: description,
        owner: auth.currentUser?.uid,
        isLost: false,
      };
      
      navigation.navigate("Loading");

      const docRef = addDoc(collection(db, "items"), itemData);
      docRef.then((dRef) => {
        uploadImage(dRef.id).then(()=>{
          navigation.navigate("My Items");
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
          {imgSrc.uri == "" ? 
            <Pressable onPress={async ()=> {
              selectImage();
            }} style={styles.imagePressableContainer}>
              <View style={styles.imageContainer}>
                <Image
                  style={styles.itemImage}
                  source={require("../assets/defaultimg.jpg")} />
              </View>
              
              <Text style={styles.imageLabel}>Select image</Text>
            </Pressable>
            :
            <Pressable onPress={async ()=> {
              selectImage();
            }} style={styles.imagePressableContainer}>
              <View style={styles.imageContainer}>
                <Image
                  style={styles.itemImage}
                  source={imgSrc}/>
              </View>
              
              <Text style={styles.imageLabel}>Change image</Text>
            </Pressable>}
          
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
                <Text style={styles.saveButtonText}>Add Item</Text>
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
      width: "90%",
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


export default AddItemScreen;