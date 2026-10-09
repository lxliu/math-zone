// 题型与每日题量配置（家长设置）
import { commit } from "./store.js";

export const QUESTION_TYPES = [
  { id: 1, name: "两位数加减", desc: "两位数 ± 两位数", sample: "68 + 47" },
  { id: 2, name: "两位数×÷一位数", desc: "两位数乘/除以一位数", sample: "34 × 7" },
  { id: 3, name: "巧算", desc: "凑整 / 分配律 / 提公因 / 小数重写 / 加减凑整", sample: "125 × 8" },
  { id: 4, name: "小数加减乘除", desc: "小数的四则运算", sample: "1.2 × 9.6" },
  { id: 5, name: "混合计算", desc: "含括号的整数/小数混合", sample: "2.55 × 1.5 + 8.5 × 2.56" },
  { id: 6, name: "一元一次方程", desc: "求解 x（整数或一位小数）", sample: "7(9x − 140) + 387 = 5315 − 7(9x + 178)" },
];

export const STARS_PER_QUESTION = 2;
export const DEFAULT_PER_TYPE = 3;
export const MAX_PER_TYPE = 20;

export function defaultConfig() {
  const c = {};
  for (const t of QUESTION_TYPES) c[t.id] = DEFAULT_PER_TYPE;
  return c;
}

function clampCount(v, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(MAX_PER_TYPE, Math.floor(n)));
}

export function getConfig(account) {
  const cfg = account && account.questionsConfig ? account.questionsConfig : {};
  const out = {};
  for (const t of QUESTION_TYPES) out[t.id] = clampCount(cfg[t.id], DEFAULT_PER_TYPE);
  return out;
}

export function setConfig(accountId, config) {
  const clean = {};
  for (const t of QUESTION_TYPES) clean[t.id] = clampCount(config[t.id], DEFAULT_PER_TYPE);
  commit((s) => {
    const acc = s.accounts.find((x) => x.id === accountId);
    if (acc) acc.questionsConfig = clean;
  });
  return clean;
}

export function totalQuestions(config) {
  return QUESTION_TYPES.reduce((n, t) => n + (config[t.id] || 0), 0);
}

export function totalStars(config) {
  return totalQuestions(config) * STARS_PER_QUESTION;
}
