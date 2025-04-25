import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Animated, StyleSheet, Text, TextInput, View, useColorScheme, TouchableOpacity, Platform } from 'react-native';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import { Icon } from 'react-native-elements';
import { check, checkMultiple, Permission, PERMISSIONS, PermissionStatus, request, requestMultiple, RESULTS } from 'react-native-permissions';
import { MediaType, launchImageLibrary, launchCamera } from 'react-native-image-picker';

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
                props.required ? 
                    <RequiredLabel style={[styles.label, props.labelStyle]}>{props.label}</RequiredLabel>
                :
                    <Text style={[styles.label, props.labelStyle]}>{props.label}</Text>
            }
            <View style={{alignSelf: 'stretch', borderColor: colors.border, borderBottomWidth: 2, flexDirection: 'row'}}>
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

export const CoolTextInput = ({ ...props }) => {
    const isDarkMode = useColorScheme() === 'dark';
    const colors = isDarkMode ? DarkThemeColors : LightThemeColors;
    const styles = useMemo(() => StyleSheet.create({
        label: {
            fontSize: 14,
            fontWeight: '500',
            color: colors.border,
            alignSelf: 'flex-start',
        },
        textInput: {
            flexGrow: 1,
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
                style={[styles.textInput, props.style]}>
            </TextInput>
        </View>
    );
}

export const CoolButton = ({ ...props }) => {
    const [pressedIn, setPressedIn] = useState(false);

    const isDarkMode = useColorScheme() === 'dark';
    const colors = isDarkMode ? DarkThemeColors : LightThemeColors;

    const pressInHeight = 2;
    const pressOutHeight = 5;
    
    const styles = useMemo(() => StyleSheet.create({
        button: {
            backgroundColor: colors.border,
            overflow: 'hidden',
            borderRadius: props.style?.borderRadius || 10,
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
            borderRadius: props.style?.borderRadius || 10,
            padding: 10,
        },
        content: {
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: 'row',
        },
    }), [isDarkMode]);

    return (
        <Pressable
            {...props}
            style={[
                styles.button, 
                pressedIn ? styles.pressedInButton : styles.pressedOutButton, 
                props.style,
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
                        <Icon name={props.leftIcon.name} type={props.leftIcon.type || 'material-community'} size={props.leftIcon.size || styles.title.fontSize} color={props.leftIcon.color || styles.title.color} />
                    : null}
                    <Text style={[styles.title, props.titleStyle]}>{props.title}</Text>
                    {props.rightIcon ? 
                        <Icon name={props.rightIcon.name} type={props.rightIcon.type || 'material-community'} size={props.rightIcon.size || styles.title.fontSize} color={props.rightIcon.color || styles.title.color} />
                    : null}
                </View>
                
            </View>
        </Pressable>
    );
}

export const ImagePicker = ({ ...props }) => {
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
                props.onCancel(response);
            } else if (response.errorCode) {
                console.warn('Camera error', response.errorCode, ':', response.errorMessage);
                props.onError(response);
            } else if (response) {
                props.onResponse(response);
            } else {
                throw new Error('No response');
            }
        }).catch((err) => { 
            console.warn(err);
            props.onError(err);
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
                props.onCancel(response);
            } else if (response.errorCode) {
                console.warn('ImagePicker Error', response.errorCode, ':', response.errorMessage);
                props.onError(response);
            } else if (response) {
                props.onResponse(response);
            } else {
                throw new Error('No response');
            }
        }).catch((err) => { 
            console.warn(err);
            props.onError(err);
        });
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
            color: colors.border,
            alignSelf: 'flex-start',
        },
        iconButton: {

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
        }
    }), [isDarkMode]);

    return (
        <View style={props.containerStyle || [styles.container, styles.horizontal]}>
            <TouchableOpacity onPress={props.launchCamera || handleCameraLaunch} style={props.cameraButtonStyle || props.iconButtonStyle || styles.iconButton}>
                <Icon name='camera-alt' type='material-icons' size={20} color={colors.secondaryContrastText} style={props.cameraIconStyle || props.iconStyle} />
            </TouchableOpacity>
            <TouchableOpacity onPress={props.launchImageLibrary || handleLaunchImageLibrary} style={props.imageLibraryButtonStyle || styles.iconButton}>
                <Icon name='photo-library' type='material-icons' size={20} color={colors.secondaryContrastText} style={props.imageLibraryIconStyle || props.iconStyle} />
            </TouchableOpacity>
            {props.required ? 
                <RequiredLabel style={props.labelStyle || styles.label}>{props.label || 'Select image'}</RequiredLabel>
            :
                <Text style={props.labelStyle || styles.label}>{props.label || 'Select image'}</Text>
            }
        </View>
    );
}

