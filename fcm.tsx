import { getMessaging } from 'firebase/messaging';
import { messaging } from './ModularFirebase';

const fcm = messaging;

fcm
fcm.((message) => {
  console.log('Message opened app:', message);
});

fcm.onMessageReceived((message) => {
  console.log('Message received:', message);
});

export default fcm;