 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAIGqg5dmdDVAzv7x7sMDOfUcxj6iN3Ibw",
  authDomain: "kamal-mobile-d8ba5.firebaseapp.com",
  projectId: "kamal-mobile-d8ba5",
  storageBucket: "kamal-mobile-d8ba5.firebasestorage.app",
  messagingSenderId: "1065271731721",
  appId: "1:1065271731721:web:e4163af79a3609a50cbad8"
};

export const OWNER_UID = "M11a6GJoASSHp4ejxvcSKfCc5QO2";
export const OWNER_UIDS = [OWNER_UID];

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
