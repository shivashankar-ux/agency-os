const CACHE_VERSION = "v1.0.0";
const CACHE_NAME = `agency-os-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/offline",
];

const MUTATION_CACHE = "pending-mutations";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith("agency-os-") && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    // Handle mutation requests for background sync
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
      event.respondWith(handleMutation(request));
    }
    return;
  }

  // API requests - Network First
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstStrategy(request, "api"));
    return;
  }

  // Static assets - Cache First
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot)$/) ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(cacheFirstStrategy(request, "static"));
    return;
  }

  // HTML/Navigation - Stale While Revalidate
  if (request.mode === "navigate" || url.pathname.endsWith(".html")) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default - Network First
  event.respondWith(networkFirstStrategy(request, "default"));
});

async function handleMutation(request) {
  const url = new URL(request.url);
  
  // Clone request for caching
  const requestClone = request.clone();
  
  try {
    // Try network first
    const response = await fetch(request);
    
    // If successful, return response
    if (response.ok) {
      return response;
    }
  } catch (error) {
    // Network failed, queue for background sync
  }

  // Queue mutation for background sync
  await queueMutation(requestClone);
  
  // Return optimistic response
  return new Response(
    JSON.stringify({ 
      queued: true, 
      message: "Request queued for background sync" 
    }),
    { 
      status: 202, 
      headers: { "Content-Type": "application/json" } 
    }
  );
}

async function queueMutation(request) {
  const cache = await caches.open(MUTATION_CACHE);
  const key = `${request.method} ${request.url} ${Date.now()}`;
  
  const body = await request.clone().arrayBuffer();
  const headers = Object.fromEntries(request.headers.entries());
  
  await cache.put(key, new Response(body, { headers }));
  
  // Register background sync
  if ("serviceWorker" in navigator && "sync" in self.registration) {
    await self.registration.sync.register("sync-mutations");
  }
}

async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(
      JSON.stringify({ error: "Offline", queued: false }),
      { 
        status: 503, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Background Sync
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-mutations") {
    event.waitUntil(syncMutations());
  }
});

async function syncMutations() {
  const cache = await caches.open(MUTATION_CACHE);
  const keys = await cache.keys();
  
  for (const key of keys) {
    try {
      const response = await cache.match(key);
      if (!response) continue;
      
      const body = await response.arrayBuffer();
      const headers = Object.fromEntries(response.headers.entries());
      
      // Extract method and URL from key
      const [method, url] = key.split(" ");
      
      const fetchResponse = await fetch(url, {
        method,
        headers,
        body,
      });
      
      if (fetchResponse.ok) {
        await cache.delete(key);
        
        // Notify client of success
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
          client.postMessage({
            type: "MUTATION_SYNCED",
            key,
            success: true,
          });
        });
      }
    } catch (error) {
      console.error("Sync failed for:", key, error);
    }
  }
}

// Push Notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: data.icon || "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
    vibrate: data.vibrate || [200, 100, 200, 100, 200, 100, 400],
    tag: data.tag || `notification-${Date.now()}`,
    requireInteraction: data.requireInteraction !== false,
    actions: data.actions || [
      { action: "view", title: "View" },
      { action: "dismiss", title: "Dismiss" }
    ],
    data: {
      url: data.url || "/dashboard",
      ...data.data,
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};
  const url = notificationData.url || "/dashboard";

  if (action === "dismiss") {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
  
  if (event.data === "getCacheStatus") {
    caches.keys().then((names) => {
      event.ports[0].postMessage({ caches: names });
    });
  }
});

// Periodic background sync for deadline checks
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "check-deadlines") {
    event.waitUntil(checkTaskDeadlines());
  }
});

async function checkTaskDeadlines() {
  try {
    const response = await fetch("/api/tasks/check-deadlines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    
    if (response.ok) {
      const data = await response.json();
      // Send notifications if any
      if (data.notifications?.length) {
        for (const notification of data.notifications) {
          await self.registration.showNotification(notification.title, notification.options);
        }
      }
    }
  } catch (error) {
    console.error("Deadline check failed:", error);
  }
}
