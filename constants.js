 export const WHATSAPP_NUMBER = "919981176713";

// फोटो अपलोड के लिए Cloudinary (मुफ़्त, कार्ड नहीं चाहिए) — SETUP_GUIDE.md देखें
export const CLOUDINARY_CLOUD_NAME = "kjj21lgx";
export const CLOUDINARY_UPLOAD_PRESET = "Kamal_Mobile";


// रिपेयर की समस्याएं - value वही रहना चाहिए जो <select id="repairIssue"> में options में है
// docId सिर्फ Firestore में document का नाम है (स्लैश जैसे चिन्ह डॉक्यूमेंट ID में नहीं चल सकते)
export const REPAIR_ISSUES = [
  { value: "Screen Replacement", label: "फूटी स्क्रीन / टच खराब", docId: "screen_replacement" },
  { value: "Battery Problem", label: "बैटरी जल्दी खत्म होना / फूलना", docId: "battery_problem" },
  { value: "Charging Issue", label: "चार्जिंग पिन / स्लो चार्जिंग", docId: "charging_issue" },
  { value: "Water Damage", label: "पानी में गिरा फोन", docId: "water_damage" },
  { value: "Speaker/Mic", label: "आवाज नहीं आना / स्पीकर खराब", docId: "speaker_mic" },
  { value: "Software Issue", label: "सॉफ्टवेयर प्रॉब्लम (हैंग होना, फॉर्मेट, पासवर्ड/पैटर्न भूलना)", docId: "software_issue" },
  { value: "Lock/Pattern Unlock", label: "मोबाइल लॉक/पासवर्ड/पैटर्न खुलवाना", docId: "lock_unlock" },
  { value: "Other", label: "अन्य समस्या", docId: "other" }
];

// यह लिस्ट तब तक दिखेगी जब तक owner खुद admin panel से सेवाएं न जोड़ें/बदलें
export const DEFAULT_SERVICES = [
  { icon: "🛠️", title: "हार्डवेयर रिपेयरिंग", description: "फूटी स्क्रीन/डिस्प्ले, बैटरी बदलना, चार्जिंग पिन, स्पीकर/माइक, पानी से खराब मोबाइल।", order: 1 },
  { icon: "💻", title: "सॉफ्टवेयर रिपेयर & अपडेट", description: "मोबाइल हैंग होना, फॉर्मेट, सॉफ्टवेयर अपडेट, वायरस हटाना।", order: 2 },
  { icon: "🔓", title: "लॉक/पासवर्ड/पैटर्न खुलवाना", description: "मोबाइल का लॉक, पासवर्ड या पैटर्न भूल गए हैं तो हम खोल कर देंगे।", order: 3 },
  { icon: "🔄", title: "पुराने मोबाइल खरीदना, बेचना & रिपेयर करना", description: "पुराना मोबाइल बेचें, नए के बदले एक्सचेंज करें, या पुराने मोबाइल को ठीक करवाकर दोबारा चालू हालत में लें।", order: 4 },
  { icon: "🎧", title: "ब्लूटूथ हेडफोन, ईयरबड्स & स्पीकर", description: "सभी ब्रांड के ब्लूटूथ हेडफोन, ईयरबड्स और स्पीकर — नए भी, रिपेयर भी।", order: 5 },
  { icon: "💸", title: "पैसे निकालना (AEPS)", description: "आधार कार्ड से पैसे निकालें, मिनी स्टेटमेंट लें।", order: 6 },
  { icon: "💵", title: "पैसे जमा करना / ट्रांसफर", description: "किसी भी बैंक खाते में पैसे जमा करें या भेजें।", order: 7 },
  { icon: "📄", title: "किश्त (EMI) जमा करें", description: "Bajaj, TVS, Home Credit, Samsung Finance की किश्त समय पर दुकान पर जमा करें।", order: 8 },
  { icon: "📲", title: "नया सिम & पोर्ट (MNP)", description: "Jio, Airtel, Vi का नया सिम तुरंत चालू कराएं या पुराना नंबर पोर्ट कराएं।", order: 9 },
  { icon: "📶", title: "मोबाइल / DTH रिचार्ज", description: "सभी कंपनियों का प्रीपेड रिचार्ज और DTH रिचार्ज यहीं करवाएं।", order: 10 },
  { icon: "⌚", title: "स्मार्टवॉच & घड़ियां", description: "फैंसी हाथ घड़ियां, ब्लूटूथ स्मार्टवॉच और उनके पट्टे/सेल उपलब्ध।", order: 11 },
  { icon: "🧰", title: "कवर, टेम्पर्ड ग्लास & एक्सेसरीज", description: "11D टेम्पर्ड ग्लास, बैक कवर, चार्जर, नेकबैंड और मेमोरी कार्ड।", order: 12 }
];
