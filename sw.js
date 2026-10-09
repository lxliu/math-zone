// Service Worker —— 离线缓存应用外壳
const CACHE = "lucky-star-v1";
const ASSETS = [
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
  "./assets/avatars/kid-girl.svg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  // 同源资源：缓存优先，回退网络
  e.respondWith(
    caches.match(request).then((hit) => hit || fetch(request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
