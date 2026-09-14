 import { db } from "./firebase-config.js";
import { REPAIR_ISSUES, WHATSAPP_NUMBER, DEFAULT_SERVICES } from "./constants.js";
import {
  collection, onSnapshot, query, orderBy,
  doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

/* ================= PRODUCTS (realtime) ================= */
let allProducts = [];
const productGrid = document.getElementById("productGrid");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const brandFilter = document.getElementById("brandFilter");
const networkFilter = document.getElementById("networkFilter");
const sortFilter = document.getElementById("sortFilter");

const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
onSnapshot(productsQuery, (snap) => {
  allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  updateBrandFilterOptions();
  renderProducts();
}, (err) => {
  console.error("Products load error:", err);
  productGrid.innerHTML = `<p style="color:var(--danger)">प्रोडक्ट लोड नहीं हो पाए। firebase-config.js की settings चेक करें।</p>`;
});

function updateBrandFilterOptions() {
  const current = brandFilter.value;
  const brands = [...new Set(allProducts.map(p => (p.brand || "").trim()).filter(Boolean))].sort();
  brandFilter.innerHTML = `<option value="all">सभी ब्रांड (Brands)</option>` +
    brands.map(b => `<option value="${b}">${b}</option>`).join("");
  if (brands.includes(current)) brandFilter.value = current;
}

function renderProducts() {
  const term = searchInput.value.toLowerCase();
  let filtered = allProducts.filter(p => {
    const matchesSearch = (p.name || "").toLowerCase().includes(term) || (p.ram || "").toLowerCase().includes(term);
    const matchesBrand = brandFilter.value === "all" || p.brand === brandFilter.value;
    const matchesNetwork = networkFilter.value === "all" || p.network === networkFilter.value;
    return matchesSearch && matchesBrand && matchesNetwork;
  });

  if (sortFilter.value === "low-high") filtered.sort((a, b) => a.price - b.price);
  if (sortFilter.value === "high-low") filtered.sort((a, b) => b.price - a.price);

  productGrid.innerHTML = "";
  emptyState.classList.toggle("hidden", filtered.length > 0);

  filtered.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    const images = Array.isArray(p.images) ? p.images : [];
    const thumb = images[0] ? images[0].url : null;
    const waText = encodeURIComponent(`नमस्ते Kamal Mobile, मुझे ${p.name} (${p.ram || ""}) का रेट और उपलब्धता पूछनी है।`);

    card.innerHTML = `
      <span class="stock-tag ${p.status}">${p.status === "in" ? "उपलब्ध है" : "Out of Stock"}</span>
      ${thumb ? `<img src="${thumb}" class="product-photo" alt="${p.name}">` : `<div class="product-icon">📱</div>`}
      <div>
        <h3>${p.name} <small style="font-size:12px; color:var(--muted);">${p.network || ""}</small></h3>
        <p class="ram-spec">${p.ram || ""}</p>
        <div class="price-row"><strong>₹${Number(p.price || 0).toLocaleString("en-IN")}</strong></div>
      </div>
      <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${waText}" target="_blank" class="btn primary full-width">💬 WhatsApp पर पूछें</a>
    `;
    if (images.length) {
      card.querySelector(".product-photo").addEventListener("click", () => openGallery(p));
    }
    productGrid.appendChild(card);
  });
}

searchInput.addEventListener("input", renderProducts);
brandFilter.addEventListener("change", renderProducts);
networkFilter.addEventListener("change", renderProducts);
sortFilter.addEventListener("change", renderProducts);

/* ================= PHOTO GALLERY MODAL ================= */
const galleryOverlay = document.getElementById("galleryOverlay");
const galleryMainImg = document.getElementById("galleryMainImg");
const galleryThumbs = document.getElementById("galleryThumbs");
const galleryTitle = document.getElementById("galleryTitle");
let galleryImages = [];
let galleryIndex = 0;

