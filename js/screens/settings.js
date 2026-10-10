// 设置：账号 / 头像 / 声音 / 备份
import { mountScreen, toast, openAccountSwitch, renderNavbar } from "../ui.js";
import { currentAccount, commit } from "../store.js";
import { KID_AVATARS, avatarSrc } from "../accounts.js";
import { play, setSoundEnabled, setVolume } from "../audio.js";
import { exportBackup, importBackup } from "../backup.js";
import { animalById } from "../animals.js";
import { APP_VERSION } from "../constants.js";
import { go } from "../router.js";
import { isDevEnabled } from "../dev.js";
import { promptDevPassword } from "./dev.js";
import { promptParentPassword } from "./parent.js";

export function render() {
  const a = currentAccount();
  const avatarOptions = [
    ...KID_AVATARS.map((k) => ({ id: k.id, name: k.name })),
    ...a.ownedAnimals.map((id) => ({ id, name: animalById(id)?.name || id })),
  ];

  const wrap = document.createElement("div");
  wrap.className = "screen";
  wrap.innerHTML = `
    <div class="card" style="margin-bottom:16px">
      <div class="row">
        <span class="avatar" style="width:64px;height:64px"><img id="me-avatar" src="${avatarSrc(a.avatarId)}" alt=""></span>
        <div>
          <div style="font-size:22px;font-weight:900">${a.name}</div>
          <div class="muted">${a.gender === "girl" ? "女孩" : "男孩"}</div>
        </div>
        <span class="spacer"></span>
        <button class="btn ghost sm" id="switch">切换账号</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="field"><label>头像</label>
        <div class="chips" id="avatars">
          ${avatarOptions
            .map(
              (o) =>
                `<div class="avatar-choice ${o.id === a.avatarId ? "on" : ""}" data-v="${o.id}" title="${o.name}">
                   <img src="${avatarSrc(o.id)}" alt="${o.name}"></div>`
            )
            .join("")}
        </div>
        <p class="muted" style="margin-top:8px">解锁新动物后，它会出现在这里，可作为头像。</p>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="field"><label>声音</label>
        <div class="chips">
          <span class="chip ${a.settings.sound ? "on" : ""}" id="sound-toggle">${a.settings.sound ? "🔊 开启" : "🔇 关闭"}</span>
        </div>
      </div>
      <div class="field">
        <label>音量 <span id="vol-val">${Math.round((a.settings.volume ?? 0.7) * 100)}%</span></label>
        <input id="volume" type="range" min="0" max="100" value="${Math.round((a.settings.volume ?? 0.7) * 100)}" style="width:100%">
      </div>
    </div>

    <div class="card">
      <div class="field"><label>数据备份</label>
        <div class="row">
          <button class="btn ghost sm" id="export">导出备份</button>
          <button class="btn ghost sm" id="import">导入备份</button>
          <input type="file" id="import-file" accept="application/json" hidden>
        </div>
        <p class="muted" style="margin-top:8px">iPad 本地存储可能被系统清理，建议定期导出备份。</p>
      </div>
    </div>
    <p class="muted center" style="margin-top:6px;font-size:13px">应用版本 v${APP_VERSION}</p>
    <button class="btn ghost block" id="parent-btn" style="margin-top:12px">👨‍👩‍👧 家长设置</button>
    ${isDevEnabled() ? `<button class="btn ghost block" id="dev-btn" style="margin-top:10px">🛠 调试</button>` : ""}
  `;
  mountScreen(wrap);

  wrap.querySelector("#switch").addEventListener("click", () => { play("button"); openAccountSwitch(); });
  wrap.querySelector("#parent-btn").addEventListener("click", () => { play("button"); promptParentPassword(() => go("parent")); });
  wrap.querySelector("#dev-btn")?.addEventListener("click", () => { play("button"); promptDevPassword(() => go("dev")); });

  wrap.querySelectorAll("#avatars .avatar-choice").forEach((c) =>
    c.addEventListener("click", () => {
      play("button");
      const id = c.dataset.v;
      commit((s) => { const acc = s.accounts.find((x) => x.id === a.id); acc.avatarId = id; });
      wrap.querySelectorAll("#avatars .avatar-choice").forEach((x) => x.classList.remove("on"));
      c.classList.add("on");
      // 立即生效：本页顶部的大头像 + 顶栏头像
      //（顶栏只在路由切换时重绘，所以这里必须主动调一次 renderNavbar）
      const meImg = wrap.querySelector("#me-avatar");
      if (meImg) meImg.src = avatarSrc(id);
      renderNavbar();
      toast("头像已更新");
    })
  );

  const toggle = wrap.querySelector("#sound-toggle");
  toggle.addEventListener("click", () => {
    const on = !a.settings.sound;
    commit((s) => { s.accounts.find((x) => x.id === a.id).settings.sound = on; });
    setSoundEnabled(on);
    toggle.classList.toggle("on", on);
    toggle.textContent = on ? "🔊 开启" : "🔇 关闭";
    if (on) play("button");
  });

  const vol = wrap.querySelector("#volume");
  vol.addEventListener("input", () => {
    const v = Number(vol.value) / 100;
    wrap.querySelector("#vol-val").textContent = Math.round(v * 100) + "%";
    setVolume(v);
    commit((s) => { s.accounts.find((x) => x.id === a.id).settings.volume = v; });
  });

  wrap.querySelector("#export").addEventListener("click", () => { play("button"); exportBackup(); toast("已导出备份文件"); });
  wrap.querySelector("#import").addEventListener("click", () => wrap.querySelector("#import-file").click());
  wrap.querySelector("#import-file").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importBackup(file);
      play("complete");
      toast("导入成功");
      location.hash = "#/today";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    } catch (err) {
      play("wrong");
      toast("导入失败：文件格式不正确");
    }
  });
}
