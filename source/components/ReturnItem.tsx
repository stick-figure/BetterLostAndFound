import { CommonActions, NavigationProp, NavigationState, ParamListBase, Route, useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Image, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../ModularFirebase';
import PressableOpacity from '../assets/MyElements';
import { Icon, SearchBar } from 'react-native-elements';
import { lightThemeColors } from '../assets/Colors';
import { getDoc, doc, onSnapshot, query, collection, where, limit } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import SafeAreaView from 'react-native-safe-area-view';
import { timestampToString } from './SomeFunctions';


export function ReturnItemScreen({ navigation }: { navigation: any }) {
    const [lostPosts, setLostPosts] = useState<any[]>([]);
    const [lostPostQuery, setLostPostQuery] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [now, setNow] = useState<number>();

    const isFocused = useIsFocused();
    
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

        const unsubscribe = onSnapshot(query(collection(db, 'posts'), limit(20), where('resolved', '==', false), where('type', '==', 'lost'), where('authorId', '!=', auth.currentUser?.uid)), (snapshot: { docs: any[]; }) => {
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
                    authorName: (owner?.data() ? owner.data()!.name : postDoc.data().ownerId) || 'Unknown User',
                    pfpSrc: owner?.data()?.pfpUrl,
                    imageSrc: item?.data()?.imageSrc,
                    createdAt: postDoc.data().createdAt,
                };
            });

            Promise.all(promises).then((res) => {
                setLostPosts(res); 
            }).catch((error) => {console.warn(error)}).finally(() => setIsLoading(false));
        });

        return unsubscribe;
    }, [isLoggedIn]);

    
    useEffect(() => {
        setNow(Date.now());
    }, [isFocused]);

    
    useEffect(() => {
        updateSearch(search);
    }, [lostPosts, isFocused]);

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

    const updateSearch = (searchText: string) => {
        setSearch(searchText);
        let myPostQuery = [...lostPosts].sort((a,b) => b.createdAt.seconds - a.createdAt.seconds).filter((value, index, array) => {
            return searchText == '' || value.title.toLowerCase().includes(searchText.toLowerCase()) || value.message.toLowerCase().includes(searchText.toLowerCase());
        });
        setLostPostQuery(myPostQuery);
    };
    
    return (
        <SafeAreaView style={styles.container}>
            <PressableOpacity
                onPress={() => navigation.navigate('My Stack', { screen: 'Search Items' })}
                style={styles.returnItemButton}>
                    <View style={[styles.horizontal, {width: '100%', justifyContent: 'center'}]}>
                        <Icon name='search' type='material-icons' color={lightThemeColors.textDark} />
                        <Text style={styles.buttonText}>Search all items</Text>
                    </View>
            </PressableOpacity>
            <PressableOpacity
                onPress={() => {}}
                style={styles.returnItemButton}>
                <Text style={styles.buttonText}>Report uncataloged item</Text>
            </PressableOpacity>
            <Text style={styles.subtitle}>Wanted (Lost) items</Text>
            <SearchBar
                placeholder='Type Here...'
                onChangeText={(text) => updateSearch(text)}
                value={search}
                style={styles.searchBar}
                containerStyle={styles.searchBarContainer} 
                inputStyle={styles.searchBarInput}
                labelStyle={styles.searchBarLabel}
                inputContainerStyle={styles.searchBarInputContainer}
                leftIconContainerStyle={{borderWidth: 0}}
                rightIconContainerStyle={{borderWidth: 0}}
                disabledInputStyle={{opacity: 0.8}}
                round
                lightTheme />
            <View style={styles.itemList}>
                <FlatList
                    keyExtractor={lostPost => lostPost._id.toString()}
                    ListEmptyComponent={
                        <View style={{flex: 1, alignContent: 'center', alignSelf: 'stretch', justifyContent: 'center'}}>
                            {isLoading ? <ActivityIndicator size='large' /> : <Icon name='cactus' type='material-community' />}
                        </View>
                    }
                    data={lostPostQuery}
                    numColumns={2}
                    renderItem={({ item }) => (
                        <View style={styles.itemListItemView}>
                            <PressableOpacity onPress={() => navigateToPost(item._id)} key={item._id.toString()} children={undefined}>
                                <View style={[styles.horizontal, {width: '100%', justifyContent: 'flex-start', alignItems: 'center'}]}>
                                    <Image
                                        style={styles.pfp}
                                        source={{uri: item?.pfpSrc}} 
                                        defaultSource={require('../assets/defaultpfp.jpg')} />
                                    <View>
                                        <Text style={styles.userName}>{item.authorName}</Text>
                                        <Text style={styles.timestamp}>
                                            {item.createdAt ? timestampToString(item.createdAt, now) : 'unknown time'}
                                        </Text>        
                                    </View>
                                </View>
                                <View style={{margin: 4, height: 80, overflow: 'hidden'}}>
                                    <Text style={styles.itemTitle}>{item.title}</Text>
                                    <Text style={styles.itemContent}>{item.message}</Text>
                                </View>
                                <Image source={{uri: item?.imageSrc}} style={styles.itemImage} defaultSource={require('../assets/defaultimg.jpg')} />
                            </PressableOpacity>
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
    text: {
        textAlign: 'center',
        color: lightThemeColors.textDark,
        fontSize: 18,
    },
    subtitle: {
        color: lightThemeColors.textLight,
        fontSize: 20,
        fontWeight: '700',
    },
    searchBar: {
        backgroundColor: lightThemeColors.foreground,
        borderWidth: 0,
    },
    searchBarContainer: {
        width: '100%',
        backgroundColor: lightThemeColors.background,
        borderWidth: 0,
    },
    searchBarLabel: {
        backgroundColor: lightThemeColors.background,
        borderWidth: 0,
    },
    searchBarInput: {
        backgroundColor: lightThemeColors.background,
        color: lightThemeColors.textLight,
        borderWidth: 0,
    },
    searchBarInputContainer: {
        borderWidth: 0,
        backgroundColor: lightThemeColors.foreground,
    },
    returnItemButton: {
        width: 370,
        margin: 6,
        padding: 6,
        backgroundColor: lightThemeColors.primary,
        borderRadius: 7,
        alignItems: 'center',
    },
    buttonText: {
        textAlign: 'center',
        color: lightThemeColors.textDark,
        fontSize: 18,
    },
    itemList: {
        flex: 1,
        width: '100%',
        margin: 10,
        backgroundColor: lightThemeColors.foreground,
    },
    itemListItemView: {
        flex: 1, 
        margin: 4,
        alignSelf: 'stretch',
    },
    itemImage: {
        alignSelf: 'stretch',
        aspectRatio: 1,
        verticalAlign: 'bottom',
    },
    itemTitle: {
        color: lightThemeColors.textLight,
        fontWeight: 'bold',
        fontSize: 18,
    },
    itemSubtitle: {
        color: lightThemeColors.textLight,
        fontSize: 12,
    },
    itemContent: {
        color: lightThemeColors.textLight,
        fontSize: 14,
        overflow: 'hidden',
    },
    returnItemButton: {
        width: 370,
        marginBottom: 10,
        padding: 10,
        backgroundColor: lightThemeColors.primary,
        borderRadius: 7,
    },
    pfp: {
        borderRadius: 99999,
        width: 42, 
        aspectRatio: 1/1,
        marginRight: 12,
        color: lightThemeColors.textLight,
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

export default ReturnItemScreen;