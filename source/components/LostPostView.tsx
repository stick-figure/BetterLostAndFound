import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { lightThemeColors } from '../assets/Colors';
import { auth, db } from '../../ModularFirebase';
import { addDoc, collection, disableNetwork, doc, documentId, DocumentSnapshot, getDoc, getDocs, onSnapshot, query, QuerySnapshot, runTransaction, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import PressableOpacity from '../assets/MyElements';
import SafeAreaView from 'react-native-safe-area-view';
import { CommonActions, useIsFocused } from '@react-navigation/native';
import { Icon } from 'react-native-elements';
import { ScrollView } from 'react-native-gesture-handler';
import { timestampToString } from './SomeFunctions';

export type PostViewRouteParams = {
    item: {name: string},
}

export function LostPostViewScreen({ navigation, route }: { navigation: any, route: any }) {
    const [item, setItem] = useState({});

    const [author, setAuthor] = useState({});

    const [post, setPost] = useState({});

    const [rooms, setRooms] = useState([]);

    const [message, setMessage] = useState<string>();
    
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [isAuthor, setIsAuthor] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    const isFocused = useIsFocused();
    
    const [now, setNow] = useState<number>();

    useEffect(() => setNow(Date.now()), [isFocused, item, author, post, rooms, message]);

    const createChatRoom = async () => {
        try {
            setIsNavigating(true);
            const roomData = {
                userIds: [auth.currentUser?.uid, author._id],
                postId: post._id,
                createdAt: serverTimestamp(),
//                secretPhraseValidated: false,
            };

            let postData;
            
            await runTransaction(db, async (transaction) => {
                const postRef = doc(db, 'posts', route.params!.post!._id);
                const postSnapshot = await transaction.get(postRef);
                if (!postSnapshot.exists()) {
                    throw Error('Document does not exist!');
                }
                
                const userSnapshots = await Promise.all(roomData.userIds.map(async (userId) => transaction.get(doc(db, 'users', userId))));
                
                const roomRef = doc(collection(db, 'rooms'));
                
                transaction.set(roomRef, roomData);

                roomData._id = roomRef.id;
                
                let postData = postSnapshot!.data()!;
                postData.roomIds.push(roomRef.id);

                transaction.update(postRef, { roomIds: postData.roomIds });
                
                roomData.users = userSnapshots.map((userSnapshot) => ({_id: userSnapshot.id, ...userSnapshot.data()!}));

                navigation.navigate('Chat Room', {post: postData, room: roomData});
                navigation.dispatch((state: {routes: any[]}) => {
                    const topScreen = state.routes[0];
                    const thisScreen = state.routes[state.routes.length - 1];
                    const routes = [topScreen, thisScreen];
                    return CommonActions.reset({
                        ...state,
                        index: routes.length - 1,
                        routes,
                    });
                });
            });
        } catch (err) {
            console.warn(err);
        } finally {
            setIsNavigating(false);
        }
    }


    const navigateToChatRoom = async (roomId: string | number) => {
        try {
            setIsNavigating(true);
            
            let roomData;
            if (typeof roomId === 'string') {
                roomData = rooms.find((r) => r._id == roomId);
            }
            if (typeof roomId === 'number') {
                roomData = rooms[roomId];
            }
            
            if (roomData === undefined) throw Error('room is undefined');
            
            navigation.navigate('Chat Room', {room: roomData});
        } catch (err) {
            console.warn(err);
        } finally {
            setIsNavigating(false);
        }
    }

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

    const updateRooms = async (roomSnapshot: QuerySnapshot) => {
        try {
            if (roomSnapshot.empty) throw new Error('roomSnapshot is empty');
            const roomsData = await Promise.all(roomSnapshot.docs.map((roomDoc) => new Promise(async (resolve, reject) => {
                try {
                    if (roomDoc?.data()?.userIds === undefined) throw new Error('userIds is undefined');
                    const userSnapshots = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', roomDoc.data().userIds)));
                    
                    resolve({
                        _id: roomDoc.id, 
                        users: userSnapshots.docs.map((userSnapshot) => ({_id: userSnapshot.id, ...userSnapshot.data()!})), 
                        ...roomDoc.data()
                    });
                    return;
                } catch (error) {
                    reject(error);
                }
            })));
            
            setRooms(roomsData);
        } catch (error) {
            console.warn(error);
        }
    }

    const resolvePost = () => new Promise((resolve, reject) => {
        try {
            
        } catch (error) {
            console.warn(error);
        }
    });

    const postUpdateCallback = useCallback(() => {
        if (post?.roomIds === undefined || post?.roomIds?.length == 0) return;

        const unsubscribe = onSnapshot(query(collection(db, 'rooms'), where(documentId(), 'in', post.roomIds)), updateRooms);
        
        return unsubscribe;
    }, [post.roomIds]);

    useEffect(() => {
        return postUpdateCallback();
    }, [post.roomIds]);

    useEffect(() => {
        if (!isLoggedIn) return;
        const itemData = {...route.params!.item};
        itemData.imageSrc = route.params!.item.imageSrc;
        setItem(itemData);
        setAuthor(route.params!.author);

        setMessage(route.params!.post.message);
        if (auth.currentUser!.uid == itemData._id) setIsOwner(true);
        if (auth.currentUser!.uid == route.params!.author._id) setIsAuthor(true);

        if (route.params.post?.roomIds === undefined) return;
    }, [isLoggedIn]);
    
    useEffect(() => {
        if (!route.params!.post._id) return;
        const unsubscribe = onSnapshot(doc(db, 'posts', route.params!.post._id), (snapshot) => {
            setPost({_id: snapshot.id, ...snapshot.data()});
        });
        return unsubscribe;
    }, []);

    const actionButtons = () => {
        if (isAuthor) {
            return (
                <PressableOpacity 
                    style={styles.bigButton}
                    onPress={() => ''} 
                    disabled={isNavigating}>
                    <Text style={styles.bigButtonText}>Resolve post</Text>
                </PressableOpacity>
            );
        }
    }

    const chatOptions = () => {
        if (!isAuthor) {
            if (rooms.length == 0) {
                return (
                    <View>
                        <PressableOpacity 
                            style={styles.bigButton}
                            onPress={createChatRoom} 
                            disabled={isNavigating}>
                            <Text style={styles.bigButtonText}>Start chat with {author?.name || 'owner'}</Text>
                        </PressableOpacity>
                    </View>
                );
            } else {
                return (
                    <View style={styles.chatListContainer}>
                        <PressableOpacity 
                            style={styles.chatItem}
                            onPress={() => {
                                navigateToChatRoom(rooms.findIndex((room) => room.userIds.includes(auth.currentUser?.uid)))
                            }} 
                            disabled={isNavigating}>
                            <Image 
                                style={styles.chatThumbnail}
                                source={{uri: author?.pfpUrl}}
                                defaultSource={require('../assets/defaultpfp.jpg')} />
                            <Text style={styles.chatTitle}>{author?.name || 'Chat with owner'}</Text>
                        </PressableOpacity>
                    </View>
                );
            }
            return;
        }

        return (
            <FlatList
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
                data={rooms}
                style={styles.chatListContainer}
                renderItem={({ item }) => {
                    const user = (item.users as any[]).find((user) => user._id != auth.currentUser?.uid);
                    
                    return (
                        <PressableOpacity 
                            style={styles.chatItem}
                            onPress={() => {
                                navigateToChatRoom(rooms.findIndex(room => item._id))
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
                }
                 />
                
        );

    }

    if (post?._id == '') {
        return (
            <View>
                <Text>Post not found</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.itemContainer}>
                    <View style={styles.userHeader}>
                        <Image
                            style={styles.pfp}
                            source={author.pfpUrl ? {uri: author.pfpUrl} : undefined}
                            defaultSource={require('../assets/defaultpfp.jpg')} />
                        <View>
                            <Text style={styles.userName}>{author.name}</Text>
                            <Text style={styles.timestamp}>
                                {item.createdAt ? timestampToString(item.createdAt!, now, true, true) : 'unknown time'}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.postTitle}>Lost <Text style={{fontWeight: '800'}}>{item.name}</Text></Text>
                    <PressableOpacity
                        onPress={() => { navigation.navigate('Item View', { itemId: item._id, itemName: item.name }) }}
                        disabled={isNavigating}>
                        <Image source={item.imageSrc ? {uri: item.imageSrc} : undefined} style={styles.itemImage} defaultSource={require('../assets/defaultimg.jpg')} />
                        <View style={styles.itemListItemView}>
                            <Text style={styles.itemContent}>Click for item info</Text>
                        </View>
                    </PressableOpacity>
                </View>
                <View>
                    <TextInput
                        multiline={true}
                        placeholder='Where did you last put this item?'
                        onChangeText={text => setMessage(text)}
                        value={message}
                        editable={isAuthor && !isNavigating}
                        selectTextOnFocus={false} 
                        style={styles.message}/>
                </View>
                {actionButtons()}
                <Text style={[styles.text, {fontSize: 20, margin: 8}]}>Chat with {!isAuthor && 'owner'}</Text>
                {chatOptions()}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        color: lightThemeColors.textLight,
        backgroundColor: lightThemeColors.background,
    },
    itemContainer: {
        width: '100%',
    },
    text: {
        color: lightThemeColors.textLight,
    },
    horizontal: {
        flexDirection: 'row',
    },
    userHeader: {
        flexDirection: 'row',
        width: '100%', 
        justifyContent: 
        'flex-start', 
        alignItems: 'center', 
        padding: 8, 
        backgroundColor: lightThemeColors.foreground,
    },
    pfp: {
        borderRadius: 99999,
        width: 42, 
        aspectRatio: 1/1,
        marginRight: 12,
        color: lightThemeColors.textLight,
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
        color: lightThemeColors.textLight,
    },
    timestamp: {
        fontSize: 12,
        margin: 2,
        color: lightThemeColors.textLight,
    },
    addItemTitle: {
        margin: 20,
        color: lightThemeColors.textLight,
    },
    imagePressableContainer: {
        alignItems: 'center',
    },
    imageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemImage: {
        aspectRatio: 1 / 1,
    },
    postTitle: {
        fontSize: 24,
        fontWeight: '500',
        color: lightThemeColors.textLight,
        margin: 8,
    },
    itemList: {
        width: '100%',
        height: '40%',
        margin: 10,
        backgroundColor: lightThemeColors.foreground,
    },
    itemListItem: {
        width: 120,
        marginLeft: 10,
        paddingTop: 10,
        paddingBottom: 10,
    },
    itemListItemView: {
        margin: 4,
    },
    itemTitle: {
        color: lightThemeColors.textLight,
        fontWeight: 'bold',
        fontSize: 16,
    },
    itemSubtitle: {
        color: lightThemeColors.textLight,
        fontSize: 12,
    },
    itemContent: {
        color: lightThemeColors.textLight,
        fontSize: 12,
        alignSelf: 'center',
    },
    imageLabel: {
        fontSize: 16,
        textAlign: 'center',
        color: lightThemeColors.textLight,
        fontWeight: 'bold',
    },
    message: {
        fontSize: 16,
        color: lightThemeColors.textLight,
        margin: 6,
    },
    bigButton: {
        width: '90%',
        backgroundColor: lightThemeColors.primaryButton,
        borderRadius: 7,
        padding: 10,
        alignSelf: 'center',
    },
    bigButtonText: {
        fontSize: 16,
        textAlign: 'center',
        color: lightThemeColors.primaryButtonText,
        fontWeight: 'bold',
    },
    chatListContainer: {
        width: '90%',
        height: 'auto',
        backgroundColor: lightThemeColors.foreground,
        alignSelf: 'center',
        padding: 6,
    },
    chatItem: {
        alignItems: 'center',
        alignSelf: 'stretch',
        padding: 4,
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
});


export default LostPostViewScreen;