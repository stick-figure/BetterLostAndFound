import { query, collection, where, doc, getDocs, setDoc, DocumentData, onSnapshot, DocumentSnapshot, getDoc, documentId, orderBy, QueryFieldFilterConstraint, limit, QuerySnapshot } from 'firebase/firestore';
import { SetStateAction, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, Image, Platform, StyleSheet, Text, useColorScheme, View } from 'react-native';
import SafeAreaView, { SafeAreaProvider } from 'react-native-safe-area-view';
import { auth, db } from '../../ModularFirebase';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { CommonActions, useIsFocused } from '@react-navigation/native';
import PressableOpacity from '../assets/MyElements';
import { Icon } from 'react-native-elements';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';

export function MyChatRoomsScreen({ navigation }: { navigation: any }) {
    const [lostPostDatas, setLostPostDatas] = useState<any[]>([]);
    const [foundPostDatas, setFoundPostDatas] = useState<any[]>([]);
    
    const [roomsData, setRoomsData] = useState<any[]>([]);
    
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [isNavigating, setIsNavigating] = useState(false);

    const isFocused = useIsFocused();
    /*
    const isConnected = useState(true);
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(currentState => {
            console.log(`Device is ${currentState.isConnected ? 'Connected': 'not connected'}`);
          });

          return unsubscribe;
    }, []);*/
    
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
    /*
    useEffect(() => {
        if (!isLoggedIn) return;
        
        const unsubscribe = onSnapshot(query(collection(db, 'posts'), where('userIds', 'array-contains', auth.currentUser!.uid)), async (roomSnapshot) => {
            try {
                if (roomSnapshot.empty) return;

                const newRoomsData = await Promise.all(roomSnapshot.docs.map((roomDoc) => new Promise(async (resolve, reject) => {
                    try {
                        if (roomDoc?.get('userIds') === undefined) throw new Error('userIds is undefined');
                        const userSnapshots = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', roomDoc.get('userIds'))));
                        let lastMessage = (await getDocs(query(collection(db, roomDoc.ref.path, 'messages'), orderBy('createdAt', 'desc'), limit(1)))).docs[0];
                        let postRef = doc(db, 'posts', roomDoc.get('postId'));
                        let post = await getDoc(postRef);
                        
                        resolve({
                            _id: roomDoc.id, 
                            users: userSnapshots.docs.map((userSnapshot) => ({_id: userSnapshot.id, ...userSnapshot.data()!})), 
                            post: {_id: postRef, ...post.data()!},
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
    }, [isLoggedIn]);*/
    
    useEffect(() => {
        if (!isLoggedIn) return;
        
        const unsubscribe = onSnapshot(query(collection(db, 'rooms'), where('userIds', 'array-contains', auth.currentUser!.uid)), async (roomSnapshot) => {
            try {
                if (roomSnapshot.empty) throw new Error('roomSnapshot is empty');
                const newRoomsData = await Promise.all(roomSnapshot.docs.map((roomDoc) => new Promise(async (resolve, reject) => {
                    try {
                        if (roomDoc?.get('userIds') === undefined) throw new Error('userIds is undefined');
                        const userSnapshots = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', roomDoc.get('userIds'))));
                        let lastMessage = (await getDocs(query(collection(db, roomDoc.ref.path, 'messages'), orderBy('createdAt', 'desc'), limit(1)))).docs[0];
                        let postRef = doc(db, 'posts', roomDoc.get('postId'));
                        let post = await getDoc(postRef);
                        
                        resolve({
                            _id: roomDoc.id, 
                            users: userSnapshots.docs.map((userSnapshot) => ({_id: userSnapshot.id, ...userSnapshot.data()!})), 
                            post: {_id: postRef, ...post.data()!},
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

    const isDarkMode = useColorScheme() === 'dark';
    const colors = isDarkMode ? DarkThemeColors : LightThemeColors;
    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            alignItems: 'center',
            padding: 10,
            backgroundColor: colors.background,
        },
        horizontal: {
            flexDirection: 'row',
        },
        text: {
            textAlign: 'center',
            color: colors.text,
            fontSize: 14,
        },
        chatListContainer: {
            width: '90%',
            height: 'auto',
            backgroundColor: colors.card,
            alignSelf: 'center',
            padding: 2,
        },
        chatItem: {
            alignItems: 'center',
            alignSelf: 'stretch',
            padding: 20,
            flexDirection: 'row',
        },
        chatThumbnail: {
            width: 48,
            aspectRatio: 1,
            borderRadius: 99999,
            marginRight: 12,
        },
        chatTitle: {
            fontSize: 18,
            color: colors.text,
            fontWeight: '600',
        },
        postImage: {
            width: 72, 
            height: 72, 
        },
        smallButton: {
            padding: 6,
            backgroundColor: colors.primary,
            borderRadius: 8,
        },
        smallButtonText: {
            color: colors.primaryContrastText,
        },
        userName: {
            fontSize: 28,
            fontWeight: 'bold',
            color: colors.text,
        },
        pfp: {
            width: 128,
            aspectRatio: 1/1,
            borderRadius: 999999,
            margin: 8,
            marginRight: 12,
            color: colors.text,
        },
        itemList: {
            width: '100%',
            flexGrow: 1,
            margin: 10,
            backgroundColor: colors.card,
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
            color: colors.text,
            fontWeight: '400',
            fontSize: 16,
        },
        itemSubtitle: {
            color: colors.text,
            fontSize: 12,
        },
        itemContent: {
            color: colors.text,
            fontSize: 14,
        },
        addItemTitle: {
            fontSize: 14,
            color: colors.contrastText,
        },
    }), [isDarkMode]);
    
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
                            <View>
                                <Text style={styles.text}>{item.post?.type} {item.post?.title}</Text>
                                <Text style={styles.chatTitle}>{user?.name || 'Unknown user'}</Text>
                            </View>

                        </PressableOpacity>
                    );
                }}
                ListEmptyComponent={
                    <View style={{height: 100}}>
                        <View style={{width: '100%', height: '100%', alignItems: 'stretch', justifyContent: 'center'}}>
                            <Icon name='cactus' type='material-community' size={42} color={colors.text} />
                            <Text style={[styles.text, {alignSelf: 'center'}]}>No one has set up a chat with you yet</Text>
                        </View>
                    </View>
                } />
        </SafeAreaView>
    );
}

export default MyChatRoomsScreen;