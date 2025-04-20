/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest, onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import {onDocumentWritten} from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDownloadURL, getStorage } from "firebase-admin/storage"; 
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import firebaseConfig from "../../FirebaseConfig";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//     logger.info("Hello logs!", {structuredData: true});
//     response.send("Hello from Firebase!");
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

export const createUser = onCall(async (request, response) => {
    try {
        const db = getFirestore();
        const auth = getAuth();
        const storage = getStorage();
        const bucket = storage.bucket(firebaseConfig.storageBucket);

        const userRef = db.collection("users").doc();
        const result = await db.runTransaction((transaction) => {
            return new Promise(async (resolve, reject) => {
                try {
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
                    
                    transaction.set(userRef, userData);
                    
                    resolve(userData);
                } catch (error) {
                    reject(error);
                }
                
            });
        });
        
        await auth.createUser({
            displayName: (result as UserData).name,
            email: (result as UserData).email,
            password: request.data.password,
            photoURL: (result as UserData).pfpUrl ?? null,
            emailVerified: false,
            phoneNumber: (result as UserData).phoneNumber ?? null,
            uid: userRef.id,
        });

    } catch (error) {
        
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
