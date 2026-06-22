// ═══════════════════════════════════════════════════════════
// TIANG MAPPER PRO — BITNET | app.js
// Semua data dari MySQL via REST API ElysiaJS
// ═══════════════════════════════════════════════════════════

const API = "/api/tiang";
let markers = {};        // { id: L.marker }
let allData = [];        // cache data dari server
let editId = null;       // id tiang yang sedang diedit
let hapusId = null;      // id tiang yang akan dihapus
let addMode = false;     // mode tambah tiang (crosshair)
let isSatellite = false; // toggle layer peta

// ── INISIALISASI PETA ─────────────────────────────────────
const map = L.map("map", {
  center: [-2.5489, 118.0149],
  zoom: 5,
  zoomControl: true,
});

const layerOSM = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
  maxZoom: 19,
});

const layerSatelit = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution: "Tiles © Esri",
    maxZoom: 19,
  }
);

layerOSM.addTo(map);
L.control.scale({ imperial: false }).addTo(map);

// ── CONFIG WARNA & IKON PER JENIS ────────────────────────
const jenisConfig = {
  PLN:           { warna: "#E53935", ikon: "⚡", label: "PLN" },
  Telkom:        { warna: "#1E88E5", ikon: "📡", label: "Telkom" },
  "ISP Sendiri": { warna: "#43A047", ikon: "🌐", label: "ISP" },
  Bambu:         { warna: "#757575", ikon: "🗼", label: "Bambu" },
  Besi:          { warna: "#546E7A", ikon: "🔩", label: "Besi" },
  Lainnya:       { warna: "#8D6E63", ikon: "🗼", label: "Lain" },
};

const kondisiWarna = {
  Baik:              "#43A047",
  "Perlu Perhatian": "#FFA000",
  Rusak:             "#E53935",
};

