import React, { useCallback, useState, useLayoutEffect, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { auth, db } from '../../ModularFirebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, query, orderBy, onSnapshot, doc, serverTimestamp, CollectionReference } from 'firebase/firestore';
import { Avatar, Bubble, BubbleProps, GiftedChat, IMessage, InputToolbar, InputToolbarProps } from 'react-native-gifted-chat';

import {
    ImageProps as DefaultImageProps,
    ImageURISource,
} from 'react-native';
import { lightThemeColors } from '../assets/Colors';
import { CommonActions } from '@react-navigation/native';
import SafeAreaView from 'react-native-safe-area-view';

type ImageProps = DefaultImageProps & {
    source: ImageURISource;
};

export function ChatRoomScreen({ navigation, route }: { navigation: any, route: any }) {
    const [room, setRoom] = useState({});
    const [users, setUsers] = useState([]);

    const [messages, setMessages] = useState<IMessage[]>([]);
    
    useEffect(() => {
        setRoom(route.params!.room);
        setRoom(route.params!.users);
        if (!route?.params?.room?._id) {
            return;
        }
        const unsubscribe = onSnapshot(query(collection(db, "rooms", route.params!.room._id, "messages"), orderBy('createdAt', 'desc')), 
            (snapshot) => {
                setMessages(
                    snapshot.docs.map(doc => ({
                        _id: doc.data().messageId,
                        createdAt: new Date((doc.data()?.createdAt?.seconds ?? 0) * 1000),
                        text: doc.data().text,
                        user: doc.data().user,
                    }))
                )
            }
        );

        return unsubscribe;
    }, []);

    const onSend = useCallback((messages: IMessage[] = []) => {
        const { _id, createdAt, text, user, } = messages[0];
        setMessages(previousMessages => GiftedChat.append(previousMessages, messages));
        const messageData = { 
            messageId: _id, 
            createdAt: serverTimestamp(), 
            text: text, 
            user: user 
        };
        addDoc(collection(db, 'rooms', route.params!.room._id, 'messages'), messageData);
    }, []);

    const renderInputToolbar = (props: InputToolbarProps<IMessage>) => {
        return (
            <InputToolbar
                {...props}
                containerStyle={{
                    backgroundColor: "white",
                    borderTopColor: "#E8E8E8",
                    borderTopWidth: 1,
                    padding: 8,
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

    return (
//        <SafeAreaView>
            <GiftedChat
                messages={messages}
                showAvatarForEveryMessage={true}
                onSend={messages => onSend(messages)}
                user={{
                    _id: auth?.currentUser?.uid ?? "unknown user",
                    name: auth?.currentUser?.displayName ?? "Unknown User",
                    avatar: auth?.currentUser?.photoURL ?? 'https://gravatar.com/avatar/94d45dbdba988afacf30d916e7aaad69?s=200&d=mp&r=x',
                }}
                scrollToBottom
                renderBubble={(props) => renderBubble(props)}
                renderInputToolbar={(props) => renderInputToolbar(props)}
                renderAccessory={() => <View><Text>accessory</Text></View>}
                renderActions={() => <View><Text>actions</Text></View>}
                
                messagesContainerStyle={styles.messageContainer}
            />
//        </SafeAreaView>
        
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
        marginTop: 100,
        backgroundColor: lightThemeColors.background,
    },
    headerRightText: {
        color: lightThemeColors.textLight,
    },
    button: {
        width: 370,
        marginTop: 10
    },
    messageContainer: {
        paddingBottom: 12,
    },
});

export default ChatRoomScreen;