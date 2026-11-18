/* =========================================================
   FATHKIT — HELP CENTER
   Stage 41: User Guide & FAQ
   Company: eLFathan
   Product: FathKit
========================================================= */

"use strict";

(() => {
  if (window.FATHKIT_HELP_CENTER) return;

  const ROOT_ID = "fathkit-help-center";
  const STYLE_ID = "fathkit-help-center-style";

  let root = null;
  let isOpen = false;
  let activeCategory = "Semua";
  let searchQuery = "";

  const ARTICLES = [
    {
      category: "Memulai",
      title: "Apa itu FathKit?",
      content:
        "FathKit adalah platform kumpulan tools digital untuk membantu aktivitas sehari-hari. Pengguna dapat menemukan berbagai alat dalam satu tempat."
    },
    {
      category: "Memulai",
      title: "Bagaimana cara menggunakan FathKit?",
      content:
        "Buka katalog tools, cari alat yang dibutuhkan, pilih tools, lalu ikuti petunjuk penggunaan yang tersedia pada halaman atau jendela tools."
    },
    {
      category: "Tools",
      title: "Bagaimana mencari tools?",
      content:
        "Gunakan kolom pencarian katalog atau tombol pencarian global. Masukkan nama tools atau kata kunci yang berkaitan dengan kebutuhanmu."
    },
    {
      category: "Tools",
      title: "Mengapa tools tidak muncul?",
      content:
        "Pastikan kata kunci pencarian benar dan filter kategori tidak membatasi hasil. Tools yang belum tersedia dalam katalog belum dapat digunakan."
    },
    {
      category: "Akun",
      title: "Bagaimana cara membuat akun?",
      content:
        "Gunakan bagian akun FathKit dan ikuti proses pendaftaran yang tersedia. Pendaftaran memerlukan koneksi internet jika menggunakan layanan Supabase."
    },
    {
      category: "Akun",
      title: "Apa perbedaan Free dan Pro?",
      content:
        "Free merupakan paket dasar. Pro direncanakan menyediakan kemampuan tambahan dan batas penggunaan lebih tinggi. Fitur yang benar-benar tersedia bergantung pada implementasi paket."
    },
    {
      category: "Akun",
      title: "Apakah status Pro bisa diubah dari browser?",
      content:
        "Status paket tidak boleh dianggap sah hanya berdasarkan perubahan tampilan browser. Pemeriksaan hak akses berbayar harus dilakukan oleh backend yang tepercaya."
    },
    {
      category: "Favorit",
      title: "Bagaimana menyimpan tools favorit?",
      content:
        "Gunakan tombol favorit pada tools jika fitur tersebut tersedia. Tools favorit membantu pengguna menemukan alat yang sering digunakan."
    },
    {
      category: "Riwayat",
      title: "Apa fungsi riwayat aktivitas?",
      content:
        "Riwayat aktivitas menampilkan catatan aktivitas yang berhasil disimpan oleh sistem pencatatan FathKit pada perangkat."
    },
    {
      category: "Pengaturan",
      title: "Bagaimana mengubah tema?",
      content:
        "Buka Pengaturan FathKit dan pilih tema terang atau gelap. Tampilan gelap hanya berlaku pada bagian yang sudah mendukung tema tersebut."
    },
    {
      category: "Pengaturan",
      title: "Apakah pengaturan tersimpan?",
      content:
        "Preferensi yang dikelola oleh modul pengaturan disimpan pada penyimpanan lokal perangkat. Menghapus data browser dapat menghapus preferensi tersebut."
    },
    {
      category: "Offline",
      title: "Apakah FathKit bisa digunakan offline?",
      content:
        "Sebagian file aplikasi dapat disimpan melalui Service Worker. Namun login, sinkronisasi, dan layanan API tetap membutuhkan internet."
    },
    {
      category: "Keamanan",
      title: "Apakah data akun aman?",
      content:
        "Keamanan bergantung pada konfigurasi autentikasi, kebijakan database, RLS, dan backend. Jangan pernah membagikan kata sandi atau Secret Key."
    },
    {
      category: "Bantuan",
      title: "Apa yang harus dilakukan jika terjadi kesalahan?",
      content:
        "Catat pesan kesalahan, periksa koneksi internet, lalu coba kembali. Jangan membagikan kata sandi, token, atau informasi rahasia ketika meminta bantuan."
    }
  ];

  const CATEGORIES = [
    "Semua",
    "Memulai",
    "Tools",
    "Akun",
    "Favorit",
    "Riwayat",
    "Pengaturan",
    "Offline",
    "Keamanan",
    "Bantuan"
  ];

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      #${ROOT_ID} {
        position: fixed;
        left: 14px;
        bottom: 76px;
        z-index: 99950;
        font-family: Arial, sans-serif;
        color: #111827;
      }

      #${ROOT_ID} * {
        box-sizing: border-box;
      }

      #${ROOT_ID} .fk-help-toggle {
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

      #${ROOT_ID} .fk-help-panel {
        position: absolute;
        left: 0;
        bottom: 54px;
        display: none;
        flex-direction: column;
        width: min(390px, calc(100vw - 28px));
        max-height: min(78vh, 600px);
        overflow: hidden;
        border: 1px solid #e5e7eb;
        border-radius: 18px;
        background: #ffffff;
        box-shadow: 0 12px 35px rgba(0,0,0,.18);
      }

      #${ROOT_ID}.fk-help-open .fk-help-panel {
        display: flex;
      }

      #${ROOT_ID} .fk-help-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 15px;
        border-bottom: 1px solid #e5e7eb;
      }

      #${ROOT_ID} .fk-help-header strong {
        font-size: 16px;
      }

      #${ROOT_ID} .fk-help-close {
        width: 32px;
        height: 32px;
        border: 0;
        border-radius: 9px;
        background: #f3f4f6;
        color: #111827;
        font-size: 19px;
        cursor: pointer;
      }

      #${ROOT_ID} .fk-help-intro {
        padding: 13px 15px;
        background: #f9fafb;
        color: #4b5563;
        font-size: 12px;
        line-height: 1.6;
      }

      #${ROOT_ID} .fk-help-search {
        width: calc(100% - 30px);
        height: 42px;
        margin: 13px 15px 8px;
        padding: 0 12px;
        border: 1px solid #d1d5db;
        border-radius: 10px;
        outline: none;
        background: #ffffff;
        color: #111827;
        font-size: 13px;
      }

      #${ROOT_ID} .fk-help-categories {
        display: flex;
        gap: 7px;
        padding: 5px 15px 12px;
        overflow-x: auto;
      }

      #${ROOT_ID} .fk-help-category {
        flex-shrink: 0;
        padding: 7px 11px;
        border: 1px solid #e5e7eb;
        border-radius: 20px;
        background: #ffffff;
        color: #374151;
        font-size: 11px;
        cursor: pointer;
      }

      #${ROOT_ID} .fk-help-category.fk-active {
        background: #111827;
        border-color: #111827;
        color: #ffffff;
      }

      #${ROOT_ID} .fk-help-results {
        min-height: 100px;
        padding: 0 15px 15px;
        overflow-y: auto;
      }

      #${ROOT_ID} .fk-help-article {
        padding: 12px 0;
        border-bottom: 1px solid #f1f5f9;
      }

      #${ROOT_ID} .fk-help-question {
        width: 100%;
        padding: 0;
        border: 0;
        background: transparent;
        color: #111827;
        font-size: 12px;
        font-weight: 700;
        text-align: left;
        cursor: pointer;
      }

      #${ROOT_ID} .fk-help-answer {
        display: none;
        padding-top: 9px;
        color: #4b5563;
        font-size: 12px;
        line-height: 1.65;
      }

      #${ROOT_ID} .fk-help-article.fk-expanded .fk-help-answer {
        display: block;
      }

      #${ROOT_ID} .fk-help-tag {
        display: inline-block;
        margin-bottom: 6px;
        color: #6b7280;
        font-size: 10px;
      }

      #${ROOT_ID} .fk-help-empty {
        padding: 25px 10px;
        color: #6b7280;
        font-size: 12px;
        text-align: center;
      }

      #${ROOT_ID} .fk-help-footer {
        padding: 11px 15px;
        border-top: 1px solid #e5e7eb;
        color: #9ca3af;
        font-size: 10px;
        text-align: center;
      }

      @media (max-width: 480px) {
        #${ROOT_ID} {
          left: 10px;
          bottom: 68px;
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

  function getFilteredArticles() {
    const query = searchQuery.toLowerCase().trim();

    return ARTICLES.filter((article) => {
      const matchesCategory =
        activeCategory === "Semua" ||
        article.category === activeCategory;

      const searchable =
        (article.title + " " + article.content + " " +
          article.category).toLowerCase();

      const matchesQuery =
        !query || searchable.includes(query);

      return matchesCategory && matchesQuery;
    });
  }

  function renderArticles() {
    const results = root.querySelector(".fk-help-results");
    results.innerHTML = "";

    const articles = getFilteredArticles();

    if (!articles.length) {
      results.appendChild(
        createElement(
          "div",
          "fk-help-empty",
          "Artikel bantuan tidak ditemukan."
        )
      );

      return;
    }

    articles.forEach((article) => {
      const item = createElement("div", "fk-help-article");

      const tag = createElement(
        "div",
        "fk-help-tag",
        article.category
      );

      const question = createElement(
        "button",
        "fk-help-question",
        article.title
      );

      question.type = "button";
      question.setAttribute("aria-expanded", "false");

      const answer = createElement(
        "div",
        "fk-help-answer",
        article.content
      );

      question.addEventListener("click", () => {
        const expanded = item.classList.toggle("fk-expanded");

        question.setAttribute(
          "aria-expanded",
          String(expanded)
        );
      });

      item.append(tag, question, answer);
      results.appendChild(item);
    });
  }

  function renderCategories() {
    const container = root.querySelector(".fk-help-categories");
    container.innerHTML = "";

    CATEGORIES.forEach((category) => {
      const button = createElement(
        "button",
        "fk-help-category" +
          (activeCategory === category ? " fk-active" : ""),
        category
      );

      button.type = "button";

      button.addEventListener("click", () => {
        activeCategory = category;
        renderCategories();
        renderArticles();
      });

      container.appendChild(button);
    });
  }

  function createInterface() {
    root = document.createElement("div");
    root.id = ROOT_ID;

    const panel = createElement("div", "fk-help-panel");

    const header = createElement("div", "fk-help-header");

    header.appendChild(
      createElement("strong", "", "Pusat Bantuan")
    );

    const closeButton = createElement(
      "button",
      "fk-help-close",
      "×"
    );

    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Tutup bantuan");
    closeButton.addEventListener("click", close);

    header.appendChild(closeButton);

    const intro = createElement(
      "div",
      "fk-help-intro",
      "Temukan panduan dan jawaban untuk menggunakan FathKit."
    );

    const search = createElement("input", "fk-help-search");

    search.type = "search";
    search.placeholder = "Cari pertanyaan atau panduan...";
    search.setAttribute("aria-label", "Cari artikel bantuan");

    search.addEventListener("input", () => {
      searchQuery = search.value;
      renderArticles();
    });

    const categories = createElement(
      "div",
      "fk-help-categories"
    );

    const results = createElement(
      "div",
      "fk-help-results"
    );

    const footer = createElement(
      "div",
      "fk-help-footer",
      "FathKit — Everyday Tools, All in One Place."
    );

    panel.append(
      header,
      intro,
      search,
      categories,
      results,
      footer
    );

    const toggleButton = createElement(
      "button",
      "fk-help-toggle",
      "? Bantuan"
    );

    toggleButton.type = "button";
    toggleButton.setAttribute("aria-expanded", "false");
    toggleButton.addEventListener("click", toggle);

    root.append(panel, toggleButton);
    document.body.appendChild(root);

    renderCategories();
    renderArticles();
  }

  function open() {
    if (!root) return;

    isOpen = true;
    root.classList.add("fk-help-open");

    root.querySelector(".fk-help-toggle")
      .setAttribute("aria-expanded", "true");

    const search = root.querySelector(".fk-help-search");
    search.focus();
  }

  function close() {
    if (!root) return;

    isOpen = false;
    root.classList.remove("fk-help-open");

    root.querySelector(".fk-help-toggle")
      .setAttribute("aria-expanded", "false");
  }

  function toggle() {
    if (isOpen) close();
    else open();
  }

  function search(query) {
    searchQuery = String(query || "");

    if (!root) return [];

    root.querySelector(".fk-help-search").value = searchQuery;

    renderArticles();

    return getFilteredArticles();
  }

  function getArticles() {
    return ARTICLES.map((article) => ({ ...article }));
  }

  function init() {
    if (!document.body || !document.head) return;

    injectStyles();
    createInterface();

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });

    window.FATHKIT_HELP_CENTER = {
      open,
      close,
      toggle,
      search,
      getArticles,

      getStatus() {
        return {
          initialized: true,
          open: isOpen,
          totalArticles: ARTICLES.length,
          totalCategories: CATEGORIES.length - 1
        };
      }
    };

    console.log("[FathKit] Help Center initialized.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
      once: true
    });
  } else {
    init();
  }
})();