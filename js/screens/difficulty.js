// 难度选择
import { mountScreen } from "../ui.js";
import { go } from "../router.js";
import { DIFFICULTIES } from "../scoring.js";
import { play } from "../audio.js";
import { gameState, setDifficulty } from "../game.js";

export function render() {
  let selected = gameState.difficulty || "mixed";

  const wrap = document.createElement("div");
  wrap.className = "screen";
  wrap.innerHTML = `
    <h1 class="center" style="font-size:26px;margin:8px 0 18px">选择今天的难度</h1>
    <div class="diff-grid" id="grid">
      ${DIFFICULTIES.map(
        (d) => `
        <div class="diff-card ${d.mixed ? "mixed" : ""}" data-id="${d.id}">
          <div class="name">${d.name}</div>
          <div class="desc">${d.desc}</div>
          <div class="stars">${d.mixed ? "共 70 ⭐" : `每题 ${d.perQuestion} ⭐ · 共 ${d.perQuestion * 20} ⭐`}</div>
        </div>`
      ).join("")}
    </div>
    <div class="diff-actions"><button class="btn green" id="go">开始 →</button></div>
  `;
  mountScreen(wrap);

  const cards = Array.from(wrap.querySelectorAll(".diff-card"));
  const paint = () => cards.forEach((c) => c.classList.toggle("selected", String(c.dataset.id) === String(selected)));
  paint();

  cards.forEach((c) =>
    c.addEventListener("click", () => { play("button"); selected = c.dataset.id; paint(); })
  );

  wrap.querySelector("#go").addEventListener("click", () => {
    play("button");
    setDifficulty(selected);
    go("play");
  });
}
