import { auth, db, OWNER_UIDS } from "./firebase-config.js";
import { REPAIR_ISSUES, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, DEFAULT_SERVICES } from "./constants.js";
import {
  signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  collection, addDoc, doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs,
  onSnapshot, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const loginScreen = document.getElementById("loginScreen");
const adminScreen = document.getElementById("adminScreen");

/* ================= LOGIN / AUTH ================= */
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errEl = document.getElementById("loginError");
  errEl.textContent = "";
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    errEl.textContent = "लॉगिन गलत है, ईमेल/पासवर्ड चेक करें।";
    console.error(err);
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => signOut(auth));

document.getElementById("backupBtn").addEventListener("click", async () => {
  const btn = document.getElementById("backupBtn");
  btn.disabled = true;
  btn.textContent = "तैयार हो रहा है...";
  try {
    const collections = ["products", "services", "offers", "repairFees", "reviews", "repairBookings"];
    const backup = {};
    for (const name of collections) {
      const snap = await getDocs(collection(db, name));
      backup[name] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    backup.exportedAt = new Date().toISOString();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kamal-mobile-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert("बैकअप नहीं बन पाया: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "📥 बैकअप डाउनलोड";
  }
});

let unsubscribers = [];
onAuthStateChanged(auth, (user) => {
  // पहले से चल रहे listeners हटाएं ताकि logout के बाद data न आए
  unsubscribers.forEach(u => u());
  unsubscribers = [];

  if (user && OWNER_UIDS.includes(user.uid)) {
    loginScreen.classList.add("hidden");
    adminScreen.classList.remove("hidden");
    document.getElementById("loggedInAs").textContent = user.email;
    startAdminListeners();
  } else {
    if (user && !OWNER_UIDS.includes(user.uid)) {
      alert("यह अकाउंट owner/staff लिस्ट में नहीं है। firebase-config.js में OWNER_UIDS चेक करें।");
      signOut(auth);
    }
    adminScreen.classList.add("hidden");
    loginScreen.classList.remove("hidden");
  }
});

/* ================= TABS ================= */
document.querySelectorAll(".admin-tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".admin-panel-section").forEach(s => s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

function startAdminListeners() {
  loadProducts();
  loadServices();
  loadOffers();
  loadFees();
  loadReviews();
  loadBookings();
  seedSampleServicesIfEmpty();
}

async function seedSampleServicesIfEmpty() {
  const existing = await getDocs(collection(db, "services"));
  if (!existing.empty) return;
  for (const s of DEFAULT_SERVICES) {
    await addDoc(collection(db, "services"), { ...s, createdAt: serverTimestamp() });
  }
}

/* ================= HELPERS: IMAGE COMPRESS + UPLOAD (Cloudinary - मुफ़्त, कार्ड नहीं चाहिए) ================= */
function compressImage(file, maxWidth = 1000, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error("compress failed")); return; }
          const newName = file.name.replace(/\.(png|jpg|jpeg|webp)$/i, "") + ".jpg";
          resolve(new File([blob], newName, { type: "image/jpeg" }));
        }, "image/jpeg", quality);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadImages(files) {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    if (file.size > 15 * 1024 * 1024) {
      alert(`"${file.name}" 15MB से बड़ी है, इसे छोड़ दिया गया। कृपया छोटी साइज़ की फोटो चुनें।`);
      continue;
    }
    try { file = await compressImage(file); } catch (e) { console.warn("compress failed, uploading original", e); }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Cloudinary upload failed - constants.js में CLOUD_NAME/UPLOAD_PRESET चेक करें");
    results.push({ url: data.secure_url, public_id: data.public_id });
  }
  return results;
}

/* ================= PRODUCTS ================= */
let currentImages = []; // edit mode में मौजूदा फोटो
const productForm = document.getElementById("productForm");
const productsTableBody = document.getElementById("productsTableBody");
const existingImagesDiv = document.getElementById("existingImages");

