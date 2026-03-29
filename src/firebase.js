import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyABtAXd9L-WZP1tDaVu0I01mKRHpelgdtg",
  authDomain: "herb-83fce.firebaseapp.com",
  projectId: "herb-83fce",
  storageBucket: "herb-83fce.firebasestorage.app",
  messagingSenderId: "1018964733625",
  appId: "1:1018964733625:web:e9b2651405d4674fb03568",
  measurementId: "G-7W0S35TT65"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);