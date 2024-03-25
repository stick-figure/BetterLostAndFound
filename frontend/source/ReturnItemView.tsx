import React, { useCallback, useState, useEffect } from 'react';
import { BSON } from 'realm';
import { useUser, useRealm, useQuery } from '@realm/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Alert, FlatList, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Button, Overlay, ListItem, ScreenWidth } from '@rneui/base';
import { dataExplorerLink } from '../atlasConfig.json';

import { Item } from './ItemSchema';
import { colors } from './Colors';
import { Camera } from 'react-native-vision-camera';
import { useRoute } from '@react-navigation/native';

// If you're getting this app code by cloning the repository at
// https://github.com/mongodb/ template-app-react-native-todo,
// it does not contain the data explorer link. Download the
// app template from the Atlas UI to view a link to your data
const dataExplorerMessage = `View your data in MongoDB Atlas: ${dataExplorerLink}.`;

const requestCameraPermission = async () => {
    try {
        const newCameraPermission = await Camera.requestCameraPermission();
        return newCameraPermission;
    } catch (err) {
        console.warn(err);
    }
};

const itemSubscriptionName = 'items';
const ownItemsSubscriptionName = 'ownItems';

export function ReturnItemView({ navigation }: { navigation: any }) {
    const realm = useRealm();
    const items = useQuery(Item).sorted('_id');
    const user = useUser();
    const route = useRoute();
    
    const [codeInput, onChangeCodeInput] = React.useState("");
    
    useEffect(() => {
        // write your code here, it's like componentWillMount

    }, [])

    return (
        <View>
            <Button
                title="Scan Code"
                buttonStyle={styles.scanButton}
                onPress={() => {
                    
                    if (Camera.getCameraPermissionStatus() != "granted") {
                        requestCameraPermission();
                    } else {
                        console.log(route);
                        navigation.navigate("ReturnItemNav", {screen: "ScanCode"});
                    }
                }}
            />
            <TextInput
                keyboardType="numeric"
                onChangeText={onChangeCodeInput}
                onSubmitEditing={() => {
                    if (codeInput.length >= 6) {
                        navigation.navigate("ReturnItemNav", {screen: "InputtedCode", params: {code: codeInput} });
                    }
                }}
                value={codeInput}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    scanButton: {
        backgroundColor: colors.primary,
        borderRadius: 4,
        margin: 5,
    },
});