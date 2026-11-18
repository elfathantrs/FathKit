/* =========================================================
   FATHKIT — DATA MANAGEMENT CENTER
   Stage 45
   ========================================================= */

(() => {
  "use strict";

  if (window.FATHKIT_DATA_MANAGER) return;

  const BUTTON_ID = "fkDataManagerButton";
  const PANEL_ID = "fkDataManagerPanel";
  const STYLE_ID = "fkDataManagerStyles";

  const state = {
    initialized: false,
    panel: null,
    button: null
  };

  // Hanya mengelola data lokal yang namanya mengandung FathKit.
  function getManagedKeys() {
    const keys = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (key && /fathkit/i.test(key)) {
          keys.push(key);
        }
      }
    } catch (error) {
      console.error(
        "[FathKit Data] Gagal membaca penyimpanan.",
        error
      );
    }

    return keys.sort();
  }

  function getDataSummary() {
    const keys = getManagedKeys();

    let totalCharacters = 0;
    let readableItems = 0;
    let invalidItems = 0;

    const items = keys.map((key) => {
      let value = "";

      try {
        value = localStorage.getItem(key) || "";
        totalCharacters += value.length;

        try {
          JSON.parse(value);
          readableItems++;
        } catch (error) {
          // Data teks biasa tetap dapat diekspor.
        }

        return {
          key,
          size: value.length,
          available: true
        };
      } catch (error) {
        invalidItems++;

        return {
          key,
          size: 0,
          available: false
        };
      }
    });

    return {
      count: keys.length,
      totalCharacters,
      approximateBytes: totalCharacters * 2,
      readableItems,
      invalidItems,
      items
    };
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) {
      return "0 B";
    }

    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1
    );

    const value = bytes / Math.pow(1024, index);

    return value.toFixed(index === 0 ? 0 : 2) +
      " " + units[index];
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
    }, 3000);
  }

  function collectData() {
    const keys = getManagedKeys();
    const records = {};

    keys.forEach((key) => {
      try {
        records[key] = localStorage.getItem(key);
      } catch (error) {
        records[key] = null;
      }
    });

    return {
      application: "FathKit",
      exportType: "local-browser-data",
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      recordCount: Object.keys(records).length,
      records
    };
  }

  function exportData() {
    let data;

    try {
      data = collectData();
    } catch (error) {
      console.error(
        "[FathKit Data] Ekspor gagal.",
        error
      );

      showToast("Gagal menyiapkan ekspor data.");
      return false;
    }

    const json = JSON.stringify(data, null, 2);

    try {
      const blob = new Blob(
        [json],
        { type: "application/json;charset=utf-8" }
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const date = new Date()
        .toISOString()
        .slice(0, 10);

      link.href = url;
      link.download = "fathkit-data-" + date + ".json";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      showToast("File ekspor data berhasil dibuat.");
      return true;

    } catch (error) {
      console.error(
        "[FathKit Data] Browser gagal mengunduh data.",
        error
      );

      showToast("Browser tidak dapat mengunduh file.");
      return false;
    }
  }

  function deleteLocalData() {
    const keys = getManagedKeys();

    if (keys.length === 0) {
      showToast("Tidak ada data lokal FathKit untuk dihapus.");
      refreshPanel();
      return;
    }

    const confirmed = window.confirm(
      "PERINGATAN!\n\n" +
      "Kamu akan menghapus " + keys.length +
      " item penyimpanan lokal FathKit dari browser ini.\n\n" +
      "Tindakan ini tidak dapat dibatalkan.\n\n" +
      "Data server dan sesi autentikasi Supabase tidak termasuk.\n\n" +
      "Apakah kamu yakin ingin melanjutkan?"
    );

    if (!confirmed) {
      return;
    }

    const secondConfirmation = window.confirm(
      "Konfirmasi terakhir:\n\n" +
      "Apakah kamu sudah mengekspor data yang masih dibutuhkan?"
    );

    if (!secondConfirmation) {
      return;
    }

    let deleted = 0;
    let failed = 0;

    keys.forEach((key) => {
      try {
        localStorage.removeItem(key);
        deleted++;
      } catch (error) {
        failed++;
      }
    });

    refreshPanel();

    if (failed === 0) {
      showToast(
        deleted + " item data lokal FathKit berhasil dihapus."
      );
    } else {
      showToast(
        deleted + " item dihapus, " + failed + " gagal dihapus."
      );
    }

    document.dispatchEvent(
      new CustomEvent("fathkit:local-data-deleted", {
        detail: {
          deleted,
          failed
        }
      })
    );
  }

  function renderItems() {
    const summary = getDataSummary();

    if (summary.items.length === 0) {
      return `
        <div class="fk-data-empty">
          Belum ditemukan data lokal FathKit.
        </div>
      `;
    }

    return summary.items.map((item) => `
      <div class="fk-data-item">
        <div class="fk-data-item-name">
          ${escapeHTML(item.key)}
        </div>

        <div class="fk-data-item-size">
          ${item.available
            ? escapeHTML(formatBytes(item.size * 2))
            : "Tidak dapat dibaca"}
        </div>
      </div>
    `).join("");
  }

  function renderSummary() {
    const summary = getDataSummary();

    return `
      <div class="fk-data-stats">
        <div class="fk-data-stat">
          <strong>${summary.count}</strong>
          <span>Item data</span>
        </div>

        <div class="fk-data-stat">
          <strong>${escapeHTML(
            formatBytes(summary.approximateBytes)
          )}</strong>
          <span>Perkiraan ukuran</span>
        </div>
      </div>
    `;
  }

  function createStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");

    style.id = STYLE_ID;

    style.textContent = `
      #${BUTTON_ID} {
        position: fixed;
        right: 16px;
        bottom: 300px;
        z-index: 8998;
        padding: 11px 14px;
        border: 0;
        border-radius: 12px;
        background: #334155;
        color: white;
        font-size: 12px;
        font-weight: 700;
        box-shadow: 0 5px 20px rgba(0,0,0,.16);
        cursor: pointer;
      }

      #${PANEL_ID} {
        position: fixed;
        inset: 0;
        z-index: 14000;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 14px;
        background: rgba(15,23,42,.68);
      }

      #${PANEL_ID}.fk-data-open {
        display: flex;
      }

      .fk-data-card {
        width: min(560px, 100%);
        max-height: 88vh;
        overflow-y: auto;
        border-radius: 18px;
        background: white;
        color: #111827;
        box-shadow: 0 20px 60px rgba(0,0,0,.25);
      }

      .fk-data-header {
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

      .fk-data-header h2 {
        margin: 0;
        font-size: 19px;
      }

      .fk-data-close {
        width: 36px;
        height: 36px;
        border: 0;
        border-radius: 9px;
        background: #f1f5f9;
        font-size: 22px;
        cursor: pointer;
      }

      .fk-data-content {
        padding: 18px;
      }

      .fk-data-notice {
        padding: 14px;
        border-radius: 12px;
        background: #eff6ff;
        color: #1e40af;
        font-size: 12px;
        line-height: 1.7;
      }

      .fk-data-stats {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-top: 16px;
      }

      .fk-data-stat {
        padding: 15px;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
      }

      .fk-data-stat strong {
        display: block;
        font-size: 20px;
      }

      .fk-data-stat span {
        display: block;
        margin-top: 5px;
        color: #64748b;
        font-size: 11px;
      }

      .fk-data-section {
        margin-top: 22px;
      }

      .fk-data-section h3 {
        margin: 0 0 12px;
        font-size: 15px;
      }

      .fk-data-list {
        max-height: 210px;
        overflow-y: auto;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 0 12px;
      }

      .fk-data-item {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 11px 0;
        border-bottom: 1px solid #f1f5f9;
      }

      .fk-data-item:last-child {
        border-bottom: 0;
      }

      .fk-data-item-name {
        min-width: 0;
        overflow-wrap: anywhere;
        font-size: 12px;
        font-weight: 600;
      }

      .fk-data-item-size {
        flex-shrink: 0;
        color: #64748b;
        font-size: 11px;
      }

      .fk-data-empty {
        padding: 18px 5px;
        color: #64748b;
        font-size: 12px;
        text-align: center;
      }

      .fk-data-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 9px;
        margin-top: 16px;
      }

      .fk-data-action {
        padding: 11px 14px;
        border: 0;
        border-radius: 9px;
        background: #2563eb;
        color: white;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }

      .fk-data-action.secondary {
        background: #e2e8f0;
        color: #1e293b;
      }

      .fk-data-action.danger {
        background: #b91c1c;
        color: white;
      }

      .fk-data-note {
        margin-top: 17px;
        color: #64748b;
        font-size: 11px;
        line-height: 1.7;
      }

      @media (max-width: 480px) {
        #${BUTTON_ID} {
          right: 10px;
          bottom: 295px;
          padding: 10px 11px;
          font-size: 11px;
        }

        .fk-data-content {
          padding: 14px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function renderPanel() {
    const panel = document.createElement("div");

    panel.id = PANEL_ID;
    panel.setAttribute("aria-hidden", "true");

    panel.innerHTML = `
      <div
        class="fk-data-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fkDataTitle"
      >
        <div class="fk-data-header">
          <h2 id="fkDataTitle">
            Pengelolaan Data
          </h2>

          <button
            type="button"
            class="fk-data-close"
            id="fkDataClose"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <div class="fk-data-content">

          <div class="fk-data-notice">
            Kelola data FathKit yang tersimpan secara lokal
            pada browser perangkat ini. Data di server dan
            layanan pihak ketiga tidak termasuk.
          </div>

          <div id="fkDataSummary">
            ${renderSummary()}
          </div>

          <section class="fk-data-section">
            <h3>Data lokal yang terdeteksi</h3>

            <div class="fk-data-list" id="fkDataList">
              ${renderItems()}
            </div>

            <div class="fk-data-actions">
              <button
                type="button"
                class="fk-data-action secondary"
                id="fkDataRefresh"
              >
                Perbarui Daftar
              </button>

              <button
                type="button"
                class="fk-data-action"
                id="fkDataExport"
              >
                Ekspor JSON
              </button>
            </div>
          </section>

          <section class="fk-data-section">
            <h3>Hapus data lokal</h3>

            <p style="font-size:12px;line-height:1.7;color:#64748b">
              Penghapusan hanya menargetkan item localStorage
              yang namanya mengandung kata FathKit. Ekspor data
              penting sebelum melanjutkan.
            </p>

            <div class="fk-data-actions">
              <button
                type="button"
                class="fk-data-action danger"
                id="fkDataDelete"
              >
                Hapus Data Lokal FathKit
              </button>
            </div>
          </section>

          <div class="fk-data-note">
            Catatan: ukuran yang ditampilkan merupakan perkiraan,
            bukan ukuran pasti penyimpanan browser. Ekspor ini
            tidak mencakup file perangkat, database Supabase,
            data server, atau sesi autentikasi yang disimpan
            dengan nama kunci berbeda.
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(panel);
    state.panel = panel;

    panel.querySelector("#fkDataClose")
      .addEventListener("click", closePanel);

    panel.addEventListener("click", (event) => {
      if (event.target === panel) {
        closePanel();
      }
    });

    panel.querySelector("#fkDataRefresh")
      .addEventListener("click", refreshPanel);

    panel.querySelector("#fkDataExport")
      .addEventListener("click", exportData);

    panel.querySelector("#fkDataDelete")
      .addEventListener("click", deleteLocalData);
  }

  function refreshPanel() {
    if (!state.panel) return;

    state.panel.querySelector("#fkDataSummary").innerHTML =
      renderSummary();

    state.panel.querySelector("#fkDataList").innerHTML =
      renderItems();

    showToast("Daftar data berhasil diperbarui.");
  }

  function openPanel() {
    if (!state.panel) return;

    refreshPanel();

    state.panel.classList.add("fk-data-open");
    state.panel.setAttribute("aria-hidden", "false");

    state.panel.querySelector("#fkDataClose").focus();
  }

  function closePanel() {
    if (!state.panel) return;

    state.panel.classList.remove("fk-data-open");
    state.panel.setAttribute("aria-hidden", "true");

    if (state.button) {
      state.button.focus();
    }
  }

  function createButton() {
    const button = document.createElement("button");

    button.type = "button";
    button.id = BUTTON_ID;
    button.textContent = "🗂️ Kelola Data";

    button.setAttribute(
      "aria-label",
      "Buka pusat pengelolaan data FathKit"
    );

    button.addEventListener("click", openPanel);

    document.body.appendChild(button);
    state.button = button;
  }

  function init() {
    if (state.initialized || !document.body) return;

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
      "[FathKit] Data Management Center siap."
    );
  }

  window.FATHKIT_DATA_MANAGER = {
    init,
    open: openPanel,
    close: closePanel,
    refresh: refreshPanel,
    getManagedKeys,
    getDataSummary,
    exportData,
    deleteLocalData
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
      once: true
    });
  } else {
    init();
  }

})();