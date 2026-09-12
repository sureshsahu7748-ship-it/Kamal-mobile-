 const productsData = [
  { id: 101, name: "Vivo Y200", brand: "Vivo", network: "5G", ram: "8GB RAM / 128GB", price: 21999, status: "in", icon: "📱" },
  { id: 102, name: "Samsung Galaxy M34", brand: "Samsung", network: "5G", ram: "6GB RAM / 128GB", price: 16499, status: "in", icon: "📱" },
  { id: 103, name: "Redmi Note 13", brand: "Redmi", network: "5G", ram: "8GB RAM / 256GB", price: 17999, status: "in", icon: "📱" },
  { id: 104, name: "OnePlus Nord CE 4", brand: "OnePlus", network: "5G", ram: "8GB RAM / 128GB", price: 24999, status: "out", icon: "📱" },
  { id: 105, name: "Realme Narzo 60", brand: "Realme", network: "4G", ram: "6GB RAM / 64GB", price: 11999, status: "in", icon: "📱" }
];

const repairDatabase = {
  "REP-1001": { model: "Vivo Y20", issue: "स्क्रीन बदलना", status: "Repairing (काम चालू है)", time: "आज शाम 5 बजे तक" },
  "REP-1002": { model: "Samsung A12", issue: "बैटरी रिप्लेसमेंट", status: "Ready (तैयार है, दुकान से ले जाएं)", time: "तुरंत ले सकते हैं" }
};

const productGrid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const brandFilter = document.getElementById("brandFilter");
const networkFilter = document.getElementById("networkFilter");
const sortFilter = document.getElementById("sortFilter");

function renderProducts() {
  let filtered = productsData.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchInput.value.toLowerCase()) || p.ram.toLowerCase().includes(searchInput.value.toLowerCase());
    const matchesBrand = brandFilter.value === "all" || p.brand === brandFilter.value;
    const matchesNetwork = networkFilter.value === "all" || p.network === networkFilter.value;
    return matchesSearch && matchesBrand && matchesNetwork;
  });

  if (sortFilter.value === "low-high") filtered.sort((a, b) => a.price - b.price);
  if (sortFilter.value === "high-low") filtered.sort((a, b) => b.price - a.price);

  productGrid.innerHTML = "";
  document.getElementById("emptyState").classList.toggle("hidden", filtered.length > 0);

  filtered.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    const waText = encodeURIComponent(`नमस्ते Kamal Mobile and Video Graphy, मुझे ${p.name} (${p.ram}) का रेट और उपलब्धता पूछनी है।`);
    
    card.innerHTML = `
      <span class="stock-tag ${p.status}">${p.status === "in" ? "उपलब्ध है" : "Out of Stock"}</span>
      <div class="product-icon">${p.icon}</div>
      <div>
        <h3>${p.name} <small style="font-size:12px; color:var(--muted);">${p.network}</small></h3>
        <p class="ram-spec">${p.ram}</p>
        <div class="price-row">
          <strong>₹${p.price.toLocaleString("en-IN")}</strong>
        </div>
      </div>
      <a href="https://wa.me/919981176713?text=${waText}" target="_blank" class="btn primary full-width">💬 WhatsApp पर पूछें</a>
    `;
    productGrid.appendChild(card);
  });
}

searchInput.addEventListener("input", renderProducts);
brandFilter.addEventListener("change", renderProducts);
networkFilter.addEventListener("change", renderProducts);
sortFilter.addEventListener("change", renderProducts);

document.getElementById("repairForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const name = document.getElementById("custName").value;
  const phone = document.getElementById("custPhone").value;
  const model = document.getElementById("phoneModel").value;
  const issue = document.getElementById("repairIssue").value;
  
  const randomId = "REP-" + Math.floor(1000 + Math.random() * 9000);
  const waMsg = encodeURIComponent(`*नया रिपेयर बुकिंग अनुरोध*\n\nID: ${randomId}\nनाम: ${name}\nफोन: ${phone}\nमॉडल: ${model}\nसमस्या: ${issue}`);
  
  alert(`बुकिंग सफल रही!\nआपका Repair ID है: ${randomId}\n\nअब ओके पर क्लिक करके इसे व्हाट्सएप पर भेजें।`);
  window.open(`https://wa.me/919981176713?text=${waMsg}`, "_blank");
  this.reset();
});

document.getElementById("trackBtn").addEventListener("click", function() {
  const id = document.getElementById("trackIdInput").value.trim().toUpperCase();
  const resultDiv = document.getElementById("trackResult");
  resultDiv.classList.remove("hidden");
  
  if (repairDatabase[id]) {
    const data = repairDatabase[id];
    resultDiv.style.color = "var(--text)";
    resultDiv.innerHTML = `मॉडल: ${data.model} | समस्या: ${data.issue}<br><span style="color:var(--success);">स्टेटस: ${data.status}</span><br>समय: ${data.time}`;
  } else {
    resultDiv.style.color = "var(--danger)";
    resultDiv.innerHTML = `Repair ID "${id}" नहीं मिला। कृपया सही ID डालें या दुकान पर संपर्क करें।`;
  }
});

function quickEnquire(topic) {
  const msg = encodeURIComponent(`नमस्ते Kamal Mobile and Video Graphy, मुझे "${topic}" की जानकारी चाहिए।`);
  window.open(`https://wa.me/919981176713?text=${msg}`, "_blank");
}

document.getElementById("themeBtn").addEventListener("click", () => document.body.classList.toggle("dark"));
document.getElementById("menuBtn").addEventListener("click", () => document.getElementById("mainNav").classList.toggle("open"));
document.getElementById("year").textContent = new Date().getFullYear();

renderProducts();
