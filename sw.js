// Service Worker —— 离线缓存
// 策略：HTML/JS/CSS 用 network-first（保证更新能生效）；其它资源 cache-first。
// 注意：3D 模型（assets/3d/*.glb，共约 3.3 MB）【故意不预缓存】，
//       它们在解锁/打开 3D 时按需 fetch，然后自动进入 cache-first，避免首屏下载全量。
const CACHE = "lucky-star-v21";

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
  "./js/config.js",
  "./js/gate.js",
  "./js/keypad.js",
  "./js/backup.js",
  "./js/dev.js",
  "./js/screens/dev.js",
  "./js/questions/index.js",
  "./js/questions/types.js",
  "./js/screens/setup.js",
  "./js/screens/today.js",
  "./js/screens/play.js",
  "./js/screens/result.js",
  "./js/screens/calendar.js",
  "./js/screens/animals.js",
  "./js/screens/settings.js",
  "./js/screens/parent.js",
  "./js/threeViewer.js",
  "./js/models/index.js",
  "./js/models/registry.js",
  "./js/models/gltf.js",
  "./js/models/hedgehog.js",
  "./js/models/lib.js",
  "./js/models/animals3d.js",
  "./vendor/three.module.min.js",
  "./vendor/OrbitControls.js",
  "./vendor/addons/GLTFLoader.js",
  "./vendor/addons/BufferGeometryUtils.js",
  "./vendor/addons/RoomEnvironment.js",
  "./assets/3d/Textures/colormap.png",
  "./assets/icons/icon.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/avatars/kid-boy.svg",
  "./assets/avatars/kid-girl.svg",
  // 24 张动物图标（由 3D 模型渲染生成，共约 300 KB）
  "./assets/animals/common-01.webp",
  "./assets/animals/common-02.webp",
  "./assets/animals/common-03.webp",
  "./assets/animals/common-04.webp",
  "./assets/animals/common-05.webp",
  "./assets/animals/common-06.webp",
  "./assets/animals/common-07.webp",
  "./assets/animals/common-08.webp",
  "./assets/animals/common-09.webp",
  "./assets/animals/common-10.webp",
  "./assets/animals/epic-01.webp",
  "./assets/animals/epic-02.webp",
  "./assets/animals/epic-03.webp",
  "./assets/animals/epic-04.webp",
  "./assets/animals/epic-05.webp",
  "./assets/animals/epic-06.webp",
  "./assets/animals/legend-01.webp",
  "./assets/animals/legend-02.webp",
  "./assets/animals/rare-01.webp",
  "./assets/animals/rare-02.webp",
  "./assets/animals/rare-03.webp",
  "./assets/animals/rare-04.webp",
  "./assets/animals/rare-05.webp",
  "./assets/animals/rare-06.webp",
  "./assets/animals/rare-07.webp",
  "./assets/animals/rare-08.webp",
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

// 缓存键统一去掉查询串（?v=xxx）：
//   · index.html 里的 ?v=0.6.2 一变，URL 就变 → 必然走网络拿新内容（缓存击穿）
//   · 但缓存里存的仍是无查询串的键 → 仍能命中 CORE 预缓存的同一份文件（离线不破）
function cacheKey(request) {
  const u = new URL(request.url);
  if (!u.search) return request;
  u.search = "";
  return new Request(u.toString(), { method: "GET" });
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    // cache: "reload" 强制绕过浏览器自己的 HTTP 启发式缓存。
    // 否则即使 SW 层是 network-first，fetch() 仍可能被浏览器缓存直接满足，
    // 拿到旧的 CSS/JS —— 这正是“F5 也修不好”的元凶之一。
    const res = await fetch(request, { cache: "reload" });
    if (res && res.ok) cache.put(cacheKey(request), res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(cacheKey(request));
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
  const key = cacheKey(request);
  const hit = await cache.match(key);
  if (hit) return hit;
  const res = await fetch(request);
  if (res && res.ok) cache.put(key, res.clone());
  return res;
}

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(NETWORK_FIRST.has(request.destination) ? networkFirst(request) : cacheFirst(request));
});
