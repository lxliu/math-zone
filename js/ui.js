// 全局 UI：导航栏 / 挂载 / Toast / 弹窗 / 账号切换
import { currentAccount } from "./store.js";
import { avatarSrc, listAccounts, switchAccount } from "./accounts.js";
import { todayKey, el } from "./utils.js";
import { TOTAL_ANIMALS } from "./constants.js";
import { play, unlockAudio } from "./audio.js";

export const NAV_TABS = [
  { id: "today", label: "今日", hash: "#/today" },
  { id: "calendar", label: "日历", hash: "#/calendar" },
  { id: "animals", label: "动物", hash: "#/animals" },
  { id: "settings", label: "设置", hash: "#/settings" },
];

export function todayStatus(account) {
  const s = account && account.sessions ? account.sessions[todayKey()] : null;
  if (!s) return { key: "idle", label: "未开始" };
  if (s.completed) return { key: "done", label: "已完成" };
  return { key: "progress", label: "进行中" };
}

export function renderNavbar() {
  const nav = document.getElementById("navbar");
  const account = currentAccount();
  if (!account) {
    nav.hidden = true;
    nav.innerHTML = "";
    return;
  }
  nav.hidden = false;
  const st = todayStatus(account);
  const active = (location.hash.replace(/^#\/?/, "") || "today").split("/")[0];
  const isPlay = active === "play";
  const tabs = NAV_TABS.map(
    (t) => `<button class="tab ${active === t.id ? "active" : ""}" data-hash="${t.hash}">${t.label}</button>`
  ).join("");

  nav.innerHTML = `
    <button class="nav-account" id="nav-account" title="切换账号">
      <span class="avatar"><img src="${avatarSrc(account.avatarId)}" alt=""></span>
      <span class="name">${account.name}</span>
      <span aria-hidden="true">▾</span>
    </button>
    <span class="nav-stat nav-status ${st.key}">今日：${st.label}</span>
    <span class="nav-stat star">⭐ <span id="nav-stars">${account.stars}</span></span>
    <span class="nav-stat hide-when-narrow">🐾 ${account.ownedAnimals.length}/${TOTAL_ANIMALS}</span>
    <span class="spacer"></span>
    ${
      isPlay
        ? `<button class="btn ghost sm" id="nav-pause">⏸ 暂停</button>`
        : `<nav class="nav-tabs">${tabs}</nav>`
    }
  `;

  nav.querySelector("#nav-account")?.addEventListener("click", () => { play("button"); openAccountSwitch(); });
  nav.querySelectorAll(".tab").forEach((b) =>
    b.addEventListener("click", () => { play("button"); location.hash = b.dataset.hash; })
  );
  nav.querySelector("#nav-pause")?.addEventListener("click", () => {
    play("button");
    document.dispatchEvent(new CustomEvent("pause-game"));
  });
}

export function mountScreen(node, { fullBleed = false } = {}) {
  const root = document.getElementById("screen");
  root.classList.toggle("full-bleed", fullBleed);
  root.innerHTML = "";
  if (typeof node === "string") root.innerHTML = node;
  else if (node) root.appendChild(node);
  window.scrollTo(0, 0);
}

export function toast(msg, ms = 1800) {
  const root = document.getElementById("overlay-root");
  const t = el("div", "toast", msg);
  root.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

export function modal({ title = "", bodyHtml = "", actions = [], onMount } = {}) {
  const root = document.getElementById("overlay-root");
  const backdrop = el("div", "backdrop");
  const box = el("div", "modal");
  box.innerHTML = `
    ${title ? `<h2 style="font-size:22px;margin-bottom:12px">${title}</h2>` : ""}
    <div id="modal-body">${bodyHtml}</div>
    <div class="row" id="modal-actions" style="justify-content:flex-end;margin-top:16px;gap:10px"></div>
  `;
  const row = box.querySelector("#modal-actions");
  const close = () => backdrop.remove();
  for (const a of actions) {
    const b = el("button", "btn " + (a.kind || "ghost") + " sm", a.label);
    b.addEventListener("click", () => { play("button"); a.onClick?.(close); if (a.close !== false) close(); });
    row.appendChild(b);
  }
  backdrop.appendChild(box);
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
  root.appendChild(backdrop);
  onMount?.(box, close);
  return close;
}

export function openAccountSwitch() {
  unlockAudio();
  const accounts = listAccounts();
  const body = `
    <div class="stack" id="acct-list"></div>
    <button class="btn block sm" id="acct-new" style="margin-top:14px">＋ 新建账号</button>
  `;
  modal({
    title: "切换账号",
    bodyHtml: body,
    actions: [{ label: "关闭", kind: "ghost" }],
    onMount: (box, close) => {
      const list = box.querySelector("#acct-list");
      const current = currentAccount();
      for (const a of accounts) {
        const item = el("button", "nav-account", "");
        item.style.width = "100%";
        item.innerHTML = `<span class="avatar"><img src="${avatarSrc(a.avatarId)}" alt=""></span>
          <span class="name">${a.name}</span><span class="spacer"></span>
          <span class="nav-stat star">⭐ ${a.stars}</span>${a.id === current?.id ? '<span class="badge tier-rare" style="margin-left:6px">当前</span>' : ""}`;
        item.addEventListener("click", () => {
          play("button");
          switchAccount(a.id);
          close();
          renderNavbar();
          const p = location.hash.replace(/^#\/?/, "");
          if (p === "setup" || p === "setup/new") location.hash = "#/today";
          else window.dispatchEvent(new HashChangeEvent("hashchange"));
        });
        list.appendChild(item);
      }
      box.querySelector("#acct-new").addEventListener("click", () => {
        play("button");
        close();
        location.hash = "#/setup/new";
      });
    },
  });
}
