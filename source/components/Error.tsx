import React, {useState} from 'react';
import {Button, StyleSheet, Text, View} from 'react-native';


export function ErrorScreen({navigation, route}: {navigation: any, route: any}) {
    return (
        <View style={styles.container}>
            <Text>{route.params!.code}</Text>
            <Text>{route.params!.message}</Text>
            <View style={styles.button}>
                <Button
                title="Go Back"
                onPress={() => navigation.goBack()} />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {

    },
    button: {
        
    }
});

export default ErrorScreen;

