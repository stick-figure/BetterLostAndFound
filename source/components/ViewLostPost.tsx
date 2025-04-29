import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Modal, Pressable, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import { auth, db } from '../../ModularFirebase';
import { addDoc, collection, disableNetwork, doc, documentId, DocumentSnapshot, getDoc, getDocs, limit, onSnapshot, query, QuerySnapshot, runTransaction, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { CoolButton, PressableOpacity } from '../hooks/MyElements';
import SafeAreaView from 'react-native-safe-area-view';
import { CommonActions, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { CheckBox, Icon } from 'react-native-elements';
import { ScrollView, Swipeable } from 'react-native-gesture-handler';
import { timestampToString, uriFrom } from './SomeFunctions';
import { MyStackScreenProps } from '../navigation/Types';
import { navigateToErrorScreen, popupOnError } from './Error';
import { ChatRoomTile, ItemData, LostPostResolveReasons, PostData, RoomData, UserData } from '../assets/Types';

const resolveReasons = [
    {
        code: LostPostResolveReasons.FOUND_ITEM,
        description: 'Someone found my item for me', 
    },
    {
        code: LostPostResolveReasons.SELF_FOUND_ITEM,
        description: 'Found it myself', 
    },
    {
        code: LostPostResolveReasons.GAVE_UP,
        description: 'Gave up search', 
    },
    {
        code: LostPostResolveReasons.DIDNT_MEAN_TO_POST,
        description: 'Didn\'t mean to post this', 
    },
    {
        code: LostPostResolveReasons.REMOVED_OTHER_REASON,
        description: 'A different reason', 
    },
];

export function ViewLostPostScreen({navigation, route}: MyStackScreenProps<'View Lost Post'>) {
    const [item, setItem] = useState<ItemData>();

    const [author, setAuthor] = useState<UserData>();
    const [owner, setOwner] = useState<UserData>();

    const [post, setPost] = useState<PostData>();

    const [rooms, setRooms] = useState<RoomData[]>();
    const [roomTiles, setRoomTiles] = useState<ChatRoomTile[]>([]);

    const [message, setMessage] = useState<string>();
    
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [isAuthor, setIsAuthor] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    const isFocused = useIsFocused();
    
    const [now, setNow] = useState<number>();

    useEffect(() => setNow(Date.now()), [isFocused, item, author, owner, post, roomTiles, message]);

    const createChatRoom = async () => {
        try {
            setIsNavigating(true);
            if ([auth.currentUser?.uid, author?.id, post?.id].includes(undefined)) 
                throw new Error('missing an id, idk which');

            if (post && post.resolved) 
                throw new Error(`Post was already been resolved ${timestampToString(post.resolvedAt, now)} for reason '${post.resolveReason ?? 'unknown'}'`);

            if (auth.currentUser!.uid == author!.id) 
                throw new Error('wait this is the same person');
            
            const chatParams = await runTransaction(db, async (transaction) => {
                const postRef = doc(db, 'posts', post!.id);
                const postSnapshot = await transaction.get(postRef);

                if (!postSnapshot.exists()) {
                    throw Error('Document does not exist!');
                }

                const roomsWithThisUser = await getDocs(query(collection(db, 'rooms'), where('postId', '==', post!.id), where('userIds', 'array-contains', auth.currentUser!.uid), limit(1)));
                if (!roomsWithThisUser.empty) {
                    throw Error(`A chat with this user and the owner already exists: ${
                        roomsWithThisUser.docs.map((doc) => doc.get('id')?.toString() ?? 'chat missing id').join(', ')
                    }`);
                };

                const roomRef = doc(collection(db, 'rooms'));
                
                const roomData = {
                    id: roomRef.id,
                    userIds: [auth.currentUser!.uid, author!.id],
                    postId: post!.id,
                    createdAt: serverTimestamp(),
    //                secretPhraseValidated: false,
                };

                const userSnapshots = await Promise.all(roomData.userIds.map(async (userId) => transaction.get(doc(db, 'users', userId))));
                
                transaction.set(roomRef, roomData);
                
                let postData = postSnapshot!.data()!;
                postData.roomIds.push(roomRef.id);

                transaction.update(postRef, { roomIds: postData.roomIds });
                
                let userDatas = userSnapshots.map((userSnapshot) => (userSnapshot.data()! as UserData));
                
                return {post: postData as PostData, users: userDatas, room: roomData as RoomData};
            });
            
            setPost(chatParams.post);

            navigation.navigate('Chat Room', chatParams);
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
        } catch (error) {
            navigateToErrorScreen(navigation, error);
        } finally {
            setIsNavigating(false);
        }
    }


    const navigateToChatRoom = async (roomId: string | number) => {
        try {
            setIsNavigating(true);
            if (post === undefined) throw new Error('Post is undefined');
            if (roomTiles === undefined) throw new Error('Room tiles are undefined');
            let roomData;
            if (typeof roomId === 'string') {
                roomData = roomTiles.find((r) => r.room.id == roomId)?.room;
            }
            if (typeof roomId === 'number') {
                roomData = roomTiles[roomId].room;
            }
            
            if (roomData === undefined) throw Error('room is undefined');
            
            navigation.navigate('Chat Room', {post: post, room: roomData});
        } catch (error) {
            navigateToErrorScreen(navigation, error);
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
            console.log('rooms updating...');
            if (roomSnapshot.empty) throw new Error('roomSnapshot is empty');
            const newRoomTiles = await Promise.all(roomSnapshot.docs.map((roomDoc) => new Promise(async (resolve, reject) => {
                try {
                    if (roomDoc?.get('userIds') === undefined) throw new Error('userIds is undefined');
                    const userSnapshots = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', roomDoc.get('userIds'))));
                    const postSnapshot = await getDoc(doc(db, 'post', roomDoc.get('postId') as string));
                    resolve({
                        id: roomDoc.id, 
                        users: userSnapshots.docs.map((userSnapshot) => (userSnapshot.data()! as UserData)), 
                        room: roomDoc.data() as RoomData,
                        post: postSnapshot.data() as PostData,
                    });
                    return;
                } catch (error) {
                    reject(error);
                }
            })));
            
            setRoomTiles(newRoomTiles as ChatRoomTile[]);
        } catch (error) {
            navigateToErrorScreen(navigation, error);
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

    const resolvePost = popupOnError(navigation, async () => {
        if (reasonIndex == 2) {}
    });

    const postUpdateCallback = useCallback(() => {
        if (post?.roomIds === undefined || post?.roomIds?.length == 0) return;

        const unsubscribe = onSnapshot(query(collection(db, 'rooms'), where(documentId(), 'in', post.roomIds)), updateRooms);
        
        return unsubscribe;
    }, [post?.roomIds]);

    useEffect(popupOnError(navigation, () => {
        return postUpdateCallback();
    }), [post?.roomIds]);

    useEffect(popupOnError(navigation, () => {
        if (!isLoggedIn) return;
        const itemData = route.params!.item as ItemData;

        setItem(itemData);
        setAuthor(route.params!.author);

        setMessage(route.params!.post.message);

        if (route.params.post?.roomIds === undefined) return;
    }), [isLoggedIn]);

    useEffect(popupOnError(navigation, () => {
        setIsAuthor(author !== undefined && author.id == auth.currentUser!.uid);
        if (author && route.params.item?.ownerId && author.id == route.params.item.ownerId) {
            setOwner(author);
        } else if (route.params.owner) {
            setOwner(route.params.owner);
        }
    }), [author]);

    useEffect(popupOnError(navigation, () => {
        setIsOwner(owner !== undefined && owner.id == route.params.item.ownerId);
    }), [owner]);
    
    useEffect(popupOnError(navigation, () => {
        if (route.params!.post as PostData != null) {
            setPost(route.params!.post as PostData);
            return;
        }
        if (!route.params.post.id) throw new Error('Post id is undefined');
        const unsubscribe = onSnapshot(doc(db, 'posts', route.params!.post.id), (snapshot) => {
            setPost(snapshot.data() as PostData);
        });
        return unsubscribe;
    }), []);

    const markPostAsFound = () => {
        
    }
    
    const actionButtons = () => {
        if (isAuthor) {
            return (
                <View style={[styles.horizontal, {width: '90%', alignSelf: 'center', alignItems: 'center'}]}>
                    <CoolButton 
                    title='Someone found it!'
                    onPress={
                        () => navigation.navigate('Who Found', {
                            post: post!,
                            rooms: roomTiles?.map(tile => tile.room)!,
                            item: item!,
                            owner: owner!,
                            users: roomTiles!.flatMap(tile => tile.users.filter(user => user.id != auth.currentUser!.uid))!,
                        })} 
                    disabled={isNavigating}
                    containerStyle={{alignSelf: 'center', flex: 1}}/>
                    <CoolButton 
                        title='Remove Post'
                        onPress={() => setModalVisible(!modalVisible)} 
                        disabled={isNavigating}
                        containerStyle={{alignSelf: 'center', flex: 1}}
                        useSecondaryColor />
                </View>
            );
        }
    }

    const chatOptions = () => {
        if (!isAuthor) {
            if (roomTiles === undefined || roomTiles.length == 0) {
                return (
                    <View>
                        <CoolButton 
                            title={`Start chat with ${author?.name || 'owner'}`}
                            onPress={createChatRoom} 
                            disabled={isNavigating} />
                    </View>
                );
            } else {
                return (
                    <View style={styles.chatListContainer}>
                        <PressableOpacity
                            style={styles.chatItem}
                            onPress={() => {
                                navigateToChatRoom(roomTiles.findIndex((tile) => tile.room.userIds.includes(auth.currentUser!.uid)))
                            }} 
                            disabled={isNavigating}>
                            <Image 
                                style={styles.chatThumbnail}
                                source={uriFrom(author?.pfpUrl)}
                                defaultSource={require('../assets/defaultpfp.jpg')} />
                            <Text style={styles.chatTitle}>{author?.name || 'Chat with owner'}</Text>
                        </PressableOpacity>
                    </View>
                );
            }
            return;
        }
        const deletePost = (id?: string) => {
            // Step 3: Update state to remove the item

        };

        const renderLeftAction = (id?: string) => {
            return (
                <View style={{height: '90%', aspectRatio: 1, alignSelf: 'center'}}>
                    <CoolButton 
                        leftIcon={{
                            name: 'delete',
                            size: 20,
                            color: colors.secondaryContrastText,
                        }}
                        onPress={() => deletePost(id)} 
                        containerStyle={{flex: 1}} 
                        style={{flex: 1}}
                        capStyle={{flex: 1, backgroundColor: colors.red}} />
                </View>
            );
        };

        const markItemAsFound = (id?: string) => {
            // Step 3: Update state to remove the item

        };
    
        const renderRightAction = (id?: string) => {
            return (
                <View style={{height: '90%', alignSelf: 'center'}}>
                    <CoolButton 
                        title='I found it!' 
                        onPress={() => markItemAsFound(id)} 
                        containerStyle={{flex: 1}} 
                        style={{flex: 1}}
                        capStyle={{flex: 1}} />
                </View>
            );
        };

        return (
            <FlatList
                keyExtractor={(item) => item.room.id}
                scrollEnabled={false}
                data={roomTiles}
                style={styles.chatListContainer}
                renderItem={({ item }) => {
                    const user = (item.users as any[]).find((user) => user._id != auth.currentUser?.uid);
                    
                    return (
                        <Swipeable 
                            containerStyle={{borderTopWidth: 4, borderColor: colors.border}} 
                            renderLeftActions={() => renderLeftAction(item.room.id)}
                            renderRightActions={() => renderRightAction(item.room.id)}>
                            <View
                                style={{backgroundColor: colors.card}}>
                                <PressableOpacity
                                    style={styles.chatItem}
                                    onPress={() => {
                                        navigateToChatRoom(roomTiles!.findIndex(room => item.room.id))
                                    }}
                                    disabled={isNavigating}>
                                    <Image 
                                        style={styles.chatThumbnail}
                                        source={uriFrom(item.users.find((user) => user.id != auth.currentUser?.uid)?.pfpUrl)}
                                        defaultSource={require('../assets/defaultpfp.jpg')} />
                                    <Text style={styles.chatTitle}>{(item.users ?? []).filter(
                                                    (user) => user.id != auth.currentUser?.uid
                                                ).map(
                                                    (user) => user.name
                                                ).join(
                                                    ', '
                                                ) || 'Unknown user'}</Text>
                                </PressableOpacity>
                            </View>
                        </Swipeable>
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
            flexWrap: 'wrap',
            flex: 1,
        },
        itemInfoContainer: {
            margin: 4,
            alignSelf: 'stretch',
            flexDirection: 'row',
            height: '10%',
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
            flexWrap: 'wrap',
            flex: 1,
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
        },
        chatItem: {
            alignItems: 'center',
            alignSelf: 'stretch',
            padding: 10,
            flexDirection: 'row',
            backgroundColor: colors.card,
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
        rightAction: {
            backgroundColor: 'blue',
        },
        rightActionText: {
            fontSize: 16,
            fontWeight: '600',
        },
        resolveTitle: {
            fontSize: 24,
            fontWeight: 'bold',
        }
    }), [isDarkMode]);


    if (!post) {
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
                            source={uriFrom(author?.pfpUrl)}
                            defaultSource={require('../assets/defaultpfp.jpg')} />
                        <View>
                            <Text style={styles.userName}>{author?.name ?? 'Unknown User'}</Text>
                            <Text style={styles.timestamp}>
                                {post?.createdAt ? timestampToString(post.createdAt!, now, true, true) : 'unknown time'}
                            </Text>
                        </View>
                    </View>
                    <PressableOpacity
                        onPress={() => { if (item) navigation.navigate('View Item', { itemId: item.id, itemName: item.name }) }}
                        disabled={isNavigating}>
                        <Image source={uriFrom(post.imageUrls?.at(0))} style={styles.itemImage} defaultSource={require('../assets/defaultimg.jpg')} />
                        <View style={styles.itemInfoContainer}>
                            <View style={{flex: 2,}}>
                                <Text style={styles.postTitle}>Lost <Text style={{fontWeight: '800'}}>{item?.name ?? 'unknown item'}</Text></Text>
                                <Text style={styles.itemContent}>{item?.description ?? ''}</Text>
                            </View>
                            <View style={{flex: 1}}>
                                <Text style={styles.itemContent}>
                                    Phone number: {`\n${(post?.showPhoneNumber ? owner?.phoneNumber || 'Unknown phone number' : 'N/A')}\n`}
                                    Address: {`\n${post?.showAddress ? owner?.address || 'Unknown address' : 'N/A'}\n`}
                                </Text>
                            </View>
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
                        style={styles.message} />
                </View>
                {!post.resolved ? (
                    <View>
                        {resolvePostModal()}
                        {actionButtons()}
                        <Text style={[styles.text, {fontSize: 20, margin: 8}]}>Chat with {!isAuthor && 'owner'}</Text>
                        {chatOptions()}
                    </View>
                    ) : (
                    <View>
                        {post.resolveReason == LostPostResolveReasons.FOUND_ITEM ? 
                            <Text style={styles.resolveTitle}>Item has been found</Text>
                        : 
                            <Text style={styles.resolveTitle}>{post.resolveReason}</Text>
                        }
                        <Text style={styles.timestamp}>Resolved {timestampToString(post.resolvedAt, now, true, true)}</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}


export default ViewLostPostScreen;