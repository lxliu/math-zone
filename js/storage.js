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
    if (!a.questionsConfig || typeof a.questionsConfig !== "object") a.questionsConfig = { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3 };
  }
  return data;
}
