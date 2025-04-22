import { serverTimestamp, addDoc, collection, updateDoc, doc, getDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, TextInput } from 'react-native';
import { auth, db } from '../../ModularFirebase';
import { lightThemeColors } from '../assets/Colors';
import { CommonActions } from '@react-navigation/native';
import { MediaType, launchImageLibrary } from 'react-native-image-picker';
import SafeAreaView from 'react-native-safe-area-view';
import PressableOpacity from '../assets/MyElements';
import { Input } from 'react-native-elements';

export function NewFoundPostScreen({ navigation, route }: { navigation: any, route: any }) {
    const [item, setItem] = useState({
        _id: '',
        name: '',
        description: '',
        ownerId: '',
        isLost: false,
        timesLost: -1,
        secretPhrase: '',
        createdAt: -1,
        imageSrc: require('../assets/defaultimg.jpg'),
    });

    const [owner, setOwner] = useState({});
    const [author, setAuthor] = useState({});

    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    
    const [imageUris, setImageUris] = useState<string[]>([]);

    const [uploading, setUploading] = useState(false);

    const openImagePicker = () => {
        const options = {
            mediaType: 'photo' as MediaType,
            includeBase64: false,
            maxHeight: 2000,
            maxWidth: 2000,
            selectionLimit: 9,
        };

        launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.errorCode) {
                console.log('ImagePicker Error: ', response.errorMessage);
            } else if (response.assets) {
                setImageUris(response.assets.filter((a) => a.uri != undefined).map((a) => a.uri!));
            }
        }).catch((error) => { console.warn(error) });
    };

    const uploadPost = () => {
        setUploading(true);

        const postData = {
            type: 'found',
            itemId: item._id,
            itemOwnerId: item.ownerId,
            title: title,
            message: message,
            imageUrls: [],
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
            navigation.navigate('Found Post View', {item: item, owner: owner, author: owner, post: postData});
            navigation.dispatch((state: {routes: any[]}) => {
                const topScreen = state.routes[0];
                const thisScreen = state.routes[state.routes.length - 1];
                const routes = [topScreen, thisScreen];
                setUploading(false);
                return CommonActions.reset({
                    ...state,
                    index: routes.length - 1,
                    routes,
                });
            });
        });
    }

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setIsLoggedIn(true);
                getDoc(doc(db, 'users', auth.currentUser!.uid)).then((snapshot) => {
                    setAuthor({_id: auth.currentUser!.uid, ...snapshot.data()});
                });
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


export default NewFoundPostScreen;