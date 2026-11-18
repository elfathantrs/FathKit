
(function () {
  "use strict";

  const TABLE = "tool_history";
  const EVENT_NAME = "fathkit:history-updated";
  const STORAGE_PREFIX = "fathkit_history_";
  const MAX_HISTORY = 100;

  let currentUserId = null;
  let historyItems = [];
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
      console.error("FathKit history local read:", error);
      return [];
    }
  }

  function saveLocal() {
    try {
      localStorage.setItem(
        getStorageKey(),
        JSON.stringify(historyItems.slice(0, MAX_HISTORY))
      );
    } catch (error) {
      console.error("FathKit history local save:", error);
    }
  }

  function notify() {
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, {
        detail: {
          history: list()
        }
      })
    );
  }

  function list() {
    return historyItems.map(function (item) {
      return { ...item };
    });
  }

  async function load() {
    const user = getUser();
    currentUserId = user?.id || null;

    historyItems = readLocal();
    notify();

    if (!user || syncInProgress) return list();

    const client = getClient();

    if (!client) return list();

    syncInProgress = true;

    try {
      const result = await client
        .from(TABLE)
        .select("id, tool_id, tool_name, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(MAX_HISTORY);

      if (result.error) throw result.error;

      if (currentUserId !== user.id) return list();

      historyItems = (result.data || []).map(function (item) {
        return {
          id: item.id,
          tool_id: item.tool_id,
          tool_name: item.tool_name,
          created_at: item.created_at
        };
      });

      saveLocal();
      notify();
    } catch (error) {
      console.warn(
        "FathKit history: menggunakan penyimpanan lokal.",
        error
      );
    } finally {
      syncInProgress = false;
    }

    return list();
  }

  async function record(toolId, toolName) {
    const id = String(toolId || "").trim();
    const name = String(toolName || id).trim();

    if (!id) return false;

    const user = getUser();
    const createdAt = new Date().toISOString();

    const item = {
      tool_id: id,
      tool_name: name,
      created_at: createdAt
    };

    historyItems.unshift(item);
    historyItems = historyItems.slice(0, MAX_HISTORY);

    saveLocal();
    notify();

    if (!user) return true;

    const client = getClient();

    if (!client) return true;

    try {
      const result = await client
        .from(TABLE)
        .insert({
          user_id: user.id,
          tool_id: id,
          tool_name: name
        });

      if (result.error) throw result.error;

      return true;
    } catch (error) {
      console.warn("FathKit history record:", error);
      return true;
    }
  }

  async function clear() {
    const previous = list();

    historyItems = [];
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
      console.warn("FathKit history clear:", error);

      historyItems = previous;
      saveLocal();
      notify();

      return false;
    }
  }

  window.FATHKIT_HISTORY = {
    list: list,
    record: record,
    clear: clear,
    load: load
  };

  window.addEventListener("fathkit:auth-changed", function (event) {
    const user = event.detail?.user || null;
    currentUserId = user?.id || null;
    historyItems = readLocal();
    notify();
    load();
  });

  window.addEventListener("fathkit:supabase-ready", function () {
    load();
  });

  currentUserId = getUser()?.id || null;
  historyItems = readLocal();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load, {
      once: true
    });
  } else {
    load();
  }
})();
