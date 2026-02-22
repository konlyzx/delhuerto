import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBpfaa5IdVe_aQWi0gseoR1gOI6jRM1SZk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "delhhuerto.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "delhhuerto",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "delhhuerto.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "883087072250",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:883087072250:web:2270195c5117f71ef22243"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
