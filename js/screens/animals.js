// 动物（商店 + 图鉴 合并）：解锁仪式 + 悬浮自转 3D 查看
import { mountScreen, toast, modal } from "../ui.js";
import { currentAccount } from "../store.js";
import { TIERS, animalsByTier, animalSrc, animalFullSrc, animalById, tierClass, tierThemeClass, TOTAL_ANIMALS } from "../animals.js";
import { play as sfx } from "../audio.js";
import { tryUnlock } from "../shop.js";
import { confetti } from "../anim.js";
import { el } from "../utils.js";
import { open3DModel } from "../threeViewer.js";

export function render() {
  const a = currentAccount();
  const wrap = document.createElement("div");
  wrap.className = "screen";

  const sections = TIERS.map((t) => {
    const list = animalsByTier(t.id);
    const owned = list.filter((x) => a.ownedAnimals.includes(x.id)).length;
    const head = `
        <div class="tier-title">
          <span class="badge ${t.cls}">${t.label}</span>
          <span class="muted">${owned}/${list.length}</span>
          <span class="line"></span>
        </div>`;
    // 空档位（例如还没加动物的「神话」）给一个占位块，而不是 0/0 的空网格
    if (!list.length) {
      return `
      <div class="tier-section">
        ${head}
        <div class="tier-empty">
          <div class="tier-empty-ic">🔮</div>
          <div class="tier-empty-t">这一档还空着</div>
          <div class="tier-empty-s">只有传说中的神兽才配得上「${t.label}」</div>
          <div class="tier-empty-s">敬请期待 ✨</div>
        </div>
      </div>`;
    }
    const cards = list.map((animal) => animalCard(animal, a)).join("");
    return `
      <div class="tier-section">
        ${head}
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
        openAnimal3D(animal);
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
                openAnimal3D(animal, { cheer: true }); // 翻牌后自动进入 3D 并跳一段庆祝动作
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
  // 修复：已解锁不再叠加 locked（否则命中灰度滤镜变黑白）
  // 等级主题（背景/纹理/边框）**所有卡都加**，未解锁也能看出档次
  const cls = ["animal-card", tierThemeClass(animal.tier), owned ? `owned ${tierClass(animal.tier)}` : "locked"].join(" ");
  const tier = TIERS.find((t) => t.id === animal.tier);
  return `
    <div class="${cls}" data-animal="${animal.id}">
      <span class="badge ${tier.cls} tier">${tier.label}</span>
      ${owned ? `<span class="badge check">✓</span>` : `<span class="badge price">${animal.price}⭐</span>`}
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

/* ---------------- 解锁仪式（优先全身图） ---------------- */
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
      <div class="reveal-card ${animal.tier} ${tierThemeClass(animal.tier)}">
        <div class="reveal-face reveal-back">🎁</div>
        <div class="reveal-face reveal-front"><img class="reveal-img" alt="${animal.name}"></div>
      </div>
    </div>
    <div style="margin-top:12px"><span class="badge ${tier.cls}">${tier.label}</span></div>
    <div style="font-size:24px;font-weight:900;margin-top:8px">${animal.name}</div>
    <div style="margin-top:16px"><button class="btn green" id="take">收下它！</button></div>
  `;
  backdrop.appendChild(box);
  root.appendChild(backdrop);

  const img = box.querySelector(".reveal-img");
  img.onerror = () => { if (!img.dataset.fb) { img.dataset.fb = "1"; img.src = animalSrc(animal.id); } };
  img.src = animalFullSrc(animal.id);

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

/* ---------------- 真 3D 优先；无模型则回退悬浮自转 ---------------- */
export async function openAnimal3D(animal, opts) {
  const ok = await open3DModel(animal, opts);
  if (!ok) open3DFloat(animal);
}

function open3DFloat(animal) {
  const tier = TIERS.find((t) => t.id === animal.tier);
  const root = document.getElementById("overlay-root");
  const backdrop = el("div", "backdrop");
  const box = el("div", "viewer");
  box.classList.add(tierThemeClass(animal.tier), "float-viewer");
  box.innerHTML = `
    <button class="viewer-close btn ghost sm">✕</button>
    <div class="float-stage">
      <div class="float-glow ${animal.tier}"></div>
      <div class="float-obj"><img class="float-img" alt="${animal.name}"></div>
      <div class="float-shadow"></div>
      <div class="float-sparks">${Array.from({ length: 6 }).map((_, i) => `<i style="--i:${i}"></i>`).join("")}</div>
    </div>
    <div class="viewer-name">${animal.name} <span class="badge ${tier.cls}">${tier.label}</span></div>
    <div class="viewer-ctrls">
      <button class="btn ghost sm" data-act="out">－</button>
      <button class="btn ghost sm" data-act="reset">↺ 重置</button>
      <button class="btn ghost sm" data-act="in">＋</button>
    </div>
  `;
  backdrop.appendChild(box);
  root.appendChild(backdrop);

  const img = box.querySelector(".float-img");
  img.onerror = () => { if (!img.dataset.fb) { img.dataset.fb = "1"; img.src = animalSrc(animal.id); } };
  img.src = animalFullSrc(animal.id);

  const obj = box.querySelector(".float-obj");
  const shadow = box.querySelector(".float-shadow");
  const sparkBox = box.querySelector(".float-sparks");

  let angle = 0, tilt = -8, scale = 1, velocity = 40; // 初始 40°/s
  const AUTO = 40;
  let dragging = false, lastX = 0, lastY = 0, lastT = 0, raf = 0, last = performance.now();

  function apply() {
    obj.style.transform = `rotateX(${tilt}deg) rotateY(${angle}deg) scale(${scale})`;
    const k = Math.abs(Math.cos((angle * Math.PI) / 180));
    shadow.style.transform = `scaleX(${0.55 + 0.45 * k})`;
    shadow.style.opacity = String(0.22 + 0.22 * k);
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!dragging) {
      velocity += (AUTO - velocity) * Math.min(1, dt * 1.6);
      angle += velocity * dt;
    }
    apply();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  obj.addEventListener("pointerdown", (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
    obj.setPointerCapture?.(e.pointerId);
  });
  obj.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    angle += dx * 0.8;
    tilt = Math.max(-42, Math.min(42, tilt - dy * 0.5));
    const dt = Math.max(8, now - lastT) / 1000;
    velocity = Math.max(-320, Math.min(320, (dx * 0.8) / dt));
    lastX = e.clientX; lastY = e.clientY; lastT = now;
  });
  const stop = () => { dragging = false; };
  obj.addEventListener("pointerup", stop);
  obj.addEventListener("pointercancel", stop);
  obj.addEventListener("pointerleave", stop);

  box.querySelector(".float-stage").addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.5, Math.min(2.2, scale - e.deltaY * 0.001));
  }, { passive: false });

  const close = () => { cancelAnimationFrame(raf); backdrop.remove(); };
  box.querySelector(".viewer-close").addEventListener("click", close);
  box.querySelector('[data-act="in"]').addEventListener("click", () => { scale = Math.min(2.2, scale + 0.15); });
  box.querySelector('[data-act="out"]').addEventListener("click", () => { scale = Math.max(0.5, scale - 0.15); });
  box.querySelector('[data-act="reset"]').addEventListener("click", () => { angle = 0; tilt = -8; scale = 1; velocity = AUTO; });
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });

  sfx("star");
  confetti(26);
}
