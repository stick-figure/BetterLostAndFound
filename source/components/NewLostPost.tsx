import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { launchImageLibrary, MediaType } from 'react-native-image-picker';

import { auth, db } from '../../ModularFirebase';
import { lightThemeColors } from '../assets/Colors';
import { CommonActions } from '@react-navigation/native';
import PressableOpacity from '../assets/MyElements';
import { Input } from 'react-native-elements';
import SafeAreaView from 'react-native-safe-area-view';


export function NewLostPostScreen({ navigation, route }: { navigation: any, route: any }) {
    const [item, setItem] = useState({});
    const [owner, setOwner] = useState({});

    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');

    const [useLocation, setUseLocation] = useState(false);

    const [uploading, setUploading] = useState(false);

    const uploadPost = () => {
        setUploading(true);

        const postData = {
            type: 'lost',
            itemId: item._id,
            title: title.trim().length > 0 ? title : item.name,
            message: message,
            authorId: auth.currentUser?.uid,
            createdAt: serverTimestamp(),
            resolved: false,
            resolvedAt: -1,
            resolveReason: '',
            views: 0,
            roomIds: [],
        };

        navigation.navigate('Loading');

        addDoc(collection(db, 'posts'), postData).then((postRef) => {
            return updateDoc(doc(db, 'items', item._id), {isLost: true, lostPostId: postRef.id, timesLost: item.timesLost as number + 1});
        }).then(() => {
            return updateDoc(doc(db, 'users', owner._id), {timesOwnItemLost: owner.timesOwnItemLost as number + 1});
        }).then(() => {
            navigation.navigate('Lost Post View', {item: item, owner: owner, author: owner, post: postData});
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
            setUploading(false);
        });
    }

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
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

    useEffect(() => {
        if (!isLoggedIn) return;
        if (route.params?.item) setItem(route.params!.item);
        if (route.params?.owner) setOwner(route.params!.owner);
    }, [isLoggedIn]);

    if (uploading) {
        return (
            <View style={styles.container}>
                <Text>Uploading...</Text>
            </View>);
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.itemContainer}>
                <PressableOpacity
                    onPress={() => { navigation.navigate('Item View', { itemId: item._id, itemName: item.name }) }}
                    disabled={uploading}>
                        <View style={styles.horizontal}>
                        <Image 
                            source={{uri: item.imageSrc}} 
                            defaultSource={require('../assets/defaultimg.jpg')} 
                            style={styles.itemImage} />
                            <View style={styles.itemListItemView}>
                                <Text style={styles.itemTitle}>{item.name}</Text>
                                <Text style={styles.itemSubtitle}>{owner.name}</Text>
                                <Text style={styles.itemSubtitle}>{item.description !== undefined && item.description!.slice(0,140)}</Text>
                            </View>
                        </View>
                </PressableOpacity>
            </View>
            <Input
                label='Message*'
                multiline={true}
                placeholder=''
                onChangeText={text => setMessage(text)}
                value={message}
                editable={!uploading}
                style={styles.multilineTextInput}
            />
            <PressableOpacity
                style={styles.saveButton}
                disabled={message.trim().length <= 0}
                onPress={uploadPost}
                editable={!uploading}>
                <Text style={styles.saveButtonText}>Post</Text>
            </PressableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: lightThemeColors.background,
    },
    itemContainer: {
        width: '100%',
        alignSelf: 'flex-start',
        margin: 8,
    },
    horizontal: {
        flexDirection: 'row',
    },
    multilineTextInput: {
        width: '90%',
        height: 300,
        overflow: 'scroll',
    },
    addItemTitle: {
        margin: 20,
        color: lightThemeColors.textLight,
    },
    imagePressableContainer: {
        width: '100%',
        alignItems: 'center',
    },
    imageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemImage: {
        width: '30%',
        aspectRatio: 1/1,
        borderRadius: 7,
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
        fontSize: 18,
    },
    itemSubtitle: {
        color: lightThemeColors.textLight,
        fontSize: 12,
    },
    itemContent: {
        color: lightThemeColors.textLight,
        fontSize: 16,
    },
    imageLabel: {
        fontSize: 16,
        textAlign: 'center',
        color: lightThemeColors.textLight,
        fontWeight: 'bold',
    },
    saveButton: {
        width: 280,
        backgroundColor: lightThemeColors.primary,
        borderRadius: 7,
        padding: 10,
    },
    saveButtonText: {
        fontSize: 16,
        textAlign: 'center',
        color: lightThemeColors.textDark,
        fontWeight: 'bold',
    }
});


export default NewLostPostScreen;