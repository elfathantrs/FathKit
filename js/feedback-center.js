/* =========================================================
   FATHKIT — FEEDBACK CENTER
   Stage 42: User Feedback & Bug Reports
   Company: eLFathan
   Product: FathKit
========================================================= */

"use strict";

(() => {
  if (window.FATHKIT_FEEDBACK) return;

  const STORAGE_KEY = "fathkit_feedback_records";
  const ROOT_ID = "fathkit-feedback-center";
  const STYLE_ID = "fathkit-feedback-style";
  const MAX_RECORDS = 200;

  let root = null;
  let isOpen = false;
  let selectedRating = 5;
  let selectedType = "Saran";

  const FEEDBACK_TYPES = [
    "Saran",
    "Laporan Bug",
    "Permintaan Fitur",
    "Penilaian"
  ];

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

  function readRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const records = raw ? JSON.parse(raw) : [];

      return Array.isArray(records) ? records : [];
    } catch (error) {
      console.error("[FathKit Feedback] Read error:", error);
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
      console.error("[FathKit Feedback] Save error:", error);
      return false;
    }
  }

  function submit(data = {}) {
    const type = FEEDBACK_TYPES.includes(data.type)
      ? data.type
      : "Saran";

    const message = String(data.message || "").trim();

    if (!message) {
      return {
        success: false,
        reason: "empty_message"
      };
    }

    if (message.length > 3000) {
      return {
        success: false,
        reason: "message_too_long"
      };
    }

    const rating = Math.max(
      1,
      Math.min(5, Number(data.rating) || 5)
    );

    const record = {
      id: createId(),
      type,
      rating,
      message,
      status: "tersimpan_di_perangkat",
      createdAt: new Date().toISOString()
    };

    const records = readRecords();
    records.unshift(record);

    const saved = saveRecords(records);

    if (!saved) {
      return {
        success: false,
        reason: "storage_error"
      };
    }

    renderHistory();

    if (window.FATHKIT_ACTIVITY) {
      window.FATHKIT_ACTIVITY.record(
        "Pengguna mengirim feedback: " + type,
        {
          type: "success",
          category: "Feedback"
        }
      );
    }

    if (window.FATHKIT_NOTIFY) {
      window.FATHKIT_NOTIFY.success(
        "Feedback berhasil disimpan di perangkat."
      );
    }

    return {
      success: true,
      record
    };
  }

  function getAll() {
    return readRecords();
  }

  function clearHistory() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      renderHistory();
      return true;
    } catch (error) {
      console.error("[FathKit Feedback] Clear error:", error);
      return false;
    }
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      #${ROOT_ID} {
        position: fixed;
        right: 14px;
        bottom: 188px;
        z-index: 99940;
        font-family: Arial, sans-serif;
        color: #111827;
      }

      #${ROOT_ID} * {
        box-sizing: border-box;
      }

      #${ROOT_ID} .fk-feedback-toggle {
        min-height: 44px;
        padding: 0 14px;
        border: 1px solid #e5e7eb;
        border-radius: 13px;
        background: #ffffff;
        color: #111827;
        font-size: 13px;
        font-weight: 700;
        box-shadow: 0 4px 16px rgba(0,0,0,.12);
        cursor: pointer;
      }

      #${ROOT_ID} .fk-feedback-panel {
        position: absolute;
        right: 0;
        bottom: 54px;
        display: none;
        flex-direction: column;
        width: min(370px, calc(100vw - 28px));
        max-height: min(78vh, 620px);
        overflow: hidden;
        border: 1px solid #e5e7eb;
        border-radius: 18px;
        background: #ffffff;
        box-shadow: 0 12px 35px rgba(0,0,0,.18);
      }

      #${ROOT_ID}.fk-feedback-open .fk-feedback-panel {
        display: flex;
      }

      #${ROOT_ID} .fk-feedback-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 15px;
        border-bottom: 1px solid #e5e7eb;
      }

      #${ROOT_ID} .fk-feedback-header strong {
        font-size: 15px;
      }

      #${ROOT_ID} .fk-feedback-close {
        width: 32px;
        height: 32px;
        border: 0;
        border-radius: 9px;
        background: #f3f4f6;
        color: #111827;
        font-size: 19px;
        cursor: pointer;
      }

      #${ROOT_ID} .fk-feedback-body {
        padding: 15px;
        overflow-y: auto;
      }

      #${ROOT_ID} .fk-feedback-description {
        margin: 0 0 15px;
        color: #6b7280;
        font-size: 11px;
        line-height: 1.6;
      }

      #${ROOT_ID} .fk-feedback-label {
        display: block;
        margin: 14px 0 7px;
        font-size: 12px;
        font-weight: 700;
      }

      #${ROOT_ID} .fk-feedback-select,
      #${ROOT_ID} .fk-feedback-message {
        width: 100%;
        padding: 11px;
        border: 1px solid #d1d5db;
        border-radius: 10px;
        background: #ffffff;
        color: #111827;
        font-family: inherit;
        font-size: 12px;
        outline: none;
      }

      #${ROOT_ID} .fk-feedback-message {
        min-height: 105px;
        resize: vertical;
        line-height: 1.5;
      }

      #${ROOT_ID} .fk-feedback-rating {
        display: flex;
        gap: 8px;
      }

      #${ROOT_ID} .fk-feedback-star {
        width: 38px;
        height: 38px;
        border: 1px solid #e5e7eb;
        border-radius: 9px;
        background: #ffffff;
        color: #9ca3af;
        font-size: 19px;
        cursor: pointer;
      }

      #${ROOT_ID} .fk-feedback-star.fk-active {
        border-color: #d97706;
        background: #fffbeb;
        color: #d97706;
      }

      #${ROOT_ID} .fk-feedback-counter {
        margin-top: 5px;
        color: #9ca3af;
        font-size: 10px;
        text-align: right;
      }

      #${ROOT_ID} .fk-feedback-submit {
        width: 100%;
        min-height: 43px;
        margin-top: 15px;
        border: 0;
        border-radius: 10px;
        background: #111827;
        color: #ffffff;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }

      #${ROOT_ID} .fk-feedback-history {
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px solid #e5e7eb;
      }

      #${ROOT_ID} .fk-feedback-history-title {
        margin-bottom: 9px;
        font-size: 12px;
        font-weight: 700;
      }

      #${ROOT_ID} .fk-feedback-history-item {
        padding: 10px 0;
        border-bottom: 1px solid #f1f5f9;
      }

      #${ROOT_ID} .fk-feedback-history-item strong {
        display: block;
        font-size: 11px;
      }

      #${ROOT_ID} .fk-feedback-history-item p {
        margin: 5px 0;
        color: #4b5563;
        font-size: 11px;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }

      #${ROOT_ID} .fk-feedback-history-item small {
        color: #9ca3af;
        font-size: 10px;
      }

      #${ROOT_ID} .fk-feedback-empty {
        color: #9ca3af;
        font-size: 11px;
        text-align: center;
        padding: 12px 0;
      }

      #${ROOT_ID} .fk-feedback-note {
        margin-top: 13px;
        color: #9ca3af;
        font-size: 10px;
        line-height: 1.5;
      }

      @media (max-width: 480px) {
        #${ROOT_ID} {
          right: 10px;
          bottom: 180px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function createElement(tag, className, text) {
    const node = document.createElement(tag);

    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;

    return node;
  }

  function renderStars() {
    const container = root.querySelector(".fk-feedback-rating");
    container.innerHTML = "";

    for (let i = 1; i <= 5; i++) {
      const button = createElement(
        "button",
        "fk-feedback-star" +
          (i <= selectedRating ? " fk-active" : ""),
        "★"
      );

      button.type = "button";
      button.setAttribute("aria-label", i + " dari 5 bintang");
      button.setAttribute(
        "aria-pressed",
        String(i === selectedRating)
      );

      button.addEventListener("click", () => {
        selectedRating = i;
        renderStars();
      });

      container.appendChild(button);
    }
  }

  function renderHistory() {
    if (!root) return;

    const container = root.querySelector(".fk-feedback-history-list");
    if (!container) return;

    container.innerHTML = "";

    const records = getAll();

    if (!records.length) {
      container.appendChild(
        createElement(
          "div",
          "fk-feedback-empty",
          "Belum ada feedback tersimpan."
        )
      );
      return;
    }

    records.slice(0, 20).forEach((record) => {
      const item = createElement(
        "div",
        "fk-feedback-history-item"
      );

      item.appendChild(
        createElement(
          "strong",
          "",
          record.type + " • " + record.rating + "/5 ★"
        )
      );

      item.appendChild(
        createElement("p", "", record.message)
      );

      const date = new Date(record.createdAt);

      item.appendChild(
        createElement(
          "small",
          "",
          Number.isNaN(date.getTime())
            ? "Waktu tidak diketahui"
            : date.toLocaleString("id-ID")
        )
      );

      container.appendChild(item);
    });
  }

  function render() {
    if (!root) return;

    const body = root.querySelector(".fk-feedback-body");
    body.innerHTML = "";

    body.appendChild(
      createElement(
        "p",
        "fk-feedback-description",
        "Bagikan saran, laporkan masalah, atau berikan penilaian untuk membantu pengembangan FathKit."
      )
    );

    const typeLabel = createElement(
      "label",
      "fk-feedback-label",
      "Jenis masukan"
    );

    const typeSelect = createElement(
      "select",
      "fk-feedback-select"
    );

    FEEDBACK_TYPES.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      option.selected = type === selectedType;
      typeSelect.appendChild(option);
    });

    typeSelect.addEventListener("change", () => {
      selectedType = typeSelect.value;
    });

    body.append(typeLabel, typeSelect);

    body.appendChild(
      createElement(
        "label",
        "fk-feedback-label",
        "Penilaian FathKit"
      )
    );

    const stars = createElement(
      "div",
      "fk-feedback-rating"
    );

    body.appendChild(stars);

    const messageLabel = createElement(
      "label",
      "fk-feedback-label",
      "Pesan atau masukan"
    );

    const message = createElement(
      "textarea",
      "fk-feedback-message"
    );

    message.maxLength = 3000;
    message.placeholder =
      "Tuliskan saran, masalah, atau ide yang ingin kamu sampaikan...";

    const counter = createElement(
      "div",
      "fk-feedback-counter",
      "0/3000"
    );

    message.addEventListener("input", () => {
      counter.textContent = message.value.length + "/3000";
    });

    body.append(messageLabel, message, counter);

    const submitButton = createElement(
      "button",
      "fk-feedback-submit",
      "Kirim Feedback"
    );

    submitButton.type = "button";

    submitButton.addEventListener("click", () => {
      const result = submit({
        type: selectedType,
        rating: selectedRating,
        message: message.value
      });

      if (!result.success) {
        const errors = {
          empty_message: "Pesan belum diisi.",
          message_too_long: "Pesan terlalu panjang.",
          storage_error: "Feedback gagal disimpan. Periksa ruang penyimpanan."
        };

        if (window.FATHKIT_NOTIFY) {
          window.FATHKIT_NOTIFY.warning(
            errors[result.reason] || "Feedback gagal disimpan."
          );
        } else {
          window.alert(
            errors[result.reason] || "Feedback gagal disimpan."
          );
        }

        return;
      }

      message.value = "";
      counter.textContent = "0/3000";
      renderHistory();
    });

    body.appendChild(submitButton);

    const history = createElement(
      "div",
      "fk-feedback-history"
    );

    history.appendChild(
      createElement(
        "div",
        "fk-feedback-history-title",
        "Feedback Sebelumnya"
      )
    );

    history.appendChild(
      createElement("div", "fk-feedback-history-list")
    );

    body.appendChild(history);

    body.appendChild(
      createElement(
        "div",
        "fk-feedback-note",
        "Feedback saat ini hanya disimpan di perangkat ini dan belum dikirim ke server atau tim pengembang."
      )
    );

    renderStars();
    renderHistory();
  }

  function createInterface() {
    root = document.createElement("div");
    root.id = ROOT_ID;

    const panel = createElement(
      "div",
      "fk-feedback-panel"
    );

    const header = createElement(
      "div",
      "fk-feedback-header"
    );

    header.appendChild(
      createElement("strong", "", "Feedback FathKit")
    );

    const closeButton = createElement(
      "button",
      "fk-feedback-close",
      "×"
    );

    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Tutup feedback");
    closeButton.addEventListener("click", close);

    header.appendChild(closeButton);

    const body = createElement(
      "div",
      "fk-feedback-body"
    );

    panel.append(header, body);

    const toggleButton = createElement(
      "button",
      "fk-feedback-toggle",
      "✉ Feedback"
    );

    toggleButton.type = "button";
    toggleButton.setAttribute("aria-expanded", "false");
    toggleButton.addEventListener("click", toggle);

    root.append(panel, toggleButton);
    document.body.appendChild(root);

    render();
  }

  function open() {
    if (!root) return;

    isOpen = true;
    root.classList.add("fk-feedback-open");

    root.querySelector(".fk-feedback-toggle")
      .setAttribute("aria-expanded", "true");
  }

  function close() {
    if (!root) return;

    isOpen = false;
    root.classList.remove("fk-feedback-open");

    root.querySelector(".fk-feedback-toggle")
      .setAttribute("aria-expanded", "false");
  }

  function toggle() {
    if (isOpen) close();
    else open();
  }

  function init() {
    if (!document.body || !document.head) return;

    injectStyles();
    createInterface();

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });

    window.FATHKIT_FEEDBACK = {
      open,
      close,
      toggle,
      submit,
      getAll,
      clearHistory,

      getStatus() {
        return {
          initialized: true,
          open: isOpen,
          totalFeedback: getAll().length,
          storage: "localStorage"
        };
      }
    };

    console.log("[FathKit] Feedback Center initialized.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
      once: true
    });
  } else {
    init();
  }
})();