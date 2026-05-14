import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Debug logic to help user
if (import.meta.env.DEV) {
  console.log("Firebase API Key present:", !!firebaseConfig.apiKey);
  if (!firebaseConfig.apiKey) {
    console.warn("VITE_FIREBASE_API_KEY is missing from environment/secrets.");
  }
}

// Check if Firebase is properly configured - check for both existence and placeholder
export const isFirebaseConfigured = !!firebaseConfig.apiKey && 
                                   firebaseConfig.apiKey !== "" && 
                                   firebaseConfig.apiKey !== "undefined" &&
                                   !firebaseConfig.apiKey.includes("PLACEHOLDER");

let auth: any = null;
let db: any = null;

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
  }
}

export { auth, db };

export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = () => {
  if (!auth) throw new Error("Firebase not configured");
  return signInWithPopup(auth, googleProvider);
};

export const saveUserRegistration = async (user: User) => {
  if (!db) return;
  try {
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("Error saving user:", error);
  }
};
