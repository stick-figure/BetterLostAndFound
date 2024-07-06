import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { Input, colors } from "react-native-elements";
import { auth, db } from "../../firebase";


export function AddItemScreen({ navigation, route }: {navigation: any, route: any}) {
    const createNewItem = () => {

    }

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    return (
        <View style={styles.container}>
            <Input
                placeholder="What is this item called?"
                onChangeText={text => setName(text)}
                value={name}
            />
            <Input
                placeholder="Describe some identifying features"
                onChangeText={text => setDescription(text)}
                value={description}
            />

            <View style={styles.saveButton}>
                <Button
                    title="Save"
                    disabled={name.trim().length < 1 || description.trim().length < 1}
                    onPress={() => {
                      const addItemDoc = async () => {
                        const itemData = {
                          name: name,
                          description: description,
                          owner: auth.currentUser?.email,
                          isLost: false,
                        };

                        const docRef = addDoc(collection(db, "items"), itemData);

                        navigation.navigate("My Items");
                      }

                      addItemDoc();
                    }}
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
    addItemTitle: {
      margin: 20,
    },
    saveButton: {
      width: 280,
      backgroundColor: colors.primary,
    },
  });


export default AddItemScreen;