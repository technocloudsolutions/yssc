import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC3o_bWqNFC7_ctXC-rc_ssaKDlqYxfzQo",
  authDomain: "yssc-c23bc.firebaseapp.com",
  projectId: "yssc-c23bc",
  storageBucket: "yssc-c23bc.firebasestorage.app",
  messagingSenderId: "67578126534",
  appId: "1:67578126534:web:66992e5608a084679eb7c7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);