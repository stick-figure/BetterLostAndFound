import React, { ErrorInfo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Image, Text, StatusBar, TextInput, useColorScheme, Platform } from 'react-native';
import { auth, db } from '../../MyFirebase';
import { AuthError, AuthErrorCodes, createUserWithEmailAndPassword, updatePhoneNumber, updateProfile } from 'firebase/auth';
import { addDoc, collection, doc, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@firebase/storage';
import { launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker';
import { CommonActions, NavigationProp, useNavigation, useRoute } from '@react-navigation/native';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import { CoolButton, CoolTextInput, ImagePicker, MyInput } from '../hooks/MyElements';
import { colors, Icon, Input } from 'react-native-elements';
import SafeAreaView from 'react-native-safe-area-view';
import PhoneInput from 'react-native-phone-number-input';
import { check, PERMISSIONS, PermissionStatus, request, RESULTS } from 'react-native-permissions';
import { navigateToErrorScreen } from './Error';
import { MyStackScreenProps } from '../navigation/Types';
import { uriFrom } from '../utils/SomeFunctions';

export function RegisterScreen({navigation, route}: MyStackScreenProps<'Register'>) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [formattedPhoneNumber, setFormattedPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorText, setErrorText] = useState('');

    const [pfpUri, setPfpUri] = useState('');
    const [registering, setRegistering] = useState(false);

    const phoneInput = useRef<PhoneInput>(null);
    
    const transferFilledInfo = useCallback(() => {
        if (route.params!.email) setEmail(route.params!.email);
        if (route.params!.password) setPassword(route.params!.password);
    }, [])

    useEffect(() => {
        transferFilledInfo();
    }, []);

    const register = async () => {
        try {
            setRegistering(true);
            navigation.navigate('Loading');

            await runTransaction(db, async (transaction) => {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                
                let pfpUrl: string | undefined;
                try {
                    if (pfpUri != '') pfpUrl = await uploadImage(userCredential.user.uid) as string;
                } catch (error) {
                    pfpUrl = undefined;
                }
                
                const userDataToUpload = {
                    id: userCredential.user.uid,
                    name: name,
                    email: email,
                    phoneNumber: phoneNumber || null,
                    pfpUrl: pfpUrl ?? await getDownloadURL(ref(getStorage(), 'images/pfps/default/defaultpfp.jpg')),
                    emailVertified: false,
                    createdAt: serverTimestamp(),
                    timesItemLost: 0,
                    timesOwnItemFound: 0,
                    timesOthersItemFound: 0,
                    timesFoundOthersItem: 0,
                    blockedList: [],
                    friendsList: [],
                    privateStats: false,
                };

                await updateProfile(userCredential.user, {
                    displayName: name,
                    photoURL: pfpUrl || null,
                });

//                await updatePhoneNumber()

                transaction.set(doc(db, 'users', userCredential.user.uid), userDataToUpload);
            });
            
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [
                        { name: 'My Drawer', params: {
                            screen: 'Bottom Tabs',
                        } 
                    }],
                })
            );

        } catch (error) {
            if (error as AuthError) {
                navigation.goBack();
                switch ((error as AuthError).code) {
                    case AuthErrorCodes.EMAIL_EXISTS:
                        setErrorText('Email is already in use.');
                        break;
                    case AuthErrorCodes.INVALID_EMAIL:
                        setErrorText('Invalid email.');
                        break;
                    default:
                        setErrorText((error as AuthError).code + ' ' + (error as AuthError).message);
                }
            } else {
                navigateToErrorScreen(navigation, error);
            }
        } finally {
            setRegistering(false);
        }
    }

    
    const [hasGalleryPermission, setHasGalleryPermission] = useState<PermissionStatus>(RESULTS.UNAVAILABLE);
    const [hasCameraPermission, setHasCameraPermission] = useState<PermissionStatus>(RESULTS.UNAVAILABLE);
    
    useEffect(() => {
        check(Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA).then((result) => {
            setHasCameraPermission(result);
            console.log(result)
        });
        check(Platform.OS === 'ios' ? PERMISSIONS.IOS.PHOTO_LIBRARY : PERMISSIONS.ANDROID.READ_MEDIA_IMAGES).then((result) => {
            setHasGalleryPermission(result);
            console.log(result)
        });
    },[]);

    const openImagePicker = () => {
        if (!hasGalleryPermission) {
            request(Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA).then((result) => {
                setHasGalleryPermission(result);
                console.log(result)
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
                setPfpUri(response.assets![0].uri!);
            }
        }).catch((error) => { 
            navigateToErrorScreen(navigation, error);
        });
    };

    const handleCameraLaunch = () => {
        if (!hasCameraPermission) {
            request(Platform.OS === 'ios' ? PERMISSIONS.IOS.PHOTO_LIBRARY : PERMISSIONS.ANDROID.READ_MEDIA_IMAGES).then((result) => {
                setHasCameraPermission(result);
                console.log(result)
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
                console.log('User cancelled camera');
            } else if (response.errorCode) {
                console.log('Camera Error: ', response.errorMessage);
            } else {
                setPfpUri(response.assets![0].uri!);
            }
        });
    }
    
    const uploadImage = (imageId: string) => {
        return new Promise(async (resolve, reject) => {
            try {
                console.log('fetching image now, ' + pfpUri);

                const blob = await (await fetch(pfpUri)).blob();
                console.log('uploading images bytes...');
                
                const storage = getStorage();
                const imageRef = ref(storage, 'images/pfps/' + imageId);

                await uploadBytes(imageRef, blob)
                const url = await getDownloadURL(imageRef!);
                
                console.log(url);
                resolve(url);
                return;
            } catch (err) {
                reject(err);
                return;
            }
        });

    }

    const isDarkMode = useColorScheme() === 'dark';
    const colors = isDarkMode ? DarkThemeColors : LightThemeColors;
    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.background,
        },
        subTitle: {
            fontSize: 23,
            textAlign: 'center',
            fontWeight: '600',
            color: colors.text,
            marginVertical: 20,
            marginTop: '-30%',
        },
        text: {
            fontSize: 16,
            color: colors.text,
        },
        textInput: {
            textDecorationStyle: 'dotted',
            fontWeight: 600,
            fontSize: 20,
            width: '80%', 
            overflow: 'hidden',
            borderBottomWidth: 2,
            borderColor: colors.border,
            color: colors.text,
            borderRadius: 1,
            padding: 6,
            margin: 10,
        },
        errorText: {
            color: "red",
        },
        pfpContainer: {
            alignSelf: 'flex-start',
            alignItems: 'center',
            marginRight: 4,
        },
        horizontalContainer: {
            justifyContent: 'space-between',
            alignSelf: 'stretch',
            alignItems: 'center',
            flexDirection: 'row',
        },
        registerButton: {
            width: 370,
        },
        registerButtonText: {
            textAlign: 'center',
            color: colors.primaryContrastText,
            fontSize: 16,
            fontWeight: 'bold',
        },
        uploadButton: {
            borderRadius: 10,
            width: 50,
            height: 50,
//            marginRight: 4,
            alignItems: 'center',
            justifyContent: 'center', 
            backgroundColor: colors.secondary,
        },
        cameraButton: {
            borderRadius: 10,
            width: 50,
            height: 50,
            marginRight: 4,
            alignItems: 'center',
            justifyContent: 'center', 
            backgroundColor: colors.secondary,
        },
        pfpImage: {
            width: 128,
            height: 128,
            alignSelf: 'center',
            borderRadius: 32,
            margin: 4,
        }
    }), [isDarkMode]);

    return (
        <SafeAreaView style={{backgroundColor: colors.background, flex: 1, padding: 3}}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.subTitle}>Register</Text>
                <View style={{flexDirection: 'row', width: '80%', alignSelf: 'center', alignItems: 'center'}}>
                    <View style={styles.pfpContainer}>
                        <Image
                            style={styles.pfpImage}
                            source={uriFrom(pfpUri)}
                            defaultSource={require('../assets/images/defaultpfp.jpg')}
                        />
                        <ImagePicker
                            onResponse={(response) => setPfpUri(response.assets![0].uri!)} />
                    </View>
                    <View style={{flex: 1, alignItems: 'stretch'}}>
                        <CoolTextInput
                            label='Name'
                            placeholder='Enter your name'
                            value={name}
                            editable={!registering}
                            containerStyle={{}}
                            onChangeText={(text: string) => setName(text)} 
                            required />
                        <CoolTextInput
                            label='Phone Number (optional)'
                            leftIcon={{
                                name: 'phone',
                                type: 'material-community'
                            }}
                            containerStyle={{}}
                            placeholder='Enter your phone number'
                            value={phoneNumber}
                            editable={!registering}
                            onChangeText={(text: string) => setPhoneNumber(text)} 
                            />
                        <CoolTextInput
                            label='Address (optional)'
                            containerStyle={{}}
                            placeholder='Address you want your stuff returned to'
                            value={address}
                            editable={!registering}
                            onChangeText={(text: string) => setAddress(text)} 
                            />
                    </View>
                </View>
                {/*
                <PhoneInput
                    ref={phoneInput}
                    placeholder='Enter your phone number'
                    defaultCode='US'
                    value={phoneNumber}
                    layout='first'
                    onChangeText={(text) => {
                        setPhoneNumber(text);
                    }}
                    onChangeFormattedText={(text) => {
                        setFormattedPhoneNumber(text);
                    }}
                    withDarkTheme
                    withShadow 
                    containerStyle={{marginBottom: 20}}
                />
                */}
                
                <CoolTextInput
                    label='Email'
                    leftIcon={{
                        name: 'email',
                        type: 'material-community'
                    }}
                    containerStyle={{width: '80%'}}
                    placeholder='Enter your email'
                    value={email}
                    editable={!registering}
                    onChangeText={(text: string) => setEmail(text)} 
                    required
                    />
                <CoolTextInput
                    label='Password'
                    leftIcon={{
                        name: 'lock',
                        type: 'material-community'
                    }}
                    placeholder='Enter your password'
                    containerStyle={{width: '80%'}}
                    value={password} 
                    onChangeText={(text: string) => setPassword(text)}
                    editable={!registering}
                    secureTextEntry 
                    required/>
                <CoolTextInput
                    label='Confirm Password'
                    leftIcon={{
                        name: 'lock',
                        type: 'material-community'
                    }}
                    placeholder='Type password again'
                    containerStyle={{width: '80%'}}
                    value={confirmPassword} 
                    onChangeText={(text: string) => setConfirmPassword(text)}
                    editable={!registering}
                    secureTextEntry 
                    required/>
                <Text style={[styles.text, {alignSelf: 'flex-end', fontSize: 12, color: colors.red}]}>*Required</Text>
                <Text style={styles.errorText}>{errorText}</Text>
                <CoolButton
                    title='Register'
                    style={styles.registerButton} 
                    disabled={name == '' || email == '' || password.length < 5 || password != confirmPassword || registering} 
                    onPress={register} />
            </ScrollView>
        </SafeAreaView>
    )
}

export default RegisterScreen;