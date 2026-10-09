// 应用入口
import { currentAccount, commit } from "./store.js";
import { APP_VERSION } from "./constants.js";
import { ANIMALS, animalById } from "./animals.js";
import { openAnimal3D } from "./screens/animals.js";
import { register, setGuard, startRouter, currentRoute, go } from "./router.js";
import { renderNavbar } from "./ui.js";
import { setSoundEnabled, setVolume, unlockAudio } from "./audio.js";

import * as setup from "./screens/setup.js";
import * as today from "./screens/today.js";
import * as difficulty from "./screens/difficulty.js";
import * as play from "./screens/play.js";
import * as result from "./screens/result.js";
import * as calendar from "./screens/calendar.js";
import * as animals from "./screens/animals.js";
import * as settings from "./screens/settings.js";
import * as dev from "./screens/dev.js";

register("setup", setup.render);
register("today", today.render);
register("difficulty", difficulty.render);
register("play", play.render, play.cleanup);
register("result", result.render);
register("calendar", calendar.render);
register("animals", animals.render);
register("settings", settings.render);
register("dev", dev.render);

// 守卫：无账号 -> setup；有账号但停在 setup -> today
setGuard((name) => {
  const has = !!currentAccount();
  if (!has && name !== "setup") { location.replace("#/setup"); return false; }
  if (has && name === "setup") { location.replace("#/today"); return false; }
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
    navigator.serviceWorker.register("sw.js").catch((e) => console.warn("SW 注册失败", e));
  });
  // 新版 Service Worker 接管后自动刷新一次，避免停留在旧缓存
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloaded) return;
    reloaded = true;
    location.reload();
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
