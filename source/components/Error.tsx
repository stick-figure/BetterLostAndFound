import React, { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { lightThemeColors } from '../assets/Colors';


export function ErrorScreen({ navigation, route }: { navigation: any, route: any }) {
    return (
        <View style={styles.container}>
            <Text>{route.params!.code}</Text>
            <Text>{route.params!.message}</Text>
            <View style={styles.button}>
                <Button
                    title="erm what the sigma"
                    onPress={() => navigation.goBack()} />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: lightThemeColors.background,
    },
    button: {

    }
});

export default ErrorScreen;

