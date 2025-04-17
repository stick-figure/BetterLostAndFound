import React, { useCallback, useState, useLayoutEffect, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { auth, db } from '../../my_firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, query, orderBy, onSnapshot, doc, serverTimestamp, CollectionReference } from 'firebase/firestore';
import { Avatar, GiftedChat, IMessage } from 'react-native-gifted-chat';

import {
    ImageProps as DefaultImageProps,
    ImageURISource,
} from 'react-native';
import { lightThemeColors } from '../assets/Colors';
import { CommonActions } from '@react-navigation/native';

type ImageProps = DefaultImageProps & {
    source: ImageURISource;
};


export function ChatScreen({ navigation, route }: { navigation: any, route: any }) {
    const [chat, setChat] = useState({});
    const [messages, setMessages] = useState<IMessage[]>([]);

    useEffect(() => {
        const unsubscribe = onSnapshot(
            query(collection(db, "chats", route.params!.chatId, "messages"), orderBy('createdAt', 'desc')), 
            (snapshot) => {
                setMessages(
                    snapshot.docs.map(doc => ({
                        _id: doc.id,
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
        const { _id, createdAt, text, user, } = messages[0]
        setMessages(previousMessages => GiftedChat.append(previousMessages, messages))
        addDoc(collection(db, 'chats'), { _id: _id, createdAt: serverTimestamp(), text: text, user: user });
    }, []);

    return (
        <GiftedChat
            messages={messages}
            showAvatarForEveryMessage={true}
            onSend={messages => onSend(messages)}
            user={{
                _id: auth?.currentUser?.uid ?? "unknown user",
                name: auth?.currentUser?.displayName ?? "Unknown User",
                avatar: auth?.currentUser?.photoURL ?? 'https://gravatar.com/avatar/94d45dbdba988afacf30d916e7aaad69?s=200&d=mp&r=x',
            }}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
        marginTop: 100,
    },
    headerRightText: {
        color: lightThemeColors.textLight,
    },
    button: {
        width: 370,
        marginTop: 10
    }
});

export default ChatScreen;