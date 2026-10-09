// hash 路由（支持每屏 cleanup）
export const routes = new Map();
let guardFn = () => true;
let prevCleanup = null;

export function register(name, render, cleanup) { routes.set(name, { render, cleanup }); }
export function setGuard(fn) { guardFn = fn; }

// 完整路由路径，如 "today" / "setup/new"
export function routePath() {
  return location.hash.replace(/^#\/?/, "") || "today";
}

export function currentRoute() {
  return routePath().split("/")[0];
}

export async function handleRoute() {
  const path = routePath();
  const name = path.split("/")[0];
  if (!guardFn(name, path)) return;
  if (prevCleanup) {
    try { prevCleanup(); } catch (e) { console.warn("cleanup failed", e); }
    prevCleanup = null;
  }
  const entry = routes.get(name) || routes.get("today");
  if (entry) {
    await entry.render();
    prevCleanup = entry.cleanup || null;
  }
  const { renderNavbar } = await import("./ui.js");
  renderNavbar();
}

export function startRouter() {
  window.addEventListener("hashchange", () => { handleRoute(); });
  handleRoute();
}

export function go(name) { location.hash = "#/" + name; }
