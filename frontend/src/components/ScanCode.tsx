import { CommonActions, useIsFocused } from '@react-navigation/native';
import firebase from 'firebase/compat/app';
import { collection, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useRef, useCallback, useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { runOnJS } from 'react-native-reanimated';
import { Camera, CameraRuntimeError, useCameraDevice, CodeScanner, Point, Code } from 'react-native-vision-camera';
import { auth, db } from '../../MyFirebase';

export function ScanCodeScreen({ navigation }: { navigation: any }) {
    const camera = useRef<Camera>(null);

    const onError = useCallback((error: CameraRuntimeError) => {
        console.error(error);
    }, [camera])

    const cameraPermission = Camera.getCameraPermissionStatus();
    
    const device = useCameraDevice('back');

    const isActive = useIsFocused();

    const onCameraInitialized = useCallback(() => console.log('camera initialized'), []);
    const codeScanner: CodeScanner = {
        codeTypes: ['qr', 'ean-13'],
        onCodeScanned: (codes: Code[]) => {
            codes.forEach((code) => {
                const itemsRef = collection(db, 'items');

                if (code.value?.startsWith('BLF')) {
                    (async () => {
                        const itemDocs = await getDocs(query(itemsRef, where('code', '==', code.value?.replace('BLF', ''))));
                        console.log(`Scanned ${code.value} code!`);
                        if (itemDocs.empty) {
                            return
                        }
                        
                        navigation.navigate('Item Info', { itemId: itemDocs.docs[0].id });
                    })();
                }
            });
        }
    }

    if (device == null || cameraPermission != 'granted') {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text>Camera permission denied</Text>
                <Button title='Request Camera Permission' />
            </View>);
    }

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
    
    return (

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Camera
                enableZoomGesture={true}
                style={StyleSheet.absoluteFill}
                ref={camera}
                device={device}
                isActive={isActive}
                onInitialized={onCameraInitialized}
                codeScanner={codeScanner}
            />

        </View>
    )
}

export default ScanCodeScreen;
