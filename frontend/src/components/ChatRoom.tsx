import React, { useCallback, useState, useLayoutEffect, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { auth, db } from '../../MyFirebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, query, orderBy, onSnapshot, doc, serverTimestamp, CollectionReference, documentId, where, getDoc } from 'firebase/firestore';
import { Avatar, Bubble, BubbleProps, GiftedChat, IMessage, InputToolbar, InputToolbarProps } from 'react-native-gifted-chat';

import {
    ImageProps as DefaultImageProps,
    ImageURISource,
} from 'react-native';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import { CommonActions, useNavigation, useRoute, useTheme } from '@react-navigation/native';
import SafeAreaView from 'react-native-safe-area-view';
import { PressableOpacity } from '../hooks/MyElements';
import { navigateToErrorScreen, popupOnError } from './Error';
import { MyStackScreenProps } from '../navigation/Types';
import { TypeType, RoomData, UserData, PostData } from '../assets/Types';

export function ChatRoomScreen({ navigation, route }: MyStackScreenProps<'Chat Room'>) {
    const [room, setRoom] = useState<RoomData>();
    const [users, setUsers] = useState<UserData[]>();
    const [post, setPost] = useState<PostData>();

    const [messages, setMessages] = useState<IMessage[]>([]);

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    useEffect(popupOnError(navigation, () => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                if (route.params.users !== undefined) {
                    setUsers(route.params.users);
                } else if (route.params.room?.userIds) {
                    getDocs(query(collection(db, 'users'), where(documentId(), 'in', route.params.room.userIds))).then((usersSnapshot) => {
                        setUsers(usersSnapshot.docs.map((doc) => (doc.data() as UserData)));
                    });
                }
                if (route.params.post !== undefined) {
                    setPost(post);
                } else if (route.params.room?.postId) {
                    getDoc(doc(db, 'posts', route.params.room!.postId)).then((snapshot) => {
                        setPost(snapshot.data()! as PostData);
                    });
                }
                setIsLoggedIn(true);
            } else {
                setIsLoggedIn(false);
            }
        });

        return unsubscribe;
    }), []);

    useEffect(popupOnError(navigation, () => {
        if (!isLoggedIn) return;

        const unsubscribe = onSnapshot(doc(db, 'rooms', route.params!.room.id), (snapshot) => {
            setRoom(snapshot.data() as RoomData);
            if (users === undefined || snapshot.get('userIds') != users.map(user => user.id)) {
                if (snapshot.get('userIds') === undefined) throw new Error('no users found in snapshot..?');
                getDocs(query(collection(db, 'users'), where(documentId(), 'in', snapshot.get('userIds')))).then((usersSnapshot) => {
                    setUsers(usersSnapshot.docs.map(doc => doc.data() as UserData));
                }).catch((error) => {
                    navigateToErrorScreen(navigation, error);
                });
            }
        });

        return unsubscribe;
    }), [isLoggedIn]);

    useEffect(() => {
        if (!isLoggedIn) return;

        if (!route.params.room?.id) {
            return;
        }
        const unsubscribe = onSnapshot(query(collection(db, 'rooms', route.params!.room.id, 'messages'), orderBy('createdAt', 'desc')), 
            (snapshot) => {
                setMessages(
                    snapshot.docs.map(doc => ({
                        _id: doc.get('messageId'),
                        createdAt: new Date((doc.get('createdAt')?.seconds ?? 0) * 1000),
                        text: doc.get('text'),
                        user: doc.get('user'),
                    }))
                );
            }
        );

        return unsubscribe;
    }, [isLoggedIn]);

    useEffect(() => {
        if (!users && !route.params!.users) {
            navigation.setOptions({ 
                title: 'Unknown User(s)',
                headerBackTitle: 'Back',
            });
            return;
        }
        navigation.setOptions({ 
            title: (users ?? route.params.users ?? []).filter(
                (user) => user.id != auth.currentUser?.uid
            ).map(
                (user) => user.name
            ).join(
                ', '
            ),
            headerBackTitle: 'Back',
        });
    }, [users]);

    const onSend = useCallback((messages: IMessage[] = []) => {
        if (!isLoggedIn) return;
        const { _id, createdAt, text, user, } = messages[0];
        setMessages(previousMessages => GiftedChat.append(previousMessages, messages));
        const messageData = {
            messageId: _id, 
            createdAt: serverTimestamp(), 
            text: text, 
            user: user, 
        };
        addDoc(collection(db, 'rooms', route.params!.room.id, 'messages'), messageData);
    }, [isLoggedIn]);

    const renderInputToolbar = (props: InputToolbarProps<IMessage>) => {
        return (
            <InputToolbar
                {...props}
                containerStyle={{
                    backgroundColor: colors.card,
                    borderTopColor: '#E8E8E8',
                    borderTopWidth: 1,
                    padding: 8,
                }}
                primaryStyle={{
                    backgroundColor: colors.card,
                }}
                accessoryStyle={{
                    backgroundColor: colors.card,
                }}
            />
        );
    }
    const renderBubble = (props: BubbleProps<IMessage>) => {
        return (
            <Bubble
                {...props}
            />
        )
    }

    const renderAccessory = (props: InputToolbarProps<IMessage>) => {
        if (room?.type == TypeType.FOUND) {

        }
        return (
            <View>
                <PressableOpacity>
                    <Text>accessory</Text>
                </PressableOpacity>
                <PressableOpacity>
                    <Text>accessory</Text>
                </PressableOpacity>
            </View>
        );
    };

    const isDarkMode = useColorScheme() === 'dark';
    const colors = isDarkMode ? DarkThemeColors : LightThemeColors;
    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            alignItems: 'center',
            padding: 10,
            marginTop: 100,
            backgroundColor: colors.background,
        },
        text: {
            fontSize: 14,
            color: colors.text,
        },
        headerRightText: {
            color: colors.text,
        },
        button: {
            width: 370,
            marginTop: 10
        },
        messageContainer: {
            paddingBottom: 12,
        },
    }), [isDarkMode]);

    return (
//        <SafeAreaView>
            <GiftedChat
                messages={messages}
                showAvatarForEveryMessage={true}
                onSend={messages => onSend(messages)}
                user={{
                    _id: auth?.currentUser?.uid ?? 'unknown user',
                    name: auth?.currentUser?.displayName ?? 'Unknown User',
                    avatar: auth?.currentUser?.photoURL ?? 'https://gravatar.com/avatar/94d45dbdba988afacf30d916e7aaad69?s=200&d=mp&r=x',
                }}
                scrollToBottom
                renderBubble={(props) => renderBubble(props)}
                renderInputToolbar={(props) => renderInputToolbar(props)}
                renderAccessory={(props) => renderAccessory(props)}
                renderActions={() => <View><Text>actions</Text></View>}
                
                messagesContainerStyle={styles.messageContainer}
            />
//        </SafeAreaView>
        
    );
}

export default ChatRoomScreen;