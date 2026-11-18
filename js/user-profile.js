/* =========================================================
   FATHKIT — USER PROFILE
   Stage 38: User Profile Center
   Company: eLFathan
   Product: FathKit
========================================================= */

"use strict";

(() => {
  if (window.FATHKIT_PROFILE) return;

  const ROOT_ID = "fathkit-profile-center";
  const STYLE_ID = "fathkit-profile-style";

  let root = null;
  let isOpen = false;

  function getUser() {
    return (
      window.FATHKIT_CURRENT_USER ||
      (window.FATHKIT_AUTH &&
        typeof window.FATHKIT_AUTH.getUser === "function"
        ? window.FATHKIT_AUTH.getUser()
        : null)
    );
  }

  function getPlan() {
    const plans = window.FATHKIT_PLANS;

    if (plans && typeof plans.getCurrent === "function") {
      try {
        return plans.getCurrent();
      } catch (error) {
        console.warn("[FathKit Profile] Plan error:", error);
      }
    }

    return "free";
  }

  function getActivityCount() {
    const activity = window.FATHKIT_ACTIVITY;

    if (!activity || typeof activity.getAll !== "function") {
      return 0;
    }

    return activity.getAll().length;
  }

  function getFavoriteCount() {
    const favorites = window.FATHKIT_FAVORITES;

    if (!favorites) return 0;

    try {
      if (typeof favorites.getAll === "function") {
        const result = favorites.getAll();

        return Array.isArray(result) ? result.length : 0;
      }

      if (typeof favorites.getFavorites === "function") {
        const result = favorites.getFavorites();

        return Array.isArray(result) ? result.length : 0;
      }
    } catch (error) {
      console.warn("[FathKit Profile] Favorites error:", error);
    }

    return 0;
  }

  function getName(user) {
    if (!user) return "Pengunjung";

    return (
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Pengguna FathKit"
    );
  }

  function getEmail(user) {
    return user?.email || "Belum login";
  }

  function getInitial(name) {
    return String(name || "F")
      .trim()
      .charAt(0)
      .toUpperCase() || "F";
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      #${ROOT_ID} {
        position: fixed;
        right: 14px;
        bottom: 76px;
        z-index: 99970;
        font-family: Arial, sans-serif;
        color: #111827;
      }

      #${ROOT_ID} * {
        box-sizing: border-box;
      }

      #${ROOT_ID} .fk-profile-toggle {
        min-height: 44px;
        padding: 0 14px;
        border: 1px solid #e5e7eb;
        border-radius: 13px;
        background: #fff;
        color: #111827;
        font-size: 13px;
        font-weight: 700;
        box-shadow: 0 4px 16px rgba(0,0,0,.12);
        cursor: pointer;
      }

      #${ROOT_ID} .fk-profile-panel {
        position: absolute;
        right: 0;
        bottom: 54px;
        display: none;
        width: min(340px, calc(100vw - 28px));
        max-height: min(75vh, 560px);
        overflow-y: auto;
        padding: 17px;
        border: 1px solid #e5e7eb;
        border-radius: 18px;
        background: #fff;
        box-shadow: 0 12px 35px rgba(0,0,0,.18);
      }

      #${ROOT_ID}.fk-profile-open .fk-profile-panel {
        display: block;
      }

      #${ROOT_ID} .fk-profile-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-bottom: 15px;
        border-bottom: 1px solid #e5e7eb;
      }

      #${ROOT_ID} .fk-profile-avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        flex-shrink: 0;
        border-radius: 15px;
        background: #111827;
        color: #fff;
        font-size: 20px;
        font-weight: 700;
      }

      #${ROOT_ID} .fk-profile-name {
        font-size: 15px;
        font-weight: 700;
        overflow-wrap: anywhere;
      }

      #${ROOT_ID} .fk-profile-email {
        margin-top: 4px;
        color: #6b7280;
        font-size: 11px;
        overflow-wrap: anywhere;
      }

      #${ROOT_ID} .fk-profile-section {
        margin-top: 16px;
      }

      #${ROOT_ID} .fk-profile-section-title {
        margin-bottom: 9px;
        color: #6b7280;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .5px;
      }

      #${ROOT_ID} .fk-profile-plan {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 13px;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
      }

      #${ROOT_ID} .fk-profile-plan strong {
        font-size: 14px;
      }

      #${ROOT_ID} .fk-profile-plan span {
        color: #6b7280;
        font-size: 11px;
      }

      #${ROOT_ID} .fk-profile-stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 9px;
      }

      #${ROOT_ID} .fk-profile-stat {
        padding: 13px;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
      }

      #${ROOT_ID} .fk-profile-stat strong {
        display: block;
        font-size: 21px;
      }

      #${ROOT_ID} .fk-profile-stat span {
        display: block;
        margin-top: 4px;
        color: #6b7280;
        font-size: 11px;
      }

      #${ROOT_ID} .fk-profile-actions {
        display: flex;
        gap: 8px;
        margin-top: 16px;
      }

      #${ROOT_ID} .fk-profile-actions button {
        flex: 1;
        min-height: 39px;
        padding: 8px;
        border: 0;
        border-radius: 10px;
        background: #111827;
        color: #fff;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
      }

      #${ROOT_ID} .fk-profile-actions .fk-profile-secondary {
        background: #f3f4f6;
        color: #111827;
      }

      #${ROOT_ID} .fk-profile-note {
        margin-top: 13px;
        color: #9ca3af;
        font-size: 10px;
        line-height: 1.5;
      }

      @media (max-width: 480px) {
        #${ROOT_ID} {
          right: 10px;
          bottom: 68px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function element(tag, className, value) {
    const node = document.createElement(tag);

    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;

    return node;
  }

  function render() {
    if (!root) return;

    const panel = root.querySelector(".fk-profile-panel");
    panel.innerHTML = "";

    const user = getUser();
    const name = getName(user);
    const email = getEmail(user);

    const rawPlan = getPlan();

    const plan = typeof rawPlan === "string"
      ? rawPlan.toLowerCase()
      : rawPlan?.plan?.toLowerCase?.() ||
        rawPlan?.name?.toLowerCase?.() ||
        "free";

    const isPro = plan === "pro";

    /* Profile header */
    const header = element("div", "fk-profile-header");

    header.appendChild(
      element("div", "fk-profile-avatar", getInitial(name))
    );

    const identity = element("div");

    identity.appendChild(
      element("div", "fk-profile-name", name)
    );

    identity.appendChild(
      element("div", "fk-profile-email", email)
    );

    header.appendChild(identity);
    panel.appendChild(header);

    /* Plan section */
    const planSection = element("div", "fk-profile-section");

    planSection.appendChild(
      element("div", "fk-profile-section-title", "Paket Akun")
    );

    const planCard = element("div", "fk-profile-plan");

    const planInfo = element("div");

    planInfo.appendChild(
      element("strong", "", isPro ? "FathKit Pro" : "FathKit Free")
    );

    planInfo.appendChild(
      element(
        "div",
        "",
        isPro
          ? "Akses paket Pro terdeteksi"
          : "Paket dasar FathKit"
      )
    );

    const planBadge = element(
      "span",
      "",
      isPro ? "PRO" : "FREE"
    );

    planCard.append(planInfo, planBadge);
    planSection.appendChild(planCard);
    panel.appendChild(planSection);

    /* Statistics */
    const statsSection = element("div", "fk-profile-section");

    statsSection.appendChild(
      element("div", "fk-profile-section-title", "Statistik")
    );

    const stats = element("div", "fk-profile-stats");

    const statItems = [
      {
        number: getActivityCount(),
        label: "Aktivitas tercatat"
      },
      {
        number: getFavoriteCount(),
        label: "Tools favorit"
      }
    ];

    statItems.forEach((item) => {
      const card = element("div", "fk-profile-stat");

      card.appendChild(
        element("strong", "", String(item.number))
      );

      card.appendChild(
        element("span", "", item.label)
      );

      stats.appendChild(card);
    });

    statsSection.appendChild(stats);
    panel.appendChild(statsSection);

    /* Actions */
    const actions = element("div", "fk-profile-actions");

    const refreshButton = element(
      "button",
      "",
      "Perbarui"
    );

    refreshButton.type = "button";
    refreshButton.addEventListener("click", refresh);

    const closeButton = element(
      "button",
      "fk-profile-secondary",
      "Tutup"
    );

    closeButton.type = "button";
    closeButton.addEventListener("click", close);

    actions.append(refreshButton, closeButton);
    panel.appendChild(actions);

    panel.appendChild(
      element(
        "div",
        "fk-profile-note",
        "Informasi paket dan statistik bergantung pada data yang tersedia di perangkat dan akun."
      )
    );
  }

  function createInterface() {
    root = document.createElement("div");
    root.id = ROOT_ID;

    const panel = element("div", "fk-profile-panel");

    const toggleButton = element(
      "button",
      "fk-profile-toggle",
      "◉ Profil"
    );

    toggleButton.type = "button";
    toggleButton.setAttribute("aria-expanded", "false");

    toggleButton.addEventListener("click", toggle);

    root.append(panel, toggleButton);
    document.body.appendChild(root);
  }

  function open() {
    if (!root) return;

    isOpen = true;
    root.classList.add("fk-profile-open");

    root.querySelector(".fk-profile-toggle")
      .setAttribute("aria-expanded", "true");

    render();
  }

  function close() {
    if (!root) return;

    isOpen = false;
    root.classList.remove("fk-profile-open");

    root.querySelector(".fk-profile-toggle")
      .setAttribute("aria-expanded", "false");
  }

  function toggle() {
    if (isOpen) close();
    else open();
  }

  function refresh() {
    render();

    if (window.FATHKIT_NOTIFY) {
      window.FATHKIT_NOTIFY.info(
        "Informasi profil diperbarui."
      );
    }
  }

  function init() {
    if (!document.body) return;

    injectStyles();
    createInterface();
    render();

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });

    window.addEventListener("fathkit:auth-changed", render);
    window.addEventListener("fathkit:plan-changed", render);
    window.addEventListener("fathkit:activity", render);

    window.FATHKIT_PROFILE = {
      open,
      close,
      toggle,
      refresh,
      render,

      getData() {
        const user = getUser();

        return {
          name: getName(user),
          email: getEmail(user),
          plan: getPlan(),
          activityCount: getActivityCount(),
          favoriteCount: getFavoriteCount()
        };
      },

      getStatus() {
        return {
          initialized: true,
          open: isOpen,
          userAvailable: Boolean(getUser())
        };
      }
    };

    console.log("[FathKit] User Profile initialized.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
      once: true
    });
  } else {
    init();
  }
})();