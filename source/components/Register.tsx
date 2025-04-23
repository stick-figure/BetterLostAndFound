import React, { ErrorInfo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Image, Text, StatusBar, TextInput, useColorScheme } from 'react-native';
import { auth, db } from '../../ModularFirebase';
import { AuthError, AuthErrorCodes, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { addDoc, collection, doc, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@firebase/storage';
import { launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker';
import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import PressableOpacity from '../assets/MyElements';
import { colors, Icon, Input } from 'react-native-elements';
import SafeAreaView from 'react-native-safe-area-view';
import PhoneInput from 'react-native-phone-number-input';

export function RegisterScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [formattedPhoneNumber, setFormattedPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [errorText, setErrorText] = useState('');

    const [pfpSrc, setPfpSrc] = useState({ uri: '' });
    const [registering, setRegistering] = useState(false);

    const phoneInput = useRef<PhoneInput>(null);
    
    const transferFilledInfo = useCallback(() => {
        setEmail(route.params!.email);
        setPassword(route.params!.password);
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
                    if (pfpSrc.uri != '') pfpUrl = await uploadImage(userCredential.user.uid) as string;
                } catch (error) {
                    pfpUrl = undefined;
                }
                
                const userData = {
                    name: name,
                    email: email,
                    phoneNumber: phoneNumber,
                    pfpUrl: pfpUrl ?? await getDownloadURL(ref(getStorage(), 'images/pfps/default/defaultpfp.jpg')),
                    emailVertified: false,
                    createdAt: serverTimestamp(),
                    timesOwnItemLost: 0,
                    timesOwnItemFound: 0,
                    timesOthersItemFound: 0,
                    blockedList: [],
                    friendsList: [],
                    privateStats: false,
                };

                await updateProfile(userCredential.user, {
                    displayName: name,
                    photoURL: pfpUrl || null,
                });

                transaction.set(doc(db, 'users', userCredential.user.uid), userData);
            });
            
            navigation.navigate('My Drawer', { screen: 'Bottom Tabs' });
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
                console.warn(error);
            }
        } finally {
            setRegistering(false);
        }
    }

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
                const source = { uri: response.assets[0].uri! };
                setPfpSrc(source);
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
                console.log('User cancelled camera');
            } else if (response.errorCode) {
                console.log('Camera Error: ', response.errorMessage);
            } else {
                let source = { uri: response.assets![0].uri! };
                setPfpSrc(source);
            }
        });
    }

    const uploadImage = (imageId: string) => {
        return new Promise(async (resolve, reject) => {
            try {
                console.log('fetching image now, ' + pfpSrc.uri);

                const blob = await (await fetch(pfpSrc.uri)).blob();
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
            paddingTop: 100,
            backgroundColor: colors.background,
        },
        subTitle: {
            fontSize: 23,
            textAlign: 'center',
            fontWeight: '600',
            color: colors.text,
            marginVertical: 20,
        },
        text: {
            fontSize: 16,
            color: colors.text,
        },
        textInput: {/*
            textDecorationStyle: 'dotted',
            fontWeight: 600,
            fontSize: 20,
            width: '80%', 
            overflow: 'hidden',
            borderBottomWidth: 2,
            borderColor: colors.border,
            borderRadius: 1,
            padding: 6,
            margin: 10,*/
        },
        errorText: {
            color: "red",
        },
        pfpContainer: {
            alignSelf: 'flex-start',
        },
        horizontalContainer: {
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexDirection: 'row',
            padding: 10,
        },
        registerButton: {
            width: 370,
            marginBottom: 200, 
            padding: 10,
            backgroundColor: colors.primary,
            borderRadius: 7,
            alignItems: 'center',
        },
        registerButtonText: {
            textAlign: 'center',
            color: colors.primaryContrastText,
            fontSize: 16,
            fontWeight: 'bold',
        },
        uploadButton: {
            borderRadius: 5,
            width: 25,
            height: 25,
            marginRight: 4,
            alignItems: 'center',
            justifyContent: 'center', 
            backgroundColor: colors.secondary,
        },
        cameraButton: {
            borderRadius: 5,
            width: 25,
            height: 25,
            marginRight: 4,
            alignItems: 'center',
            justifyContent: 'center', 
            backgroundColor: colors.secondary,
        },
        pfpImage: {
            width: 128,
            height: 128,
            alignSelf: 'center',
        }
    }), [isDarkMode]);

    return (
        <SafeAreaView style={{flex: 1, padding: 3}}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.subTitle}>Register</Text>
                <View style={{flexDirection: 'row', width: '100%'}}>
                    <View style={styles.pfpContainer}>
                        <Image
                            style={styles.pfpImage}
                            source={pfpSrc.uri != '' ? pfpSrc : require('../assets/defaultpfp.jpg')}
                        />

                        <View style={styles.horizontalContainer}>
                            <TouchableOpacity onPress={handleCameraLaunch} style={styles.cameraButton}>
                                <Icon name='camera-alt' type='material-icons' size={20} color={colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={openImagePicker} style={styles.uploadButton}>
                                <Icon name='photo-library' type='material-icons' size={20} color={colors.text} />
                            </TouchableOpacity>
                            <Text style={{fontSize: 16}}>Set photo*</Text>
                        </View>
                    </View>
                    <View style={{flexGrow: 1}}>
                        <Input
                            label='Name*'
                            style={styles.textInput} 
                            placeholder='Enter your name'
                            value={name}
                            editable={!registering}
                            labelStyle={{color: colors.text,}}
                            onChangeText={text => setName(text)} />
                    </View>
                </View>
                
                <View style={{alignSelf: 'flex-start', margin: 10}}>
                    <Text style={[styles.text, {fontWeight: 'bold', fontSize: 16,}]}>Phone Number (optional)</Text>
                </View>
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
                
                <Input
                    label='Email*'
                    leftIcon={{
                        name: 'email',
                        type: 'material-community'
                    }}
                    style={styles.textInput} 
                    placeholder='Enter your email'
                    value={email}
                    editable={!registering}
                    labelStyle={{color: colors.text,}}
                    onChangeText={text => setEmail(text)} />
                <Input
                    label='Password*'
                    leftIcon={{
                        name: 'lock',
                        type: 'material-community'
                    }}
                    style={styles.textInput} 
                    placeholder='Enter your password'
                    labelStyle={{color: colors.text,}}
                    value={password} onChangeText={text => setPassword(text)}
                    editable={!registering}
                    secureTextEntry />
                <Text style={[styles.text, {alignSelf: 'flex-end', fontSize: 12, color: colors.red}]}>*Required</Text>
                <Text style={styles.errorText}>{errorText}</Text>
                <PressableOpacity style={styles.registerButton} disabled={name == '' || email == '' || password.length < 5 || (phoneNumber != '' && !phoneInput.current?.isValidNumber(phoneNumber)) || registering} onPress={register} >
                    <Text style={styles.registerButtonText}>Register</Text>
                </PressableOpacity>
            </ScrollView>
        </SafeAreaView>
    )
}

export default RegisterScreen;