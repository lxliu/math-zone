// 家长设置：为每类题目设置每日数量（草稿 + 保存）
// 两种进入方式：
//   · 新建账号后的「首次配置」：免密码（sessionStorage.parentOnboard 一次性令牌）
//   · 日常修改：先过密码门（sessionStorage.parentUnlocked）
import { mountScreen, toast, modal } from "../ui.js";
import { go, setLeaveGuard } from "../router.js";
import { currentAccount } from "../store.js";
import {
  QUESTION_TYPES, getConfig, setConfig, defaultConfig,
  totalQuestions, STARS_PER_QUESTION, MAX_PER_TYPE, DEFAULT_PER_TYPE,
} from "../config.js";
import {
  checkPassword, GATE_PASSWORD,
  grantParentAccess, hasParentAccess,
  isFirstSetup, clearFirstSetup,
} from "../gate.js";
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
            grantParentAccess();
            clearFirstSetup();
            close();
            onOk();
          } else { sfx("wrong"); toast("密码不对"); }
        },
      },
    ],
  });
}

// 设备提示：iOS / Android（含 Android Chrome）且还没加到主屏幕时才显示
function homeScreenHint() {
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.maxTouchPoints > 1 && /Mac/.test(ua));
  const isAndroid = /Android/i.test(ua);
  if (!isIOS && !isAndroid) return "";
  const standalone =
    navigator.standalone === true ||
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
  if (standalone) return "";
  const how = isIOS
    ? "点 Safari 底部的「分享」→「添加到主屏幕」"
    : "点浏览器菜单「⋮」→「添加到主屏幕 / 安装应用」";
  return `<div class="onboard-hint">📱 <b>建议加个桌面图标：</b>${how}。加完之后全屏、离线也能玩，数据也不容易被系统清理。</div>`;
}

function onboardingIntro(a) {
  return `
    <div class="card onboard" style="margin-bottom:14px">
      <div class="onboard-head">👨‍👩‍👧 第一次先设置题目（家长 1 分钟）</div>
      <p class="onboard-line">默认是「8 类各 3 题、每天 24 题」，对多数孩子偏多。请按孩子<b>现在学到哪儿</b>改一改：</p>
      <ul class="onboard-list">
        <li>还没学过的类别，点 <b>−</b> 把数量设成 <b>0</b>；</li>
        <li>想知道每类练什么，点标题旁的 <span class="info-q">?</span> 看例题和说明；</li>
        <li>改完点下面的「<b>保存并开始练习</b>」，孩子就能开始做了。</li>
      </ul>
      <p class="onboard-line muted" style="margin-top:10px">以后想修改：进「设置 → 👨‍👩‍👧 家长设置」，输入家长密码 <code class="onboard-pw">${GATE_PASSWORD}</code>。</p>
    </div>`;
}

