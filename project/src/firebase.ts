// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBH2cfQxaQLvKhYrQ6dYm4vcuiw0Xbv17Q",
  authDomain: "new-sankalpa-app.firebaseapp.com",
  projectId: "new-sankalpa-app",
  storageBucket: "new-sankalpa-app.firebasestorage.app",
  messagingSenderId: "484434742594",
  appId: "1:484434742594:web:220653dc47b96e9e254cdb",
  measurementId: "G-WWB92V7ZP4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Enable Offline Persistence for Firestore with better error handling
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
  } else if (err.code === 'unimplemented') {
    console.warn("The current browser does not support all of the features required to enable persistence");
  } else {
    console.warn("Failed to enable persistence:", err);
  }
});

// Export services
export { app, auth, db, storage };