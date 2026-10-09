// 动物（商店 + 图鉴 合并）：解锁仪式 + 3D 查看
import { mountScreen, toast, modal } from "../ui.js";
import { currentAccount } from "../store.js";
import { TIERS, animalsByTier, animalSrc, animalById, TOTAL_ANIMALS } from "../animals.js";
import { play as sfx } from "../audio.js";
import { tryUnlock } from "../shop.js";
import { confetti } from "../anim.js";
import { el } from "../utils.js";

export function render() {
  const a = currentAccount();
  const wrap = document.createElement("div");
  wrap.className = "screen";

  const sections = TIERS.map((t) => {
    const list = animalsByTier(t.id);
    const owned = list.filter((x) => a.ownedAnimals.includes(x.id)).length;
    const cards = list.map((animal) => animalCard(animal, a)).join("");
    return `
      <div class="tier-section">
        <div class="tier-title">
          <span class="badge ${t.cls}">${t.label}</span>
          <span class="muted">${owned}/${list.length}</span>
          <span class="line"></span>
        </div>
        <div class="animal-grid">${cards}</div>
      </div>`;
  }).join("");

  wrap.innerHTML = `
    <div class="card" style="margin-bottom:16px">
      <div class="row">
        <h1 style="font-size:24px">动物图鉴</h1>
        <span class="spacer"></span>
        <span class="pill star">⭐ ${a.stars}</span>
        <span class="pill">🐾 ${a.ownedAnimals.length}/${TOTAL_ANIMALS}</span>
      </div>
    </div>
    ${sections}
  `;
  mountScreen(wrap);
  hydratePics(wrap);

  wrap.querySelectorAll("[data-animal]").forEach((node) => {
    node.addEventListener("click", async () => {
      const animal = animalById(node.dataset.animal);
      if (!animal) return;

      if (a.ownedAnimals.includes(animal.id)) {
        sfx("button");
        open3D(animal);
        return;
      }
      if (a.stars < animal.price) {
        sfx("wrong");
        toast(`还差 ${animal.price - a.stars} ⭐ 才能解锁 ${animal.name}`);
        return;
      }
      modal({
        title: `解锁 ${animal.name}？`,
        bodyHtml: `<p class="muted">将花费 <b>${animal.price} ⭐</b> 幸运星。解锁后永久拥有，可作头像、可 3D 查看。</p>`,
        actions: [
          { label: "取消", kind: "ghost" },
          {
            label: `解锁 (${animal.price}⭐)`,
            kind: "green",
            close: false,
            onClick: async (close) => {
              close();
              if (tryUnlock(a.id, animal.id)) {
                await unlockRitual(animal);
                render();
              }
            },
          },
        ],
      });
    });
  });
}

function animalCard(animal, account) {
  const owned = account.ownedAnimals.includes(animal.id);
  const affordable = !owned && account.stars >= animal.price;
  const cls = ["animal-card", owned ? "owned" : "", affordable ? "affordable" : "locked"].join(" ");
  const tier = TIERS.find((t) => t.id === animal.tier);
  return `
    <div class="${cls}" data-animal="${animal.id}">
      <span class="badge ${tier.cls} tier">${tier.label}</span>
      ${owned ? "" : `<span class="badge price" style="background:#FFC107;color:#6b5200">${animal.price}⭐</span>`}
      <div class="pic" data-emoji="${animal.emoji}"></div>
      <div class="nm">${animal.name}</div>
    </div>`;
}

function hydratePics(scope) {
  scope.querySelectorAll(".animal-card .pic").forEach((pic) => {
    const id = pic.closest("[data-animal]").dataset.animal;
    const img = new Image();
    img.className = "animal-img";
    img.style.width = "100%";
    img.style.aspectRatio = "1";
    img.style.objectFit = "contain";
    img.alt = "";
    img.onload = () => { pic.innerHTML = ""; pic.appendChild(img); };
    img.onerror = () => { pic.style.fontSize = "52px"; pic.textContent = pic.dataset.emoji; };
    img.src = animalSrc(id);
  });
}

