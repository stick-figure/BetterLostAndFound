import { useRealm, useQuery, useUser } from '@realm/react';
import { Item } from './ItemSchema';
import React, { useEffect, useState } from "react";
import { PermissionsAndroid, Text } from 'react-native';
import { View } from 'react-native';

export const requestLocationPermission = async () => {
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'Geolocation Permission',
                    message: 'Can we access your location?',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                },
        );
        console.log('granted', granted);
        if (granted === 'granted') {
            console.log('You can use Geolocation');
            return true;
        } else {
            console.log('You cannot use Geolocation');
            return false;
        }
    } catch (err) {
        return false;
    }
};

export function InputtedItemCodeView({ route, navigation }: { route: any, navigation: any }) {
    const realm = useRealm();
    const items = useQuery(Item).sorted('_id');
    const user = useUser();
    
    const [location, setLocation] = useState(false);
    
    const { code } = route.params;

    const item = items.filtered('code == $0', parseInt(code));

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text>yee</Text>
        </View>
    );
}