export function render() {
  const a = currentAccount();
  if (!a) { go("setup"); return; }

  // 刚创建账号的那一次免密码；其余情况必须已输过密码
  const onboarding = isFirstSetup(a.id);
  if (!onboarding && !hasParentAccess()) {
    toast("请从「设置 → 家长设置」输入密码进入");
    go("settings");
    return;
  }

  const saved = getConfig(a);
  let draft = { ...saved };
  const isDirty = () => QUESTION_TYPES.some((t) => draft[t.id] !== saved[t.id]);

  const wrap = document.createElement("div");
  wrap.className = "screen";
  wrap.innerHTML = `
    ${onboarding ? onboardingIntro(a) : ""}
    ${onboarding ? homeScreenHint() : ""}
    <div class="card" style="margin-bottom:14px">
      <div class="row">
        <h1 style="font-size:24px">${onboarding ? `先为「${a.name}」设置练习` : "家长设置"}</h1>
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
          <div style="min-width:0;cursor:pointer" data-info="${t.id}">
            <div style="font-weight:800">${t.id}. ${t.name}<span class="info-q" title="说明与例题">?</span></div>
            <div class="muted" style="font-size:13px">${t.short}</div>
            <div class="info-ex inline">${(t.samples || []).slice(0, 3).map((s) => `<code>${s}</code>`).join("")}</div>
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
    <div class="row" style="gap:10px;flex-wrap:wrap">
      ${onboarding
        ? `<button class="btn green" id="save-start">保存并开始练习</button>
           <button class="btn ghost" id="skip">用默认设置跳过</button>`
        : `<button class="btn green" id="save" disabled>保存</button>
           <button class="btn ghost" id="reset">恢复默认（每类 ${DEFAULT_PER_TYPE}）</button>
           <button class="btn ghost" id="back">返回</button>`}
    </div>
  `;
  mountScreen(wrap);

  /* ---------------- 类型说明弹窗 ---------------- */
  function showTypeInfo(t) {
    const field = (label, text) =>
      text ? `<div class="info-field"><div class="info-label">${label}</div><div class="info-text">${text}</div></div>` : "";
    const exList = (list, cls = "") =>
      `<div class="info-ex ${cls}">${list.map((s) => `<code>${s}</code>`).join("")}</div>`;

    const subs = t.subs
      ? `<div class="info-label" style="margin-top:16px">五个子类</div>` +
        t.subs
          .map(
            (s) => `
          <div class="info-sub">
            <div class="info-sub-head"><b>${s.name}</b><span class="info-weight">${s.weight}</span></div>
            <div class="info-text muted">${s.trick}</div>
            ${exList(s.samples, "sm")}
          </div>`
          )
          .join("")
      : "";

    const tips = t.tips && t.tips.length ? `<div class="info-tip">💡 ${t.tips.join("　")}</div>` : "";

    modal({
      title: `${t.id}. ${t.name}`,
      bodyHtml: `
        <p class="info-text muted" style="margin-bottom:14px">${t.short}</p>
        ${field("练什么", t.skill)}
        ${field("数字范围", t.range)}
        ${field("规则保证", t.rule)}
        <div class="info-label" style="margin-top:6px">例题</div>
        ${exList(t.samples || [])}
        ${subs}
        ${tips}
      `,
      actions: [{ label: "知道了", kind: "green" }],
    });
  }

  wrap.querySelectorAll("[data-info]").forEach((el) =>
    el.addEventListener("click", () => {
      const t = QUESTION_TYPES.find((x) => x.id === Number(el.dataset.info));
      if (!t) return;
      sfx("button");
      showTypeInfo(t);
    })
  );

  function refresh() {
    wrap.querySelectorAll("[data-val]").forEach((el) => { el.textContent = String(draft[el.dataset.val]); });
    const total = totalQuestions(draft);
    wrap.querySelector("#sum-total").textContent = `共 ${total} 题`;
    wrap.querySelector("#sum-stars").textContent = `⭐ ${total * STARS_PER_QUESTION}`;
    const dirty = isDirty();
    wrap.querySelector("#dirty").style.display = dirty ? "" : "none";
    const saveBtn = wrap.querySelector("#save");
    if (saveBtn) saveBtn.disabled = !dirty;
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

  function promptSkip() {
    return new Promise((resolve) => {
      if (!isDirty()) { resolve(true); return; }
      modal({
        title: "还没保存",
        bodyHtml: `<p class="muted">你改了题量但没保存，确定要用默认设置跳过吗？</p>`,
        actions: [
          { label: "取消", kind: "ghost", onClick: () => resolve(false) },
          { label: "保存并开始", kind: "green", onClick: () => { doSave(); resolve(true); } },
          { label: "跳过", kind: "ghost", onClick: () => resolve(true) },
        ],
      });
    });
  }

  wrap.querySelectorAll("[data-inc]").forEach((b) => b.addEventListener("click", () => apply(+b.dataset.inc, +1)));
  wrap.querySelectorAll("[data-dec]").forEach((b) => b.addEventListener("click", () => apply(+b.dataset.dec, -1)));

  if (onboarding) {
    // 保存并开始：写入配置，清掉一次性令牌，直接去今日
    wrap.querySelector("#save-start").addEventListener("click", () => {
      sfx("button");
      doSave();
      clearFirstSetup();
      go("today");
    });
    // 跳过：用默认设置开始（有改动时先确认）
    wrap.querySelector("#skip").addEventListener("click", async () => {
      sfx("button");
      const ok = await promptSkip();
      if (!ok) return;
      clearFirstSetup();
      go("today");
    });
  } else {
    wrap.querySelector("#save").addEventListener("click", doSave);
    wrap.querySelector("#reset").addEventListener("click", () => {
      draft = defaultConfig();
      refresh();
      sfx("button");
      toast("已恢复默认，记得点保存");
    });
    wrap.querySelector("#back").addEventListener("click", () => { sfx("button"); go("settings"); });
  }

  // 离开守卫：有未保存修改时弹确认
  setLeaveGuard(async () => {
    if (!isDirty()) return true;
    return await promptUnsaved();
  });

  refresh();
}

// 离开配置页（不管哪种模式）就作废“首次免密码”令牌，
// 保证免密码只在刚建号后的这一次访问里有效。
export function cleanup() {
  clearFirstSetup();
}
