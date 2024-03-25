import { useIsFocused } from "@react-navigation/native";
import { useRef, useCallback } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { Camera, CameraRuntimeError, useCameraDevice, CodeScanner, Point } from "react-native-vision-camera";

export function ScanCodeView({ navigation }: { navigation: any }) {
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
        onCodeScanned: (codes) => {
            console.log(`Scanned ${codes[0].value} codes!`);
            navigation.navigate("InputtedCode", { code: codes[0].value });
        }
    }

    const focus = useCallback((point: Point) => {
        const c = camera.current
        if (c == null) return
        c.focus(point)
    }, [])

    const gesture = Gesture.Tap()
    .onEnd(({ x, y }) => {
        runOnJS(focus)({ x, y })
    })

    if (device == null || cameraPermission != "granted") {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text>Camera permission denied</Text>
                <Button title="Request Camera Permission" />
            </View>);
    }
    return (
        
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <GestureDetector gesture={gesture}>
                <Camera
                    enableZoomGesture={true}
                    style={StyleSheet.absoluteFill}
                    ref={camera}
                    device={device}
                    isActive={isActive}
                    onInitialized={onCameraInitialized}
                    codeScanner={codeScanner}
                />
            </GestureDetector>
        </View>
    )
}

export default ScanCodeView;