(function () {
  "use strict";

  const LaunchReadiness = {
    results: [],
    panel: null,

    check(name, passed, detail, level) {
      this.results.push({
        name,
        passed: Boolean(passed),
        detail: detail || "",
        level: level || "required"
      });
    },

    run() {
      this.results = [];

      // 1. Pemeriksaan struktur halaman
      const requiredElements = [
        "categoryGrid",
        "toolGrid",
        "toolModal",
        "toolContent",
        "toolSearch",
        "toast"
      ];

      requiredElements.forEach(id => {
        this.check(
          "Elemen halaman: " + id,
          Boolean(document.getElementById(id)),
          "Pemeriksaan ID HTML: " + id
        );
      });

      // 2. Pemeriksaan sistem utama
      const systems = [
        ["Katalog tools", window.FATHKIT_CATALOG],
        ["Detail tools", window.FATHKIT_TOOL_DETAILS],
        ["Aplikasi utama", window.FATHKIT_APP],
        ["Sistem akun", window.FATHKIT_AUTH],
        ["Sistem favorit", window.FATHKIT_FAVORITES],
        ["Sistem riwayat", window.FATHKIT_HISTORY],
        ["Sistem Free/Pro", window.FATHKIT_PLANS],
        ["Diagnostik", window.FATHKIT_DIAGNOSTICS],
        ["Pengujian integrasi", window.FATHKIT_TESTS]
      ];

      systems.forEach(([name, system]) => {
        this.check(
          name,
          Boolean(system),
          system ? "Komponen tersedia" : "Komponen belum ditemukan"
        );
      });

      // 3. Pemeriksaan data tools
      const tools = window.FATHKIT_CATALOG &&
        typeof window.FATHKIT_CATALOG.getAll === "function"
        ? window.FATHKIT_CATALOG.getAll()
        : (window.FATHKIT_TOOLS || []);

      this.check(
        "Katalog berisi tools",
        Array.isArray(tools) && tools.length > 0,
        "Jumlah tools: " + (tools.length || 0)
      );

      // 4. Pemeriksaan file script
      const requiredScripts = [
        "data/categories.js",
        "data/tools.js",
        "js/catalog.js",
        "js/tool-details.js",
        "js/config.js",
        "js/supabase.js",
        "js/auth.js",
        "js/favorites.js",
        "js/history.js",
        "js/dashboard.js",
        "js/help.js",
        "js/plans.js",
        "js/app.js",
        "js/diagnostics.js",
        "js/integration-tests.js",
        "js/launch-readiness.js"
      ];

      const loadedScripts = Array.from(document.scripts)
        .map(script => script.getAttribute("src"))
        .filter(Boolean);

      requiredScripts.forEach(path => {
        const matches = loadedScripts.filter(src =>
          src.endsWith(path)
        );

        this.check(
          "File: " + path,
          matches.length === 1,
          matches.length === 1
            ? "Ditemukan satu kali"
            : matches.length === 0
              ? "Belum ditemukan"
              : "Ditemukan " + matches.length + " kali"
        );
      });

      // 5. Pemeriksaan lingkungan website
      const isHTTPS = window.location.protocol === "https:";
      const isLocal = [
        "localhost",
        "127.0.0.1"
      ].includes(window.location.hostname);

      this.check(
        "HTTPS website",
        isHTTPS || isLocal,
        isHTTPS
          ? "Website menggunakan HTTPS"
          : isLocal
            ? "Lingkungan lokal"
            : "Website publik sebaiknya menggunakan HTTPS",
        "recommended"
      );

      // 6. Pemeriksaan penyimpanan browser
      let storageAvailable = false;

      try {
        const testKey = "__fathkit_storage_test__";
        localStorage.setItem(testKey, "ok");
        localStorage.removeItem(testKey);
        storageAvailable = true;
      } catch (error) {
        storageAvailable = false;
      }

      this.check(
        "Penyimpanan browser",
        storageAvailable,
        storageAvailable
          ? "localStorage dapat digunakan"
          : "Penyimpanan browser tidak tersedia"
      );

      // 7. Pemeriksaan koneksi Supabase
      const supabaseClient =
        window.FATHKIT_SUPABASE &&
        window.FATHKIT_SUPABASE.client;

      this.check(
        "Supabase client",
        Boolean(supabaseClient),
        supabaseClient
          ? "Client tersedia"
          : "Client belum tersedia atau konfigurasi perlu diperiksa"
      );

      // 8. Pemeriksaan hasil integrasi
      const integrationReport =
        window.FATHKIT_TEST_REPORT;

      this.check(
        "Laporan integrasi tersedia",
        Boolean(integrationReport),
        integrationReport
          ? "Total pemeriksaan sebelumnya: " +
            integrationReport.total
          : "Laporan integrasi belum tersedia"
      );

      // 9. Pengingat keamanan
      this.check(
        "Pemeriksaan RLS database",
        false,
        "Perlu diverifikasi langsung di Supabase",
        "manual"
      );

      this.check(
        "Pemeriksaan API dan Secret Key",
        false,
        "Pastikan Secret Key dan service_role tidak pernah dimasukkan ke frontend",
        "manual"
      );

      this.check(
        "Pemeriksaan backup database",
        false,
        "Pastikan tersedia backup sebelum peluncuran",
        "manual"
      );

      this.check(
        "Pemeriksaan fitur Pro",
        false,
        "Pastikan akses Pro divalidasi oleh backend tepercaya",
        "manual"
      );

      const passed = this.results.filter(
        item => item.passed
      ).length;

      const failed = this.results.filter(
        item => !item.passed && item.level === "required"
      ).length;

      const manual = this.results.filter(
        item => item.level === "manual"
      ).length;

      const report = {
        total: this.results.length,
        passed,
        failed,
        manual,
        results: this.results.slice(),
        completedAt: new Date().toISOString()
      };

      window.FATHKIT_LAUNCH_REPORT = report;

      console.group("FATHKIT LAUNCH READINESS");

      this.results.forEach(item => {
        const method = item.passed ? "log" : "warn";

        console[method](
          (item.passed ? "OK" : "PERIKSA") +
          " | " + item.name,
          item.detail
        );
      });

      console.log("Total:", report.total);
      console.log("Lulus:", report.passed);
      console.log("Perlu diperiksa:", report.failed);
      console.log("Pemeriksaan manual:", report.manual);

      console.groupEnd();

      window.dispatchEvent(
        new CustomEvent("fathkit:launch-readiness-complete", {
          detail: report
        })
      );

      this.render();

      return report;
    },

    createPanel() {
      if (this.panel) return this.panel;

      const style = document.createElement("style");

      style.textContent = `
        #fk-launch-button {
          position: fixed;
          right: 14px;
          bottom: 145px;
          z-index: 99980;
          border: 0;
          border-radius: 30px;
          padding: 12px 16px;
          background: #1d4ed8;
          color: white;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 4px 18px #0003;
        }

        #fk-launch-panel {
          position: fixed;
          inset: 0;
          z-index: 100001;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 15px;
          background: #0009;
          font-family: Arial, sans-serif;
        }

        #fk-launch-panel.visible {
          display: flex;
        }

        #fk-launch-card {
          width: 100%;
          max-width: 480px;
          max-height: 85vh;
          overflow-y: auto;
          padding: 19px;
          border-radius: 17px;
          background: white;
          color: #222;
        }

        #fk-launch-card h2 {
          margin: 0 0 8px;
          font-size: 20px;
        }

        #fk-launch-summary {
          padding: 13px;
          margin: 13px 0;
          border-radius: 11px;
          background: #f1f5f9;
          line-height: 1.7;
          font-size: 13px;
        }

        .fk-launch-item {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
          font-size: 13px;
        }

        .fk-launch-item small {
          display: block;
          margin-top: 4px;
          color: #777;
          line-height: 1.4;
        }

        .fk-launch-status {
          flex-shrink: 0;
          font-weight: 700;
        }

        .fk-launch-ok {
          color: #16834a;
        }

        .fk-launch-fail {
          color: #c0392b;
        }

        .fk-launch-actions {
          display: flex;
          gap: 9px;
          margin-top: 17px;
        }

        .fk-launch-actions button {
          flex: 1;
          border: 0;
          border-radius: 10px;
          padding: 12px;
          background: #171717;
          color: white;
          font-weight: 700;
        }

        .fk-launch-actions button:last-child {
          background: #e9e9e9;
          color: #222;
        }
      `;

      document.head.appendChild(style);

      const launcher = document.createElement("button");
      launcher.id = "fk-launch-button";
      launcher.type = "button";
      launcher.textContent = "Kesiapan Launch";

      const panel = document.createElement("div");
      panel.id = "fk-launch-panel";

      panel.innerHTML = `
        <div id="fk-launch-card">
          <h2>Kesiapan Peluncuran</h2>

          <div id="fk-launch-summary">
            Menunggu pemeriksaan...
          </div>

          <div id="fk-launch-results"></div>

          <div class="fk-launch-actions">
            <button type="button" id="fk-launch-rerun">
              Periksa Ulang
            </button>

            <button type="button" id="fk-launch-close">
              Tutup
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(launcher);
      document.body.appendChild(panel);

      launcher.addEventListener("click", () => {
        panel.classList.add("visible");
        this.render();
      });

      panel.querySelector("#fk-launch-close")
        .addEventListener("click", () => {
          panel.classList.remove("visible");
        });

      panel.querySelector("#fk-launch-rerun")
        .addEventListener("click", () => {
          this.run();
        });

      panel.addEventListener("click", event => {
        if (event.target === panel) {
          panel.classList.remove("visible");
        }
      });

      this.panel = panel;

      return panel;
    },

    render() {
      const panel = this.createPanel();

      const summary =
        panel.querySelector("#fk-launch-summary");

      const list =
        panel.querySelector("#fk-launch-results");

      const passed = this.results.filter(
        item => item.passed
      ).length;

      const failed = this.results.filter(
        item => !item.passed && item.level === "required"
      ).length;

      const manual = this.results.filter(
        item => item.level === "manual"
      ).length;

      summary.textContent =
        "Lulus: " + passed +
        " | Perlu diperiksa: " + failed +
        " | Manual: " + manual;

      list.replaceChildren();

      this.results.forEach(result => {
        const item = document.createElement("div");
        item.className = "fk-launch-item";

        const description = document.createElement("div");
        description.textContent = result.name;

        const detail = document.createElement("small");
        detail.textContent = result.detail;

        description.appendChild(detail);

        const status = document.createElement("span");
        status.className =
          "fk-launch-status " +
          (result.passed
            ? "fk-launch-ok"
            : "fk-launch-fail");

        status.textContent = result.passed
          ? "OK"
          : result.level === "manual"
            ? "MANUAL"
            : "PERIKSA";

        item.appendChild(description);
        item.appendChild(status);

        list.appendChild(item);
      });
    }
  };

  window.FATHKIT_LAUNCH_READINESS = LaunchReadiness;

  function initialize() {
    LaunchReadiness.createPanel();
    LaunchReadiness.run();
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