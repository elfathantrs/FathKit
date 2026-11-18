/* =========================================================
   FATHKIT — ACCOUNT RECOVERY CENTER
   Stage 46
   Supabase Auth Password Recovery
   ========================================================= */

(() => {
  "use strict";

  if (window.FATHKIT_ACCOUNT_RECOVERY) return;

  const BUTTON_ID = "fkRecoveryButton";
  const PANEL_ID = "fkRecoveryPanel";
  const STYLE_ID = "fkRecoveryStyles";

  const state = {
    initialized: false,
    panel: null,
    button: null,
    recoveryMode: false,
    loading: false
  };

  function getSupabaseClient() {
    const supabase = window.FATHKIT_SUPABASE;

    if (
      supabase &&
      supabase.client &&
      supabase.client.auth
    ) {
      return supabase.client;
    }

    return null;
  }

  function getRecoveryMode() {
    return state.recoveryMode;
  }

  function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) {
      console.info("[FathKit Recovery]", message);
      return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    window.clearTimeout(showToast.timeout);

    showToast.timeout = window.setTimeout(() => {
      toast.classList.remove("show");
    }, 3500);
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
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

  function createStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      #${BUTTON_ID} {
        position: fixed;
        right: 16px;
        bottom: 355px;
        z-index: 8997;
        padding: 11px 14px;
        border: 0;
        border-radius: 12px;
        background: #7c3aed;
        color: white;
        font-size: 12px;
        font-weight: 700;
        box-shadow: 0 5px 20px rgba(0,0,0,.16);
        cursor: pointer;
      }

      #${PANEL_ID} {
        position: fixed;
        inset: 0;
        z-index: 15000;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 14px;
        background: rgba(15,23,42,.68);
      }

      #${PANEL_ID}.fk-recovery-open {
        display: flex;
      }

      .fk-recovery-card {
        width: min(500px, 100%);
        max-height: 88vh;
        overflow-y: auto;
        border-radius: 18px;
        background: white;
        color: #111827;
        box-shadow: 0 20px 60px rgba(0,0,0,.25);
      }

      .fk-recovery-header {
        position: sticky;
        top: 0;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 17px 19px;
        border-bottom: 1px solid #e5e7eb;
        background: white;
      }

      .fk-recovery-header h2 {
        margin: 0;
        font-size: 19px;
      }

      .fk-recovery-close {
        width: 36px;
        height: 36px;
        border: 0;
        border-radius: 9px;
        background: #f1f5f9;
        font-size: 22px;
        cursor: pointer;
      }

      .fk-recovery-content {
        padding: 19px;
      }

      .fk-recovery-info {
        padding: 14px;
        border-radius: 12px;
        background: #f5f3ff;
        color: #5b21b6;
        font-size: 12px;
        line-height: 1.7;
      }

      .fk-recovery-form {
        margin-top: 20px;
      }

      .fk-recovery-field {
        margin-bottom: 15px;
      }

      .fk-recovery-field label {
        display: block;
        margin-bottom: 7px;
        font-size: 13px;
        font-weight: 700;
      }

      .fk-recovery-field input {
        width: 100%;
        min-height: 45px;
        padding: 11px 13px;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        background: white;
        color: #111827;
        font-size: 14px;
        outline: none;
      }

      .fk-recovery-field input:focus {
        border-color: #7c3aed;
        box-shadow: 0 0 0 3px rgba(124,58,237,.1);
      }

      .fk-recovery-submit {
        width: 100%;
        min-height: 45px;
        padding: 11px 15px;
        border: 0;
        border-radius: 10px;
        background: #7c3aed;
        color: white;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }

      .fk-recovery-submit:disabled {
        opacity: .6;
        cursor: not-allowed;
      }

      .fk-recovery-message {
        display: none;
        margin-top: 14px;
        padding: 12px;
        border-radius: 10px;
        font-size: 12px;
        line-height: 1.6;
      }

      .fk-recovery-message.show {
        display: block;
      }

      .fk-recovery-message.success {
        background: #dcfce7;
        color: #166534;
      }

      .fk-recovery-message.error {
        background: #fee2e2;
        color: #991b1b;
      }

      .fk-recovery-message.info {
        background: #eff6ff;
        color: #1e40af;
      }

      .fk-recovery-help {
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px solid #e5e7eb;
      }

      .fk-recovery-help h3 {
        margin: 0 0 9px;
        font-size: 14px;
      }

      .fk-recovery-help ul {
        padding-left: 19px;
        margin: 0;
        color: #64748b;
        font-size: 12px;
        line-height: 1.8;
      }

      .fk-recovery-note {
        margin-top: 17px;
        color: #64748b;
        font-size: 11px;
        line-height: 1.7;
      }

      .fk-recovery-link {
        display: block;
        margin-top: 14px;
        padding: 10px;
        border: 0;
        background: transparent;
        color: #6d28d9;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }

      @media (max-width: 480px) {
        #${BUTTON_ID} {
          right: 10px;
          bottom: 350px;
          padding: 10px 11px;
          font-size: 11px;
        }

        .fk-recovery-content {
          padding: 15px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function setMessage(message, type) {
    const target = state.panel &&
      state.panel.querySelector("#fkRecoveryMessage");

    if (!target) return;

    target.textContent = message;
    target.className =
      "fk-recovery-message show " + type;
  }

  function setLoading(loading) {
    state.loading = loading;

    const button = state.panel &&
      state.panel.querySelector("#fkRecoverySubmit");

    if (!button) return;

    button.disabled = loading;

    if (state.recoveryMode) {
      button.textContent = loading
        ? "Menyimpan..."
        : "Simpan Kata Sandi Baru";
    } else {
      button.textContent = loading
        ? "Mengirim..."
        : "Kirim Tautan Pemulihan";
    }
  }

  function getRecoveryRedirectURL() {
    return window.location.origin +
      window.location.pathname;
  }

  async function requestRecovery(email) {
    const client = getSupabaseClient();

    if (!client) {
      setMessage(
        "Layanan autentikasi belum siap. Periksa konfigurasi Supabase dan coba lagi.",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      const { error } =
        await client.auth.resetPasswordForEmail(email, {
          redirectTo: getRecoveryRedirectURL()
        });

      if (error) {
        throw error;
      }

      setMessage(
        "Jika alamat email terdaftar, instruksi pemulihan akan dikirim. Periksa kotak masuk dan folder spam.",
        "success"
      );

      const emailInput =
        state.panel.querySelector("#fkRecoveryEmail");

      if (emailInput) {
        emailInput.value = "";
      }

    } catch (error) {
      console.error(
        "[FathKit Recovery] Permintaan pemulihan gagal:",
        error
      );

      setMessage(
        "Permintaan belum berhasil. Periksa koneksi, konfigurasi email Supabase, dan alamat email.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  async function updatePassword(password, confirmation) {
    const client = getSupabaseClient();

    if (!client) {
      setMessage(
        "Layanan autentikasi belum siap.",
        "error"
      );
      return;
    }

    if (password.length < 8) {
      setMessage(
        "Kata sandi harus memiliki minimal 8 karakter.",
        "error"
      );
      return;
    }

    if (password !== confirmation) {
      setMessage(
        "Konfirmasi kata sandi tidak sama.",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      const { error } = await client.auth.updateUser({
        password
      });

      if (error) {
        throw error;
      }

      state.recoveryMode = false;

      setMessage(
        "Kata sandi berhasil diperbarui. Kamu dapat menggunakan kata sandi baru untuk login.",
        "success"
      );

      const form =
        state.panel.querySelector("#fkRecoveryForm");

      form.innerHTML = `
        <button
          type="button"
          class="fk-recovery-submit"
          id="fkRecoveryDone"
        >
          Selesai
        </button>
      `;

      form.querySelector("#fkRecoveryDone")
        .addEventListener("click", closePanel);

    } catch (error) {
      console.error(
        "[FathKit Recovery] Pembaruan kata sandi gagal:",
        error
      );

      setMessage(
        "Kata sandi belum berhasil diperbarui. Pastikan tautan pemulihan masih berlaku dan coba lagi.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  function renderForm() {
    const form = state.panel.querySelector("#fkRecoveryForm");

    const message =
      state.panel.querySelector("#fkRecoveryMessage");

    message.className = "fk-recovery-message";
    message.textContent = "";

    if (state.recoveryMode) {
      form.innerHTML = `
        <div class="fk-recovery-field">
          <label for="fkRecoveryNewPassword">
            Kata Sandi Baru
          </label>

          <input
            id="fkRecoveryNewPassword"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required
            placeholder="Minimal 8 karakter"
          >
        </div>

        <div class="fk-recovery-field">
          <label for="fkRecoveryConfirmPassword">
            Konfirmasi Kata Sandi
          </label>

          <input
            id="fkRecoveryConfirmPassword"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required
            placeholder="Ulangi kata sandi baru"
          >
        </div>

        <button
          type="submit"
          class="fk-recovery-submit"
          id="fkRecoverySubmit"
        >
          Simpan Kata Sandi Baru
        </button>
      `;

      return;
    }

    form.innerHTML = `
      <div class="fk-recovery-field">
        <label for="fkRecoveryEmail">
          Alamat Email
        </label>

        <input
          id="fkRecoveryEmail"
          type="email"
          autocomplete="email"
          required
          placeholder="nama@email.com"
        >
      </div>

      <button
        type="submit"
        class="fk-recovery-submit"
        id="fkRecoverySubmit"
      >
        Kirim Tautan Pemulihan
      </button>
    `;
  }

  function handleFormSubmit(event) {
    event.preventDefault();

    if (state.loading) return;

    if (state.recoveryMode) {
      const password =
        state.panel.querySelector(
          "#fkRecoveryNewPassword"
        ).value;

      const confirmation =
        state.panel.querySelector(
          "#fkRecoveryConfirmPassword"
        ).value;

      updatePassword(password, confirmation);
      return;
    }

    const email =
      state.panel.querySelector(
        "#fkRecoveryEmail"
      ).value.trim();

    if (!email) {
      setMessage(
        "Masukkan alamat email terlebih dahulu.",
        "error"
      );
      return;
    }

    requestRecovery(email);
  }

  function renderPanel() {
    const panel = document.createElement("div");

    panel.id = PANEL_ID;
    panel.setAttribute("aria-hidden", "true");

    panel.innerHTML = `
      <div
        class="fk-recovery-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fkRecoveryTitle"
      >
        <div class="fk-recovery-header">
          <h2 id="fkRecoveryTitle">
            Pemulihan Akun
          </h2>

          <button
            type="button"
            class="fk-recovery-close"
            id="fkRecoveryClose"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <div class="fk-recovery-content">

          <div class="fk-recovery-info">
            Gunakan fitur ini jika kamu lupa kata sandi
            atau perlu membuat kata sandi baru melalui
            tautan pemulihan email.
          </div>

          <form
            class="fk-recovery-form"
            id="fkRecoveryForm"
          ></form>

          <div
            class="fk-recovery-message"
            id="fkRecoveryMessage"
            role="status"
            aria-live="polite"
          ></div>

          <section class="fk-recovery-help">
            <h3>Tidak menerima email?</h3>

            <ul>
              <li>Periksa folder spam atau promosi.</li>
              <li>Pastikan alamat email sudah benar.</li>
              <li>Tunggu beberapa menit sebelum mencoba lagi.</li>
              <li>Pastikan layanan email Supabase telah dikonfigurasi.</li>
            </ul>
          </section>

          <div class="fk-recovery-note">
            FathKit tidak meminta kata sandi lama atau
            kode verifikasi melalui pesan pribadi.
            Jangan bagikan tautan pemulihan kepada siapa pun.
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(panel);

    state.panel = panel;

    panel.querySelector("#fkRecoveryClose")
      .addEventListener("click", closePanel);

    panel.addEventListener("click", (event) => {
      if (event.target === panel) {
        closePanel();
      }
    });

    panel.querySelector("#fkRecoveryForm")
      .addEventListener("submit", handleFormSubmit);

    renderForm();
  }

  function openPanel() {
    if (!state.panel) return;

    state.panel.classList.add("fk-recovery-open");
    state.panel.setAttribute("aria-hidden", "false");

    renderForm();

    const firstInput =
      state.panel.querySelector("input");

    if (firstInput) {
      firstInput.focus();
    }
  }

  function closePanel() {
    if (!state.panel) return;

    state.panel.classList.remove("fk-recovery-open");
    state.panel.setAttribute("aria-hidden", "true");

    if (state.button) {
      state.button.focus();
    }
  }

  function createButton() {
    const button = document.createElement("button");

    button.type = "button";
    button.id = BUTTON_ID;
    button.textContent = "🔑 Pemulihan Akun";

    button.setAttribute(
      "aria-label",
      "Buka pusat pemulihan akun FathKit"
    );

    button.addEventListener("click", openPanel);

    document.body.appendChild(button);

    state.button = button;
  }

  function handleAuthState(event, session) {
    if (event === "PASSWORD_RECOVERY") {
      state.recoveryMode = true;

      if (state.panel) {
        openPanel();

        setMessage(
          "Tautan pemulihan dikenali. Buat kata sandi baru.",
          "info"
        );
      }
    }
  }

  function listenForRecoveryEvents() {
    const client = getSupabaseClient();

    if (!client) return;

    if (state.authListenerAttached) return;

    state.authListenerAttached = true;

    client.auth.onAuthStateChange(handleAuthState);

    const hash = window.location.hash || "";

    if (
      hash.includes("type=recovery") ||
      hash.includes("access_token=")
    ) {
      state.recoveryMode = true;
    }

    if (state.recoveryMode && state.panel) {
      openPanel();

      setMessage(
        "Mode pemulihan akun aktif. Buat kata sandi baru.",
        "info"
      );
    }
  }

  function init() {
    if (state.initialized || !document.body) return;

    if (
      document.getElementById(PANEL_ID) ||
      document.getElementById(BUTTON_ID)
    ) {
      return;
    }

    createStyles();
    renderPanel();
    createButton();

    state.initialized = true;

    listenForRecoveryEvents();

    document.addEventListener(
      "fathkit:supabase-ready",
      listenForRecoveryEvents
    );

    console.info(
      "[FathKit] Account Recovery Center siap."
    );
  }

  window.FATHKIT_ACCOUNT_RECOVERY = {
    init,
    open: openPanel,
    close: closePanel,
    requestRecovery,
    updatePassword,
    getRecoveryMode
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
      once: true
    });
  } else {
    init();
  }

})();