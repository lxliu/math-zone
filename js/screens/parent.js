// 家长设置：为每类题目设置每日数量（草稿 + 保存）
import { mountScreen, toast, modal } from "../ui.js";
import { go, setLeaveGuard } from "../router.js";
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
          if (checkPassword(pw)) {
            try { sessionStorage.setItem("parentUnlocked", "1"); } catch (e) {}
            close();
            onOk();
          } else { sfx("wrong"); toast("密码不对"); }
        },
      },
    ],
  });
}

export function render() {
  const a = currentAccount();
  if (!a) { go("setup"); return; }
  let unlocked = false;
  try { unlocked = sessionStorage.getItem("parentUnlocked") === "1"; } catch (e) { unlocked = false; }
  if (!unlocked) { toast("请从「设置 → 家长设置」输入密码进入"); go("settings"); return; }

  const saved = getConfig(a);
  let draft = { ...saved };
  const isDirty = () => QUESTION_TYPES.some((t) => draft[t.id] !== saved[t.id]);

  const wrap = document.createElement("div");
  wrap.className = "screen";
  wrap.innerHTML = `
    <div class="card" style="margin-bottom:14px">
      <div class="row">
        <h1 style="font-size:24px">家长设置</h1>
        <span class="pill" id="dirty" style="display:none;background:#ffd9d9;color:#b71c1c">未保存</span>
        <span class="spacer"></span>
        <span class="pill" id="sum-total"></span>
        <span class="pill star" id="sum-stars"></span>
      </div>
      <p class="muted" style="margin-top:6px">为每类题目选择每天的数量（0–${MAX_PER_TYPE}）。改完点「保存」才生效；每题 2 ⭐。</p>
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
      <button class="btn green" id="save" disabled>保存</button>
      <button class="btn ghost" id="reset">恢复默认（每类 ${DEFAULT_PER_TYPE}）</button>
      <button class="btn ghost" id="back">返回</button>
    </div>
  `;
  mountScreen(wrap);

  function refresh() {
    wrap.querySelectorAll("[data-val]").forEach((el) => { el.textContent = String(draft[el.dataset.val]); });
    const total = totalQuestions(draft);
    wrap.querySelector("#sum-total").textContent = `共 ${total} 题`;
    wrap.querySelector("#sum-stars").textContent = `⭐ ${total * STARS_PER_QUESTION}`;
    const dirty = isDirty();
    wrap.querySelector("#dirty").style.display = dirty ? "" : "none";
    wrap.querySelector("#save").disabled = !dirty;
  }

  function apply(id, delta) {
    const next = Math.max(0, Math.min(MAX_PER_TYPE, (draft[id] || 0) + delta));
    if (next === draft[id]) return;
    draft = { ...draft, [id]: next };
    refresh();
    sfx("key");
  }

  function doSave() {
    setConfig(a.id, draft);
    Object.assign(saved, draft);
    refresh();
    sfx("complete");
    toast("已保存");
  }

  function promptUnsaved() {
    return new Promise((resolve) => {
      modal({
        title: "有未保存的修改",
        bodyHtml: `<p class="muted">你修改了题量但还没保存。</p>`,
        actions: [
          { label: "取消", kind: "ghost", onClick: () => resolve(false) },
          { label: "不保存离开", kind: "ghost", onClick: () => resolve(true) },
          { label: "保存并离开", kind: "green", onClick: () => { doSave(); resolve(true); } },
        ],
      });
    });
  }

  wrap.querySelectorAll("[data-inc]").forEach((b) => b.addEventListener("click", () => apply(+b.dataset.inc, +1)));
  wrap.querySelectorAll("[data-dec]").forEach((b) => b.addEventListener("click", () => apply(+b.dataset.dec, -1)));
  wrap.querySelector("#save").addEventListener("click", doSave);
  wrap.querySelector("#reset").addEventListener("click", () => {
    draft = defaultConfig();
    refresh();
    sfx("button");
    toast("已恢复默认，记得点保存");
  });
  wrap.querySelector("#back").addEventListener("click", () => { sfx("button"); go("settings"); });

  // 离开守卫：有未保存修改时弹确认
  setLeaveGuard(async () => {
    if (!isDirty()) return true;
    return await promptUnsaved();
  });

  refresh();
}
