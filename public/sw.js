const CACHE_NAME = "agency-os-v1";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

const CACHE_STRATEGIES = {
  static: "cache-first",
  api: "network-first",
  images: "cache-first",
  fonts: "cache-first",
};

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
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/) ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(cacheFirstStrategy(request, "images"));
    return;
  }

  if (url.pathname.match(/\.(woff|woff2|ttf|eot)$/)) {
    event.respondWith(cacheFirstStrategy(request, "fonts"));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function cacheFirstStrategy(request: Request, cacheName = "static") {
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

async function networkFirstStrategy(request: Request) {
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
    return new Response(JSON.stringify({ error: "Offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function staleWhileRevalidate(request: Request) {
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

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  
  const options: NotificationOptions = {
    body: data.body,
    icon: data.icon || "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
    vibrate: data.vibrate || [200, 100, 200, 100, 200, 100, 400],
    tag: data.tag || "agency-os-notification",
    requireInteraction: data.requireInteraction !== false,
    actions: data.actions || [
      { action: "view", title: "View" },
      { action: "dismiss", title: "Dismiss" },
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

self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event.notification.tag);
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

declare const self: ServiceWorkerGlobalScope;