# 🖥️ FRONTEND — Tiang Mapper Pro BITNET
# File: public/index.html + public/js/app.js + public/css/app.css
# Served via ElysiaJS staticPlugin — bukan file terpisah lagi

---

## FILOSOFI FRONTEND

Data TIDAK lagi disimpan di localStorage.
Semua data dari **MySQL via API** (`/api/tiang`).
Frontend hanya:
1. Render peta Leaflet
2. Call API (fetch)
3. Tampilkan hasilnya

---

## `public/index.html`

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title id="page-title">Tiang Mapper Pro — BITNET</title>

  <!-- Leaflet CSS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

  <!-- Google Fonts: Inter + Roboto Mono -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet" />

  <link rel="stylesheet" href="/css/app.css" />
</head>
<body>

  <!-- ═══ HEADER ════════════════════════════════════════════════ -->
  <header class="header">
    <div class="header-brand">
      <span class="brand-icon">🗼</span>
      <div>
        <span class="brand-name">Tiang Mapper Pro</span>
        <span class="brand-sub">BITNET RT RW NET</span>
      </div>
    </div>

    <div class="header-actions">
      <button id="btn-tambah" class="btn btn-primary">
        ＋ Tambah Tiang
      </button>

      <div class="dropdown">
        <button class="btn btn-secondary" id="btn-export">
          📤 Export ▾
        </button>
        <div class="dropdown-menu" id="dropdown-export">
          <a href="/api/export/kml" class="dropdown-item">🌍 Export KML (Google Earth)</a>
          <a href="/api/export/csv" class="dropdown-item">📊 Export CSV (Excel)</a>
          <a href="/api/export/json" class="dropdown-item">💾 Backup JSON</a>
        </div>
      </div>

      <a href="/swagger" target="_blank" class="btn btn-ghost" title="API Docs">
        📖 API
      </a>
    </div>
  </header>

  <!-- ═══ LAYOUT UTAMA ══════════════════════════════════════════ -->
  <div class="layout">

    <!-- SIDEBAR -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <span>📋 Data Tiang</span>
        <button id="btn-collapse" class="btn-icon" title="Collapse">◀</button>
      </div>

      <!-- STATISTIK -->
      <div class="stats-grid">
        <div class="stat-card stat-total">
          <span class="stat-num" id="stat-total">0</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-card stat-pln">
          <span class="stat-num" id="stat-pln">0</span>
          <span class="stat-label">PLN</span>
        </div>
        <div class="stat-card stat-telkom">
          <span class="stat-num" id="stat-telkom">0</span>
          <span class="stat-label">Telkom</span>
        </div>
        <div class="stat-card stat-isp">
          <span class="stat-num" id="stat-isp">0</span>
          <span class="stat-label">ISP</span>
        </div>
      </div>

      <!-- Kondisi badges -->
      <div class="kondisi-row">
        <span class="badge badge-baik" id="badge-baik">✅ Baik: 0</span>
        <span class="badge badge-perhatian" id="badge-perhatian">⚠️ Perhatian: 0</span>
        <span class="badge badge-rusak" id="badge-rusak">❌ Rusak: 0</span>
      </div>

      <!-- Search -->
      <div class="search-box">
        <input
          type="text"
          id="input-search"
          placeholder="🔍 Cari ID atau catatan..."
          class="input-search"
        />
      </div>

      <!-- Filter -->
      <div class="filter-row">
        <select id="filter-jenis" class="select-filter">
          <option value="">Semua Jenis</option>
          <option value="PLN">PLN</option>
          <option value="Telkom">Telkom</option>
          <option value="ISP Sendiri">ISP Sendiri</option>
          <option value="Bambu">Bambu</option>
          <option value="Besi">Besi</option>
          <option value="Lainnya">Lainnya</option>
        </select>
        <select id="filter-kondisi" class="select-filter">
          <option value="">Semua Kondisi</option>
          <option value="Baik">Baik</option>
          <option value="Perlu Perhatian">Perlu Perhatian</option>
          <option value="Rusak">Rusak</option>
        </select>
      </div>

      <!-- Daftar tiang -->
      <div class="tiang-list" id="tiang-list">
        <div class="empty-state">
          <div class="empty-icon">🗼</div>
          <p>Belum ada data tiang.</p>
          <p>Klik <strong>+ Tambah Tiang</strong> untuk memulai.</p>
        </div>
      </div>
    </aside>

    <!-- PETA -->
    <main class="map-container">
      <div id="map"></div>

      <!-- Floating controls -->
      <div class="map-controls">
        <button id="btn-lokasi" class="map-btn" title="Lokasi Saya">📍</button>
        <button id="btn-layer" class="map-btn" title="Toggle Satelit">🛰️</button>
        <button id="btn-fitall" class="map-btn" title="Tampilkan Semua">🔍</button>
      </div>

      <!-- Mode indicator -->
      <div class="mode-indicator" id="mode-indicator" style="display:none">
        🎯 Klik peta untuk menandai posisi tiang
        <button id="btn-cancel-mode" class="btn-cancel-mode">Batal</button>
      </div>
    </main>
  </div>

  <!-- ═══ STATUS BAR ════════════════════════════════════════════ -->
  <footer class="status-bar">
    <span id="status-msg">Siap</span>
    <span class="status-sep">|</span>
    <span id="status-time">—</span>
    <span class="status-sep">|</span>
    <span>Tiang Mapper Pro v1.0 — BITNET | tools.ajengmedia.com</span>
  </footer>

  <!-- ═══ MODAL FORM TIANG ═══════════════════════════════════════ -->
  <div class="modal-overlay" id="modal-overlay" style="display:none">
    <div class="modal">
      <div class="modal-header">
        <h2 id="modal-title">Tambah Tiang Baru</h2>
        <button class="btn-icon" id="btn-close-modal">✕</button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="form-id" />

        <div class="form-row">
          <label>Koordinat GPS</label>
          <div class="coord-row">
            <input type="number" id="form-lat" placeholder="Latitude" step="any" class="input-coord" />
            <input type="number" id="form-lng" placeholder="Longitude" step="any" class="input-coord" />
          </div>
          <small class="form-hint">📌 Klik peta untuk isi otomatis</small>
        </div>

        <div class="form-row">
          <label>Label (opsional)</label>
          <input type="text" id="form-label" placeholder="cth: Dekat Warung Pak Budi" class="input-text" />
        </div>

        <div class="form-row-2">
          <div class="form-row">
            <label>Jenis Tiang</label>
            <select id="form-jenis" class="input-select">
              <option value="ISP Sendiri">ISP Sendiri</option>
              <option value="PLN">PLN</option>
              <option value="Telkom">Telkom</option>
              <option value="Bambu">Bambu</option>
              <option value="Besi">Besi</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div class="form-row">
            <label>Kondisi</label>
            <select id="form-kondisi" class="input-select">
              <option value="Baik">✅ Baik</option>
              <option value="Perlu Perhatian">⚠️ Perlu Perhatian</option>
              <option value="Rusak">❌ Rusak</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <label>Catatan Teknisi</label>
          <textarea id="form-catatan" placeholder="Kondisi lapangan, keterangan khusus, dll..." class="input-textarea" maxlength="500"></textarea>
          <small class="form-hint char-counter"><span id="char-count">0</span>/500</small>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="btn-modal-batal">Batal</button>
        <button class="btn btn-primary" id="btn-modal-simpan">💾 Simpan Tiang</button>
      </div>
    </div>
  </div>

  <!-- ═══ MODAL KONFIRMASI HAPUS ═══════════════════════════════ -->
  <div class="modal-overlay" id="modal-hapus" style="display:none">
    <div class="modal modal-sm">
      <div class="modal-header">
        <h2>🗑️ Hapus Tiang?</h2>
      </div>
      <div class="modal-body">
        <p>Tiang <strong id="hapus-kode">BITNET-XXX</strong> akan dihapus permanen dari database.</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="btn-hapus-batal">Batal</button>
        <button class="btn btn-danger" id="btn-hapus-konfirm">Ya, Hapus</button>
      </div>
    </div>
  </div>

  <!-- ═══ TOAST NOTIFICATIONS ════════════════════════════════════ -->
  <div id="toast-container"></div>

  <!-- Scripts -->
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="/js/app.js"></script>
</body>
</html>
```

---

## `public/js/app.js`

```javascript
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
  PLN:          { warna: "#E53935", ikon: "⚡", label: "PLN" },
  Telkom:       { warna: "#1E88E5", ikon: "📡", label: "Telkom" },
  "ISP Sendiri":{ warna: "#43A047", ikon: "🌐", label: "ISP" },
  Bambu:        { warna: "#757575", ikon: "🗼", label: "Bambu" },
  Besi:         { warna: "#546E7A", ikon: "🔩", label: "Besi" },
  Lainnya:      { warna: "#8D6E63", ikon: "🗼", label: "Lain" },
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
  // Hapus marker lama
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
  document.getElementById("stat-isp").textContent = stats.per_jenis.ISP;
  document.getElementById("badge-baik").textContent = `✅ Baik: ${stats.per_kondisi.Baik}`;
  document.getElementById("badge-perhatian").textContent = `⚠️ Perhatian: ${stats.per_kondisi.Perhatian}`;
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
```

---

## `public/css/app.css`

```css
/* ═══════════════════════════════════════════════════════════
   TIANG MAPPER PRO — BITNET
   Design: Tech-field tool, biru industri + oranye aksi
   ═══════════════════════════════════════════════════════════ */

