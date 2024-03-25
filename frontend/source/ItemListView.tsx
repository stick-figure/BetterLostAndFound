import React, { useCallback, useState, useEffect } from 'react';
import { BSON } from 'realm';
import { useUser, useRealm, useQuery } from '@realm/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Alert, FlatList, StyleSheet, Switch, Text, View } from 'react-native';
import { Button, Overlay, ListItem, ScreenWidth } from '@rneui/base';
import { dataExplorerLink } from '../atlasConfig.json';

import { CreateToDoPrompt } from './CreateToDoPrompt';

import { Item } from './ItemSchema';
import { colors } from './Colors';

// If you're getting this app code by cloning the repository at
// https://github.com/mongodb/ template-app-react-native-todo,
// it does not contain the data explorer link. Download the
// app template from the Atlas UI to view a link to your data
const dataExplorerMessage = `View your data in MongoDB Atlas: ${dataExplorerLink}.`;

const itemSubscriptionName = 'items';
const ownItemsSubscriptionName = 'ownItems';

export function ItemListView() {
    const realm = useRealm();
    const items = useQuery(Item).sorted('_id').sorted('isLost', true);
    const user = useUser();

    const [showNewItemOverlay, setShowNewItemOverlay] = useState(false);

    // This state will be used to toggle between showing all items and only showing the current user's items
    // This is initialized based on which subscription is already active
    const [showAllItems, setShowAllItems] = useState(
        !!realm.subscriptions.findByName(itemSubscriptionName),
    );

    // This effect will initialize the subscription to the items collection
    // By default it will filter out all items that do not belong to the current user
    // If the user toggles the switch to show all items, the subscription will be updated to show all items
    // The old subscription will be removed and the new subscription will be added
    // This allows for tracking the state of the toggle switch by the name of the subscription
    useEffect(() => {
        if (showAllItems) {
            realm.subscriptions.update(mutableSubs => {
                mutableSubs.removeByName(ownItemsSubscriptionName);
                mutableSubs.add(realm.objects(Item), { name: itemSubscriptionName });
            });
        } else {
            realm.subscriptions.update(mutableSubs => {
                mutableSubs.removeByName(itemSubscriptionName);
                mutableSubs.add(
                    realm.objects(Item).filtered(`owner_id == "${user?.id}"`),
                    { name: ownItemsSubscriptionName },
                );
            });
        }
    }, [realm, user, showAllItems]);

    // createItem() takes in a description and then creates an Item object with that description
    const createItem = useCallback(
        ({ name, description }: { name: string, description: string }) => {
            // if the realm exists, create an Item
            realm.write(() => {
                console.log(dataExplorerMessage);

                return new Item(realm, {
                    name,
                    description,
                    owner_id: user?.id,
                });
            });
        },
        [realm, user],
    );

    // deleteItem() deletes an Item with a particular _id
    const deleteItem = useCallback(
        (id: BSON.ObjectId) => {
            // if the realm exists, get the Item with a particular _id and delete it
            const item = realm.objectForPrimaryKey(Item, id); // search for a realm object with a primary key that is an objectId
            if (item) {
                if (item.owner_id !== user?.id) {
                    Alert.alert("You can't delete someone else's item!");
                } else {
                    realm.write(() => {
                        realm.delete(item);
                    });
                    console.log(dataExplorerMessage);
                }
            }
        },
        [realm, user],
    );
    // toggleItemIsLost() updates an Item with a particular _id to be 'completed'
    const toggleItemIsLost = useCallback(
        (id: BSON.ObjectId) => {
            // if the realm exists, get the Item with a particular _id and update it's 'isLost' field
            const item = realm.objectForPrimaryKey(Item, id); // search for a realm object with a primary key that is an objectId
            if (item) {
                if (item.owner_id !== user?.id) {
                    Alert.alert("You can't modify someone else's item!");
                } else {
                    realm.write(() => {
                        item.isLost = !item.isLost;
                    });
                    console.log(dataExplorerMessage);
                }
            }
        },
        [realm, user],
    );
    return (
        <SafeAreaProvider>
            <View style={styles.viewWrapper}>
                <View style={styles.toggleRow}>
                    <Text style={styles.toggleText}>Show All Items</Text>
                    <Switch
                        trackColor={{ true: '#00ED64' }}
                        onValueChange={() => {
                            if (realm.syncSession?.state !== 'active') {
                                Alert.alert(
                                    'Switching subscriptions does not affect Realm data when the sync is offline.',
                                );
                            }
                            setShowAllItems(!showAllItems);
                        }}
                        value={showAllItems}
                    />
                </View>
                <Overlay
                    isVisible={showNewItemOverlay}
                    overlayStyle={styles.overlay}
                    onBackdropPress={() => setShowNewItemOverlay(false)}>
                    <CreateToDoPrompt
                        onSubmit={({ name, description }) => {
                            setShowNewItemOverlay(false);
                            createItem({ name, description });
                        }}
                    />
                </Overlay>
                <FlatList
                    keyExtractor={item => item._id.toString()}
                    data={items}
                    renderItem={({ item }) => (
                        <View>
                            {item.owner_id === user?.id ?
                                <ListItem.Swipeable key={`${item._id}`} bottomDivider topDivider
                                    leftWidth={120}
                                    rightWidth={120}
                                    leftContent={(action) => (
                                        <Button
                                            title={item.isLost ? "Mark as found" : "Mark as missing"}
                                            type="clear"
                                            onPress={() => toggleItemIsLost(item._id)}
                                        />
                                    )}
                                    rightContent={(action) => (
                                        <Button
                                            title="Delete"
                                            type="clear"
                                            onPress={() => deleteItem(item._id)}
                                        />
                                    )}>
                                    <ListItem.Title style={styles.itemTitle}>
                                        {item.name}
                                    </ListItem.Title>
                                    <ListItem.Subtitle style={styles.itemSubtitle}>
                                        <Text>{item.owner_id === user?.id ? '(mine)' : ''}</Text>
                                    </ListItem.Subtitle>
                                    <ListItem.Content>
                                        <Text style={styles.itemContent}>{item.code}</Text>
                                    </ListItem.Content>
                                    <ListItem.Chevron />
                                </ListItem.Swipeable> :

                                <ListItem key={`${item._id}`} bottomDivider topDivider>
                                    <ListItem.Title style={styles.itemTitle}>
                                        {item.name}
                                    </ListItem.Title>
                                    <ListItem.Content>
                                        <Text>{item.description}</Text>
                                    </ListItem.Content>
                                </ListItem>
                            }
                        </View>
                    )}
                />
                <Button
                    title="Add Item"
                    buttonStyle={styles.addToDoButton}
                    onPress={() => setShowNewItemOverlay(true)}
                />
            </View>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    viewWrapper: {
        flex: 1,
    },
    sectionContainer: {
        marginTop: 32,
        paddingHorizontal: 24,
    },
    addToDoButton: {
        backgroundColor: colors.primary,
        borderRadius: 4,
        margin: 5,
    },
    completeButton: {
        backgroundColor: colors.primary,
        borderRadius: 4,
        margin: 5,
    },
    showCompletedButton: {
        borderRadius: 4,
        margin: 5,
    },
    showCompletedIcon: {
        marginRight: 5,
    },
    itemTitle: {
        flex: 1,
    },
    itemSubtitle: {
        color: '#979797',
        flex: 0,
    },
    itemContent: {
        color: '#979797',
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    toggleText: {
        flex: 1,
        fontSize: 16,
    },
    overlay: {
        backgroundColor: 'white',
    },
});
