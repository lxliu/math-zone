// 账号创建
import { mountScreen, toast } from "../ui.js";
import { go, routePath } from "../router.js";
import { currentAccount } from "../store.js";
import { KID_AVATARS, avatarSrc, createAccount } from "../accounts.js";
import { play, unlockAudio } from "../audio.js";

export function render() {
  const isNew = routePath() === "setup/new" && !!currentAccount();
  const wrap = document.createElement("div");
  wrap.className = "screen";
  wrap.innerHTML = `
    <div class="card" style="max-width:720px;margin:24px auto">
      <h1 class="center" style="font-size:30px;margin-bottom:6px">${isNew ? "新建账号" : "欢迎来到幸运星计算乐园"}</h1>
      <p class="center muted" style="margin-bottom:22px">${isNew ? "再创建一个小朋友的档案吧" : "先创建一个档案吧"} 🦊</p>
      <div class="field"><label>名字</label>
        <input class="input" id="f-name" maxlength="10" placeholder="输入名字" autocomplete="off">
      </div>
      <div class="field"><label>性别</label>
        <div class="chips" id="f-gender">
          <span class="chip on" data-v="boy">👦 男孩</span>
          <span class="chip" data-v="girl">👧 女孩</span>
        </div>
      </div>
      <div class="field"><label>选择头像</label>
        <div class="chips" id="f-avatar">
          ${KID_AVATARS.map(
            (a, i) => `<div class="avatar-choice ${i === 0 ? "on" : ""}" data-v="${a.id}"><img src="${avatarSrc(a.id)}" alt="${a.name}"></div>`
          ).join("")}
        </div>
      </div>
      <button class="btn block" id="f-create">${isNew ? "创建账号 →" : "开始冒险 →"}</button>
      ${isNew ? `<button class="btn ghost block" id="f-back" style="margin-top:10px">返回</button>` : ""}
    </div>
  `;
  mountScreen(wrap);

  const sel = { gender: "boy", avatarId: "kid-boy" };
  wireChips(wrap.querySelector("#f-gender"), (v) => { sel.gender = v; });
  wireChips(wrap.querySelector("#f-avatar"), (v) => { sel.avatarId = v; });

  wrap.querySelector("#f-create").addEventListener("click", () => {
    unlockAudio();
    play("button");
    const name = wrap.querySelector("#f-name").value.trim();
    if (!name) { toast("请先输入名字"); wrap.querySelector("#f-name").focus(); return; }
    createAccount({
      name,
      gender: sel.gender,
      avatarId: sel.avatarId,
    });
    play("complete");
    toast(`欢迎，${name}！`);
    go("today");
  });
  wrap.querySelector("#f-back")?.addEventListener("click", () => { play("button"); go("today"); });
}

function wireChips(container, onPick) {
  container.querySelectorAll(".chip, .avatar-choice").forEach((c) => {
    c.addEventListener("click", () => {
      play("button");
      container.querySelectorAll(".chip, .avatar-choice").forEach((x) => x.classList.remove("on"));
      c.classList.add("on");
      onPick(c.dataset.v);
    });
  });
}
