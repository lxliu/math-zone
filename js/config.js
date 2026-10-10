// 题型与每日题量配置（家长设置）
import { commit } from "./store.js";

// 每类题目字段说明（单一数据源，家长设置页直接渲染）：
//   name    短名称
//   short   一句话概括（列表行内显示）
//   skill   训练点：这类题到底在练什么
//   range   数字范围 / 难度边界
//   rule    规则保证（孩子不会碰到什么）
//   samples 3–4 个例题（列表行内显示前 3 个）
//   tips    家长可以怎么引导（可空）
//   subs    子类拆解（仅巧算用）
export const QUESTION_TYPES = [
  {
    id: 1,
    name: "两位数加减",
    short: "两位数加两位数、两位数减两位数",
    skill: "练进位加与退位减的心算流程，把「凑十、破十」变成条件反射",
    range: "两个数都是 10–99；加法的和最大到 198；减法总是大数减小数",
    rule: "不会出现小数减大数，结果不会为负",
    samples: ["68 + 47", "93 − 58", "56 + 78", "90 − 37"],
    tips: [],
  },
  {
    id: 2,
    name: "两位数×÷一位数",
    short: "两位数乘一位数、两位数除以一位数",
    skill: "乘法口诀的逆向使用，也是竖式乘法与除法的口算地基",
    range: "两位数 10–99，乘数与除数都是 2–9",
    rule: "除法一定除得尽；被除数也在 10–99 之间",
    samples: ["34 × 7", "96 ÷ 8", "72 ÷ 9", "58 × 6"],
    tips: [],
  },
  {
    id: 3,
    name: "巧算",
    short: "五类速算技巧，练「先观察再动笔」",
    skill: "不硬算——先看数字有什么特征，再挑最省力的路。这是计算能力里最值钱的一环",
    range: "五个子类见下表；答案都是整百、整千或整数，孩子能自己判断凑对了没有",
    rule: "题面不给拆分提示——「自己看出特征」正是这类题的训练点",
    samples: ["25 × 28", "98 × 7", "37 × 8 + 63 × 8", "0.125 × 24", "95 + 97"],
    tips: ["孩子卡住时可以问：这两个数能不能先凑成整十、整百？"],
    subs: [
      { name: "凑整", weight: "25%", trick: "看见 25 找 4、看见 125 找 8，先乘出整百整千", samples: ["25 × 28", "125 × 24", "25 × 4 × 7"] },
      { name: "分配律", weight: "25%", trick: "把接近整百的数拆成 100 ± 几，例如 98 = 100 − 2", samples: ["98 × 7", "103 × 6", "1003 × 8"] },
      { name: "提公因数", weight: "25%", trick: "两项乘法有共同因数，另外两个数先凑成整百", samples: ["37 × 8 + 63 × 8", "387 × 7 + 613 × 7"] },
      { name: "小数互补", weight: "12.5%", trick: "0.125 配 8、0.25 配 4、0.5 配 2，小数也能凑整", samples: ["0.125 × 24", "1.25 × 16"] },
      { name: "加减凑整", weight: "12.5%", trick: "把接近整百的数先看成整百，再多退少补", samples: ["95 + 97", "997 + 995"] },
    ],
  },
  {
    id: 4,
    name: "小数加减乘除",
    short: "小数的加、减、乘、除",
    skill: "小数点对齐、积的小数位数、除法里被除数与除数同时扩大",
    range: "加减法的小数位 1–3 位；乘法两个因数都在 0.25–9.9；除法的商是 2–9 的整数",
    rule: "减法不会小减大；除法一定除得尽；结果都是有限小数",
    samples: ["3.7 + 12.45", "8.6 − 2.75", "2.4 × 3.5", "4.8 ÷ 0.6"],
    tips: [],
  },
  {
    id: 5,
    name: "小数连续加减",
    short: "3–4 项小数连加连减",
    skill: "多步计算的顺序感，以及小数位的对齐",
    range: "首项是 1.0–9.9 的一位小数，后面 2–3 项各 1–3 位小数，共 3 或 4 项",
    rule: "每一步的中间结果都大于 0，不会中途「减没了」，也不会出现负数",
    samples: ["8.7 − 4.7 + 0.76 − 0.16", "5.3 + 2.45 − 1.6 + 0.125"],
    tips: ["可以先找出能凑整或末位能抵消的两项先算"],
  },
  {
    id: 6,
    name: "混合计算",
    short: "乘法分配 + 含括号的混合运算",
    skill: "运算顺序（先括号 → 再乘除 → 后加减），以及乘法分配律的正面运用",
    range: "三种外形：a × b + c × d（不含括号）、a × (b + c)、a × (b − c) + d × e；括号外系数 2–9，括号内是一位小数",
    rule: "括号内的减法不会小减大",
    samples: ["2.55 × 1.5 + 8.5 × 2.56", "7 × (3.2 + 4.9)", "6 × (8.5 − 2.3) + 4.5 × 1.2"],
    tips: [],
  },
  {
    id: 7,
    name: "简单一元一次方程",
    short: "一层括号的方程，求解 x",
    skill: "把括号当成一个整体，再用逆运算一步步倒推——代数思维的第一步",
    range: "一定有且只有一个小括号，括号内一定是 bx ± c（b 是 2–9，c 是 1–99 的整数）",
    rule: "解一定是 1–12 的正整数，不会出分数、小数或负数",
    samples: ["87 − (5x + 40) = 22", "95 − (3x − 8) = 31", "(4x + 17) − 30 = 15"],
    tips: ["可以把括号里的整个式子先看成一个数，先求出它等于几"],
  },
  {
    id: 8,
    name: "复杂一元一次方程",
    short: "两边都有括号的方程，求解 x",
    skill: "两边展开 → 合并同类项 → 移项，完整走一遍一元一次方程的解法",
    range: "固定外形：p(qx ± r) ± s = t − u(vx ± w)；左右各一个括号，括号外都有系数",
    rule: "解一定是 0–100 之间的整数或一位小数，不会是分数或负数",
    samples: ["7(9x − 140) + 387 = 5315 − 7(9x + 178)", "2(3x + 1) + 4 = 68 − 2(3x + 1)"],
    tips: ["先把两边括号展开，再把含 x 的项挪到一边、已知数挪到另一边"],
  },
];

// 兼容旧字段（desc / sample），避免其它地方引用时炸掉
for (const t of QUESTION_TYPES) {
  if (t.desc == null) t.desc = t.short;
  if (t.sample == null) t.sample = t.samples?.[0] ?? "";
}

export const STARS_PER_QUESTION = 2;
export const DEFAULT_PER_TYPE = 3;
export const MAX_PER_TYPE = 20;

// ---------------------------------------------------------------------------
// 3D 模型：Kenney「Cube Pets 2.0」(CC0) glTF 模型开关
// true  = 用 assets/3d/animal-*.glb（默认）
// false = 回退到旧的程序化低多边形模型（iPad 上出问题时的一键兼底，见调试面板）
// ---------------------------------------------------------------------------
export const USE_GLB_MODELS = true;

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
    if (acc) {
      acc.questionsConfig = clean;
      acc.questionsConfigVersion = 2;
    }
  });
  return clean;
}

export function totalQuestions(config) {
  return QUESTION_TYPES.reduce((n, t) => n + (config[t.id] || 0), 0);
}

export function totalStars(config) {
  return totalQuestions(config) * STARS_PER_QUESTION;
}