function openGallery(product) {
  const imgs = Array.isArray(product.images) ? product.images : [];
  galleryImages = imgs.map(im => im.url);
  if (!galleryImages.length) return;
  galleryIndex = 0;
  galleryTitle.textContent = product.name;
  renderGallery();
  galleryOverlay.classList.remove("hidden");
}
function renderGallery() {
  galleryMainImg.src = galleryImages[galleryIndex];
  galleryThumbs.innerHTML = "";
  galleryImages.forEach((src, i) => {
    const t = document.createElement("img");
    t.src = src;
    if (i === galleryIndex) t.classList.add("active");
    t.addEventListener("click", () => { galleryIndex = i; renderGallery(); });
    galleryThumbs.appendChild(t);
  });
}
document.getElementById("galleryPrev").addEventListener("click", () => {
  galleryIndex = (galleryIndex - 1 + galleryImages.length) % galleryImages.length;
  renderGallery();
});
document.getElementById("galleryNext").addEventListener("click", () => {
  galleryIndex = (galleryIndex + 1) % galleryImages.length;
  renderGallery();
});
document.getElementById("galleryClose").addEventListener("click", () => galleryOverlay.classList.add("hidden"));
galleryOverlay.addEventListener("click", (e) => { if (e.target === galleryOverlay) galleryOverlay.classList.add("hidden"); });

/* ================= OTHER SERVICES (realtime, admin खुद जोड़ सकता है) ================= */
const servicesGrid = document.getElementById("servicesGrid");
onSnapshot(query(collection(db, "services"), orderBy("order", "asc")), (snap) => {
  const services = snap.empty ? DEFAULT_SERVICES : snap.docs.map(d => d.data());
  servicesGrid.innerHTML = services.length
    ? services.map(s => `
        <div class="product-card">
          <div class="product-icon">${s.icon || "🔧"}</div>
          <h3>${s.title}</h3>
          <p class="ram-spec">${s.description || ""}</p>
        </div>
      `).join("")
    : `<p class="offers-empty">जल्द जानकारी जोड़ी जाएगी।</p>`;
}, (err) => {
  console.error("Services load error:", err);
  servicesGrid.innerHTML = `<p style="color:var(--danger)">लोड नहीं हो पाया।</p>`;
});

/* ================= OFFERS (realtime) ================= */
const offersStrip = document.getElementById("offersStrip");
onSnapshot(collection(db, "offers"), (snap) => {
  const offers = snap.docs.map(d => d.data()).filter(o => o.active !== false);
  offersStrip.innerHTML = offers.length
    ? offers.map(o => `<div class="offer-chip"><h4>🔥 ${o.title}</h4><p>${o.description || ""}</p></div>`).join("")
    : `<p class="offers-empty">अभी कोई स्पेशल ऑफर नहीं है। जल्द जुड़ेंगे!</p>`;
}, (err) => console.error("Offers load error:", err));

/* ================= CUSTOMER REVIEWS (realtime) ================= */
const reviewsList = document.getElementById("reviewsList");
const reviewsAvg = document.getElementById("reviewsAvg");
onSnapshot(query(collection(db, "reviews"), orderBy("createdAt", "desc")), (snap) => {
  const reviews = snap.docs.map(d => d.data()).filter(r => r.active !== false);
  if (!reviews.length) {
    reviewsAvg.textContent = "";
    reviewsList.innerHTML = `<p class="offers-empty">अभी कोई रिव्यू नहीं है।</p>`;
    return;
  }
  const avg = reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length;
  reviewsAvg.innerHTML = `<span style="font-size:22px; font-weight:800;">${avg.toFixed(1)} ⭐</span> <span style="color:var(--muted); font-size:13px;">(${reviews.length} रिव्यू)</span>`;
  reviewsList.innerHTML = reviews.map(r => `
    <div class="offer-chip">
      <h4>${"⭐".repeat(Number(r.rating) || 0)}</h4>
      <p style="margin-bottom:6px;">${r.text || ""}</p>
      <p style="font-weight:700; font-size:13px;">— ${r.name || "ग्राहक"}</p>
    </div>
  `).join("");
}, (err) => console.error("Reviews load error:", err));

/* ================= REPAIR FEES (realtime, सिर्फ दिखाने के लिए) ================= */
onSnapshot(collection(db, "repairFees"), (snap) => {
  const fees = {};
  snap.docs.forEach(d => fees[d.id] = d.data());
  REPAIR_ISSUES.forEach(issue => {
    const el = document.getElementById(`fee-${issue.docId}`);
    if (!el) return;
    const feeData = fees[issue.docId];
    el.textContent = feeData && feeData.fee ? `₹${feeData.fee} से शुरू` : "पूछें";
  });
}, (err) => console.error("Repair fees load error:", err));

