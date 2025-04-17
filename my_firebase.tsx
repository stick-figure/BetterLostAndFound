import { initializeApp, getApp } from 'firebase/app';
import { connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence, connectAuthEmulator } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import FirebaseFunctionsRateLimiter from "firebase-functions-rate-limiter";

import firebase from 'firebase/compat/app';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyC2HtgxSGmGNCBOOXPykFCD3ow5C_R61V0",
    authDomain: "better-lost-and-found.firebaseapp.com",
    projectId: "better-lost-and-found",
    storageBucket: "better-lost-and-found.appspot.com",
    messagingSenderId: "813333392211",
    appId: "1:813333392211:web:22508f2e3f863ea2528fa6",
    measurementId: "G-VCKQ10CL23"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

const db = initializeFirestore(app, {experimentalForceLongPolling: true});

if (process.env.FUNCTIONS_EMULATOR) {
    console.log("Connecting Firestore to Emulator...");
    connectFirestoreEmulator(db, "192.168.1.128",8080);
    connectAuthEmulator(auth, "http://192.168.1.128:9099");
}
/*
const perUserlimiter = FirebaseFunctionsRateLimiter.withRealtimeDbBackend(
    {
        name: "per_user_limiter",
        maxCalls: 2,
        periodSeconds: 15,
    },
    db,
);

exports.authenticatedFunction = 
  functions.https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.uid) {
        throw new functions.https.HttpsError(
            "failed-precondition",
            "Please authenticate",
        );
    }
    const uidQualifier = "u_" + context.auth.uid;
    const isQuotaExceeded = await perUserlimiter.isQuotaExceededOrRecordUsage(uidQualifier);
    if (isQuotaExceeded) {
        throw new functions.https.HttpsError(
            "failed-precondition",
            "Call quota exceeded for this user. Try again later",
        );
    }
  
    return { result: "Function called" };
});*/

export { db, auth };