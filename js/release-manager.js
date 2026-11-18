(function () {
  "use strict";

  const ReleaseManager = {
    version: "1.0.0",
    panel: null,
    button: null,
    errors: [],
    status: {
      online: navigator.onLine,
      serviceWorker: false,
      installed: false,
      updateAvailable: false
    },

    initialize() {
      this.createInterface();
      this.refreshStatus();
      this.bindEvents();

      console.info(
        "FathKit Release Manager v" + this.version + " siap."
      );
    },

    refreshStatus() {
      this.status.online = navigator.onLine;

      this.status.serviceWorker =
        "serviceWorker" in navigator;

      this.status.installed =
        window.FATHKIT_PWA &&
        typeof window.FATHKIT_PWA.isInstalled === "function"
          ? window.FATHKIT_PWA.isInstalled()
          : false;

      this.render();
      return this.getStatus();
    },

    getStatus() {
      return {
        version: this.version,
        online: this.status.online,
        serviceWorker: this.status.serviceWorker,
        installed: this.status.installed,
        updateAvailable: this.status.updateAvailable,
        errorCount: this.errors.length
      };
    },

    addError(type, message) {
      this.errors.unshift({
        type: String(type).slice(0, 50),
        message: String(message).slice(0, 250),
        time: new Date().toLocaleString("id-ID")
      });

      if (this.errors.length > 10) {
        this.errors.length = 10;
      }

      this.render();

      console.warn(
        "FathKit runtime warning:",
        type,
        message
      );
    },

    bindEvents() {
      window.addEventListener("online", () => {
        this.status.online = true;
        this.render();
      });

      window.addEventListener("offline", () => {
        this.status.online = false;
        this.render();
      });

      window.addEventListener("error", event => {
        this.addError(
          "JavaScript",
          event.message || "Terjadi kesalahan JavaScript."
        );
      });

      window.addEventListener(
        "unhandledrejection",
        event => {
          this.addError(
            "Promise",
            event.reason && event.reason.message
              ? event.reason.message
              : "Terjadi kesalahan proses asynchronous."
          );
        }
      );

      window.addEventListener(
        "fathkit:pwa-ready",
        () => {
          this.refreshStatus();
          this.watchUpdates();
        }
      );

      window.addEventListener(
        "fathkit:pwa-install-available",
        () => {
          this.render();
        }
      );

      window.addEventListener(
        "fathkit:pwa-installed",
        () => {
          this.refreshStatus();
        }
      );
    },

    async watchUpdates() {
      if (
        !window.FATHKIT_PWA ||
        !window.FATHKIT_PWA.registration
      ) {
        return;
      }

      const registration =
        window.FATHKIT_PWA.registration;

      registration.addEventListener(
        "updatefound",
        () => {
          const worker = registration.installing;

          if (!worker) return;

          worker.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              this.status.updateAvailable = true;
              this.render();

              window.dispatchEvent(
                new CustomEvent("fathkit:update-available")
              );
            }
          });
        }
      );

      try {
        await registration.update();
      } catch (error) {
        console.info(
          "FathKit: pemeriksaan pembaruan belum berhasil."
        );
      }
    },

    async checkForUpdate() {
      if (
        !window.FATHKIT_PWA ||
        !window.FATHKIT_PWA.registration
      ) {
        return false;
      }

      try {
        await window.FATHKIT_PWA.registration.update();

        return true;
      } catch (error) {
        this.addError(
          "Pembaruan",
          "Tidak dapat memeriksa pembaruan aplikasi."
        );

        return false;
      }
    },

    createInterface() {
      if (this.button) return;

      const style = document.createElement("style");

      style.textContent = `
        #fk-release-button {
          position: fixed;
          left: 12px;
          bottom: 15px;
          z-index: 99970;
          border: 1px solid #e5e7eb;
          border-radius: 30px;
          padding: 10px 14px;
          background: white;
          color: #111827;
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 3px 14px #0002;
        }

        #fk-release-panel {
          position: fixed;
          inset: 0;
          z-index: 100002;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 15px;
          background: #0008;
          font-family: Arial, sans-serif;
        }

        #fk-release-panel.visible {
          display: flex;
        }

        #fk-release-card {
          width: 100%;
          max-width: 430px;
          max-height: 80vh;
          overflow-y: auto;
          padding: 20px;
          border-radius: 17px;
          background: white;
          color: #222;
        }

        #fk-release-card h2 {
          margin: 0 0 7px;
          font-size: 20px;
        }

        .fk-release-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 11px 0;
          border-bottom: 1px solid #eee;
          font-size: 13px;
        }

        .fk-release-good {
          color: #16834a;
          font-weight: 700;
        }

        .fk-release-bad {
          color: #c0392b;
          font-weight: 700;
        }

        .fk-release-error {
          padding: 10px;
          margin-top: 8px;
          border-radius: 9px;
          background: #f8fafc;
          font-size: 12px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .fk-release-actions {
          display: flex;
          gap: 9px;
          margin-top: 17px;
        }

        .fk-release-actions button {
          flex: 1;
          padding: 12px;
          border: 0;
          border-radius: 10px;
          background: #171717;
          color: white;
          font-weight: 700;
        }

        .fk-release-actions button:last-child {
          background: #e9e9e9;
          color: #222;
        }
      `;

      document.head.appendChild(style);

      const button = document.createElement("button");
      button.id = "fk-release-button";
      button.type = "button";
      button.textContent = "FathKit Status";

      const panel = document.createElement("div");
      panel.id = "fk-release-panel";

      panel.innerHTML = `
        <div id="fk-release-card">
          <h2>Status FathKit</h2>

          <p id="fk-release-version"></p>

          <div id="fk-release-status"></div>

          <h3>Catatan kesalahan</h3>
          <div id="fk-release-errors"></div>

          <div class="fk-release-actions">
            <button type="button" id="fk-release-refresh">
              Periksa Ulang
            </button>

            <button type="button" id="fk-release-close">
              Tutup
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(button);
      document.body.appendChild(panel);

      button.addEventListener("click", () => {
        panel.classList.add("visible");
        this.render();
      });

      panel.querySelector("#fk-release-close")
        .addEventListener("click", () => {
          panel.classList.remove("visible");
        });

      panel.querySelector("#fk-release-refresh")
        .addEventListener("click", async () => {
          this.refreshStatus();
          await this.checkForUpdate();
          this.render();
        });

      panel.addEventListener("click", event => {
        if (event.target === panel) {
          panel.classList.remove("visible");
        }
      });

      this.button = button;
      this.panel = panel;
    },

    render() {
      if (!this.panel || !this.button) return;

      const status = this.getStatus();

      this.button.textContent = status.online
        ? "FathKit: Online"
        : "FathKit: Offline";

      const version =
        this.panel.querySelector("#fk-release-version");

      const statusBox =
        this.panel.querySelector("#fk-release-status");

      const errorBox =
        this.panel.querySelector("#fk-release-errors");

      version.textContent =
        "Versi aplikasi: " + status.version;

      const rows = [
        ["Internet", status.online ? "Online" : "Offline", status.online],
        ["Service Worker", status.serviceWorker ? "Didukung" : "Tidak didukung", status.serviceWorker],
        ["PWA terinstal", status.installed ? "Ya" : "Belum", status.installed],
        ["Pembaruan", status.updateAvailable ? "Tersedia" : "Belum terdeteksi", !status.updateAvailable]
      ];

      statusBox.replaceChildren();

      rows.forEach(([name, value, good]) => {
        const row = document.createElement("div");
        row.className = "fk-release-row";

        const label = document.createElement("span");
        label.textContent = name;

        const result = document.createElement("strong");
        result.textContent = value;
        result.className = good
          ? "fk-release-good"
          : "fk-release-bad";

        row.appendChild(label);
        row.appendChild(result);

        statusBox.appendChild(row);
      });

      errorBox.replaceChildren();

      if (this.errors.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "Belum ada kesalahan yang tercatat.";
        errorBox.appendChild(empty);
      } else {
        this.errors.forEach(error => {
          const item = document.createElement("div");
          item.className = "fk-release-error";

          item.textContent =
            error.time + " | " +
            error.type + ": " +
            error.message;

          errorBox.appendChild(item);
        });
      }
    }
  };

  window.FATHKIT_RELEASE = ReleaseManager;

  function initialize() {
    ReleaseManager.initialize();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      { once: true }
    );
  } else {
    initialize();
  }

})();