function loadProducts() {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  const unsub = onSnapshot(q, (snap) => {
    productsTableBody.innerHTML = "";
    snap.forEach(docSnap => {
      const p = docSnap.data();
      const id = docSnap.id;
      const thumb = (p.images && p.images[0]) ? p.images[0].url : "";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${thumb ? `<img src="${thumb}">` : "—"}</td>
        <td>${p.name}</td>
        <td>${p.brand || ""}</td>
        <td>₹${Number(p.price || 0).toLocaleString("en-IN")}</td>
        <td>${p.status === "in" ? "उपलब्ध" : "Out of Stock"}</td>
        <td class="row-actions">
          <button data-id="${id}" class="edit-product-btn">Edit</button>
          <button data-id="${id}" class="danger delete-product-btn">Delete</button>
        </td>
      `;
      productsTableBody.appendChild(tr);
    });

    productsTableBody.querySelectorAll(".edit-product-btn").forEach(btn => {
      btn.addEventListener("click", () => editProduct(btn.dataset.id));
    });
    productsTableBody.querySelectorAll(".delete-product-btn").forEach(btn => {
      btn.addEventListener("click", () => deleteProduct(btn.dataset.id));
    });
  }, (err) => {
    console.error(err);
    productsTableBody.innerHTML = `<tr><td colspan="6" style="color:var(--danger)">Load error: ${err.message}</td></tr>`;
  });
  unsubscribers.push(unsub);
}

function renderExistingImages() {
  existingImagesDiv.innerHTML = "";
  currentImages.forEach((img, i) => {
    const wrap = document.createElement("div");
    wrap.style.position = "relative";
    wrap.innerHTML = `<img src="${img.url}" style="width:56px;height:56px;object-fit:cover;border-radius:8px;">
      <button type="button" data-i="${i}" style="position:absolute;top:-6px;right:-6px;background:var(--danger);color:#fff;border:none;border-radius:50%;width:18px;height:18px;font-size:11px;cursor:pointer;line-height:1;">×</button>`;
    wrap.querySelector("button").addEventListener("click", () => {
      currentImages.splice(i, 1);
      renderExistingImages();
    });
    existingImagesDiv.appendChild(wrap);
  });
}

function resetProductForm() {
  productForm.reset();
  document.getElementById("productEditId").value = "";
  document.getElementById("productFormTitle").textContent = "नया मोबाइल जोड़ें";
  document.getElementById("productSubmitBtn").textContent = "प्रोडक्ट जोड़ें";
  document.getElementById("productCancelEdit").classList.add("hidden");
  currentImages = [];
  renderExistingImages();
}

async function editProduct(id) {
  const snap = await getDoc(doc(db, "products", id));
  if (!snap.exists()) return;
  const p = snap.data();
  document.getElementById("productEditId").value = id;
  document.getElementById("pName").value = p.name || "";
  document.getElementById("pBrand").value = p.brand || "";
  document.getElementById("pNetwork").value = p.network || "5G";
  document.getElementById("pRam").value = p.ram || "";
  document.getElementById("pPrice").value = p.price || 0;
  document.getElementById("pStatus").value = p.status || "in";
  currentImages = Array.isArray(p.images) ? [...p.images] : [];
  renderExistingImages();
  document.getElementById("productFormTitle").textContent = "प्रोडक्ट एडिट करें: " + p.name;
  document.getElementById("productSubmitBtn").textContent = "अपडेट करें";
  document.getElementById("productCancelEdit").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.getElementById("productCancelEdit").addEventListener("click", resetProductForm);

async function deleteProduct(id) {
  if (!confirm("क्या आप वाकई यह प्रोडक्ट डिलीट करना चाहते हैं?")) return;
  try {
    await deleteDoc(doc(db, "products", id));
  } catch (err) {
    alert("डिलीट नहीं हो पाया: " + err.message);
  }
}

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById("productSubmitBtn");
  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "सेव हो रहा है...";
  try {
    const editId = document.getElementById("productEditId").value;
    const files = document.getElementById("pImages").files;
    const newImages = files.length ? await uploadImages(files) : [];
    const data = {
      name: document.getElementById("pName").value.trim(),
      brand: document.getElementById("pBrand").value.trim(),
      network: document.getElementById("pNetwork").value,
      ram: document.getElementById("pRam").value.trim(),
      price: Number(document.getElementById("pPrice").value) || 0,
      status: document.getElementById("pStatus").value,
      images: [...currentImages, ...newImages]
    };
    if (editId) {
      await updateDoc(doc(db, "products", editId), data);
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, "products"), data);
    }
    resetProductForm();
  } catch (err) {
    alert("सेव नहीं हो पाया: " + err.message);
    console.error(err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

document.getElementById("seedSampleBtn").addEventListener("click", async () => {
  const existing = await getDocs(collection(db, "products"));
  if (!existing.empty) {
    alert("पहले से प्रोडक्ट्स मौजूद हैं, इसलिए sample data नहीं जोड़ा गया।");
    return;
  }
  const sample = [
    { name: "Vivo Y200", brand: "Vivo", network: "5G", ram: "8GB RAM / 128GB", price: 21999, status: "in" },
    { name: "Samsung Galaxy M34", brand: "Samsung", network: "5G", ram: "6GB RAM / 128GB", price: 16499, status: "in" },
    { name: "Redmi Note 13", brand: "Redmi", network: "5G", ram: "8GB RAM / 256GB", price: 17999, status: "in" },
    { name: "OnePlus Nord CE 4", brand: "OnePlus", network: "5G", ram: "8GB RAM / 128GB", price: 24999, status: "out" },
    { name: "Realme Narzo 60", brand: "Realme", network: "4G", ram: "6GB RAM / 64GB", price: 11999, status: "in" }
  ];
  for (const p of sample) {
    await addDoc(collection(db, "products"), { ...p, images: [], createdAt: serverTimestamp() });
  }
  alert("नमूना प्रोडक्ट्स जोड़ दिए गए।");
});

/* ================= SERVICES (owner खुद जोड़/हटा सकता है, UI अपने आप adjust होगी) ================= */
const serviceForm = document.getElementById("serviceForm");
const servicesTableBody = document.getElementById("servicesTableBody");

function loadServices() {
  const unsub = onSnapshot(query(collection(db, "services"), orderBy("order", "asc")), (snap) => {
    servicesTableBody.innerHTML = "";
    snap.forEach(docSnap => {
      const s = docSnap.data();
      const id = docSnap.id;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="font-size:20px;">${s.icon || ""}</td>
        <td>${s.title}</td>
        <td>${s.description || ""}</td>
        <td>${s.order ?? ""}</td>
        <td class="row-actions">
          <button data-id="${id}" class="edit-service-btn">Edit</button>
          <button data-id="${id}" class="danger delete-service-btn">Delete</button>
        </td>
      `;
      servicesTableBody.appendChild(tr);
    });
    servicesTableBody.querySelectorAll(".edit-service-btn").forEach(btn => btn.addEventListener("click", () => editService(btn.dataset.id)));
    servicesTableBody.querySelectorAll(".delete-service-btn").forEach(btn => btn.addEventListener("click", () => deleteService(btn.dataset.id)));
  }, (err) => {
    console.error(err);
    servicesTableBody.innerHTML = `<tr><td colspan="5" style="color:var(--danger)">Load error: ${err.message}</td></tr>`;
  });
  unsubscribers.push(unsub);
}

