// localStorage 读写 + schema 版本/迁移
const KEY = "luckyStar.v1";
export const SCHEMA_VERSION = 1;

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    return migrate(data);
  } catch (e) {
    console.warn("loadState failed", e);
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.warn("saveState failed", e);
    return false;
  }
}

export function clearState() {
  try { localStorage.removeItem(KEY); } catch (e) {}
}

function migrate(data) {
  if (!data.version) data.version = SCHEMA_VERSION;
  if (!Array.isArray(data.accounts)) data.accounts = [];
  if (!("currentAccountId" in data)) data.currentAccountId = null;
  // 每个账号的缺省字段
  for (const a of data.accounts) {
    if (typeof a.stars !== "number") a.stars = 0;
    if (!Array.isArray(a.ownedAnimals)) a.ownedAnimals = [];
    if (!a.sessions || typeof a.sessions !== "object") a.sessions = {};
    if (!a.settings) a.settings = { sound: true, volume: 0.7 };
    migrateQuestionsConfig(a);
  }
  return data;
}

// 题量配置：6 类 → 8 类迁移
const QC_DEFAULT = 3;
const QC_MAX = 20;
function qcNum(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return QC_DEFAULT;
  return Math.max(0, Math.min(QC_MAX, Math.floor(n)));
}
function qcDefault8() {
  const o = {};
  for (let i = 1; i <= 8; i++) o[i] = QC_DEFAULT;
  return o;
}
function qcNormal8(cfg) {
  const o = {};
  for (let i = 1; i <= 8; i++) o[i] = qcNum(cfg && (cfg[i] ?? cfg[String(i)]));
  return o;
}
function migrateQuestionsConfig(acc) {
  if (acc.questionsConfigVersion === 2 && acc.questionsConfig) return;
  const cfg = acc.questionsConfig;
  if (!cfg || typeof cfg !== "object") {
    acc.questionsConfig = qcDefault8();
    acc.questionsConfigVersion = 2;
    return;
  }
  const hasNew = (cfg[7] ?? cfg["7"]) != null || (cfg[8] ?? cfg["8"]) != null;
  if (hasNew) {
    acc.questionsConfig = qcNormal8(cfg);
  } else {
    const g = (k) => cfg[k] ?? cfg[String(k)];
    // 旧 1,2,3,4 不变；旧5(混合)→6；旧6(复杂方程)→8；新5(小数连加)、7(简单方程) 补默认
    acc.questionsConfig = qcNormal8({ 1: g(1), 2: g(2), 3: g(3), 4: g(4), 5: QC_DEFAULT, 6: g(5), 7: QC_DEFAULT, 8: g(6) });
  }
  acc.questionsConfigVersion = 2;
}
