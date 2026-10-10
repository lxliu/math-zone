// 调试面板（仅 127.0.0.1 + ?dev=1）
import { mountScreen, toast, modal } from "../ui.js";
import { go } from "../router.js";
import { currentAccount, commit } from "../store.js";
import { ANIMALS, TIERS, animalById } from "../animals.js";
import { play as sfx } from "../audio.js";
import { todayKey, el } from "../utils.js";
import { isDevEnabled, checkDevPassword } from "../dev.js";
import { openAnimal3D } from "./animals.js";
import { resetTodaySession } from "../game.js";
import { getConfig, totalStars, USE_GLB_MODELS } from "../config.js";
import { getGlbOverride, setGlbOverride } from "../models/registry.js";
import { clearState } from "../storage.js";
import { exportBackup, importBackup } from "../backup.js";

export function promptDevPassword(onOk) {
  modal({
    title: "调试密码",
    bodyHtml: `<input class="input" id="dev-pw" type="password" placeholder="输入密码" autocomplete="off">`,
    actions: [
      { label: "取消", kind: "ghost" },
      {
        label: "进入",
        kind: "green",
        close: false,
        onClick: (close) => {
          const pw = document.querySelector("#dev-pw")?.value || "";
          if (checkDevPassword(pw)) {
            close();
            onOk();
          } else {
            sfx("wrong");
            toast("密码不对");
          }
        },
      },
    ],
  });
}

