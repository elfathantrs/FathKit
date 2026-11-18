(function () {
  "use strict";

  if (window.FATHKIT_PERFORMANCE) return;

  const STYLE_ID = "fathkit-performance-style";
  const PANEL_ID = "fathkit-performance-panel";

  function formatTime(value) {
    if (!Number.isFinite(value) || value < 0) return "Tidak tersedia";
    return value.toFixed(2) + " ms";
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) {
      return "Tidak tersedia";
    }

    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + " KB";
    }

    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  function getNavigationData() {
    const entries = performance.getEntriesByType("navigation");
    const nav = entries && entries.length ? entries[0] : null;

    if (!nav) {
      return {
        loadTime: null,
        domTime: null,
        responseTime: null
      };
    }

    return {
      loadTime: nav.loadEventEnd > 0
        ? nav.loadEventEnd
        : nav.duration,

      domTime: nav.domContentLoadedEventEnd > 0
        ? nav.domContentLoadedEventEnd
        : null,

      responseTime: nav.responseEnd > 0
        ? nav.responseEnd
        : null
    };
  }

  function getResourceData() {
    const resources = performance.getEntriesByType("resource");

    let totalTransfer = 0;
    let totalDuration = 0;
    let transferAvailable = false;

    resources.forEach(function (item) {
      if (Number.isFinite(item.transferSize)) {
        totalTransfer += item.transferSize;
        transferAvailable = true;
      }

      if (Number.isFinite(item.duration)) {
        totalDuration += item.duration;
      }
    });

    return {
      count: resources.length,
      transfer: transferAvailable ? totalTransfer : null,
      duration: totalDuration
    };
  }

  function getMemoryData() {
    const memory = performance.memory;

    if (!memory) return null;

    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    };
  }

  function getConnectionData() {
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    if (!navigator.onLine) {
      return {
        online: false,
        type: "Offline",
        effectiveType: "-"
      };
    }

    return {
      online: true,
      type: connection && connection.type
        ? connection.type
        : "Tidak diketahui",

      effectiveType: connection && connection.effectiveType
        ? connection.effectiveType
        : "Tidak diketahui"
    };
  }

  function collect() {
    return {
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
      navigation: getNavigationData(),
      resources: getResourceData(),
      memory: getMemoryData(),
      connection: getConnectionData(),
      serviceWorker: "serviceWorker" in navigator,
      secureContext: window.isSecureContext === true
    };
  }

  function createStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      #fathkit-performance-button {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 99990;
        border: 0;
        border-radius: 12px;
        padding: 12px 15px;
        background: #2563eb;
        color: #ffffff;
        font-size: 13px;
        font-weight: 700;
        box-shadow: 0 4px 15px rgba(0,0,0,.2);
        cursor: pointer;
      }

      #fathkit-performance-panel {
        position: fixed;
        inset: 0;
        z-index: 99991;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(0,0,0,.55);
        font-family: Arial, sans-serif;
      }

      #fathkit-performance-panel.fk-open {
        display: flex;
      }

      .fk-performance-card {
        width: 100%;
        max-width: 440px;
        max-height: 85vh;
        overflow-y: auto;
        background: #ffffff;
        color: #111827;
        border-radius: 18px;
        padding: 20px;
        box-shadow: 0 15px 45px rgba(0,0,0,.25);
      }

      .fk-performance-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
      }

      .fk-performance-header h2 {
        margin: 0;
        font-size: 19px;
      }

      .fk-performance-close {
        border: 0;
        background: #f3f4f6;
        color: #111827;
        border-radius: 9px;
        padding: 8px 12px;
        font-size: 17px;
        cursor: pointer;
      }

      .fk-performance-status {
        padding: 12px;
        border-radius: 11px;
        background: #eff6ff;
        margin-bottom: 14px;
        font-size: 13px;
        line-height: 1.5;
      }

      .fk-performance-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .fk-performance-item {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 11px;
        padding: 12px;
        min-width: 0;
      }

      .fk-performance-label {
        color: #6b7280;
        font-size: 11px;
        margin-bottom: 7px;
      }

      .fk-performance-value {
        font-size: 15px;
        font-weight: 700;
        overflow-wrap: anywhere;
      }

      .fk-performance-section {
        font-size: 13px;
        font-weight: 700;
        margin: 18px 0 9px;
      }

      .fk-performance-note {
        color: #6b7280;
        font-size: 11px;
        line-height: 1.5;
        margin-top: 15px;
      }

      .fk-performance-actions {
        display: flex;
        gap: 9px;
        margin-top: 16px;
      }

      .fk-performance-actions button {
        flex: 1;
        padding: 11px;
        border: 0;
        border-radius: 10px;
        font-weight: 700;
        cursor: pointer;
      }

      .fk-performance-refresh {
        background: #2563eb;
        color: #ffffff;
      }

      .fk-performance-copy {
        background: #e5e7eb;
        color: #111827;
      }

      @media (prefers-color-scheme: dark) {
        .fk-performance-card {
          background: #111827;
          color: #f9fafb;
        }

        .fk-performance-item {
          background: #1f2937;
          border-color: #374151;
        }

        .fk-performance-label,
        .fk-performance-note {
          color: #9ca3af;
        }

        .fk-performance-close,
        .fk-performance-copy {
          background: #374151;
          color: #ffffff;
        }

        .fk-performance-status {
          background: #172554;
          color: #dbeafe;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function createElement(tag, className, content) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (content !== undefined) element.textContent = content;

    return element;
  }

  function createMetric(label, value) {
    const item = createElement("div", "fk-performance-item");
    item.appendChild(
      createElement("div", "fk-performance-label", label)
    );
    item.appendChild(
      createElement("div", "fk-performance-value", value)
    );

    return item;
  }

  function render() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    const data = collect();
    const card = panel.querySelector(".fk-performance-card");

    card.innerHTML = "";

    const header = createElement("div", "fk-performance-header");
    header.appendChild(
      createElement("h2", "", "FathKit Performance")
    );

    const close = createElement(
      "button",
      "fk-performance-close",
      "×"
    );

    close.type = "button";
    close.setAttribute("aria-label", "Tutup");
    close.addEventListener("click", closePanel);

    header.appendChild(close);
    card.appendChild(header);

    const status = createElement(
      "div",
      "fk-performance-status",
      data.connection.online
        ? "● Internet terhubung"
        : "● Tidak ada koneksi internet"
    );

    card.appendChild(status);

    card.appendChild(
      createElement("div", "fk-performance-section", "Waktu pemuatan")
    );

    const navigationGrid = createElement(
      "div",
      "fk-performance-grid"
    );

    navigationGrid.appendChild(
      createMetric(
        "Total waktu halaman",
        formatTime(data.navigation.loadTime)
      )
    );

    navigationGrid.appendChild(
      createMetric(
        "DOM selesai dimuat",
        formatTime(data.navigation.domTime)
      )
    );

    navigationGrid.appendChild(
      createMetric(
        "Respons terakhir",
        formatTime(data.navigation.responseTime)
      )
    );

    navigationGrid.appendChild(
      createMetric(
        "Jumlah resource",
        String(data.resources.count)
      )
    );

    card.appendChild(navigationGrid);

    card.appendChild(
      createElement("div", "fk-performance-section", "Penggunaan data")
    );

    const resourceGrid = createElement(
      "div",
      "fk-performance-grid"
    );

    resourceGrid.appendChild(
      createMetric(
        "Transfer data",
        formatBytes(data.resources.transfer)
      )
    );

    resourceGrid.appendChild(
      createMetric(
        "Durasi resource",
        formatTime(data.resources.duration)
      )
    );

    card.appendChild(resourceGrid);

    card.appendChild(
      createElement("div", "fk-performance-section", "Memori browser")
    );

    const memoryGrid = createElement(
      "div",
      "fk-performance-grid"
    );

    if (data.memory) {
      memoryGrid.appendChild(
        createMetric("Memori terpakai", formatBytes(data.memory.used))
      );

      memoryGrid.appendChild(
        createMetric("Total heap", formatBytes(data.memory.total))
      );

      memoryGrid.appendChild(
        createMetric("Batas heap", formatBytes(data.memory.limit))
      );
    } else {
      memoryGrid.appendChild(
        createMetric("Status", "Tidak didukung browser")
      );
    }

    card.appendChild(memoryGrid);

    card.appendChild(
      createElement("div", "fk-performance-section", "Status perangkat")
    );

    const deviceGrid = createElement(
      "div",
      "fk-performance-grid"
    );

    deviceGrid.appendChild(
      createMetric("Koneksi", data.connection.type)
    );

    deviceGrid.appendChild(
      createMetric("Jaringan", data.connection.effectiveType)
    );

    deviceGrid.appendChild(
      createMetric(
        "HTTPS / Secure Context",
        data.secureContext ? "Aktif" : "Tidak aktif"
      )
    );

    deviceGrid.appendChild(
      createMetric(
        "Service Worker",
        data.serviceWorker ? "Didukung" : "Tidak didukung"
      )
    );

    card.appendChild(deviceGrid);

    const note = createElement(
      "div",
      "fk-performance-note",
      "Catatan: hasil bergantung pada kemampuan browser dan perangkat. " +
      "Data ini merupakan informasi performa lokal, bukan hasil pengujian " +
      "server atau audit keamanan."
    );

    card.appendChild(note);

    const actions = createElement(
      "div",
      "fk-performance-actions"
    );

    const refresh = createElement(
      "button",
      "fk-performance-refresh",
      "Perbarui"
    );

    refresh.type = "button";
    refresh.addEventListener("click", render);

    const copy = createElement(
      "button",
      "fk-performance-copy",
      "Salin laporan"
    );

    copy.type = "button";
    copy.addEventListener("click", copyReport);

    actions.appendChild(refresh);
    actions.appendChild(copy);
    card.appendChild(actions);
  }

  function copyReport() {
    const report = collect();

    const output = JSON.stringify(report, null, 2);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(output).then(function () {
        alert("Laporan performa berhasil disalin.");
      }).catch(function () {
        fallbackCopy(output);
      });
    } else {
      fallbackCopy(output);
    }
  }

  function fallbackCopy(value) {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand("copy");
      alert("Laporan performa berhasil disalin.");
    } catch (error) {
      alert("Tidak dapat menyalin laporan.");
    }

    textarea.remove();
  }

  function openPanel() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    render();
    panel.classList.add("fk-open");
    panel.setAttribute("aria-hidden", "false");
  }

  function closePanel() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    panel.classList.remove("fk-open");
    panel.setAttribute("aria-hidden", "true");
  }

  function initialize() {
    if (document.getElementById(PANEL_ID)) return;

    createStyle();

    const button = createElement(
      "button",
      "",
      "Performa"
    );

    button.id = "fathkit-performance-button";
    button.type = "button";
    button.addEventListener("click", openPanel);

    const panel = createElement("div", "");
    panel.id = PANEL_ID;
    panel.setAttribute("aria-hidden", "true");

    const card = createElement("div", "fk-performance-card");
    panel.appendChild(card);

    panel.addEventListener("click", function (event) {
      if (event.target === panel) closePanel();
    });

    document.body.appendChild(button);
    document.body.appendChild(panel);
  }

  window.FATHKIT_PERFORMANCE = {
    getReport: collect,
    refresh: collect,
    open: openPanel,
    close: closePanel
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }

})();