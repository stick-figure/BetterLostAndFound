/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from 'firebase-functions/v2/https';
 * import {onDocumentWritten} from 'firebase-functions/v2/firestore';
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest, onCall} from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';

import {onDocumentWritten} from 'firebase-functions/v2/firestore';
import { initializeApp } from 'firebase-admin/app';
import { FirebaseAuthError, getAuth } from 'firebase-admin/auth';
import { getDownloadURL, getStorage } from 'firebase-admin/storage'; 
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import firebaseConfig from '../../FirebaseConfig';

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//     logger.info('Hello logs!', {structuredData: true});
//     response.send('Hello from Firebase!');
// });

interface UserData {
    id: string,
    name: string,
    email: string,
    phoneNumber: string | null,
    pfpUrl: string | null,
    emailVertified: boolean,
    createdAt: Timestamp,
    timesOwnItemLost: number,
    timesOwnItemFound: number,
    timesOthersItemFound: number,
    blockedList: string[],
    friendsList: string[],
    privateStats: boolean,
}
/*
export const updatePfpRef = onDocumentWritten("users/{docId}", (event) => {
    if (event.data?.before.get('pfpRef') != event.data?.after.get('pfpRef')) {
        
    }
    
});
 

export const createUser = onCall(async (request, response) => {
    try {
        const db = getFirestore();
        const auth = getAuth();
        const storage = getStorage();
        const bucket = storage.bucket(firebaseConfig.storageBucket);
        
        const userRef = db.collection('users').doc();
        
        try {
            const emailUser = await auth.getUserByEmail(request.data.email);
            throw new Error(`User ${emailUser} already exists.`);
        } catch (error) {
            if (!(error instanceof FirebaseAuthError) || error.code !== 'auth/user-not-found') {
                throw error;
            }
        }
        if (request.data.phoneNumber !== undefined) {
            try {
                const phoneNumberUser = await auth.getUserByPhoneNumber(request.data.phoneNumber);
                throw new Error(`User ${phoneNumberUser} already exists.`);
            } catch (error) {
                if (!(error instanceof FirebaseAuthError) || error.code !== 'auth/user-not-found') {
                    throw error;
                }
                
            }
        }

        const result = await db.runTransaction(async (transaction) => {
            const userData: UserData = {
                id: userRef.id,
                name: request.data.name,
                email: request.data.email,
                pfpUrl: null,
                phoneNumber: request.data.phoneNumber ?? null,
                emailVertified: false,
                createdAt: Timestamp.now(),
                timesOwnItemLost: 0,
                timesOwnItemFound: 0,
                timesOthersItemFound: 0,
                blockedList: [],
                friendsList: [],
                privateStats: false,
            };

            if (request.data.pfpUri) {
                const pfpFile = bucket.file('images/pfps/' + userRef.id);
                await pfpFile.get({
                    autoCreate: true,
                });

                await bucket.upload(request.data.pfpUri, {
                    destination: pfpFile,
                    onUploadProgress: (event) => {
                        
                    },
                });

                const pfpFileGet = await pfpFile.get();
                pfpFileGet[0].publicUrl({
                    
                })
            }
            
            transaction.set(userRef, userData);
            
            return userData;
        });

        return await auth.createUser({
            uid: userRef.id,
            displayName: (result as UserData).name,
            email: (result as UserData).email,
            password: request.data.password,
            photoURL: (result as UserData).pfpUrl ?? null,
            emailVerified: false,
            phoneNumber: (result as UserData).phoneNumber ?? null,
        });

    } catch (error) {
        console.warn(error);
        return await error;
    }
});
/*
export const uploadImage = onCall(async (request, response) => {
    return new Promise(async (resolve, reject) => {
        try {
            const imageRef = bucket.upload();
            await bucket.upload(request.data.path, {
                
            });

            await uploadBytes(imageRef, blob)
            const url = await getDownloadURL(imageRef!);
            
            console.log(url);
            resolve(url);
            return;
        } catch (err) {
            reject(err);
            return;
        }
    });
});*/
