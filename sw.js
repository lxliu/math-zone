// Service Worker —— 离线缓存
// 策略：HTML/JS/CSS 用 network-first（保证更新能生效）；其它资源 cache-first。
const CACHE = "lucky-star-v2";

const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./styles/tokens.css",
  "./styles/base.css",
  "./styles/components.css",
  "./styles/screens.css",
  "./js/main.js",
  "./js/router.js",
  "./js/store.js",
  "./js/storage.js",
  "./js/utils.js",
  "./js/ui.js",
  "./js/audio.js",
  "./js/anim.js",
  "./js/accounts.js",
  "./js/animals.js",
  "./js/shop.js",
  "./js/calendar.js",
  "./js/settings.js",
  "./js/game.js",
  "./js/scoring.js",
  "./js/constants.js",
  "./js/keypad.js",
  "./js/backup.js",
  "./js/questions/index.js",
  "./js/questions/level1.js",
  "./js/questions/level2.js",
  "./js/questions/level3.js",
  "./js/questions/level4.js",
  "./js/questions/tricks.js",
  "./js/screens/setup.js",
  "./js/screens/today.js",
  "./js/screens/difficulty.js",
  "./js/screens/play.js",
  "./js/screens/result.js",
  "./js/screens/calendar.js",
  "./js/screens/animals.js",
  "./js/screens/settings.js",
  "./assets/icons/icon.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/avatars/kid-boy.svg",
  "./assets/avatars/kid-girl.svg",
];

const NETWORK_FIRST = new Set(["document", "script", "style", "manifest"]);

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()).catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(request);
    if (hit) return hit;
    if (request.mode === "navigate") {
      const idx = await cache.match("./index.html");
      if (idx) return idx;
    }
    return Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res && res.ok) cache.put(request, res.clone());
  return res;
}

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(NETWORK_FIRST.has(request.destination) ? networkFirst(request) : cacheFirst(request));
});
