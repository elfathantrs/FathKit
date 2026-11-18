/* =========================================================
   FATHKIT — NOTIFICATION CENTER
   Stage 35: Centralized Notifications
   Company: eLFathan
   Product: FathKit
========================================================= */

"use strict";

(() => {
  if (window.FATHKIT_NOTIFY) return;

  const STYLE_ID = "fathkit-notification-style";
  const CONTAINER_ID = "fathkit-notification-container";

  const DEFAULT_DURATION = 3500;
  const MAX_NOTIFICATIONS = 5;

  let container = null;
  let notificationCount = 0;

  const TYPES = {
    success: {
      icon: "✓",
      title: "Berhasil",
      color: "#15803d",
      background: "#f0fdf4",
      border: "#bbf7d0"
    },

    error: {
      icon: "✕",
      title: "Terjadi Kesalahan",
      color: "#b91c1c",
      background: "#fef2f2",
      border: "#fecaca"
    },

    warning: {
      icon: "!",
      title: "Peringatan",
      color: "#a16207",
      background: "#fefce8",
      border: "#fde68a"
    },

    info: {
      icon: "i",
      title: "Informasi",
      color: "#1d4ed8",
      background: "#eff6ff",
      border: "#bfdbfe"
    }
  };

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      #${CONTAINER_ID} {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 100000;
        width: min(360px, calc(100vw - 32px));
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
        font-family: Arial, sans-serif;
      }

      #${CONTAINER_ID} .fk-notification {
        display: flex;
        align-items: flex-start;
        gap: 11px;
        padding: 13px;
        border: 1px solid var(--fk-border);
        border-left: 4px solid var(--fk-color);
        border-radius: 13px;
        background: var(--fk-background);
        color: #111827;
        box-shadow: 0 5px 20px rgba(0,0,0,.10);
        pointer-events: auto;
        animation: fk-notification-in .22s ease-out;
      }

      #${CONTAINER_ID} .fk-notification-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 25px;
        width: 25px;
        height: 25px;
        border-radius: 50%;
        background: var(--fk-color);
        color: white;
        font-weight: 700;
        font-size: 14px;
      }

      #${CONTAINER_ID} .fk-notification-content {
        flex: 1;
        min-width: 0;
      }

      #${CONTAINER_ID} .fk-notification-title {
        margin: 1px 0 4px;
        color: var(--fk-color);
        font-size: 13px;
        font-weight: 700;
      }

      #${CONTAINER_ID} .fk-notification-message {
        margin: 0;
        color: #374151;
        font-size: 12px;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }

      #${CONTAINER_ID} .fk-notification-close {
        border: 0;
        background: transparent;
        color: #6b7280;
        font-size: 18px;
        line-height: 1;
        cursor: pointer;
      }

      #${CONTAINER_ID} .fk-notification-progress {
        height: 3px;
        margin-top: 9px;
        overflow: hidden;
        border-radius: 5px;
        background: rgba(0,0,0,.08);
      }

      #${CONTAINER_ID} .fk-notification-progress span {
        display: block;
        width: 100%;
        height: 100%;
        background: var(--fk-color);
        transform-origin: left;
        animation: fk-notification-progress linear forwards;
      }

      #${CONTAINER_ID} .fk-notification.fk-leaving {
        animation: fk-notification-out .18s ease-in forwards;
      }

      @keyframes fk-notification-in {
        from {
          opacity: 0;
          transform: translateX(15px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes fk-notification-out {
        to {
          opacity: 0;
          transform: translateX(15px);
        }
      }

      @keyframes fk-notification-progress {
        from { transform: scaleX(1); }
        to { transform: scaleX(0); }
      }

      @media (max-width: 480px) {
        #${CONTAINER_ID} {
          top: 10px;
          right: 10px;
          width: calc(100vw - 20px);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        #${CONTAINER_ID} *,
        #${CONTAINER_ID} *::before,
        #${CONTAINER_ID} *::after {
          animation-duration: .01ms !important;
          animation-iteration-count: 1 !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function createContainer() {
    if (container && document.body.contains(container)) {
      return container;
    }

    container = document.getElementById(CONTAINER_ID);

    if (!container) {
      container = document.createElement("div");
      container.id = CONTAINER_ID;
      container.setAttribute("aria-live", "polite");
      container.setAttribute("aria-atomic", "false");
      container.setAttribute(
        "aria-label",
        "Notifikasi FathKit"
      );

      document.body.appendChild(container);
    }

    return container;
  }

  function removeNotification(element) {
    if (!element || !element.parentNode) return;

    if (element.dataset.removing === "true") return;

    element.dataset.removing = "true";
    element.classList.add("fk-leaving");

    window.setTimeout(() => {
      if (element.parentNode) {
        element.remove();
      }

      notificationCount = Math.max(
        0,
        notificationCount - 1
      );
    }, 200);
  }

  function show(message, options = {}) {
    if (!document.body || !document.head) {
      return null;
    }

    injectStyles();

    const target = createContainer();

    const type = TYPES[options.type] ? options.type : "info";
    const config = TYPES[type];

    const duration = Number.isFinite(options.duration)
      ? Math.max(0, Math.min(options.duration, 30000))
      : DEFAULT_DURATION;

    while (target.children.length >= MAX_NOTIFICATIONS) {
      removeNotification(target.firstElementChild);
      break;
    }

    const notification = document.createElement("div");
    notification.className = "fk-notification";

    notification.style.setProperty("--fk-color", config.color);
    notification.style.setProperty(
      "--fk-background",
      config.background
    );
    notification.style.setProperty("--fk-border", config.border);

    const icon = document.createElement("div");
    icon.className = "fk-notification-icon";
    icon.textContent = config.icon;
    icon.setAttribute("aria-hidden", "true");

    const content = document.createElement("div");
    content.className = "fk-notification-content";

    const title = document.createElement("div");
    title.className = "fk-notification-title";
    title.textContent = options.title || config.title;

    const text = document.createElement("p");
    text.className = "fk-notification-message";
    text.textContent = String(message || "");

    content.append(title, text);

    if (duration > 0) {
      const progress = document.createElement("div");
      progress.className = "fk-notification-progress";

      const bar = document.createElement("span");
      bar.style.animationDuration = duration + "ms";

      progress.appendChild(bar);
      content.appendChild(progress);
    }

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "fk-notification-close";
    closeButton.textContent = "×";
    closeButton.setAttribute(
      "aria-label",
      "Tutup notifikasi"
    );

    closeButton.addEventListener("click", () => {
      removeNotification(notification);
    });

    notification.append(icon, content, closeButton);
    target.appendChild(notification);

    notificationCount++;

    if (duration > 0) {
      window.setTimeout(() => {
        removeNotification(notification);
      }, duration);
    }

    return notification;
  }

  function success(message, options = {}) {
    return show(message, {
      ...options,
      type: "success"
    });
  }

  function error(message, options = {}) {
    return show(message, {
      ...options,
      type: "error"
    });
  }

  function warning(message, options = {}) {
    return show(message, {
      ...options,
      type: "warning"
    });
  }

  function info(message, options = {}) {
    return show(message, {
      ...options,
      type: "info"
    });
  }

  function clear() {
    if (!container) return;

    container.innerHTML = "";
    notificationCount = 0;
  }

  function getStatus() {
    return {
      initialized: true,
      activeNotifications: container
        ? container.querySelectorAll(".fk-notification").length
        : 0,
      maximumNotifications: MAX_NOTIFICATIONS
    };
  }

  window.FATHKIT_NOTIFY = {
    show,
    success,
    error,
    warning,
    info,
    clear,
    getStatus
  };

  console.log("[FathKit] Notification Center initialized.");
})();