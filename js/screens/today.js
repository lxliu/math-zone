// 今日主页
import { mountScreen } from "../ui.js";
import { currentAccount } from "../store.js";
import { go } from "../router.js";
import { todayKey } from "../utils.js";
import { play } from "../audio.js";
import { TOTAL_ANIMALS } from "../constants.js";

export function render() {
  const a = currentAccount();
  const d = new Date();
  const wk = "日一二三四五六"[d.getDay()];
  const s = a.sessions[todayKey()];
  const done = !!s?.completed;

  const wrap = document.createElement("div");
  wrap.className = "screen";
  wrap.innerHTML = `
    <div class="today-head">
      <div class="today-date">今天 · ${d.getMonth() + 1}月${d.getDate()}日 星期${wk}</div>
    </div>
    <div class="today-start">
      <button class="btn ${done ? "ghost" : "green"}" id="start" ${done ? "disabled" : ""}>
        ${done ? "今天已完成 ✓" : s ? "继续今天的 20 题" : "▶ 开始今天的 20 题"}
      </button>
    </div>
    <div class="today-status muted">
      ${done
        ? `已收集 ${s.starsEarned || 0} ⭐ 幸运星 · 明天再来`
        : s
          ? "进行中，随时可以继续"
          : "每天一次，全部做对才能收集幸运星"}
    </div>

    <div class="quick-grid" style="margin-top:26px">
      <div class="quick-card" data-go="calendar"><div class="ic">📅</div><div class="t">日历</div><div class="s">看进度</div></div>
      <div class="quick-card" data-go="animals"><div class="ic">🛍️</div><div class="t">动物</div><div class="s">收集 ${a.ownedAnimals.length}/${TOTAL_ANIMALS}</div></div>
      <div class="quick-card" data-go="settings"><div class="ic">⚙️</div><div class="t">设置</div><div class="s">账号 · 备份</div></div>
    </div>
  `;
  mountScreen(wrap);

  wrap.querySelector("#start").addEventListener("click", () => {
    play("button");
    // 有进行中会话则直接续做，否则先选难度
    go(s && !s.completed ? "play" : "difficulty");
  });
  wrap.querySelectorAll("[data-go]").forEach((c) =>
    c.addEventListener("click", () => { play("button"); go(c.dataset.go); })
  );
}