// Buat divIcon Leaflet per jenis
function buatIcon(jenis, kondisi) {
  const cfg = jenisConfig[jenis] || jenisConfig["Lainnya"];
  const borderColor = kondisiWarna[kondisi] || "#888";
  return L.divIcon({
    className: "",
    html: `
      <div style="
        background:${cfg.warna};
        border: 3px solid ${borderColor};
        border-radius: 50% 50% 50% 0;
        width: 34px; height: 34px;
        transform: rotate(-45deg);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      ">
        <span style="transform:rotate(45deg); font-size:16px; line-height:1">
          ${cfg.ikon}
        </span>
      </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -36],
  });
}

// ── FETCH DATA DARI API ───────────────────────────────────
async function loadData(params = {}) {
  setStatus("Memuat data...");
  try {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API}?${qs}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    allData = json.data;
    renderMarkers(allData);
    renderSidebar(allData);
    updateStats(json.stats);
    updatePageTitle(json.stats.total);
    setStatus(`${json.stats.total} tiang dimuat`, new Date());
  } catch (e) {
    toast(`Gagal memuat data: ${e.message}`, "error");
    setStatus("Gagal memuat data");
  }
}

// ── RENDER MARKER DI PETA ─────────────────────────────────
function renderMarkers(data) {
  Object.values(markers).forEach((m) => map.removeLayer(m));
  markers = {};

  data.forEach((t) => {
    const lat = parseFloat(t.latitude);
    const lng = parseFloat(t.longitude);
    const marker = L.marker([lat, lng], {
      icon: buatIcon(t.jenis, t.kondisi),
      title: `${t.kode} — ${t.jenis}`,
    });

    marker.bindTooltip(`<b>${t.kode}</b><br>${t.jenis}`, { direction: "top" });
    marker.bindPopup(buatPopup(t));
    marker.addTo(map);
    markers[t.id] = marker;
  });
}

function buatPopup(t) {
  const svUrl = `https://www.google.com/maps?q=${t.latitude},${t.longitude}&layer=c&cbll=${t.latitude},${t.longitude}`;
  const kondisiIcon = { Baik: "✅", "Perlu Perhatian": "⚠️", Rusak: "❌" }[t.kondisi];
  return `
    <div class="popup-tiang">
      <div class="popup-header">
        <b class="popup-kode">${t.kode}</b>
        ${t.label ? `<span class="popup-label">${t.label}</span>` : ""}
      </div>
      <table class="popup-table">
        <tr><td>Jenis</td><td>${t.jenis}</td></tr>
        <tr><td>Kondisi</td><td>${kondisiIcon} ${t.kondisi}</td></tr>
        <tr><td>Lat</td><td class="mono">${parseFloat(t.latitude).toFixed(7)}</td></tr>
        <tr><td>Lng</td><td class="mono">${parseFloat(t.longitude).toFixed(7)}</td></tr>
        ${t.catatan ? `<tr><td colspan="2" class="popup-catatan">${t.catatan}</td></tr>` : ""}
      </table>
      <div class="popup-actions">
        <a href="${svUrl}" target="_blank" class="popup-btn popup-btn-sv">📷 Street View</a>
        <button onclick="bukaEdit(${t.id})" class="popup-btn popup-btn-edit">✏️ Edit</button>
        <button onclick="bukaHapus(${t.id}, '${t.kode}')" class="popup-btn popup-btn-hapus">🗑️</button>
      </div>
    </div>`;
}

// ── RENDER SIDEBAR LIST ───────────────────────────────────
function renderSidebar(data) {
  const list = document.getElementById("tiang-list");
  if (!data.length) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🗼</div>
      <p>Tidak ada tiang ditemukan.</p>
    </div>`;
    return;
  }
  list.innerHTML = data
    .map((t) => {
      const kondisiClass = {
        Baik: "kondisi-baik",
        "Perlu Perhatian": "kondisi-perhatian",
        Rusak: "kondisi-rusak",
      }[t.kondisi];
      return `
        <div class="tiang-item" onclick="flyTo(${t.id})">
          <div class="tiang-item-main">
            <span class="tiang-kode">${t.kode}</span>
            <span class="tiang-jenis">${t.jenis}</span>
          </div>
          <div class="tiang-item-sub">
            <span class="kondisi-dot ${kondisiClass}"></span>
            <span class="tiang-kondisi">${t.kondisi}</span>
            ${t.label ? `<span class="tiang-label-small">— ${t.label}</span>` : ""}
          </div>
        </div>`;
    })
    .join("");
}

// ── UPDATE STATISTIK ──────────────────────────────────────
function updateStats(stats) {
  document.getElementById("stat-total").textContent = stats.total;
  document.getElementById("stat-pln").textContent = stats.per_jenis.PLN;
  document.getElementById("stat-telkom").textContent = stats.per_jenis.Telkom;
  document.getElementById("stat-isp").textContent = stats.per_jenis["ISP Sendiri"];
  document.getElementById("badge-baik").textContent = `✅ Baik: ${stats.per_kondisi.Baik}`;
  document.getElementById("badge-perhatian").textContent = `⚠️ Perhatian: ${stats.per_kondisi["Perlu Perhatian"]}`;
  document.getElementById("badge-rusak").textContent = `❌ Rusak: ${stats.per_kondisi.Rusak}`;
}

function updatePageTitle(total) {
  document.getElementById("page-title").textContent = `(${total}) Tiang Mapper — BITNET`;
}

// ── FLY TO MARKER ─────────────────────────────────────────
function flyTo(id) {
  const marker = markers[id];
  if (!marker) return;
  map.flyTo(marker.getLatLng(), 18, { duration: 1 });
  setTimeout(() => marker.openPopup(), 1100);
}

// ── MODE TAMBAH TIANG ─────────────────────────────────────
document.getElementById("btn-tambah").addEventListener("click", () => {
  addMode = true;
  editId = null;
  document.getElementById("mode-indicator").style.display = "flex";
  document.querySelector(".map-container").classList.add("mode-crosshair");
  document.getElementById("modal-title").textContent = "Tambah Tiang Baru";
  resetForm();
});

document.getElementById("btn-cancel-mode").addEventListener("click", cancelMode);

function cancelMode() {
  addMode = false;
  document.getElementById("mode-indicator").style.display = "none";
  document.querySelector(".map-container").classList.remove("mode-crosshair");
}

// Klik peta saat addMode
map.on("click", (e) => {
  if (!addMode) return;
  const { lat, lng } = e.latlng;
  document.getElementById("form-lat").value = lat.toFixed(8);
  document.getElementById("form-lng").value = lng.toFixed(8);
  cancelMode();
  bukaModal();
});

// ── MODAL FORM ────────────────────────────────────────────
function bukaModal() {
  document.getElementById("modal-overlay").style.display = "flex";
}

function tutupModal() {
  document.getElementById("modal-overlay").style.display = "none";
  editId = null;
  resetForm();
}

function resetForm() {
  ["form-id", "form-lat", "form-lng", "form-label", "form-catatan"].forEach(
    (id) => (document.getElementById(id).value = "")
  );
  document.getElementById("form-jenis").value = "ISP Sendiri";
  document.getElementById("form-kondisi").value = "Baik";
  document.getElementById("char-count").textContent = "0";
}

document.getElementById("btn-close-modal").addEventListener("click", tutupModal);
document.getElementById("btn-modal-batal").addEventListener("click", tutupModal);
document.getElementById("modal-overlay").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) tutupModal();
});

// Char counter textarea
document.getElementById("form-catatan").addEventListener("input", function () {
  document.getElementById("char-count").textContent = this.value.length;
});

// ── SIMPAN TIANG (POST/PUT) ───────────────────────────────
document.getElementById("btn-modal-simpan").addEventListener("click", async () => {
  const lat = parseFloat(document.getElementById("form-lat").value);
  const lng = parseFloat(document.getElementById("form-lng").value);

  if (isNaN(lat) || isNaN(lng)) {
    toast("Koordinat belum diisi. Klik peta atau isi manual.", "warning");
    return;
  }

  const payload = {
    latitude: lat,
    longitude: lng,
    label: document.getElementById("form-label").value.trim() || undefined,
    jenis: document.getElementById("form-jenis").value,
    kondisi: document.getElementById("form-kondisi").value,
    catatan: document.getElementById("form-catatan").value.trim() || undefined,
  };

  const isEdit = !!editId;
  const url = isEdit ? `${API}/${editId}` : API;
  const method = isEdit ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();

    if (!json.success) throw new Error(json.message);

    toast(json.message, "success");
    tutupModal();
    await loadData(getFilters());
  } catch (e) {
    toast(`Gagal menyimpan: ${e.message}`, "error");
  }
});

// ── EDIT ──────────────────────────────────────────────────
function bukaEdit(id) {
  const tItem = allData.find((t) => t.id === id);
  if (!tItem) return;
  editId = id;

  document.getElementById("modal-title").textContent = `Edit ${tItem.kode}`;
  document.getElementById("form-id").value = tItem.id;
  document.getElementById("form-lat").value = tItem.latitude;
  document.getElementById("form-lng").value = tItem.longitude;
  document.getElementById("form-label").value = tItem.label || "";
  document.getElementById("form-jenis").value = tItem.jenis;
  document.getElementById("form-kondisi").value = tItem.kondisi;
  document.getElementById("form-catatan").value = tItem.catatan || "";
  document.getElementById("char-count").textContent = (tItem.catatan || "").length;

  bukaModal();
}

// ── HAPUS ─────────────────────────────────────────────────
function bukaHapus(id, kode) {
  hapusId = id;
  document.getElementById("hapus-kode").textContent = kode;
  document.getElementById("modal-hapus").style.display = "flex";
}

document.getElementById("btn-hapus-batal").addEventListener("click", () => {
  hapusId = null;
  document.getElementById("modal-hapus").style.display = "none";
});

document.getElementById("btn-hapus-konfirm").addEventListener("click", async () => {
  if (!hapusId) return;
  try {
    const res = await fetch(`${API}/${hapusId}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    toast(json.message, "success");
    document.getElementById("modal-hapus").style.display = "none";
    hapusId = null;
    await loadData(getFilters());
  } catch (e) {
    toast(`Gagal hapus: ${e.message}`, "error");
  }
});

