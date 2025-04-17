import React, { ErrorInfo, useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Image, Text, StatusBar, TextInput } from 'react-native';
import { auth, db } from '../../my_firebase';
import { AuthError, AuthErrorCodes, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@firebase/storage';
import { launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker';
import { NavigationProp } from '@react-navigation/native';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import { lightThemeColors } from '../assets/Colors';
import PressableOpacity from '../assets/MyElements';
import { Icon, Input } from 'react-native-elements';

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
            
            let pfpUrl;
            try {
                if (pfpSrc.uri != "") pfpUrl = await uploadImage(userCredential.user.uid) as string;
            } catch (error) {
                pfpUrl = undefined;
            }
            
            const userData = {
                name: name,
                email: email,
                pfpUrl: pfpUrl || await getDownloadURL(ref(getStorage(), "images/pfps/default/defaultpfp.jpg")),
                emailVertified: false,
                createdAt: serverTimestamp(),
                timesOwnItemLost: 0,
                timesOwnItemFound: 0,
                timesOthersItemFound: 0,
                blockedList: [],
                friendsList: [],
                privateStats: false,
            };
            
            updateProfile(userCredential.user, {
                displayName: name,
                photoURL: pfpUrl || null,
            });
            await setDoc(doc(db, "users", userCredential.user.uid), userData);

            navigation.navigate("Bottom Tabs", { screen: "Home" });
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
            try {
                console.log("fetching image now, " + pfpSrc.uri);

                const blob = await (await fetch(pfpSrc.uri)).blob();
                console.log("uploading images bytes...");
                    
                const storage = getStorage();
                const imageRef = ref(storage, "images/pfps/" + imageId);

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
                            <Icon name="camera-alt" type="material-icons" size={20} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={openImagePicker} style={styles.uploadButton}>
                            <Icon name="photo-library" type="material-icons" size={20} />
                        </TouchableOpacity>
                        <Text style={{fontSize: 16}}>Set photo</Text>
                    </View>
                </View>
                <View style={{flexGrow: 1}}>
                    <Input
                        label="Name"
                        style={styles.textInput} 
                        placeholder='Enter your name'
                        value={name}
                        editable={!registering}
                        onChangeText={text => setName(text)} />
                    <Input
                        label="Email"
                        leftIcon={{
                            name: "email",
                            type: "material-community"
                        }}
                        style={styles.textInput} 
                        placeholder='Enter your email'
                        value={email}
                        editable={!registering}
                        onChangeText={text => setEmail(text)} />
                    
                    <Input
                        label="Password"
                        leftIcon={{
                            name: "lock",
                            type: "material-community"
                        }}
                        style={styles.textInput} 
                        placeholder='Enter your password'
                        value={password} onChangeText={text => setPassword(text)}
                        editable={!registering}
                        secureTextEntry />
                </View>
            </View>
            <Text style={styles.errorText}>{errorText}</Text>
            <PressableOpacity style={styles.registerButton} disabled={name == "" || email == "" || password.length < 6 || registering} onPress={register} >
                <Text style={styles.registerButtonText}>Register</Text>
            </PressableOpacity>
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
        fontSize: 23,
        textAlign: "center",
        fontWeight: "600",
        color: lightThemeColors.textLight,
        marginVertical: 20,
    },
    text: {
        fontSize: 16,
        color: lightThemeColors.textLight,
    },
    textInput: {/*
        textDecorationStyle: "dotted",
        fontWeight: 600,
        fontSize: 20,
        width: "80%", 
        overflow: "hidden",
        borderBottomWidth: 2,
        borderColor: lightThemeColors.dullGrey,
        borderRadius: 1,
        padding: 6,
        margin: 10,*/
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
        padding: 10,
        backgroundColor: lightThemeColors.primary,
        borderRadius: 7,
        alignItems: "center",
    },
    registerButtonText: {
        textAlign: "center",
        color: lightThemeColors.textDark,
        fontSize: 16,
        fontWeight: "bold",
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