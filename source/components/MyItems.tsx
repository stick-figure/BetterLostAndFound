import { query, collection, orderBy, onSnapshot } from "firebase/firestore";
import { useLayoutEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { db } from "../../firebase";


export function MyItemsScreen({ navigation }: {navigation: any}) {
    useLayoutEffect(() => {
            
        const q = query(collection(db, 'chats'), orderBy('createdAt', 'desc'));
        
//        const unsubscribe = onSnapshot(q, (snapshot) => );
    });

    return (
        <SafeAreaProvider>
            <View>

            </View>
        </SafeAreaProvider>
    );

}

export default MyItemsScreen;