(function () {
  "use strict";

  let dashboardCreated = false;

  function getUser() {
    return window.FATHKIT_CURRENT_USER || null;
  }

  function getClient() {
    return window.FATHKIT_SUPABASE?.client || null;
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[character];
    });
  }

  function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) {
      alert(message);
      return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(function () {
      toast.classList.remove("show");
    }, 3000);
  }

  function createDashboard() {
    if (dashboardCreated) return;

    const overlay = document.createElement("div");

    overlay.id = "fkDashboardOverlay";

    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:99990",
      "display:none",
      "overflow-y:auto",
      "padding:20px",
      "background:rgba(0,0,0,.65)"
    ].join(";");

    overlay.innerHTML = `
      <section style="
        width:100%;
        max-width:760px;
        margin:30px auto;
        padding:24px;
        box-sizing:border-box;
        border-radius:18px;
        background:var(--fk-card,#fff);
        color:var(--fk-text,#222);
        box-shadow:0 15px 50px rgba(0,0,0,.25);
      ">
        <header style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          margin-bottom:22px;
        ">
          <div>
            <h2 style="margin:0">Dashboard Saya</h2>
            <p style="margin:5px 0 0;opacity:.7">
              Kelola akun dan aktivitas FathKit.
            </p>
          </div>

          <button
            type="button"
            id="fkDashboardClose"
            aria-label="Tutup dashboard"
            style="font-size:25px;border:0;background:transparent;cursor:pointer"
          >×</button>
        </header>

        <section style="
          padding:18px;
          border:1px solid rgba(128,128,128,.25);
          border-radius:14px;
          margin-bottom:18px;
        ">
          <h3 style="margin-top:0">Profil Pengguna</h3>

          <p id="fkProfileEmail" style="opacity:.7;overflow-wrap:anywhere"></p>

          <form id="fkProfileForm">
            <label for="fkProfileName">Nama tampilan</label>

            <input
              id="fkProfileName"
              type="text"
              maxlength="60"
              required
              placeholder="Masukkan nama"
              style="
                width:100%;
                box-sizing:border-box;
                padding:12px;
                margin:8px 0 12px;
              "
            >

            <button
              id="fkProfileSave"
              type="submit"
              style="padding:11px 16px;cursor:pointer"
            >Simpan Profil</button>
          </form>

          <p id="fkProfileMessage" role="status" style="font-size:13px"></p>
        </section>

        <section style="
          padding:18px;
          border:1px solid rgba(128,128,128,.25);
          border-radius:14px;
          margin-bottom:18px;
        ">
          <h3 style="margin-top:0">Tools Favorit</h3>
          <div id="fkDashboardFavorites">
            Memuat favorit...
          </div>
        </section>

        <section style="
          padding:18px;
          border:1px solid rgba(128,128,128,.25);
          border-radius:14px;
          margin-bottom:18px;
        ">
          <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:12px;
            flex-wrap:wrap;
          ">
            <h3 style="margin:0">Riwayat Penggunaan</h3>

            <button
              id="fkHistoryClear"
              type="button"
              style="padding:8px 12px;cursor:pointer"
            >Hapus Riwayat</button>
          </div>

          <div id="fkDashboardHistory" style="margin-top:14px">
            Memuat riwayat...
          </div>
        </section>

        <p style="font-size:12px;opacity:.65">
          Data akun tersimpan melalui layanan Supabase. Jangan bagikan
          password kepada siapa pun.
        </p>
      </section>
    `;

    document.body.appendChild(overlay);

    document.getElementById("fkDashboardClose")
      .addEventListener("click", closeDashboard);

    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) closeDashboard();
    });

    document.getElementById("fkProfileForm")
      .addEventListener("submit", saveProfile);

    document.getElementById("fkHistoryClear")
      .addEventListener("click", clearHistory);

    dashboardCreated = true;
  }

  function openDashboard() {
    if (!getUser()) {
      window.FATHKIT_AUTH?.open("login");
      return;
    }

    createDashboard();

    document.getElementById("fkDashboardOverlay").style.display = "block";

    loadDashboard();
  }

  function closeDashboard() {
    const overlay = document.getElementById("fkDashboardOverlay");

    if (overlay) {
      overlay.style.display = "none";
    }
  }

  async function loadDashboard() {
    const user = getUser();

    if (!user) return;

    const name =
      user.user_metadata?.display_name ||
      user.email?.split("@")[0] ||
      "";

    document.getElementById("fkProfileEmail").textContent =
      user.email || "Email tidak tersedia";

    document.getElementById("fkProfileName").value = name;

    await Promise.all([
      loadFavorites(),
      loadHistory()
    ]);
  }

  async function saveProfile(event) {
    event.preventDefault();

    const user = getUser();
    const client = getClient();

    if (!user || !client) {
      showToast("Koneksi akun belum tersedia.");
      return;
    }

    const name = document
      .getElementById("fkProfileName")
      .value.trim();

    const message = document.getElementById("fkProfileMessage");
    const button = document.getElementById("fkProfileSave");

    if (!name) {
      message.textContent = "Nama tidak boleh kosong.";
      return;
    }

    button.disabled = true;
    button.textContent = "Menyimpan...";
    message.textContent = "";

    try {
      const authResult = await client.auth.updateUser({
        data: {
          display_name: name
        }
      });

      if (authResult.error) throw authResult.error;

      const profileResult = await client
        .from("profiles")
        .update({
          display_name: name,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (profileResult.error) {
        console.warn(
          "Profil auth tersimpan, tetapi tabel profiles gagal diperbarui:",
          profileResult.error
        );
      }

      window.FATHKIT_CURRENT_USER =
        authResult.data.user || user;

      const authArea = document.getElementById("fkAuthUserArea");

      if (authArea) {
        window.dispatchEvent(
          new CustomEvent("fathkit:auth-changed", {
            detail: {
              user: window.FATHKIT_CURRENT_USER
            }
          })
        );
      }

      message.textContent = "Nama profil berhasil diperbarui.";
      showToast("Profil berhasil disimpan.");
    } catch (error) {
      message.textContent =
        error.message || "Gagal menyimpan profil.";
    } finally {
      button.disabled = false;
      button.textContent = "Simpan Profil";
    }
  }

  async function loadFavorites() {
    const container = document.getElementById(
      "fkDashboardFavorites"
    );

    if (!container) return;

    const api = window.FATHKIT_FAVORITES;

    if (!api) {
      container.textContent = "Fitur favorit belum tersedia.";
      return;
    }

    await api.load();

    const items = api.list();

    if (!items.length) {
      container.textContent = "Belum ada tools favorit.";
      return;
    }

    const tools = window.FATHKIT_TOOLS || [];

    container.innerHTML = items.map(function (item) {
      const tool = tools.find(function (candidate) {
        return candidate.id === item.tool_id;
      });

      const name = tool?.name || item.tool_id;

      return `
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:12px;
          padding:10px 0;
          border-bottom:1px solid rgba(128,128,128,.2);
        ">
          <span>${escapeHTML(name)}</span>

          <button
            type="button"
            data-fk-remove-favorite="${escapeHTML(item.tool_id)}"
            style="padding:7px 10px;cursor:pointer"
          >Hapus</button>
        </div>
      `;
    }).join("");

    container.querySelectorAll("[data-fk-remove-favorite]")
      .forEach(function (button) {
        button.addEventListener("click", async function () {
          const id = button.dataset.fkRemoveFavorite;

          const success = await api.remove(id);

          if (success) {
            showToast("Favorit dihapus.");
          }

          loadFavorites();
        });
      });
  }

  async function loadHistory() {
    const container = document.getElementById(
      "fkDashboardHistory"
    );

    if (!container) return;

    const api = window.FATHKIT_HISTORY;

    if (!api) {
      container.textContent = "Fitur riwayat belum tersedia.";
      return;
    }

    await api.load();

    const items = api.list();

    if (!items.length) {
      container.textContent = "Belum ada riwayat penggunaan.";
      return;
    }

    container.innerHTML = items.map(function (item) {
      const date = item.created_at
        ? new Date(item.created_at).toLocaleString("id-ID")
        : "";

      return `
        <div style="
          padding:10px 0;
          border-bottom:1px solid rgba(128,128,128,.2);
        ">
          <strong>${escapeHTML(item.tool_name || item.tool_id)}</strong>
          <div style="font-size:12px;opacity:.65">
            ${escapeHTML(date)}
          </div>
        </div>
      `;
    }).join("");
  }

  async function clearHistory() {
    const api = window.FATHKIT_HISTORY;

    if (!api) return;

    const confirmed = confirm(
      "Yakin ingin menghapus seluruh riwayat penggunaan akun ini?"
    );

    if (!confirmed) return;

    const success = await api.clear();

    if (success) {
      showToast("Riwayat berhasil dihapus.");
    } else {
      showToast("Riwayat gagal dihapus. Silakan coba lagi.");
    }

    loadHistory();
  }

  window.FATHKIT_DASHBOARD = {
    open: openDashboard,
    close: closeDashboard,
    refresh: loadDashboard
  };

  window.addEventListener(
    "fathkit:open-dashboard",
    openDashboard
  );

  window.addEventListener(
    "fathkit:favorites-updated",
    function () {
      const overlay = document.getElementById("fkDashboardOverlay");

      if (overlay && overlay.style.display !== "none") {
        loadFavorites();
      }
    }
  );

  window.addEventListener(
    "fathkit:history-updated",
    function () {
      const overlay = document.getElementById("fkDashboardOverlay");

      if (overlay && overlay.style.display !== "none") {
        loadHistory();
      }
    }
  );

  window.addEventListener("fathkit:auth-changed", function (event) {
    if (!event.detail?.user) {
      closeDashboard();
    }
  });
})();