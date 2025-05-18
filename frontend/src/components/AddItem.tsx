import { addDoc, collection, doc, getDoc, runTransaction, serverTimestamp, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { useEffect, useMemo, useState } from 'react';
import { View, Text, Button, StyleSheet, Image, Pressable, ImageSourcePropType, TextInput, useColorScheme, Platform } from 'react-native';
import { ImagePickerResponse, launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker';

import { auth, db } from '../../MyFirebase';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import { CommonActions, useTheme, useNavigation, useRoute } from '@react-navigation/native';
import { Icon, Input } from 'react-native-elements';
import { CoolButton, CoolTextInput, ImagePicker, MyInput, RequiredLabel } from '../hooks/MyElements';
import SafeAreaView from 'react-native-safe-area-view';
import { request, PERMISSIONS, RESULTS, check, PermissionStatus } from 'react-native-permissions';
import { useCameraDevices, Camera } from 'react-native-vision-camera';
import { navigateToErrorScreen, popupOnError } from './Error';
import { MyStackScreenProps } from '../navigation/Types';
import { uriFrom } from '../utils/SomeFunctions';
import { LostPostDataUpload, TypeType, ItemData, UserData, PostData } from '../assets/Types';

export function AddItemScreen({ navigation, route }: MyStackScreenProps<'Add Item'>) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [secretPhrase, setSecretPhrase] = useState('');
    
    const [message, setMessage] = useState('');
    const [tags, setTags] = useState([]);

    const [imageUri, setImageUri] = useState('');
    const [uploading, setUploading] = useState(false);
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

    const onImagePicked = (response: ImagePickerResponse) => {
        setImageUri(response.assets![0].uri!);
    }

    const uploadImage = (imageId: string) => {
        return new Promise(async (resolve, reject) => {
            try {
                setUploading(true);
                navigation.navigate('Loading');
                const response = await fetch(imageUri);
                const blob = await response.blob();

                const storage = getStorage();
                const imageRef = ref(storage, 'images/items/' + imageId);
                console.log(imageRef.fullPath);

                uploadBytesResumable(imageRef, blob).then(async () => {
                    const url = await getDownloadURL(imageRef);
                    setImageUri('');
                    resolve(url);
                    setUploading(false);
                    return;
                }).catch((error) => {
                    reject(error);
                    return;
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }

    const uploadItem = popupOnError(navigation, async () => {
        setUploading(true);
        navigation.navigate('Loading');

        const docRef = doc(collection(db, 'items'));
        
        const url = await uploadImage(docRef.id);

        if (!url) throw new Error('Image URL failed');

        const itemData = {
            id: docRef.id,
            name: name,
            description: description,
            ownerId: auth.currentUser!.uid,
            isLost: false,
            secretPhrase: secretPhrase,
            createdAt: serverTimestamp(),
            imageUrl: url,
            timesLost: 0,
        };
        
        await setDoc(docRef, itemData);

        if (route.params?.nextScreen !== undefined && route.params!.nextScreen == 'View Lost Post') {
            if (!isLoggedIn || !auth.currentUser) throw new Error('User is not authenticated');
            if (!itemData?.id) throw new Error('Item is not defined');
            if (!itemData?.ownerId) throw new Error('Owner is not defined');

            const postRef = await runTransaction(db, async (transaction) => {
                try {
                    const currentItem = await transaction.get(doc(db, 'items', itemData!.id));
                    const currentOwner = await transaction.get(doc(db, 'owners', itemData!.ownerId));
                    if (currentItem.get('lostPostId') && currentItem.get('lostPostId') !== '') throw new Error(`Post already exists for this item: ${currentItem.get('lostPostId')}`);
        
                    const postRef = doc(collection(db, 'posts'));
        
                    const postDataToUpload: LostPostDataUpload = {
                        id: postRef.id,
                        type: TypeType.LOST,
                        itemId: itemData!.id,
                        title: itemData!.name,
                        message: message,
                        authorId: auth.currentUser!.uid,
                        createdAt: serverTimestamp(),
                        resolved: false,
                        resolvedAt: null,
                        foundBy: null,
                        resolveReason: null,
                        views: 0,
                        roomIds: [],
                        showPhoneNumber: false,
                        showAddress: false,
                        imageUrls: [itemData!.imageUrl as string],
                    };
                    transaction.set(postRef, postDataToUpload);
                    transaction.update(doc(db, 'items', currentItem!.id), {isLost: true, lostPostId: postRef.id, timesLost: currentItem!.get('timesLost') as number + 1});
                    transaction.update(doc(db, 'users', currentOwner!.id), {timesItemLost: currentOwner.get('timesItemLost') as number + 1});
        
                    return postRef;
                } catch (error) {
                    navigateToErrorScreen(navigation, error);
                    return null;
                }
            });

            const currentPost = await getDoc(postRef!);
            const currentItem = await getDoc(docRef);
            const currentOwner = await getDoc(doc(db, 'users', currentItem.get('ownerId')!));
            console.log(currentOwner?.data());
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [
                        {
                            name: 'View Lost Post', 
                            params: {
                                item: currentItem!.data() as ItemData, 
                                owner: currentOwner!.data() as UserData, 
                                author: currentOwner!.data() as UserData, 
                                post: currentPost!.data() as PostData,
                            }
                        }
                    ],
                })
            );
            setUploading(false);
            return;
        }
        setUploading(false);
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [
                    {
                        name: 'View Item', 
                        params: {
                            itemId: docRef.id, itemName: itemData.name 
                        } 
                    }
                ],
            })
        );
    });

    const isDarkMode = useColorScheme() === 'dark';
    const colors = isDarkMode ? DarkThemeColors : LightThemeColors;
    const styles = useMemo(() => StyleSheet.create({
        container: {
            backgroundColor: colors.background,
            flex: 1,
            minHeight: '100%',
            padding: 8,
        },
        text: {
            fontSize: 16,
            color: colors.text,
        },
        addItemTitle: {
            margin: 20,
            color: colors.text,
        },
        horizontalContainer: {
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexDirection: 'row',
            padding: 10,
        },
        imageContainer: {
            flex: 1,
            alignItems: 'center',
            padding: 8, 
        },
        itemImage: {
            alignSelf:'stretch',
            aspectRatio: 1 / 1,
        },
        imageLabel: {
            fontSize: 14,
            textAlign: 'center',
            color: colors.text,
            fontWeight: '500',
        },
        iconButton: {
            borderRadius: 10,
            width: 50,
            height: 50,
            marginRight: 4,
            alignItems: 'center',
            justifyContent: 'center', 
            backgroundColor: colors.secondary,
        },
        inputLabel: {
            fontSize: 14,
            color: colors.text,
            alignSelf: 'flex-start',
            marginHorizontal: 24,
            marginTop: 8,
        },
        textInput: {
            textDecorationStyle: 'dotted',
            fontWeight: 600,
            fontSize: 20,
            width: '90%', 
            overflow: 'hidden',
            borderBottomWidth: 2,
            borderColor: colors.border,
            color: colors.text,
            borderRadius: 1,
            marginTop: 0,
            padding: 8,
            margin: 12,
        },
        saveButton: {
            marginTop: 8,
        },
    }), [isDarkMode]);

    
    if (uploading) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Uploading...</Text>
            </View>
        );
    }
    if (route.params?.nextScreen=='View Lost Post') {
        return (
            <SafeAreaView style={{flex: 1, width: '100%', backgroundColor: colors.background}}>
                <ScrollView contentContainerStyle={styles.container}>
                    <View style={{width: '100%', flexDirection: 'row', alignSelf: 'stretch'}}>
                        <View style={styles.imageContainer}>
                            <Image
                                style={styles.itemImage}
                                source={uriFrom(imageUri)}
                                defaultSource={require('../assets/images/defaultimg.jpg')}/>
                            <ImagePicker 
                                onResponse={onImagePicked} 
                                required />
                        </View>
                        <View style={{flex: 2, flexGrow: 2}}>
                            <CoolTextInput
                                label='Name'
                                placeholder='What is this item called?'
                                onChangeText={text => setName(text)}
                                containerStyle={{width: '100%'}}
                                value={name}
                                editable={!uploading}
                                required
                            />
                            <CoolTextInput
                                label='Description'
                                placeholder='Describe some identifying features'
                                onChangeText={text => setDescription(text)}
                                style={{height:100}}
                                containerStyle={{alignContent: 'flex-start', width:'100%'}}
                                value={description}
                                editable={!uploading}
                                multiline
                                numberOfLines={3}
                                required
                            />
                            <CoolTextInput
                                label='Secret Passphrase (optional)'
                                placeholder={'To prove you are the owner'}
                                onChangeText={text => setSecretPhrase(text)}
                                containerStyle={{width:'100%'}}
                                value={secretPhrase}
                                editable={!uploading}
                            />
                        </View>
                    </View>                
                    {/* 
                    <View style={styles.horizontalContainer}>
                        <TouchableOpacity onPress={handleCameraLaunch} style={styles.iconButton}>
                            <Icon name='camera-alt' type='material-icons' size={40} color={colors.secondaryContrastText} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={openImagePicker} style={styles.iconButton}>
                            <Icon name='photo-library' type='material-icons' size={40} color={colors.secondaryContrastText} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {}} style={styles.iconButton}>
                            <Icon name='web-plus' type='material-community' size={40} color={colors.secondaryContrastText} />
                        </TouchableOpacity>
                        <RequiredLabel style={styles.imageLabel}>Select image</RequiredLabel>
                    </View>
                    */}
                    <View style={{flexGrow: 1, alignSelf: 'stretch', alignItems: 'center'}}>
                        <CoolTextInput
                            label='Message'
                            placeholder={'Where was the last place you left this item? When was the last time you had it?'}
                            onChangeText={text => setMessage(text)}
                            containerStyle={{width:'100%', flexGrow: 1, minHeight: 120}}
                            style={{flex: 1}}
                            value={message}
                            editable={!uploading}
                            multiline
                            required
                        />
                        <CoolButton 
                            title='Add item and post'
                            disabled={name.trim().length < 1 || description.trim().length < 1 || imageUri == '' || uploading}
                            onPress={uploadItem}
                            containerStyle={{width: '75%'}}
                            style={styles.saveButton}
                            />
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{flex: 1, width: '100%', backgroundColor: colors.background}}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={{width: '100%', flexDirection: 'row', alignSelf: 'stretch'}}>
                    <View style={styles.imageContainer}>
                        <Image
                            style={styles.itemImage}
                            source={uriFrom(imageUri)}
                            defaultSource={require('../assets/images/defaultimg.jpg')}/>
                        <ImagePicker 
                            onResponse={onImagePicked} 
                            required />
                    </View>
                </View>                
                {/* 
                <View style={styles.horizontalContainer}>
                    <TouchableOpacity onPress={handleCameraLaunch} style={styles.iconButton}>
                        <Icon name='camera-alt' type='material-icons' size={40} color={colors.secondaryContrastText} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={openImagePicker} style={styles.iconButton}>
                        <Icon name='photo-library' type='material-icons' size={40} color={colors.secondaryContrastText} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {}} style={styles.iconButton}>
                        <Icon name='web-plus' type='material-community' size={40} color={colors.secondaryContrastText} />
                    </TouchableOpacity>
                    <RequiredLabel style={styles.imageLabel}>Select image</RequiredLabel>
                </View>
                */}
                <View style={{flexGrow: 1, alignSelf: 'stretch', alignItems: 'center'}}>
                    <CoolTextInput
                        label='Name'
                        placeholder='What is this item called?'
                        onChangeText={text => setName(text)}
                        containerStyle={{width: '100%'}}
                        value={name}
                        editable={!uploading}
                        required
                    />
                    <CoolTextInput
                        label='Description'
                        placeholder='Describe some identifying features'
                        onChangeText={text => setDescription(text)}
                        style={{height:100}}
                        containerStyle={{alignContent: 'flex-start', width:'100%'}}
                        value={description}
                        editable={!uploading}
                        multiline
                        numberOfLines={3}
                        required
                    />
                    <CoolTextInput
                        label='Secret Passphrase (optional)'
                        placeholder={'To prove you are the owner'}
                        onChangeText={text => setSecretPhrase(text)}
                        containerStyle={{width:'100%'}}
                        value={secretPhrase}
                        editable={!uploading}
                    />
                    <CoolButton 
                        title='Add item'
                        disabled={name.trim().length < 1 || description.trim().length < 1 || imageUri == '' || uploading}
                        onPress={uploadItem}
                        containerStyle={{width: '75%'}}
                        style={styles.saveButton}
                        />
                </View>
            </ScrollView>
        </SafeAreaView>
    );

}

export default AddItemScreen;