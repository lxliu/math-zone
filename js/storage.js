// localStorage 读写 + schema 版本/迁移
import { ANIMALS, LEGACY_ANIMAL_MAP, animalById } from "./animals.js";

const KEY = "luckyStar.v1";
export const SCHEMA_VERSION = 1;
// 动物图鉴版本：1 = 旧的 20 只，2 = Kenney Cube Pets 的 24 只
export const ANIMAL_ROSTER_VERSION = 2;

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    const migrated = migrate(data);
    // 迁移结果立即落盘：否则会出现「内存里已清理、存储里还是旧字段」的不一致，
    // 要等下一次 commit 才被覆盖（旧字段可能永远赖在存储里）。
    if (JSON.stringify(migrated) !== raw) saveState(migrated);
    return migrated;
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

// 迁移入口：loadState 会自动调用；导入备份等场景也可显式调用，
// 避免“导入后不刷新页面 → 迁移没跑 → 旧动物 id / 头像错位”这类问题。
export function migrateData(data) {
  if (!data || typeof data !== "object") return data;
  return migrate(data);
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
    // 出生日期已废弃（新建账号不再采集）：清掉老账号里的遗留字段
    if ("birthDate" in a) delete a.birthDate;
    migrateQuestionsConfig(a);
    migrateAnimals(a);
  }
  return data;
}

// ---------------------------------------------------------------------------
// 动物图鉴迁移：20 只 → 24 只（Kenney Cube Pets）
//  1) 旧 id 按 LEGACY_ANIMAL_MAP 换成新 id（同种动物保留，已移除的换同档新动物）
//  2) 升档/去重导致的缺口，用【同档位】里最便宜且未拥有的动物补足，尽量保住档位结构
//  3) 总数仍不足时再按全局最便宜补足
//  4) 头像若指向旧动物，一并迁移；迁移后不拥有的动物头像回退到第一个拥有的动物
// 原则：绝不退款、绝不清空——孩子到手的动物数量只会变多不会变少。
// ---------------------------------------------------------------------------
function migrateAnimals(acc) {
  if (acc.animalRosterVersion === ANIMAL_ROSTER_VERSION) return;
  if (!Array.isArray(acc.ownedAnimals)) acc.ownedAnimals = [];

  const oldIds = acc.ownedAnimals.slice();
  const totalBefore = oldIds.length;

  const owned = [];
  const addOwned = (id) => { if (id && !owned.includes(id)) owned.push(id); };

  for (const id of oldIds) {
    const mapped = LEGACY_ANIMAL_MAP[id] || (animalById(id) ? id : null);
    if (mapped) addOwned(mapped);
  }

  // 按档位补足
  const tiers = ["common", "rare", "epic", "legend"];
  const countIn = (list, tier) => list.filter((id) => animalById(id)?.tier === tier).length;
  for (const tier of tiers) {
    const want = countIn(oldIds.map((id) => LEGACY_ANIMAL_MAP[id] || id).filter((id) => animalById(id)), tier);
    const got = countIn(owned, tier);
    if (got >= want) continue;
    const pool = ANIMALS
      .filter((a) => a.tier === tier && !owned.includes(a.id))
      .sort((a, b) => a.price - b.price || a.id.localeCompare(b.id));
    for (let i = 0; i < want - got && i < pool.length; i++) addOwned(pool[i].id);
  }

  // 总数仍不足（例如同档池子不够）→ 全局最便宜补齐
  const needTotal = totalBefore - owned.length;
  if (needTotal > 0) {
    const pool = ANIMALS
      .filter((a) => !owned.includes(a.id))
      .sort((a, b) => a.price - b.price || a.id.localeCompare(b.id));
    for (let i = 0; i < needTotal && i < pool.length; i++) addOwned(pool[i].id);
  }

  // 保持原顺序（按价格从低到高，图鉴观感一致）
  acc.ownedAnimals = owned.sort((a, b) => (animalById(a)?.price ?? 0) - (animalById(b)?.price ?? 0));

  // 头像迁移
  if (acc.avatarId && !String(acc.avatarId).startsWith("kid-")) {
    const mapped = LEGACY_ANIMAL_MAP[acc.avatarId] || acc.avatarId;
    acc.avatarId = acc.ownedAnimals.includes(mapped) ? mapped : (acc.ownedAnimals[0] || "kid-boy");
  }

  acc.animalRosterVersion = ANIMAL_ROSTER_VERSION;
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
