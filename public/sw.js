const CACHE = "fourchette-v2";
const SHELL = ["/", "/manifest.webmanifest", "/images/pizza-margherita.webp", "/images/pizza-burrata.webp", "/images/pizza-veggie.webp"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("fourchette-") && key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  const publicAsset = url.pathname.startsWith("/images/") || url.pathname.startsWith("/_next/static/") || url.pathname === "/manifest.webmanifest";
  const home = url.pathname === "/" && !url.search && event.request.mode === "navigate";
  if (event.request.method !== "GET" || url.origin !== self.location.origin || event.request.headers.has("rsc") || (!home && !publicAsset)) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok && !response.redirected) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {}));
    }
    return response;
  }).catch(async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    if (home) return (await caches.match("/")) || Response.error();
    return Response.error();
  }));
});
