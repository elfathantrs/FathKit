(function () {
  "use strict";

  if (window.FATHKIT_BACKUP) return;

  const PANEL_ID = "fathkit-backup-panel";
  const STYLE_ID = "fathkit-backup-style";
  const BACKUP_FORMAT = "FATHKIT_BACKUP";
  const BACKUP_VERSION = 1;

  function getFathKitKeys() {
    const keys = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && /fathkit/i.test(key)) {
        keys.push(key);
      }
    }

    return keys.sort();
  }

  function collectBackup() {
    const data = {};
    const keys = getFathKitKeys();

    keys.forEach(function (key) {
      try {
        data[key] = localStorage.getItem(key);
      } catch (error) {
        console.warn("FathKit: Gagal membaca key:", key);
      }
    });

    return {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      application: "FathKit",
      createdAt: new Date().toISOString(),
      dataCount: Object.keys(data).length,
      data: data
    };
  }

  function downloadBackup() {
    let backup;

    try {
      backup = collectBackup();
    } catch (error) {
      alert("Gagal membuat cadangan. Penyimpanan browser tidak dapat diakses.");
      return;
    }

    if (backup.dataCount === 0) {
      const proceed = confirm(
        "Belum ditemukan data lokal dengan nama yang mengandung FathKit. " +
        "Tetap unduh file cadangan kosong?"
      );

      if (!proceed) return;
    }

    const content = JSON.stringify(backup, null, 2);
    const blob = new Blob([content], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const date = new Date().toISOString()
      .replace(/[:.]/g, "-");

    link.href = url;
    link.download = "FathKit-Backup-" + date + ".json";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    showMessage(
      "File cadangan berhasil dibuat. Simpan file tersebut di tempat aman."
    );
  }

  function validateBackup(backup) {
    if (!backup || typeof backup !== "object") {
      throw new Error("Format file tidak valid.");
    }

    if (backup.format !== BACKUP_FORMAT) {
      throw new Error("File bukan cadangan resmi FathKit.");
    }

    if (backup.version !== BACKUP_VERSION) {
      throw new Error("Versi file cadangan tidak didukung.");
    }

    if (
      !backup.data ||
      typeof backup.data !== "object" ||
      Array.isArray(backup.data)
    ) {
      throw new Error("Data cadangan tidak ditemukan.");
    }

    const entries = Object.entries(backup.data);

    if (entries.length > 5000) {
      throw new Error("Jumlah data dalam file terlalu banyak.");
    }

    entries.forEach(function (entry) {
      const key = entry[0];
      const value = entry[1];

      if (
        typeof key !== "string" ||
        !/fathkit/i.test(key)
      ) {
        throw new Error("File berisi nama penyimpanan yang tidak diizinkan.");
      }

      if (value !== null && typeof value !== "string") {
        throw new Error("Isi data cadangan tidak valid.");
      }
    });

    return entries;
  }

  function readBackupFile(file) {
    if (!file) return;

    if (!/\.json$/i.test(file.name)) {
      showMessage("Pilih file cadangan dengan format JSON.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showMessage("Ukuran file terlalu besar. Maksimal 10 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = function () {
      try {
        const backup = JSON.parse(reader.result);
        const entries = validateBackup(backup);

        showRestorePreview(backup, entries);
      } catch (error) {
        showMessage(
          error.message || "Tidak dapat membaca file cadangan."
        );
      }
    };

    reader.onerror = function () {
      showMessage("Gagal membaca file.");
    };

    reader.readAsText(file);
  }

  function restoreBackup(entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
      showMessage("Tidak ada data yang dapat dipulihkan.");
      return;
    }

    const confirmed = confirm(
      "Pulihkan " + entries.length + " item data FathKit?\n\n" +
      "Data lokal dengan nama yang sama akan ditimpa. " +
      "Data lain yang tidak ada di file tidak akan dihapus."
    );

    if (!confirmed) return;

    const previous = {};

    try {
      entries.forEach(function (entry) {
        const key = entry[0];
        previous[key] = localStorage.getItem(key);
      });

      entries.forEach(function (entry) {
        localStorage.setItem(entry[0], entry[1]);
      });

      showMessage(
        "Pemulihan berhasil untuk " +
        entries.length +
        " item. Muat ulang halaman agar perubahan diterapkan."
      );

    } catch (error) {
      entries.forEach(function (entry) {
        try {
          const key = entry[0];

          if (previous[key] === null || previous[key] === undefined) {
            localStorage.removeItem(key);
          } else {
            localStorage.setItem(key, previous[key]);
          }
        } catch (rollbackError) {
          console.error("FathKit: Pemulihan cadangan gagal dibatalkan.",
            rollbackError);
        }
      });

      showMessage(
        "Pemulihan gagal. Penyimpanan mungkin penuh atau tidak tersedia."
      );
    }
  }

  function showRestorePreview(backup, entries) {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    const preview = panel.querySelector(".fk-backup-preview");

    preview.innerHTML = "";

    const heading = document.createElement("strong");
    heading.textContent = "File cadangan ditemukan";

    const info = document.createElement("p");
    info.textContent =
      "Tanggal: " +
      (backup.createdAt || "Tidak diketahui") +
      "\nJumlah item: " +
      entries.length;

    info.style.whiteSpace = "pre-line";

    const warning = document.createElement("p");
    warning.textContent =
      "Pastikan file ini berasal dari FathKit dan kamu mempercayai sumbernya.";

    const restoreButton = document.createElement("button");
    restoreButton.type = "button";
    restoreButton.className = "fk-backup-primary";
    restoreButton.textContent = "Pulihkan sekarang";

    restoreButton.addEventListener("click", function () {
      restoreBackup(entries);
      preview.innerHTML = "";
    });

    preview.appendChild(heading);
    preview.appendChild(info);
    preview.appendChild(warning);
    preview.appendChild(restoreButton);
  }

  function showMessage(message) {
    const panel = document.getElementById(PANEL_ID);

    if (!panel) {
      alert(message);
      return;
    }

    const status = panel.querySelector(".fk-backup-status");
    status.textContent = message;
    status.style.display = "block";
  }

  function createStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      #fathkit-backup-button {
        position: fixed;
        left: 16px;
        bottom: 16px;
        z-index: 99988;
        border: 0;
        border-radius: 12px;
        padding: 12px 15px;
        background: #0f766e;
        color: #ffffff;
        font-size: 13px;
        font-weight: 700;
        box-shadow: 0 4px 15px rgba(0,0,0,.2);
        cursor: pointer;
      }

      #fathkit-backup-panel {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 99989;
        padding: 16px;
        align-items: center;
        justify-content: center;
        background: rgba(0,0,0,.55);
        font-family: Arial, sans-serif;
      }

      #fathkit-backup-panel.fk-backup-open {
        display: flex;
      }

      .fk-backup-card {
        width: 100%;
        max-width: 420px;
        max-height: 85vh;
        overflow-y: auto;
        background: #ffffff;
        color: #111827;
        border-radius: 18px;
        padding: 20px;
        box-shadow: 0 15px 45px rgba(0,0,0,.25);
      }

      .fk-backup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        margin-bottom: 15px;
      }

      .fk-backup-header h2 {
        margin: 0;
        font-size: 19px;
      }

      .fk-backup-close {
        border: 0;
        border-radius: 9px;
        padding: 8px 12px;
        background: #f3f4f6;
        cursor: pointer;
        font-size: 18px;
      }

      .fk-backup-description {
        color: #6b7280;
        font-size: 13px;
        line-height: 1.6;
        margin-bottom: 16px;
      }

      .fk-backup-action {
        width: 100%;
        padding: 13px;
        border: 0;
        border-radius: 11px;
        margin-top: 10px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
      }

      .fk-backup-primary {
        background: #0f766e;
        color: white;
        border: 0;
        border-radius: 10px;
        padding: 12px;
        font-weight: 700;
        cursor: pointer;
      }

      .fk-backup-secondary {
        background: #e5e7eb;
        color: #111827;
      }

      .fk-backup-status {
        display: none;
        margin-top: 15px;
        padding: 12px;
        background: #ecfdf5;
        color: #065f46;
        border-radius: 10px;
        font-size: 12px;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }

      .fk-backup-preview {
        margin-top: 15px;
        padding: 13px;
        background: #f3f4f6;
        border-radius: 11px;
        font-size: 13px;
        line-height: 1.6;
        overflow-wrap: anywhere;
      }

      .fk-backup-preview:empty {
        display: none;
      }

      .fk-backup-preview p {
        white-space: normal;
      }

      .fk-backup-note {
        margin-top: 15px;
        color: #6b7280;
        font-size: 11px;
        line-height: 1.6;
      }

      @media (prefers-color-scheme: dark) {
        .fk-backup-card {
          background: #111827;
          color: #f9fafb;
        }

        .fk-backup-description,
        .fk-backup-note {
          color: #9ca3af;
        }

        .fk-backup-close,
        .fk-backup-secondary {
          background: #374151;
          color: white;
        }

        .fk-backup-preview {
          background: #1f2937;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function closePanel() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    panel.classList.remove("fk-backup-open");
    panel.setAttribute("aria-hidden", "true");
  }

  function openPanel() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    const status = panel.querySelector(".fk-backup-status");
    status.style.display = "none";
    status.textContent = "";

    panel.classList.add("fk-backup-open");
    panel.setAttribute("aria-hidden", "false");
  }

  function initialize() {
    if (document.getElementById(PANEL_ID)) return;

    createStyle();

    const button = document.createElement("button");
    button.id = "fathkit-backup-button";
    button.type = "button";
    button.textContent = "Backup Data";
    button.addEventListener("click", openPanel);

    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.setAttribute("aria-hidden", "true");

    const card = document.createElement("div");
    card.className = "fk-backup-card";

    const header = document.createElement("div");
    header.className = "fk-backup-header";

    const title = document.createElement("h2");
    title.textContent = "Backup & Restore";

    const close = document.createElement("button");
    close.className = "fk-backup-close";
    close.type = "button";
    close.textContent = "×";
    close.setAttribute("aria-label", "Tutup");
    close.addEventListener("click", closePanel);

    header.appendChild(title);
    header.appendChild(close);

    const description = document.createElement("div");
    description.className = "fk-backup-description";
    description.textContent =
      "Simpan cadangan data lokal FathKit atau pulihkan data " +
      "dari file cadangan JSON sebelumnya.";

    const download = document.createElement("button");
    download.type = "button";
    download.className =
      "fk-backup-action fk-backup-primary";
    download.textContent = "Unduh Backup";
    download.addEventListener("click", downloadBackup);

    const fileLabel = document.createElement("label");
    fileLabel.className =
      "fk-backup-action fk-backup-secondary";
    fileLabel.style.display = "block";
    fileLabel.style.textAlign = "center";
    fileLabel.style.boxSizing = "border-box";
    fileLabel.textContent = "Pilih File untuk Restore";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json,application/json";
    fileInput.style.display = "none";

    fileInput.addEventListener("change", function () {
      const file = fileInput.files && fileInput.files[0];

      if (file) readBackupFile(file);

      fileInput.value = "";
    });

    fileLabel.appendChild(fileInput);

    const preview = document.createElement("div");
    preview.className = "fk-backup-preview";

    const status = document.createElement("div");
    status.className = "fk-backup-status";

    const note = document.createElement("div");
    note.className = "fk-backup-note";
    note.textContent =
      "Catatan: fitur ini hanya mencadangkan localStorage " +
      "dengan nama key yang mengandung FathKit. Data Supabase, " +
      "password, sesi login, dan file di perangkat tidak ikut " +
      "dicadangkan. Simpan file backup di tempat yang aman.";

    card.appendChild(header);
    card.appendChild(description);
    card.appendChild(download);
    card.appendChild(fileLabel);
    card.appendChild(preview);
    card.appendChild(status);
    card.appendChild(note);

    panel.appendChild(card);

    panel.addEventListener("click", function (event) {
      if (event.target === panel) closePanel();
    });

    document.body.appendChild(button);
    document.body.appendChild(panel);
  }

  window.FATHKIT_BACKUP = {
    create: collectBackup,
    download: downloadBackup,
    open: openPanel,
    close: closePanel,
    getKeys: getFathKitKeys
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }

})();