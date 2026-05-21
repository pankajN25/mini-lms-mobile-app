import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyC_bBe-zNaRbJjwLPrZ-O1gYRwzTRrk97g',
  authDomain: 'minilms-fc4f5.firebaseapp.com',
  projectId: 'minilms-fc4f5',
  storageBucket: 'minilms-fc4f5.firebasestorage.app',
  messagingSenderId: '350645055329',
  appId: '1:350645055329:web:479b334a070b03cca6df20',
};

const app = initializeApp(firebaseConfig);

// Use AsyncStorage so the session survives app restarts on React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
