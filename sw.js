
/* =========================================================
   FATHKIT — SERVICE WORKER
   Stage 33: Improved Offline Cache
   Company: eLFathan
   Product: FathKit
   Tagline: Everyday Tools, All in One Place.
========================================================= */

"use strict";

/* =========================
   CACHE VERSION
========================= */

const CACHE_VERSION = "fathkit-cache-v2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",

  /* CSS */
  "./css/style.css",
  "./css/tools.css",
  "./css/auth.css",
  "./css/dashboard.css",

  /* DATA */
  "./data/categories.js",
  "./data/tools.js",

  /* CORE JAVASCRIPT */
  "./js/config.js",
  "./js/supabase.js",
  "./js/auth.js",
  "./js/favorites.js",
  "./js/history.js",
  "./js/dashboard.js",
  "./js/help.js",
  "./js/catalog.js",
  "./js/tool-details.js",
  "./js/plans.js",
  "./js/app.js",

  /* SYSTEM JAVASCRIPT */
  "./js/diagnostics.js",
  "./js/integration-tests.js",
  "./js/launch-readiness.js",
  "./js/pwa.js",
  "./js/release-manager.js",
  "./js/performance-monitor.js",
  "./js/backup-restore.js"
];

/* =========================
   INSTALL
========================= */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(async (cache) => {
        const results = await Promise.allSettled(
          APP_SHELL.map((file) => cache.add(file))
        );

        const failedFiles = results
          .map((result, index) => ({
            result,
            file: APP_SHELL[index]
          }))
          .filter((item) => item.result.status === "rejected")
          .map((item) => item.file);

        if (failedFiles.length > 0) {
          console.warn(
            "[FathKit] Some files were not cached:",
            failedFiles
          );
        }

        return self.skipWaiting();
      })
  );
});

/* =========================
   ACTIVATE
========================= */

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith("fathkit-cache-"))
            .filter((name) => name !== CACHE_VERSION)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

/* =========================
   FETCH
========================= */

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  /* Only handle same-origin requests */
  if (url.origin !== self.location.origin) {
    return;
  }

  /* Navigation: Network First */
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();

            caches.open(CACHE_VERSION)
              .then((cache) => cache.put("./index.html", copy));
          }

          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match("./index.html");

          if (cachedPage) {
            return cachedPage;
          }

          return new Response(
            "FathKit sedang offline. Silakan coba lagi saat koneksi tersedia.",
            {
              status: 503,
              headers: {
                "Content-Type": "text/plain; charset=utf-8"
              }
            }
          );
        })
    );

    return;
  }

  /* Static files: Cache First */
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            if (
              response &&
              response.ok &&
              response.type === "basic"
            ) {
              const copy = response.clone();

              caches.open(CACHE_VERSION)
                .then((cache) => cache.put(request, copy));
            }

            return response;
          });
      })
      .catch(() => {
        return new Response(
          "File tidak tersedia saat offline.",
          {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          }
        );
      })
  );
});

/* =========================
   MESSAGE HANDLER
========================= */

self.addEventListener("message", (event) => {
  const message = event.data;

  if (!message || typeof message !== "object") {
    return;
  }

  if (message.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (message.type === "GET_VERSION") {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({
        version: CACHE_VERSION,
        status: "active"
      });
    }
  }
});

/* =========================
   BACKGROUND SYNC PLACEHOLDER
========================= */

self.addEventListener("sync", (event) => {
  if (event.tag === "fathkit-background-sync") {
    event.waitUntil(
      Promise.resolve()
    );
  }
});

console.log("[FathKit] Service Worker loaded:", CACHE_VERSION);