function resetServiceForm() {
  serviceForm.reset();
  document.getElementById("serviceEditId").value = "";
  document.getElementById("serviceFormTitle").textContent = "नई सेवा जोड़ें";
  document.getElementById("serviceSubmitBtn").textContent = "सेवा जोड़ें";
  document.getElementById("serviceCancelEdit").classList.add("hidden");
}

async function editService(id) {
  const snap = await getDoc(doc(db, "services", id));
  if (!snap.exists()) return;
  const s = snap.data();
  document.getElementById("serviceEditId").value = id;
  document.getElementById("serviceIcon").value = s.icon || "";
  document.getElementById("serviceOrder").value = s.order ?? "";
  document.getElementById("serviceTitle").value = s.title || "";
  document.getElementById("serviceDesc").value = s.description || "";
  document.getElementById("serviceFormTitle").textContent = "सेवा एडिट करें";
  document.getElementById("serviceSubmitBtn").textContent = "अपडेट करें";
  document.getElementById("serviceCancelEdit").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.getElementById("serviceCancelEdit").addEventListener("click", resetServiceForm);

async function deleteService(id) {
  if (!confirm("क्या आप वाकई यह सेवा डिलीट करना चाहते हैं?")) return;
  try { await deleteDoc(doc(db, "services", id)); } catch (err) { alert("डिलीट नहीं हो पाया: " + err.message); }
}

serviceForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const editId = document.getElementById("serviceEditId").value;
    const data = {
      icon: document.getElementById("serviceIcon").value.trim(),
      title: document.getElementById("serviceTitle").value.trim(),
      description: document.getElementById("serviceDesc").value.trim(),
      order: Number(document.getElementById("serviceOrder").value) || 0
    };
    if (editId) {
      await updateDoc(doc(db, "services", editId), data);
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, "services"), data);
    }
    resetServiceForm();
  } catch (err) {
    alert("सेव नहीं हो पाया: " + err.message);
  }
});

