import React, { useCallback, useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Avatar } from 'react-native-elements';
import { auth, db } from '../../firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';

import {
    ImageProps as DefaultImageProps,
    ImageURISource,
  } from 'react-native';
  
  type ImageProps = DefaultImageProps & {
    source: ImageURISource;
  };
  

const Chat = ({ navigation }: {navigation: any}) => {
    const [messages, setMessages] = useState<IMessage[]>([]);
    const signOutNow = () => {
        signOut(auth).then(() => {
            // Sign-out successful.
            navigation.replace('Login');
        }).catch((error) => {
            // An error happened.
        });
    }
    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <View style={{ marginLeft: 20 }}>
                    <Avatar
                        rounded
                        source={{
                            uri: auth?.currentUser?.photoURL as string,
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
                    <Text>logout</Text>
                </TouchableOpacity>
            )
        })

        const q = query(collection(db, 'chats'), orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => setMessages(
            snapshot.docs.map(doc => ({
                _id: doc.data()._id,
                createdAt: doc.data().createdAt.toDate(),
                text: doc.data().text,
                user: doc.data().user,
            }))
        ));

        return () => {
          unsubscribe();
        };

    }, [navigation]);

    const onSend = useCallback((messages: IMessage[] = []) => {
        const { _id, createdAt, text, user,} = messages[0]
        setMessages(previousMessages => GiftedChat.append(previousMessages, messages))
        addDoc(collection(db, 'chats'), { _id, createdAt,  text, user });
    }, []);

    return (
        <GiftedChat
            messages={messages}
            showAvatarForEveryMessage={true}
            onSend={messages => onSend(messages)}
            user={{
                _id: auth?.currentUser?.email ?? "user@example.com",
                name: auth?.currentUser?.displayName ?? "Unknown User",
                avatar: auth?.currentUser?.photoURL as string
            }}
        />
    );
}

export default Chat;