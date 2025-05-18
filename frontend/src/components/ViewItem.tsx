import { collection, deleteDoc, deleteField, doc, DocumentReference, getDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { View, Text, Button, StyleSheet, Pressable, Alert, TextInput, Image, ScrollView, StatusBar, useColorScheme, Platform } from 'react-native';
import { auth, db } from '../../MyFirebase';
import { deleteObject, getDownloadURL, getStorage, ref, StorageReference, uploadBytesResumable, UploadTask } from 'firebase/storage';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { CommonActions, RouteProp, useFocusEffect, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { CoolButton, CoolTextInput, ImagePicker, PressableOpacity } from '../hooks/MyElements';
import { Icon } from 'react-native-elements';
import SafeAreaView from 'react-native-safe-area-view';
import { MediaType, launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import { timestampToString, uriFrom } from '../utils/SomeFunctions';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import { navigateToErrorScreen, popupOnError } from './Error';
import { MyStackScreenProps } from '../navigation/Types';
import { ItemData, PostData, UserData } from '../assets/Types';

export function ViewItemScreen({navigation, route}: MyStackScreenProps<'View Item'>) {    
    const [item, setItem] = useState<ItemData>();
    
    const [owner, setOwner] = useState<UserData>();

    const [itemRef, setItemRef] = useState<DocumentReference>();
    const [imageRef, setImageRef] = useState<StorageReference>();

    const [imageUri, setImageUri] = useState('');

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [secretPhrase, setSecretPhrase] = useState('');
    const [showSecretPhrase, setShowSecretPhrase] = useState(false);
    const [isEditable, setIsEditable] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(-1);

    const [isOwner, setIsOwner] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const isFocused = useIsFocused();
    /*useEffect(() => {
        navigation.addListener('beforeRemove', (e) => {
            if (!hasUnsavedChanges) {
                // If we don't have unsaved changes, then we don't need to do anything
                return;
            }

            // Prevent default behavior of leaving the screen
            e.preventDefault();

            // Prompt the user before leaving the screen
            Alert.alert(
                'Discard changes?',
                'You have unsaved changes. Are you sure to discard them and leave the screen?',
                [
                    { text: "Don't leave", style: 'cancel', onPress: () => {} },
                    {
                        text: 'Discard',
                        style: 'destructive',
                        // If the user confirmed, then we dispatch the action we blocked earlier
                        // This will continue the action that had triggered the removal of the screen
                        onPress: () => navigation.dispatch(e.data.action),
                    },
                ]
            );
        });
    }, [navigation, hasUnsavedChanges]);*/

    const redirectToNewFoundPost = popupOnError(navigation, () => {
        if (!item) throw new Error('item not found');
        if (!owner) throw new Error('owner not found');
//        if (!item.foundPostId) throw new Error('item already has a post');
        
        navigation.navigate('New Found Post', { item: item, owner: owner });
    });
    
    const redirectToCurrentLostPost = popupOnError(navigation, async () => {
        if (!item) throw new Error('item not found');
        if (!owner) throw new Error('owner not found');
        if (!item.lostPostId) throw new Error('item post not found');

        const postData = (await getDoc(doc(db, 'posts', item.lostPostId!))).data()!;
        postData._id = item.lostPostId;
        navigation.navigate('View Lost Post', { item: item, author: owner, post: postData as PostData });
    });

    const redirectToNewLostPost = popupOnError(navigation, () => {
        if (!item) throw new Error('item not found');
        if (!owner) throw new Error('owner not found');
        if (item.lostPostId && item.lostPostId !== '') throw new Error('item already has a post');

        navigation.navigate('New Lost Post', { item: item, owner: owner });
    });
    
    const deleteItemAlert = () => {
        Alert.alert('Delete Item?', 'You cannot undo this action!', [
            {
                text: 'Cancel',
                onPress: () => console.log('Cancel Pressed'),
                style: 'cancel',
            },
            { 
                text: 'OK', 
                onPress: deleteItem,
                style: 'destructive',
            },
        ]);
    }

    const deleteItem = () => {
        navigation.navigate('Loading');
        
        Promise.all([deleteObject(imageRef!), deleteDoc(itemRef!)]).then(() => {
            // File deleted successfully
            navigation.navigate('My Drawer', {screen: 'Home Tabs', params: {screen:'My Stuff'}});
        }).catch((error) => {
            navigateToErrorScreen(navigation, error);
            // Uh-oh, an error occurred!
        });
    }

    const setItemInfo = useCallback(popupOnError(navigation, () => {
        const storage = getStorage();
        
        if (route.params.item !== undefined) {
            setItemRef(doc(db, 'items', route.params.item.id));
            setImageRef(ref(storage, 'images/items/' + route.params.item.id));
            
            setItem(route.params.item as ItemData);

            getDoc(doc(db, 'users', route.params.item.ownerId)).then((snapshot) => {
                setOwner(snapshot.data() as UserData);
            });
        } else if (route.params.itemId !== undefined) {
            getDoc(doc(db, 'items', route.params.itemId!)).then((itemSnapshot) => {
                setItemRef(itemSnapshot.ref);
                setImageRef(ref(storage, 'images/items/' + route.params!.itemId));
                
                setItem(itemSnapshot.data() as ItemData);

                if (itemSnapshot.get('ownerId') as string) {
                    getDoc(doc(collection(db, 'users'), itemSnapshot.get('ownerId') as string)).then((userSnapshot) => {
                        setOwner(userSnapshot.data() as UserData);
                    });
                }
            });
        }
    }), [route.params]);

    const pickImage = (response: ImagePickerResponse) => {
        setImageUri(response.assets![0].uri!);
        setHasUnsavedChanges(true);
    }

    const uploadImage = () => {
        return new Promise(async (resolve, reject) => {
            try {
                
                const response = await fetch(imageUri);
                const blob = await response.blob();
                if (imageRef === undefined) {
                    reject(new Error('Invalid image reference.'))
                }
                const uploadTask: UploadTask = uploadBytesResumable(imageRef!, blob);
                setUploadProgress(0);

                uploadTask.on('state_changed', (snapshot) => {
                    setUploadProgress(snapshot.bytesTransferred / snapshot.totalBytes);
                    // Stop after receiving one update.
                }, () => {}, () => setUploadProgress(-1));

                await uploadTask.then();
                    
                const url = await getDownloadURL(imageRef!);

                resolve(url);
                return;                    
            } catch (error) {
                reject(error);
                return;
            }
        });
    }

    useEffect(() => {
        setIsOwner(item?.ownerId == auth.currentUser!.uid);
        setName(item?.name ?? 'Item name');
        setDescription(item?.description ?? 'Item description');
        setSecretPhrase(item?.secretPhrase ?? 'Secret phrase');
    }, [item]);

    const saveEdits = useCallback(async () => {
        try {
            if (!hasUnsavedChanges) return;

            setIsUploading(true);
            setIsEditable(false);

            if (imageUri == '') {
                await updateDoc(itemRef!, { name: name, description: description, secretPhrase: secretPhrase });
            } else {
                let imageUrl = await uploadImage();
                
                await updateDoc(itemRef!, { name: name, description: description, secretPhrase: secretPhrase, imageUrl: imageUrl });    
                setImageUri('');
            }
            let snapshot = await getDoc(itemRef!);
            setItem(snapshot.data() as ItemData);
            setHasUnsavedChanges(false);
        } catch (error) {
            navigateToErrorScreen(navigation, error);
        } finally {
            setIsUploading(false);
        }
    
    }, [name, description, secretPhrase, imageUri]);

    const [now, setNow] = useState<number>();

    useEffect(() => {
        setNow(Date.now());
    }, [isFocused]);

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
        
        setItemInfo();
    }, [isLoggedIn]);

    const actionButtons = () => {
        let arr: ReactNode[] = [];
        if (isEditable) {
            arr.push(
                <View style={{ flex: 1 }} key={'save'}>
                    <CoolButton
                        leftIcon={{
                            name: 'save', 
                            type: 'material-icons', 
                            size: 24,
                        }}
                        
                        onPress={() => {saveEdits(); setIsEditable(false)}}
                        disabled={!isEditable || isUploading} 
                        useSecondaryColor />
                </View>
            );
            arr.push(
                <View key={'deletepost'}>
                    <CoolButton
                        leftIcon={{
                            name: 'delete',
                            type: 'material-community',
                            size: 24,
                            color: colors.text,
                        }}
                        onPress={deleteItemAlert}
                        capStyle={styles.deleteItemButton}
                        disabled={!isEditable || isUploading} />
                </View>
            );
        } else {
            if (isOwner) {
                arr.push(
                    <View style={{ flex: 0 }} key={'editpost'}>
                        <CoolButton
                            leftIcon={{
                                name: 'pencil', 
                                type: 'material-community', 
                                size: 20,
                            }}
                            onPress={() => setIsEditable(true)}
                            style={styles.startEditButton}
                            disabled={isUploading}
                            useSecondaryColor />
                    </View>
                );
                /*
                arr.push(
                    <View style={{ flex: 1 }} key={'transferownership'}>
                        <CoolButton
                            title='Transfer ownership'
                            onPress={() => {}}
                            style={styles.scaryActionButton} 
                            capStyle={{backgroundColor: colors.red}} />
                    </View>
                );*/
            } else if (item && !item.isLost) {
                arr.push(
                    <View style={{ flex: 1 }} key={'reportasfound'}>
                        <CoolButton
                            title='Report item as found'
                            onPress={redirectToNewFoundPost}
                            style={styles.actionButton} />
                    </View>
                );
            }
            if (item?.isLost) {
                arr.push(
                    <View style={{ flex: 1 }} key={'redirecttolostpost'}>
                        <CoolButton
                            title='Go to lost post'
                            onPress={redirectToCurrentLostPost}
                            style={styles.actionButton} 
                            />
                    </View>
                );
            } else {
                arr.push(
                    <View style={{ flex: 1 }} key={'markaslost'}>
                        <CoolButton
                            title='Post item as lost'
                            onPress={redirectToNewLostPost}
                            style={styles.actionButton} 
                             />
                    </View>
                );
            }
        }

        return (
            <View style={[styles.horizontal, {width: '100%', padding: 8, alignSelf: 'center'}]}>
                <View style={[{flexDirection: 'row', flex: 1 }]}>
                    {arr}
                </View>
            </View>
        );
    }

    
    const isDarkMode = useColorScheme() === 'dark';
    const colors = isDarkMode ? DarkThemeColors : LightThemeColors;
    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        horizontal: {
            flexDirection: 'row',
        },
        text: {
            color: colors.text,
            fontSize: 14,
        },
        buttonText: {
            textAlign: 'left',
            color: colors.primaryContrastText,
            fontSize: 15,
        },
        userHeader: {
            flexDirection: 'row',
            width: '100%', 
            justifyContent: 'flex-start', 
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
        itemImage: {
            flex: 1,
            resizeMode: 'cover',
            marginBottom: 12,
            aspectRatio: 1,
        },
        textInput: {
            fontWeight: 600,
            fontSize: 18,
            width: '80%', 
            overflow: 'hidden',
            borderTopWidth: 2,
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: 1,
            padding: 6,
            margin: 5,
            color: colors.text,
        },
        itemName: {
            fontSize: 20,
            marginTop: 7,
            color: colors.text,
        },
        description: {
            fontSize: 16,
            marginTop: 8,
            color: colors.text,
        },
        infoContainer: {
            flex: 1,
            width: '100%',
            padding: 6,
        },
        actionButton: {
            width: '100%',
        },
        scaryActionButton: {
            width: '100%',
        },
        startEditButton: {
            width: '100%',
        },
        finishEditButton: {
            backgroundColor: colors.primary,
            width: '100%',
            height: '100%',
            paddingHorizontal: 10,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
        },
        editButtonText: {
            color: colors.contrastText,
            fontSize: 15,
        },
        deleteItemButton: {
            backgroundColor: colors.red,
        },
    }), [isDarkMode]);

    if (!item || !owner) return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.text}>Item or owner not found</Text>
        </SafeAreaView>
    );

    if (isOwner) return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.userHeader}>
                    <Image
                        style={[styles.pfp, {width: null, height: 50, aspectRatio: 1}]}
                        source={uriFrom(owner.pfpUrl)}
                        defaultSource={require('../assets/images/defaultpfp.jpg')} />
                    <View>
                        <Text>You own this item</Text>
                        <Text style={styles.userName}>{owner.name}</Text>
                    </View>
                </View>
                <View style={[styles.horizontal, {alignItems: 'flex-start', justifyContent: 'space-between'}]}>
                    <View style={{flex: 1, padding: 5}}>
                        <Image
                            style={styles.itemImage}
                            source={uriFrom(imageUri) ?? uriFrom(item.imageUrl)} 
                            defaultSource={require('../assets/images/defaultimg.jpg')} />
                            {isEditable ? (
                                <ImagePicker 
                                    containerStyle={{alignSelf: 'stretch'}}
                                    onResponse={pickImage} />
                            ) : null}
                    </View>
                    <View style={{flex: 1, margin: 5}}>
                        <Text style={[styles.text, {fontSize: 18, fontWeight: 'bold'}]}>Item Info</Text>
                        <Text style={styles.text}>Added on {item.createdAt ? timestampToString(item.createdAt, undefined, true, false) : 'some day in history'}</Text>
                        <Text style={styles.text}>Status: {item.isLost ? 'Missing' : 'AOK'}</Text>
                        <Text style={styles.text}>Lost {item.timesLost} {item.timesLost == 1 ? 'time' : 'times'}</Text>
                    </View>
                </View>
                
                {uploadProgress != -1 ? (
                    <View style={{width: `100%`, height: 7, backgroundColor: 'grey', borderRadius: 10,}}>
                        <View style={{width: `${uploadProgress*100}%`, height: 7, backgroundColor: 'lime', borderRadius: 10,}}></View>
                    </View>
                ) : null}

                {isEditable ? (
                    <View style={styles.infoContainer}>
                        <CoolTextInput 
                            style={{}}
                            onChangeText={(text) => {
                                if (!hasUnsavedChanges) setHasUnsavedChanges(true); 
                                setName(text)
                            }}
                            value={name} 
                            editable={isEditable && !isUploading} />
                        <CoolTextInput 
                            style={{height: 100}}
                            onChangeText={(text) => {
                                if (!hasUnsavedChanges) setHasUnsavedChanges(true); 
                                setDescription(text)
                            }}
                            value={description} 
                            multiline
                            editable={isEditable && !isUploading} />
                        {actionButtons()}
                    </View>
                ) : (
                    <View style={styles.infoContainer}>
                        <Text style={styles.itemName}>{name}</Text>
                        <Text style={styles.description}>{description}</Text>
                        {actionButtons()}

                        <Text style={styles.text}>Posts mentioning this item</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
            <View style={styles.userHeader}>
                    <Image
                        style={[styles.pfp, {width: null, height: 50, aspectRatio: 1}]}
                        source={uriFrom(owner.pfpUrl)}
                        defaultSource={require('../assets/images/defaultpfp.jpg')} />
                    <View>
                        <Text>Owned by</Text>
                        <Text style={styles.userName}>{owner.name}</Text>
                    </View>
                </View>
                <View style={[styles.horizontal, {alignItems: 'flex-start', justifyContent: 'space-between'}]}>
                    <View style={{flex: 1, margin: 5}}>
                        <Image
                            style={styles.itemImage}
                            source={uriFrom(imageUri || item.imageUrl)} 
                            defaultSource={require('../assets/images/defaultimg.jpg')} />
                    </View>
                    <View style={{flex: 1, marginVertical: 5}}>
                        <Text style={[styles.text, {fontSize: 18, fontWeight: 'bold'}]}>Item Info</Text>
                        <Text style={styles.text}>Added on {item.createdAt ? timestampToString(item.createdAt, undefined, true, false) : 'some day in history'}</Text>
                        <Text style={styles.text}>Status: {item.isLost ? 'Missing' : 'AOK'}</Text>
                        <Text style={styles.text}>Lost {item.timesLost} {item.timesLost == 1 ? 'time' : 'times'}</Text>
                    </View>
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.itemName}>{name}</Text>
                    <Text style={styles.description}>{description}</Text>
                </View>
                {actionButtons()}
                
                <Text style={styles.text}>Posts mentioning this item</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

export default ViewItemScreen;