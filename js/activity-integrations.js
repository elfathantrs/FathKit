/* =========================================================
   FATHKIT — ACTIVITY INTEGRATIONS
   Stage 37: Automatic Activity Tracking
   Company: eLFathan
========================================================= */

"use strict";

(() => {
  if (window.FATHKIT_ACTIVITY_INTEGRATIONS) return;

  const STORAGE_MARKER = "__fathkit_activity_tracking_v1";
  const MAX_DUPLICATE_INTERVAL = 3000;

  let initialized = false;
  let lastActivity = "";
  let lastActivityTime = 0;

  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;

  function getActivityAPI() {
    return window.FATHKIT_ACTIVITY || null;
  }

  function log(action, category = "Sistem") {
    const activity = getActivityAPI();

    if (!activity || typeof activity.record !== "function") {
      return false;
    }

    const now = Date.now();
    const signature = category + ":" + action;

    if (
      signature === lastActivity &&
      now - lastActivityTime < MAX_DUPLICATE_INTERVAL
    ) {
      return false;
    }

    lastActivity = signature;
    lastActivityTime = now;

    const result = activity.record(action, {
      type: "info",
      category
    });

    return Boolean(result && result.success);
  }

  function classifyStorageKey(key) {
    const value = String(key || "").toLowerCase();

    if (
      value.includes("fathkit_activity_log") ||
      value.includes("fathkit_backup")
    ) {
      return null;
    }

    /* Authentication / session changes */
    if (
      value.includes("auth-token") ||
      value.includes("supabase.auth.token") ||
      value.includes("fathkit_auth") ||
      value.includes("fathkit_user")
    ) {
      return {
        category: "Akun",
        action: "Data sesi akun mengalami perubahan"
      };
    }

    /* Favorites changes */
    if (
      value.includes("favorite") ||
      value.includes("favourites") ||
      value.includes("fathkit_fav")
    ) {
      return {
        category: "Favorit",
        action: "Data favorit mengalami perubahan"
      };
    }

    /* Tool history changes */
    if (
      value.includes("tool_history") ||
      value.includes("fathkit_history") ||
      value.includes("recent_tools")
    ) {
      return {
        category: "Riwayat Tools",
        action: "Riwayat penggunaan tools mengalami perubahan"
      };
    }

    return null;
  }

  function trackStorageChange(key) {
    const detected = classifyStorageKey(key);

    if (!detected) return;

    log(detected.action, detected.category);
  }

  function patchStorage() {
    if (Storage.prototype[STORAGE_MARKER]) return;

    Storage.prototype.setItem = function(key, value) {
      const result = originalSetItem.call(this, key, value);

      if (this === window.localStorage) {
        trackStorageChange(key);
      }

      return result;
    };

    Storage.prototype.removeItem = function(key) {
      const result = originalRemoveItem.call(this, key);

      if (this === window.localStorage) {
        trackStorageChange(key);
      }

      return result;
    };

    Object.defineProperty(Storage.prototype, STORAGE_MARKER, {
      value: true,
      configurable: false,
      enumerable: false
    });
  }

  /* Standard event bridge for other FathKit modules */
  function registerEventBridge() {
    window.addEventListener("fathkit:activity", (event) => {
      const detail = event.detail || {};

      if (typeof detail.action !== "string") return;

      const action = detail.action.trim();

      if (!action) return;

      const allowedTypes = [
        "info",
        "success",
        "warning",
        "error"
      ];

      const type = allowedTypes.includes(detail.type)
        ? detail.type
        : "info";

      const activity = getActivityAPI();

      if (!activity) return;

      activity.record(action, {
        type,
        category: detail.category || "Umum"
      });
    });
  }

  function init() {
    if (initialized) return;

    if (!getActivityAPI()) {
      console.warn(
        "[FathKit] Activity Log belum tersedia."
      );
      return;
    }

    patchStorage();
    registerEventBridge();

    initialized = true;

    log(
      "Sistem pencatatan aktivitas berhasil diaktifkan",
      "Sistem"
    );

    window.FATHKIT_ACTIVITY_INTEGRATIONS = {
      isInitialized() {
        return initialized;
      },

      record(action, category = "Umum", type = "info") {
        const activity = getActivityAPI();

        if (!activity) return false;

        return activity.record(action, {
          category,
          type
        });
      },

      getStatus() {
        return {
          initialized,
          storageMonitoring: true,
          eventBridge: true,
          recordsAvailable: Boolean(getActivityAPI())
        };
      }
    };

    console.log(
      "[FathKit] Activity integrations initialized."
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
      once: true
    });
  } else {
    init();
  }
})();