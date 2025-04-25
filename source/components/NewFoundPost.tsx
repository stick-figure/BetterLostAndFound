import { serverTimestamp, addDoc, collection, updateDoc, doc, getDoc } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, TextInput, useColorScheme } from 'react-native';
import { auth, db } from '../../ModularFirebase';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import { MediaType, launchImageLibrary } from 'react-native-image-picker';
import SafeAreaView from 'react-native-safe-area-view';
import { CoolTextInput, PressableOpacity } from '../hooks/MyElements';
import { Input } from 'react-native-elements';
import { navigateToErrorScreen } from './Error';

export function NewFoundPostScreen() {
    const navigation = useNavigation();
    const route = useRoute();
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
        }).catch((error) => {
            navigateToErrorScreen(navigation, error);
        });
    };

    const uploadPost = () => {
        setUploading(true);

        const postData = {
            type: 'Found',
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

    const isDarkMode = useColorScheme() === 'dark';
    const colors = isDarkMode ? DarkThemeColors : LightThemeColors;
    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            alignItems: 'center',
            backgroundColor: colors.background,
        },
        text: {
            fontSize: 14,
            color: colors.text,
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
            color: colors.text,
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
            backgroundColor: colors.card,
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
            fontSize: 18,
        },
        itemSubtitle: {
            color: colors.text,
            fontSize: 12,
        },
        itemContent: {
            color: colors.text,
            fontSize: 16,
        },
        imageLabel: {
            fontSize: 16,
            textAlign: 'center',
            color: colors.text,
            fontWeight: 'bold',
        },
        saveButton: {
            width: 280,
            backgroundColor: colors.primary,
            borderRadius: 7,
            padding: 10,
        },
        saveButtonText: {
            fontSize: 16,
            textAlign: 'center',
            color: colors.primaryContrastText,
            fontWeight: 'bold',
        }
    }), [isDarkMode]);

    if (uploading) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Uploading...</Text>
            </View>);
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.itemContainer}>
                <PressableOpacity
                    onPress={() => { navigation.navigate('View Item', { itemId: item._id, itemName: item.name }) }}
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
            <CoolTextInput
                label='Message'
                multiline={true}
                placeholder=''
                onChangeText={text => setMessage(text)}
                value={message}
                editable={!uploading}
                required
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

export default NewFoundPostScreen;