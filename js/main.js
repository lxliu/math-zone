// 应用入口
import { currentAccount, commit } from "./store.js";
import { APP_VERSION } from "./constants.js";
import { ANIMALS, animalById } from "./animals.js";
import { openAnimal3D } from "./screens/animals.js";
import { register, setGuard, startRouter, currentRoute, routePath, go } from "./router.js";
import { renderNavbar } from "./ui.js";
import { setSoundEnabled, setVolume, unlockAudio } from "./audio.js";

import * as setup from "./screens/setup.js";
import * as today from "./screens/today.js";
import * as parent from "./screens/parent.js";
import * as play from "./screens/play.js";
import * as result from "./screens/result.js";
import * as calendar from "./screens/calendar.js";
import * as animals from "./screens/animals.js";
import * as settings from "./screens/settings.js";
import * as dev from "./screens/dev.js";

register("setup", setup.render);
register("today", today.render);
register("parent", parent.render);
register("play", play.render, play.cleanup);
register("result", result.render);
register("calendar", calendar.render);
register("animals", animals.render);
register("settings", settings.render);
register("dev", dev.render);

// 守卫：无账号 -> setup；有账号但停在 setup -> today（setup/new 除外，允许新增账号）
setGuard((name, path) => {
  const has = !!currentAccount();
  const isNewAccount = path === "setup/new";
  if (!has && name !== "setup") { location.replace("#/setup"); return false; }
  if (has && name === "setup" && !isNewAccount) { location.replace("#/today"); return false; }
  return true;
});

// 应用已保存的声音设置
const acc = currentAccount();
if (acc?.settings) {
  setSoundEnabled(acc.settings.sound !== false);
  setVolume(acc.settings.volume ?? 0.7);
}

// 首次手势解锁音频
window.addEventListener("pointerdown", () => unlockAudio(), { once: true });

startRouter();
console.log(`幸运星计算乐园 v${APP_VERSION}`);

// 注册 Service Worker（仅 http/https）
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    // 带上版本号：sw.js 的 URL 一变，浏览器就必然当作新 SW 安装，
    // 激活后会自动删掉旧 Cache Storage 并接管（配合下面的 controllerchange 自动刷新）。
    // 这是“发版后 F5 就能拿到新版”的关键（sw.js 自身会被浏览器缓存最长 24 小时）。
    navigator.serviceWorker.register(`sw.js?v=${APP_VERSION}`).catch((e) => console.warn("SW 注册失败", e));
  });
  // 新版 Service Worker 接管后自动刷新一次，避免停留在旧缓存
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloaded) return;
    reloaded = true;
    location.reload();
  });

  // 回到前台时主动检查一次更新（节流 5 分钟）：
  // SPA 长时间挂着不动时，浏览器不会自己去做 SW 更新检查。
  let lastCheck = 0;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    const now = Date.now();
    if (now - lastCheck < 5 * 60 * 1000) return;
    lastCheck = now;
    navigator.serviceWorker.getRegistration()
      .then((reg) => reg && reg.update())
      .catch(() => {});
  });
}

// 调试用控制台 API（Mac 上 DevTools 可直接调用）
window.__lucky = {
  currentRoute,
  go,
  refreshNav: renderNavbar,
  account: currentAccount,
  grantStars(n = 1000) {
    const a = currentAccount();
    if (a) commit((s) => { s.accounts.find((x) => x.id === a.id).stars += Number(n) || 0; });
    renderNavbar();
    return currentAccount()?.stars;
  },
  setStars(n = 0) {
    const a = currentAccount();
    if (a) commit((s) => { s.accounts.find((x) => x.id === a.id).stars = Math.max(0, Number(n) || 0); });
    renderNavbar();
    return currentAccount()?.stars;
  },
  unlockAll() {
    const a = currentAccount();
    if (a) commit((s) => { s.accounts.find((x) => x.id === a.id).ownedAnimals = ANIMALS.map((x) => x.id); });
    renderNavbar();
    return currentAccount()?.ownedAnimals.length;
  },
  view3d(id) {
    const an = animalById(id) || ANIMALS.find((x) => x.name === id);
    if (an) openAnimal3D(an);
  },
  animals: ANIMALS,
};
