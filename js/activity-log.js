/* =========================================================
   FATHKIT — ACTIVITY LOG
   Stage 36: User Activity History
   Company: eLFathan
========================================================= */

"use strict";

(() => {
  if (window.FATHKIT_ACTIVITY) return;

  const STORAGE_KEY = "fathkit_activity_log";
  const MAX_RECORDS = 300;
  const STYLE_ID = "fathkit-activity-style";
  const ROOT_ID = "fathkit-activity-center";

  let root = null;
  let isOpen = false;

  const TYPES = {
    info: "Informasi",
    success: "Berhasil",
    warning: "Peringatan",
    error: "Kesalahan"
  };

  function readRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const records = raw ? JSON.parse(raw) : [];

      return Array.isArray(records) ? records : [];
    } catch (error) {
      console.error("[FathKit Activity] Read error:", error);
      return [];
    }
  }

  function saveRecords(records) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(records.slice(0, MAX_RECORDS))
      );

      return true;
    } catch (error) {
      console.error("[FathKit Activity] Save error:", error);
      return false;
    }
  }

  function record(action, options = {}) {
    const message = String(action || "").trim();

    if (!message) {
      return {
        success: false,
        reason: "empty_action"
      };
    }

    const type = TYPES[options.type]
      ? options.type
      : "info";

    const entry = {
      id: createId(),
      action: message.slice(0, 300),
      type,
      category: String(options.category || "Umum").slice(0, 80),
      timestamp: new Date().toISOString()
    };

    const records = readRecords();

    records.unshift(entry);

    const saved = saveRecords(records);

    if (saved) {
      render();
    }

    return {
      success: saved,
      entry
    };
  }

  function createId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }

    return (
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 10)
    );
  }

  function getAll(limit = MAX_RECORDS) {
    const safeLimit = Math.max(
      0,
      Math.min(Number(limit) || 0, MAX_RECORDS)
    );

    return readRecords().slice(0, safeLimit);
  }

  function clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      render();

      if (window.FATHKIT_NOTIFY) {
        window.FATHKIT_NOTIFY.success(
          "Riwayat aktivitas berhasil dihapus."
        );
      }

      return true;
    } catch (error) {
      console.error("[FathKit Activity] Clear error:", error);
      return false;
    }
  }

  function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Waktu tidak diketahui";
    }

    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      #${ROOT_ID} {
        position: fixed;
        left: 14px;
        bottom: 16px;
        z-index: 99980;
        font-family: Arial, sans-serif;
        color: #111827;
      }

      #${ROOT_ID} * {
        box-sizing: border-box;
      }

      #${ROOT_ID} .fk-activity-toggle {
        min-height: 46px;
        padding: 0 15px;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        background: #ffffff;
        color: #111827;
        font-size: 13px;
        font-weight: 700;
        box-shadow: 0 4px 18px rgba(0,0,0,.13);
        cursor: pointer;
      }

      #${ROOT_ID} .fk-activity-panel {
        position: absolute;
        left: 0;
        bottom: 57px;
        display: none;
        width: min(350px, calc(100vw - 28px));
        max-height: min(70vh, 520px);
        overflow: hidden;
        flex-direction: column;
        border: 1px solid #e5e7eb;
        border-radius: 17px;
        background: #ffffff;
        box-shadow: 0 12px 35px rgba(0,0,0,.18);
      }

      #${ROOT_ID}.fk-activity-open .fk-activity-panel {
        display: flex;
      }

      #${ROOT_ID} .fk-activity-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 15px;
        border-bottom: 1px solid #e5e7eb;
      }

      #${ROOT_ID} .fk-activity-header strong {
        font-size: 15px;
      }

      #${ROOT_ID} .fk-activity-actions {
        display: flex;
        gap: 6px;
      }

      #${ROOT_ID} .fk-activity-actions button {
        padding: 7px 9px;
        border: 0;
        border-radius: 8px;
        background: #f3f4f6;
        color: #374151;
        font-size: 11px;
        cursor: pointer;
      }

      #${ROOT_ID} .fk-activity-list {
        padding: 10px 13px;
        overflow-y: auto;
      }

      #${ROOT_ID} .fk-activity-entry {
        padding: 11px 0;
        border-bottom: 1px solid #f1f5f9;
      }

      #${ROOT_ID} .fk-activity-entry:last-child {
        border-bottom: 0;
      }

      #${ROOT_ID} .fk-activity-entry strong {
        display: block;
        font-size: 12px;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }

      #${ROOT_ID} .fk-activity-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
        margin-top: 5px;
        color: #6b7280;
        font-size: 10px;
      }

      #${ROOT_ID} .fk-activity-tag {
        font-weight: 700;
      }

      #${ROOT_ID} .fk-activity-empty {
        padding: 28px 12px;
        color: #6b7280;
        font-size: 12px;
        text-align: center;
      }

      @media (max-width: 480px) {
        #${ROOT_ID} {
          left: 10px;
          bottom: 10px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function createInterface() {
    if (document.getElementById(ROOT_ID)) {
      root = document.getElementById(ROOT_ID);
      return;
    }

    root = document.createElement("div");
    root.id = ROOT_ID;

    const panel = document.createElement("div");
    panel.className = "fk-activity-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Riwayat aktivitas");

    const header = document.createElement("div");
    header.className = "fk-activity-header";

    const heading = document.createElement("strong");
    heading.textContent = "Riwayat Aktivitas";

    const actions = document.createElement("div");
    actions.className = "fk-activity-actions";

    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.textContent = "Hapus";
    clearButton.addEventListener("click", () => {
      if (!getAll().length) return;

      const confirmed = window.confirm(
        "Yakin ingin menghapus seluruh riwayat aktivitas?"
      );

      if (confirmed) clear();
    });

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.textContent = "Tutup";
    closeButton.addEventListener("click", close);

    actions.append(clearButton, closeButton);
    header.append(heading, actions);

    const entries = document.createElement("div");
    entries.className = "fk-activity-list";

    panel.append(header, entries);

    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "fk-activity-toggle";
    toggleButton.textContent = "◷ Aktivitas";

    toggleButton.addEventListener("click", toggle);

    root.append(panel, toggleButton);
    document.body.appendChild(root);
  }

  function render() {
    if (!root) return;

    const list = root.querySelector(".fk-activity-list");
    if (!list) return;

    list.innerHTML = "";

    const records = getAll();

    if (!records.length) {
      const empty = document.createElement("div");
      empty.className = "fk-activity-empty";
      empty.textContent = "Belum ada aktivitas yang dicatat.";
      list.appendChild(empty);
      return;
    }

    records.forEach((entry) => {
      const item = document.createElement("div");
      item.className = "fk-activity-entry";

      const title = document.createElement("strong");
      title.textContent = entry.action;

      const meta = document.createElement("div");
      meta.className = "fk-activity-meta";

      const type = document.createElement("span");
      type.className = "fk-activity-tag";
      type.textContent = TYPES[entry.type] || TYPES.info;

      const category = document.createElement("span");
      category.textContent = entry.category || "Umum";

      const date = document.createElement("span");
      date.textContent = formatDate(entry.timestamp);

      meta.append(type, category, date);
      item.append(title, meta);
      list.appendChild(item);
    });
  }

  function open() {
    if (!root) return;

    isOpen = true;
    root.classList.add("fk-activity-open");
    render();
  }

  function close() {
    if (!root) return;

    isOpen = false;
    root.classList.remove("fk-activity-open");
  }

  function toggle() {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }

  function init() {
    if (!document.body || !document.head) return;

    injectStyles();
    createInterface();
    render();

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });

    window.FATHKIT_ACTIVITY = {
      record,
      getAll,
      clear,
      open,
      close,
      toggle,
      render,
      getStatus() {
        return {
          initialized: true,
          totalRecords: readRecords().length,
          maximumRecords: MAX_RECORDS,
          panelOpen: isOpen
        };
      }
    };

    console.log("[FathKit] Activity Log initialized.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
      once: true
    });
  } else {
    init();
  }
})();