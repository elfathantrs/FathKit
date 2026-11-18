
(function () {
  "use strict";

  /*
   * FATHKIT PLAN SYSTEM - SECURE CLIENT VERSION
   * Status langganan dibaca dari tabel Supabase.
   * Browser tidak boleh mengubah status langganan.
   */

  const PLAN_DEFINITIONS = {
    free: {
      id: "free",
      name: "Free",
      description: "Paket gratis untuk kebutuhan sehari-hari.",
      price: 0,
      features: [
        "Menggunakan tools dasar",
        "Pencarian dan kategori tools",
        "Menyimpan favorit setelah login",
        "Melihat riwayat penggunaan"
      ]
    },

    pro: {
      id: "pro",
      name: "Pro",
      description: "Paket lanjutan dengan fitur tambahan.",
      priceMonthly: 19000,
      priceSixMonths: 99000,
      priceYearly: 149000,
      features: [
        "Semua fitur Free",
        "Tools lanjutan khusus Pro",
        "Batas penggunaan lebih tinggi",
        "Pemrosesan banyak file jika didukung",
        "Fitur tambahan jika tersedia",
        "Tanpa iklan jika diterapkan"
      ]
    }
  };

  const state = {
    plan: "free",
    verified: false,
    loading: false,
    source: "default",
    error: null
  };

  function getClient() {
    return window.FATHKIT_SUPABASE?.client || null;
  }

  function getCurrentUser() {
    return window.FATHKIT_CURRENT_USER || null;
  }

  function dispatchUpdate() {
    window.dispatchEvent(
      new CustomEvent("fathkit:plan-updated", {
        detail: getCurrentPlan()
      })
    );
  }

  function resetToFree(errorMessage) {
    state.plan = "free";
    state.verified = false;
    state.loading = false;
    state.source = "default";
    state.error = errorMessage || null;
    dispatchUpdate();
  }

  function getCurrentPlan() {
    const definition = PLAN_DEFINITIONS[state.plan];

    return {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      verified: state.verified,
      loading: state.loading,
      source: state.source,
      error: state.error,
      features: [...definition.features]
    };
  }

  function getPlanDetails(planId) {
    const key = String(planId || "").toLowerCase() === "pro"
      ? "pro"
      : "free";

    return {
      ...PLAN_DEFINITIONS[key],
      features: [...PLAN_DEFINITIONS[key].features]
    };
  }

  function isPro() {
    return state.plan === "pro" && state.verified === true;
  }

  async function refresh() {
    const client = getClient();
    const user = getCurrentUser();

    if (!client || !user || !user.id) {
      resetToFree();
      return getCurrentPlan();
    }

    state.loading = true;
    state.error = null;
    dispatchUpdate();

    try {
      const { data, error } = await client
        .from("subscriptions")
        .select("user_id, plan, status, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (
        !data ||
        data.user_id !== user.id ||
        String(data.plan).toLowerCase() !== "pro" ||
        String(data.status).toLowerCase() !== "active"
      ) {
        resetToFree();
        return getCurrentPlan();
      }

      if (data.current_period_end) {
        const expiry = new Date(data.current_period_end).getTime();

        if (!Number.isFinite(expiry) || expiry <= Date.now()) {
          resetToFree();
          return getCurrentPlan();
        }
      }

      state.plan = "pro";
      state.verified = true;
      state.loading = false;
      state.source = "supabase";
      state.error = null;

      dispatchUpdate();

    } catch (error) {
      console.error("FathKit plan verification:", error);
      resetToFree("Status paket belum dapat diverifikasi.");
    }

    return getCurrentPlan();
  }

  function hasAccess(tool) {
    if (!tool || typeof tool !== "object") {
      return false;
    }

    const requiredPlan = String(
      tool.plan || tool.requiredPlan || "free"
    ).toLowerCase();

    if (requiredPlan !== "pro") {
      return true;
    }

    return isPro();
  }

  function checkToolAccess(toolId) {
    let tool = null;

    if (window.FATHKIT_CATALOG) {
      tool = window.FATHKIT_CATALOG.getById(toolId);
    }

    if (!tool && Array.isArray(window.FATHKIT_TOOLS)) {
      tool = window.FATHKIT_TOOLS.find(function (item) {
        return String(item.id) === String(toolId);
      });
    }

    if (!tool) {
      return {
        allowed: false,
        reason: "not_found",
        message: "Tools tidak ditemukan."
      };
    }

    if (!hasAccess(tool)) {
      return {
        allowed: false,
        reason: "pro_required",
        message: "Tools ini memerlukan paket Pro."
      };
    }

    return {
      allowed: true,
      reason: "allowed",
      message: "Akses diizinkan."
    };
  }

  function requestUpgrade() {
    window.dispatchEvent(
      new CustomEvent("fathkit:upgrade-requested", {
        detail: {
          currentPlan: state.plan,
          requestedPlan: "pro"
        }
      })
    );

    return {
      success: false,
      message: "Pembayaran Pro belum tersedia."
    };
  }

  function getAllPlans() {
    return [
      getPlanDetails("free"),
      getPlanDetails("pro")
    ];
  }

  window.FATHKIT_PLANS = {
    getCurrent: getCurrentPlan,
    getDetails: getPlanDetails,
    getAll: getAllPlans,
    isPro: isPro,
    hasAccess: hasAccess,
    checkToolAccess: checkToolAccess,
    requestUpgrade: requestUpgrade,
    refresh: refresh
  };

  window.addEventListener("fathkit:auth-changed", refresh);
  window.addEventListener("fathkit:supabase-ready", refresh);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refresh, { once: true });
  } else {
    refresh();
  }

  console.log("FathKit Plan System siap.");
})();
