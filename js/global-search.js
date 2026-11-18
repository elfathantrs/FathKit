/* =========================================================
   FATHKIT — GLOBAL SEARCH
   Stage 40: Global Tool Search Center
   Company: eLFathan
   Product: FathKit
========================================================= */

"use strict";

(() => {
  if (window.FATHKIT_GLOBAL_SEARCH) return;

  const ROOT_ID = "fathkit-global-search";
  const STYLE_ID = "fathkit-global-search-style";

  let root = null;
  let isOpen = false;
  let searchInput = null;
  let statusText = null;

  function getOriginalSearch() {
    return document.getElementById("toolSearch");
  }

  function getToolGrid() {
    return document.getElementById("toolGrid");
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      #${ROOT_ID} {
        position: fixed;
        top: 12px;
        right: 12px;
        z-index: 100010;
        font-family: Arial, sans-serif;
        color: #111827;
      }

      #${ROOT_ID} * {
        box-sizing: border-box;
      }

      #${ROOT_ID} .fk-search-toggle {
        width: 45px;
        height: 45px;
        border: 1px solid #e5e7eb;
        border-radius: 13px;
        background: #ffffff;
        color: #111827;
        font-size: 20px;
        box-shadow: 0 4px 16px rgba(0,0,0,.12);
        cursor: pointer;
      }

      #${ROOT_ID} .fk-search-panel {
        position: absolute;
        top: 54px;
        right: 0;
        display: none;
        width: min(380px, calc(100vw - 24px));
        padding: 16px;
        border: 1px solid #e5e7eb;
        border-radius: 17px;
        background: #ffffff;
        box-shadow: 0 12px 35px rgba(0,0,0,.18);
      }

      #${ROOT_ID}.fk-search-open .fk-search-panel {
        display: block;
      }

      #${ROOT_ID} .fk-search-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 12px;
      }

      #${ROOT_ID} .fk-search-heading strong {
        font-size: 15px;
      }

      #${ROOT_ID} .fk-search-close {
        width: 30px;
        height: 30px;
        border: 0;
        border-radius: 8px;
        background: #f3f4f6;
        color: #111827;
        font-size: 18px;
        cursor: pointer;
      }

      #${ROOT_ID} .fk-search-input-wrap {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 0 10px;
        border: 1px solid #d1d5db;
        border-radius: 11px;
        background: #ffffff;
      }

      #${ROOT_ID} .fk-search-input {
        width: 100%;
        min-width: 0;
        height: 45px;
        border: 0;
        outline: none;
        background: transparent;
        color: #111827;
        font-size: 14px;
      }

      #${ROOT_ID} .fk-search-clear {
        flex-shrink: 0;
        border: 0;
        background: transparent;
        color: #6b7280;
        font-size: 18px;
        cursor: pointer;
      }

      #${ROOT_ID} .fk-search-status {
        margin-top: 11px;
        color: #6b7280;
        font-size: 11px;
        line-height: 1.5;
      }

      #${ROOT_ID} .fk-search-shortcut {
        display: inline-block;
        margin-top: 12px;
        padding: 5px 7px;
        border-radius: 6px;
        background: #f3f4f6;
        color: #6b7280;
        font-size: 10px;
      }

      @media (max-width: 480px) {
        #${ROOT_ID} {
          top: 10px;
          right: 10px;
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

  function createInterface() {
    root = document.createElement("div");
    root.id = ROOT_ID;

    const toggleButton = createElement(
      "button",
      "fk-search-toggle",
      "⌕"
    );

    toggleButton.type = "button";
    toggleButton.setAttribute("aria-label", "Buka pencarian FathKit");

    const panel = createElement(
      "div",
      "fk-search-panel"
    );

    const heading = createElement(
      "div",
      "fk-search-heading"
    );

    heading.appendChild(
      createElement("strong", "", "Cari Tools FathKit")
    );

    const closeButton = createElement(
      "button",
      "fk-search-close",
      "×"
    );

    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Tutup pencarian");

    heading.appendChild(closeButton);

    const inputWrap = createElement(
      "div",
      "fk-search-input-wrap"
    );

    const searchIcon = createElement("span", "", "⌕");

    searchInput = createElement(
      "input",
      "fk-search-input"
    );

    searchInput.type = "search";
    searchInput.placeholder = "Cari nama atau kata kunci tools...";
    searchInput.autocomplete = "off";
    searchInput.setAttribute("aria-label", "Cari tools FathKit");

    const clearButton = createElement(
      "button",
      "fk-search-clear",
      "×"
    );

    clearButton.type = "button";
    clearButton.setAttribute("aria-label", "Hapus pencarian");

    inputWrap.append(searchIcon, searchInput, clearButton);

    statusText = createElement(
      "div",
      "fk-search-status",
      "Ketik kata kunci untuk mencari tools."
    );

    const shortcut = createElement(
      "div",
      "fk-search-shortcut",
      "Pintasan: Ctrl + K"
    );

    panel.append(
      heading,
      inputWrap,
      statusText,
      shortcut
    );

    root.append(toggleButton, panel);
    document.body.appendChild(root);

    toggleButton.addEventListener("click", toggle);
    closeButton.addEventListener("click", close);

    clearButton.addEventListener("click", () => {
      searchInput.value = "";
      performSearch("");
      searchInput.focus();
    });

    searchInput.addEventListener("input", () => {
      performSearch(searchInput.value);
    });

    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        close();
      }

      if (event.key === "Enter") {
        close();

        const original = getOriginalSearch();

        if (original) {
          original.focus();
        }
      }
    });
  }

  function performSearch(query) {
    const original = getOriginalSearch();

    if (!original) {
      statusText.textContent =
        "Kolom pencarian katalog belum ditemukan.";
      return false;
    }

    const value = String(query || "");

    original.value = value;

    original.dispatchEvent(
      new Event("input", { bubbles: true })
    );

    original.dispatchEvent(
      new Event("change", { bubbles: true })
    );

    updateStatus(value);

    return true;
  }

  function updateStatus(query) {
    if (!statusText) return;

    const grid = getToolGrid();

    if (!grid) {
      statusText.textContent =
        "Katalog tools belum tersedia.";
      return;
    }

    const cards = Array.from(grid.children);

    const visibleCards = cards.filter((card) => {
      return card.getClientRects().length > 0;
    });

    if (!query.trim()) {
      statusText.textContent =
        "Menampilkan seluruh tools sesuai filter katalog.";
      return;
    }

    statusText.textContent =
      visibleCards.length +
      " elemen katalog terlihat. Hasil mengikuti filter katalog FathKit.";
  }

  function open() {
    if (!root) return;

    isOpen = true;
    root.classList.add("fk-search-open");

    if (searchInput) {
      searchInput.value = getOriginalSearch()?.value || "";

      window.setTimeout(() => {
        searchInput.focus();
      }, 0);
    }

    updateStatus(searchInput?.value || "");
  }

  function close() {
    if (!root) return;

    isOpen = false;
    root.classList.remove("fk-search-open");
  }

  function toggle() {
    if (isOpen) close();
    else open();
  }

  function reset() {
    if (searchInput) searchInput.value = "";

    performSearch("");
  }

  function init() {
    if (!document.body || !document.head) return;

    if (!getOriginalSearch()) {
      console.warn(
        "[FathKit Search] Kolom toolSearch belum ditemukan."
      );
      return;
    }

    injectStyles();
    createInterface();

    document.addEventListener("keydown", (event) => {
      const isShortcut =
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k";

      if (isShortcut) {
        event.preventDefault();
        open();
      }

      if (event.key === "Escape") {
        close();
      }
    });

    window.FATHKIT_GLOBAL_SEARCH = {
      open,
      close,
      toggle,
      reset,
      search: performSearch,

      getStatus() {
        return {
          initialized: true,
          open: isOpen,
          catalogSearchAvailable: Boolean(getOriginalSearch())
        };
      }
    };

    console.log("[FathKit] Global Search initialized.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
      once: true
    });
  } else {
    init();
  }
})();