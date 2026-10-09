// 家长设置：为每类题目设置每日数量
import { mountScreen, toast, modal } from "../ui.js";
import { go } from "../router.js";
import { currentAccount } from "../store.js";
import {
  QUESTION_TYPES, getConfig, setConfig, defaultConfig,
  totalQuestions, STARS_PER_QUESTION, MAX_PER_TYPE, DEFAULT_PER_TYPE,
} from "../config.js";
import { checkPassword } from "../gate.js";
import { play as sfx } from "../audio.js";

export function promptParentPassword(onOk) {
  modal({
    title: "家长设置",
    bodyHtml: `<p class="muted" style="margin-bottom:8px">请输入家长密码</p>
      <input class="input" id="gate-pw" type="password" placeholder="密码" autocomplete="off">`,
    actions: [
      { label: "取消", kind: "ghost" },
      {
        label: "进入",
        kind: "green",
        close: false,
        onClick: (close) => {
          const pw = document.querySelector("#gate-pw")?.value || "";
          if (checkPassword(pw)) { close(); onOk(); }
          else { sfx("wrong"); toast("密码不对"); }
        },
      },
    ],
  });
}

export function render() {
  const a = currentAccount();
  if (!a) { go("setup"); return; }

  let config = getConfig(a);

  const wrap = document.createElement("div");
  wrap.className = "screen";
  wrap.innerHTML = `
    <div class="card" style="margin-bottom:14px">
      <div class="row">
        <h1 style="font-size:24px">家长设置</h1>
        <span class="spacer"></span>
        <span class="pill" id="sum-total"></span>
        <span class="pill star" id="sum-stars"></span>
      </div>
      <p class="muted" style="margin-top:6px">为每类题目选择每天的数量（0–${MAX_PER_TYPE}）。孩子不再自己选难度；每题 2 ⭐。</p>
    </div>
    <div class="card" style="margin-bottom:14px">
      ${QUESTION_TYPES.map(
        (t) => `
        <div class="row" style="padding:12px 0;border-bottom:1px dashed var(--line)">
          <div style="min-width:0">
            <div style="font-weight:800">${t.id}. ${t.name}</div>
            <div class="muted" style="font-size:13px">${t.desc} · 例：${t.sample}</div>
          </div>
          <span class="spacer"></span>
          <div class="row" style="gap:8px">
            <button class="btn ghost sm" data-dec="${t.id}">−</button>
            <span class="pill" style="min-width:54px;justify-content:center" data-val="${t.id}">0</span>
            <button class="btn ghost sm" data-inc="${t.id}">＋</button>
          </div>
        </div>`
      ).join("")}
    </div>
    <div class="row" style="gap:10px">
      <button class="btn ghost" id="reset">恢复默认（每类 ${DEFAULT_PER_TYPE}）</button>
      <button class="btn ghost" id="back">返回</button>
    </div>
  `;
  mountScreen(wrap);

  function refresh() {
    wrap.querySelectorAll("[data-val]").forEach((el) => { el.textContent = String(config[el.dataset.val]); });
    const total = totalQuestions(config);
    wrap.querySelector("#sum-total").textContent = `共 ${total} 题`;
    wrap.querySelector("#sum-stars").textContent = `⭐ ${total * STARS_PER_QUESTION}`;
  }

  function apply(id, delta) {
    const next = Math.max(0, Math.min(MAX_PER_TYPE, (config[id] || 0) + delta));
    if (next === config[id]) return;
    config = { ...config, [id]: next };
    setConfig(a.id, config);
    refresh();
    sfx("key");
  }

  wrap.querySelectorAll("[data-inc]").forEach((b) =>
    b.addEventListener("click", () => apply(b.dataset.inc, +1))
  );
  wrap.querySelectorAll("[data-dec]").forEach((b) =>
    b.addEventListener("click", () => apply(b.dataset.dec, -1))
  );
  wrap.querySelector("#reset").addEventListener("click", () => {
    config = defaultConfig();
    setConfig(a.id, config);
    refresh();
    sfx("button");
    toast("已恢复默认（每类 3 题）");
  });
  wrap.querySelector("#back").addEventListener("click", () => { sfx("button"); go("settings"); });

  refresh();
}
