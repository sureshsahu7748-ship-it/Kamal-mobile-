 // Firebase Configuration (Kamal Mobile Database)
const firebaseConfig = {
  apiKey: "AIzaSyAy1yB5KLjngy1sSMA5Aunup9Tvyengalg",
  authDomain: "kamal-mobile-d8ba5.firebaseapp.com",
  projectId: "kamal-mobile-d8ba5",
  storageBucket: "kamal-mobile-d8ba5.firebasestorage.app",
  messagingSenderId: "1065271731721",
  appId: "1:1065271731721:web:f4163ef79q1409d50cb2d8"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// WhatsApp Number Configuration
const WHATSAPP_NUMBER = "919981176713";

// DOM Elements
const productGrid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const brandFilter = document.getElementById("brandFilter");
const networkFilter = document.getElementById("networkFilter");
const sortFilter = document.getElementById("sortFilter");
const emptyState = document.getElementById("emptyState");
const repairForm = document.getElementById("repairForm");
const trackBtn = document.getElementById("trackBtn");
const trackResult = document.getElementById("trackResult");
const trackIdInput = document.getElementById("trackIdInput");

let productsData = [];

// Initialize Page
document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  
  listenToProducts();
  initNavigation();
});

// Firestore Realtime Listener
function listenToProducts() {
  db.collection("mobiles").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
    productsData = [];
    snapshot.forEach((doc) => {
      productsData.push({ id: doc.id, ...doc.data() });
    });
    renderProducts(productsData);
  }, (error) => {
    console.error("Firestore Fetch Error:", error);
    if (emptyState) {
      emptyState.textContent = "डेटा लोड करने में समस्या आई।";
      emptyState.classList.remove("hidden");
    }
  });
}

// Render Product Cards
function renderProducts(products) {
  if (!productGrid) return;
  productGrid.innerHTML = "";

  if (!products || products.length === 0) {
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }

  if (emptyState) emptyState.classList.add("hidden");

  products.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";

    const is5G = product.network && product.network.toUpperCase().includes("5G");
    const badgeHTML = is5G ? `<span class="badge red-badge">5G FAST</span>` : `<span class="badge">BEST SELLER</span>`;

    // फोटो दिखाने का लॉजिक
    const mediaHTML = (product.image_url && product.image_url.startsWith("http")) 
      ? `<div class="product-img-wrap" style="height:180px; overflow:hidden; display:flex; align-items:center; justify-content:center; margin-bottom:10px;"><img src="${product.image_url}" alt="${product.name}" style="max-height:100%; max-width:100%; object-fit:contain;" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'product-icon\\'>📱</div>';"></div>`
      : `<div class="product-icon">📱</div>`;

    const message = encodeURIComponent(`नमस्ते Kamal Mobile, मुझे ${product.name} (${product.ram_storage || ''}) खरीदना है। कीमत: ₹${product.price ? product.price.toLocaleString("en-IN") : 'संपर्क करें'}`);

    card.innerHTML = `
      ${badgeHTML}
      ${mediaHTML}
      <h3>${product.name}</h3>
      <p class="ram-spec">${product.ram_storage || 'Standard Specs'}</p>
      <div class="price">₹${product.price ? product.price.toLocaleString("en-IN") : 'Call for Price'}</div>
      <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${message}" target="_blank" class="btn primary full-width">WhatsApp पर खरीदें</a>
    `;

    productGrid.appendChild(card);
  });
}

// Filter Logic
function applyFilters() {
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const selectedBrand = brandFilter ? brandFilter.value : "all";
  const selectedNetwork = networkFilter ? networkFilter.value : "all";
  const selectedSort = sortFilter ? sortFilter.value : "default";

  let filtered = productsData.filter(product => {
    const nameMatch = (product.name || "").toLowerCase().includes(searchTerm);
    const brandMatchStr = (product.brand || "").toLowerCase().includes(searchTerm);
    const ramMatch = (product.ram_storage || "").toLowerCase().includes(searchTerm);
    const searchMatches = nameMatch || brandMatchStr || ramMatch;

    const brandMatches = selectedBrand === "all" || (product.brand || "").toLowerCase() === selectedBrand.toLowerCase();
    const networkMatches = selectedNetwork === "all" || (product.network || "").toUpperCase().includes(selectedNetwork.toUpperCase());

    return searchMatches && brandMatches && networkMatches;
  });

  if (selectedSort === "low-high") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (selectedSort === "high-low") {
    filtered.sort((a, b) => b.price - a.price);
  }

  renderProducts(filtered);
}

// Event Listeners for Filters
if (searchInput) searchInput.addEventListener("input", applyFilters);
if (brandFilter) brandFilter.addEventListener("change", applyFilters);
if (networkFilter) networkFilter.addEventListener("change", applyFilters);
if (sortFilter) sortFilter.addEventListener("change", applyFilters);

// Repair Booking Form Submission
if (repairForm) {
  repairForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("custName").value.trim();
    const phone = document.getElementById("custPhone").value.trim();
    const model = document.getElementById("phoneModel").value.trim();
    const issue = document.getElementById("repairIssue").value;
    const time = document.getElementById("prefTime").value.trim() || "यथाशीघ्र";

    const repairId = "REP-" + Math.floor(1000 + Math.random() * 9000);

    const repairData = { id: repairId, name, phone, model, issue, status: "बुकिंग प्राप्त हुई (Under Process)", date: new Date().toLocaleDateString("hi-IN") };
    localStorage.setItem(repairId, JSON.stringify(repairData));

    const message = encodeURIComponent(`🛠️ *नया रिपेयर बुकिंग अनुरोध*\n\n*Repair ID:* ${repairId}\n*ग्राहक:* ${name}\n*फोन:* ${phone}\n*मॉडल:* ${model}\n*समस्या:* ${issue}\n*समय:* ${time}`);

    alert(`बुकिंग सफल! आपका Repair ID है: ${repairId}\nइसे संभाल कर रखें।`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
    repairForm.reset();
  });
}

// Track Repair Status
if (trackBtn) {
  trackBtn.addEventListener("click", () => {
    const id = trackIdInput.value.trim().toUpperCase();
    if (!id) {
      alert("कृपया Repair ID दर्ज करें।");
      return;
    }

    const saved = localStorage.getItem(id);
    trackResult.classList.remove("hidden");

    if (saved) {
      const data = JSON.parse(saved);
      trackResult.innerHTML = `
        <div style="background:#e8f5e9; padding:15px; border-radius:8px; border:1px solid #4caf50;">
          <h4 style="color:#2e7d32; margin-bottom:5px;">रिपेयर स्टेटस: ${data.status}</h4>
          <p><b>ID:</b> ${data.id} | <b>मॉडल:</b> ${data.model}</p>
          <p><b>समस्या:</b> ${data.issue}</p>
        </div>
      `;
    } else {
      trackResult.innerHTML = `
        <div style="background:#ffebee; padding:15px; border-radius:8px; border:1px solid #ef5350; color:#c62828;">
          Repair ID "${id}" नहीं मिला। कृपया सही ID डालें या दुकान पर कॉल करें।
        </div>
      `;
    }
  });
}

// Navigation & Menu Helper
function initNavigation() {
  const menuBtn = document.getElementById("menuBtn");
  const mainNav = document.getElementById("mainNav");

  if (menuBtn && mainNav) {
    menuBtn.addEventListener("click", () => {
      mainNav.classList.toggle("active");
    });
  }
   }
                   
