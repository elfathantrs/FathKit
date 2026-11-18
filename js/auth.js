
(function () {
  "use strict";

  let initialized = false;
  let authListener = null;

  window.FATHKIT_CURRENT_USER = null;

  function getClient() {
    return window.FATHKIT_SUPABASE
      ? window.FATHKIT_SUPABASE.client
      : null;
  }

  function getElement(id) {
    return document.getElementById(id);
  }

  function showToast(message) {
    const toast = getElement("toast");

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

  function createModal() {
    if (getElement("fkAuthOverlay")) return;

    const overlay = document.createElement("div");

    overlay.id = "fkAuthOverlay";
    overlay.className = "fk-auth-overlay";
    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:99999",
      "display:none",
      "align-items:center",
      "justify-content:center",
      "padding:20px",
      "background:rgba(0,0,0,.65)"
    ].join(";");

    overlay.innerHTML = `
      <div style="
        width:100%;
        max-width:420px;
        background:var(--fk-card,#fff);
        color:var(--fk-text,#222);
        border-radius:18px;
        padding:24px;
        position:relative;
        box-shadow:0 15px 50px rgba(0,0,0,.25);
      ">
        <button
          type="button"
          id="fkAuthClose"
          aria-label="Tutup"
          style="
            position:absolute;
            top:12px;
            right:14px;
            border:0;
            background:transparent;
            font-size:25px;
            cursor:pointer;
          "
        >×</button>

        <h2 id="fkAuthHeading">Masuk ke FathKit</h2>

        <p id="fkAuthDescription">
          Masuk untuk menyimpan favorit dan riwayat tools.
        </p>

        <form id="fkAuthForm">
          <div id="fkAuthNameField" style="display:none;margin-bottom:14px">
            <label for="fkAuthName">Nama</label>
            <input
              id="fkAuthName"
              type="text"
              autocomplete="name"
              placeholder="Nama kamu"
              style="width:100%;padding:12px;margin-top:6px;box-sizing:border-box"
            >
          </div>

          <div style="margin-bottom:14px">
            <label for="fkAuthEmail">Email</label>
            <input
              id="fkAuthEmail"
              type="email"
              required
              autocomplete="email"
              placeholder="nama@email.com"
              style="width:100%;padding:12px;margin-top:6px;box-sizing:border-box"
            >
          </div>

          <div style="margin-bottom:14px">
            <label for="fkAuthPassword">Password</label>
            <input
              id="fkAuthPassword"
              type="password"
              required
              minlength="6"
              autocomplete="current-password"
              placeholder="Minimal 6 karakter"
              style="width:100%;padding:12px;margin-top:6px;box-sizing:border-box"
            >
          </div>

          <button
            id="fkAuthSubmit"
            type="submit"
            style="
              width:100%;
              padding:13px;
              border:0;
              border-radius:10px;
              cursor:pointer;
              font-weight:bold;
            "
          >Masuk</button>
        </form>

        <p style="text-align:center;margin-top:18px">
          <span id="fkAuthSwitchText">Belum punya akun?</span>
          <button
            type="button"
            id="fkAuthSwitch"
            style="border:0;background:transparent;color:inherit;font-weight:bold;cursor:pointer"
          >Daftar</button>
        </p>

        <p id="fkAuthMessage" role="status" style="font-size:13px"></p>
      </div>
    `;

    document.body.appendChild(overlay);

    getElement("fkAuthClose").addEventListener("click", closeModal);

    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) closeModal();
    });

    getElement("fkAuthSwitch").addEventListener("click", function () {
      setMode(currentMode === "login" ? "register" : "login");
    });

    getElement("fkAuthForm").addEventListener("submit", submitAuth);
  }

  let currentMode = "login";

  function setMode(mode) {
    currentMode = mode;

    const isRegister = mode === "register";

    getElement("fkAuthHeading").textContent =
      isRegister ? "Buat Akun FathKit" : "Masuk ke FathKit";

    getElement("fkAuthDescription").textContent =
      isRegister
        ? "Daftar untuk mulai menggunakan fitur akun FathKit."
        : "Masuk untuk menyimpan favorit dan riwayat tools.";

    getElement("fkAuthNameField").style.display =
      isRegister ? "block" : "none";

    getElement("fkAuthName").required = isRegister;

    getElement("fkAuthPassword").autocomplete =
      isRegister ? "new-password" : "current-password";

    getElement("fkAuthSubmit").textContent =
      isRegister ? "Daftar Sekarang" : "Masuk";

    getElement("fkAuthSwitchText").textContent =
      isRegister ? "Sudah punya akun?" : "Belum punya akun?";

    getElement("fkAuthSwitch").textContent =
      isRegister ? "Masuk" : "Daftar";

    getElement("fkAuthMessage").textContent = "";
  }

  function openModal(mode) {
    createModal();
    setMode(mode || "login");

    getElement("fkAuthOverlay").style.display = "flex";
  }

  function closeModal() {
    const overlay = getElement("fkAuthOverlay");

    if (overlay) {
      overlay.style.display = "none";
    }
  }

  async function submitAuth(event) {
    event.preventDefault();

    const client = getClient();

    if (!client) {
      showAuthMessage(
        "Koneksi akun belum siap. Periksa konfigurasi Supabase dan internet."
      );
      return;
    }

    const email = getElement("fkAuthEmail").value.trim();
    const password = getElement("fkAuthPassword").value;
    const name = getElement("fkAuthName").value.trim();

    const submitButton = getElement("fkAuthSubmit");

    submitButton.disabled = true;
    submitButton.textContent = "Memproses...";

    try {
      let result;

      if (currentMode === "register") {
        result = await client.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              display_name: name
            }
          }
        });
      } else {
        result = await client.auth.signInWithPassword({
          email: email,
          password: password
        });
      }

      if (result.error) {
        throw result.error;
      }

      if (currentMode === "register" && !result.data.session) {
        showAuthMessage(
          "Pendaftaran berhasil. Silakan periksa email untuk verifikasi akun jika diminta."
        );

        return;
      }

      window.FATHKIT_CURRENT_USER =
        result.data.user || null;

      renderUser(window.FATHKIT_CURRENT_USER);
      closeModal();

      window.dispatchEvent(
        new CustomEvent("fathkit:auth-changed", {
          detail: {
            user: window.FATHKIT_CURRENT_USER
          }
        })
      );

      showToast(
        currentMode === "register"
          ? "Akun berhasil dibuat."
          : "Berhasil masuk."
      );
    } catch (error) {
      showAuthMessage(
        error.message || "Terjadi kesalahan. Silakan coba lagi."
      );
    } finally {
      submitButton.disabled = false;

      submitButton.textContent =
        currentMode === "register"
          ? "Daftar Sekarang"
          : "Masuk";
    }
  }

  function showAuthMessage(message) {
    const element = getElement("fkAuthMessage");

    if (element) {
      element.textContent = message;
    }
  }

  function renderUser(user) {
    let area = getElement("fkAuthUserArea");

    if (!area) {
      const header = document.querySelector(".fk-header-actions");

      if (!header) return;

      area = document.createElement("div");
      area.id = "fkAuthUserArea";
      header.appendChild(area);
    }

    if (!user) {
      area.innerHTML = `
        <button type="button" id="fkAuthLoginButton">
          Masuk
        </button>
      `;

      getElement("fkAuthLoginButton").addEventListener(
        "click",
        function () {
          openModal("login");
        }
      );

      return;
    }

    const displayName =
      user.user_metadata?.display_name ||
      user.email?.split("@")[0] ||
      "Pengguna";

    area.innerHTML = `
      <button type="button" id="fkAuthDashboardButton">
        ${escapeHTML(displayName)}
      </button>
      <button type="button" id="fkAuthLogoutButton">
        Keluar
      </button>
    `;

    getElement("fkAuthDashboardButton").addEventListener(
      "click",
      function () {
        window.dispatchEvent(
          new CustomEvent("fathkit:open-dashboard")
        );
      }
    );

    getElement("fkAuthLogoutButton").addEventListener(
      "click",
      logout
    );
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      };

      return entities[character];
    });
  }

  async function logout() {
    const client = getClient();

    if (!client) return;

    try {
      const result = await client.auth.signOut();

      if (result.error) throw result.error;

      window.FATHKIT_CURRENT_USER = null;
      renderUser(null);

      window.dispatchEvent(
        new CustomEvent("fathkit:auth-changed", {
          detail: { user: null }
        })
      );

      showToast("Berhasil keluar dari akun.");
    } catch (error) {
      showToast(error.message || "Gagal keluar.");
    }
  }

  async function initializeAuth() {
    if (initialized) return;

    const supabase = window.FATHKIT_SUPABASE;

    if (!supabase) return;

    const client = await supabase.getClient();

    if (initialized) return;

    initialized = true;
    createModal();

    if (!client) {
      renderUser(null);
      return;
    }

    try {
      const result = await client.auth.getSession();

      if (result.error) throw result.error;

      window.FATHKIT_CURRENT_USER =
        result.data.session?.user || null;

      renderUser(window.FATHKIT_CURRENT_USER);
    } catch (error) {
      console.error("FathKit auth:", error);
      renderUser(null);
    }

    if (!authListener) {
      const listener = client.auth.onAuthStateChange(
        function (event, session) {
          window.FATHKIT_CURRENT_USER =
            session?.user || null;

          renderUser(window.FATHKIT_CURRENT_USER);

          window.dispatchEvent(
            new CustomEvent("fathkit:auth-changed", {
              detail: {
                user: window.FATHKIT_CURRENT_USER,
                event: event
              }
            })
          );
        }
      );

      authListener = listener.data.subscription;
    }
  }

  window.FATHKIT_AUTH = {
    open: openModal,
    close: closeModal,
    logout: logout,
    getUser: function () {
      return window.FATHKIT_CURRENT_USER;
    },
    initialize: initializeAuth
  };

  window.addEventListener(
    "fathkit:supabase-ready",
    initializeAuth
  );

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeAuth,
      { once: true }
    );
  } else {
    initializeAuth();
  }
})();