:root {
  --biru:       #1565C0;
  --biru-dark:  #0D47A1;
  --biru-light: #E3F2FD;
  --oranye:     #FF6D00;
  --oranye-hov: #E65100;
  --hijau:      #2E7D32;
  --kuning:     #F57F17;
  --merah:      #C62828;
  --abu:        #546E7A;
  --bg:         #F0F4F8;
  --surface:    #FFFFFF;
  --border:     #CFD8DC;
  --text:       #1A237E;
  --text-muted: #607D8B;
  --font-ui:    'Inter', sans-serif;
  --font-mono:  'Roboto Mono', monospace;
  --radius:     8px;
  --shadow:     0 2px 8px rgba(0,0,0,0.12);
  --shadow-lg:  0 8px 24px rgba(0,0,0,0.18);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; font-family: var(--font-ui); background: var(--bg); color: var(--text); }

/* HEADER */
.header {
  height: 56px;
  background: var(--biru);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  z-index: 1000; position: relative;
}
.header-brand { display: flex; align-items: center; gap: 10px; }
.brand-icon { font-size: 24px; }
.brand-name { color: #fff; font-weight: 700; font-size: 16px; display: block; }
.brand-sub { color: #90CAF9; font-size: 11px; display: block; line-height: 1; }
.header-actions { display: flex; gap: 8px; align-items: center; }

/* BUTTONS */
.btn {
  padding: 7px 14px; border: none; border-radius: var(--radius);
  cursor: pointer; font-size: 13px; font-weight: 600; font-family: var(--font-ui);
  transition: background 0.15s, transform 0.1s;
}
.btn:active { transform: scale(0.97); }
.btn-primary { background: var(--oranye); color: #fff; }
.btn-primary:hover { background: var(--oranye-hov); }
.btn-secondary { background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.3); }
.btn-secondary:hover { background: rgba(255,255,255,0.25); }
.btn-ghost { background: transparent; color: #90CAF9; }
.btn-ghost:hover { background: rgba(255,255,255,0.1); }
.btn-danger { background: var(--merah); color: #fff; }
.btn-danger:hover { background: #B71C1C; }
.btn-icon { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 16px; padding: 4px; border-radius: 4px; }
.btn-icon:hover { background: var(--biru-light); }

/* DROPDOWN */
.dropdown { position: relative; }
.dropdown-menu {
  position: absolute; right: 0; top: calc(100% + 6px);
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); box-shadow: var(--shadow-lg);
  min-width: 220px; display: none; z-index: 9999;
}
.dropdown-menu.show { display: block; }
.dropdown-item {
  display: block; padding: 10px 14px; color: var(--text);
  text-decoration: none; font-size: 13px;
  transition: background 0.1s;
}
.dropdown-item:hover { background: var(--biru-light); }

/* LAYOUT */
.layout {
  display: flex;
  height: calc(100vh - 56px - 32px); /* minus header + statusbar */
}

/* SIDEBAR */
.sidebar {
  width: 300px; min-width: 300px;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  overflow: hidden;
  transition: width 0.3s, min-width 0.3s;
}
.sidebar.collapsed { width: 0; min-width: 0; }
.sidebar-header {
  padding: 12px 14px;
  background: var(--biru-light);
  border-bottom: 1px solid var(--border);
  display: flex; justify-content: space-between; align-items: center;
  font-weight: 600; font-size: 13px; color: var(--biru);
  white-space: nowrap;
}

/* STATISTIK */
.stats-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 6px; padding: 10px;
}
.stat-card {
  background: var(--bg); border-radius: 6px;
  padding: 8px 4px; text-align: center;
  border-top: 3px solid var(--border);
}
.stat-total { border-top-color: var(--biru); }
.stat-pln   { border-top-color: #E53935; }
.stat-telkom{ border-top-color: #1E88E5; }
.stat-isp   { border-top-color: #43A047; }
.stat-num { display: block; font-size: 20px; font-weight: 700; color: var(--text); }
.stat-label { display: block; font-size: 10px; color: var(--text-muted); text-transform: uppercase; }

.kondisi-row {
  display: flex; gap: 4px; padding: 0 10px 8px;
  flex-wrap: wrap;
}
.badge {
  font-size: 11px; padding: 3px 8px;
  border-radius: 20px; font-weight: 600;
}
.badge-baik     { background: #E8F5E9; color: var(--hijau); }
.badge-perhatian{ background: #FFF8E1; color: var(--kuning); }
.badge-rusak    { background: #FFEBEE; color: var(--merah); }

.search-box { padding: 6px 10px; }
.input-search {
  width: 100%; padding: 7px 10px; border: 1px solid var(--border);
  border-radius: var(--radius); font-size: 13px; font-family: var(--font-ui);
}
.input-search:focus { outline: none; border-color: var(--biru); }

.filter-row { display: flex; gap: 6px; padding: 0 10px 8px; }
.select-filter {
  flex: 1; padding: 6px 8px; border: 1px solid var(--border);
  border-radius: var(--radius); font-size: 12px; font-family: var(--font-ui);
}

.tiang-list { flex: 1; overflow-y: auto; padding: 4px; }
.tiang-item {
  padding: 10px 12px; cursor: pointer;
  border-radius: 6px; margin-bottom: 2px;
  border: 1px solid transparent;
  transition: background 0.1s, border-color 0.1s;
}
.tiang-item:hover { background: var(--biru-light); border-color: #BBDEFB; }
.tiang-item-main { display: flex; justify-content: space-between; align-items: center; }
.tiang-kode { font-weight: 700; font-size: 13px; font-family: var(--font-mono); color: var(--biru); }
.tiang-jenis { font-size: 11px; color: var(--text-muted); }
.tiang-item-sub { display: flex; align-items: center; gap: 6px; margin-top: 2px; }
.kondisi-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.kondisi-baik     { background: #43A047; }
.kondisi-perhatian{ background: #FFA000; }
.kondisi-rusak    { background: #E53935; }
.tiang-kondisi { font-size: 11px; color: var(--text-muted); }
.tiang-label-small { font-size: 11px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.empty-state { text-align: center; padding: 40px 20px; color: var(--text-muted); }
.empty-icon { font-size: 40px; margin-bottom: 10px; }

/* MAP */
.map-container { flex: 1; position: relative; }
#map { width: 100%; height: 100%; }
.map-container.mode-crosshair #map { cursor: crosshair !important; }

.map-controls {
  position: absolute; top: 80px; right: 10px;
  display: flex; flex-direction: column; gap: 4px; z-index: 999;
}
.map-btn {
  width: 36px; height: 36px; border: none; border-radius: 8px;
  background: var(--surface); box-shadow: var(--shadow);
  cursor: pointer; font-size: 18px;
  transition: transform 0.1s, box-shadow 0.1s;
}
.map-btn:hover { transform: scale(1.1); box-shadow: var(--shadow-lg); }

.mode-indicator {
  position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
  background: var(--biru); color: #fff;
  padding: 10px 18px; border-radius: 30px;
  box-shadow: var(--shadow-lg); z-index: 999;
  display: flex; align-items: center; gap: 12px;
  font-size: 14px; font-weight: 500; white-space: nowrap;
}
.btn-cancel-mode {
  background: rgba(255,255,255,0.25); border: none; color: #fff;
  padding: 4px 12px; border-radius: 20px; cursor: pointer; font-size: 12px;
}

/* STATUS BAR */
.status-bar {
  height: 32px; background: var(--biru-dark); color: #90CAF9;
  display: flex; align-items: center; padding: 0 16px;
  font-size: 12px; gap: 8px;
}
.status-sep { opacity: 0.4; }

/* MODAL */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 10000; padding: 16px;
}
.modal {
  background: var(--surface); border-radius: 12px;
  width: 100%; max-width: 520px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}
.modal-sm { max-width: 360px; }
.modal-header {
  padding: 16px 20px; background: var(--biru-light);
  border-bottom: 1px solid var(--border);
  display: flex; justify-content: space-between; align-items: center;
}
.modal-header h2 { font-size: 16px; color: var(--biru); }
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer {
  padding: 14px 20px; border-top: 1px solid var(--border);
  display: flex; justify-content: flex-end; gap: 10px;
  background: var(--bg);
}

.form-row { display: flex; flex-direction: column; gap: 4px; }
.form-row label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.coord-row { display: flex; gap: 8px; }
.input-text, .input-select, .input-textarea, .input-coord {
  padding: 8px 10px; border: 1px solid var(--border);
  border-radius: var(--radius); font-size: 14px; font-family: var(--font-ui);
  width: 100%; background: var(--surface);
  transition: border-color 0.15s;
}
.input-coord { font-family: var(--font-mono); font-size: 12px; }
.input-text:focus, .input-select:focus, .input-textarea:focus, .input-coord:focus {
  outline: none; border-color: var(--biru); box-shadow: 0 0 0 3px rgba(21,101,192,0.12);
}
.input-textarea { min-height: 80px; resize: vertical; }
.form-hint { font-size: 11px; color: var(--text-muted); }
.char-counter { text-align: right; }

/* POPUP TIANG */
.popup-tiang { min-width: 220px; font-size: 13px; }
.popup-header { margin-bottom: 8px; }
.popup-kode { font-family: var(--font-mono); font-size: 15px; color: var(--biru); }
.popup-label { display: block; font-size: 12px; color: var(--text-muted); }
.popup-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
.popup-table td { padding: 3px 6px; }
.popup-table td:first-child { font-weight: 600; color: var(--text-muted); font-size: 11px; text-transform: uppercase; white-space: nowrap; }
.popup-catatan { font-style: italic; color: var(--text-muted); padding-top: 6px; }
.mono { font-family: var(--font-mono); font-size: 12px; }
.popup-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.popup-btn {
  flex: 1; padding: 6px 8px; border: none; border-radius: 6px;
  cursor: pointer; font-size: 12px; font-weight: 600;
  text-decoration: none; text-align: center; display: inline-block;
  transition: filter 0.15s;
}
.popup-btn:hover { filter: brightness(0.9); }
.popup-btn-sv     { background: #E3F2FD; color: var(--biru); }
.popup-btn-edit   { background: #E8F5E9; color: var(--hijau); }
.popup-btn-hapus  { background: #FFEBEE; color: var(--merah); flex: 0; }

/* TOAST */
#toast-container {
  position: fixed; bottom: 50px; right: 16px;
  display: flex; flex-direction: column; gap: 8px; z-index: 99999;
}
.toast {
  padding: 12px 16px; border-radius: 10px;
  box-shadow: var(--shadow-lg); font-size: 13px; font-weight: 500;
  display: flex; align-items: center; gap: 8px;
  animation: slideIn 0.3s ease; min-width: 240px; max-width: 340px;
}
.toast-success  { background: #E8F5E9; color: #1B5E20; border-left: 4px solid #43A047; }
.toast-warning  { background: #FFF8E1; color: #E65100; border-left: 4px solid #FFA000; }
.toast-error    { background: #FFEBEE; color: #B71C1C; border-left: 4px solid #E53935; }
.toast-hide     { animation: slideOut 0.3s ease forwards; }
.toast-icon     { font-size: 16px; }
@keyframes slideIn  { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
@keyframes slideOut { to   { opacity: 0; transform: translateX(40px); } }

/* SCROLLBAR */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--abu); }

/* RESPONSIVE */
@media (max-width: 768px) {
  .sidebar { position: absolute; z-index: 500; height: 100%; }
  .sidebar:not(.collapsed) { box-shadow: var(--shadow-lg); }
  .brand-sub { display: none; }
  .header-actions .btn-ghost { display: none; }
}
```
