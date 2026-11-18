
(function () {
  "use strict";

  const config = window.FATHKIT_CONFIG || {};

  const supabaseUrl =
    config.SUPABASE_URL ||
    config.supabaseUrl ||
    config.projectUrl ||
    "";

  const supabaseKey =
    config.SUPABASE_PUBLISHABLE_KEY ||
    config.SUPABASE_ANON_KEY ||
    config.supabaseKey ||
    config.anonKey ||
    config.publishableKey ||
    "";

  const state = {
    client: null,
    ready: false,
    error: null,
    promise: null
  };

  function notifyReady() {
    window.dispatchEvent(
      new CustomEvent("fathkit:supabase-ready", {
        detail: {
          client: state.client,
          error: state.error
        }
      })
    );
  }

  function initialize() {
    if (state.promise) return state.promise;

    state.promise = new Promise(function (resolve) {
      if (!supabaseUrl || !supabaseKey) {
        state.error = new Error(
          "Supabase URL atau Publishable Key belum diatur di js/config.js."
        );

        state.ready = true;
        notifyReady();
        resolve(null);
        return;
      }

      function createClient() {
        if (!window.supabase || !window.supabase.createClient) {
          state.error = new Error(
            "Library Supabase gagal dimuat."
          );

          state.ready = true;
          notifyReady();
          resolve(null);
          return;
        }

        try {
          state.client = window.supabase.createClient(
            supabaseUrl,
            supabaseKey,
            {
              auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
              }
            }
          );

          state.ready = true;
          notifyReady();
          resolve(state.client);
        } catch (error) {
          state.error = error;
          state.ready = true;
          notifyReady();
          resolve(null);
        }
      }

      if (window.supabase && window.supabase.createClient) {
        createClient();
        return;
      }

      const existingScript = document.querySelector(
        'script[data-fathkit-supabase="true"]'
      );

      if (existingScript) {
        existingScript.addEventListener("load", createClient, {
          once: true
        });

        existingScript.addEventListener("error", function () {
          state.error = new Error(
            "Tidak dapat memuat library Supabase."
          );

          state.ready = true;
          notifyReady();
          resolve(null);
        }, { once: true });

        return;
      }

      const script = document.createElement("script");

      script.src =
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

      script.async = true;
      script.dataset.fathkitSupabase = "true";

      script.onload = createClient;

      script.onerror = function () {
        state.error = new Error(
          "Gagal mengunduh library Supabase. Periksa koneksi internet."
        );

        state.ready = true;
        notifyReady();
        resolve(null);
      };

      document.head.appendChild(script);
    });

    return state.promise;
  }

  window.FATHKIT_SUPABASE = {
    get client() {
      return state.client;
    },

    get ready() {
      return state.ready;
    },

    get error() {
      return state.error;
    },

    initialize: initialize,

    getClient: function () {
      return initialize();
    }
  };

  initialize();
})();