export function render() {
  if (!isDevEnabled()) {
    toast("调试功能未开启（需 127.0.0.1 且 ?dev=1）");
    go("today");
    return;
  }
  const a = currentAccount();
  if (!a) { go("setup"); return; }

  const wrap = document.createElement("div");
  wrap.className = "screen";
  // 3D 模型来源：glb / proc（未覆盖时跟随 config 里的默认值）
  const curSrc = () => {
    const ov = getGlbOverride();
    return (ov === null ? USE_GLB_MODELS : ov) ? "glb" : "proc";
  };
  wrap.innerHTML = `
    <div class="card" style="margin-bottom:14px">
      <div class="row">
        <h1 style="font-size:22px">🛠 调试面板</h1>
        <span class="spacer"></span>
        <span class="pill star">⭐ ${a.stars}</span>
        <span class="pill">🐾 ${a.ownedAnimals.length}/${ANIMALS.length}</span>
      </div>
      <p class="muted" style="margin-top:6px">仅本机 127.0.0.1 + ?dev=1 生效</p>
    </div>

    <div class="card" style="margin-bottom:14px">
      <h3 style="margin-bottom:10px">幸运星</h3>
      <div class="chips" id="stars">
        <span class="chip" data-add="100">+100</span>
        <span class="chip" data-add="1000">+1000</span>
        <span class="chip" data-add="10000">+10000</span>
        <span class="chip" data-set="0">归零</span>
      </div>
      <div class="row" style="margin-top:10px">
        <input class="input" id="star-custom" type="number" placeholder="自定义数量" style="max-width:200px">
        <button class="btn ghost sm" id="star-custom-set">设为</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:14px">
      <h3 style="margin-bottom:10px">收藏</h3>
      <div class="chips" id="coll">
        <span class="chip" data-act="unlock-all">解锁全部</span>
        <span class="chip" data-act="lock-all">清空收藏</span>
        <span class="chip" data-act="unlock-tier" data-tier="common">解锁普通</span>
        <span class="chip" data-act="unlock-tier" data-tier="rare">解锁稀有</span>
        <span class="chip" data-act="unlock-tier" data-tier="epic">解锁史诗</span>
        <span class="chip" data-act="unlock-tier" data-tier="legend">解锁传说</span>
      </div>
    </div>

    <div class="card" style="margin-bottom:14px">
      <h3 style="margin-bottom:10px">今日 / 数据</h3>
      <div class="chips" id="misc">
        <span class="chip" data-act="reset-today">重置今天</span>
        <span class="chip" data-act="complete-today">标记今天完成</span>
        <span class="chip" data-act="parent">家长设置</span>
        <span class="chip" data-act="export">导出备份</span>
        <span class="chip" data-act="import">导入备份</span>
        <span class="chip" data-act="clear">清空全部数据</span>
        <span class="chip" data-act="unreg-sw">注销 SW 并刷新</span>
      </div>
      <input type="file" id="dev-import" accept="application/json" hidden>
    </div>

    <div class="card" style="margin-bottom:14px">
      <h3 style="margin-bottom:10px">3D 模型来源</h3>
      <div class="chips" id="model-src">
        <span class="chip ${curSrc() === 'glb' ? 'on' : ''}" data-act="src-glb">glTF（Kenney Cube Pets）</span>
        <span class="chip ${curSrc() === 'proc' ? 'on' : ''}" data-act="src-proc">程序化低多边形</span>
        <span class="chip" data-act="src-default">恢复默认（${USE_GLB_MODELS ? 'glTF' : '程序化'}）</span>
      </div>
      <p class="muted" style="margin-top:8px;font-size:13px">当前：${curSrc() === 'glb' ? 'glTF 模型' : '程序化模型'}（切到程序化可立即验证兵底路径）</p>
    </div>

    <div class="card" style="margin-bottom:14px">
      <h3 style="margin-bottom:10px">音效试听</h3>
      <div class="chips" id="sfx">
        ${["key", "button", "correct", "wrong", "submit", "star", "collect", "unlock", "complete"].map((s) => `<span class="chip" data-sfx="${s}">${s}</span>`).join("")}
      </div>
    </div>

    <div class="card">
      <h3 style="margin-bottom:10px">动物（点击直接查看 3D，无需解锁）</h3>
      ${TIERS.map((t) => {
        const list = ANIMALS.filter((x) => x.tier === t.id);
        return `<div class="tier-title" style="margin:12px 0 6px"><span class="badge ${t.cls}">${t.label}</span><span class="line"></span></div>
          <div class="chips">${list
            .map((x) => `<span class="chip ${a.ownedAnimals.includes(x.id) ? "on" : ""}" data-3d="${x.id}">${x.emoji} ${x.name}</span>`)
            .join("")}</div>`;
      }).join("")}
    </div>
  `;
  mountScreen(wrap);

  function setStars(n) {
    commit((s) => { s.accounts.find((x) => x.id === a.id).stars = Math.max(0, Math.floor(n)); });
    render();
  }
  function unlockIds(ids) {
    commit((s) => {
      const acc = s.accounts.find((x) => x.id === a.id);
      for (const id of ids) if (!acc.ownedAnimals.includes(id)) acc.ownedAnimals.push(id);
    });
    render();
  }

  wrap.querySelector("#stars").addEventListener("click", (e) => {
    const c = e.target.closest("[data-add],[data-set]");
    if (!c) return;
    sfx("button");
    if (c.dataset.add) setStars(a.stars + Number(c.dataset.add));
    else setStars(Number(c.dataset.set));
  });
  wrap.querySelector("#star-custom-set").addEventListener("click", () => {
    setStars(Number(wrap.querySelector("#star-custom").value || 0));
  });

  wrap.querySelector("#coll").addEventListener("click", (e) => {
    const c = e.target.closest("[data-act]");
    if (!c) return;
    sfx("button");
    const act = c.dataset.act;
    if (act === "unlock-all") unlockIds(ANIMALS.map((x) => x.id));
    else if (act === "lock-all") { commit((s) => { s.accounts.find((x) => x.id === a.id).ownedAnimals = []; }); render(); }
    else if (act === "unlock-tier") unlockIds(ANIMALS.filter((x) => x.tier === c.dataset.tier).map((x) => x.id));
  });

  wrap.querySelector("#model-src").addEventListener("click", (e) => {
    const c = e.target.closest("[data-act]");
    if (!c) return;
    sfx("button");
    const act = c.dataset.act;
    if (act === "src-glb") { setGlbOverride(true); toast("已切到 glTF 模型"); }
    else if (act === "src-proc") { setGlbOverride(false); toast("已切到程序化模型（兵底路径）"); }
    else if (act === "src-default") { setGlbOverride(null); toast("已恢复默认"); }
    render();
  });

  wrap.querySelector("#misc").addEventListener("click", async (e) => {
    const c = e.target.closest("[data-act]");
    if (!c) return;
    sfx("button");
    const act = c.dataset.act;
    if (act === "reset-today") { resetTodaySession(); toast("今天的进度已重置"); }
    else if (act === "complete-today") {
      const cfg = getConfig(a);
      const t = totalStars(cfg);
      commit((s) => {
        const acc = s.accounts.find((x) => x.id === a.id);
        acc.sessions[todayKey()] = {
          date: todayKey(), completed: true, config: cfg,
          starsEarned: t, questions: [], queue: [], pos: 0, round: 1, correctIds: [],
          firstTryCorrect: 0, attempts: {}, pendingStars: t, totalTimeMs: 0,
        };
        acc.stars += t;
      });
      toast(`已标记今天完成 +${t}⭐`);
      render();
    } else if (act === "parent") {
      go("parent");
    } else if (act === "export") exportBackup();
    else if (act === "import") wrap.querySelector("#dev-import").click();
    else if (act === "clear") {
      if (confirm("确定清空全部数据？")) { clearState(); location.reload(); }
    } else if (act === "unreg-sw") {
      if ("serviceWorker" in navigator) { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map((r) => r.unregister())); }
      location.reload();
    }
  });
  wrap.querySelector("#dev-import").addEventListener("change", async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try { await importBackup(f); toast("导入成功"); location.reload(); }
    catch { toast("导入失败"); }
  });

  wrap.querySelector("#sfx").addEventListener("click", (e) => {
    const c = e.target.closest("[data-sfx]");
    if (c) sfx(c.dataset.sfx);
  });

  wrap.querySelectorAll("[data-3d]").forEach((c) =>
    c.addEventListener("click", () => {
      const animal = animalById(c.dataset["3d"]);
      if (animal) openAnimal3D(animal);
    })
  );
}
