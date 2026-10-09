// 结算页：显示总耗时 + 幸运星 + 收集动画
import { mountScreen } from "../ui.js";
import { go } from "../router.js";
import { gameState } from "../game.js";
import { play as sfx } from "../audio.js";
import { formatClock } from "../utils.js";
import { flyStars, countUp, confetti } from "../anim.js";

export function render() {
  const r = gameState.lastResult;
  if (!r) { go("today"); return; }

  const wrap = document.createElement("div");
  wrap.className = "screen result-wrap";
  wrap.innerHTML = `
    <div style="font-size:64px">🎉</div>
    <div class="result-big">太棒了！</div>
    <div class="result-stars" id="r-earned">+${r.starsEarned} ⭐</div>
    <div class="result-stats">
      <div class="card"><div class="muted">总耗时</div><div style="font-size:26px;font-weight:900">${formatClock(r.totalTimeMs)}</div></div>
      <div class="card"><div class="muted">一次做对</div><div style="font-size:26px;font-weight:900">${r.firstTryCorrect}/${r.total}</div></div>
      <div class="card"><div class="muted">重做轮次</div><div style="font-size:26px;font-weight:900">${r.rounds}</div></div>
      <div class="card"><div class="muted">幸运星余额</div><div style="font-size:26px;font-weight:900" id="r-balance">${r.starsBefore}</div></div>
    </div>
    <div class="result-actions">
      <button class="btn green" id="r-animals">🛍 去看看动物</button>
      <button class="btn ghost" id="r-home">🏠 回主页</button>
    </div>
  `;
  mountScreen(wrap);

  sfx("complete");

  setTimeout(() => {
    const earned = wrap.querySelector("#r-earned");
    const navStar = document.querySelector("#nav-stars");
    if (navStar) navStar.textContent = String(r.starsBefore);
    flyStars(earned, navStar, 14);
    if (navStar) countUp(navStar, r.starsBefore, r.starsAfter, 950);
    const bal = wrap.querySelector("#r-balance");
    if (bal) countUp(bal, r.starsBefore, r.starsAfter, 950);
    sfx("collect");
  }, 260);

  setTimeout(() => confetti(60), 520);

  wrap.querySelector("#r-home").addEventListener("click", () => { sfx("button"); go("today"); });
  wrap.querySelector("#r-animals").addEventListener("click", () => { sfx("button"); go("animals"); });
}
