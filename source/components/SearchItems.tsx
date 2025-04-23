import { query, collection, where, doc, getDocs, setDoc, DocumentData, onSnapshot, DocumentSnapshot, getDoc, limit } from 'firebase/firestore';
import { SetStateAction, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import SafeAreaView from 'react-native-safe-area-view';
import { auth, db } from '../../ModularFirebase';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { CommonActions, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { colors, Icon, SearchBar } from 'react-native-elements';
import PressableOpacity from '../assets/MyElements';

interface ItemTile {
    _id: string,
    name: string,
    description: string,
    ownerName: string,
    isLost: boolean,
    imageSrc: object,
}

export function SearchItemsScreen() {
    const navigation = useNavigation();
    const route = useRoute();

    const [items, setItems] = useState<ItemTile[]>([]);
    const [itemQuery, setItemQuery] =  useState<ItemTile[]>([]);
    const [search, setSearch] = useState('');
    
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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

        const unsubscribe = onSnapshot(query(collection(db, 'items'), limit(20)), (snapshot: { docs: any[]; }) => {
            setIsLoading(true);
            const promises = snapshot.docs.map(async (itemDoc) => {

                let owner;
                try {
                    owner = await getDoc(doc(db, 'users', itemDoc.get('ownerId')));
                } catch (err) {
                    
                }
                
                return {
                    _id: itemDoc.id,
                    name: itemDoc.get('name'),
                    description: itemDoc.get('description'),
                    ownerName: owner?.get('name') || itemDoc.get('ownerId') || 'Unknown User',
                    isLost: itemDoc.get('isLost'),
                    imageSrc: itemDoc.get('imageSrc') ? { uri: itemDoc.get('imageSrc') } : undefined,
                };
            });

            Promise.all(promises).then((res) => {
                setItems(res);
                setIsLoading(false);
            }).catch((error) => {console.warn(error)});
        });

        return unsubscribe;
    }, [isLoggedIn]);

    useEffect(() => {
        updateSearch(search);
    }, [items]);

    const updateSearch = (searchText: string) => {
        setSearch(searchText);
        let myItemQuery = items.filter((value, index, array) => {
            return searchText == '' || value.name.toLowerCase().includes(searchText.toLowerCase());
        });
        setItemQuery(myItemQuery);
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
            width: '100%',
            flexGrow: 1,
            margin: 10,
            backgroundColor: colors.card,
        },
        itemListItem: {
            flex: 1,
            maxWidth: '33%',
            marginLeft: 10,
            paddingTop: 10,
            paddingBottom: 10,
        },
        itemListItemView: {
            margin: 4,
        },
        itemImage: {
            width: '100%',
            maxWidth: 120,
            maxHeight: 120,
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
                lightTheme
                />
            <View style={styles.itemList}>
                <FlatList
                    horizontal={false}
                    keyExtractor={item => item._id.toString()}
                    ListEmptyComponent={
                        <View style={{flex: 1, alignContent: 'center', alignSelf: 'stretch', justifyContent: 'center'}}>
                            {isLoading ? <ActivityIndicator size='large' /> : <Icon name='cactus' type='material-community' color={colors.text} />}
                        </View>
                    }
                    data={itemQuery}
                    renderItem={({ item }) => (
                        <View style={styles.itemListItem}>
                            <PressableOpacity
                                key={item._id.toString()}
                                onPress={() => { navigation.navigate('Item View', { itemId: item._id, itemName: item.name }) }}>    
                            
                                <Image source={item.imageSrc} style={styles.itemImage} defaultSource={require('../assets/defaultimg.jpg')}/>
                                <View style={styles.itemListItemView}>
                                    <Text style={styles.itemTitle}>{item.name}</Text>
                                    <Text style={styles.itemSubtitle}>{item.ownerName}</Text>
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

const styles = StyleSheet.create({
    
});

export default SearchItemsScreen;