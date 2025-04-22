import { query, collection, where, doc, getDocs, setDoc, DocumentData, onSnapshot, DocumentSnapshot, getDoc, documentId, orderBy, QueryFieldFilterConstraint, limit, QuerySnapshot } from 'firebase/firestore';
import { SetStateAction, useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import SafeAreaView, { SafeAreaProvider } from 'react-native-safe-area-view';
import { auth, db } from '../../ModularFirebase';
import { lightThemeColors } from '../assets/Colors';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { CommonActions, useIsFocused } from '@react-navigation/native';
import PressableOpacity from '../assets/MyElements';
import { Icon } from 'react-native-elements';

export function MyChatRoomsScreen({ navigation }: { navigation: any }) {
    const [rooms, setRooms] = useState([]);
    
    const [roomsData, setRoomsData] = useState<any[]>([]);
    
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [isNavigating, setIsNavigating] = useState(false);

    const isFocused = useIsFocused();
    
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


    const navigateToChatRoom = async (roomId: string | number) => {
        try {
            setIsNavigating(true);
            
            let roomData;
            if (typeof roomId === 'string') {
                roomData = roomsData.find((r) => r._id == roomId);
            }
            if (typeof roomId === 'number') {
                roomData = roomsData[roomId];
            }
            
            if (roomData === undefined) throw Error('room is undefined');
            
            navigation.navigate('My Stack', {'screen': 'Chat Room', 'params': {room: roomData}});
        } catch (err) {
            console.warn(err);
        } finally {
            setIsNavigating(false);
        }
    }

    useEffect(() => {
        if (!isLoggedIn) return;

        const unsubscribe = onSnapshot(query(collection(db, 'rooms'), where('userIds', 'array-contains', auth.currentUser!.uid)), async (roomSnapshot) => {
            try {
                if (roomSnapshot.empty) throw new Error('roomSnapshot is empty');
                const newRoomsData = await Promise.all(roomSnapshot.docs.map((roomDoc) => new Promise(async (resolve, reject) => {
                    try {
                        if (roomDoc?.data()?.userIds === undefined) throw new Error('userIds is undefined');
                        const userSnapshots = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', roomDoc.data().userIds)));
                        let lastMessage = (await getDocs(query(collection(db, roomDoc.ref.path, 'messages'), orderBy('createdAt', 'desc'), limit(1)))).docs[0];
                        
                        resolve({
                            _id: roomDoc.id, 
                            users: userSnapshots.docs.map((userSnapshot) => ({_id: userSnapshot.id, ...userSnapshot.data()!})), 
                            lastMessage: {_id: lastMessage.id, ...lastMessage.data()},
                            ...roomDoc.data()
                        });
                        return;
                    } catch (error) {
                        reject(error);
                    }
                })));
                
                setRoomsData(newRoomsData.sort((a, b) => (b.lastMessage.createdAt?.seconds ?? 0) - (a.lastMessage.createdAt?.seconds ?? 0)));
            } catch (error) {
                console.warn(error);
            }
        });

        return unsubscribe;
    }, [isLoggedIn]);

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
                data={roomsData}
                style={styles.chatListContainer}
                renderItem={({ item }) => {
                    const user = (item.users as any[]).find((user) => user._id != auth.currentUser?.uid);
                    
                    return (
                        <PressableOpacity 
                            style={styles.chatItem}
                            onPress={() => {
                                navigateToChatRoom(roomsData.findIndex(room => room._id == item._id))
                            }} 
                            disabled={isNavigating}>
                            <Image 
                                style={styles.chatThumbnail}
                                source={{uri: user?.pfpUrl}}
                                defaultSource={require('../assets/defaultpfp.jpg')} />
                            <Text style={styles.chatTitle}>{user?.name || 'Unknown user'}</Text>
                        </PressableOpacity>
                    );
                }}
                ListEmptyComponent={
                    <View style={{height: 100}}>
                        <View style={{width: '100%', height: '100%', alignItems: 'stretch', justifyContent: 'center'}}>
                            <Icon name='cactus' type='material-community' size={42} />
                            <Text style={[styles.text, {alignSelf: 'center'}]}>No one has set up a chat with you yet</Text>
                        </View>
                    </View>
                } />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
        backgroundColor: lightThemeColors.background,
    },
    horizontal: {
        flexDirection: 'row',
    },
    text: {
        textAlign: 'center',
        color: lightThemeColors.textLight,
        fontSize: 18,
    },
    chatListContainer: {
        width: '90%',
        height: 'auto',
        backgroundColor: lightThemeColors.foreground,
        alignSelf: 'center',
        padding: 2,
    },
    chatItem: {
        alignItems: 'center',
        alignSelf: 'stretch',
        padding: 10,
        flexDirection: 'row',
    },
    chatThumbnail: {
        width: 40,
        aspectRatio: 1,
        borderRadius: 99999,
        marginRight: 12,
    },
    chatTitle: {
        fontSize: 18,
        color: lightThemeColors.textLight,
        fontWeight: '600',
    },
    smallButton: {
        padding: 6,
        backgroundColor: lightThemeColors.primary,
        borderRadius: 8,
    },
    smallButtonText: {
        color: lightThemeColors.textDark,
    },
    userName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: lightThemeColors.textLight,
    },
    pfp: {
        width: 128,
        aspectRatio: 1/1,
        borderRadius: 999999,
        margin: 8,
        marginRight: 12,
        color: lightThemeColors.textLight,
    },
    itemList: {
        width: '100%',
        flexGrow: 1,
        margin: 10,
        backgroundColor: lightThemeColors.foreground,
    },
    itemListItem: {
        flex: 1,
        maxWidth: '33%',
        paddingLeft: 10,
        paddingTop: 10,
        paddingBottom: 10,
    },
    itemListItemView: {
        margin: 4,
    },
    itemImage: {
        width: 120,
        height: 120,
        aspectRatio: 1,
    },
    itemTitle: {
        color: lightThemeColors.textLight,
        fontWeight: '400',
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
    addItemTitle: {
        fontSize: 14,
        color: lightThemeColors.textDark,
    },
});

export default MyChatRoomsScreen;