/* ================= REPAIR BOOKING FORM ================= */
document.getElementById("repairForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const lastSubmit = Number(localStorage.getItem("lastBookingTime") || 0);
  if (Date.now() - lastSubmit < 60000) {
    alert("आपने अभी-अभी एक बुकिंग भेजी है। कृपया 1 मिनट बाद दोबारा कोशिश करें।");
    return;
  }
  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const model = document.getElementById("phoneModel").value.trim();
  const issue = document.getElementById("repairIssue").value;
  const prefTime = document.getElementById("prefTime").value.trim();
  const submitBtn = this.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  submitBtn.textContent = "बुकिंग हो रही है...";

  try {
    let repairId, tries = 0, exists = true;
    do {
      repairId = "REP-" + Math.floor(1000 + Math.random() * 9000);
      const check = await getDoc(doc(db, "repairBookings", repairId));
      exists = check.exists();
      tries++;
    } while (exists && tries < 6);

    await setDoc(doc(db, "repairBookings", repairId), {
      name, phone, model, issue, prefTime,
      status: "Received (बुकिंग मिल गई)",
      statusTime: "",
      createdAt: serverTimestamp()
    });

    const waMsg = encodeURIComponent(`*नया रिपेयर बुकिंग अनुरोध*\n\nID: ${repairId}\nनाम: ${name}\nफोन: ${phone}\nमॉडल: ${model}\nसमस्या: ${issue}`);
    localStorage.setItem("lastBookingTime", String(Date.now()));
    alert(`बुकिंग सफल रही!\nआपका Repair ID है: ${repairId}\n\nइस ID को संभाल कर रखें, स्टेटस ट्रैक करने के लिए इसका इस्तेमाल होगा।`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`, "_blank");
    this.reset();
  } catch (err) {
    console.error(err);
    alert("कुछ गड़बड़ हो गई, कृपया दोबारा कोशिश करें या दुकान पर सीधे कॉल करें।");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "बुकिंग कंफर्म करें & Repair ID लें";
  }
});

/* ================= STATUS TRACKING ================= */
document.getElementById("trackBtn").addEventListener("click", async function () {
  const id = document.getElementById("trackIdInput").value.trim().toUpperCase();
  const resultDiv = document.getElementById("trackResult");
  resultDiv.classList.remove("hidden");
  resultDiv.style.color = "var(--text)";
  resultDiv.innerHTML = "देख रहे हैं...";
  if (!id) { resultDiv.innerHTML = "कृपया Repair ID डालें।"; return; }
  try {
    const snap = await getDoc(doc(db, "repairBookings", id));
    if (snap.exists()) {
      const data = snap.data();
      resultDiv.innerHTML = `मॉडल: ${data.model} | समस्या: ${data.issue}<br><span style="color:var(--success);">स्टेटस: ${data.status}</span>${data.statusTime ? `<br>समय: ${data.statusTime}` : ""}`;
    } else {
      resultDiv.style.color = "var(--danger)";
      resultDiv.innerHTML = `Repair ID "${id}" नहीं मिला। कृपया सही ID डालें या दुकान पर संपर्क करें।`;
    }
  } catch (err) {
    console.error(err);
    resultDiv.style.color = "var(--danger)";
    resultDiv.innerHTML = "कुछ गड़बड़ हो गई, दोबारा कोशिश करें।";
  }
});

/* ================= MISC ================= */
function quickEnquire(topic) {
  const msg = encodeURIComponent(`नमस्ते Kamal Mobile, मुझे "${topic}" की जानकारी चाहिए।`);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
}
window.quickEnquire = quickEnquire;

document.getElementById("themeBtn").addEventListener("click", () => document.body.classList.toggle("dark"));
document.getElementById("menuBtn").addEventListener("click", () => document.getElementById("mainNav").classList.toggle("open"));
document.getElementById("year").textContent = new Date().getFullYear();

window.addEventListener("scroll", () => {
  document.querySelector(".header").classList.toggle("scrolled", window.scrollY > 8);
});
