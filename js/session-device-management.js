/* =========================================================
   FATHKIT — SESSION & DEVICE MANAGEMENT
   Stage 44
   ========================================================= */

(() => {
  "use strict";

  if (window.FATHKIT_SESSION_DEVICES) {
    return;
  }

  const STORAGE_KEY = "fathkit_device_activity";
  const PANEL_ID = "fkSessionDevicePanel";
  const BUTTON_ID = "fkSessionDeviceButton";

  const state = {
    initialized: false,
    panel: null,
    button: null
  };

  function getDeviceInfo() {
    const ua = navigator.userAgent || "";
    let device = "Perangkat tidak dikenali";

    if (/Android/i.test(ua)) {
      device = "Android";
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      device = "Apple iOS";
    } else if (/Windows/i.test(ua)) {
      device = "Windows";
    } else if (/Macintosh|Mac OS/i.test(ua)) {
      device = "Mac";
    } else if (/Linux/i.test(ua)) {
      device = "Linux";
    }

    let browser = "Browser tidak dikenali";

    if (/Edg/i.test(ua)) {
      browser = "Microsoft Edge";
    } else if (/OPR|Opera/i.test(ua)) {
      browser = "Opera";
    } else if (/Firefox/i.test(ua)) {
      browser = "Mozilla Firefox";
    } else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) {
      browser = "Google Chrome";
    } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
      browser = "Safari";
    }

    return {
      device,
      browser,
      platform: navigator.platform || "Tidak diketahui",
      language: navigator.language || "Tidak diketahui",
      online: navigator.onLine,
      secure: window.isSecureContext,
      userAgent: ua
    };
  }

  function getCurrentUser() {
    try {
      if (
        window.FATHKIT_CURRENT_USER &&
        typeof window.FATHKIT_CURRENT_USER === "object"
      ) {
        return window.FATHKIT_CURRENT_USER;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  function getAuthStatus() {
    const user = getCurrentUser();

    if (user && user.id) {
      return {
        loggedIn: true,
        email: user.email || "Email tidak tersedia",
        userId: user.id
      };
    }

    return {
      loggedIn: false,
      email: null,
      userId: null
    };
  }

  function readActivity() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return {
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        };
      }

      const data = JSON.parse(raw);

      return {
        firstSeen: data.firstSeen || new Date().toISOString(),
        lastSeen: data.lastSeen || new Date().toISOString()
      };
    } catch (error) {
      return {
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      };
    }
  }

  function updateActivity() {
    const activity = readActivity();

    const updated = {
      firstSeen: activity.firstSeen,
      lastSeen: new Date().toISOString()
    };

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.warn(
        "[FathKit Session] Aktivitas lokal tidak dapat disimpan.",
        error
      );
    }

    return updated;
  }

  function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Tidak diketahui";
    }

    return date.toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      };

      return entities[character];
    });
  }

  function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) {
      console.info("[FathKit]", message);
      return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    window.clearTimeout(showToast.timeout);

    showToast.timeout = window.setTimeout(() => {
      toast.classList.remove("show");
    }, 2800);
  }

  function createStyles() {
    if (document.getElementById("fkSessionDeviceStyles")) {
      return;
    }

    const style = document.createElement("style");

    style.id = "fkSessionDeviceStyles";

    style.textContent = `
      #${BUTTON_ID} {
        position: fixed;
        right: 16px;
        bottom: 245px;
        z-index: 8999;
        padding: 11px 14px;
        border: 0;
        border-radius: 12px;
        background: #1d4ed8;
        color: white;
        font-size: 12px;
        font-weight: 700;
        box-shadow: 0 5px 20px rgba(0,0,0,.16);
        cursor: pointer;
      }

      #${PANEL_ID} {
        position: fixed;
        inset: 0;
        z-index: 13000;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 14px;
        background: rgba(15,23,42,.68);
      }

      #${PANEL_ID}.fk-session-open {
        display: flex;
      }

      .fk-session-card {
        width: min(560px, 100%);
        max-height: 88vh;
        overflow-y: auto;
        border-radius: 18px;
        background: white;
        color: #111827;
        box-shadow: 0 20px 60px rgba(0,0,0,.25);
      }

      .fk-session-header {
        position: sticky;
        top: 0;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 17px 19px;
        border-bottom: 1px solid #e5e7eb;
        background: white;
      }

      .fk-session-header h2 {
        margin: 0;
        font-size: 19px;
      }

      .fk-session-close {
        width: 36px;
        height: 36px;
        border: 0;
        border-radius: 9px;
        background: #f1f5f9;
        font-size: 22px;
        cursor: pointer;
      }

      .fk-session-content {
        padding: 18px;
      }

      .fk-session-status {
        padding: 14px;
        border-radius: 12px;
        background: #eff6ff;
        color: #1e40af;
        font-size: 13px;
        line-height: 1.6;
      }

      .fk-session-device {
        margin-top: 16px;
        padding: 15px;
        border: 1px solid #e5e7eb;
        border-radius: 13px;
      }

      .fk-session-device h3 {
        margin: 0 0 12px;
        font-size: 15px;
      }

      .fk-session-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 9px 0;
        border-bottom: 1px solid #f1f5f9;
        font-size: 12px;
      }

      .fk-session-row:last-child {
        border-bottom: 0;
      }

      .fk-session-row span:first-child {
        color: #64748b;
      }

      .fk-session-row span:last-child {
        max-width: 60%;
        text-align: right;
        overflow-wrap: anywhere;
        font-weight: 600;
      }

      .fk-session-section {
        margin-top: 22px;
      }

      .fk-session-section h3 {
        margin: 0 0 10px;
        font-size: 15px;
      }

      .fk-session-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 9px;
        margin-top: 16px;
      }

      .fk-session-action {
        padding: 10px 13px;
        border: 0;
        border-radius: 9px;
        background: #2563eb;
        color: white;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }

      .fk-session-action.secondary {
        background: #e2e8f0;
        color: #1e293b;
      }

      .fk-session-note {
        margin-top: 17px;
        color: #64748b;
        font-size: 11px;
        line-height: 1.7;
      }

      @media (max-width: 480px) {
        #${BUTTON_ID} {
          right: 10px;
          bottom: 240px;
          padding: 10px 11px;
          font-size: 11px;
        }

        .fk-session-content {
          padding: 14px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function renderDevice() {
    const device = getDeviceInfo();
    const activity = updateActivity();
    const auth = getAuthStatus();

    return `
      <div class="fk-session-device">
        <h3>📱 Perangkat saat ini</h3>

        <div class="fk-session-row">
          <span>Perangkat</span>
          <span>${escapeHTML(device.device)}</span>
        </div>

        <div class="fk-session-row">
          <span>Browser</span>
          <span>${escapeHTML(device.browser)}</span>
        </div>

        <div class="fk-session-row">
          <span>Platform</span>
          <span>${escapeHTML(device.platform)}</span>
        </div>

        <div class="fk-session-row">
          <span>Bahasa</span>
          <span>${escapeHTML(device.language)}</span>
        </div>

        <div class="fk-session-row">
          <span>Koneksi</span>
          <span>${device.online ? "Online" : "Offline"}</span>
        </div>

        <div class="fk-session-row">
          <span>Konteks aman</span>
          <span>${device.secure ? "Terdeteksi" : "Tidak terdeteksi"}</span>
        </div>

        <div class="fk-session-row">
          <span>Login FathKit</span>
          <span>${auth.loggedIn ? "Terdeteksi" : "Belum login"}</span>
        </div>

        <div class="fk-session-row">
          <span>Waktu pertama tercatat</span>
          <span>${escapeHTML(formatDate(activity.firstSeen))}</span>
        </div>

        <div class="fk-session-row">
          <span>Aktivitas terakhir</span>
          <span>${escapeHTML(formatDate(activity.lastSeen))}</span>
        </div>
      </div>
    `;
  }

  function renderPanel() {
    const panel = document.createElement("div");

    panel.id = PANEL_ID;
    panel.setAttribute("aria-hidden", "true");

    panel.innerHTML = `
      <div
        class="fk-session-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fkSessionTitle"
      >
        <div class="fk-session-header">
          <h2 id="fkSessionTitle">
            Sesi & Perangkat
          </h2>

          <button
            type="button"
            class="fk-session-close"
            id="fkSessionClose"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <div class="fk-session-content">

          <div class="fk-session-status" id="fkSessionLoginStatus">
            Memeriksa status akun...
          </div>

          <div id="fkSessionDeviceInfo">
            ${renderDevice()}
          </div>

          <section class="fk-session-section">
            <h3>Pengelolaan sesi</h3>

            <p style="font-size:12px;line-height:1.7;color:#64748b">
              Informasi yang ditampilkan di sini berasal dari
              browser yang sedang digunakan. Daftar seluruh
              perangkat yang login belum tersedia tanpa layanan
              pengelolaan sesi di backend.
            </p>

            <div class="fk-session-actions">
              <button
                type="button"
                class="fk-session-action"
                id="fkSessionRefresh"
              >
                Perbarui Informasi
              </button>

              <button
                type="button"
                class="fk-session-action secondary"
                id="fkSessionSignOut"
              >
                Keluar dari Akun Ini
              </button>
            </div>
          </section>

          <div class="fk-session-note">
            Jangan gunakan tombol keluar jika kamu belum siap
            login kembali. Fitur keluar hanya berlaku untuk
            akun pada sesi browser ini, bukan untuk semua
            perangkat yang mungkin sedang login.
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(panel);

    state.panel = panel;

    panel.querySelector("#fkSessionClose")
      .addEventListener("click", closePanel);

    panel.addEventListener("click", (event) => {
      if (event.target === panel) {
        closePanel();
      }
    });

    panel.querySelector("#fkSessionRefresh")
      .addEventListener("click", refreshPanel);

    panel.querySelector("#fkSessionSignOut")
      .addEventListener("click", signOutCurrentSession);

    updateLoginStatus();
  }

  function updateLoginStatus() {
    if (!state.panel) {
      return;
    }

    const target =
      state.panel.querySelector("#fkSessionLoginStatus");

    const auth = getAuthStatus();

    if (auth.loggedIn) {
      target.textContent =
        "Akun terdeteksi sedang login. Email: " + auth.email;
    } else {
      target.textContent =
        "Belum ada akun FathKit yang terdeteksi sedang login.";
    }
  }

  function refreshPanel() {
    if (!state.panel) {
      return;
    }

    const target =
      state.panel.querySelector("#fkSessionDeviceInfo");

    target.innerHTML = renderDevice();

    updateLoginStatus();

    showToast("Informasi perangkat diperbarui.");
  }

  async function signOutCurrentSession() {
    const auth = getAuthStatus();

    if (!auth.loggedIn) {
      showToast("Kamu belum login.");
      return;
    }

    if (
      !window.confirm(
        "Yakin ingin keluar dari akun FathKit pada perangkat ini?"
      )
    ) {
      return;
    }

    if (
      !window.FATHKIT_AUTH ||
      typeof window.FATHKIT_AUTH.signOut !== "function"
    ) {
      showToast("Fitur keluar akun belum tersedia.");
      return;
    }

    try {
      const result = await window.FATHKIT_AUTH.signOut();

      if (result && result.error) {
        throw result.error;
      }

      showToast("Permintaan keluar akun telah dijalankan.");

      window.setTimeout(() => {
        refreshPanel();
      }, 300);

    } catch (error) {
      console.error(
        "[FathKit Session] Gagal keluar:",
        error
      );

      showToast("Gagal keluar. Silakan coba melalui menu akun.");
    }
  }

  function openPanel() {
    if (!state.panel) {
      return;
    }

    refreshPanel();

    state.panel.classList.add("fk-session-open");
    state.panel.setAttribute("aria-hidden", "false");

    const closeButton =
      state.panel.querySelector("#fkSessionClose");

    if (closeButton) {
      closeButton.focus();
    }
  }

  function closePanel() {
    if (!state.panel) {
      return;
    }

    state.panel.classList.remove("fk-session-open");
    state.panel.setAttribute("aria-hidden", "true");

    if (state.button) {
      state.button.focus();
    }
  }

  function createButton() {
    const button = document.createElement("button");

    button.type = "button";
    button.id = BUTTON_ID;
    button.textContent = "📱 Sesi & Perangkat";

    button.setAttribute(
      "aria-label",
      "Buka pengelolaan sesi dan perangkat"
    );

    button.addEventListener("click", openPanel);

    document.body.appendChild(button);

    state.button = button;
  }

  function init() {
    if (state.initialized || !document.body) {
      return;
    }

    if (
      document.getElementById(PANEL_ID) ||
      document.getElementById(BUTTON_ID)
    ) {
      return;
    }

    createStyles();
    renderPanel();
    createButton();

    state.initialized = true;

    console.info(
      "[FathKit] Session & Device Management siap."
    );
  }

  window.FATHKIT_SESSION_DEVICES = {
    init,
    open: openPanel,
    close: closePanel,
    getDeviceInfo,
    getAuthStatus,
    refresh: refreshPanel
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
      once: true
    });
  } else {
    init();
  }

})();