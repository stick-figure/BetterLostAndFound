import { FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Animated, StyleSheet, Text, TextInput, View, useColorScheme, TouchableOpacity, Platform, PressableProps, ViewProps, StyleProp, ViewStyle, PressableStateCallbackType, TextStyle, TextInputProps, GestureResponderEvent, ViewComponent } from 'react-native';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import { Icon } from 'react-native-elements';
import { check, checkMultiple, Permission, PERMISSIONS, PermissionStatus, request, requestMultiple, RESULTS } from 'react-native-permissions';
import { MediaType, launchImageLibrary, launchCamera, ImagePickerResponse, CameraOptions, ImageLibraryOptions } from 'react-native-image-picker';
import { IconButtonProps } from 'react-native-vector-icons/Icon';
import { navigateToErrorScreen } from '../components/Error';

export const PressableOpacity = ({ children, ...props }) => {
    const animated = useRef(new Animated.Value(1)).current;
    
    const fadeIn = () => {
        Animated.timing(animated, {
            toValue: props.activeOpacity || 0.1,
            duration: 100,
            useNativeDriver: true,
        }).start();
    };
    
    const fadeOut = () => {
        Animated.timing(animated, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };
        
    return (
        <Animated.View style={[props.disabled ? (props.disabledStyle || {opacity: 0.6}) : { opacity: animated }]}>
            <Pressable onPressIn={fadeIn} onPressOut={fadeOut} {...props}>
                {children}
            </Pressable>
        </Animated.View>
    );
};

export const RequiredLabel = ({ children, ...props }) => {
    const isDarkMode = useColorScheme() === 'dark';
    const colors = isDarkMode ? DarkThemeColors : LightThemeColors;
    return (
        <Text {...props}>
            {children}{<Text style={[props.style, {color: colors.red}]}>*</Text>}
        </Text>
    );
}

export const MyInput = ({ ...props }) => {
    const isDarkMode = useColorScheme() === 'dark';
    const colors = isDarkMode ? DarkThemeColors : LightThemeColors;
    const styles = useMemo(() => StyleSheet.create({
        label: {
            fontSize: 14,
            color: colors.border,
            alignSelf: 'flex-start',
        },
        textInput: {
            fontWeight: 600,
            fontSize: 18,
            overflow: 'hidden',
            color: colors.text,
            borderRadius: 1,
            padding: 8,
            margin: 4,
            alignSelf: 'stretch',
        },
        textInputContainer: {
            width: '90%', 
            padding: 4,
        }
    }), [isDarkMode]);

    return (
        <View style={[styles.textInputContainer, props.textInputContainerStyle]}>
            { 
                props.required ? (
                    <RequiredLabel style={[styles.label, props.labelStyle]}>{props.label}</RequiredLabel>
            )   :
                    <Text style={[styles.label, props.labelStyle]}>{props.label}</Text>
            }
            <View style={{borderColor: colors.border, borderBottomWidth: 2, flexDirection: 'row'}}>
                {props.leftIcon !== undefined ? 
                    <Icon containerStyle={{alignSelf: 'center', justifyContent: 'center', paddingLeft: 8,
                        marginLeft: 4,}} name={props.leftIcon.name} type={props.leftIcon.type || 'material-community'} color={props.leftIcon.color || styles.label.color} size={props.leftIcon.color || styles.textInput.fontSize} /> 
                : null}
                <TextInput
                    style={styles.textInput}
                    {...props}>
                </TextInput>
            </View>
        </View>
    );
}

interface CoolTextInputProps extends TextInputProps {
    label?: string,
    labelStyle?:  TextStyle;
    containerStyle?: ViewStyle;
    leftIcon?: IconButtonProps & {type: string};
    rightIcon?: IconButtonProps & {type: string};
    required?: boolean;
}

export const CoolTextInput: FC<CoolTextInputProps> = ({ ...props }) => {
    const isDarkMode = useColorScheme() === 'dark';
    const colors = isDarkMode ? DarkThemeColors : LightThemeColors;
    const styles = useMemo(() => StyleSheet.create({
        label: {
            fontSize: 16,
            fontWeight: '500',
            color: colors.text,
            alignSelf: 'flex-start',
        },
        textInput: {
//            flexGrow: 1,
            padding: 8,
            fontWeight: 600,
            fontSize: 18,
            overflow: 'hidden',
            borderTopWidth: 3,
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.text,
        },
        container: {
            marginVertical: 4,
        }
    }), [isDarkMode]);

    return (
        <View style={[styles.container, props.containerStyle]}>
            { 
                props.required ? 
                    <RequiredLabel style={[styles.label, props.labelStyle]}>{props.label}</RequiredLabel>
                :
                    <Text style={[styles.label, props.labelStyle]}>{props.label}</Text>
            }
            <TextInput
                {...props}
                style={[
                    styles.textInput, 
                    !props.editable ? {opacity: 0.7} : {}, 
                    props.style
                ]}>
            </TextInput>
        </View>
    );
}

interface CoolButtonProps extends PressableProps {
    title?: string;
    pressInHeight?: number;
    pressOutHeight?: number;
    useSecondaryColor?: boolean;
    containerStyle?: ViewStyle;
    style?: StyleProp<any>;
    capStyle?: ViewStyle;
    contentStyle?: ViewStyle;
    titleStyle?: TextStyle;
    leftIcon?: IconButtonProps & {type?: string};
    rightIcon?: IconButtonProps & {type?: string};
    borderRadius?: number;
}

export const CoolButton: FC<CoolButtonProps> = ({ ...props }) => {
    const [pressedIn, setPressedIn] = useState(false);

    const isDarkMode = useColorScheme() === 'dark';
    const colors = isDarkMode ? DarkThemeColors : LightThemeColors;

    const pressInHeight = 2;
    const pressOutHeight = 5;
    
    const styles = useMemo(() => StyleSheet.create({
        button: {
            backgroundColor: colors.border,
            overflow: 'hidden',
            borderRadius: props.borderRadius || 10,
        },
        pressedInCap: {
            marginBottom: Math.abs(props.pressInHeight || pressInHeight),
        },
        pressedOutCap: {
            marginBottom: Math.abs(props.pressOutHeight || pressOutHeight),
        },
        pressedInButton: {
            marginTop: (props.pressOutHeight || pressOutHeight) - (props.pressInHeight || pressInHeight),
        },
        pressedOutButton: {
            marginTop: 0,
        },
        container: {

        },
        title: {
            textAlign: 'center',
            color: props.useSecondaryColor ? colors.secondaryContrastText : colors.primaryContrastText,
            fontSize: 16,
            fontWeight: 'bold',
            justifyContent: 'space-between',
            alignSelf: 'center',
        },
        cap: {
            backgroundColor: props.useSecondaryColor ? colors.secondary : colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: props.borderRadius || 10,
            padding: 10,
            alignSelf: 'stretch',
        },
        content: {
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: 'row',
        },
    }), [isDarkMode]);

    return (
        <View style={[styles.container, props.containerStyle]}>
            <Pressable
                {...props}
                style={[
                    styles.button, 
                    pressedIn ? styles.pressedInButton : styles.pressedOutButton, 
                    props.style
                ]}
                onPressIn={() => setPressedIn(true)}
                onPressOut={() => setPressedIn(false)}>
                <View 
                    style={[
                        styles.cap, 
                        props.disabled ? {opacity: 0.4} : {opacity: 1},
                        pressedIn ? styles.pressedInCap : styles.pressedOutCap, 
                        props.capStyle,
                    ]}>
                    <View 
                        style={[
                            styles.content,
                            props.contentStyle,
                        ]}>
                        {props.leftIcon ? 
                            <Icon type='material-community' size={styles.title.fontSize} color={styles.title.color} {...props.leftIcon} />
                        : null}
                        <Text style={[styles.title, props.titleStyle]}>{props.title}</Text>
                        {props.rightIcon ? 
                            <Icon type='material-community' size={styles.title.fontSize} color={styles.title.color} {...props.rightIcon} />
                        : null}
                    </View>
                    
                </View>
            </Pressable>
        </View>
    );
}

interface ImagePickerProps {
    cameraOptions?: CameraOptions;
    imageLibraryOptions?: ImageLibraryOptions;
    launchCamera?: ((event: GestureResponderEvent) => void) | null | undefined;
    launchImageLibrary?: ((event: GestureResponderEvent) => void) | null | undefined;
    launchCustomSearch?: ((event: GestureResponderEvent) => void) | null | undefined;
    onResponse: (response: ImagePickerResponse) => any;
    onError?:(response: any) => any;
    onCancel?:(response: ImagePickerResponse) => any;
    label?: string,
    containerStyle?: ViewStyle;
    labelStyle?: TextStyle;
    iconStyle?: TextStyle | ViewStyle;
    cameraIconStyle?: TextStyle | ViewStyle;
    imageLibraryIconStyle?: TextStyle | ViewStyle;
    required?: boolean;
    useCamera?: boolean;
    useImageLibrary?: boolean;
    useCustomSearch?: boolean;
}

export const ImagePicker: FC<ImagePickerProps> = ({ ...props }) => {
    const [hasCameraPermission, setHasCameraPermission] = useState<PermissionStatus>();
    const [hasGalleryPermission, setHasGalleryPermission] = useState<PermissionStatus>();
    
    const cameraOptions = {
        mediaType: 'photo' as MediaType,
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
    };

    const imageLibraryOptions = {
        mediaType: 'photo' as MediaType,
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
        selectionLimit: 1,
    };

    const permissionTypes = {
        camera: Platform.OS === 'ios' ? PERMISSIONS.IOS.PHOTO_LIBRARY : PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
        imageLibrary: Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA,
    }

    useEffect(() => {
        checkMultiple(Object.values(permissionTypes)).then((checkResults) => {
            setHasCameraPermission(checkResults[permissionTypes.camera]);
            setHasGalleryPermission(checkResults[permissionTypes.imageLibrary]);
            if (Object.values(checkResults).find(result => result !== undefined && result != RESULTS.GRANTED)) {
                return;
            }
            requestMultiple(Object.keys(checkResults).filter(key => checkResults[key] !== undefined && checkResults[key] != RESULTS.GRANTED) as Permission[]).then((requestResults) => {
                setHasCameraPermission(requestResults[permissionTypes.camera]);
                setHasGalleryPermission(requestResults[permissionTypes.imageLibrary]);
                console.log(requestResults);
            });
        }).catch((error) => {
            console.warn(error);
        });
    }, []);

    const handleCameraLaunch = () => {
        if (hasCameraPermission != RESULTS.GRANTED) {
            request(permissionTypes.camera).then((result) => {
                setHasCameraPermission(result);
                console.log(result);
                if (result == RESULTS.GRANTED) myLaunchCamera();
            });
            return;    
        }
    }

    const myLaunchCamera = () => {
        launchCamera(props.cameraOptions || cameraOptions, (response) => {
            if (response.didCancel) {
                console.warn('User cancelled camera');
                if (props.onCancel) props.onCancel(response);
            } else if (response.errorCode) {
                console.warn('Camera error', response.errorCode, ':', response.errorMessage);
                if (props.onError) props.onError(response);
            } else if (response) {
                if (props.onResponse) props.onResponse(response);
            } else {
                throw new Error('No response');
            }
        }).catch((err) => { 
            console.warn(err);
            if (props.onError) props.onError(err);
        });;
    }

    const handleLaunchImageLibrary = () => {
        if (hasGalleryPermission != RESULTS.GRANTED) {
            request(permissionTypes.imageLibrary).then((result) => {
                setHasGalleryPermission(result);
                console.log(result);
                
                if (result == RESULTS.GRANTED) myLaunchImageLibrary();
            });
            return;    
        }
        myLaunchImageLibrary();
    };

    const myLaunchImageLibrary = () => {
        launchImageLibrary(props.imageLibraryOptions || imageLibraryOptions, (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
                if (props.onCancel) props.onCancel(response);
            } else if (response.errorCode) {
                console.warn('ImagePicker Error', response.errorCode, ':', response.errorMessage);
                if (props.onError) props.onError(response);
            } else if (response) {
                if (props.onResponse) props.onResponse(response);
            } else {
                throw new Error('No response');
            }
        }).catch((err) => { 
            console.warn(err);
            if (props.onError) props.onError(err);
        });
    }

    const handleLaunchCustomSearch = () => {

    }

    const launchCustomSearch = () => {

    }

    const isDarkMode = useColorScheme() === 'dark';
    const colors = isDarkMode ? DarkThemeColors : LightThemeColors;
    const styles = useMemo(() => StyleSheet.create({
        horizontal: {
            flexDirection: 'row',
        },
        label: {
            fontSize: 14,
            fontWeight: '500',
            color: colors.text,
            alignSelf: 'flex-start',
        },
        iconButton: {
            width: '100%',
        },
        textInput: {
            padding: 8,
            fontWeight: 600,
            fontSize: 18,
            overflow: 'hidden',
            borderTopWidth: 3,
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.text,
        },
        container: {
            margin: 4,
            alignSelf: 'stretch',
        }
    }), [isDarkMode]);

    return (
        <View style={[styles.container, props.containerStyle]}>
            {props.required ? 
                <RequiredLabel style={[styles.label, props.labelStyle]}>{props.label || 'Select image'}</RequiredLabel>
            :
                <Text style={[styles.label, props.labelStyle]}>{props.label || 'Select image'}</Text>
            }
            <View style={{...styles.horizontal, alignSelf: 'stretch', justifyContent: 'space-between'}}>
                {props.useCamera || props.useCamera === undefined ? 
                    <View style={{ flex: 1 }}>
                        <CoolButton
                            leftIcon={{
                                name: 'camera-alt', 
                                type: 'material-icons', 
                                size: 30, 
                                style: props.cameraIconStyle || props.iconStyle,
                            }}
                            onPress={props.launchCamera || handleCameraLaunch} 
                            containerStyle={styles.iconButton} 
                            useSecondaryColor />
                    </View> : null}
                {props.useImageLibrary || props.useImageLibrary === undefined ? 
                    <View style={{ flex: 1 }}>
                        <CoolButton
                            leftIcon={{
                                name: 'photo-library', 
                                type: 'material-icons', 
                                size: 30, 
                                style: props.imageLibraryIconStyle || props.iconStyle,
                            }}
                            onPress={props.launchImageLibrary || handleLaunchImageLibrary}
                            containerStyle={styles.iconButton} 
                            useSecondaryColor /> 
                    </View> : null}
                {props.useCustomSearch || props.useCustomSearch !== undefined ? 
                    <View style={{ flex: 1 }}>
                        <CoolButton
                            leftIcon={{
                                name: 'web-plus', 
                                type: 'material-community', 
                                size: 30, 
                                style: props.cameraIconStyle || props.iconStyle,
                            }}
                            onPress={props.launchCustomSearch || handleLaunchCustomSearch}
                            containerStyle={styles.iconButton} 
                            useSecondaryColor />
                    </View> : null}
            </View>
            
        </View>
    );
}

