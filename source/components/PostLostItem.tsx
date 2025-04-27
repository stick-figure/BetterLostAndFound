import { onSnapshot, query, collection, where, getDoc, doc, DocumentSnapshot } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, FlatList, ActivityIndicator, Image, Text, StyleSheet, useColorScheme } from 'react-native';
import { SearchBar, Icon } from 'react-native-elements';
import { auth, db } from '../../ModularFirebase';
import { CoolButton, PressableOpacity } from '../hooks/MyElements';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import { navigateToErrorScreen } from './Error';
import { MyStackScreenProps } from '../navigation/Types';
import { ItemData, UserData } from '../assets/Types';


type ItemTile = {
    item: ItemData,
    owner?: UserData,
};

export function PostLostItemScreen({navigation, route}: MyStackScreenProps<'Post Lost Item'>) {
    const [itemTiles, setItemTiles] = useState<ItemTile[]>([]);
    const [itemTileQuery, setItemTileQuery] = useState<ItemTile[]>([]);
    const [search, setSearch] = useState('');

    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

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
        if (!isLoggedIn || auth?.currentUser === undefined) return;

        const unsubscribe = onSnapshot(query(collection(db, 'items'), where('ownerId', '==', auth.currentUser?.uid), where('isLost', '==', false)), (snapshot: { docs: any[]; }) => {
            setIsLoading(true);
            const promises = snapshot.docs.map(async (itemDoc) => {

                let owner;
                try {
                    owner = await getDoc(doc(db, 'users', itemDoc.get('ownerId')));
                } catch (err) {
                    
                }
                
                return {
                    item: itemDoc.data() as ItemData,
                    owner: owner ? owner.data()! as UserData : undefined,
                };
            });

            Promise.all(promises).then((res) => {
                setItemTiles(res);
                setIsLoading(false);
            }).catch((error) => {
                navigateToErrorScreen(navigation, error);
            });
        });

        return unsubscribe;
    }, [isLoggedIn]);

    useEffect(() => {
        updateSearch(search);
    }, [itemTiles]);

    const updateSearch = (searchText: string) => {
        setSearch(searchText);
        let myItemQuery = itemTiles.filter((value, index, array) => {
            return searchText == '' || value.item.name.toLowerCase().includes(searchText.toLowerCase());
        });
        setItemTileQuery(myItemQuery);
    };

    const isDarkMode = useColorScheme() === 'dark';
    const colors = isDarkMode ? DarkThemeColors : LightThemeColors;
    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            padding: 10,
            backgroundColor: colors.background,
        },
        horizontal: {
            flexDirection: 'row',
        },
        text: {
            color: colors.text,
            fontSize: 14,
        },
        subtitle: {
            color: colors.text,
            fontSize: 20,
            margin: 8,
            marginTop: 8,
            fontWeight: "bold",
        },
        bigButton: {
            width: '100%',
            alignSelf: 'center',
        },
        bigButtonText: {
            fontSize: 16,
            textAlign: 'center',
            color: colors.primaryContrastText,
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
        itemList: {
            flexGrow: 1,
            padding: 10,
            backgroundColor: colors.card,
        },
        itemListItem: {
            flex: 1,
            maxWidth: `${100/3}%`,
            padding: 10,
        },
        listItemInfo: {
            margin: 4,
        },
        itemImage: {
            width: '100%',
            aspectRatio: 1,
        },
        itemTitle: {
            color: colors.text,
            fontWeight: 'bold',
            fontSize: 16,
        },
        itemSubtitle: {
            color: colors.text,
            fontSize: 12,
        },
        itemContent: {
            color: colors.text,
            fontSize: 14,
        },
        addItemTitle: {
            fontSize: 14,
        },
    }), [isDarkMode]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={{margin: 4, padding: 4}}>
                <Text style={styles.text}>Can't find your item in this list?</Text>
                <CoolButton
                    title='Add new item'
                    onPress={() => navigation.navigate('My Stack', {screen: 'Add Item', params: {nextScreen: 'New Lost Post'}})}
                    style={styles.bigButton} />
            </View>
            <Text style={styles.subtitle}>Choose an item</Text>
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
                />
            <View style={styles.itemList}>
                <FlatList
                    contentContainerStyle={{minHeight: '100%'}}
                    keyExtractor={item => item.item.id.toString()}
                    ListEmptyComponent={
                        <View style={{flex: 1, alignContent: 'center', alignSelf: 'stretch', justifyContent: 'center'}}>
                            {isLoading ? <ActivityIndicator size='large' /> : <Icon name='cactus' type='material-community' color={colors.text} size={40} />}
                        </View>
                    }
                    data={itemTileQuery}
                    renderItem={({ item }) => (
                        <View style={styles.itemListItem}>
                            <PressableOpacity
                                key={item.item.id.toString()}
                                onPress={async () => {
                                    const ownerRef = doc(db, 'users', auth.currentUser!.uid)
                                    const ownerData = (await getDoc(ownerRef)).data();

                                    navigation.navigate('New Lost Post', { item: item.item, owner: item.owner })
                                }}>
                            
                                <Image source={{uri: item.item.imageUrl || undefined}} style={styles.itemImage} defaultSource={require('../assets/defaultimg.jpg')}/>
                                <View style={styles.listItemInfo}>
                                    <Text style={styles.itemTitle}>{item.item?.name ?? 'Unknown Item'}</Text>
                                    <Text style={styles.itemSubtitle}>{item.owner?.name ?? 'Unknown User'}</Text>
                                </View> 
                            </PressableOpacity>
                        </View>
                    )}
                    numColumns={3}
                />
            </View>
        </SafeAreaView>
    );
}

export default PostLostItemScreen;