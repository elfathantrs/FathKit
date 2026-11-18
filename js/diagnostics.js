(function () {
  "use strict";

  const Diagnostics = {
    results: [],

    check(name, condition, detail) {
      this.results.push({
        name,
        status: condition ? "OK" : "PERLU DIPERIKSA",
        detail: detail || ""
      });
    },

    run() {
      this.results = [];

      const tools = window.FATHKIT_CATALOG
        ? window.FATHKIT_CATALOG.getAll()
        : (window.FATHKIT_TOOLS || []);

      const categories = window.FATHKIT_CATALOG
        ? window.FATHKIT_CATALOG.getCategories()
        : (window.FATHKIT_CATEGORIES || []);

      this.check(
        "Data kategori",
        Array.isArray(categories) && categories.length > 0,
        "Jumlah: " + (categories.length || 0)
      );

      this.check(
        "Data katalog tools",
        Array.isArray(tools) && tools.length > 0,
        "Jumlah: " + (tools.length || 0)
      );

      this.check(
        "Sistem katalog",
        !!window.FATHKIT_CATALOG,
        "FATHKIT_CATALOG"
      );

      this.check(
        "Sistem detail tools",
        !!window.FATHKIT_TOOL_DETAILS,
        "FATHKIT_TOOL_DETAILS"
      );

      this.check(
        "Sistem aplikasi",
        !!window.FATHKIT_APP,
        "FATHKIT_APP"
      );

      this.check(
        "Sistem autentikasi",
        !!window.FATHKIT_AUTH,
        "FATHKIT_AUTH"
      );

      this.check(
        "Sistem favorit",
        !!window.FATHKIT_FAVORITES,
        "FATHKIT_FAVORITES"
      );

      this.check(
        "Sistem riwayat",
        !!window.FATHKIT_HISTORY,
        "FATHKIT_HISTORY"
      );

      this.check(
        "Sistem paket Free/Pro",
        !!window.FATHKIT_PLANS,
        "FATHKIT_PLANS"
      );

      this.check(
        "Elemen daftar kategori",
        !!document.getElementById("categoryGrid"),
        "categoryGrid"
      );

      this.check(
        "Elemen daftar tools",
        !!document.getElementById("toolGrid"),
        "toolGrid"
      );

      this.check(
        "Elemen modal tools",
        !!document.getElementById("toolModal"),
        "toolModal"
      );

      const supabaseClient =
        window.FATHKIT_SUPABASE &&
        window.FATHKIT_SUPABASE.client;

      this.check(
        "Koneksi Supabase",
        !!supabaseClient,
        supabaseClient
          ? "Client tersedia"
          : "Client belum tersedia atau konfigurasi belum benar"
      );

      const passed = this.results.filter(
        item => item.status === "OK"
      ).length;

      const failed = this.results.length - passed;

      const report = {
        total: this.results.length,
        passed,
        failed,
        results: this.results
      };

      console.group("FATHKIT - LAPORAN DIAGNOSTIK");

      this.results.forEach(item => {
        const method = item.status === "OK" ? "log" : "warn";

        console[method](
          item.status + " | " + item.name,
          item.detail
        );
      });

      console.log("Total pemeriksaan:", report.total);
      console.log("Berhasil:", report.passed);
      console.log("Perlu diperiksa:", report.failed);

      console.groupEnd();

      window.dispatchEvent(
        new CustomEvent("fathkit:diagnostics-complete", {
          detail: report
        })
      );

      return report;
    },

    getResults() {
      return this.results.slice();
    }
  };

  window.FATHKIT_DIAGNOSTICS = Diagnostics;

  function initialize() {
    Diagnostics.run();
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

  window.addEventListener(
    "fathkit:supabase-ready",
    function () {
      Diagnostics.run();
    }
  );

})();