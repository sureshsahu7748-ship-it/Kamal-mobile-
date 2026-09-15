import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAyiyB5KLjlqy1sDMA5Aunup9Tvyongqlg",
  authDomain: "kamal-mobile-d8ba5.firebaseapp.com",
  projectId: "kamal-mobile-d8ba5",
  storageBucket: "kamal-mobile-d8ba5.firebasestorage.app",
  messagingSenderId: "1065271731721",
  appId: "1:1065271731721:web:e4163af79a3609a50cbad8",
  measurementId: "G-97G08P4CBH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth & Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

// आपकी User UID
export const OWNER_UIDS = [
  "SC8EYJpqU3UV30QsHGlWSbgHRuJ3"
];
