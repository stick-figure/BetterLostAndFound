import { CommonActions, NavigationProp, NavigationState, ParamListBase, Route, useIsFocused } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Image, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { auth, db } from '../../MyFirebase';
import { CoolButton, PressableOpacity } from '../hooks/MyElements';
import { Icon, SearchBar } from 'react-native-elements';
import { getDoc, doc, onSnapshot, query, collection, where, limit } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import SafeAreaView from 'react-native-safe-area-view';
import { timestampToString, uriFrom } from '../utils/SomeFunctions';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import { navigateToErrorScreen } from './Error';
import { HomeTabScreenProps } from '../navigation/Types';
import { PostData, ItemData, UserData } from '../assets/Types';


export function ReturnItemScreen({navigation, route}: HomeTabScreenProps<'Return Item'>) {
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

        const unsubscribe = onSnapshot(query(collection(db, 'posts'), limit(20), where('resolved', '==', false), where('type', '==', 'Lost'), where('authorId', '!=', auth.currentUser?.uid)), (snapshot: { docs: any[]; }) => {
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
                    title: postDoc.get('title'),
                    message: postDoc.get('message'),
                    authorName: owner?.get('name') || postDoc.get('authorId') || 'Unknown User',
                    pfpSrc: owner?.get('pfpUrl'),
                    imageUrl: item?.get('imageUrl'),
                    createdAt: postDoc.get('createdAt'),
                };
            });

            Promise.all(promises).then((res) => {
                setLostPosts(res); 
            }).catch((error) => {
                navigateToErrorScreen(navigation, error);
            }).finally(() => setIsLoading(false));
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
            const itemData = (await getDoc(doc(db, 'items', postData!.itemId))).data()!;
            const authorData = (await getDoc(doc(db, 'users', postData!.authorId))).data()!;
            navigation.navigate('My Stack', {screen: 'View Lost Post', params: {post: postData as PostData, item: itemData as ItemData, author: authorData as UserData}});
        } catch (error) {
            navigateToErrorScreen(navigation, error);
        }

    }

    const updateSearch = (searchText: string) => {
        setSearch(searchText);
        let myPostQuery = [...lostPosts].sort((a,b) => (b.createdAt?.seconds ?? 0) - (a.createdAt.seconds ?? 0)).filter((value, index, array) => {
            return searchText == '' || value.title.toLowerCase().includes(searchText.toLowerCase()) || value.message.toLowerCase().includes(searchText.toLowerCase());
        });
        setLostPostQuery(myPostQuery);
    };
    
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
        text: {
            textAlign: 'center',
            color: colors.contrastText,
            fontSize: 18,
        },
        subtitle: {
            color: colors.text,
            fontSize: 20,
            fontWeight: '700',
        },
        searchBar: {
            backgroundColor: colors.card,
            borderWidth: 0,
        },
        searchBarContainer: {
            width: '100%',
            backgroundColor: colors.background,
            borderWidth: 0,
        },
        searchBarLabel: {
            backgroundColor: colors.background,
            borderWidth: 0,
        },
        searchBarInput: {
            backgroundColor: colors.background,
            color: colors.text,
            borderWidth: 0,
        },
        searchBarInputContainer: {
            borderWidth: 0,
            backgroundColor: colors.card,
        },
        returnItemButton: {
            width: 370,
        },
        buttonText: {
            textAlign: 'center',
            justifyContent: 'center',
            color: colors.primaryContrastText,
            fontSize: 16,
        },
        itemList: {
            flex: 1,
            width: '100%',
            margin: 10,
            backgroundColor: colors.card,
        },
        itemListItem: {
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
            fontSize: 14,
            overflow: 'hidden',
        },
        pfp: {
            borderRadius: 99999,
            width: 42, 
            aspectRatio: 1/1,
            marginRight: 12,
            color: colors.text,
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
        <SafeAreaView style={styles.container}>
            <CoolButton
                title='Search all items'
                onPress={() => navigation.navigate('My Stack', { screen: 'Search Items' })}
                style={styles.returnItemButton} 
                leftIcon={{
                    name: 'search', 
                    type: 'material-icons',
                    size: 20,
                }} />
                {/*
                <View style={[styles.horizontal, {justifyContent: 'center'}]}>
                    <Icon name='search' type='material-icons' color={colors.primaryContrastText} />
                    <Text style={styles.buttonText}>Search all items</Text>
                </View>
                */}
            <CoolButton
                title='Report uncataloged item'
                onPress={() => navigation.navigate('My Stack', { screen: 'Search Items' })}
                style={styles.returnItemButton} />
            <Text style={styles.subtitle}>Wanted (Lost) items</Text>
            <SearchBar
                placeholder='Type Here...'
                onChangeText={(text?: string) => updateSearch(text ?? '')}
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
                lightTheme={!isDarkMode} 
                platform='default' />
            <View style={styles.itemList}>
                <FlatList
                    contentContainerStyle={{flexGrow: 1, minHeight: '100%'}}
                    keyExtractor={lostPost => lostPost._id.toString()}
                    ListEmptyComponent={
                        <View style={{height: '100%', alignContent: 'center', alignSelf: 'stretch', justifyContent: 'center'}}>
                            {isLoading ? <ActivityIndicator size='large' /> : <Icon name='cactus' type='material-community' color={colors.text} size={40} />}
                        </View>
                    }
                    data={lostPostQuery}
                    numColumns={2}
                    renderItem={({ item }) => (
                        <View style={styles.itemListItem}>
                            <PressableOpacity onPress={() => navigateToPost(item._id)} key={item._id.toString()}>
                                <View style={[styles.horizontal, {width: '100%', justifyContent: 'flex-start', alignItems: 'center'}]}>
                                    <Image
                                        style={styles.pfp}
                                        source={uriFrom(item?.pfpSrc)} 
                                        defaultSource={require('../assets/images/defaultpfp.jpg')} />
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
                                <Image source={uriFrom(item?.imageUrl)} style={styles.itemImage} defaultSource={require('../assets/images/defaultimg.jpg')} />
                            </PressableOpacity>
                        </View>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    
});

export default ReturnItemScreen;