/* ================= OFFERS ================= */
const offerForm = document.getElementById("offerForm");
const offersTableBody = document.getElementById("offersTableBody");

function loadOffers() {
  const unsub = onSnapshot(collection(db, "offers"), (snap) => {
    offersTableBody.innerHTML = "";
    snap.forEach(docSnap => {
      const o = docSnap.data();
      const id = docSnap.id;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${o.title}</td>
        <td>${o.description || ""}</td>
        <td>${o.active !== false ? "हां" : "नहीं"}</td>
        <td class="row-actions">
          <button data-id="${id}" class="edit-offer-btn">Edit</button>
          <button data-id="${id}" class="danger delete-offer-btn">Delete</button>
        </td>
      `;
      offersTableBody.appendChild(tr);
    });
    offersTableBody.querySelectorAll(".edit-offer-btn").forEach(btn => btn.addEventListener("click", () => editOffer(btn.dataset.id)));
    offersTableBody.querySelectorAll(".delete-offer-btn").forEach(btn => btn.addEventListener("click", () => deleteOffer(btn.dataset.id)));
  }, (err) => {
    console.error(err);
    offersTableBody.innerHTML = `<tr><td colspan="4" style="color:var(--danger)">Load error: ${err.message}</td></tr>`;
  });
  unsubscribers.push(unsub);
}

function resetOfferForm() {
  offerForm.reset();
  document.getElementById("offerEditId").value = "";
  document.getElementById("offerFormTitle").textContent = "नया ऑफर जोड़ें";
  document.getElementById("offerSubmitBtn").textContent = "ऑफर जोड़ें";
  document.getElementById("offerCancelEdit").classList.add("hidden");
  document.getElementById("offerActive").checked = true;
}

async function editOffer(id) {
  const snap = await getDoc(doc(db, "offers", id));
  if (!snap.exists()) return;
  const o = snap.data();
  document.getElementById("offerEditId").value = id;
  document.getElementById("offerTitle").value = o.title || "";
  document.getElementById("offerDesc").value = o.description || "";
  document.getElementById("offerActive").checked = o.active !== false;
  document.getElementById("offerFormTitle").textContent = "ऑफर एडिट करें";
  document.getElementById("offerSubmitBtn").textContent = "अपडेट करें";
  document.getElementById("offerCancelEdit").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.getElementById("offerCancelEdit").addEventListener("click", resetOfferForm);

async function deleteOffer(id) {
  if (!confirm("क्या आप वाकई यह ऑफर डिलीट करना चाहते हैं?")) return;
  try { await deleteDoc(doc(db, "offers", id)); } catch (err) { alert("डिलीट नहीं हो पाया: " + err.message); }
}

offerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const editId = document.getElementById("offerEditId").value;
    const data = {
      title: document.getElementById("offerTitle").value.trim(),
      description: document.getElementById("offerDesc").value.trim(),
      active: document.getElementById("offerActive").checked
    };
    if (editId) {
      await updateDoc(doc(db, "offers", editId), data);
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, "offers"), data);
    }
    resetOfferForm();
  } catch (err) {
    alert("सेव नहीं हो पाया: " + err.message);
  }
});

/* ================= REPAIR FEES ================= */
const feesFormFields = document.getElementById("feesFormFields");
REPAIR_ISSUES.forEach(issue => {
  const wrap = document.createElement("div");
  wrap.innerHTML = `<label>${issue.label}</label><input type="number" min="0" id="feeInput-${issue.docId}" placeholder="₹ अनुमानित फीस">`;
  feesFormFields.appendChild(wrap);
});

function loadFees() {
  const unsub = onSnapshot(collection(db, "repairFees"), (snap) => {
    snap.forEach(docSnap => {
      const el = document.getElementById(`feeInput-${docSnap.id}`);
      if (el) el.value = docSnap.data().fee || "";
    });
  }, (err) => console.error(err));
  unsubscribers.push(unsub);
}

document.getElementById("feesForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    for (const issue of REPAIR_ISSUES) {
      const val = Number(document.getElementById(`feeInput-${issue.docId}`).value) || 0;
      await setDoc(doc(db, "repairFees", issue.docId), { label: issue.label, fee: val }, { merge: true });
    }
    alert("रिपेयर फीस सेव हो गई।");
  } catch (err) {
    alert("सेव नहीं हो पाया: " + err.message);
  }
});

/* ================= REVIEWS ================= */
const reviewForm = document.getElementById("reviewForm");
const reviewsTableBody = document.getElementById("reviewsTableBody");

function loadReviews() {
  const unsub = onSnapshot(query(collection(db, "reviews"), orderBy("createdAt", "desc")), (snap) => {
    reviewsTableBody.innerHTML = "";
    snap.forEach(docSnap => {
      const r = docSnap.data();
      const id = docSnap.id;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.name}</td>
        <td>${"⭐".repeat(Number(r.rating) || 0)}</td>
        <td>${r.text || ""}</td>
        <td>${r.active !== false ? "हां" : "नहीं"}</td>
        <td class="row-actions">
          <button data-id="${id}" class="edit-review-btn">Edit</button>
          <button data-id="${id}" class="danger delete-review-btn">Delete</button>
        </td>
      `;
      reviewsTableBody.appendChild(tr);
    });
    reviewsTableBody.querySelectorAll(".edit-review-btn").forEach(btn => btn.addEventListener("click", () => editReview(btn.dataset.id)));
    reviewsTableBody.querySelectorAll(".delete-review-btn").forEach(btn => btn.addEventListener("click", () => deleteReview(btn.dataset.id)));
  }, (err) => {
    console.error(err);
    reviewsTableBody.innerHTML = `<tr><td colspan="5" style="color:var(--danger)">Load error: ${err.message}</td></tr>`;
  });
  unsubscribers.push(unsub);
}

