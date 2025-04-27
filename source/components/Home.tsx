import { useEffect, useMemo, useState } from 'react';
import { View, Button, StyleSheet, Text, FlatList, Image, ActivityIndicator, useColorScheme } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import { onSnapshot, query, collection, where, getDoc, DocumentSnapshot, doc, FieldValue, serverTimestamp, limit } from 'firebase/firestore';
import { db, auth } from '../../ModularFirebase';
import { CommonActions, DrawerActions, useIsFocused } from '@react-navigation/native';
import { Icon } from 'react-native-elements';
import SafeAreaView from 'react-native-safe-area-view';
import { CoolButton } from '../hooks/MyElements';
import { timestampToString } from './SomeFunctions';
import { navigateToErrorScreen } from './Error';
import { HomeTabScreenProps } from '../navigation/Types';
import { ItemData, PostData, UserData } from '../assets/Types';

interface PostListItem {
    _id: string,
    title: string,
    message: string,
    type: string,
    authorName: string,
    pfpUrl: string,
    imageUrls: string[],
    createdAt: FieldValue,
}

export function HomeScreen({ navigation, route }: HomeTabScreenProps<'Home'>) {
    const [posts, setPosts] = useState<Array<PostListItem>>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [now, setNow] = useState(-1);
    const isFocused = useIsFocused();
    
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setIsLoggedIn(true);
            } else {
                navigation.replace('My Stack', {screen: 'Login'});
//                navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
            }
        });

        return unsubscribe;
    }, []);

    useEffect(() => setNow(Date.now()), [isFocused, posts]);

    useEffect(() => {
        if (!isLoggedIn) return;

        const unsubscribe = onSnapshot(query(collection(db, 'posts'), limit(20), where('resolved', '==', false), where('type', '==', 'Lost')), (snapshot: { docs: any[]; }) => {
            try {
                setIsLoading(true);
                const promises = snapshot.docs.map(async (postDoc) => {
                    let item;
                    try {
                        item = await getDoc(doc(db, 'items', postDoc.get('itemId')));
                    } catch (err) {
                        console.warn(err);
                    }

                    let owner;
                    try {
                        owner = await getDoc(doc(db, 'users', postDoc.get('authorId')));
                    } catch (err) {
                        console.warn(err);
                    }
                    
                    return {
                        _id: postDoc.id,
                        type: postDoc.get('type'),
                        title: postDoc.get('title'),
                        message: postDoc.get('message'),
                        authorName: (owner?.get('name') ? owner.get('name') : postDoc.get('ownerId')) || 'Unknown User',
                        pfpUrl: owner?.get('pfpUrl'),
                        imageUrls: postDoc?.get('imageUrls'),
                        createdAt: postDoc.get('createdAt'),
                    };
                });

                Promise.all(promises).then((res) => {
                    setPosts(res.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)); setIsLoading(false);
                }).catch((error) => {
                    navigateToErrorScreen(navigation, error);
                });
            } catch (error) {
                navigateToErrorScreen(navigation, error);
            }
        });

        return unsubscribe;
    }, [isLoggedIn]);

    
    const navigateToPost = async (postId: string) => {
        try {
            const postSnapshot = await getDoc(doc(db, 'posts', postId));
            const postData = postSnapshot.data()! as PostData;
            const itemData = (await getDoc(doc(db, 'items', postData!.itemId))).data()! as ItemData;
            const authorData = (await getDoc(doc(db, 'users', postData!.authorId))).data()! as UserData;
            navigation.navigate('My Stack', {screen: 'View Lost Post', params: {post: postData, item: itemData, author: authorData}});
        } catch (error) {
            navigateToErrorScreen(navigation, error);
        }

    }

    const isDarkMode = useColorScheme() === 'dark';
    const colors = isDarkMode ? DarkThemeColors : LightThemeColors;
    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            alignItems: 'center',
            padding: 10,
            backgroundColor: colors.background,
        },
        horizontal: {
            flexDirection: 'row',
        },
        bigButton: {
            width: '90%',
            backgroundColor: colors.primary,
            borderRadius: 7,
            padding: 10,
            alignSelf: 'center',
        },
        bigButtonText: {
            fontSize: 16,
            textAlign: 'center',
            color: colors.primaryContrastText,
            fontWeight: 'bold',
        },
        itemList: {
            flex: 1,
            width: '100%',
            margin: 10,
            backgroundColor: colors.card,
        },
        itemListItemView: {
            margin: 4,
            alignSelf: 'stretch',
        },
        itemImage: {
            alignSelf: 'stretch',
            aspectRatio: 1,
        },
        itemTitle: {
            color: colors.text,
            fontWeight: 'bold',
            fontSize: 18,
            margin: 4,
        },
        itemSubtitle: {
            color: colors.text,
            fontSize: 12,
        },
        itemContent: {
            color: colors.text,
            fontSize: 14,
            overflow: 'hidden',
            margin: 4,
        },
        pfp: {
            borderRadius: 99999,
            width: 42, 
            aspectRatio: 1/1,
            marginRight: 12,
        },
        userName: {
            fontSize: 15,
            fontWeight: '600',
            color: colors.text,
        },
        timestamp: {
            fontSize: 12,
            margin: 2,
            color: colors.text,
        },
    }), [isDarkMode]);

    return (
        <SafeAreaView style={{flex: 1}}>
            <View style={styles.container}>
                <View style={{width: '100%'}}>
                    <CoolButton
                        title='HELP I LOST SOMETHING'
                        style={{width: '100%'}}
                        titleStyle={{fontSize: 20}} 
                        onPress={() => navigation.navigate('My Stack', {screen: 'Post Lost Item'})} />
                </View>
                
                <View style={styles.itemList}>
                    <FlatList
                        contentContainerStyle={{minHeight: '100%'}}
                        keyExtractor={lostPost => lostPost._id.toString()}
                        ListEmptyComponent={
                            <View style={{width: '100%', height: '100%', alignContent: 'center', alignSelf: 'stretch', justifyContent: 'center'}}>
                                {isLoading ? <ActivityIndicator size='large' /> : <Icon name='cactus' type='material-community' size={40} />}
                            </View>
                        }
                        data={posts}
                        renderItem={({ item }) => (
                            <View style={styles.itemListItemView}>
                                <TouchableOpacity key={item._id.toString()} onPress={() => navigateToPost(item._id)}>
                                    <View style={[styles.horizontal, {width: '100%', justifyContent: 'flex-start', alignItems: 'center'}]}>
                                        <Image
                                            style={styles.pfp}
                                            source={{uri: item.pfpUrl}}
                                            defaultSource={require('../assets/defaultpfp.jpg')} />
                                        <View>
                                            <Text style={styles.userName}>{item.authorName}</Text>
                                            <Text style={styles.timestamp}>
                                                {item.createdAt ? timestampToString(item.createdAt!, now) : 'unknown time'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={{margin: 4, maxHeight: 80, overflow: 'hidden'}}>
                                        <Text style={{...styles.itemTitle, fontWeight: '500'}}>{item?.type && item.type + " "}<Text style={styles.itemTitle}>{item.title}</Text></Text>
                                        <Text style={styles.itemContent}>{item.message}</Text>
                                    </View>
                                    <Image source={item?.imageUrls ? {uri: item?.imageUrls[0]} : undefined} style={styles.itemImage} defaultSource={require('../assets/defaultimg.jpg')} />
                                </TouchableOpacity>
                            </View>
                            )}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

export default HomeScreen;