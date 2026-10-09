// hash 路由（支持每屏 cleanup 与离开拦截）
export const routes = new Map();
let guardFn = () => true;
let prevCleanup = null;
let leaveGuard = null;
let lastHash = typeof location !== "undefined" ? location.hash : "";

export function register(name, render, cleanup) { routes.set(name, { render, cleanup }); }
export function setGuard(fn) { guardFn = fn; }

// 当前屏可注册离开守卫：返回 Promise<boolean>（true=允许离开）
export function setLeaveGuard(fn) { leaveGuard = fn; }
export function clearLeaveGuard() { leaveGuard = null; }

export function routePath() {
  return location.hash.replace(/^#\/?/, "") || "today";
}
export function currentRoute() {
  return routePath().split("/")[0];
}

export async function handleRoute() {
  const path = routePath();
  const name = path.split("/")[0];

  if (leaveGuard) {
    let allow = true;
    try { allow = await leaveGuard(location.hash); } catch (e) { allow = true; }
    if (!allow) {
      // 取消离开：恢复原 hash，且不重新渲染
      try { history.replaceState(null, "", lastHash || "#/today"); } catch (e) {}
      return;
    }
    leaveGuard = null;
  }

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
  lastHash = location.hash;

  const { renderNavbar } = await import("./ui.js");
  renderNavbar();
}

export function startRouter() {
  lastHash = location.hash;
  window.addEventListener("hashchange", () => { handleRoute(); });
  handleRoute();
}

export function go(name) { location.hash = "#/" + name; }
