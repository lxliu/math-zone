// 每日会话状态机：按家长配置组卷 / 计分 / 错题循环 / 续做
import { currentAccount, commit } from "./store.js";
import { todayKey, answersEqual } from "./utils.js";
import { buildQuestions } from "./questions/index.js";
import { getConfig, totalStars } from "./config.js";

export const gameState = { session: null, lastResult: null };

export function todaySession() {
  const a = currentAccount();
  return (a && a.sessions[todayKey()]) || null;
}

// 今日满额幸运星（按家长配置）
export function dayTarget() {
  return totalStars(getConfig(currentAccount()));
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

// 开始或恢复今天的会话（旧格式会话自动作废重建）
export function startOrResume() {
  const a = currentAccount();
  const key = todayKey();
  const existing = a?.sessions?.[key];
  const usable =
    existing &&
    !existing.completed &&
    Array.isArray(existing.questions) &&
    existing.questions.length > 0 &&
    existing.config;
  if (usable) {
    gameState.session = existing;
    return existing;
  }

  const config = getConfig(a);
  const qs = buildQuestions(config);
  const s = {
    date: key,
    config,
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
    starsEarned: s.starsEarned,
    totalTimeMs: s.totalTimeMs,
    total: s.questions.length,
    firstTryCorrect: s.firstTryCorrect,
    rounds: s.round,
    starsBefore: before,
    starsAfter: before + s.starsEarned,
  };
}
