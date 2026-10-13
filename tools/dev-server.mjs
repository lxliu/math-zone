// 本地开发用静态服务器（零依赖，只用 Node 内置模块）。
//
// 为什么不用 `python3 -m http.server`：
//   python 只发 Last-Modified、不发 Cache-Control，Chrome / Safari 会对 js/css
//   做启发式缓存；而页面里的 import 全是【没有 ?v= 的相对路径】
//   （如 main.js 里的 `import * as setup from "./screens/setup.js"`）。
//   于是会出现“改了代码，本地页面不动，F5 也没用”，而线上（有 4 层缓存击穿）正常。
//   这里对所有响应显式加 no-store：本地改完刷新即可生效。
//
// 用法：npm run dev   （或 node tools/dev-server.mjs）
//   PORT=4174 node tools/dev-server.mjs
import { createServer } from "node:http";
import { createReadStream, promises as fs } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "127.0.0.1";

// 本地开发一律不缓存：既不动 HTTP 缓存，也不让浏览器拿旧模块
const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

const server = createServer(async (req, res) => {
  const send = (code, body) => {
    res.writeHead(code, { ...NO_CACHE, "Content-Type": "text/plain; charset=utf-8" });
    res.end(body);
  };
  try {
    if (req.method !== "GET" && req.method !== "HEAD") return send(405, "Method Not Allowed");

    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";

    // 防目录穿越：解析后必须仍在 ROOT 之内
    const full = join(ROOT, normalize(pathname));
    if (full !== ROOT && !full.startsWith(ROOT + sep)) return send(403, "Forbidden");

    const st = await fs.stat(full).catch(() => null);
    if (!st) return send(404, `Not Found: ${pathname}`);
    if (st.isDirectory()) {
      // 目录按 index.html 处理（与 Pages 行为一致）
      const idx = join(full, "index.html");
      const st2 = await fs.stat(idx).catch(() => null);
      if (!st2) return send(404, `Not Found: ${pathname}`);
      return stream(res, idx, st2.size, req.method);
    }
    return stream(res, full, st.size, req.method);
  } catch (e) {
    return send(500, "Server Error: " + (e && e.message));
  }
});

function stream(res, file, size, method) {
  res.writeHead(200, {
    ...NO_CACHE,
    "Content-Type": TYPES[extname(file).toLowerCase()] || "application/octet-stream",
    "Content-Length": size,
  });
  if (method === "HEAD") return res.end();
  createReadStream(file).pipe(res);
}

server.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.error(`端口 ${PORT} 已被占用。先关掉旧的服务器，或换端口：PORT=4174 npm run dev`);
  } else {
    console.error(e);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`幸运星计算乐园 dev → http://${HOST}:${PORT}/  （no-store，改完刷新即生效）`);
});
