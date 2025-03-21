import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native'
import { Input, Button } from 'react-native-elements';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@firebase/storage';
import { launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker';
import { useFocusEffect } from '@react-navigation/native';

export function RegisterScreen({navigation, route}: {navigation: any, route: any}) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [pfpSrc, setPfpSrc] = useState({uri:""});
    const [registering, setRegistering] = useState(false);

    const transferFilledInfo = useCallback(() => {
        setEmail(route.params!.email);
        setPassword(route.params!.password);
    }, [route])

    useFocusEffect(() => {
        transferFilledInfo();
    });

    const register = () => {
        setRegistering(true);
        navigation.navigate("Loading");

        createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            // Registered
            const user = userCredential.user;
            
            const userData = {
                name: name,
                email: email,
                pfpUrl: user.photoURL,
                emailVertified: false,
                online: false,
            };

            console.log("registered user!" + userData.toString());
            return setDoc(doc(db, "users", user.uid), userData);
            
/*
            uploadImage(user.uid).then((pfpUrl) => {
                console.log("uploaded image!");
                return updateProfile(user, {
                    displayName: name,
                    photoURL: pfpUrl ? pfpUrl : require("../assets/defaultpfp.jpg"),
                })
            }).then(() => {
                const userData = {
                    name: name,
                    email: email,
                    pfpUrl: user.photoURL,
                    emailVertified: false,
                    online: false,
                };
                
                setDoc(doc(db, "users", user.uid), userData).then(() => {
                    console.log("hoagie");
                    navigation.navigate("Home Tab", {screen: "Home"});
                });
            }).catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                navigation.navigate("Error", {code: errorCode, message: errorMessage});
            });*/
            
        }).then(() => {
            console.log("hoagie");
            navigation.navigate("Home Tab", {screen: "Home"});
        }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            navigation.navigate("Error", {code: errorCode, message: errorMessage});
        }).finally(() => {
            setRegistering(false);
        });
        
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
        }).catch(() => {console.log("whoop de doo")});
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
            let source = {uri: response.assets![0].uri!};
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
                
                uploadBytes(imageRef, blob).then((snapshot) => {
                    console.log("getting download url...");
                    getDownloadURL(imageRef!).then((url) => {
                        return resolve(url);
                    }).catch((error) => {
                        console.warn(error);
                    });
                }).catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    navigation.navigate("Error", {code: errorCode, message: errorMessage});
                });
            }).catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.warn(error);
                navigation.navigate("Error", {code: errorCode, message: errorMessage});
            });
        });
        
    }

    return (
        <View style={styles.container}>
            {pfpSrc.uri == "" ? (
                <Image 
                    style={styles.pfpImage}
                    source={require("../assets/defaultpfp.jpg")}
                />
            ) : (
                <Image 
                    style={styles.pfpImage}
                    source={pfpSrc}
                />
            )}
            
            <Button title='Take picture with camera' onPress={handleCameraLaunch} style={styles.button} />
            <Button title='Upload from library' onPress={openImagePicker} style={styles.button} />
            <Input
                placeholder='Enter your name'
                label='Name'
                value={name}
                onChangeText={text => setName(text)}
            />
            <Input
                placeholder='Enter your email'
                label='Email'
                value={email}
                onChangeText={text => setEmail(text)}
            />
            <Input
                placeholder='Enter your password'
                label='Password'
                value={password} onChangeText={text => setPassword(text)}
                secureTextEntry
            />
            
            <Button title='Register' disabled={name == "" || email == "" || password.length < 6 || registering} onPress={register} style={styles.button} />
        </View>
    )
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
    },
    button: {
        width: 370,
        marginTop: 10
    },
    pfpImage: {
        width: 256,
        height: 256,

    }
});

export default RegisterScreen;