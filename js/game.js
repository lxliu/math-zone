// 每日会话状态机：出题 / 计分 / 错题循环 / 续做
import { currentAccount, commit } from "./store.js";
import { todayKey, answersEqual } from "./utils.js";
import { buildQuestions } from "./questions/index.js";
import { dayTotalStars } from "./scoring.js";
import { QUESTIONS_PER_DAY } from "./constants.js";

export const gameState = {
  difficulty: "mixed",
  session: null,
  lastResult: null,
};

export function setDifficulty(d) { gameState.difficulty = d; }
export function getDifficulty() { return gameState.difficulty; }

export function todaySession() {
  const a = currentAccount();
  return (a && a.sessions[todayKey()]) || null;
}

export function dayTarget() { return dayTotalStars(gameState.difficulty); }

// 放弃/重新开始：删除今天会话
export function resetTodaySession() {
  const a = currentAccount();
  if (!a) return;
  const key = todayKey();
  commit((st) => {
    const acc = st.accounts.find((x) => x.id === a.id);
    if (acc) delete acc.sessions[key];
  });
  gameState.session = null;
}

function persistSession() {
  const a = currentAccount();
  const s = gameState.session;
  if (!a || !s) return;
  commit((st) => {
    const acc = st.accounts.find((x) => x.id === a.id);
    if (acc) acc.sessions[s.date] = s;
  });
}

// 开始或恢复今天的会话
export function startOrResume() {
  const a = currentAccount();
  const key = todayKey();
  const existing = a?.sessions?.[key];
  if (existing && !existing.completed && Array.isArray(existing.questions)) {
    gameState.session = existing;
    gameState.difficulty = existing.difficulty;
    return existing;
  }
  const qs = buildQuestions(gameState.difficulty, QUESTIONS_PER_DAY);
  const s = {
    date: key,
    difficulty: gameState.difficulty,
    questions: qs,
    queue: qs.map((_, i) => i),
    pos: 0,
    round: 1,
    correctIds: [],
    firstTryCorrect: 0,
    attempts: {},
    pendingStars: 0,
    totalTimeMs: 0,
    completed: false,
    startedAt: Date.now(),
  };
  gameState.session = s;
  persistSession();
  return s;
}

export function currentQuestion() {
  const s = gameState.session;
  if (!s) return null;
  const qi = s.queue[s.pos];
  if (qi == null) return null;
  return s.questions[qi] || null;
}

export function submitAnswer(value) {
  const s = gameState.session;
  const q = currentQuestion();
  if (!s || !q) return { correct: false, question: null };
  const id = q.text;
  const correct = answersEqual(value, q.answer);
  s.attempts[id] = (s.attempts[id] || 0) + 1;
  if (correct && !s.correctIds.includes(id)) {
    s.correctIds.push(id);
    s.pendingStars += q.stars || 0;
    if (s.attempts[id] === 1) s.firstTryCorrect++;
  }
  s.pos++;
  persistSession();
  return { correct, question: q };
}

// 一题结束后推进：下一题 / 进入重做轮 / 完成
export function advance() {
  const s = gameState.session;
  if (!s) return { type: "done" };
  if (s.pos < s.queue.length) return { type: "next" };
  const wrong = s.queue.filter((i) => !s.correctIds.includes(s.questions[i].text));
  if (wrong.length > 0) {
    s.round++;
    s.queue = wrong;
    s.pos = 0;
    persistSession();
    return { type: "round", remaining: wrong.length };
  }
  completeSession();
  return { type: "done" };
}

export function addTime(ms) {
  const s = gameState.session;
  if (!s || ms <= 0) return;
  s.totalTimeMs += ms;
  persistSession();
}

function completeSession() {
  const a = currentAccount();
  const s = gameState.session;
  if (!a || !s) return;
  s.completed = true;
  s.starsEarned = s.pendingStars;
  s.completedAt = Date.now();
  const before = a.stars;
  commit((st) => {
    const acc = st.accounts.find((x) => x.id === a.id);
    if (!acc) return;
    acc.sessions[s.date] = s;
    acc.stars += s.starsEarned;
  });
  gameState.lastResult = {
    date: s.date,
    difficulty: s.difficulty,
    starsEarned: s.starsEarned,
    totalTimeMs: s.totalTimeMs,
    total: s.questions.length,
    firstTryCorrect: s.firstTryCorrect,
    rounds: s.round,
    starsBefore: before,
    starsAfter: before + s.starsEarned,
  };
}
