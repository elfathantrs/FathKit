(function () {
  "use strict";

  const TestSystem = {
    results: [],
    panel: null,

    check(name, passed, detail) {
      this.results.push({
        name,
        passed: Boolean(passed),
        detail: detail || ""
      });
    },

    hasMethods(object, methods) {
      return Boolean(
        object &&
        methods.every(method => typeof object[method] === "function")
      );
    },

    run() {
      this.results = [];

      const catalog = window.FATHKIT_CATALOG;
      const app = window.FATHKIT_APP;
      const auth = window.FATHKIT_AUTH;
      const favorites = window.FATHKIT_FAVORITES;
      const history = window.FATHKIT_HISTORY;
      const plans = window.FATHKIT_PLANS;
      const details = window.FATHKIT_TOOL_DETAILS;

      // 1. Pemeriksaan data
      const tools = catalog && typeof catalog.getAll === "function"
        ? catalog.getAll()
        : (window.FATHKIT_TOOLS || []);

      const categories = catalog &&
        typeof catalog.getCategories === "function"
        ? catalog.getCategories()
        : (window.FATHKIT_CATEGORIES || []);

      this.check(
        "Data tools tersedia",
        Array.isArray(tools) && tools.length > 0,
        "Jumlah tools: " + (tools.length || 0)
      );

      this.check(
        "Data kategori tersedia",
        Array.isArray(categories) && categories.length > 0,
        "Jumlah kategori: " + (categories.length || 0)
      );

      const validTools = Array.isArray(tools)
        ? tools.filter(tool =>
            tool &&
            typeof tool.id === "string" &&
            tool.id.trim() &&
            typeof tool.name === "string" &&
            tool.name.trim()
          )
        : [];

      this.check(
        "Struktur data tools",
        validTools.length === tools.length && tools.length > 0,
        validTools.length + " dari " + tools.length + " tools memiliki ID dan nama"
      );

      const ids = validTools.map(tool => tool.id);
      const uniqueIds = new Set(ids);

      this.check(
        "ID tools tidak duplikat",
        uniqueIds.size === ids.length,
        "ID unik: " + uniqueIds.size
      );

      // 2. Pemeriksaan sistem utama
      this.check(
        "Katalog tools",
        this.hasMethods(catalog, [
          "getAll",
          "getById",
          "getCategories",
          "search"
        ]),
        "FATHKIT_CATALOG"
      );

      this.check(
        "Detail tools",
        this.hasMethods(details, ["open"]),
        "FATHKIT_TOOL_DETAILS"
      );

      this.check(
        "Aplikasi utama",
        this.hasMethods(app, [
          "openTool",
          "resetFilters",
          "search",
          "getFilteredTools"
        ]),
        "FATHKIT_APP"
      );

      this.check(
        "Sistem akun",
        this.hasMethods(auth, [
          "open",
          "close",
          "logout",
          "getUser"
        ]),
        "FATHKIT_AUTH"
      );

      this.check(
        "Sistem favorit",
        this.hasMethods(favorites, [
          "list",
          "add",
          "remove",
          "toggle",
          "isFavorite",
          "load",
          "clear"
        ]),
        "FATHKIT_FAVORITES"
      );

      this.check(
        "Sistem riwayat",
        this.hasMethods(history, [
          "list",
          "record",
          "clear",
          "load"
        ]),
        "FATHKIT_HISTORY"
      );

      this.check(
        "Sistem Free/Pro",
        this.hasMethods(plans, [
          "getCurrent",
          "getDetails",
          "getAll",
          "isPro",
          "hasAccess",
          "checkToolAccess",
          "requestUpgrade",
          "refresh"
        ]),
        "FATHKIT_PLANS"
      );

      // 3. Pemeriksaan elemen HTML
      const requiredElements = [
        "categoryGrid",
        "toolGrid",
        "toolModal",
        "modalTitle",
        "toolContent",
        "toast"
      ];

      requiredElements.forEach(id => {
        this.check(
          "HTML: " + id,
          Boolean(document.getElementById(id)),
          "ID: " + id
        );
      });

      // 4. Pemeriksaan urutan file
      const expectedScripts = [
        "data/categories.js",
        "data/tools.js",
        "js/catalog.js",
        "js/tool-details.js",
        "js/plans.js",
        "js/config.js",
        "js/supabase.js",
        "js/auth.js",
        "js/favorites.js",
        "js/history.js",
        "js/dashboard.js",
        "js/help.js",
        "js/app.js",
        "js/diagnostics.js",
        "js/integration-tests.js"
      ];

      const loadedScripts = Array.from(document.scripts)
        .map(script => script.getAttribute("src"))
        .filter(Boolean);

      const scriptPositions = expectedScripts.map(path =>
        loadedScripts.findIndex(src => src.endsWith(path))
      );

      const allScriptsLoaded = scriptPositions.every(
        position => position !== -1
      );

      const scriptsOrdered = scriptPositions.every(
        (position, index) =>
          index === 0 || position > scriptPositions[index - 1]
      );

      this.check(
        "File JavaScript tersedia",
        allScriptsLoaded,
        scriptPositions.filter(position => position !== -1).length +
          " dari " + expectedScripts.length + " file ditemukan"
      );

      this.check(
        "Urutan script",
        allScriptsLoaded && scriptsOrdered,
        scriptsOrdered
          ? "Urutan sesuai"
          : "Periksa urutan script di index.html"
      );

      // 5. Pemeriksaan Supabase
      const supabase = window.FATHKIT_SUPABASE;
      const client = supabase && supabase.client;

      this.check(
        "Supabase client",
        Boolean(client),
        client
          ? "Client tersedia"
          : "Client belum tersedia"
      );

      // 6. Pemeriksaan diagnostik
      this.check(
        "Sistem diagnostik",
        Boolean(window.FATHKIT_DIAGNOSTICS),
        "FATHKIT_DIAGNOSTICS"
      );

      const passed = this.results.filter(
        result => result.passed
      ).length;

      const failed = this.results.length - passed;

      const report = {
        total: this.results.length,
        passed,
        failed,
        results: this.results.slice(),
        completedAt: new Date().toISOString()
      };

      window.FATHKIT_TEST_REPORT = report;

      console.group("FATHKIT INTEGRATION TEST");

      this.results.forEach(result => {
        const method = result.passed ? "log" : "warn";

        console[method](
          (result.passed ? "LULUS" : "PERIKSA") +
          " | " + result.name,
          result.detail
        );
      });

      console.log("Total:", report.total);
      console.log("Lulus:", report.passed);
      console.log("Perlu diperiksa:", report.failed);

      console.groupEnd();

      window.dispatchEvent(
        new CustomEvent("fathkit:tests-complete", {
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
        #fk-test-launcher {
          position: fixed;
          right: 14px;
          bottom: 90px;
          z-index: 99990;
          border: 0;
          border-radius: 30px;
          padding: 12px 17px;
          background: #171717;
          color: white;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 4px 18px #0003;
        }

        #fk-test-panel {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: #0008;
          font-family: Arial, sans-serif;
        }

        #fk-test-panel.fk-test-visible {
          display: flex;
        }

        #fk-test-card {
          width: 100%;
          max-width: 470px;
          max-height: 82vh;
          overflow: auto;
          padding: 19px;
          border-radius: 18px;
          background: white;
          color: #202020;
          box-shadow: 0 10px 40px #0003;
        }

        #fk-test-card h2 {
          margin: 0 0 8px;
          font-size: 20px;
        }

        #fk-test-summary {
          margin: 12px 0;
          padding: 13px;
          border-radius: 12px;
          background: #f1f3f5;
          line-height: 1.7;
        }

        .fk-test-item {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
          font-size: 13px;
        }

        .fk-test-item small {
          display: block;
          margin-top: 4px;
          color: #777;
        }

        .fk-test-status {
          flex-shrink: 0;
          font-weight: 700;
        }

        .fk-test-ok { color: #16834a; }
        .fk-test-fail { color: #c0392b; }

        .fk-test-actions {
          display: flex;
          gap: 9px;
          margin-top: 17px;
        }

        .fk-test-actions button {
          flex: 1;
          border: 0;
          border-radius: 10px;
          padding: 12px;
          font-weight: 700;
          background: #171717;
          color: white;
        }

        .fk-test-actions button:last-child {
          background: #e9e9e9;
          color: #222;
        }
      `;

      document.head.appendChild(style);

      const launcher = document.createElement("button");
      launcher.id = "fk-test-launcher";
      launcher.type = "button";
      launcher.textContent = "Tes FathKit";

      const panel = document.createElement("div");
      panel.id = "fk-test-panel";

      panel.innerHTML = `
        <div id="fk-test-card">
          <h2>Pemeriksaan FathKit</h2>
          <div id="fk-test-summary">
            Menunggu hasil pemeriksaan...
          </div>
          <div id="fk-test-results"></div>
          <div class="fk-test-actions">
            <button type="button" id="fk-test-rerun">
              Jalankan Ulang
            </button>
            <button type="button" id="fk-test-close">
              Tutup
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(launcher);
      document.body.appendChild(panel);

      launcher.addEventListener("click", () => {
        panel.classList.add("fk-test-visible");
        this.render();
      });

      panel.querySelector("#fk-test-close")
        .addEventListener("click", () => {
          panel.classList.remove("fk-test-visible");
        });

      panel.querySelector("#fk-test-rerun")
        .addEventListener("click", () => {
          this.run();
        });

      panel.addEventListener("click", event => {
        if (event.target === panel) {
          panel.classList.remove("fk-test-visible");
        }
      });

      this.panel = panel;

      return panel;
    },

    render() {
      const panel = this.createPanel();

      const summary = panel.querySelector("#fk-test-summary");
      const list = panel.querySelector("#fk-test-results");

      const passed = this.results.filter(
        result => result.passed
      ).length;

      const failed = this.results.length - passed;

      summary.textContent =
        "Total: " + this.results.length +
        " | Lulus: " + passed +
        " | Perlu diperiksa: " + failed;

      list.replaceChildren();

      this.results.forEach(result => {
        const item = document.createElement("div");
        item.className = "fk-test-item";

        const description = document.createElement("div");
        description.textContent = result.name;

        const detail = document.createElement("small");
        detail.textContent = result.detail;

        description.appendChild(detail);

        const status = document.createElement("span");
        status.className =
          "fk-test-status " +
          (result.passed ? "fk-test-ok" : "fk-test-fail");

        status.textContent = result.passed ? "LULUS" : "PERIKSA";

        item.appendChild(description);
        item.appendChild(status);

        list.appendChild(item);
      });
    }
  };

  window.FATHKIT_TESTS = TestSystem;

  function initialize() {
    TestSystem.createPanel();
    TestSystem.run();
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