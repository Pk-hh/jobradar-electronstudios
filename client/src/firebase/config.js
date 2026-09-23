import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD9fi54eGPVbI3xEXCNXmHPmRvC-jynMwM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "jobradar-d728b.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "jobradar-d728b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "jobradar-d728b.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "465569397337",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:465569397337:web:8f51485f39d39994588f48",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-92NCBGD4E9"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;