// ── FILTER & SEARCH ───────────────────────────────────────
function getFilters() {
  const search = document.getElementById("input-search").value.trim();
  const jenis = document.getElementById("filter-jenis").value;
  const kondisi = document.getElementById("filter-kondisi").value;
  const params = {};
  if (search) params.search = search;
  if (jenis) params.jenis = jenis;
  if (kondisi) params.kondisi = kondisi;
  return params;
}

let searchTimer;
document.getElementById("input-search").addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadData(getFilters()), 400);
});
document.getElementById("filter-jenis").addEventListener("change", () => loadData(getFilters()));
document.getElementById("filter-kondisi").addEventListener("change", () => loadData(getFilters()));

// ── MAP CONTROLS ──────────────────────────────────────────
document.getElementById("btn-lokasi").addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      map.flyTo([coords.latitude, coords.longitude], 17);
      toast("Lokasi ditemukan!", "success");
    },
    () => toast("Izin lokasi ditolak", "warning")
  );
});

document.getElementById("btn-layer").addEventListener("click", () => {
  isSatellite = !isSatellite;
  if (isSatellite) {
    map.removeLayer(layerOSM);
    layerSatelit.addTo(map);
    document.getElementById("btn-layer").textContent = "🗺️";
  } else {
    map.removeLayer(layerSatelit);
    layerOSM.addTo(map);
    document.getElementById("btn-layer").textContent = "🛰️";
  }
});

document.getElementById("btn-fitall").addEventListener("click", () => {
  const pts = Object.values(markers).map((m) => m.getLatLng());
  if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.2));
});

// ── SIDEBAR COLLAPSE ──────────────────────────────────────
document.getElementById("btn-collapse").addEventListener("click", () => {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("collapsed");
  document.getElementById("btn-collapse").textContent = sidebar.classList.contains("collapsed") ? "▶" : "◀";
  map.invalidateSize();
});

// ── DROPDOWN EXPORT ───────────────────────────────────────
document.getElementById("btn-export").addEventListener("click", (e) => {
  e.stopPropagation();
  document.getElementById("dropdown-export").classList.toggle("show");
});
document.addEventListener("click", () => {
  document.getElementById("dropdown-export").classList.remove("show");
});

// ── TOAST NOTIFICATION ────────────────────────────────────
function toast(msg, type = "success") {
  const container = document.getElementById("toast-container");
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  const icons = { success: "✅", warning: "⚠️", error: "❌" };
  el.innerHTML = `<span class="toast-icon">${icons[type] || "ℹ️"}</span> ${msg}`;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add("toast-hide");
    setTimeout(() => el.remove(), 400);
  }, 3500);
}

// ── STATUS BAR ────────────────────────────────────────────
function setStatus(msg, waktu = null) {
  document.getElementById("status-msg").textContent = msg;
  if (waktu) {
    document.getElementById("status-time").textContent =
      "Update: " + waktu.toLocaleTimeString("id-ID");
  }
}

// ── INIT ──────────────────────────────────────────────────
loadData();
