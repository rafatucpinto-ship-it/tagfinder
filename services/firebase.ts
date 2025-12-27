import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAtnew1XD5kFsAPExzApUxBQWJ9h34DzkU",
  authDomain: "localfinder-f107b.firebaseapp.com",
  projectId: "localfinder-f107b",
  storageBucket: "localfinder-f107b.firebasestorage.app",
  messagingSenderId: "200254806204",
  appId: "1:200254806204:web:dac457c424a8bf1abbd8b9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);