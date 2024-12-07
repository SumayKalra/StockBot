import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC12S5Bc0H3QLg7JHN8mmClAbrb0x1hNPM",
  authDomain: "stocks-d4bba.firebaseapp.com",
  projectId: "stocks-d4bba",
  storageBucket: "stocks-d4bba.firebasestorage.app",
  messagingSenderId: "254233724833",
  appId: "1:254233724833:web:e2cb2d5e4ff88d02046de0",
  measurementId: "G-REG00XTRS2"
};
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and export it
export const auth = getAuth(app);

export default app;