import { initializeApp, getApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

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

export { db, auth };