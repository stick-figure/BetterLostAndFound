import { addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { useEffect, useMemo, useState } from 'react';
import { View, Text, Button, StyleSheet, Image, Pressable, ImageSourcePropType, TextInput, useColorScheme, Platform } from 'react-native';
import { launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker';

import { auth, db } from '../../ModularFirebase';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import { CommonActions, useTheme, useNavigation, useRoute } from '@react-navigation/native';
import { Icon, Input } from 'react-native-elements';
import { CoolTextInput, MyInput, PressableOpacity, RequiredLabel } from '../hooks/MyElements';
import SafeAreaView from 'react-native-safe-area-view';
import { request, PERMISSIONS, RESULTS, check, PermissionStatus } from 'react-native-permissions';
import { useCameraDevices, Camera } from 'react-native-vision-camera';

export function AddItemScreen() {
    const navigation = useNavigation();
    const route = useRoute();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [secretPhrase, setSecretPhrase] = useState('');
    const [tags, setTags] = useState([]);

    const [imgSrc, setImgSrc] = useState({ uri: '' });
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

    const [hasGalleryPermission, setHasGalleryPermission] = useState<PermissionStatus>(RESULTS.UNAVAILABLE);
    const [hasCameraPermission, setHasCameraPermission] = useState<PermissionStatus>(RESULTS.UNAVAILABLE);
    
    useEffect(() => {
        check(Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA).then((result) => {
            setHasCameraPermission(result);
            console.log(result);
        });
        check(Platform.OS === 'ios' ? PERMISSIONS.IOS.PHOTO_LIBRARY : PERMISSIONS.ANDROID.READ_MEDIA_IMAGES).then((result) => {
            setHasGalleryPermission(result);
            console.log(result);
        });
    },[]);

    const openImagePicker = () => {
        if (hasGalleryPermission != RESULTS.GRANTED) {
            request(Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA).then((result) => {
                setHasGalleryPermission(result);
                console.log(result);
                
                if (result == RESULTS.GRANTED) openImagePicker();
            });
            return;    
        }

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
                const source = { uri: response.assets[0].uri! };
                setImgSrc(source);
            }
        }).catch(() => { console.log('whoop de doo') });
    };

    const handleCameraLaunch = () => {
        if (hasCameraPermission != RESULTS.GRANTED) {
            check(Platform.OS === 'ios' ? PERMISSIONS.IOS.PHOTO_LIBRARY : PERMISSIONS.ANDROID.READ_MEDIA_IMAGES).then((result) => {
                setHasGalleryPermission(result);
                console.log(result);
                if (result == RESULTS.GRANTED) handleCameraLaunch();
            });
            return;    
        }

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
                
            }else if (response.errorCode) {
                console.warn('Camera Error', response.errorCode, ': ', response.errorMessage);
            } else {
                let source = { uri: response.assets![0].uri! };
                setImgSrc(source);
            }
        });
    }
    
    const chooseImageFromWeb = () => {

    }

    const uploadImage = (imageId: string) => {
        return new Promise(async (resolve, reject) => {
            try {
                setUploading(true);
                navigation.navigate('Loading');
                const response = await fetch(imgSrc.uri);
                const blob = await response.blob();

                const storage = getStorage();
                const imageRef = ref(storage, 'images/items/' + imageId);
                console.log(imageRef.fullPath);

                uploadBytesResumable(imageRef, blob).then(async () => {
                    const url = await getDownloadURL(imageRef);
                    setImgSrc({ uri: '' });
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

    const uploadItem = () => {
        const itemData = {
            name: name,
            description: description,
            ownerId: auth.currentUser?.uid,
            isLost: false,
            secretPhrase: secretPhrase,
            createdAt: serverTimestamp(),
            imageSrc: '',
            timesLost: 0,
        };
        
        navigation.navigate('Loading');
        
        const docRef = addDoc(collection(db, 'items'), itemData);
        docRef.then((dRef) => {
            return Promise.all([dRef, uploadImage(dRef.id)]);
        }).then(([dRef, url]) => {
            console.log(dRef, url)
            return updateDoc(dRef, {imageSrc: url});
        }).then(() => {
            navigation.navigate('My Items');
//            navigation.navigate('Bottom Tabs', {screen: 'My Items'});

        }).catch((error) => {
            // An error happened.
            const errorCode = error.code;
            const errorMessage = error.message;
            navigation.navigate('Error', { code: errorCode, message: errorMessage });
        });
    }

    const isDarkMode = useColorScheme() === 'dark';
    const colors = isDarkMode ? DarkThemeColors : LightThemeColors;
    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            alignItems: 'center',
            backgroundColor: colors.background,
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
        imagePressableContainer: {
            width: '100%',
            alignItems: 'center',
        },
        imageContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        itemImage: {
            flex: 1,
            aspectRatio: 1 / 1,
        },
        imageLabel: {
            fontSize: 14,
            textAlign: 'center',
            color: colors.text,
            fontWeight: '500',
        },
        iconButton: {
            borderRadius: 5,
            width: 25,
            height: 25,
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
            width: 280,
            backgroundColor: colors.primary,
            borderRadius: 7,
            padding: 10,
            marginVertical: 10,
        },
        saveButtonText: {
            fontSize: 16,
            textAlign: 'center',
            color: colors.primaryContrastText,
            fontWeight: 'bold',
        },
    }), [isDarkMode]);

    
    if (uploading) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Uploading...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={{flex: 1, width: '100%', backgroundColor: colors.background}}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.imageContainer}>
                    <Image
                        style={styles.itemImage}
                        source={imgSrc.uri != '' ? imgSrc : require('../assets/defaultimg.jpg')}
                    />
                </View>
                

                <View style={styles.horizontalContainer}>
                    <TouchableOpacity onPress={handleCameraLaunch} style={styles.iconButton}>
                        <Icon name='camera-alt' type='material-icons' size={20} color={colors.secondaryContrastText} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={openImagePicker} style={styles.iconButton}>
                        <Icon name='photo-library' type='material-icons' size={20} color={colors.secondaryContrastText} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {}} style={styles.iconButton}>
                        <Icon name='web-plus' type='material-community' size={20} color={colors.secondaryContrastText} />
                    </TouchableOpacity>
                    <RequiredLabel style={styles.imageLabel}>Select image</RequiredLabel>
                </View>
                <View style={{width: '100%', alignItems: 'center'}}>
                    <CoolTextInput
                        label='Name'
                        placeholder='What is this item called?'
                        onChangeText={text => setName(text)}
                        containerStyle={{width: '80%'}}
                        value={name}
                        editable={!uploading}
                        required
                    />
                    <CoolTextInput
                        label='Description'
                        placeholder='Describe some identifying features'
                        onChangeText={text => setDescription(text)}
                        containerStyle={{width: '80%'}}
                        style={{height: 80}}
                        value={description}
                        editable={!uploading}
                        multiline
                        numberOfLines={4}
                        required
                    />
                    <CoolTextInput
                        label='Secret Phrase (optional)'
                        placeholder='Phrase to verify you are the owner'
                        onChangeText={text => setSecretPhrase(text)}
                        containerStyle={{width: '80%'}}
                        value={secretPhrase}
                        editable={!uploading}
                    />
                    <PressableOpacity
                        style={styles.saveButton}
                        disabled={name.trim().length < 1 || description.trim().length < 1 || imgSrc.uri == '' || uploading}
                        onPress={uploadItem}
                    >
                        <Text style={styles.saveButtonText}>Add Item</Text>
                    </PressableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

export default AddItemScreen;