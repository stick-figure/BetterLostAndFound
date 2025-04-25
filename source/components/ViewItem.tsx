import { collection, deleteDoc, deleteField, doc, DocumentReference, getDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { View, Text, Button, StyleSheet, Pressable, Alert, TextInput, Image, ScrollView, StatusBar, useColorScheme, Platform } from 'react-native';
import { auth, db } from '../../ModularFirebase';
import { deleteObject, getDownloadURL, getStorage, ref, StorageReference, uploadBytesResumable, UploadTask } from 'firebase/storage';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { CommonActions, RouteProp, useFocusEffect, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { CoolTextInput, PressableOpacity } from '../hooks/MyElements';
import { Icon } from 'react-native-elements';
import SafeAreaView from 'react-native-safe-area-view';
import { MediaType, launchImageLibrary, launchCamera } from 'react-native-image-picker';
import firebase from 'firebase/compat/app';
import { timestampToString } from './SomeFunctions';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import { check, PERMISSIONS, PermissionStatus, request, RESULTS } from 'react-native-permissions';
import { navigateToErrorScreen } from './Error';

export type ViewItemRouteParams = {
    itemId: string,
    itemName: string,
}

export function ViewItemScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    
    const [item, setItem] = useState({});
    
    const [owner, setOwner] = useState({});

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

    const redirectToNewFoundPost = () => {
        navigation.navigate('New Found Post', { item: item, owner: owner });
    }
    
    const redirectToCurrentLostPost = async () => {
        try {
            const postData = (await getDoc(doc(collection(db, 'posts'), item.lostPostId))).data()!;
            postData._id = item.lostPostId;
            navigation.navigate('View Lost Post', { item: item, author: owner, post: postData });
        } catch (error) {
            navigateToErrorScreen(navigation, error);
        }
    }

    const redirectToNewLostPost = () => {
        navigation.navigate('New Lost Post', { item: item, owner: owner });
    }
    
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
            navigation.navigate('My Items');
        }).catch((error) => {
            navigateToErrorScreen(navigation, error);
            // Uh-oh, an error occurred!
        });
    }

    const setItemInfo = useCallback(() => {
        getDoc(doc(collection(db, 'items'), route.params!.itemId)).then((snapshot) => {
            const storage = getStorage();
            
            setItemRef(snapshot.ref);
            setImageRef(ref(storage, 'images/items/' + route.params!.itemId));
            
            setItem({
                _id: route.params!.itemId,
                ...snapshot.data(),
            });

            if (snapshot.get('ownerId') as string) {
                getDoc(doc(collection(db, 'users'), snapshot.get('ownerId') as string)).then((user_snapshot) => {
                    setOwner({
                        _id: user_snapshot.id,
                        ...user_snapshot.data()
                    });
                });
            }
        });
    }, []);

    const [hasGalleryPermission, setHasGalleryPermission] = useState<PermissionStatus>(RESULTS.UNAVAILABLE);
    const [hasCameraPermission, setHasCameraPermission] = useState<PermissionStatus>(RESULTS.UNAVAILABLE);
    
    useEffect(() => {
        check(Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA).then((result) => {
            setHasCameraPermission(result);
            console.log('camera permission status:', result);
        });
        check(Platform.OS === 'ios' ? PERMISSIONS.IOS.PHOTO_LIBRARY : PERMISSIONS.ANDROID.READ_MEDIA_IMAGES).then((result) => {
            setHasGalleryPermission(result);
            console.log('image library permission status:', result);
        });
    },[]);

    const openImagePicker = () => {
        if (hasCameraPermission != RESULTS.GRANTED) {
            request(Platform.OS === 'ios' ? PERMISSIONS.IOS.PHOTO_LIBRARY : PERMISSIONS.ANDROID.READ_MEDIA_IMAGES).then((result) => {
                setHasCameraPermission(result);
                console.log(result);
                if (result == RESULTS.GRANTED) pickImage();
            });
            return;
        }
        pickImage();
    }

    const pickImage = () => {
        
        const options = {
            mediaType: 'photo' as MediaType,
            includeBase64: false,
            maxHeight: 2000,
            maxWidth: 2000,
            selectionLimit: 1,
        };

        launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.errorCode) {
                console.log('ImagePicker Error: ', response.errorMessage);
            } else if (response.assets) {
                setImageUri(response.assets[0].uri!);
                setHasUnsavedChanges(true);
            }
        }).catch(() => { console.log('whoop de doo') });
    };
    const handleCameraLaunch = () => {
        if (hasCameraPermission != RESULTS.GRANTED) {
            request(Platform.OS === 'ios' ? PERMISSIONS.IOS.PHOTO_LIBRARY : PERMISSIONS.ANDROID.READ_MEDIA_IMAGES).then((result) => {
                setHasCameraPermission(result);
                console.log(result);
                if (result == RESULTS.GRANTED) myCameraLaunch();
            });
            return;    
        }
    }

    const myCameraLaunch = () => {
        const options = {
            mediaType: 'photo' as MediaType,
            includeBase64: false,
            maxHeight: 2000,
            maxWidth: 2000,
        };

        launchCamera(options, (response) => {
            if (response.didCancel) {
                console.warn('User cancelled camera');
            } else if (response.errorCode == 'camera_unavailable') {
                
            } else if (response.errorCode) {
                console.warn('Camera Error', response.errorCode, ': ', response.errorMessage);
            } else {
                setImageUri(response.assets![0].uri!);
                setHasUnsavedChanges(true);
            }
        });
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
        setName(item.name);
        setDescription(item.description);
        setSecretPhrase(item.secretPhrase);
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
                
                await updateDoc(itemRef!, { name: name, description: description, secretPhrase: secretPhrase, imageSrc: imageUrl });    
                setImageUri('');
            }
            let snapshot = await getDoc(itemRef!);
            setItem({_id: snapshot.id, ...snapshot.data()!});
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

        if (item?.isLost) {
            arr.push(
                <View style={{ flex: 1 }} key={'redirecttolostpost'}>
                    <PressableOpacity
                        onPress={redirectToCurrentLostPost}
                        style={styles.actionButton}>
                        <Text style={styles.buttonText}>Go to lost post</Text>
                    </PressableOpacity>
                </View>
            );
        } else {
            if (isOwner) {
                arr.push(
                    <View style={{ flex: 3 }} key={'markaslost'}>
                        <PressableOpacity
                            onPress={redirectToNewLostPost}
                            style={styles.actionButton}>
                            <Text style={styles.buttonText}>Post item as lost</Text>
                        </PressableOpacity>
                    </View>
                );
                arr.push(
                    <View style={{ flex: 1 }} key={'transferownership'}>
                        <PressableOpacity
                            onPress={() => {}}
                            style={styles.scaryActionButton}>
                            <Text style={styles.buttonText}>Transfer ownership</Text>
                        </PressableOpacity>
                    </View>
                );
            } else {      
                arr.push(
                    <View style={{ flex: 1 }} key={'reportasfound'}>
                        <PressableOpacity
                            onPress={redirectToNewFoundPost}
                            style={styles.actionButton}>
                            <Text style={styles.buttonText}>Report item as found</Text>
                        </PressableOpacity>
                    </View>
                );
            }
        }

        return (
            <View style={[styles.horizontal, {width: '100%', padding: 8, alignSelf: 'center'}]}>
                <View style={[{flexDirection: 'row', flex: 1, height: 40}]}>
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
            backgroundColor: colors.primary,
            width: '100%',
            height: '100%',
            paddingHorizontal: 10,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
        },
        scaryActionButton: {
            backgroundColor: colors.red,
            width: '100%',
            height: '100%',
            paddingHorizontal: 10,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
        },
        startEditButton: {
            backgroundColor: colors.secondary,
            width: '100%',
            height: '100%',
            paddingHorizontal: 10,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
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
            height: '100%',
            borderRadius: 10,
            aspectRatio: 1,
            alignItems: 'center',
            justifyContent: 'center',
        },
    }), [isDarkMode]);

    if (isOwner) return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.userHeader}>
                    <Image
                        style={[styles.pfp, {width: null, height: 50, aspectRatio: 1}]}
                        source={{uri: owner.pfpUrl || undefined}}
                        defaultSource={require('../assets/defaultpfp.jpg')} />
                    <View>
                        <Text>You own this item</Text>
                        <Text style={styles.userName}>{owner.name}</Text>
                    </View>
                </View>
                <View style={[styles.horizontal, {alignItems: 'flex-start', justifyContent: 'space-between'}]}>
                    <View style={{flex: 1, padding: 5}}>
                        <Image
                            style={styles.itemImage}
                            source={{uri: imageUri || item.imageSrc || undefined}} 
                            defaultSource={require('../assets/defaultimg.jpg')} />
                            {isEditable ? (
                                <View style={{...styles.horizontal, alignSelf: 'center'}}>
                                    <PressableOpacity 
                                        onPress={handleCameraLaunch} 
                                        style={styles.cameraButton} 
                                        disabled={!isEditable || isUploading}>
                                        <Icon name='camera-alt' type='material-icons' size={20} color={colors.text}/>
                                    </PressableOpacity>
                                    <PressableOpacity 
                                        onPress={openImagePicker} 
                                        style={styles.uploadButton}
                                        disabled={!isEditable || isUploading}>
                                        <Icon name='photo-library' type='material-icons' size={20} color={colors.text} />
                                    </PressableOpacity>
                                    <Text style={{fontSize: 14, fontWeight: '500', color: colors.text,}}>Set photo</Text>
                                </View>
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
                        <View style={[styles.horizontal, {width: '100%', padding: 8, alignSelf: 'center'}]}>
                            <View style={{flexDirection: 'row', flex: 1, height: 40}}>
                                <View style={{ flex: 1 }}>
                                    <PressableOpacity
                                        onPress={() => {saveEdits(); setIsEditable(false)}}
                                        style={styles.finishEditButton}
                                        disabled={!isEditable || isUploading}>
                                        <Icon name='save' type='material-icons' color={colors.contrastText} />
                                    </PressableOpacity>
                                </View>
                                <View>
                                    <PressableOpacity
                                        onPress={deleteItemAlert}
                                        style={styles.deleteItemButton}
                                        disabled={!isEditable || isUploading}>
                                        <Icon name='delete' type='material-community' />
                                    </PressableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={styles.infoContainer}>
                        <Text style={styles.itemName}>{name}</Text>
                        <Text style={styles.description}>{description}</Text>
                        {actionButtons()}
                        <View style={[styles.horizontal, {width: '100%', padding: 8, alignSelf: 'center'}]}>
                            <View style={{flexDirection: 'row', flex: 1, height: 40}}>
                                <View style={{ flex: 1 }} key={'editinfo'}>
                                    <PressableOpacity
                                        onPress={() => setIsEditable(true)}
                                        style={styles.startEditButton}
                                        disabled={isUploading}>
                                        <Icon name='pencil' type='material-community' color={colors.secondaryContrastText} />
                                    </PressableOpacity>
                                </View>
                            </View>
                        </View>

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
                        source={{uri: owner.pfpUrl || undefined}}
                        defaultSource={require('../assets/defaultpfp.jpg')} />
                    <View>
                        <Text>Owned by</Text>
                        <Text style={styles.userName}>{owner.name}</Text>
                    </View>
                </View>
                <View style={[styles.horizontal, {alignItems: 'flex-start', justifyContent: 'space-between'}]}>
                    <View style={{flex: 1, margin: 5}}>
                        <Image
                            style={styles.itemImage}
                            source={{uri: imageUri || item.imageSrc || undefined}} 
                            defaultSource={require('../assets/defaultimg.jpg')} />
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