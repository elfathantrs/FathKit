/* =========================================================
   FATHKIT — SECURITY & PRIVACY CENTER
   Stage 43
   ========================================================= */

(() => {
  "use strict";

  if (window.FATHKIT_SECURITY_PRIVACY) {
    return;
  }

  const STORAGE_KEY = "fathkit_security_privacy_preferences";
  const PANEL_ID = "fkSecurityPrivacyPanel";
  const BUTTON_ID = "fkSecurityPrivacyButton";

  const state = {
    panel: null,
    button: null,
    initialized: false
  };

  function getPreferences() {
    const defaults = {
      analytics: false,
      personalizedExperience: false
    };

    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        return defaults;
      }

      const parsed = JSON.parse(saved);

      return {
        analytics: parsed.analytics === true,
        personalizedExperience:
          parsed.personalizedExperience === true
      };
    } catch (error) {
      console.warn(
        "[FathKit Security] Preferensi tidak dapat dibaca.",
        error
      );

      return defaults;
    }
  }

  function savePreferences(preferences) {
    const safePreferences = {
      analytics: preferences.analytics === true,
      personalizedExperience:
        preferences.personalizedExperience === true
    };

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(safePreferences)
      );

      document.dispatchEvent(
        new CustomEvent("fathkit:privacy-preferences-changed", {
          detail: safePreferences
        })
      );

      return true;
    } catch (error) {
      console.error(
        "[FathKit Security] Gagal menyimpan preferensi.",
        error
      );

      return false;
    }
  }

  function getSecurityChecks() {
    const checks = [];

    checks.push({
      name: "Koneksi HTTPS",
      status: window.isSecureContext,
      detail: window.isSecureContext
        ? "Browser melaporkan konteks aman."
        : "Koneksi belum terdeteksi sebagai konteks aman."
    });

    checks.push({
      name: "Local Storage",
      status: testLocalStorage(),
      detail: testLocalStorage()
        ? "Browser dapat mengakses penyimpanan lokal."
        : "Penyimpanan lokal tidak tersedia."
    });

    checks.push({
      name: "Supabase",
      status: Boolean(
        window.FATHKIT_SUPABASE &&
        window.FATHKIT_SUPABASE.client
      ),
      detail: window.FATHKIT_SUPABASE &&
        window.FATHKIT_SUPABASE.client
        ? "Client Supabase terdeteksi."
        : "Client Supabase belum terdeteksi."
    });

    checks.push({
      name: "Autentikasi",
      status: Boolean(
        window.FATHKIT_AUTH &&
        typeof window.FATHKIT_AUTH.signOut === "function"
      ),
      detail: window.FATHKIT_AUTH
        ? "Modul autentikasi terdeteksi."
        : "Modul autentikasi belum terdeteksi."
    });

    return checks;
  }

  function testLocalStorage() {
    const key = "__fathkit_security_test__";

    try {
      localStorage.setItem(key, "1");
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
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
    if (document.getElementById("fkSecurityPrivacyStyles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "fkSecurityPrivacyStyles";

    style.textContent = `
      #${BUTTON_ID} {
        position: fixed;
        right: 16px;
        bottom: 190px;
        z-index: 9000;
        border: 0;
        border-radius: 12px;
        padding: 12px 15px;
        background: #0f172a;
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        box-shadow: 0 5px 20px rgba(0,0,0,.18);
        cursor: pointer;
      }

      #${PANEL_ID} {
        position: fixed;
        inset: 0;
        z-index: 12000;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 14px;
        background: rgba(15,23,42,.65);
      }

      #${PANEL_ID}.fk-security-open {
        display: flex;
      }

      .fk-security-card {
        width: min(560px, 100%);
        max-height: 88vh;
        overflow-y: auto;
        background: #fff;
        color: #111827;
        border-radius: 18px;
        box-shadow: 0 20px 60px rgba(0,0,0,.25);
      }

      .fk-security-header {
        position: sticky;
        top: 0;
        z-index: 2;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 17px 19px;
        border-bottom: 1px solid #e5e7eb;
        background: #fff;
      }

      .fk-security-header h2 {
        margin: 0;
        font-size: 19px;
      }

      .fk-security-close {
        width: 36px;
        height: 36px;
        border: 0;
        border-radius: 9px;
        background: #f1f5f9;
        font-size: 22px;
        cursor: pointer;
      }

      .fk-security-content {
        padding: 18px;
      }

      .fk-security-intro {
        padding: 14px;
        border-radius: 12px;
        background: #eff6ff;
        color: #1e40af;
        font-size: 13px;
        line-height: 1.6;
      }

      .fk-security-section {
        margin-top: 22px;
      }

      .fk-security-section h3 {
        margin: 0 0 12px;
        font-size: 15px;
      }

      .fk-security-check {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid #e5e7eb;
      }

      .fk-security-check strong {
        display: block;
        font-size: 13px;
      }

      .fk-security-check small {
        display: block;
        margin-top: 4px;
        color: #64748b;
        font-size: 11px;
        line-height: 1.5;
      }

      .fk-security-status {
        flex-shrink: 0;
        align-self: flex-start;
        font-size: 11px;
        font-weight: 700;
      }

      .fk-security-status.ok {
        color: #15803d;
      }

      .fk-security-status.warning {
        color: #b45309;
      }

      .fk-security-preference {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 12px 0;
        border-bottom: 1px solid #e5e7eb;
      }

      .fk-security-preference input {
        width: 18px;
        height: 18px;
        margin-top: 2px;
      }

      .fk-security-preference strong {
        display: block;
        font-size: 13px;
      }

      .fk-security-preference small {
        display: block;
        margin-top: 4px;
        color: #64748b;
        font-size: 11px;
        line-height: 1.5;
      }

      .fk-security-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 9px;
        margin-top: 18px;
      }

      .fk-security-action {
        padding: 10px 13px;
        border: 0;
        border-radius: 9px;
        background: #2563eb;
        color: #fff;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }

      .fk-security-action.secondary {
        background: #e2e8f0;
        color: #1e293b;
      }

      .fk-security-note {
        margin-top: 17px;
        color: #64748b;
        font-size: 11px;
        line-height: 1.6;
      }

      @media (max-width: 480px) {
        #${BUTTON_ID} {
          right: 10px;
          bottom: 185px;
          padding: 10px 12px;
          font-size: 11px;
        }

        .fk-security-content {
          padding: 14px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function renderChecks() {
    const checks = getSecurityChecks();

    return checks.map((check) => `
      <div class="fk-security-check">
        <div>
          <strong>${escapeHTML(check.name)}</strong>
          <small>${escapeHTML(check.detail)}</small>
        </div>

        <span class="fk-security-status ${
          check.status ? "ok" : "warning"
        }">
          ${check.status ? "TERDETEKSI" : "PERLU CEK"}
        </span>
      </div>
    `).join("");
  }

  function renderPreferences() {
    const preferences = getPreferences();

    return `
      <label class="fk-security-preference">
        <input
          type="checkbox"
          id="fkPrivacyAnalytics"
          ${preferences.analytics ? "checked" : ""}
        >

        <span>
          <strong>Analitik penggunaan</strong>
          <small>
            Preferensi ini disimpan sebagai pilihan pengguna.
            Mengaktifkannya belum otomatis mengirim data analitik.
          </small>
        </span>
      </label>

      <label class="fk-security-preference">
        <input
          type="checkbox"
          id="fkPrivacyPersonalization"
          ${preferences.personalizedExperience ? "checked" : ""}
        >

        <span>
          <strong>Personalisasi pengalaman</strong>
          <small>
            Menyimpan pilihan bahwa pengguna mengizinkan
            pengalaman yang dipersonalisasi.
          </small>
        </span>
      </label>
    `;
  }

  function renderPanel() {
    const panel = document.createElement("div");

    panel.id = PANEL_ID;
    panel.setAttribute("aria-hidden", "true");

    panel.innerHTML = `
      <div
        class="fk-security-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fkSecurityTitle"
      >
        <div class="fk-security-header">
          <h2 id="fkSecurityTitle">
            Keamanan & Privasi
          </h2>

          <button
            type="button"
            class="fk-security-close"
            id="fkSecurityClose"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <div class="fk-security-content">

          <div class="fk-security-intro">
            Pusat ini membantu kamu memahami beberapa indikator
            keamanan dan pilihan privasi FathKit. Pemeriksaan
            browser bukan audit keamanan menyeluruh.
          </div>

          <section class="fk-security-section">
            <h3>Pemeriksaan sistem</h3>
            <div id="fkSecurityChecks">
              ${renderChecks()}
            </div>
          </section>

          <section class="fk-security-section">
            <h3>Preferensi privasi</h3>

            <div id="fkSecurityPreferences">
              ${renderPreferences()}
            </div>

            <div class="fk-security-actions">
              <button
                type="button"
                class="fk-security-action"
                id="fkSavePrivacy"
              >
                Simpan Preferensi
              </button>

              <button
                type="button"
                class="fk-security-action secondary"
                id="fkRefreshSecurity"
              >
                Periksa Ulang
              </button>
            </div>
          </section>

          <section class="fk-security-section">
            <h3>Tips menjaga akun</h3>

            <ul style="padding-left:20px;font-size:13px;line-height:1.8;color:#475569">
              <li>Jangan bagikan kata sandi kepada siapa pun.</li>
              <li>Gunakan kata sandi yang unik dan kuat.</li>
              <li>Jangan bagikan kode verifikasi kepada orang lain.</li>
              <li>Selalu keluar dari akun pada perangkat umum.</li>
              <li>Hindari membuka tautan yang mencurigakan.</li>
            </ul>
          </section>

          <div class="fk-security-note">
            Preferensi pada halaman ini disimpan di browser
            perangkat ini. Preferensi tersebut tidak otomatis
            mengubah kebijakan server, Supabase, atau layanan
            pihak ketiga. Jangan memasukkan informasi rahasia
            ke dalam kolom yang tidak membutuhkannya.
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(panel);

    state.panel = panel;

    const closeButton =
      panel.querySelector("#fkSecurityClose");

    const saveButton =
      panel.querySelector("#fkSavePrivacy");

    const refreshButton =
      panel.querySelector("#fkRefreshSecurity");

    closeButton.addEventListener("click", closePanel);

    panel.addEventListener("click", (event) => {
      if (event.target === panel) {
        closePanel();
      }
    });

    saveButton.addEventListener("click", () => {
      const analytics =
        panel.querySelector("#fkPrivacyAnalytics").checked;

      const personalizedExperience =
        panel.querySelector("#fkPrivacyPersonalization").checked;

      const saved = savePreferences({
        analytics,
        personalizedExperience
      });

      showToast(
        saved
          ? "Preferensi privasi berhasil disimpan."
          : "Preferensi gagal disimpan."
      );
    });

    refreshButton.addEventListener("click", () => {
      const checks =
        panel.querySelector("#fkSecurityChecks");

      checks.innerHTML = renderChecks();

      showToast("Pemeriksaan dasar selesai.");
    });
  }

  function openPanel() {
    if (!state.panel) {
      return;
    }

    state.panel.classList.add("fk-security-open");
    state.panel.setAttribute("aria-hidden", "false");

    const closeButton =
      state.panel.querySelector("#fkSecurityClose");

    if (closeButton) {
      closeButton.focus();
    }
  }

  function closePanel() {
    if (!state.panel) {
      return;
    }

    state.panel.classList.remove("fk-security-open");
    state.panel.setAttribute("aria-hidden", "true");

    if (state.button) {
      state.button.focus();
    }
  }

  function createButton() {
    const button = document.createElement("button");

    button.type = "button";
    button.id = BUTTON_ID;
    button.textContent = "🔒 Keamanan";

    button.setAttribute(
      "aria-label",
      "Buka pusat keamanan dan privasi"
    );

    button.addEventListener("click", openPanel);

    document.body.appendChild(button);

    state.button = button;
  }

  function init() {
    if (state.initialized) {
      return;
    }

    if (!document.body) {
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
      "[FathKit] Security & Privacy Center siap."
    );
  }

  window.FATHKIT_SECURITY_PRIVACY = {
    init,
    open: openPanel,
    close: closePanel,
    getPreferences,
    savePreferences,
    getSecurityChecks
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
      once: true
    });
  } else {
    init();
  }

})();