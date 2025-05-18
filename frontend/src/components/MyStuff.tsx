import { query, collection, where, doc, getDocs, setDoc, DocumentData, onSnapshot, DocumentSnapshot, getDoc } from 'firebase/firestore';
import React, { SetStateAction, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Image, StyleSheet, Text, useColorScheme, useWindowDimensions, View } from 'react-native';
import SafeAreaView, { SafeAreaProvider } from 'react-native-safe-area-view';
import { auth, db } from '../../MyFirebase';
import { DarkThemeColors, LightThemeColors } from '../assets/Colors';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import { CoolButton, PressableOpacity } from '../hooks/MyElements';
import { Icon } from 'react-native-elements';
import { navigateToErrorScreen } from './Error';
import { UserData } from '../assets/Types';
import { HomeTabScreenProps } from '../navigation/Types';
import { uriFrom } from '../utils/SomeFunctions';
import { TabView, SceneMap } from 'react-native-tab-view';
import MyChatRoomsRoute from './MyChatRooms';
import MyItemsRoute from './MyItems';
import MyPostsRoute from './MyPosts';

interface ItemTile {
    _id: string,
    name: string,
    description: string,
    owner?: UserData,
    isLost: boolean,
    imageUrl?: string,
}

const renderScene = SceneMap({
    items: MyItemsRoute,
    posts: MyPostsRoute,
    chatRooms: MyChatRoomsRoute,
});
const routes = [
    { key: 'items', title: 'Items' },
    { key: 'posts', title: 'Posts' },

    { key: 'chatRooms', title: 'Chats' },
];

export function MyStuffScreen({navigation, route}: HomeTabScreenProps<'My Stuff'>) {
    const [itemTiles, setItemTiles] = useState<ItemTile[]>([]);
    const [sortedItemTiles, setSortedItemTiles] = useState<ItemTile[]>([]);

    const layout = useWindowDimensions();
    const [index, setIndex] = useState(0);

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
    

    const [userData, setUserData] = useState<UserData>();
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
    }), [isDarkMode]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.horizontal, {alignSelf:'flex-start', padding: 10}]}>
                <Image 
                    source={uriFrom(userData?.pfpUrl)} 
                    style={styles.pfp}
                    defaultSource={require('../assets/images/defaultpfp.jpg')}
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
            <View style={{ flex: 1 }}>
                <TabView
                    navigationState={{ index, routes }}
                    renderScene={renderScene}
                    onIndexChange={setIndex}
                    initialLayout={{ width: layout.width }}
                />
            </View>
        </SafeAreaView>
    );
}

export default MyStuffScreen;