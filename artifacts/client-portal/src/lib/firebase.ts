import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDqw6ik8Gf8rAOhcSDsw9a80Xf95H04CuM",
  authDomain: "kusms-leo-club.firebaseapp.com",
  projectId: "kusms-leo-club",
  storageBucket: "kusms-leo-club.firebasestorage.app",
  messagingSenderId: "747401129626",
  appId: "1:747401129626:web:3bc712c8ca30605b82b923",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
