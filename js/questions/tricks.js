// 巧算 5 子类：凑整 / 分配律 / 提取公因数 / 小数分数重写 / 加减凑整
import { randInt, formatNumber } from "../utils.js";

export function generate() {
  const pick = randInt(1, 5);
  if (pick === 1) return rounding();
  if (pick === 2) return distributive();
  if (pick === 3) return commonFactor();
  if (pick === 4) return decimalRewrite();
  return addRounding();
}

// ① 凑整乘法
function rounding() {
  const pairs = [[25, 4], [25, 8], [125, 8], [50, 2], [25, 16], [125, 4], [25, 12], [125, 2], [25, 20], [5, 20]];
  const [a, b] = pairs[randInt(0, pairs.length - 1)];
  return { level: 4, tag: "trick_round", text: `${a} × ${b}`, answer: a * b };
}

// ② 分配律
function distributive() {
  const base = [99, 98, 101, 102, 97, 103, 999][randInt(0, 6)];
  const b = randInt(3, base >= 999 ? 9 : 9);
  return { level: 4, tag: "trick_dist", text: `${base} × ${b}`, answer: base * b };
}

// ③ 提取公因数（a + b = 100）
function commonFactor() {
  const c = [7, 8, 9, 12, 25, 15][randInt(0, 5)];
  const a = randInt(11, 89);
  const b = 100 - a;
  return { level: 4, tag: "trick_factor", text: `${a} × ${c} + ${b} × ${c}`, answer: 100 * c };
}

// ④ 小数 / 分数重写
function decimalRewrite() {
  const cases = [
    { text: "1.125 × 88", answer: 99 },
    { text: "0.125 × 8", answer: 1 },
    { text: "0.25 × 48", answer: 12 },
    { text: "1.25 × 8", answer: 10 },
    { text: "2.5 × 4", answer: 10 },
    { text: "12.5 × 8", answer: 100 },
    { text: "0.25 × 12", answer: 3 },
    { text: "1.25 × 88", answer: 110 },
    { text: "0.125 × 16", answer: 2 },
    { text: "1.5 × 200", answer: 300 },
  ];
  const c = cases[randInt(0, cases.length - 1)];
  return { level: 4, tag: "trick_dec", text: c.text, answer: c.answer };
}

// ⑤ 加减凑整
function addRounding() {
  const base = [100, 200, 1000][randInt(0, 2)];
  const span = Math.min(20, Math.floor(base / 10));
  const a = base - randInt(1, span);
  const b = base - randInt(1, span);
  return { level: 4, tag: "trick_addround", text: `${a} + ${b}`, answer: a + b };
}

export { formatNumber };
