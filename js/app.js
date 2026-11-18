(() => {
  "use strict";

  /* =========================================
     FATHKIT MAIN APPLICATION
     32 TOOLS + SMART SEARCH + CATALOG INTEGRATION
     ========================================= */

  const categories = window.FATHKIT_CATEGORIES || [];
  const tools = window.FATHKIT_CATALOG
    ? window.FATHKIT_CATALOG.getAll()
    : (window.FATHKIT_TOOLS || []);

  const $ = id => document.getElementById(id);

  const findElement = (...ids) => {
    for (const id of ids) {
      const element = $(id);
      if (element) return element;
    }
    return null;
  };

  const categoryContainer = findElement("categoryList", "categoryGrid");
  const searchInput = findElement("searchInput", "toolSearch");
  const emptyMessage = findElement("emptyMessage", "emptyState");
  const toolGrid = $("toolGrid");
  const modal = $("toolModal");
  const toolContent = $("toolContent");

  let activeCategory = "Semua";
  let activeTool = null;
  let searchClearButton = null;

  /* =========================================
     UTILITIES
     ========================================= */

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function notify(message) {
    const toast = $("toast");

    if (!toast) {
      console.log(message);
      return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(notify.timer);

    notify.timer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  }

  function getLoggedInUser() {
    return window.FATHKIT_CURRENT_USER || null;
  }

  function getToolName(id) {
    const tool = tools.find(item => item.id === id);
    return tool ? tool.name : id;
  }

  function normalizeSearch(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function getSearchText(tool) {
    return normalizeSearch([
      tool.name,
      tool.description,
      tool.category,
      tool.id,
      ...(Array.isArray(tool.tags) ? tool.tags : [])
    ].join(" "));
  }

  function getFilteredTools() {
    const query = normalizeSearch(
      searchInput ? searchInput.value : ""
    );

    return tools.filter(tool => {
      const categoryMatch =
        activeCategory === "Semua" ||
        tool.category === activeCategory;

      const searchMatch =
        !query || getSearchText(tool).includes(query);

      return categoryMatch && searchMatch;
    });
  }

  /* =========================================
     SEARCH INTERFACE
     ========================================= */

  function createSearchClearButton() {
    if (!searchInput || searchClearButton) return;

    const wrapper = searchInput.parentElement;

    if (!wrapper) return;

    searchClearButton = document.createElement("button");
    searchClearButton.type = "button";
    searchClearButton.id = "fkSearchClear";
    searchClearButton.className = "fk-search-clear";
    searchClearButton.textContent = "×";
    searchClearButton.setAttribute("aria-label", "Hapus pencarian");
    searchClearButton.hidden = true;

    wrapper.appendChild(searchClearButton);

    searchClearButton.addEventListener("click", () => {
      searchInput.value = "";
      searchInput.focus();
      renderTools();
    });

    if (!document.getElementById("fkSearchStyles")) {
      const style = document.createElement("style");
      style.id = "fkSearchStyles";

      style.textContent = `
        .fk-search-clear {
          border: 0;
          background: transparent;
          color: inherit;
          font-size: 23px;
          line-height: 1;
          padding: 4px 9px;
          cursor: pointer;
          border-radius: 8px;
        }

        .fk-search-clear[hidden] {
          display: none;
        }

        .fk-search-clear:hover {
          background: rgba(128,128,128,.12);
        }

        .fk-search-status {
          margin: 12px 0;
          color: var(--fk-muted, #64748b);
          font-size: 13px;
        }

        .fk-search-hint {
          margin-top: 5px;
          color: var(--fk-muted, #64748b);
          font-size: 12px;
        }

        .fk-tool-toolbar {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 12px;
        }

        .fk-favorite-button.active {
          font-weight: 700;
        }

        .tool-card {
          position: relative;
          text-align: left;
          cursor: pointer;
        }

        .tool-card .tool-open {
          display: inline-block;
          margin-top: 10px;
          font-size: 13px;
          font-weight: 700;
        }

        .tool-card .fk-card-category {
          display: inline-block;
          margin-top: 8px;
          font-size: 11px;
          opacity: .7;
        }
      `;

      document.head.appendChild(style);
    }
  }

  function updateSearchStatus(count) {
    let status = $("fkSearchStatus");

    if (!status && toolGrid) {
      status = document.createElement("p");
      status.id = "fkSearchStatus";
      status.className = "fk-search-status";
      toolGrid.parentElement.insertBefore(status, toolGrid);
    }

    if (!status) return;

    const query = searchInput
      ? searchInput.value.trim()
      : "";

    status.textContent = query
      ? `${count} tools ditemukan untuk "${query}".`
      : `${count} tools tersedia dalam kategori ini.`;

    if (searchClearButton) {
      searchClearButton.hidden = !query;
    }
  }

  /* =========================================
     CATEGORIES
     ========================================= */

  function renderCategories() {
    if (!categoryContainer) return;

    const allCategories = categories.length
      ? categories
      : ["Semua"];

    categoryContainer.innerHTML = allCategories.map(category => {
      const categoryName = typeof category === "string"
        ? category
        : category.name || category.title || category.id;

      const count = tools.filter(tool =>
        tool.category === categoryName
      ).length;

      return `
        <button
          class="category-button ${categoryName === activeCategory ? "active" : ""}"
          data-category="${escapeHTML(categoryName)}"
          type="button"
          aria-pressed="${categoryName === activeCategory}"
        >
          ${escapeHTML(categoryName)}
          ${categoryName === "Semua" ? "" : `<small>(${count})</small>`}
        </button>
      `;
    }).join("");
  }

  /* =========================================
     TOOL LIST
     ========================================= */

  function renderTools() {
    if (!toolGrid) return;

    const filtered = getFilteredTools();

    toolGrid.innerHTML = filtered.map(tool => `
      <button
        class="tool-card"
        data-tool="${escapeHTML(tool.id)}"
        type="button"
        aria-label="Lihat detail ${escapeHTML(tool.name)}"
      >
        <span class="tool-icon">${escapeHTML(tool.icon || "🧰")}</span>

        <strong>${escapeHTML(tool.name)}</strong>

        <small>${escapeHTML(tool.description || "")}</small>

        <span class="fk-card-category">
          ${escapeHTML(tool.category || "Lainnya")}
        </span>

        <span class="tool-open">Lihat detail →</span>
      </button>
    `).join("");

    if (emptyMessage) {
      emptyMessage.hidden = filtered.length > 0;
      emptyMessage.classList.toggle("show", filtered.length === 0);

      if (filtered.length === 0) {
        emptyMessage.textContent =
          "Tools tidak ditemukan. Coba kata kunci atau kategori lain.";
      }
    }

    updateSearchStatus(filtered.length);
  }

  function resetFilters() {
    activeCategory = "Semua";

    if (searchInput) {
      searchInput.value = "";
    }

    renderCategories();
    renderTools();
  }

  /* =========================================
     FORM BUILDERS
     ========================================= */

  function field(label, id, placeholder = "", type = "text") {
    return `
      <div class="tool-form-field">
        <label for="${id}">${label}</label>
        <input
          id="${id}"
          type="${type}"
          placeholder="${escapeHTML(placeholder)}"
        >
      </div>
    `;
  }

  function area(label, id, placeholder = "Masukkan teks di sini...") {
    return `
      <div class="tool-form-field">
        <label for="${id}">${label}</label>
        <textarea
          id="${id}"
          placeholder="${escapeHTML(placeholder)}"
        ></textarea>
      </div>
    `;
  }

  function selectField(label, id, options) {
    return `
      <div class="tool-form-field">
        <label for="${id}">${label}</label>
        <select id="${id}">
          ${options.map(option => `
            <option value="${escapeHTML(option.value)}">
              ${escapeHTML(option.label)}
            </option>
          `).join("")}
        </select>
      </div>
    `;
  }

  function action() {
    return `
      <button class="tool-action" id="runTool" type="button">
        Jalankan alat
      </button>
    `;
  }

  function result() {
    return `
      <div class="tool-result" id="toolResult">
        Hasil akan muncul di sini.
      </div>
    `;
  }

  function output(value) {
    const resultElement = $("toolResult");

    if (resultElement) {
      resultElement.textContent = String(value);
    }
  }

  /* =========================================
     MODAL
     ========================================= */

  function openModal(title, content) {
    if (!modal || !toolContent) return;

    const titleElement = $("modalTitle");

    if (titleElement) {
      titleElement.textContent = title;
    }

    toolContent.innerHTML = `
      <div class="fk-tool-toolbar">
        <button
          type="button"
          id="favoriteTool"
          class="fk-favorite-button"
        >
          ☆ Simpan Favorit
        </button>
      </div>
      ${content}
    `;

    modal.hidden = false;
    modal.style.display = "flex";
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");

    updateFavoriteButton();
  }

  function closeModal() {
    if (!modal) return;

    modal.classList.remove("show", "active");
    modal.setAttribute("aria-hidden", "true");
    modal.style.display = "none";
    modal.hidden = true;

    activeTool = null;
  }

  /* =========================================
     FAVORITES
     ========================================= */

  async function updateFavoriteButton() {
    const button = $("favoriteTool");

    if (!button || !activeTool) return;

    if (!getLoggedInUser()) {
      button.textContent = "☆ Simpan Favorit";
      button.classList.remove("active");
      return;
    }

    if (!window.FATHKIT_FAVORITES) {
      button.textContent = "☆ Simpan Favorit";
      return;
    }

    try {
      const favorite =
        window.FATHKIT_FAVORITES.isFavorite(activeTool);

      button.textContent = favorite
        ? "★ Hapus dari Favorit"
        : "☆ Simpan Favorit";

      button.classList.toggle("active", favorite);
    } catch (error) {
      console.error("Favorite status:", error);
    }
  }

  async function toggleFavorite() {
    if (!getLoggedInUser()) {
      notify("Silakan login untuk menyimpan favorit.");

      if (window.FATHKIT_AUTH) {
        window.FATHKIT_AUTH.open("login");
      }

      return;
    }

    if (!window.FATHKIT_FAVORITES || !activeTool) {
      notify("Sistem favorit belum siap.");
      return;
    }

    const button = $("favoriteTool");

    if (button) button.disabled = true;

    try {
      const exists =
        window.FATHKIT_FAVORITES.isFavorite(activeTool);

      let success;

      if (exists) {
        success = await window.FATHKIT_FAVORITES.remove(activeTool);

        if (!success) {
          throw new Error("Gagal menghapus favorit dari database.");
        }

        notify("Dihapus dari favorit.");
      } else {
        success = await window.FATHKIT_FAVORITES.add(activeTool);

        if (!success) {
          throw new Error("Gagal menyimpan favorit ke database.");
        }

        notify("Berhasil disimpan ke favorit.");
      }

      await updateFavoriteButton();

    } catch (error) {
      console.error(error);
      notify(error.message || "Gagal mengubah favorit.");
    } finally {
      if (button) button.disabled = false;
    }
  }

  /* =========================================
     HISTORY
     ========================================= */

  async function recordHistory(id) {
    if (!getLoggedInUser()) return;

    if (!window.FATHKIT_HISTORY) return;

    try {
      await window.FATHKIT_HISTORY.record(
        id,
        getToolName(id)
      );
    } catch (error) {
      console.error("FathKit history error:", error);
    }
  }

  /* =========================================
     TOOL INTERFACES
     ========================================= */

  function toolInterface(id) {
    const formats = selectField("Format teks", "formatType", [
      { value: "upper", label: "HURUF BESAR" },
      { value: "lower", label: "huruf kecil" },
      { value: "title", label: "Huruf Kapital Setiap Kata" },
      { value: "sentence", label: "Huruf awal kalimat" }
    ]);

    const interfaces = {
      calc: field("Operasi matematika", "calcInput", "Contoh: (25 + 15) * 2"),

      words: area("Teks", "wordsInput"),

      format: area("Teks", "textInput") + formats,

      case: area("Teks", "textInput") + formats,

      compress:
        `<div class="tool-form-field">
          <label for="imageFile">Pilih gambar</label>
          <input id="imageFile" type="file" accept="image/*">
        </div>` +
        field("Kualitas JPG (0.1–1)", "quality", "0.7", "number"),

      resize:
        `<div class="tool-form-field">
          <label for="imageFile">Pilih gambar</label>
          <input id="imageFile" type="file" accept="image/*">
        </div>` +
        field("Lebar baru (px)", "newWidth", "800", "number") +
        field("Tinggi baru (px)", "newHeight", "600", "number"),

      password:
        field("Panjang password", "passLength", "16", "number") +
        `<div class="tool-form-field">
          <label class="tool-checkbox">
            <input type="checkbox" id="passSymbols" checked>
            Gunakan simbol
          </label>
        </div>`,

      unit:
        selectField("Jenis konversi", "unitType", [
          { value: "length", label: "Meter ke kilometer" },
          { value: "weight", label: "Kilogram ke gram" },
          { value: "temp", label: "Celsius ke Fahrenheit" }
        ]) +
        field("Nilai", "unitValue", "Masukkan angka", "number"),

      profit:
        field("Harga jual per produk (Rp)", "sellPrice", "50000", "number") +
        field("Modal per produk (Rp)", "costPrice", "30000", "number") +
        field("Jumlah terjual", "quantity", "10", "number"),

      json: area("JSON", "jsonInput", '{"nama":"FathKit","aktif":true}'),

      base64:
        area("Teks input", "baseInput") +
        selectField("Mode", "baseMode", [
          { value: "encode", label: "Encode ke Base64" },
          { value: "decode", label: "Decode dari Base64" }
        ]),

      url:
        area("Teks atau URL", "urlInput") +
        selectField("Mode", "urlMode", [
          { value: "encode", label: "Encode URL" },
          { value: "decode", label: "Decode URL" }
        ]),

      percent:
        field("Nilai awal", "percentValue", "200", "number") +
        field("Persentase (%)", "percentRate", "15", "number"),

      random:
        field("Angka minimum", "randomMin", "1", "number") +
        field("Angka maksimum", "randomMax", "100", "number"),

      date:
        field("Tanggal pertama", "date1", "", "date") +
        field("Tanggal kedua", "date2", "", "date"),

      bmi:
        field("Berat badan (kg)", "bmiWeight", "60", "number") +
        field("Tinggi badan (cm)", "bmiHeight", "165", "number"),

      duplicates: area("Daftar baris teks", "duplicateInput"),

      sort:
        area("Daftar baris teks", "sortInput") +
        selectField("Urutan", "sortType", [
          { value: "asc", label: "A sampai Z" },
          { value: "desc", label: "Z sampai A" }
        ]),

      replace:
        area("Teks utama", "replaceInput") +
        field("Cari kata/frasa", "findText") +
        field("Ganti dengan", "replaceText"),

      slug: field("Judul halaman atau artikel", "slugInput", "Contoh: Cara Membuat Website"),

      reading:
        area("Teks yang akan dibaca", "readingInput") +
        field("Kecepatan membaca (kata/menit)", "readingSpeed", "200", "number"),

      html: area("Teks HTML atau karakter", "htmlInput"),

      reverse: area("Teks", "reverseInput"),

      choice:
        area("Daftar pilihan (satu per baris)", "choiceInput",
          "Makan nasi goreng\nMakan bakso\nMakan soto"),

      whitespace: area("Teks yang ingin dirapikan", "whitespaceInput"),

      linecount: area("Teks yang ingin dihitung", "linecountInput"),

      wordfreq: area("Teks untuk dianalisis", "wordfreqInput"),

      htmldecode: area("HTML encoded", "htmldecodeInput", "&lt;h1&gt;Halo&lt;/h1&gt;"),

      jsonmin: area("JSON", "jsonminInput", '{"nama":"FathKit","aktif":true}'),

      csvjson:
        area("Data CSV", "csvInput",
          "nama,umur,kota\nAndi,18,Jepara\nBudi,20,Jakarta") +
        `<p class="tool-note">
          Gunakan baris pertama sebagai nama kolom.
          Pisahkan kolom dengan koma.
          Nilai yang mengandung koma harus diapit tanda kutip.
        </p>`,

      textdiff:
        area("Teks pertama", "diffA") +
        area("Teks kedua", "diffB"),

      textclean:
        area("Teks yang ingin dibersihkan", "cleanInput") +
        `<div class="tool-form-field">
          <label class="tool-checkbox">
            <input type="checkbox" id="cleanBlank" checked>
            Hapus baris kosong
          </label>
          <label class="tool-checkbox">
            <input type="checkbox" id="cleanSpaces" checked>
            Rapikan spasi berlebih
          </label>
          <label class="tool-checkbox">
            <input type="checkbox" id="cleanTrim" checked>
            Hapus spasi di awal dan akhir baris
          </label>
        </div>`
    };

    return interfaces[id] || `
      <p>Antarmuka untuk alat ini belum tersedia.</p>
    `;
  }

  /* =========================================
     OPEN TOOL
     ========================================= */

  function openTool(id) {
    const tool = tools.find(item => item.id === id);

    if (!tool) {
      notify("Tools tidak ditemukan.");
      return;
    }

    activeTool = id;

    openModal(
      tool.name,
      toolInterface(id) + action() + result()
    );

    const runButton = $("runTool");

    if (runButton) {
      runButton.addEventListener("click", async () => {
        runButton.disabled = true;
        runButton.textContent = "Memproses...";

        try {
          const before = $("toolResult")
            ? $("toolResult").textContent
            : "";

          await runTool(id);

          const after = $("toolResult")
            ? $("toolResult").textContent
            : "";

          if (after !== before || after !== "Hasil akan muncul di sini.") {
            await recordHistory(id);
          }
        } catch (error) {
          console.error(error);
          output(error.message || "Terjadi kesalahan saat menjalankan alat.");
        } finally {
          if (runButton.isConnected) {
            runButton.disabled = false;
            runButton.textContent = "Jalankan alat";
          }
        }
      });
    }

    const favoriteButton = $("favoriteTool");

    if (favoriteButton) {
      favoriteButton.addEventListener("click", toggleFavorite);
    }
  }

  /* =========================================
     OPEN TOOL DETAILS
     ========================================= */

  function openToolDetails(id) {
    if (window.FATHKIT_TOOL_DETAILS) {
      const opened = window.FATHKIT_TOOL_DETAILS.open(id);

      if (opened) return;
    }

    // Fallback jika sistem detail belum tersedia.
    openTool(id);
  }

  /* =========================================
     BASIC HELPERS
     ========================================= */

  function number(id) {
    const element = $(id);
    return element ? Number(element.value) : NaN;
  }

  /* =========================================
     SAFE CALCULATOR
     ========================================= */

  function calculate() {
    try {
      const expression = $("calcInput").value.trim();

      if (!expression || expression.length > 150) {
        throw new Error();
      }

      const tokens = expression.match(
        /\d+(?:\.\d+)?|[()+\-*/%]/g
      );

      if (!tokens || tokens.join("") !== expression.replace(/\s/g, "")) {
        throw new Error();
      }

      let position = 0;

      function parseExpression() {
        let value = parseTerm();

        while (tokens[position] === "+" || tokens[position] === "-") {
          const operator = tokens[position++];
          const right = parseTerm();

          value = operator === "+"
            ? value + right
            : value - right;
        }

        return value;
      }

      function parseTerm() {
        let value = parseUnary();

        while (["*", "/", "%"].includes(tokens[position])) {
          const operator = tokens[position++];
          const right = parseUnary();

          if ((operator === "/" || operator === "%") && right === 0) {
            throw new Error();
          }

          if (operator === "*") value *= right;
          if (operator === "/") value /= right;
          if (operator === "%") value %= right;
        }

        return value;
      }

      function parseUnary() {
        if (tokens[position] === "+") {
          position++;
          return parseUnary();
        }

        if (tokens[position] === "-") {
          position++;
          return -parseUnary();
        }

        return parsePrimary();
      }

      function parsePrimary() {
        if (tokens[position] === "(") {
          position++;
          const value = parseExpression();

          if (tokens[position] !== ")") throw new Error();

          position++;
          return value;
        }

        const token = tokens[position++];

        if (!token || !/^\d+(?:\.\d+)?$/.test(token)) {
          throw new Error();
        }

        return Number(token);
      }

      const answer = parseExpression();

      if (position !== tokens.length || !Number.isFinite(answer)) {
        throw new Error();
      }

      output(answer);

    } catch {
      output("Operasi tidak valid. Periksa kembali perhitunganmu.");
    }
  }

  function countWords() {
    const text = $("wordsInput").value;

    output(
      `Jumlah kata: ${text.trim() ? text.trim().split(/\s+/).length : 0}\n` +
      `Jumlah karakter: ${text.length}\n` +
      `Karakter tanpa spasi: ${text.replace(/\s/g, "").length}\n` +
      `Jumlah kalimat: ${text.trim() ? text.split(/[.!?]+/).filter(x => x.trim()).length : 0}`
    );
  }

  function formatText() {
    const text = $("textInput").value;
    const type = $("formatType").value;
    let answer = text;

    if (type === "upper") answer = text.toUpperCase();
    if (type === "lower") answer = text.toLowerCase();

    if (type === "title") {
      answer = text.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    }

    if (type === "sentence") {
      answer = text.toLowerCase().replace(
        /(^\s*\w|[.!?]\s*\w)/g,
        c => c.toUpperCase()
      );
    }

    output(answer);
  }

  function makePassword() {
    const length = Math.max(
      4,
      Math.min(128, number("passLength") || 16)
    );

    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789" +
      ($("passSymbols").checked ? "!@#$%&*_-+=" : "");

    const random = new Uint32Array(length);
    crypto.getRandomValues(random);

    output(
      Array.from(random, value => chars[value % chars.length]).join("")
    );
  }

  function convertUnit() {
    const value = number("unitValue");

    if (!Number.isFinite(value)) {
      return output("Masukkan angka yang valid.");
    }

    const type = $("unitType").value;

    if (type === "length") {
      output(`${value} meter = ${value / 1000} kilometer`);
    }

    if (type === "weight") {
      output(`${value} kilogram = ${value * 1000} gram`);
    }

    if (type === "temp") {
      output(`${value}°C = ${(value * 9 / 5 + 32).toFixed(2)}°F`);
    }
  }

  function calculateProfit() {
    const sell = number("sellPrice");
    const cost = number("costPrice");
    const quantity = number("quantity");

    if (![sell, cost, quantity].every(Number.isFinite) || quantity < 0) {
      return output("Periksa angka yang dimasukkan.");
    }

    const revenue = sell * quantity;
    const capital = cost * quantity;
    const profit = revenue - capital;

    output(
      `Total penjualan: Rp ${revenue.toLocaleString("id-ID")}\n` +
      `Total modal: Rp ${capital.toLocaleString("id-ID")}\n` +
      `Keuntungan: Rp ${profit.toLocaleString("id-ID")}\n` +
      `Margin: ${revenue ? (profit / revenue * 100).toFixed(2) : 0}%`
    );
  }

  function formatJSON() {
    try {
      output(JSON.stringify(JSON.parse($("jsonInput").value), null, 2));
    } catch {
      output("JSON tidak valid. Periksa tanda kurung, koma, dan tanda kutip.");
    }
  }

  function processBase64() {
    try {
      const text = $("baseInput").value;

      output(
        $("baseMode").value === "encode"
          ? btoa(unescape(encodeURIComponent(text)))
          : decodeURIComponent(escape(atob(text.trim())))
      );

    } catch {
      output("Tidak dapat memproses input Base64.");
    }
  }

  function processURL() {
    try {
      const text = $("urlInput").value;

      output(
        $("urlMode").value === "encode"
          ? encodeURIComponent(text)
          : decodeURIComponent(text)
      );

    } catch {
      output("Format URL tidak valid.");
    }
  }

  function calculatePercent() {
    const value = number("percentValue");
    const rate = number("percentRate");

    if (!Number.isFinite(value) || !Number.isFinite(rate)) {
      return output("Masukkan angka valid.");
    }

    output(
      `${rate}% dari ${value} = ${value * rate / 100}\n` +
      `Nilai setelah ditambahkan = ${value + value * rate / 100}`
    );
  }

  function randomNumber() {
    const min = number("randomMin");
    const max = number("randomMax");

    if (
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
      min > max ||
      max - min > 4294967295
    ) {
      return output("Masukkan rentang bilangan bulat yang benar.");
    }

    const random = new Uint32Array(1);
    crypto.getRandomValues(random);

    output(
      Math.floor(random[0] / 4294967296 * (max - min + 1)) + min
    );
  }

  function dateDifference() {
    const first = $("date1").value;
    const second = $("date2").value;

    if (!first || !second) {
      return output("Pilih kedua tanggal.");
    }

    const a = new Date(first + "T00:00:00");
    const b = new Date(second + "T00:00:00");

    output(`${Math.round(Math.abs(b - a) / 86400000)} hari`);
  }

  function calculateBMI() {
    const weight = number("bmiWeight");
    const height = number("bmiHeight") / 100;

    if (
      weight <= 0 ||
      height <= 0 ||
      !Number.isFinite(weight) ||
      !Number.isFinite(height)
    ) {
      return output("Masukkan berat dan tinggi yang valid.");
    }

    output(
      `BMI: ${(weight / (height * height)).toFixed(1)}\n` +
      "Catatan: BMI adalah alat skrining, bukan diagnosis. " +
      "Untuk anak dan remaja, interpretasi memerlukan acuan usia dan jenis kelamin."
    );
  }

  function removeDuplicates() {
    const lines = $("duplicateInput").value.split(/\r?\n/);
    const unique = [...new Set(lines)];

    output(
      `Baris awal: ${lines.length}\n` +
      `Baris setelah duplikat dihapus: ${unique.length}\n\n` +
      unique.join("\n")
    );
  }

  function sortLines() {
    const lines = $("sortInput").value.split(/\r?\n/);

    lines.sort((a, b) => a.localeCompare(b, "id", {
      sensitivity: "base"
    }));

    if ($("sortType").value === "desc") lines.reverse();

    output(lines.join("\n"));
  }

  function replaceWords() {
    const text = $("replaceInput").value;
    const find = $("findText").value;

    if (!find) {
      return output("Masukkan kata atau frasa yang ingin dicari.");
    }

    output(text.split(find).join($("replaceText").value));
  }

  function makeSlug() {
    const slug = $("slugInput").value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    output(slug || "Masukkan judul terlebih dahulu.");
  }

  function readingTime() {
    const text = $("readingInput").value;
    const speed = number("readingSpeed");

    if (speed <= 0 || !Number.isFinite(speed)) {
      return output("Kecepatan membaca harus lebih dari nol.");
    }

    const count = text.trim() ? text.trim().split(/\s+/).length : 0;
    const minutes = count / speed;

    output(
      `Jumlah kata: ${count}\n` +
      `Perkiraan waktu: ${
        minutes < 1
          ? Math.max(1, Math.ceil(minutes * 60)) + " detik"
          : Math.ceil(minutes) + " menit"
      }`
    );
  }

  function encodeHTML() {
    const text = $("htmlInput").value;

    output(
      text.replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[char])
    );
  }

  function reverseText() {
    output([...$("reverseInput").value].reverse().join(""));
  }

  function chooseRandom() {
    const items = $("choiceInput").value
      .split(/\r?\n/)
      .map(x => x.trim())
      .filter(Boolean);

    if (!items.length) {
      return output("Masukkan minimal satu pilihan.");
    }

    const random = new Uint32Array(1);
    crypto.getRandomValues(random);

    output(
      "Pilihan terpilih:\n🎯 " +
      items[Math.floor(random[0] / 4294967296 * items.length)]
    );
  }

  /* =========================================
     ADDITIONAL TEXT TOOLS
     ========================================= */

  function removeWhitespace() {
    const text = $("whitespaceInput").value;

    const cleaned = text
      .split(/\r?\n/)
      .map(line => line.replace(/[ \t]+/g, " ").trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n");

    output(cleaned);
  }

  function countLines() {
    const text = $("linecountInput").value;
    const lines = text.split(/\r?\n/);
    const filled = lines.filter(line => line.trim().length > 0);

    output(
      `Jumlah baris total: ${lines.length}\n` +
      `Baris terisi: ${filled.length}\n` +
      `Baris kosong: ${lines.length - filled.length}\n` +
      `Jumlah karakter: ${text.length}`
    );
  }

  function wordFrequency() {
    const text = $("wordfreqInput").value.toLowerCase();
    const words = text.match(/[\p{L}\p{N}]+/gu) || [];

    if (!words.length) {
      return output("Tidak ada kata untuk dianalisis.");
    }

    const frequency = {};

    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    const sorted = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "id"))
      .slice(0, 30);

    output(
      `Total kata: ${words.length}\n` +
      `Kata unik: ${Object.keys(frequency).length}\n\n` +
      "30 kata paling sering muncul:\n" +
      sorted.map(([word, count], i) =>
        `${i + 1}. ${word}: ${count} kali`
      ).join("\n")
    );
  }

  function decodeHTML() {
    const text = $("htmldecodeInput").value;
    const element = document.createElement("textarea");

    element.innerHTML = text;

    output(element.value);
  }

  function minifyJSON() {
    try {
      output(JSON.stringify(JSON.parse($("jsonminInput").value)));
    } catch {
      output("JSON tidak valid. Periksa kembali format datanya.");
    }
  }

  function parseCSVLine(line) {
    const values = [];
    let value = "";
    let quoted = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (quoted && line[i + 1] === '"') {
          value += '"';
          i++;
        } else {
          quoted = !quoted;
        }
      } else if (char === "," && !quoted) {
        values.push(value);
        value = "";
      } else {
        value += char;
      }
    }

    if (quoted) {
      throw new Error("Ada tanda kutip CSV yang belum ditutup.");
    }

    values.push(value);

    return values;
  }

  function csvToJSON() {
    try {
      const lines = $("csvInput").value
        .split(/\r?\n/)
        .filter(line => line.trim() !== "");

      if (lines.length < 2) {
        return output("Masukkan CSV dengan judul dan minimal satu baris data.");
      }

      const headers = parseCSVLine(lines[0]).map(x => x.trim());

      if (headers.some(x => !x)) {
        return output("Nama kolom tidak boleh kosong.");
      }

      if (new Set(headers).size !== headers.length) {
        return output("Nama kolom tidak boleh duplikat.");
      }

      const data = lines.slice(1).map((line, index) => {
        const values = parseCSVLine(line);

        if (values.length !== headers.length) {
          throw new Error(
            `Jumlah kolom pada baris ${index + 2} tidak sesuai.`
          );
        }

        const object = {};

        headers.forEach((header, i) => {
          object[header] = values[i];
        });

        return object;
      });

      output(JSON.stringify(data, null, 2));

    } catch (error) {
      output(error.message || "CSV tidak dapat diproses.");
    }
  }

  function compareText() {
    const first = $("diffA").value.split(/\r?\n/);
    const second = $("diffB").value.split(/\r?\n/);

    const max = Math.max(first.length, second.length);
    const differences = [];

    for (let i = 0; i < max; i++) {
      const a = first[i] ?? "(tidak ada baris)";
      const b = second[i] ?? "(tidak ada baris)";

      if (a !== b) {
        differences.push(
          `Baris ${i + 1}:\nTeks 1: ${a}\nTeks 2: ${b}`
        );
      }
    }

    output(
      differences.length
        ? `Ditemukan ${differences.length} baris berbeda.\n\n${differences.join("\n\n")}`
        : "Kedua teks sama persis."
    );
  }

  function cleanText() {
    let lines = $("cleanInput").value.split(/\r?\n/);

    if ($("cleanTrim").checked) {
      lines = lines.map(line => line.trim());
    }

    if ($("cleanSpaces").checked) {
      lines = lines.map(line => line.replace(/[ \t]+/g, " "));
    }

    if ($("cleanBlank").checked) {
      lines = lines.filter(line => line.trim() !== "");
    }

    output(lines.join("\n"));
  }

  /* =========================================
     IMAGE TOOLS
     ========================================= */

  function loadImage() {
    return new Promise((resolve, reject) => {
      const file = $("imageFile").files[0];

      if (!file) {
        return reject(new Error("Pilih gambar terlebih dahulu."));
      }

      if (!file.type.startsWith("image/")) {
        return reject(new Error("File yang dipilih bukan gambar."));
      }

      const image = new Image();
      const url = URL.createObjectURL(file);

      image.onload = () => resolve({
        image,
        url,
        file
      });

      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Gambar tidak dapat dibuka."));
      };

      image.src = url;
    });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  async function compressImage() {
    let sourceURL;

    try {
      const data = await loadImage();
      sourceURL = data.url;

      const canvas = document.createElement("canvas");

      canvas.width = data.image.width;
      canvas.height = data.image.height;

      canvas.getContext("2d").drawImage(data.image, 0, 0);

      let quality = number("quality") || 0.7;
      quality = Math.max(0.1, Math.min(1, quality));

      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, "image/jpeg", quality);
      });

      URL.revokeObjectURL(sourceURL);

      if (!blob) {
        return output("Gagal mengompres gambar.");
      }

      downloadBlob(blob, "fathkit-compressed.jpg");

      output(
        `Selesai!\n` +
        `Ukuran awal: ${(data.file.size / 1024).toFixed(1)} KB\n` +
        `Ukuran baru: ${(blob.size / 1024).toFixed(1)} KB\n` +
        `File hasil sudah diunduh.`
      );

    } catch (error) {
      if (sourceURL) URL.revokeObjectURL(sourceURL);
      output(error.message);
    }
  }

  async function resizeImage() {
    let sourceURL;

    try {
      const data = await loadImage();
      sourceURL = data.url;

      const width = number("newWidth");
      const height = number("newHeight");

      if (
        !Number.isInteger(width) ||
        !Number.isInteger(height) ||
        width < 1 ||
        height < 1 ||
        width > 10000 ||
        height > 10000
      ) {
        URL.revokeObjectURL(sourceURL);

        return output(
          "Masukkan ukuran antara 1 sampai 10.000 px."
        );
      }

      const canvas = document.createElement("canvas");

      canvas.width = width;
      canvas.height = height;

      canvas.getContext("2d").drawImage(
        data.image,
        0,
        0,
        width,
        height
      );

      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, "image/png");
      });

      URL.revokeObjectURL(sourceURL);

      if (!blob) {
        return output("Gagal mengubah ukuran gambar.");
      }

      downloadBlob(blob, "fathkit-resized.png");

      output(
        `Selesai!\n` +
        `Ukuran baru: ${width} × ${height} px\n` +
        `File hasil sudah diunduh.`
      );

    } catch (error) {
      if (sourceURL) URL.revokeObjectURL(sourceURL);
      output(error.message);
    }
  }

  /* =========================================
     RUN TOOL
     ========================================= */

  async function runTool(id) {
    const actions = {
      calc: calculate,
      words: countWords,
      format: formatText,
      case: formatText,
      compress: compressImage,
      resize: resizeImage,
      password: makePassword,
      unit: convertUnit,
      profit: calculateProfit,
      json: formatJSON,
      base64: processBase64,
      url: processURL,
      percent: calculatePercent,
      random: randomNumber,
      date: dateDifference,
      bmi: calculateBMI,
      duplicates: removeDuplicates,
      sort: sortLines,
      replace: replaceWords,
      slug: makeSlug,
      reading: readingTime,
      html: encodeHTML,
      reverse: reverseText,
      choice: chooseRandom,
      whitespace: removeWhitespace,
      linecount: countLines,
      wordfreq: wordFrequency,
      htmldecode: decodeHTML,
      jsonmin: minifyJSON,
      csvjson: csvToJSON,
      textdiff: compareText,
      textclean: cleanText
    };

    if (actions[id]) {
      await actions[id]();
    } else {
      output("Fungsi untuk alat ini belum tersedia.");
    }
  }

  /* =========================================
     EVENT LISTENERS
     ========================================= */

  if (categoryContainer) {
    categoryContainer.addEventListener("click", event => {
      const button = event.target.closest("[data-category]");
      if (!button) return;

      activeCategory = button.dataset.category;

      renderCategories();
      renderTools();

      if (toolGrid) {
        toolGrid.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    });
  }

  if (toolGrid) {
    toolGrid.addEventListener("click", event => {
      const card = event.target.closest("[data-tool]");

      if (card) {
        openToolDetails(card.dataset.tool);
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", renderTools);
    createSearchClearButton();
  }

  const closeButton = $("closeModal");

  if (closeButton) {
    closeButton.addEventListener("click", closeModal);
  }

  if (modal) {
    modal.addEventListener("click", event => {
      if (event.target === modal) closeModal();
    });
  }

  document.addEventListener("keydown", event => {
    const target = event.target;
    const typing = target && (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    );

    if (event.key === "Escape") {
      closeModal();

      if (window.FATHKIT_TOOL_DETAILS) {
        window.FATHKIT_TOOL_DETAILS.close();
      }
    }

    if (
      event.key === "/" &&
      !typing &&
      searchInput
    ) {
      event.preventDefault();
      searchInput.focus();
    }
  });

  const startButton = $("startButton");

  if (startButton) {
    startButton.addEventListener("click", () => {
      const section = findElement("toolsSection", "toolGrid");

      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  const categoryButton = $("categoryButton");

  if (categoryButton && categoryContainer) {
    categoryButton.addEventListener("click", () => {
      categoryContainer.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    });
  }

  const menuButton = $("menuButton");

  if (menuButton) {
    menuButton.addEventListener("click", () => {
      const section = findElement("toolsSection", "toolGrid");

      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  /* =========================================
     COUNTERS
     ========================================= */

  const toolCount = $("toolCount");
  const categoryCount = $("categoryCount");

  if (toolCount) {
    toolCount.textContent = tools.length;
  }

  if (categoryCount) {
    categoryCount.textContent = Math.max(0, categories.length - 1);
  }

  /* =========================================
     AUTH EVENTS
     ========================================= */

  document.addEventListener("fathkit:auth-changed", () => {
    updateFavoriteButton();
  });

  document.addEventListener("fathkit:favorites-updated", () => {
    updateFavoriteButton();
  });

  /* =========================================
     CATALOG EVENTS
     ========================================= */

  window.addEventListener("fathkit:catalog-updated", () => {
    renderCategories();
    renderTools();
  });

  /* =========================================
     PUBLIC APPLICATION API
     ========================================= */

  window.FATHKIT_APP = {
    renderTools,
    renderCategories,
    openTool,
    openToolDetails,
    closeModal,
    notify,
    resetFilters,

    search: function (query) {
      if (!searchInput) return;

      searchInput.value = query || "";
      renderTools();
    },

    getTools: () => tools,
    getCategories: () => categories,
    getFilteredTools: getFilteredTools
  };

  /* =========================================
     INITIALIZATION
     ========================================= */

  renderCategories();
  renderTools();

  console.log(
    "FathKit siap:",
    tools.length,
    "tools dimuat."
  );

})();