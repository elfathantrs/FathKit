/* =========================================================
   FATHKIT — SYSTEM CENTER
   Stage 34: Unified System Controls
   Company: eLFathan
========================================================= */

"use strict";

(() => {
  if (window.FATHKIT_SYSTEM_CENTER) return;

  const STYLE_ID = "fathkit-system-center-style";
  const ROOT_ID = "fathkit-system-center";

  const SYSTEMS = [
    {
      name: "Tes FathKit",
      keywords: ["tes fathkit"],
      description: "Pemeriksaan struktur sistem"
    },
    {
      name: "Kesiapan Launch",
      keywords: ["kesiapan launch"],
      description: "Pemeriksaan persiapan peluncuran"
    },
    {
      name: "FathKit Status",
      keywords: ["fathkit status"],
      description: "Status aplikasi dan pembaruan"
    },
    {
      name: "Performa",
      keywords: ["performa"],
      description: "Informasi performa aplikasi"
    },
    {
      name: "Backup Data",
      keywords: ["backup data"],
      description: "Cadangkan atau pulihkan data lokal"
    }
  ];

  let root;
  let list;
  let observer;
  let isOpen = false;

  const normalize = (value) =>
    String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  function getButtonText(button) {
    return normalize(
      button.innerText ||
      button.textContent ||
      button.getAttribute("aria-label")
    );
  }

  function findOriginalButton(system) {
    const buttons = Array.from(
      document.querySelectorAll("button")
    );

    return buttons.find((button) => {
      if (button.closest(`#${ROOT_ID}`)) return false;

      const text = getButtonText(button);

      return system.keywords.some((keyword) =>
        text.includes(normalize(keyword))
      );
    });
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      #${ROOT_ID} {
        position: fixed;
        right: 16px;
        bottom: 18px;
        z-index: 99990;
        font-family: Arial, sans-serif;
        color: #111827;
      }

      #${ROOT_ID} * {
        box-sizing: border-box;
      }

      #${ROOT_ID} .fk-center-toggle {
        min-height: 48px;
        padding: 0 17px;
        border: 0;
        border-radius: 15px;
        background: #111827;
        color: #ffffff;
        font-size: 14px;
        font-weight: 700;
        box-shadow: 0 5px 22px rgba(0,0,0,.22);
        cursor: pointer;
      }

      #${ROOT_ID} .fk-center-panel {
        position: absolute;
        right: 0;
        bottom: 60px;
        width: min(310px, calc(100vw - 32px));
        max-height: min(70vh, 520px);
        overflow-y: auto;
        padding: 17px;
        border: 1px solid #e5e7eb;
        border-radius: 18px;
        background: #ffffff;
        box-shadow: 0 12px 38px rgba(0,0,0,.20);
        display: none;
      }

      #${ROOT_ID}.fk-open .fk-center-panel {
        display: block;
      }

      #${ROOT_ID} .fk-center-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 7px;
      }

      #${ROOT_ID} .fk-center-heading strong {
        font-size: 17px;
      }

      #${ROOT_ID} .fk-center-close {
        width: 32px;
        height: 32px;
        border: 0;
        border-radius: 9px;
        background: #f3f4f6;
        color: #111827;
        font-size: 19px;
        cursor: pointer;
      }

      #${ROOT_ID} .fk-center-subtitle {
        margin: 0 0 14px;
        color: #6b7280;
        font-size: 12px;
        line-height: 1.5;
      }

      #${ROOT_ID} .fk-center-item {
        display: block;
        width: 100%;
        margin-top: 9px;
        padding: 12px;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        background: #ffffff;
        color: #111827;
        text-align: left;
        cursor: pointer;
      }

      #${ROOT_ID} .fk-center-item:active {
        background: #f3f4f6;
      }

      #${ROOT_ID} .fk-center-item strong {
        display: block;
        font-size: 13px;
      }

      #${ROOT_ID} .fk-center-item small {
        display: block;
        margin-top: 4px;
        color: #6b7280;
        font-size: 11px;
        line-height: 1.4;
      }

      #${ROOT_ID} .fk-center-item:disabled {
        opacity: .45;
        cursor: not-allowed;
      }

      #${ROOT_ID} .fk-center-footer {
        margin-top: 14px;
        padding-top: 11px;
        border-top: 1px solid #e5e7eb;
        color: #9ca3af;
        font-size: 10px;
        text-align: center;
      }

      @media (max-width: 480px) {
        #${ROOT_ID} {
          right: 12px;
          bottom: 12px;
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

    root.innerHTML = `
      <div class="fk-center-panel" role="dialog"
           aria-label="Pusat Sistem FathKit">
        <div class="fk-center-heading">
          <strong>Pusat Sistem</strong>
          <button class="fk-center-close"
                  type="button"
                  aria-label="Tutup">×</button>
        </div>

        <p class="fk-center-subtitle">
          Akses alat pemeriksaan dan pengelolaan FathKit
          dari satu tempat.
        </p>

        <div class="fk-center-list"></div>

        <div class="fk-center-footer">
          FathKit — Everyday Tools, All in One Place.
        </div>
      </div>

      <button class="fk-center-toggle"
              type="button"
              aria-expanded="false">
        ☰ Pusat Sistem
      </button>
    `;

    document.body.appendChild(root);

    list = root.querySelector(".fk-center-list");

    root.querySelector(".fk-center-toggle")
      .addEventListener("click", toggle);

    root.querySelector(".fk-center-close")
      .addEventListener("click", close);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
  }

  function renderItems() {
    if (!list) return;

    list.innerHTML = "";

    SYSTEMS.forEach((system) => {
      const original = findOriginalButton(system);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "fk-center-item";
      button.disabled = !original;

      const title = document.createElement("strong");
      title.textContent = system.name;

      const description = document.createElement("small");
      description.textContent = original
        ? system.description
        : "Fitur belum ditemukan. Periksa file dan pemuatan script.";

      button.append(title, description);

      button.addEventListener("click", () => {
        const currentButton = findOriginalButton(system);

        if (!currentButton) {
          description.textContent =
            "Tombol asli belum tersedia.";
          return;
        }

        currentButton.click();
        close();
      });

      list.appendChild(button);
    });
  }

  function hideOriginalLaunchers() {
    SYSTEMS.forEach((system) => {
      const button = findOriginalButton(system);

      if (!button) return;

      button.style.setProperty("display", "none", "important");
      button.setAttribute("data-fathkit-managed", "true");
    });
  }

  function refresh() {
    renderItems();
    hideOriginalLaunchers();
  }

  function open() {
    isOpen = true;
    root.classList.add("fk-open");

    root.querySelector(".fk-center-toggle")
      .setAttribute("aria-expanded", "true");

    refresh();
  }

  function close() {
    isOpen = false;

    if (!root) return;

    root.classList.remove("fk-open");

    root.querySelector(".fk-center-toggle")
      .setAttribute("aria-expanded", "false");
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
    refresh();

    observer = new MutationObserver(() => {
      refresh();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.FATHKIT_SYSTEM_CENTER = {
      open,
      close,
      toggle,
      refresh,
      getStatus() {
        return {
          initialized: true,
          open: isOpen,
          availableSystems: SYSTEMS.map((system) => ({
            name: system.name,
            available: Boolean(findOriginalButton(system))
          }))
        };
      }
    };

    console.log("[FathKit] System Center initialized.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
      once: true
    });
  } else {
    init();
  }
})();