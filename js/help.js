
(function () {
  "use strict";

  const HELP_ITEMS = [
    {
      category: "Dasar penggunaan",
      question: "Apa itu FathKit?",
      answer: "FathKit adalah platform kumpulan tools digital dalam satu tempat untuk membantu pekerjaan, belajar, kreativitas, dan kebutuhan sehari-hari."
    },
    {
      category: "Dasar penggunaan",
      question: "Bagaimana cara menggunakan tools?",
      answer: "Cari tools melalui kolom pencarian atau pilih kategori. Buka tools yang diinginkan, masukkan informasi yang diminta, lalu jalankan fiturnya."
    },
    {
      category: "Dasar penggunaan",
      question: "Apakah FathKit bisa digunakan melalui HP?",
      answer: "FathKit dirancang agar dapat digunakan melalui browser HP maupun komputer. Tampilan dan kenyamanan penggunaan bergantung pada ukuran layar dan fitur masing-masing tools."
    },
    {
      category: "Akun",
      question: "Apakah saya harus membuat akun?",
      answer: "Tidak semua fitur memerlukan akun. Namun, beberapa fitur seperti sinkronisasi favorit dan riwayat antarperangkat memerlukan akun."
    },
    {
      category: "Akun",
      question: "Bagaimana cara mendaftar?",
      answer: "Pilih tombol Masuk, kemudian pilih Daftar. Masukkan nama, email, dan password sesuai petunjuk."
    },
    {
      category: "Akun",
      question: "Bagaimana cara mengubah nama profil?",
      answer: "Masuk ke akun, buka Dashboard Saya, ubah nama tampilan pada bagian Profil Pengguna, kemudian tekan Simpan Profil."
    },
    {
      category: "Favorit dan riwayat",
      question: "Apa fungsi favorit?",
      answer: "Favorit digunakan untuk menyimpan tools yang sering kamu gunakan agar lebih mudah ditemukan kembali."
    },
    {
      category: "Favorit dan riwayat",
      question: "Apa fungsi riwayat?",
      answer: "Riwayat mencatat tools yang pernah kamu gunakan sehingga kamu bisa melihat aktivitas penggunaan sebelumnya."
    },
    {
      category: "Favorit dan riwayat",
      question: "Apakah favorit dan riwayat tersimpan di akun?",
      answer: "Untuk pengguna yang masuk, FathKit dapat menyinkronkan data melalui Supabase. Pengguna tamu menggunakan penyimpanan lokal pada browser."
    },
    {
      category: "Paket layanan",
      question: "Apakah FathKit gratis?",
      answer: "FathKit dirancang menggunakan model Free dan Pro. Ketersediaan fitur dan batas penggunaan setiap paket akan mengikuti ketentuan yang diumumkan secara resmi."
    },
    {
      category: "Paket layanan",
      question: "Apa perbedaan Free dan Pro?",
      answer: "Paket Free ditujukan untuk penggunaan dasar. Paket Pro direncanakan menyediakan kemampuan tambahan dan batas penggunaan lebih tinggi. Fitur Pro hanya berlaku setelah benar-benar diaktifkan."
    },
    {
      category: "Keamanan",
      question: "Apakah password saya aman?",
      answer: "Autentikasi akun ditangani oleh Supabase. Jangan pernah membagikan password, kode verifikasi, atau informasi rahasia kepada orang lain."
    },
    {
      category: "Keamanan",
      question: "Mengapa data saya tidak muncul?",
      answer: "Periksa koneksi internet dan pastikan kamu masuk menggunakan akun yang benar. Data lokal juga dapat berbeda jika kamu menggunakan browser atau perangkat lain."
    }
  ];

  let isOpen = false;
  let activeCategory = "Semua";

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[character];
    });
  }

  function createHelpCenter() {
    if (document.getElementById("fkHelpOverlay")) return;

    const style = document.createElement("style");

    style.id = "fkHelpStyles";
    style.textContent = `
      #fkHelpOverlay {
        position:fixed;
        inset:0;
        z-index:99980;
        display:none;
        overflow-y:auto;
        padding:18px;
        background:rgba(0,0,0,.68);
        box-sizing:border-box;
      }

      #fkHelpPanel {
        width:100%;
        max-width:850px;
        margin:25px auto;
        padding:22px;
        box-sizing:border-box;
        border-radius:18px;
        background:var(--fk-card,#fff);
        color:var(--fk-text,#222);
        box-shadow:0 15px 50px rgba(0,0,0,.25);
      }

      .fk-help-search {
        width:100%;
        box-sizing:border-box;
        padding:13px;
        border:1px solid rgba(128,128,128,.35);
        border-radius:10px;
        margin:12px 0;
        background:transparent;
        color:inherit;
      }

      .fk-help-categories {
        display:flex;
        flex-wrap:wrap;
        gap:8px;
        margin:12px 0 20px;
      }

      .fk-help-category {
        padding:9px 13px;
        border:1px solid rgba(128,128,128,.35);
        border-radius:30px;
        background:transparent;
        color:inherit;
        cursor:pointer;
      }

      .fk-help-category.active {
        background:var(--fk-primary,#333);
        color:white;
      }

      .fk-help-item {
        border-bottom:1px solid rgba(128,128,128,.2);
      }

      .fk-help-question {
        width:100%;
        padding:15px 2px;
        display:flex;
        justify-content:space-between;
        gap:12px;
        border:0;
        background:transparent;
        color:inherit;
        text-align:left;
        font-weight:600;
        cursor:pointer;
      }

      .fk-help-answer {
        display:none;
        padding:0 2px 16px;
        line-height:1.7;
        opacity:.85;
      }

      .fk-help-item.open .fk-help-answer {
        display:block;
      }

      .fk-help-empty {
        padding:20px 0;
        text-align:center;
        opacity:.7;
      }
    `;

    document.head.appendChild(style);

    const overlay = document.createElement("div");

    overlay.id = "fkHelpOverlay";

    overlay.innerHTML = `
      <main id="fkHelpPanel">
        <header style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:12px;
        ">
          <div>
            <h2 style="margin:0">Pusat Bantuan</h2>
            <p style="margin:6px 0;opacity:.7">
              Temukan jawaban dan panduan menggunakan FathKit.
            </p>
          </div>

          <button
            type="button"
            id="fkHelpClose"
            aria-label="Tutup pusat bantuan"
            style="
              font-size:26px;
              border:0;
              background:transparent;
              color:inherit;
              cursor:pointer;
            "
          >×</button>
        </header>

        <input
          id="fkHelpSearch"
          class="fk-help-search"
          type="search"
          placeholder="Cari pertanyaan atau panduan..."
          aria-label="Cari bantuan"
        >

        <nav
          id="fkHelpCategories"
          class="fk-help-categories"
          aria-label="Kategori bantuan"
        ></nav>

        <section id="fkHelpResults"></section>

        <footer style="
          margin-top:24px;
          padding-top:15px;
          border-top:1px solid rgba(128,128,128,.2);
        ">
          <strong>Masih membutuhkan bantuan?</strong>
          <p style="opacity:.75;line-height:1.6">
            Gunakan halaman atau kanal kontak resmi FathKit jika
            tersedia. Jangan mengirimkan password atau kode verifikasi.
          </p>
          <p style="font-size:12px;opacity:.6">
            FathKit — Everyday Tools, All in One Place.
          </p>
        </footer>
      </main>
    `;

    document.body.appendChild(overlay);

    document.getElementById("fkHelpClose")
      .addEventListener("click", close);

    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) close();
    });

    document.getElementById("fkHelpSearch")
      .addEventListener("input", render);

    renderCategories();
    render();
  }

  function getCategories() {
    return [
      "Semua",
      ...new Set(HELP_ITEMS.map(function (item) {
        return item.category;
      }))
    ];
  }

  function renderCategories() {
    const container = document.getElementById("fkHelpCategories");

    if (!container) return;

    container.innerHTML = getCategories().map(function (category) {
      return `
        <button
          type="button"
          class="fk-help-category ${category === activeCategory ? "active" : ""}"
          data-help-category="${escapeHTML(category)}"
        >${escapeHTML(category)}</button>
      `;
    }).join("");

    container.querySelectorAll("[data-help-category]")
      .forEach(function (button) {
        button.addEventListener("click", function () {
          activeCategory = button.dataset.helpCategory;
          renderCategories();
          render();
        });
      });
  }

  function render() {
    const container = document.getElementById("fkHelpResults");

    if (!container) return;

    const search = document
      .getElementById("fkHelpSearch")
      .value
      .trim()
      .toLowerCase();

    const results = HELP_ITEMS.filter(function (item) {
      const matchesCategory =
        activeCategory === "Semua" ||
        item.category === activeCategory;

      const matchesSearch =
        !search ||
        item.question.toLowerCase().includes(search) ||
        item.answer.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search);

      return matchesCategory && matchesSearch;
    });

    if (!results.length) {
      container.innerHTML = `
        <div class="fk-help-empty">
          Tidak ditemukan pertanyaan yang cocok.
        </div>
      `;
      return;
    }

    container.innerHTML = results.map(function (item, index) {
      return `
        <article class="fk-help-item">
          <button
            type="button"
            class="fk-help-question"
            aria-expanded="false"
            data-help-index="${index}"
          >
            <span>${escapeHTML(item.question)}</span>
            <span aria-hidden="true">＋</span>
          </button>

          <div class="fk-help-answer">
            ${escapeHTML(item.answer)}
          </div>
        </article>
      `;
    }).join("");

    container.querySelectorAll("[data-help-index]")
      .forEach(function (button) {
        button.addEventListener("click", function () {
          const article = button.closest(".fk-help-item");
          const wasOpen = article.classList.contains("open");

          article.classList.toggle("open", !wasOpen);
          button.setAttribute("aria-expanded", String(!wasOpen));

          button.querySelector("span:last-child").textContent =
            wasOpen ? "＋" : "−";
        });
      });
  }

  function open() {
    createHelpCenter();

    document.getElementById("fkHelpOverlay").style.display = "block";
    document.body.style.overflow = "hidden";

    isOpen = true;

    document.getElementById("fkHelpSearch").focus();
  }

  function close() {
    const overlay = document.getElementById("fkHelpOverlay");

    if (overlay) {
      overlay.style.display = "none";
    }

    document.body.style.overflow = "";
    isOpen = false;
  }

  window.FATHKIT_HELP = {
    open: open,
    close: close,
    getQuestions: function () {
      return HELP_ITEMS.map(function (item) {
        return { ...item };
      });
    }
  };

  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && isOpen) {
      close();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createHelpCenter, {
      once: true
    });
  } else {
    createHelpCenter();
  }
})();
