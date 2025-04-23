import { onSnapshot, query, collection, where, getDoc, doc, DocumentSnapshot } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, FlatList, ActivityIndicator, Image, Text, StyleSheet, useColorScheme } from 'react-native';
import { SearchBar, Icon } from 'react-native-elements';
import { auth, db } from '../../ModularFirebase';
import PressableOpacity from '../assets/MyElements';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';


export function PostLostItemScreen({ navigation }: { navigation: any }) {
    const [items, setItems] = useState<any[]>([]);
    const [itemQuery, setItemQuery] = useState<any[]>([]);
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
            width: '90%',
            alignSelf: 'center',
            backgroundColor: colors.primary,
            borderRadius: 7,
            padding: 10,
            margin: 4,
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
                <PressableOpacity
                    onPress={() => navigation.navigate('My Stack', {screen: 'Add Item'})}
                    style={styles.bigButton}>
                    <Text style={styles.bigButtonText}>Add new item</Text>
                </PressableOpacity>
            </View>
            <Text style={styles.subtitle}>Choose an item</Text>
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
                
                />
            <View style={styles.itemList}>
                <FlatList
                    contentContainerStyle={{minHeight: '100%'}}
                    keyExtractor={item => item._id.toString()}
                    ListEmptyComponent={
                        <View style={{flex: 1, alignContent: 'center', alignSelf: 'stretch', justifyContent: 'center'}}>
                            {isLoading ? <ActivityIndicator size='large' /> : <Icon name='cactus' type='material-community' color={colors.text} size={40} />}
                        </View>
                    }
                    data={itemQuery}
                    renderItem={({ item }) => (
                        <View style={styles.itemListItem}>
                            <PressableOpacity
                                key={item._id.toString()}
                                onPress={() => { navigation.navigate('Item View', { itemId: item._id, itemName: item.name }) }}>    
                            
                                <Image source={item.imageSrc} style={styles.itemImage} defaultSource={require('../assets/defaultimg.jpg')}/>
                                <View style={styles.listItemInfo}>
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

export default PostLostItemScreen;