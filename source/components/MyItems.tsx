import { query, collection, where, doc, getDocs, setDoc, DocumentData, onSnapshot, DocumentSnapshot, getDoc } from 'firebase/firestore';
import React, { SetStateAction, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Image, StyleSheet, Text, useColorScheme, View } from 'react-native';
import SafeAreaView, { SafeAreaProvider } from 'react-native-safe-area-view';
import { auth, db } from '../../ModularFirebase';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import { CommonActions } from '@react-navigation/native';
import { CoolButton, PressableOpacity } from '../hooks/MyElements';
import { Icon } from 'react-native-elements';
import { navigateToErrorScreen } from './Error';
import { UserData } from '../assets/Types';
import { HomeTabScreenProps } from '../navigation/Types';
import { uriFrom } from './SomeFunctions';

interface ItemTile {
    _id: string,
    name: string,
    description: string,
    owner?: UserData,
    isLost: boolean,
    imageUrl?: string,
}

export function MyItemsScreen({navigation, route}: HomeTabScreenProps<'My Items'>) {
    const [itemTiles, setItemTiles] = useState<ItemTile[]>([]);
    const [sortedItemTiles, setSortedItemTiles] = useState<ItemTile[]>([]);
    const [userData, setUserData] = useState<UserData>();

    const [isLoggedIn, setIsLoggedIn] = useState(false);

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
        if (!isLoggedIn) return;

        const unsubscribe = onSnapshot(query(collection(db, 'items'), where('ownerId', '==', auth.currentUser!.uid)), (snapshot: { docs: any[]; }) => {
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
                    owner: owner?.data() as UserData || undefined,
                    isLost: itemDoc.get('isLost'),
                    imageUrl: itemDoc.get('imageUrl') || undefined,
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
        setSortedItemTiles(itemTiles.sort((a, b) => {
            return (a.isLost ? 0 : 1) - (b.isLost ? 0 : 1);
        }));
    }, [itemTiles]);
    
    useEffect(() => {
        if (!isLoggedIn) return;
        
        const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser!.uid), (snapshot) => {
            setUserData(snapshot.data() as UserData);
        });

        return unsubscribe;
    }, [isLoggedIn]);

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
            color: colors.text,
            fontSize: 14,
        },
        smallButton: {
            padding: 6,
            backgroundColor: colors.primary,
            borderRadius: 8,
        },
        smallButtonText: {
            color: colors.primaryContrastText,
        },
        userName: {
            fontSize: 25,
            fontWeight: 'bold',
            color: colors.text,
        },
        userStats: {
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            alignItems: 'center',
            flexGrow: 1,
            alignSelf: 'stretch', 
            marginTop: 5,
        },
        userStat: {
            flexDirection: 'column',
            alignItems: 'center',
            alignSelf: 'stretch',
            justifyContent: 'space-between',
            color: colors.text,
        },
        userStatLabel: {
            fontSize: 10,
            width: 60,
            textAlign: 'center',
            color: colors.text,
        },
        userStatValue: {
            fontSize: 24,
            textAlign: 'center',
            color: colors.text,
        },
        pfp: {
            width: 128,
            aspectRatio: 1/1,
            borderRadius: 999999,
            margin: 8,
            marginRight: 12,
            color: colors.text,
        },
        itemList: {
            width: '100%',
            flexGrow: 1,
            margin: 10,
            backgroundColor: colors.card,
        },
        itemListItem: {
            flex: 1,
            maxWidth: `33.33333%`,
            alignSelf: 'stretch',
            paddingBottom: 10,
            padding: 3,
        },
        itemListItemView: {
            flex: 1,
            backgroundColor: colors.card,
            alignSelf: 'stretch',
        },
        itemImage: {
            width: '100%',
            aspectRatio: 1,
        },
        itemTitle: {
            color: colors.text,
            fontWeight: '400',
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
            color: colors.contrastText,
        },
    }), [isDarkMode]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.horizontal, {alignSelf:'flex-start'}]}>
                <Image 
                    source={uriFrom(userData?.pfpUrl)} 
                    style={styles.pfp}
                    defaultSource={require('../assets/defaultpfp.jpg')}
                    />
                <View style={{flexGrow: 1, alignItems: 'flex-start'}}>
                    <Text style={styles.userName}>{userData?.name ?? 'Unknown user'}</Text>
                    <Text style={styles.text}>Waaagh</Text>
                    <View style={styles.userStats}>
                        <View style={styles.userStat}>
                            <Text style={styles.userStatLabel}>Times own item lost</Text>
                            <Text style={styles.userStatValue}>{userData?.timesLostItem || 'n/a'}</Text>
                        </View>
                        <View style={styles.userStat}>
                            <Text style={styles.userStatLabel}>Times item found for others</Text>
                            <Text style={styles.userStatValue}>{userData?.timesFoundOthersItem || 'n/a'}</Text>
                        </View>
                    </View>
                </View>
            </View>
            <View style={[styles.horizontal, {width: '100%', justifyContent: 'space-around'}]}>
                <PressableOpacity onPress={() => {}}>
                    <Text style={styles.addItemTitle}>My Posts</Text>
                </PressableOpacity>
                <PressableOpacity onPress={() => {}}>
                    <Text style={styles.addItemTitle}>a</Text>
                </PressableOpacity>
                <PressableOpacity onPress={() => {}}>
                    <Text style={styles.addItemTitle}>My Items</Text>
                </PressableOpacity>
            </View>
            
            <View style={[styles.horizontal, {width:'100%', alignItems: 'flex-end', justifyContent: 'space-between'}]}>
                <Text style={{fontSize: 16, color: colors.text, margin: 4}}>My Items</Text>
                <CoolButton 
                    leftIcon={{
                        name: 'plus',
                        type: 'material-community',
                        size: 20,
                    }}
                    onPress={() => navigation.navigate('My Stack', {screen: 'Add Item'})} 
                    style={{borderRadius: 999999}}
                    capStyle={{padding: 5}}/>
            </View>
            <View style={styles.itemList}>
                <FlatList
                    style={{flex: 1}}
                    contentContainerStyle={{minHeight: '100%'}}
                    keyExtractor={item => item._id.toString()}
                    ListEmptyComponent={
                        <View style={{height: '100%', alignContent: 'center', alignSelf: 'stretch', justifyContent: 'center'}}>
                            {isLoading ? <ActivityIndicator size='large' /> : <Icon name='cactus' type='material-community' color={colors.text} size={40} />}
                        </View>
                    }
                    data={sortedItemTiles}
                    renderItem={({ item }) => (
                        <View style={[styles.itemListItem, item.isLost ? {backgroundColor: 'red',} : null]}>
                            <PressableOpacity
                                key={item._id.toString()}
                                onPress={() => { navigation.navigate('My Stack', {screen: 'View Item', params: { itemId: item._id, itemName: item.name } }) }}>
                                <View style={styles.itemListItemView}>
                                    <Image source={uriFrom(item.imageUrl)} style={styles.itemImage} defaultSource={require('../assets/defaultimg.jpg')}/>
                                    <Text style={styles.itemTitle}>{item.name}</Text>
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

export default MyItemsScreen;