import React, { ErrorInfo, useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Image, Text, StatusBar } from 'react-native'
import { Input, Button } from 'react-native-elements';
import { auth, db } from '../../firebase';
import { AuthError, AuthErrorCodes, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@firebase/storage';
import { launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker';
import { NavigationProp } from '@react-navigation/native';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import  Icon  from 'react-native-vector-icons/FontAwesome';
import { lightThemeColors } from '../assets/Colors';
import { red } from 'react-native-reanimated/lib/typescript/Colors';

export function RegisterScreen({ navigation, route }: { navigation: any, route: any }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorText, setErrorText] = useState("");

    const [pfpSrc, setPfpSrc] = useState({ uri: "" });
    const [registering, setRegistering] = useState(false);
    
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
            navigation.navigate("Loading");

            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        
            const user = userCredential.user;
            
            const pfpUrl = await uploadImage(user.uid);
            
            await updateProfile(user, {
                displayName: name,
                photoURL: pfpUrl ? pfpUrl : require("../assets/defaultpfp.jpg"),
            });
            
            const userData = {
                name: name,
                email: email,
                pfpUrl: pfpUrl || user.photoURL,
                emailVertified: false,
                createdAt: serverTimestamp(),
            };

            await setDoc(doc(db, "users", user.uid), userData);

            navigation.navigate("Home Tab", { screen: "Home" });
        } catch (error) {
            if (error as AuthError) {
                navigation.goBack();
                switch ((error as AuthError).code) {
                    case AuthErrorCodes.EMAIL_EXISTS:
                        setErrorText("Email is already in use.");
                        break;
                    case AuthErrorCodes.INVALID_EMAIL:
                        setErrorText("Invalid email.");
                        break;
                    default:
                        setErrorText((error as AuthError).code + " " + (error as AuthError).message);
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
            mediaType: "photo" as MediaType,
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
        }).catch(() => { console.log("whoop de doo") });
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
            console.log("uploading image now, " + pfpSrc.uri);

            fetch(pfpSrc.uri).then((response) => {
                console.log("getting blob of image uri" + pfpSrc.uri);
                return response.blob();
            }).then((blob) => {
                console.log("uploading images bytes...");
                
                const storage = getStorage();
                const imageRef = ref(storage, "images/pfps/" + imageId);

                uploadBytes(imageRef, blob).then(() => {
                    return getDownloadURL(imageRef!);
                }).then((url) => {
                    console.log(url);
                    return resolve(url);
                });
            }).catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                navigation.navigate("Error", { code: errorCode, message: errorMessage });
                return reject(error);
            });
        });

    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.subTitle}>Register</Text>
            <View style={{flexDirection: "row", width: "100%"}}>
                <View style={styles.pfpContainer}>
                    <Image
                        style={styles.pfpImage}
                        source={pfpSrc.uri != "" ? pfpSrc : require("../assets/defaultpfp.jpg")}
                    />

                    <View style={styles.horizontalContainer}>
                        <TouchableOpacity onPress={handleCameraLaunch} style={styles.cameraButton}>
                            <Icon name="camera" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={openImagePicker} style={styles.uploadButton}>
                            <Icon name="photo" />
                        </TouchableOpacity>
                        <Text style={styles.text}>Set photo</Text>
                    </View>
                </View>
                <View style={{flexGrow: 1}}>
                    <Input
                        placeholder='Enter your name'
                        label='Name'
                        value={name}
                        onChangeText={text => setName(text)} />
                    <Input
                        placeholder='Enter your email'
                        label='Email'
                        leftIcon={{ type: 'MaterialIcons', name: 'email' }}
                        value={email}
                        onChangeText={text => setEmail(text)} />
                    <Input
                        placeholder='Enter your password'
                        label='Password'
                        leftIcon={{ type: 'MaterialIcons', name: 'lock' }}
                        value={password} onChangeText={text => setPassword(text)}
                        secureTextEntry />
                </View>
            </View>
            <Text style={styles.errorText}>{errorText}</Text>
            <Button title='Register' disabled={name == "" || email == "" || password.length < 6 || registering} onPress={register} style={styles.registerButton} />
        </ScrollView>
    )
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 100,
    },
    subTitle: {
        fontSize: 20,
        textAlign: "center",
        fontWeight: "600",
        color: lightThemeColors.textLight,
        marginVertical: 20,
    },
    text: {
        fontSize: 16,
        color: lightThemeColors.textLight,
    },
    errorText: {
        color: "red",
    },
    pfpContainer: {
        alignSelf: "flex-start",
        
    },
    horizontalContainer: {
        justifyContent: "flex-start",
        alignItems: "center",
        flexDirection: "row",
        padding: 10,
    },
    registerButton: {
        width: 370,
        marginBottom: 200, 
    },
    uploadButton: {
        borderRadius: 5,
        width: 25,
        height: 25,
        marginRight: 4,
        alignItems: "center",
        justifyContent: 'center', 
        backgroundColor: lightThemeColors.secondary,
    },
    cameraButton: {
        borderRadius: 5,
        width: 25,
        height: 25,
        marginRight: 4,
        alignItems: "center",
        justifyContent: 'center', 
        backgroundColor: lightThemeColors.secondary,
    },
    pfpImage: {
        width: 128,
        height: 128,
        alignSelf: "center",
    }
});

export default RegisterScreen;