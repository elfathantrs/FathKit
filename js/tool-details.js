
(function () {
  "use strict";

  const STATUS_LABELS = {
    active: "Tersedia",
    available: "Tersedia",
    beta: "Versi Beta",
    coming_soon: "Segera Hadir",
    comingsoon: "Segera Hadir",
    development: "Dalam Pengembangan",
    inactive: "Belum Aktif"
  };

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char];
    });
  }

  function getTool(toolId) {
    if (window.FATHKIT_CATALOG) {
      return window.FATHKIT_CATALOG.getById(toolId);
    }

    const tools = window.FATHKIT_TOOLS || [];

    return tools.find(function (tool) {
      return String(tool.id) === String(toolId);
    }) || null;
  }

  function getStatus(tool) {
    const raw = String(tool.status || "active")
      .toLowerCase()
      .replace(/[\s-]+/g, "_");

    return {
      key: raw,
      label: STATUS_LABELS[raw] || "Status belum ditentukan"
    };
  }

  function getModalElements() {
    return {
      modal: document.getElementById("toolModal"),
      title: document.getElementById("modalTitle"),
      content: document.getElementById("toolContent"),
      close: document.getElementById("closeModal")
    };
  }

  function renderDetails(tool) {
    const status = getStatus(tool);

    const tags = Array.isArray(tool.tags)
      ? tool.tags
      : [];

    const tagHTML = tags.length
      ? tags.map(function (tag) {
          return `
            <span style="
              display:inline-block;
              padding:6px 10px;
              margin:4px 4px 4px 0;
              border-radius:20px;
              background:rgba(128,128,128,.13);
              font-size:12px;
            ">${escapeHTML(tag)}</span>
          `;
        }).join("")
      : "<span>Belum ada tag.</span>";

    const description = tool.description ||
      "Belum ada deskripsi untuk tools ini.";

    const category = tool.category || "Lainnya";

    const isActive = [
      "active",
      "available"
    ].includes(status.key);

    return `
      <section class="fk-tool-details">

        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:12px;
          flex-wrap:wrap;
          margin-bottom:16px;
        ">
          <span style="
            padding:7px 12px;
            border-radius:20px;
            background:rgba(128,128,128,.15);
            font-size:13px;
          ">
            ${escapeHTML(category)}
          </span>

          <span style="
            font-size:13px;
            font-weight:600;
          ">
            ${escapeHTML(status.label)}
          </span>
        </div>

        <h3 style="margin:0 0 10px">
          ${escapeHTML(tool.name)}
        </h3>

        <p style="line-height:1.7;opacity:.85">
          ${escapeHTML(description)}
        </p>

        <div style="margin-top:22px">
          <h4>Informasi Tools</h4>

          <div style="
            display:grid;
            grid-template-columns:repeat(auto-fit,minmax(120px,1fr));
            gap:10px;
          ">
            <div style="
              padding:12px;
              border-radius:10px;
              background:rgba(128,128,128,.1);
            ">
              <div style="font-size:12px;opacity:.65">Kategori</div>
              <strong>${escapeHTML(category)}</strong>
            </div>

            <div style="
              padding:12px;
              border-radius:10px;
              background:rgba(128,128,128,.1);
            ">
              <div style="font-size:12px;opacity:.65">Status</div>
              <strong>${escapeHTML(status.label)}</strong>
            </div>
          </div>
        </div>

        <div style="margin-top:20px">
          <h4>Tag dan Kata Kunci</h4>
          <div>${tagHTML}</div>
        </div>

        <div style="margin-top:24px">
          <button
            type="button"
            id="fkToolStartButton"
            data-tool-id="${escapeHTML(tool.id)}"
            ${isActive ? "" : "disabled"}
            style="
              width:100%;
              padding:13px;
              border:0;
              border-radius:10px;
              cursor:${isActive ? "pointer" : "not-allowed"};
              opacity:${isActive ? "1" : ".55"};
              font-weight:700;
            "
          >
            ${isActive ? "Gunakan Tools" : "Belum Bisa Digunakan"}
          </button>
        </div>

      </section>
    `;
  }

  function open(toolId) {
    const tool = getTool(toolId);

    if (!tool) {
      console.warn("FathKit: tools tidak ditemukan:", toolId);
      return false;
    }

    const elements = getModalElements();

    if (!elements.modal || !elements.title || !elements.content) {
      console.error("FathKit: elemen modal tools tidak ditemukan.");
      return false;
    }

    elements.title.textContent = tool.name;
    elements.content.innerHTML = renderDetails(tool);

    elements.modal.hidden = false;
    elements.modal.style.display = "flex";
    elements.modal.classList.add("active");

    const startButton = document.getElementById("fkToolStartButton");

    if (startButton) {
      startButton.addEventListener("click", function () {
        if (startButton.disabled) return;

        const id = startButton.dataset.toolId;

        close();

        if (typeof window.FATHKIT_APP?.openTool === "function") {
          window.FATHKIT_APP.openTool(id);
          return;
        }

        window.dispatchEvent(
          new CustomEvent("fathkit:use-tool", {
            detail: { toolId: id }
          })
        );
      });
    }

    return true;
  }

  function close() {
    const elements = getModalElements();

    if (!elements.modal) return;

    elements.modal.classList.remove("active");
    elements.modal.style.display = "none";
    elements.modal.hidden = true;
  }

  window.FATHKIT_TOOL_DETAILS = {
    open: open,
    close: close,
    get: getTool
  };

  window.addEventListener("fathkit:open-tool-details", function (event) {
    const toolId = event.detail?.toolId;

    if (toolId) {
      open(toolId);
    }
  });

  document.addEventListener("click", function (event) {
    const button = event.target.closest("[data-tool-details]");

    if (!button) return;

    event.preventDefault();
    open(button.dataset.toolDetails);
  });

  const elements = getModalElements();

  if (elements.close) {
    elements.close.addEventListener("click", close);
  }
})();
