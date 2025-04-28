import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, useColorScheme } from 'react-native';
import { launchImageLibrary, MediaType } from 'react-native-image-picker';

import { auth, db } from '../../ModularFirebase';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import { CommonActions } from '@react-navigation/native';
import { CoolButton, CoolTextInput, PressableOpacity } from '../hooks/MyElements';
import { CheckBox, Input } from 'react-native-elements';
import SafeAreaView from 'react-native-safe-area-view';
import { MyStackScreenProps } from '../navigation/Types';
import { ItemData, PostData, PostDataUpload, TypeType, UserData } from '../assets/Types';
import { navigateToErrorScreen, popupOnError } from './Error';


export function NewLostPostScreen({navigation, route}: MyStackScreenProps<'New Lost Post'>) {
    const [item, setItem] = useState<ItemData>();
    const [owner, setOwner] = useState<UserData>();

    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');

    const [showPhoneNumber, setShowPhoneNumber] = useState(false);
    const [showAddress, setShowAddress] = useState(false);

    const [useLocation, setUseLocation] = useState(false);

    const [uploading, setUploading] = useState(false);

    const uploadPost = popupOnError(navigation, () => {
        setUploading(true);
        if (!isLoggedIn || !auth.currentUser) throw new Error('User is not authenticated');
        if (!item) throw new Error('Item is not defined');
        if (!owner) throw new Error('Owner is not defined');

        const postRef = doc(collection(db, 'posts'));

        const postDataToUpload: PostDataUpload = {
            id: postRef.id,
            type: TypeType.LOST,
            itemId: item.id,
            title: title.trim().length > 0 ? title : item.name,
            message: message,
            authorId: auth.currentUser!.uid,
            createdAt: serverTimestamp(),
            resolved: false,
            resolvedAt: null,
            resolveReason: null,
            views: 0,
            roomIds: [],
            showPhoneNumber: false,
            showAddress: false,
            imageUrls: [item.imageUrl],
        };

        navigation.navigate('Loading');

        setDoc(postRef, postDataToUpload).then(() => {
            return updateDoc(doc(db, 'items', item.id), {isLost: true, lostPostId: postRef.id, timesLost: item.timesLost as number + 1});
        }).then(() => {
            return updateDoc(doc(db, 'users', owner.id), {timesOwnItemLost: owner.timesOwnItemLost as number + 1});
        }).then(() => {
            return getDoc(postRef);
        }).then((snapshot) => {
            navigation.navigate('View Lost Post', {item: item, owner: owner, author: owner, post: snapshot.data()! as PostData});
            navigation.dispatch((state: {routes: any[]}) => {
                const topScreen = state.routes[0];
                const thisScreen = state.routes[state.routes.length - 1];
                const routes = [topScreen, thisScreen];
                return CommonActions.reset({
                    ...state,
                    index: routes.length - 1,
                    routes,
                });
            });
            setUploading(false);
        });
    });

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

    useEffect(() => {
        if (!isLoggedIn) return;
        if (route.params?.item) setItem(route.params!.item);
        if (route.params?.owner) {
            setOwner(route.params!.owner);
        } else if (route.params.item?.ownerId) {
            getDoc(doc(db, 'users', route.params.item?.ownerId)).then((snapshot) => {
                setOwner(snapshot.data()! as UserData);
            });
        }
    }, [isLoggedIn]);

    const isDarkMode = useColorScheme() === 'dark';
    const colors = isDarkMode ? DarkThemeColors : LightThemeColors;
    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            width: '100%',
            padding: 8,
            alignItems: 'center',
            backgroundColor: colors.background,
        },
        text: {
            fontSize: 14,
            color: colors.text,
        },
        itemContainer: {
            width: '100%',
            alignSelf: 'flex-start',
            margin: 8,
        },
        horizontal: {
            flexDirection: 'row',
        },
        multilineTextInput: {
            width: '90%',
            height: 300,
            overflow: 'scroll',
        },
        addItemTitle: {
            margin: 20,
            color: colors.text,
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
            width: '30%',
            aspectRatio: 1/1,
            borderRadius: 7,
        },
        itemList: {
            width: '100%',
            height: '40%',
            margin: 10,
            backgroundColor: colors.card,
        },
        itemListItem: {
            width: 120,
            marginLeft: 10,
            paddingTop: 10,
            paddingBottom: 10,
        },
        itemListItemView: {
            margin: 4,
        },
        itemTitle: {
            color: colors.text,
            fontWeight: 'bold',
            fontSize: 18,
        },
        itemSubtitle: {
            color: colors.text,
            fontSize: 12,
        },
        itemContent: {
            color: colors.text,
            fontSize: 16,
        },
        imageLabel: {
            fontSize: 16,
            textAlign: 'center',
            color: colors.text,
            fontWeight: 'bold',
        },
        saveButton: {
            width: 280,
        },
        saveButtonText: {
            fontSize: 16,
            textAlign: 'center',
            color: colors.primaryContrastText,
            fontWeight: 'bold',
        }
    }), [isDarkMode]);


    if (uploading) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Uploading...</Text>
            </View>);
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.itemContainer}>
                {item && owner ? (
                    <PressableOpacity
                        onPress={() => { navigation.navigate('View Item', { itemId: item!.id, itemName: item!.name }) }}
                        disabled={uploading}>
                            <View style={styles.horizontal}>
                            <Image 
                                source={{uri: item!.imageUrl || undefined}} 
                                defaultSource={require('../assets/defaultimg.jpg')} 
                                style={styles.itemImage} />
                                <View style={styles.itemListItemView}>
                                    <Text style={styles.itemTitle}>{item!.name}</Text>
                                    <Text style={styles.itemSubtitle}>{owner!.name}</Text>
                                    <Text style={styles.itemSubtitle}>{item!.description !== undefined && item!.description!.slice(0,140)}</Text>
                                </View>
                            </View>
                    </PressableOpacity>
                ) : (
                    <PressableOpacity
                        disabled={uploading}>
                            <View style={styles.horizontal}>
                            </View>
                    </PressableOpacity>
                )}
            </View>

            <CoolTextInput
                label='Message'
                multiline={true}
                numberOfLines={4}
                placeholder=''
                containerStyle={{width: '100%', height: 200}}
                onChangeText={text => setMessage(text)}
                value={message}
                editable={!uploading}
                required
            />
            {owner?.phoneNumber ? 
                <CheckBox
                    key={'showPhoneNumber'}
                    checked={showPhoneNumber}
                    onPress={() => setShowPhoneNumber(!showPhoneNumber)}
                    title='Show phone number'
                /> : null}
            {owner?.address ? 
                <CheckBox
                    key={'showAddress'}
                    checked={showAddress}
                    onPress={() => setShowAddress(!showAddress)}
                    title='Show address'
                /> : null}
            {/*TODO EXPIRE BY FIELD*/}

            <CoolButton
                title='Post'
                style={styles.saveButton}
                disabled={message.trim().length <= 0 || uploading}
                onPress={uploadPost} />
        </SafeAreaView>
    );
}


export default NewLostPostScreen;