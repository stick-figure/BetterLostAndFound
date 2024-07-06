import { onSnapshot, query, collection, orderBy, where } from "firebase/firestore";
import { useState, useLayoutEffect } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { db } from "../../firebase";
import firebase from "firebase/compat/app";

export function ItemInfoScreen({navigation, route}: {navigation: any, route: any}) {
    const [item, setItem] = useState({});

    useLayoutEffect(
        () => {
            const unsubscribe = onSnapshot(query(collection(db, "items"), where(firebase.firestore.FieldPath.documentId(), '==', route.params!.itemId)), (snapshot) => {
                console.log(snapshot.docs[0].data);
            });
    
            return () => {
              unsubscribe();
            };
        }
    )
    return (
        <View style={styles.container}>
            <Text>{route.params!.itemId}</Text>
        </View>
    )
}


const styles = StyleSheet.create({
    container: {

    },
    button: {
        
    }
});

export default ItemInfoScreen;
