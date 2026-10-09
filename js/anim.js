// 动画助手：彩带 / 飞星 / 数字滚动
import { el } from "./utils.js";

const STYLE_ID = "anim-styles";
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
  .confetti-layer{position:fixed;inset:0;pointer-events:none;z-index:70;overflow:hidden}
  .confetti-bit{position:absolute;top:-20px;width:10px;height:16px;border-radius:2px;will-change:transform}
  .fly-star{position:fixed;z-index:75;pointer-events:none;font-size:28px;will-change:transform,opacity}
  `;
  document.head.appendChild(s);
}
injectStyles();

export function confetti(count = 48, colors = ["#FFC107", "#FF9F43", "#4CAF50", "#42A5F5", "#AB47BC", "#F06292"]) {
  const layer = el("div", "confetti-layer");
  document.getElementById("overlay-root")?.appendChild(layer);
  for (let i = 0; i < count; i++) {
    const bit = el("div", "confetti-bit");
    bit.style.left = Math.random() * 100 + "vw";
    bit.style.background = colors[i % colors.length];
    layer.appendChild(bit);
    const dx = (Math.random() - 0.5) * 200;
    const dur = 1100 + Math.random() * 900;
    bit.animate(
      [
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        { transform: `translate(${dx}px, ${window.innerHeight + 60}px) rotate(${Math.random() * 720 - 360}deg)`, opacity: 1 },
      ],
      { duration: dur, delay: Math.random() * 250, easing: "cubic-bezier(.3,.7,.6,1)" }
    ).onfinish = () => bit.remove();
  }
  setTimeout(() => layer.remove(), 2400);
}

// 从 fromEl 的位置飞出若干星星到 toEl
export function flyStars(fromEl, toEl, count = 12) {
  if (!fromEl || !toEl) return;
  const from = fromEl.getBoundingClientRect();
  const to = toEl.getBoundingClientRect();
  const startX = from.left + from.width / 2;
  const startY = from.top + from.height / 2;
  const endX = to.left + to.width / 2;
  const endY = to.top + to.height / 2;
  for (let i = 0; i < count; i++) {
    const s = el("div", "fly-star", "⭐");
    s.style.left = startX - 14 + "px";
    s.style.top = startY - 14 + "px";
    document.getElementById("overlay-root")?.appendChild(s);
    const jx = (Math.random() - 0.5) * 120;
    const jy = (Math.random() - 0.5) * 80;
    s.animate(
      [
        { transform: "translate(0,0) scale(.8)", opacity: 1 },
        { transform: `translate(${jx}px, ${jy}px) scale(1.2)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(.5)`, opacity: 0.2 },
      ],
      { duration: 700, delay: i * 45, easing: "cubic-bezier(.4,0,.6,1)" }
    ).onfinish = () => s.remove();
  }
}

export function countUp(node, from, to, duration = 700) {
  if (!node) return;
  const start = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    node.textContent = Math.round(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
