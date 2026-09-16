 // =====================================================================
// FIREBASE CONFIG - यहां अपने Firebase project की details डालें
// (Firebase Console > Project Settings > General > "Your apps" > Web app)
// SETUP_GUIDE.md में step-by-step तरीका दिया है
// =====================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
// नोट: फोटो के लिए अब Firebase Storage नहीं, Cloudinary (मुफ़्त, कार्ड नहीं चाहिए) इस्तेमाल हो रहा है।

const firebaseConfig = {
  apiKey: "AIzaSyAIGqg5dmdDVAzv7x7sMDOfUcxj6iN3Ibw",
  authDomain: "kamal-mobile-d8ba5.firebaseapp.com",
  projectId: "kamal-mobile-d8ba5",
  storageBucket: "kamal-mobile-d8ba5.firebasestorage.app",
  messagingSenderId: "1065271731721",
  appId: "1:1065271731721:web:e4163af79a3609a50cbad8"
};

// दुकान के owner का Firebase Authentication UID यहां डालें
// (Firebase Console > Authentication > Users > UID column से copy करें)
// जब तक यह सही नहीं भरा होगा, admin panel में login होने पर भी
// data बदलने की permission नहीं मिलेगी (security rules इसी UID को चेक करती हैं)
export const OWNER_UID = "SC8EYJpqU3UV30QsHGlWSbgHRuJ3";

// भविष्य में अगर किसी स्टाफ/परिवार के सदस्य को भी admin access देना हो,
// तो उनका Authentication user बनाकर उनका UID यहां लिस्ट में जोड़ दें (कॉमा से अलग करके)।
// नोट: नया UID जोड़ने के बाद Firestore Rules में भी वही UID जोड़ना होगा (SETUP_GUIDE.md देखें)।
export const OWNER_UIDS = [OWNER_UID];

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
