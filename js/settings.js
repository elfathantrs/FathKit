/* =========================================================
   FATHKIT — USER SETTINGS
   Stage 39: Preferences & Appearance
   Company: eLFathan
========================================================= */

"use strict";

(() => {
  if (window.FATHKIT_SETTINGS) return;

  const STORAGE_KEY = "fathkit_user_settings";
  const ROOT_ID = "fathkit-settings-center";
  const STYLE_ID = "fathkit-settings-style";

  const DEFAULTS = {
    theme: "light",
    notifications: true
  };

  let settings = { ...DEFAULTS };
  let root = null;
  let isOpen = false;

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        settings = { ...DEFAULTS };
        return;
      }

      const saved = JSON.parse(raw);

      settings = {
        theme: saved.theme === "dark" ? "dark" : "light",
        notifications:
          typeof saved.notifications === "boolean"
            ? saved.notifications
            : DEFAULTS.notifications
      };
    } catch (error) {
      console.warn("[FathKit Settings] Load error:", error);
      settings = { ...DEFAULTS };
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings)
      );

      return true;
    } catch (error) {
      console.error("[FathKit Settings] Save error:", error);
      return false;
    }
  }

  function applyTheme() {
    const theme = settings.theme === "dark" ? "dark" : "light";

    document.documentElement.dataset.fathkitTheme = theme;
    document.documentElement.style.colorScheme = theme;

    document.body.dataset.fathkitTheme = theme;

    window.dispatchEvent(
      new CustomEvent("fathkit:theme-changed", {
        detail: { theme }
      })
    );
  }

  function setTheme(theme) {
    if (theme !== "light" && theme !== "dark") {
      return false;
    }

    settings.theme = theme;

    if (!saveSettings()) return false;

    applyTheme();
    render();

    notify("Tema tampilan berhasil diperbarui.");

    return true;
  }

  function setNotifications(enabled) {
    settings.notifications = Boolean(enabled);

    if (!saveSettings()) return false;

    window.dispatchEvent(
      new CustomEvent("fathkit:notification-preference-changed", {
        detail: {
          enabled: settings.notifications
        }
      })
    );

    render();

    notify(
      settings.notifications
        ? "Preferensi notifikasi diaktifkan."
        : "Preferensi notifikasi dinonaktifkan."
    );

    return true;
  }

  function notify(message) {
    if (
      settings.notifications &&
      window.FATHKIT_NOTIFY &&
      typeof window.FATHKIT_NOTIFY.info === "function"
    ) {
      window.FATHKIT_NOTIFY.info(message);
    }
  }

  function reset() {
    const confirmed = window.confirm(
      "Kembalikan semua pengaturan FathKit ke default?"
    );

    if (!confirmed) return false;

    settings = { ...DEFAULTS };

    if (!saveSettings()) return false;

    applyTheme();
    render();

    notify("Pengaturan berhasil dikembalikan ke default.");

    return true;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      #${ROOT_ID} {
        position: fixed;
        right: 14px;
        bottom: 132px;
        z-index: 99960;
        font-family: Arial, sans-serif;
        color: #111827;
      }

      #${ROOT_ID} * {
        box-sizing: border-box;
      }

      #${ROOT_ID} .fk-settings-toggle {
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

      #${ROOT_ID} .fk-settings-panel {
        position: absolute;
        right: 0;
        bottom: 54px;
        display: none;
        width: min(340px, calc(100vw - 28px));
        max-height: min(75vh, 560px);
        overflow-y: auto;
        padding: 17px;
        border: 1px solid #e5e7eb;
        border-radius: 18px;
        background: #ffffff;
        color: #111827;
        box-shadow: 0 12px 35px rgba(0,0,0,.18);
      }

      #${ROOT_ID}.fk-settings-open .fk-settings-panel {
        display: block;
      }

      #${ROOT_ID} .fk-settings-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 17px;
      }

      #${ROOT_ID} .fk-settings-heading strong {
        font-size: 16px;
      }

      #${ROOT_ID} .fk-settings-close {
        width: 32px;
        height: 32px;
        border: 0;
        border-radius: 9px;
        background: #f3f4f6;
        color: #111827;
        font-size: 18px;
        cursor: pointer;
      }

      #${ROOT_ID} .fk-settings-section {
        margin-top: 16px;
      }

      #${ROOT_ID} .fk-settings-label {
        margin-bottom: 9px;
        font-size: 12px;
        font-weight: 700;
      }

      #${ROOT_ID} .fk-settings-description {
        margin-top: 5px;
        color: #6b7280;
        font-size: 11px;
        line-height: 1.5;
      }

      #${ROOT_ID} .fk-settings-options {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      #${ROOT_ID} .fk-settings-option {
        min-height: 43px;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        background: #ffffff;
        color: #111827;
        font-size: 12px;
        cursor: pointer;
      }

      #${ROOT_ID} .fk-settings-option.fk-selected {
        border-color: #111827;
        background: #f3f4f6;
        font-weight: 700;
      }

      #${ROOT_ID} .fk-settings-switch {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px;
        border: 1px solid #e5e7eb;
        border-radius: 11px;
      }

      #${ROOT_ID} .fk-settings-switch input {
        width: 20px;
        height: 20px;
        accent-color: #111827;
      }

      #${ROOT_ID} .fk-settings-reset {
        width: 100%;
        min-height: 42px;
        margin-top: 20px;
        border: 0;
        border-radius: 10px;
        background: #f3f4f6;
        color: #111827;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }

      @media (max-width: 480px) {
        #${ROOT_ID} {
          right: 10px;
          bottom: 124px;
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

  function render() {
    if (!root) return;

    const panel = root.querySelector(".fk-settings-panel");
    panel.innerHTML = "";

    /* Heading */
    const heading = createElement(
      "div",
      "fk-settings-heading"
    );

    heading.appendChild(
      createElement("strong", "", "Pengaturan FathKit")
    );

    const closeButton = createElement(
      "button",
      "fk-settings-close",
      "×"
    );

    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Tutup pengaturan");
    closeButton.addEventListener("click", close);

    heading.appendChild(closeButton);
    panel.appendChild(heading);

    /* Theme */
    const themeSection = createElement(
      "div",
      "fk-settings-section"
    );

    themeSection.appendChild(
      createElement("div", "fk-settings-label", "Tema Tampilan")
    );

    const themeOptions = createElement(
      "div",
      "fk-settings-options"
    );

    [
      { value: "light", label: "☀ Terang" },
      { value: "dark", label: "☾ Gelap" }
    ].forEach((option) => {
      const button = createElement(
        "button",
        "fk-settings-option" +
          (settings.theme === option.value ? " fk-selected" : ""),
        option.label
      );

      button.type = "button";

      button.addEventListener("click", () => {
        setTheme(option.value);
      });

      themeOptions.appendChild(button);
    });

    themeSection.appendChild(themeOptions);

    themeSection.appendChild(
      createElement(
        "div",
        "fk-settings-description",
        "Mengatur preferensi tema pada elemen yang mendukung tema FathKit."
      )
    );

    panel.appendChild(themeSection);

    /* Notifications */
    const notificationSection = createElement(
      "div",
      "fk-settings-section"
    );

    notificationSection.appendChild(
      createElement(
        "div",
        "fk-settings-label",
        "Preferensi Notifikasi"
      )
    );

    const switchRow = createElement(
      "label",
      "fk-settings-switch"
    );

    const switchText = createElement("span");

    switchText.appendChild(
      createElement(
        "strong",
        "",
        "Notifikasi aplikasi"
      )
    );

    switchText.appendChild(
      createElement(
        "div",
        "fk-settings-description",
        "Preferensi untuk notifikasi yang menggunakan FathKit Notify."
      )
    );

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = settings.notifications;
    checkbox.setAttribute(
      "aria-label",
      "Aktifkan notifikasi aplikasi"
    );

    checkbox.addEventListener("change", () => {
      setNotifications(checkbox.checked);
    });

    switchRow.append(switchText, checkbox);
    notificationSection.appendChild(switchRow);
    panel.appendChild(notificationSection);

    /* Reset */
    const resetButton = createElement(
      "button",
      "fk-settings-reset",
      "Kembalikan Pengaturan Default"
    );

    resetButton.type = "button";
    resetButton.addEventListener("click", reset);

    panel.appendChild(resetButton);
  }

  function createInterface() {
    root = document.createElement("div");
    root.id = ROOT_ID;

    const panel = createElement(
      "div",
      "fk-settings-panel"
    );

    const toggleButton = createElement(
      "button",
      "fk-settings-toggle",
      "⚙ Pengaturan"
    );

    toggleButton.type = "button";
    toggleButton.setAttribute("aria-expanded", "false");

    toggleButton.addEventListener("click", toggle);

    root.append(panel, toggleButton);
    document.body.appendChild(root);
  }

  function open() {
    if (!root) return;

    isOpen = true;
    root.classList.add("fk-settings-open");

    root.querySelector(".fk-settings-toggle")
      .setAttribute("aria-expanded", "true");

    render();
  }

  function close() {
    if (!root) return;

    isOpen = false;
    root.classList.remove("fk-settings-open");

    root.querySelector(".fk-settings-toggle")
      .setAttribute("aria-expanded", "false");
  }

  function toggle() {
    if (isOpen) close();
    else open();
  }

  function getSettings() {
    return { ...settings };
  }

  function init() {
    if (!document.body || !document.head) return;

    loadSettings();
    injectStyles();
    createInterface();
    applyTheme();
    render();

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });

    window.FATHKIT_SETTINGS = {
      open,
      close,
      toggle,
      render,
      reset,
      setTheme,
      setNotifications,
      getSettings,

      getStatus() {
        return {
          initialized: true,
          open: isOpen,
          theme: settings.theme,
          notifications: settings.notifications
        };
      }
    };

    console.log("[FathKit] Settings initialized.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
      once: true
    });
  } else {
    init();
  }
})();