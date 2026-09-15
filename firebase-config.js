 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

// फ़ायरबेस प्रोजेक्ट कॉन्फ़िगरेशन
const firebaseConfig = {
  apiKey: "AIzaSyAIGqg5dmdDVAzv7x7sMDOfUcxj6iN3Ibw",
  authDomain: "kamal-mobile-d8ba5.firebaseapp.com",
  projectId: "kamal-mobile-d8ba5",
  storageBucket: "kamal-mobile-d8ba5.firebasestorage.app",
  messagingSenderId: "1065271731721",
  appId: "1:1065271731721:web:e4163af79a3609a50cbad8"
};

// आपकी नई UID
export const OWNER_UID = "sNvcKVBpCHaxtYj2LpEAsHrqIsq1";
export const OWNER_UIDS = [OWNER_UID];

// फ़ायरबेस ऐप्स और सर्विसेज़ इनिशियलाइज़ेशन
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
