import { collection, deleteDoc, deleteField, doc, DocumentReference, getDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useState, useEffect, useCallback, ReactNode } from 'react';
import { View, Text, Button, StyleSheet, Pressable, Alert, TextInput, Image, ScrollView } from 'react-native';
import { auth, db } from '../../ModularFirebase';
import { deleteObject, getDownloadURL, getStorage, ref, StorageReference, uploadBytesResumable, UploadTask } from 'firebase/storage';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { lightThemeColors } from '../assets/Colors';
import { CommonActions, RouteProp, useFocusEffect, useIsFocused } from '@react-navigation/native';
import PressableOpacity from '../assets/MyElements';
import { Icon } from 'react-native-elements';
import SafeAreaView from 'react-native-safe-area-view';
import { MediaType, launchImageLibrary, launchCamera } from 'react-native-image-picker';
import firebase from 'firebase/compat/app';
import { timestampToString } from './SomeFunctions';

export type ItemViewRouteParams = {
    itemId: string,
    itemName: string,
}

export function ItemViewScreen({ navigation, route }: { navigation: any, route: any }) {
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

    const isFocused = useIsFocused();

    const redirectToNewFoundPost = () => {
        navigation.navigate('New Found Post', { item: item, owner: owner });
    }
    
    const redirectToCurrentLostPost = async () => {
        try {
            const postData = (await getDoc(doc(collection(db, 'posts'), item.lostPostId))).data()!;
            postData._id = item.lostPostId;
            navigation.navigate('Lost Post View', { item: item, author: owner, post: postData });
        } catch (error) {
            console.warn(error);
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
            { text: 'OK', onPress: deleteItem },
        ]);
    }

    const deleteItem = () => {
        navigation.navigate('Loading');
        
        Promise.all([deleteObject(imageRef!), deleteDoc(itemRef!)]).then(() => {
            // File deleted successfully
            navigation.navigate('My Items');
        }).catch((error) => {
            console.warn(error);
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

    
        const openImagePicker = () => {
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
                }
            }).catch(() => { console.log('whoop de doo') });
        };
    
        const handleCameraLaunch = () => {
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
            setItem({_id: snapshot.id, ...snapshot.data()!})
            
        } catch (error) {
            console.warn(error);
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

    if (isOwner) return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={{padding: 5}}>
                <Image
                    style={styles.itemImage}
                    source={imageUri ? {uri: imageUri} : {uri: item.imageSrc}} 
                    defaultSource={require('../assets/defaultimg.jpg')} />
                {isEditable ? (
                    <View style={styles.horizontal}>
                        <PressableOpacity 
                            onPress={handleCameraLaunch} 
                            style={styles.cameraButton} 
                            disabled={!isEditable || isUploading}>
                            <Icon name='camera-alt' type='material-icons' size={20}/>
                        </PressableOpacity>
                        <PressableOpacity 
                            onPress={openImagePicker} 
                            style={styles.uploadButton}
                            disabled={!isEditable || isUploading}>
                            <Icon name='photo-library' type='material-icons' size={20} />
                        </PressableOpacity>
                        <Text style={{fontSize: 16, color: lightThemeColors.textLight,}}>Set photo*</Text>
                    </View>
                ) : (
                    <View></View>
                )}
                
                {uploadProgress != -1 ? (
                    <View style={{width: `100%`, height: 7, backgroundColor: 'grey', borderRadius: 10,}}>
                        <View style={{width: `${uploadProgress*100}%`, height: 7, backgroundColor: 'lime', borderRadius: 10,}}></View>
                    </View>
                ) : (
                    <View></View>
                )}

                <TextInput 
                    style={isEditable ? styles.textInput : styles.itemName}
                    onChangeText={(text) => setName(text)}
                    value={name} 
                    editable={isEditable && !isUploading} />
                <TextInput 
                    style={isEditable ? [styles.textInput,{height: 100}] : styles.description}
                    onChangeText={(text) => setDescription(text)}
                    value={description} 
                    multiline
                    editable={isEditable && !isUploading} />

                {!isEditable ? (
                    <View style={[styles.horizontal, {alignItems: 'center', justifyContent: 'space-between'}]}>
                        <View>
                            <Text style={styles.text}>Owner: {owner.name}</Text>
                            <Text style={styles.text}>Added on {item.createdAt ? timestampToString(item.createdAt, undefined, true, true) : 'some day in history'}</Text>
                            <Text style={styles.text}>Lost {item.timesLost} {item.timesLost == 1 ? 'time' : 'times'}</Text>
                        </View>
                        
                        <Image
                            style={[styles.pfp, {width: null, height: 50, aspectRatio: 1}]}
                            source={owner.pfpUrl ? {uri: owner.pfpUrl} : undefined}
                            defaultSource={require('../assets/defaultpfp.jpg')} />
                    </View>
                ) : <View></View>}
                
                {!isEditable ? actionButtons() : <View></View>}

                <View style={[styles.horizontal, {width: '100%', padding: 8, alignSelf: 'center'}]}>
                    <View style={{flexDirection: 'row', flex: 1, height: 40}}>
                        <View style={{ flex: 1 }} key={'editinfo'}>
                            {!isEditable ? (
                                <PressableOpacity
                                    onPress={() => setIsEditable(true)}
                                    style={styles.startEditButton}
                                    disabled={isUploading}>
                                    <Icon name='pencil' type='material-community'  color='#000' />
                                </PressableOpacity>
                            ) : (
                                <PressableOpacity
                                    onPress={() => {saveEdits(); setIsEditable(false)}}
                                    style={styles.finishEditButton}
                                    disabled={!isEditable || isUploading}>
                                    <Icon name='check' type='material-community' color='#FFF' />
                                </PressableOpacity>
                            )}
                           
                        </View>
                        <View key={'delete'}>
                            <PressableOpacity
                                onPress={deleteItemAlert}
                                style={styles.deleteItemButton}
                                disabled={!isEditable || isUploading}>
                                <Icon name='delete' type='material-community' />
                            </PressableOpacity>
                        </View>
                    </View>
                </View>
                
                <Text>Posts mentioning this item</Text>
            </ScrollView>
        </SafeAreaView>
    );
    
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <Image
                    style={styles.itemImage}
                    source={item.imageSrc ? {uri: item.imageSrc} : undefined}
                    defaultSource={require('../assets/defaultimg.jpg')}/>
                <View style={{margin: 10}}>
                    <Text style={styles.itemName}>{name}</Text>
                    <Text style={styles.description}>{description}</Text>
                    
                    <View style={[styles.horizontal, {alignItems: 'center', justifyContent: 'space-between'}]}>
                        <View>
                            <Text style={styles.text}>Owner: {owner.name}</Text>
                            <Text style={styles.text}>Added on {item.createdAt ? timestampToString(item.createdAt, undefined, true, true) : 'some day in history'}</Text>
                            <Text style={styles.text}>Lost {item.timesLost} {item.timesLost == 1 ? 'time' : 'times'}</Text>
                        </View>
                        
                        <Image
                            style={[styles.pfp, {width: null, height: 50, aspectRatio: 1}]}
                            source={owner.pfpUrl ? {uri: owner.pfpUrl} : undefined}
                            defaultSource={require('../assets/defaultpfp.jpg')} />
                    </View>
                </View>
                {actionButtons()}
                
                <Text>Posts mentioning this item</Text>
            </ScrollView>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: lightThemeColors.background,
    },
    horizontal: {
        flexDirection: 'row',
    },
    text: {
        color: lightThemeColors.textLight,
        fontSize: 14,
    },
    buttonText: {
        textAlign: 'left',
        color: '#FFF',
        fontSize: 15,
    },
    userHeader: {
        flexDirection: 'row',
        width: '100%', 
        justifyContent: 'flex-start', 
        alignItems: 'center', 
        padding: 8, 
        backgroundColor: lightThemeColors.foreground,
    },
    pfp: {
        borderRadius: 99999,
        width: 42, 
        aspectRatio: 1/1,
        marginRight: 12,
        color: lightThemeColors.textLight,
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
        color: lightThemeColors.textLight,
    },
    timestamp: {
        fontSize: 12,
        margin: 2,
        color: lightThemeColors.textLight,
    },
    itemImage: {
        width: '100%',
        marginBottom: 12,
        aspectRatio: 1 / 1,
    },
    textInput: {
        textDecorationStyle: 'dotted',
        fontWeight: 600,
        fontSize: 18,
        width: '80%', 
        overflow: 'hidden',
        borderTopWidth: 2,
        backgroundColor: lightThemeColors.foreground,
        borderColor: lightThemeColors.dullGrey,
        borderRadius: 1,
        padding: 6,
        margin: 5,
    },
    itemName: {
        fontSize: 20,
        marginVertical: 10,
        color: lightThemeColors.textLight,
    },
    description: {
        fontSize: 16,
        marginVertical: 10,
        color: lightThemeColors.textLight,
    },
    actionButton: {
        backgroundColor: lightThemeColors.primary,
        width: '100%',
        height: '100%',
        paddingHorizontal: 10,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scaryActionButton: {
        backgroundColor: lightThemeColors.red,
        width: '100%',
        height: '100%',
        paddingHorizontal: 10,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    startEditButton: {
        backgroundColor: lightThemeColors.secondary,
        width: '100%',
        height: '100%',
        paddingHorizontal: 10,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    finishEditButton: {
        backgroundColor: 'green',
        width: '100%',
        height: '100%',
        paddingHorizontal: 10,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editButtonText: {
        color: lightThemeColors.textLight,
        fontSize: 15,
    },
    deleteItemButton: {
        backgroundColor: lightThemeColors.red,
        height: '100%',
        borderRadius: 10,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default ItemViewScreen;