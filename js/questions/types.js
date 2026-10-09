// 六类题目的生成器
import { randInt } from "../utils.js";

const round = (x) => Number(x.toFixed(6));
const fmt = (n) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(6))));
const q = (type, text, answer) => ({ type, text, answer });

// 生成 p 位小数
function dec(p, min, max) {
  return Number((randInt(min, max) / 10 ** p).toFixed(p));
}
function sign(v) { return v >= 0 ? "+" : "−"; }

/* ---------------- T1 两位数加减 ---------------- */
export function t1() {
  if (Math.random() < 0.5) {
    const a = randInt(10, 99), b = randInt(10, 99);
    return q(1, `${a} + ${b}`, a + b); // 和可超 100
  }
  const x = randInt(10, 99), y = randInt(10, 99);
  const a = Math.max(x, y), b = Math.min(x, y);
  return q(1, `${a} − ${b}`, a - b); // 非负
}

/* ---------------- T2 两位数 ×÷ 一位数 ---------------- */
export function t2() {
  if (Math.random() < 0.5) {
    const a = randInt(10, 99), b = randInt(2, 9);
    return q(2, `${a} × ${b}`, a * b);
  }
  const b = randInt(2, 9);
  const lo = Math.ceil(10 / b), hi = Math.floor(99 / b);
  const quotient = randInt(lo, hi);
  const a = b * quotient; // 两位被除数，整除
  return q(2, `${a} ÷ ${b}`, quotient);
}

/* ---------------- T3 巧算 ---------------- */
function t3Round() {
  const pairs = [[25, 4], [25, 8], [125, 8], [50, 2], [25, 16], [125, 4], [25, 12], [125, 2], [25, 20], [5, 20]];
  const [a, b] = pairs[randInt(0, pairs.length - 1)];
  return q(3, `${a} × ${b}`, a * b);
}
function t3Dist() {
  const base = [99, 98, 101, 102, 97, 103, 999][randInt(0, 6)];
  const b = randInt(3, 9);
  return q(3, `${base} × ${b}`, base * b);
}
function t3Factor() {
  const c = [7, 8, 9, 12, 25, 15][randInt(0, 5)];
  const a = randInt(11, 89), b = 100 - a;
  return q(3, `${a} × ${c} + ${b} × ${c}`, 100 * c);
}
function t3Dec() {
  const cases = [
    ["1.125 × 88", 99], ["0.125 × 8", 1], ["0.25 × 48", 12], ["1.25 × 8", 10],
    ["2.5 × 4", 10], ["12.5 × 8", 100], ["0.25 × 12", 3], ["1.25 × 88", 110],
    ["0.125 × 16", 2], ["1.5 × 200", 300],
  ];
  const [text, answer] = cases[randInt(0, cases.length - 1)];
  return q(3, text, answer);
}
function t3Add() {
  const base = [100, 200, 1000][randInt(0, 2)];
  const span = Math.min(20, Math.floor(base / 10));
  const a = base - randInt(1, span), b = base - randInt(1, span);
  return q(3, `${a} + ${b}`, a + b);
}
export function t3() {
  return [t3Round, t3Dist, t3Factor, t3Dec, t3Add][randInt(0, 4)]();
}

/* ---------------- T4 小数加减乘除 ---------------- */
export function t4() {
  const r = randInt(0, 3);
  if (r === 0) {
    const p1 = randInt(1, 3), p2 = randInt(1, 3);
    const a = dec(p1, 1, 999), b = dec(p2, 1, 999);
    return q(4, `${fmt(a)} + ${fmt(b)}`, round(a + b));
  }
  if (r === 1) {
    const p1 = randInt(1, 3), p2 = randInt(1, 3);
    let a = dec(p1, 1, 999), b = dec(p2, 1, 999);
    if (a < b) [a, b] = [b, a];
    return q(4, `${fmt(a)} − ${fmt(b)}`, round(a - b));
  }
  if (r === 2) {
    const a = dec(1, 11, 99);
    const b = Math.random() < 0.5 ? dec(1, 11, 99) : dec(2, 25, 975);
    return q(4, `${fmt(a)} × ${fmt(b)}`, round(a * b));
  }
  const d = Math.random() < 0.5 ? dec(1, 2, 9) : dec(1, 12, 99);
  const quotient = randInt(2, 9);
  const a = round(d * quotient);
  return q(4, `${fmt(a)} ÷ ${fmt(d)}`, quotient);
}

/* ---------------- T5 混合计算（含括号） ---------------- */
export function t5() {
  const r = randInt(0, 2);
  if (r === 0) {
    const useDec = Math.random() < 0.5;
    const a = useDec ? dec(2, 100, 999) : randInt(12, 99);
    const b = dec(1, 11, 99);
    const c = dec(1, 11, 99);
    const d = useDec ? dec(2, 100, 999) : randInt(12, 99);
    return q(5, `${fmt(a)} × ${fmt(b)} + ${fmt(c)} × ${fmt(d)}`, round(a * b + c * d));
  }
  if (r === 1) {
    const a = randInt(2, 9);
    const b = dec(1, 11, 99), c = dec(1, 11, 99);
    return q(5, `${a} × (${fmt(b)} + ${fmt(c)})`, round(a * (b + c)));
  }
  const a = randInt(2, 9);
  let b = dec(1, 20, 99), c = dec(1, 5, 60);
  if (b < c) [b, c] = [c, b];
  const d = dec(1, 11, 99), e = dec(1, 11, 99);
  return q(5, `${a} × (${fmt(b)} − ${fmt(c)}) + ${fmt(d)} × ${fmt(e)}`, round(a * (b - c) + d * e));
}

/* ---------------- T6 一元一次方程 ---------------- */
// p(qx + r) + s = t − u(vx + w)
function tryEquation() {
  const p = randInt(2, 9), qq = randInt(1, 9);
  const r = randInt(1, 200) * (Math.random() < 0.5 ? -1 : 1);
  const s = randInt(1, 500) * (Math.random() < 0.5 ? -1 : 1);
  const u = randInt(2, 9), v = randInt(1, 9);
  const w = randInt(1, 300) * (Math.random() < 0.5 ? -1 : 1);
  const t = randInt(100, 9000);

  const A = p * qq, B = p * r + s;
  const C = -u * v, D = t - u * w;
  const denom = A - C;
  if (denom === 0) return null;
  const x = (D - B) / denom;
  if (!(x >= 0) || x > 100) return null;
  if (Math.abs(x * 10 - Math.round(x * 10)) > 1e-6) return null; // 仅整数或一位小数
  const text = `${p}(${qq}x ${sign(r)} ${Math.abs(r)}) ${sign(s)} ${Math.abs(s)} = ${t} − ${u}(${v}x ${sign(w)} ${Math.abs(w)})`;
  return q(6, text, round(x));
}
export function t6() {
  for (let i = 0; i < 200; i++) {
    const e = tryEquation();
    if (e) return e;
  }
  // 兜底（验证：6x+6 = 66-6x → x=5）
  return q(6, "2(3x + 1) + 4 = 68 − 2(3x + 1)", 5);
}

export const GENERATORS = { 1: t1, 2: t2, 3: t3, 4: t4, 5: t5, 6: t6 };