/* ---------------- 解锁仪式 ---------------- */
function unlockRitual(animal) {
  const tier = TIERS.find((t) => t.id === animal.tier);
  const root = document.getElementById("overlay-root");
  const backdrop = el("div", "backdrop");
  const box = el("div", "modal");
  box.style.width = "min(460px, 92vw)";
  box.style.textAlign = "center";
  box.innerHTML = `
    <h2 style="font-size:22px;margin-bottom:6px">✨ 新动物！</h2>
    <div class="reveal-stage">
      <div class="reveal-card ${animal.tier}">
        <div class="reveal-face reveal-back">🎁</div>
        <div class="reveal-face reveal-front"><img src="${animalSrc(animal.id)}" alt=""></div>
      </div>
    </div>
    <div style="margin-top:12px"><span class="badge ${tier.cls}">${tier.label}</span></div>
    <div style="font-size:24px;font-weight:900;margin-top:8px">${animal.name}</div>
    <div style="margin-top:16px"><button class="btn green" id="take">收下它！</button></div>
  `;
  backdrop.appendChild(box);
  root.appendChild(backdrop);

  sfx("unlock");
  const card = box.querySelector(".reveal-card");
  setTimeout(() => { card.classList.add("flipped"); confetti(56); }, 420);

  return new Promise((resolve) => {
    box.querySelector("#take").addEventListener("click", () => {
      sfx("button");
      backdrop.remove();
      resolve();
    });
  });
}

/* ---------------- 3D 查看 ---------------- */
function open3D(animal) {
  const root = document.getElementById("overlay-root");
  const backdrop = el("div", "backdrop");
  const box = el("div", "viewer");
  box.innerHTML = `
    <button class="viewer-close btn ghost sm">✕</button>
    <div class="viewer-stage"><div class="viewer-obj"><img src="${animalSrc(animal.id)}" alt=""></div></div>
    <div class="viewer-name">${animal.name}</div>
    <div class="viewer-ctrls">
      <button class="btn ghost sm" data-act="out">－</button>
      <button class="btn ghost sm" data-act="reset">↺ 重置</button>
      <button class="btn ghost sm" data-act="in">＋</button>
    </div>
  `;
  backdrop.appendChild(box);
  root.appendChild(backdrop);

  const obj = box.querySelector(".viewer-obj");
  let rx = -12, ry = 0, scale = 1;
  const apply = () => { obj.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`; };
  apply();

  let dragging = false, lastX = 0, lastY = 0;
  obj.addEventListener("pointerdown", (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    obj.classList.add("dragging"); obj.setPointerCapture?.(e.pointerId);
  });
  obj.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    ry += (e.clientX - lastX) * 0.6;
    rx = Math.max(-70, Math.min(70, rx - (e.clientY - lastY) * 0.6));
    lastX = e.clientX; lastY = e.clientY;
    apply();
  });
  const stop = () => { dragging = false; obj.classList.remove("dragging"); };
  obj.addEventListener("pointerup", stop);
  obj.addEventListener("pointercancel", stop);
  obj.addEventListener("pointerleave", stop);

  box.querySelector(".viewer-stage").addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.5, Math.min(2.2, scale - e.deltaY * 0.001));
    apply();
  }, { passive: false });

  box.querySelector(".viewer-close").addEventListener("click", () => backdrop.remove());
  box.querySelector('[data-act="in"]').addEventListener("click", () => { scale = Math.min(2.2, scale + 0.15); apply(); });
  box.querySelector('[data-act="out"]').addEventListener("click", () => { scale = Math.max(0.5, scale - 0.15); apply(); });
  box.querySelector('[data-act="reset"]').addEventListener("click", () => { rx = -12; ry = 0; scale = 1; apply(); });
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) backdrop.remove(); });
}
