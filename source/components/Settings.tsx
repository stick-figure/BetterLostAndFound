import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { auth, db } from '../../ModularFirebase';
import { deleteUser, signOut } from 'firebase/auth';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { collection, deleteDoc, doc, getDocs, Query, query, where, writeBatch } from 'firebase/firestore';
import { CommonActions } from '@react-navigation/native';
import { deleteObject } from 'firebase/storage';
import SafeAreaView from 'react-native-safe-area-view';
import { lightThemeColors } from '../assets/Colors';

export function SettingsScreen({ navigation }: { navigation: any }) {

    const signOutNow = () => {
//        navigation.navigate('Loading');
        signOut(auth).then(() => {
            // Sign-out successful.
            navigation.replace('My Stack', {screen: 'Login'});
//            navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
        }).catch((error) => {
            // An error happened.
            const errorCode = error.code;
            const errorMessage = error.message;
            navigation.navigate('Error', { code: errorCode, message: errorMessage });
        });
    }

    
    const deleteFirestoreRecursively = async (query: Query) => {
        const snapshot = await getDocs(query);
        const chunks = []
        for (let i = 0; i < snapshot.docs.length; i += 500) {
            chunks.push(snapshot.docs.slice(i, i + 500));
        }
        for (let i = 0; i < chunks.length; i++) {
            let batch = writeBatch(db);

            chunks[i].forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
        }
        console.log('deleted');
    }

    const deleteStorageRecursively = async (query: Query) => {
        deleteObject
    }

    const deleteAccount = () => {

        navigation.navigate('Loading');
        deleteFirestoreRecursively(query(collection(db, 'posts'), where('authorId', '==', auth.currentUser!.uid))).then(() => {
            return deleteFirestoreRecursively(query(collection(db, 'items'), where('ownerId', '==', auth.currentUser!.uid)));
        }).then(() => {
            return deleteDoc(doc(db, 'users', auth.currentUser!.uid));
        }).then(() => {
            return deleteUser(auth.currentUser!)
        }).then(() => {
            navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
        }).catch((error) => {
            // An error happened.
            const errorCode = error.code;
            const errorMessage = error.message;
            navigation.navigate('Error', {code: errorCode, message: errorMessage});
        });
    }

    const promptDeleteAccount = () => {
        Alert.alert('Delete Account?', 'You cannot undo this action!', [
            {
                text: 'Cancel',
                onPress: () => console.log('Cancel Pressed'),
                style: 'cancel',
            },
            { 
                text: 'OK', 
                onPress: deleteAccount, 
                style: 'destructive'  
            },
        ]);
    }

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

    return (
        <SafeAreaView>
            <TouchableOpacity
                onPress={signOutNow}>
                <Text>Sign out now</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={promptDeleteAccount}>
                <Text style={{color: lightThemeColors.redder}}>delete account</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

