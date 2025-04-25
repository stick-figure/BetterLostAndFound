import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Modal, Pressable, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import { auth, db } from '../../ModularFirebase';
import { addDoc, collection, disableNetwork, doc, documentId, DocumentSnapshot, getDoc, getDocs, onSnapshot, query, QuerySnapshot, runTransaction, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { PressableOpacity } from '../hooks/MyElements';
import SafeAreaView from 'react-native-safe-area-view';
import { CommonActions, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { CheckBox, Icon } from 'react-native-elements';
import { ScrollView } from 'react-native-gesture-handler';
import { timestampToString } from './SomeFunctions';

export type PostViewRouteParams = {
    item: {name: string},
}

const resolveReasons = [
    {
        code: 'found-item',
        description: 'Someone found my item for me', 
    },
    {
        code: 'self-found-item',
        description: 'Found it myself', 
    },
    {
        code: 'self-removed-post-gave-up',
        description: 'Gave up search', 
    },
    {
        code: 'self-removed-post-other',
        description: 'A different reason', 
    },
];

export function ViewLostPostScreen() {
    const navigation = useNavigation();
    const route = useRoute();
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
            if ([auth.currentUser?.uid, author._id, post._id].includes(undefined)) 
                throw new Error('missing an id, idk which');
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
                    if (roomDoc?.get('userIds') === undefined) throw new Error('userIds is undefined');
                    const userSnapshots = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', roomDoc.get('userIds'))));
                    
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
    const [reasonIndex, setReasonIndex] = useState(-1);

    const [modalVisible, setModalVisible] = useState(false);
    const resolvePostModal = () => {
        const closeModal = () => {
            setReasonIndex(-1);
            setModalVisible(false);
        }
        return (
            <Modal
                animationType='slide'
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalBackground}>
                        <TouchableOpacity
                            style={{alignSelf: 'flex-end'}}
                            onPress={closeModal}>
                            <Icon name='close' type='material-community' />
                        </TouchableOpacity>
                        <View style={styles.modalContent}>
                            
                            <Text style={styles.modalTitle}>Resolve Post</Text>
                            <Text style={styles.text}>Why are you closing this post?</Text>

                            {resolveReasons.map((reason, index) => (
                                <CheckBox
                                    key={reason.code}
                                    checked={reasonIndex === index}
                                    onPress={() => setReasonIndex(index)}
                                    checkedIcon='dot-circle-o'
                                    uncheckedIcon='circle-o'
                                    title={reason.description}
                                    containerStyle={styles.checkBoxContainer}
                                />
                            ))}
                            <View style={[styles.horizontal, {width: '100%', justifyContent: 'space-evenly'}]}>
                                <TouchableOpacity
                                    style={{...styles.mediumButton}}
                                    onPress={() => setModalVisible(false)}>
                                    <Text style={styles.mediumButtonText}>Archive</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{...styles.mediumButton, backgroundColor: colors.red}}
                                    onPress={() => setModalVisible(false)}>
                                    <Text style={styles.mediumButtonText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        );
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
                    onPress={() => setModalVisible(!modalVisible)} 
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
                            <Icon name='cactus' type='material-community' size={42} color={colors.text} />
                            <Text style={[styles.text, {alignSelf: 'center'}]}>No one has set up a chat with you yet</Text>
                        </View>
                    </View>
                }
                 />
                
        );

    }

    const isDarkMode = useColorScheme() === 'dark';
    const colors = isDarkMode ? DarkThemeColors : LightThemeColors;
    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            color: colors.text,
            backgroundColor: colors.background,
        },
        itemContainer: {
            width: '100%',
        },
        text: {
            color: colors.text,
        },
        horizontal: {
            flexDirection: 'row',
        },
        modalContainer: { 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center', 
        },
        modalBackground: {
            alignSelf: 'center',
            justifyContent: 'center',
            backgroundColor: colors.card,
            margin: 10,
            padding: 5,
            borderRadius: 20,
            alignItems: 'center',
            shadowColor: colors.border,
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
        },
        modalContent: {
            width: 300,
            padding: 5,
            backgroundColor: colors.card,
            borderRadius: 10,
            alignItems: 'center',
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: 'bold',
        },
        checkBoxContainer: {
            width: '100%',
            padding: 5,
        },
        mediumButton: {
            padding: 8,
            margin: 2,
            backgroundColor: colors.primary,
            borderRadius: 7,
        },
        mediumButtonText: {
            fontSize: 14,
            color: colors.primaryContrastText,
            fontWeight: '500',
        },
        userHeader: {
            flexDirection: 'row',
            width: '100%', 
            justifyContent: 
            'flex-start', 
            alignItems: 'center', 
            padding: 8, 
            backgroundColor: colors.card,
        },
        pfp: {
            borderRadius: 99999,
            width: 42, 
            aspectRatio: 1/1,
            marginRight: 12,
            color: colors.text,
        },
        userName: {
            fontSize: 15,
            fontWeight: '600',
            color: colors.text,
        },
        timestamp: {
            fontSize: 12,
            margin: 2,
            color: colors.text,
        },
        addItemTitle: {
            margin: 20,
            color: colors.text,
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
            color: colors.text,
            margin: 8,
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
            color: colors.text,
            fontWeight: 'bold',
            fontSize: 16,
        },
        itemSubtitle: {
            color: colors.text,
            fontSize: 12,
        },
        itemContent: {
            color: colors.text,
            fontSize: 12,
            alignSelf: 'center',
        },
        imageLabel: {
            fontSize: 16,
            textAlign: 'center',
            color: colors.text,
            fontWeight: 'bold',
        },
        message: {
            fontSize: 16,
            color: colors.text,
            margin: 6,
        },
        bigButton: {
            width: '90%',
            backgroundColor: colors.primary,
            borderRadius: 7,
            padding: 10,
            alignSelf: 'center',
        },
        bigButtonText: {
            fontSize: 16,
            textAlign: 'center',
            color: colors.primaryContrastText,
            fontWeight: 'bold',
        },
        chatListContainer: {
            width: '90%',
            height: 'auto',
            backgroundColor: colors.card,
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
            color: colors.text,
            fontWeight: '600',
        },
    }), [isDarkMode]);


    if (post?._id == '') {
        return (
            <View>
                <Text style={styles.text}>Post not found</Text>
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
                                {post.createdAt ? timestampToString(post.createdAt!, now, true, true) : 'unknown time'}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.postTitle}>Lost <Text style={{fontWeight: '800'}}>{item.name}</Text></Text>
                    <PressableOpacity
                        onPress={() => { navigation.navigate('View Item', { itemId: item._id, itemName: item.name }) }}
                        disabled={isNavigating}>
                        <Image source={post?.imageUrls ? {uri: post.imageUrls[0]} : undefined} style={styles.itemImage} defaultSource={require('../assets/defaultimg.jpg')} />
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
                {resolvePostModal()}
                {actionButtons()}
                <Text style={[styles.text, {fontSize: 20, margin: 8}]}>Chat with {!isAuthor && 'owner'}</Text>
                {chatOptions()}
            </ScrollView>
        </SafeAreaView>
    );
}


export default ViewLostPostScreen;