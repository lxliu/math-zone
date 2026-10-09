// 月度日历看板
import { mountScreen } from "../ui.js";
import { currentAccount } from "../store.js";
import { play } from "../audio.js";
import { todayKey } from "../utils.js";
import { TOTAL_ANIMALS } from "../constants.js";
import { go } from "../router.js";

export function render() {
  const base = new Date();
  base.setDate(1);
  draw(base.getFullYear(), base.getMonth());
}

function draw(year, month) {
  const a = currentAccount();
  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayK = todayKey();
  const thisMonth = new Date().getFullYear() === year && new Date().getMonth() === month;

  let doneCount = 0;
  let monthStars = 0;

  let cells = "";
  for (let i = 0; i < startDow; i++) cells += `<div class="cal-cell blank"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const s = a.sessions[key];
    const isToday = key === todayK;
    const isFuture = new Date(year, month, d) > new Date();
    let cls = "cal-cell";
    let inner = `<div class="d">${d}</div>`;
    if (s?.completed) {
      cls += " done";
      doneCount++;
      monthStars += s.starsEarned || 0;
      inner += `<div class="s">${s.starsEarned || 0}⭐</div>`;
    } else if (isToday) {
      inner += `<div class="mk">●</div>`;
    } else if (!isFuture) {
      cls += " missed";
      inner += `<div class="mk muted">—</div>`;
    } else {
      inner += `<div class="mk muted">·</div>`;
    }
    if (isToday) cls += " today";
    cells += `<div class="${cls}">${inner}</div>`;
  }

  const wrap = document.createElement("div");
  wrap.className = "screen";
  wrap.innerHTML = `
    <div class="card">
      <div class="cal-head">
        <button class="btn ghost sm" id="prev">‹</button>
        <div class="cal-month">${year} 年 ${month + 1} 月</div>
        <button class="btn ghost sm" id="next">›</button>
        <span class="spacer"></span>
        <span class="pill">连续 ${streak(a)} 天 🔥</span>
      </div>
      <div class="cal-grid">
        ${["日", "一", "二", "三", "四", "五", "六"].map((w) => `<div class="cal-dow">${w}</div>`).join("")}
        ${cells}
      </div>
      <div class="cal-foot">
        <span class="muted">本月完成 <b>${doneCount}</b> 天 · 累计 ⭐ <b>${monthStars}</b></span>
        <span class="spacer"></span>
        <button class="btn ghost sm" id="collection">收藏总览 ${a.ownedAnimals.length}/${TOTAL_ANIMALS}</button>
      </div>
    </div>
  `;
  mountScreen(wrap);

  wrap.querySelector("#prev").addEventListener("click", () => { play("button"); const d = new Date(year, month - 1, 1); draw(d.getFullYear(), d.getMonth()); });
  wrap.querySelector("#next").addEventListener("click", () => { play("button"); const d = new Date(year, month + 1, 1); draw(d.getFullYear(), d.getMonth()); });
  wrap.querySelector("#collection").addEventListener("click", () => { play("button"); go("animals"); });
}

function streak(account) {
  let n = 0;
  const d = new Date();
  // 若今天未完成，从昨天开始算
  if (!account.sessions[todayKey()]?.completed) d.setDate(d.getDate() - 1);
  for (;;) {
    const key = todayKey(d);
    if (account.sessions[key]?.completed) { n++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return n;
}