function resetReviewForm() {
  reviewForm.reset();
  document.getElementById("reviewEditId").value = "";
  document.getElementById("reviewFormTitle").textContent = "नया रिव्यू जोड़ें";
  document.getElementById("reviewSubmitBtn").textContent = "रिव्यू जोड़ें";
  document.getElementById("reviewCancelEdit").classList.add("hidden");
  document.getElementById("reviewActive").checked = true;
}

async function editReview(id) {
  const snap = await getDoc(doc(db, "reviews", id));
  if (!snap.exists()) return;
  const r = snap.data();
  document.getElementById("reviewEditId").value = id;
  document.getElementById("reviewName").value = r.name || "";
  document.getElementById("reviewRating").value = r.rating || 5;
  document.getElementById("reviewText").value = r.text || "";
  document.getElementById("reviewActive").checked = r.active !== false;
  document.getElementById("reviewFormTitle").textContent = "रिव्यू एडिट करें";
  document.getElementById("reviewSubmitBtn").textContent = "अपडेट करें";
  document.getElementById("reviewCancelEdit").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.getElementById("reviewCancelEdit").addEventListener("click", resetReviewForm);

async function deleteReview(id) {
  if (!confirm("क्या आप वाकई यह रिव्यू डिलीट करना चाहते हैं?")) return;
  try { await deleteDoc(doc(db, "reviews", id)); } catch (err) { alert("डिलीट नहीं हो पाया: " + err.message); }
}

reviewForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const editId = document.getElementById("reviewEditId").value;
    const data = {
      name: document.getElementById("reviewName").value.trim(),
      rating: Number(document.getElementById("reviewRating").value),
      text: document.getElementById("reviewText").value.trim(),
      active: document.getElementById("reviewActive").checked
    };
    if (editId) {
      await updateDoc(doc(db, "reviews", editId), data);
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, "reviews"), data);
    }
    resetReviewForm();
  } catch (err) {
    alert("सेव नहीं हो पाया: " + err.message);
  }
});

