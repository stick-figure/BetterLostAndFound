import { query, collection, where, doc, getDocs, setDoc } from "firebase/firestore";
import { useLayoutEffect } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { auth, db } from "../../firebase";
import firebase from "firebase/compat/app";
import { FAB } from "react-native-elements";
import { colors } from "../assets/Colors";


export function MyItemsScreen({ navigation }: {navigation: any}) {
    let items: Array<any> = [];
    useLayoutEffect(() => {
        const fetchData = async () => {
            const itemsRef = collection(db, "items");
            const q = query(collection(db, 'items'), where("owner", "==", auth.currentUser?.email));
        
            const querySnapshot = await getDocs(q);
            
            querySnapshot.forEach((doc) => {
                items.push(doc.data());
                // doc.data() is never undefined for query doc snapshots
                console.log(doc.id, " => ", doc.data());
            });
        }
        fetchData();
    });


    return (
        <SafeAreaProvider>
            <View style={styles.container}>
                <FlatList
                        keyExtractor={item => item._id.toString()}
                        data={items}
                        renderItem={({ item }) => (
                            <View>
                                
                            </View>
                        )}
                    />
                <FAB
                    icon={{
                    name: 'add',
                    size: 20,
                    color: 'white',
                    }}
                    placement="right"
                    onPress={() => {navigation.navigate("Add Item")}}
                    buttonStyle={styles.fab} />
            </View>
        </SafeAreaProvider>
    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
        marginTop: 100,
    },
    fab: {
        borderRadius:90,
        alignItems: "center",
        color: colors.primary,
    }
});

export default MyItemsScreen;