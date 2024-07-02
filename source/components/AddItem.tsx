import { useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { Input, colors } from "react-native-elements";


export function AddItemScreen({ navigation, route }: {navigation: any, route: any}) {
    
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    return (
        <View style={styles.container}>
            <Text style={styles.addItemTitle}>
                Add Item
            </Text>
            <Input
                placeholder="What is this item called?"
                onChangeText={(text: string) => {}}
            />
            <Input
                placeholder="Describe some identifying features"
                onChangeText={(text: string) => {}}
            />
            <View style={styles.saveButton}>
                <Button
                    title="Save"
                    disabled={false}
                    onPress={() => {}}
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