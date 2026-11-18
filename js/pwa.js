(function () {
  "use strict";

  const PWA = {
    registration: null,
    installPrompt: null,

    async initialize() {
      if (!("serviceWorker" in navigator)) {
        console.info("FathKit: Service Worker tidak didukung.");
        return false;
      }

      const isLocalhost = [
        "localhost",
        "127.0.0.1"
      ].includes(location.hostname);

      if (
        location.protocol !== "https:" &&
        !isLocalhost
      ) {
        console.warn(
          "FathKit PWA membutuhkan HTTPS atau localhost."
        );

        return false;
      }

      try {
        this.registration =
          await navigator.serviceWorker.register("./sw.js", {
            scope: "./"
          });

        console.info(
          "FathKit Service Worker berhasil didaftarkan."
        );

        window.dispatchEvent(
          new CustomEvent("fathkit:pwa-ready", {
            detail: {
              registration: this.registration
            }
          })
        );

        return true;

      } catch (error) {
        console.error(
          "FathKit PWA gagal didaftarkan:",
          error
        );

        return false;
      }
    },

    async install() {
      if (!this.installPrompt) {
        return {
          success: false,
          message: "Opsi instalasi belum tersedia."
        };
      }

      this.installPrompt.prompt();

      const result =
        await this.installPrompt.userChoice;

      this.installPrompt = null;

      return {
        success: result.outcome === "accepted",
        message: result.outcome === "accepted"
          ? "Permintaan instalasi diterima."
          : "Instalasi belum dilakukan."
      };
    },

    isInstalled() {
      return window.matchMedia(
        "(display-mode: standalone)"
      ).matches ||
      window.navigator.standalone === true;
    },

    getStatus() {
      return {
        supported: "serviceWorker" in navigator,
        installed: this.isInstalled(),
        registered: Boolean(this.registration)
      };
    }
  };

  window.FATHKIT_PWA = PWA;

  window.addEventListener(
    "beforeinstallprompt",
    event => {
      event.preventDefault();

      PWA.installPrompt = event;

      window.dispatchEvent(
        new CustomEvent("fathkit:pwa-install-available")
      );
    }
  );

  window.addEventListener(
    "appinstalled",
    () => {
      PWA.installPrompt = null;

      window.dispatchEvent(
        new CustomEvent("fathkit:pwa-installed")
      );
    }
  );

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => PWA.initialize(),
      { once: true }
    );
  } else {
    PWA.initialize();
  }

})();