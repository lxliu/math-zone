// 答题页：数字键盘 + 星星罐（暂存）+ 错题循环；计时全程隐藏
import { mountScreen, toast, modal } from "../ui.js";
import { go } from "../router.js";
import { currentAccount } from "../store.js";
import { getConfig, totalQuestions } from "../config.js";
import { play as sfx, unlockAudio } from "../audio.js";
import { createKeypad } from "../keypad.js";
import {
  startOrResume, currentQuestion, submitAnswer, advance, addTime,
  gameState, dayTarget, todaySession, resetTodaySession,
} from "../game.js";
import { confetti } from "../anim.js";

let keypadComp = null;
let problemStart = 0;
let input = "";
let locked = false;

export function render() {
  unlockAudio();
  const existing = todaySession();
  if (existing?.completed) {
    toast("今天已经完成啦，明天再来～");
    go("today");
    return;
  }
  if (totalQuestions(getConfig(currentAccount())) === 0) {
    toast("家长还没配置题量");
    go("today");
    return;
  }

  const s = startOrResume();
  input = "";
  locked = false;
  problemStart = Date.now();

  cleanup();

  const wrap = document.createElement("div");
  wrap.className = "screen play-wrap";
  wrap.innerHTML = `
    <div class="play-head">
      <span class="pill" id="p-round">第 1 轮</span>
      <span class="pill" id="p-count">第 1/${s.queue.length} 题</span>
      <span class="spacer"></span>
      <span class="pill" id="p-jar"></span>
    </div>
    <div class="progress"><i id="p-bar"></i></div>
    <div class="play-split">
      <div class="play-left">
        <div class="problem" id="p-problem">…</div>
        <div class="answer-display" id="p-answer"> </div>
        <div class="muted" id="p-hint" style="min-height:22px"></div>
      </div>
      <div class="play-right" id="p-keypad"></div>
    </div>
  `;
  mountScreen(wrap, { fullBleed: true });

  keypadComp = createKeypad({ onInput, onDelete, onSubmit });
  wrap.querySelector("#p-keypad").appendChild(keypadComp);
  document.addEventListener("pause-game", onPause);

  paint();
}

export function cleanup() {
  if (keypadComp) { keypadComp.destroy?.(); keypadComp = null; }
  document.removeEventListener("pause-game", onPause);
}

function onInput(ch) {
  if (locked) return;
  if (ch === "." && input.includes(".")) return;
  if (input.length >= 8) return;
  input += ch;
  updateAnswer();
}

function onDelete() {
  if (locked) return;
  input = input.slice(0, -1);
  updateAnswer();
}

function updateAnswer() {
  const a = document.querySelector("#p-answer");
  if (a) a.textContent = input || " ";
}

function onSubmit() {
  if (locked) return;
  if (input === "") return;
  const now = Date.now();
  addTime(now - problemStart);
  problemStart = now;

  const res = submitAnswer(Number(input));
  locked = true;
  const ansEl = document.querySelector("#p-answer");
  const hint = document.querySelector("#p-hint");
  if (res.correct) {
    ansEl.classList.add("correct");
    hint.textContent = "🎉 答对啦！";
    sfx("correct");
    confetti(14);
    setTimeout(afterAnswer, 620);
  } else {
    ansEl.classList.add("wrong");
    hint.textContent = "再想想～";
    sfx("wrong");
    setTimeout(afterAnswer, 950);
  }
}

function afterAnswer() {
  input = "";
  locked = false;
  const step = advance();
  if (step.type === "next") {
    problemStart = Date.now();
    paint();
  } else if (step.type === "round") {
    showRound(step.remaining);
  } else {
    finish();
  }
}

function paint() {
  const s = gameState.session;
  const q = currentQuestion();
  if (!q) { finish(); return; }
  const wrap = document.querySelector(".play-wrap");
  if (!wrap) return;
  wrap.querySelector("#p-round").textContent = s.round > 1 ? `重做第 ${s.round - 1} 轮` : "第 1 轮";
  wrap.querySelector("#p-count").textContent = `第 ${s.pos + 1}/${s.queue.length} 题`;
  const isEq = q.type === 7 || q.type === 8;
  const problemText = isEq ? q.text : `${q.text} = ?`;
  const pEl = wrap.querySelector("#p-problem");
  pEl.textContent = problemText;
  pEl.className = "problem" + (problemText.length > 16 ? " long" : "");
  const ansEl = wrap.querySelector("#p-answer");
  ansEl.textContent = " ";
  ansEl.className = "answer-display";
  wrap.querySelector("#p-hint").textContent = isEq ? "求 x = ?" : "";

  const target = dayTarget();
  const pct = target ? Math.min(100, Math.round((s.pendingStars / target) * 100)) : 0;
  wrap.querySelector("#p-jar").innerHTML =
    `<span class="starjar">⭐ <b>${s.pendingStars}</b><span class="jar"><i style="height:${pct}%"></i></span></span>`;
  wrap.querySelector("#p-bar").style.width = (s.queue.length ? (s.pos / s.queue.length) * 100 : 0) + "%";
}

function showRound(remaining) {
  modal({
    title: "🔄 再挑战一次",
    bodyHtml: `<p class="muted">还有 <b>${remaining}</b> 道题需要重做，全部做对才能收集今天的幸运星哦～</p>`,
    actions: [{ label: "继续", kind: "green", onClick: () => { problemStart = Date.now(); paint(); } }],
  });
}

function onPause() {
  if (locked) return;
  addTime(Date.now() - problemStart);
  modal({
    title: "⏸ 暂停",
    bodyHtml: `<p class="muted">进度已自动保存，随时可以回来继续。</p>`,
    actions: [
      { label: "继续做题", kind: "green", onClick: () => { problemStart = Date.now(); } },
      { label: "重新开始", kind: "ghost", onClick: () => { cleanup(); resetTodaySession(); render(); } },
      { label: "回主页", kind: "ghost", onClick: () => go("today") },
    ],
  });
}

function finish() {
  cleanup();
  go("result");
}
