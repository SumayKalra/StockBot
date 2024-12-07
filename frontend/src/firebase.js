import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// If you use Firestore or other services, import them as needed
// import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "stocks-d4bba",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "254233724833",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// export const db = getFirestore(app); // If needed
