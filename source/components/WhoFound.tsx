import { useEffect, useMemo, useState } from "react";
import { useColorScheme, StyleSheet, SafeAreaView, ActivityIndicator, FlatList, Image, Text, View } from "react-native";
import { DarkThemeColors, LightThemeColors } from "../assets/Colors";
import { MyStackScreenProps } from "../navigation/Types";
import { Icon } from "react-native-elements";
import { Swipeable } from "react-native-gesture-handler";
import { auth, db } from "../../ModularFirebase";
import { PressableOpacity } from "../hooks/MyElements";
import { ChatRoomTile, ItemData, LostPostResolveReasons, PostData, RoomData, UserData } from "../assets/Types";
import { popupOnError } from "./Error";
import { doc, runTransaction, serverTimestamp, updateDoc } from "firebase/firestore";


export function WhoFoundScreen( {navigation, route}: MyStackScreenProps<'Who Found'> ) {
    const [post, setPost] = useState<PostData>();
    const [item, setItem] = useState<ItemData>();
    const [owner, setOwner] = useState<UserData>();
    const [users, setUsers] = useState<UserData[]>();
    const [isNavigating, setIsNavigating] = useState(false);
    
    const isDarkMode = useColorScheme() === 'dark';
    const colors = isDarkMode ? DarkThemeColors : LightThemeColors;
    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.background,
        },
        text: {
            color: colors.text,
        },
        chatListContainer: {
            width: '90%',
            height: 'auto',
            backgroundColor: colors.card,
            alignSelf: 'center',
        },
        chatItem: {
            alignItems: 'center',
            alignSelf: 'stretch',
            padding: 10,
            flexDirection: 'row',
            backgroundColor: colors.card,
        },
        chatThumbnail: {
            width: 40,
            aspectRatio: 1,
            borderRadius: 99999,
            marginRight: 12,
        },
        chatTitle: {
            fontSize: 18,
            color: colors.text,
            fontWeight: '600',
        },
        rightAction: {
            backgroundColor: 'blue',
        },
        rightActionText: {
            fontSize: 16,
            fontWeight: '600',
        },
    }), [isDarkMode]);

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

    useEffect(popupOnError(navigation, () => {
        if (!isLoggedIn) return;

        setPost(route.params!.post);
        setItem(route.params!.item);
        setOwner(route.params!.owner);
        setUsers(route.params!.users);

        if (route.params.post?.roomIds === undefined) return;
    }), [isLoggedIn]);    

    const resolvePost = popupOnError(navigation, async (user: UserData) => {
        if (!user) throw new Error('User is undefined');
        if (!owner) throw new Error('Owner is undefined');
        if (!post) throw new Error('Post is undefined');
        if (!item) throw new Error('Item is undefined');

        await runTransaction(db, async (transaction) => {
            const userSnapshot = await transaction.get(doc(db, 'users', user.id));
            const ownerSnapshot = await transaction.get(doc(db, 'users', owner.id));
            
            const postUpdate = {
                resolved: true,
                resolveReason: LostPostResolveReasons.FOUND_ITEM,
                resolvedAt: serverTimestamp(),
                foundBy: user.id,
            };
            transaction.update(doc(db, 'posts', post.id), postUpdate);

            const itemUpdate = {
                isLost: false,
            }
            transaction.update(doc(db, 'items', item.id), itemUpdate);

            const userUpdate = {
                timesFoundOthersItem: userSnapshot.get('timesFoundOthersItem') ? userSnapshot.get('timesFoundOthersItem') + 1 : undefined,
            }
            transaction.update(doc(db, 'users', user.id), userUpdate);

            const ownerUpdate = {
                timesOthersFoundItem: ownerSnapshot.get('timesOthersFoundItem') ? ownerSnapshot.get('timesOthersFoundItem') + 1 : undefined,
            }
            transaction.update(doc(db, 'users', owner.id), ownerUpdate);
        });
    });

    return (
        <FlatList
            keyExtractor={(item) => item.id}
            scrollEnabled={true}
            data={users}
            style={styles.chatListContainer}
            renderItem={({ item }) => {                
                const renderLeftAction = (id?: string) => {
                    return (
                        <View>

                        </View>
                    );
                }

                const renderRightAction = (id?: string) => {
                    return (
                        <View>

                        </View>
                    );
                }

                return (
                    <Swipeable 
                        containerStyle={{borderTopWidth: 4, borderColor: colors.border}} 
                        renderLeftActions={() => renderLeftAction()}
                        renderRightActions={() => renderRightAction()}>
                        <View
                            style={{backgroundColor: colors.card}}>
                            <PressableOpacity
                                style={styles.chatItem}
                                onPress={() => resolvePost(item)}
                                disabled={isNavigating}>
                                <Image 
                                    style={styles.chatThumbnail}
                                    source={{uri: item.pfpUrl || undefined}}
                                    defaultSource={require('../assets/defaultpfp.jpg')} />
                                <Text style={styles.chatTitle}>{item.name || 'Unknown user'}</Text>
                            </PressableOpacity>
                        </View>
                    </Swipeable>
                );
            }}
            ListEmptyComponent={
                <View style={{height: 100}}>
                    <View style={{width: '100%', height: '100%', alignItems: 'stretch', justifyContent: 'center'}}>
                        <Icon name='cactus' type='material-community' size={42} color={colors.text} />
                        <Text style={[styles.text, {alignSelf: 'center'}]}>No one has set up a chat with you yet</Text>
                    </View>
                </View>
            }
                />
            
    );
}

export default WhoFoundScreen;