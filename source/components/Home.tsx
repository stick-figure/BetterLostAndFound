import { useEffect, useState } from 'react';
import { View, Button, StyleSheet, Text, FlatList, Image, ActivityIndicator } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { lightThemeColors } from '../assets/Colors';
import { onSnapshot, query, collection, where, getDoc, DocumentSnapshot, doc, FieldValue, serverTimestamp, limit } from 'firebase/firestore';
import { db, auth } from '../../ModularFirebase';
import { CommonActions, DrawerActions, useIsFocused } from '@react-navigation/native';
import { Icon } from 'react-native-elements';
import SafeAreaView from 'react-native-safe-area-view';
import PressableOpacity from '../assets/MyElements';
import { timestampToString } from './SomeFunctions';

interface LostPostListItem {
    _id: string,
    title: string,
    message: string,
    authorName: string,
    pfpUrl: string,
    imageSrc: string,
    createdAt: FieldValue,
}

export function HomeScreen({ navigation }: { navigation: any }) {
    const [posts, setPosts] = useState<Array<LostPostListItem>>([]);
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

        const unsubscribe = onSnapshot(query(collection(db, 'posts'), limit(20), where('resolved', '==', false), where('type', '==', 'lost')), (snapshot: { docs: any[]; }) => {
            setIsLoading(true);
            const promises = snapshot.docs.map(async (postDoc) => {
                let item;
                try {
                    item = await getDoc(doc(db, 'items', postDoc.data().itemId));
                } catch (err) {
                    console.warn(err);
                }

                let owner;
                try {
                    owner = await getDoc(doc(db, 'users', postDoc.data().authorId));
                } catch (err) {
                    console.warn(err);
                }
                
                return {
                    _id: postDoc.id,
                    title: postDoc.data().title,
                    message: postDoc.data().message,
                    authorName: (owner?.data() ? (owner as DocumentSnapshot).data()!.name : postDoc.data().ownerId) || 'Unknown User',
                    pfpUrl: owner?.data()?.pfpUrl,
                    imageSrc: item?.data()?.imageSrc,
                    createdAt: postDoc.data().createdAt,
                };
            });

            Promise.all(promises).then((res) => {
                setPosts(res.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)); setIsLoading(false);
            }).catch((error) => {console.warn(error)});
        });

        return unsubscribe;
    }, [isLoggedIn]);

    
    const navigateToPost = async (postId: string) => {
        try {
            const postSnapshot = await getDoc(doc(db, 'posts', postId));
            const postData = postSnapshot.data()!;
            postData._id = postSnapshot.id;
            const itemData = (await getDoc(doc(db, 'items', postData!.itemId))).data()!;
            itemData._id = postData!.itemId;
            const authorData = (await getDoc(doc(db, 'users', postData!.authorId))).data()!;
            authorData._id = postData!.authorId;
            navigation.navigate('My Stack', {screen: 'Lost Post View', params: {post: postData, item: itemData, author: authorData}});
        } catch (err) {
            console.warn(err);
        }

    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={{width: '100%'}}>
                <PressableOpacity
                    style={{...styles.bigButton, width: "100%", padding: 12}}
                    onPress={() => navigation.navigate('My Stack', {screen: 'Post Lost Item'})}>
                    <Text style={{...styles.bigButtonText, fontSize: 20, fontWeight: "600"}}>HELP I LOST SOMETHING</Text>
                </PressableOpacity>
            </View>
            
            <View style={styles.itemList}>
                <FlatList
                    keyExtractor={lostPost => lostPost._id.toString()}
                    ListEmptyComponent={
                        <View style={{width: '100%', height: '100%', alignContent: 'center', alignSelf: 'stretch', justifyContent: 'center'}}>
                            {isLoading ? <ActivityIndicator size='large' /> : <Icon name='cactus' type='material-community' />}
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
                                    <Text style={styles.itemTitle}>{item.title}</Text>
                                    <Text style={styles.itemContent}>{item.message}</Text>
                                </View>
                                <Image source={item.imageSrc ? {uri: item.imageSrc} : undefined} style={styles.itemImage} defaultSource={require('../assets/defaultimg.jpg')} />
                            </TouchableOpacity>
                        </View>
                        )}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
        backgroundColor: lightThemeColors.background,
    },
    horizontal: {
        flexDirection: 'row',
    },
    bigButton: {
        width: '90%',
        backgroundColor: lightThemeColors.primary,
        borderRadius: 7,
        padding: 10,
        alignSelf: 'center',
    },
    bigButtonText: {
        fontSize: 16,
        textAlign: 'center',
        color: lightThemeColors.textDark,
        fontWeight: 'bold',
    },
    itemList: {
        flex: 1,
        width: '100%',
        margin: 10,
        backgroundColor: lightThemeColors.foreground,
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
        color: lightThemeColors.textLight,
        fontWeight: 'bold',
        fontSize: 18,
        margin: 4,
    },
    itemSubtitle: {
        color: lightThemeColors.textLight,
        fontSize: 12,
    },
    itemContent: {
        color: lightThemeColors.textLight,
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
        color: lightThemeColors.textLight,
    },
    timestamp: {
        fontSize: 12,
        margin: 2,
        color: lightThemeColors.textLight,
    },
});
export default HomeScreen;