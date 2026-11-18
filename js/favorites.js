
(function () {
  "use strict";

  const TABLE = "favorites";
  const EVENT_NAME = "fathkit:favorites-updated";
  const STORAGE_PREFIX = "fathkit_favorites_";

  let currentUserId = null;
  let favorites = [];
  let syncInProgress = false;

  function getClient() {
    return window.FATHKIT_SUPABASE?.client || null;
  }

  function getUser() {
    return window.FATHKIT_CURRENT_USER || null;
  }

  function getStorageKey() {
    return STORAGE_PREFIX + (currentUserId || "guest");
  }

  function readLocal() {
    try {
      const data = JSON.parse(
        localStorage.getItem(getStorageKey()) || "[]"
      );

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("FathKit favorites local read:", error);
      return [];
    }
  }

  function saveLocal() {
    try {
      localStorage.setItem(
        getStorageKey(),
        JSON.stringify(favorites)
      );
    } catch (error) {
      console.error("FathKit favorites local save:", error);
    }
  }

  function notify() {
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, {
        detail: {
          favorites: list()
        }
      })
    );
  }

  function normalizeToolId(toolId) {
    return String(toolId || "").trim();
  }

  function has(toolId) {
    const id = normalizeToolId(toolId);

    return favorites.some(function (item) {
      return item.tool_id === id;
    });
  }

  function list() {
    return favorites.map(function (item) {
      return { ...item };
    });
  }

  function isFavorite(toolId) {
    return has(toolId);
  }

  async function load() {
    const user = getUser();
    const nextUserId = user?.id || null;

    currentUserId = nextUserId;
    favorites = readLocal();
    notify();

    if (!user || syncInProgress) return list();

    const client = getClient();

    if (!client) return list();

    syncInProgress = true;

    try {
      const result = await client
        .from(TABLE)
        .select("tool_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (result.error) throw result.error;

      if (currentUserId !== user.id) return list();

      favorites = (result.data || []).map(function (item) {
        return {
          tool_id: item.tool_id,
          created_at: item.created_at || null
        };
      });

      saveLocal();
      notify();
    } catch (error) {
      console.warn(
        "FathKit favorites: menggunakan penyimpanan lokal.",
        error
      );
    } finally {
      syncInProgress = false;
    }

    return list();
  }

  async function add(toolId) {
    const id = normalizeToolId(toolId);

    if (!id) return false;
    if (has(id)) return true;

    const user = getUser();

    favorites.unshift({
      tool_id: id,
      created_at: new Date().toISOString()
    });

    saveLocal();
    notify();

    if (!user) return true;

    const client = getClient();

    if (!client) return true;

    try {
      const result = await client
        .from(TABLE)
        .upsert(
          {
            user_id: user.id,
            tool_id: id
          },
          {
            onConflict: "user_id,tool_id",
            ignoreDuplicates: true
          }
        );

      if (result.error) throw result.error;

      return true;
    } catch (error) {
      console.warn("FathKit favorites add:", error);
      return true;
    }
  }

  async function remove(toolId) {
    const id = normalizeToolId(toolId);

    if (!id) return false;

    const previous = list();

    favorites = favorites.filter(function (item) {
      return item.tool_id !== id;
    });

    saveLocal();
    notify();

    const user = getUser();

    if (!user) return true;

    const client = getClient();

    if (!client) return true;

    try {
      const result = await client
        .from(TABLE)
        .delete()
        .eq("user_id", user.id)
        .eq("tool_id", id);

      if (result.error) throw result.error;

      return true;
    } catch (error) {
      console.warn("FathKit favorites remove:", error);

      favorites = previous;
      saveLocal();
      notify();

      return false;
    }
  }

  async function toggle(toolId) {
    if (has(toolId)) {
      return remove(toolId);
    }

    return add(toolId);
  }

  async function clear() {
    const previous = list();

    favorites = [];
    saveLocal();
    notify();

    const user = getUser();

    if (!user) return true;

    const client = getClient();

    if (!client) return true;

    try {
      const result = await client
        .from(TABLE)
        .delete()
        .eq("user_id", user.id);

      if (result.error) throw result.error;

      return true;
    } catch (error) {
      console.warn("FathKit favorites clear:", error);

      favorites = previous;
      saveLocal();
      notify();

      return false;
    }
  }

  window.FATHKIT_FAVORITES = {
    list: list,
    add: add,
    remove: remove,
    toggle: toggle,
    isFavorite: isFavorite,
    has: has,
    clear: clear,
    load: load
  };

  window.addEventListener("fathkit:auth-changed", function (event) {
    const user = event.detail?.user || null;
    currentUserId = user?.id || null;
    favorites = readLocal();
    notify();
    load();
  });

  window.addEventListener("fathkit:supabase-ready", function () {
    load();
  });

  currentUserId = getUser()?.id || null;
  favorites = readLocal();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load, {
      once: true
    });
  } else {
    load();
  }
})();