/* ================= BOOKINGS ================= */
const BOOKING_STATUSES = [
  "Received (बुकिंग मिल गई)",
  "Repairing (काम चालू है)",
  "Ready (तैयार है, दुकान से ले जाएं)",
  "Delivered (डिलीवर हो गया)",
  "Cancelled (रद्द)"
];
const bookingsTableBody = document.getElementById("bookingsTableBody");

function loadBookings() {
  const q = query(collection(db, "repairBookings"), orderBy("createdAt", "desc"));
  const unsub = onSnapshot(q, (snap) => {
    bookingsTableBody.innerHTML = "";
    snap.forEach(docSnap => {
      const b = docSnap.data();
      const id = docSnap.id;
      const tr = document.createElement("tr");
      const statusOptions = BOOKING_STATUSES.map(s => `<option value="${s}" ${b.status === s ? "selected" : ""}>${s}</option>`).join("");
      tr.innerHTML = `
        <td><b>${id}</b></td>
        <td>${b.name || ""}</td>
        <td>${b.phone || ""}</td>
        <td>${b.model || ""}</td>
        <td>${b.issue || ""}</td>
        <td>${b.prefTime || ""}</td>
        <td><select class="status-select booking-status">${statusOptions}</select></td>
        <td><input type="text" class="booking-time" value="${b.statusTime || ""}" placeholder="जैसे: शाम 5 बजे तक" style="width:140px;"></td>
        <td class="row-actions">
          <button class="save-booking-btn">Save</button>
          <button class="notify-booking-btn">📲 WhatsApp भेजें</button>
          <button class="danger delete-booking-btn">Delete</button>
        </td>
      `;
      tr.querySelector(".notify-booking-btn").addEventListener("click", () => {
        const status = tr.querySelector(".booking-status").value;
        const statusTime = tr.querySelector(".booking-time").value.trim();
        const digits = (b.phone || "").replace(/\D/g, "");
        const waPhone = digits.length === 10 ? "91" + digits : digits;
        if (!waPhone) { alert("इस बुकिंग में सही फोन नंबर नहीं है।"); return; }
        const msg = encodeURIComponent(`नमस्ते ${b.name || ""}, आपके Repair ID ${id} (${b.model || ""}) का स्टेटस अपडेट हुआ है:\n\n${status}${statusTime ? "\n" + statusTime : ""}\n\n- Kamal Mobile`);
        window.open(`https://wa.me/${waPhone}?text=${msg}`, "_blank");
      });
      tr.querySelector(".save-booking-btn").addEventListener("click", async () => {
        const status = tr.querySelector(".booking-status").value;
        const statusTime = tr.querySelector(".booking-time").value.trim();
        try {
          await updateDoc(doc(db, "repairBookings", id), { status, statusTime });
          alert(`${id} अपडेट हो गया।`);
        } catch (err) { alert("सेव नहीं हो पाया: " + err.message); }
      });
      tr.querySelector(".delete-booking-btn").addEventListener("click", async () => {
        if (!confirm(`${id} को डिलीट करें?`)) return;
        try { await deleteDoc(doc(db, "repairBookings", id)); } catch (err) { alert("डिलीट नहीं हो पाया: " + err.message); }
      });
      bookingsTableBody.appendChild(tr);
    });
  }, (err) => {
    console.error(err);
    bookingsTableBody.innerHTML = `<tr><td colspan="9" style="color:var(--danger)">Load error: ${err.message}</td></tr>`;
  });
  unsubscribers.push(unsub);
}
