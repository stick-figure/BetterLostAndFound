import React, { useCallback, useState, useLayoutEffect, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from 'react-native-elements';
import { auth, db } from '../../firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';

import {
    ImageProps as DefaultImageProps,
    ImageURISource,
} from 'react-native';
import { lightThemeColors } from '../assets/Colors';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { CommonActions } from '@react-navigation/native';

type ImageProps = DefaultImageProps & {
    source: ImageURISource;
};


export function ChatScreen({ navigation }: { navigation: any }) {
    const [messages, setMessages] = useState<IMessage[]>([]);
    const signOutNow = () => {
        signOut(auth).then(() => {
            // Sign-out successful.
            navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
        }).catch((error) => {
            // An error happened.
            const errorCode = error.code;
            const errorMessage = error.message;
            navigation.navigate("Error", { code: errorCode, message: errorMessage });
        });
    }

    useEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <View style={{ marginLeft: 20 }}>
                    <Avatar
                        rounded
                        source={{
                            uri: auth?.currentUser?.photoURL ?? 'https://gravatar.com/avatar/94d45dbdba988afacf30d916e7aaad69?s=200&d=mp&r=x',
                        }}
                    />
                </View>
            ),
            headerRight: () => (
                <TouchableOpacity style={{
                    marginRight: 10
                }}
                    onPress={signOutNow}
                >
                    <Text style={styles.headerRightText}>Logout</Text>
                </TouchableOpacity>
            )
        })

        const unsubscribe = onSnapshot(query(collection(db, 'chats'), orderBy('createdAt', 'desc')), (snapshot) => setMessages(
            snapshot.docs.map(doc => ({
                _id: doc.data()._id,
                createdAt: doc.data().createdAt.toDate(),
                text: doc.data().text,
                user: doc.data().user,
            }))
        ));

        return unsubscribe;

    }, []);

    const onSend = useCallback((messages: IMessage[] = []) => {
        const { _id, createdAt, text, user, } = messages[0]
        setMessages(previousMessages => GiftedChat.append(previousMessages, messages))
        addDoc(collection(db, 'chats'), { _id, createdAt, text, user });
    }, []);

    return (
        <GiftedChat
            messages={messages}
            showAvatarForEveryMessage={true}
            onSend={messages => onSend(messages)}
            user={{
                _id: auth?.currentUser?.email ?? "user@example.com",
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