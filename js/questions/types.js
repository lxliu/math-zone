// 八类题目的生成器
import { randInt } from "../utils.js";

const round = (x) => Number(x.toFixed(6));
const fmt = (n) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(6))));
const q = (type, text, answer) => ({ type, text, answer });

// p 位小数
function dec(p, min, max) {
  return Number((randInt(min, max) / 10 ** p).toFixed(p));
}
function sign(v) { return v >= 0 ? "+" : "−"; }
// 系数为 1 时不写出来：1x → x（方程题里不该出现「1x」）
function coef(n) { return n === 1 ? "" : String(n); }

/* ---------------- T1 两位数加减 ---------------- */
export function t1() {
  if (Math.random() < 0.5) {
    const a = randInt(10, 99), b = randInt(10, 99);
    return q(1, `${a} + ${b}`, a + b); // 和可超 100
  }
  const x = randInt(10, 99), y = randInt(10, 99);
  const a = Math.max(x, y), b = Math.min(x, y);
  return q(1, `${a} − ${b}`, a - b);
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
  const a = b * quotient;
  return q(2, `${a} ÷ ${b}`, quotient);
}

/* ---------------- T3 巧算 ----------------
   设计原则：技巧骨架写死（类型固定），数字参数全随机（题目多样）。
   全部答案都是整百/整千或整数，孩子能自己判断「凑对了没有」。 */

// 好朋友数对：乘积一定是整百。倍数 m 会乘到其中一边，
// 使结果永远是「base×friend×m」，天然凑整。
// 限制 base 为两位数时，friend 侧的倍数才不会造出三位×两位数（超出三年级）。
const FRIEND_PAIRS = [
  [25, 4], [25, 8], [50, 2], [20, 5],   // base 两位数
  [125, 8], [125, 4],                    // base 三位数
];

function t3Round() {
  const [base, friend] = FRIEND_PAIRS[randInt(0, FRIEND_PAIRS.length - 1)];
  // 少量（25%）三项连乘：25 × 4 × 7
  if (Math.random() < 0.25) {
    const m3 = randInt(2, 9);
    return q(3, `${base} × ${friend} × ${m3}`, base * friend * m3);
  }
  // base 侧可用倍数：乘完不能变成整十/整百，否则题会退化成「1000 × 8」这种没难度的
  const msBase = [];
  for (let k = 2; k <= 9; k++) if ((base * k) % 50 !== 0) msBase.push(k);
  // base 是三位数时，倍数只能乘在 base 侧，否则会造出三位×两位数（超出三年级）
  const canFriendSide = base < 100;
  const useFriendSide = canFriendSide && (!msBase.length || Math.random() < 0.5);
  if (useFriendSide) {
    const m = randInt(2, 9);
    return q(3, `${base} × ${friend * m}`, base * friend * m);
  }
  const m = msBase[randInt(0, msBase.length - 1)];
  return q(3, `${base * m} × ${friend}`, base * friend * m);
}

function t3Dist() {
  // 接近整百/整千的数拆开用分配律：98 × 7、103 × 6、997 × 8
  const base = Math.random() < 0.3 ? 1000 : 100;
  const off = randInt(1, 5);              // 超过 5 就不叫「接近整百」了
  const a = Math.random() < 0.5 ? base - off : base + off;
  const b = randInt(3, 9);
  return q(3, `${a} × ${b}`, a * b);
}

function t3Factor() {
  // 分配律反用：两项乘法有公因数，另两个加数先凑成整百
  const w = Math.random();
  const S = w < 0.6 ? 100 : w < 0.8 ? 200 : 1000;
  const a = randInt(11, S - 11);
  const b = S - a;
  const c = S === 1000 ? randInt(3, 12) : randInt(3, 9);  // 允许答案上万
  return q(3, `${a} × ${c} + ${b} × ${c}`, S * c);
}

// 小数互补配对：[小数, 配对的整数, 两者相乘的结果]
const DEC_PAIRS = [
  [0.125, 8, 1], [0.25, 4, 1], [0.5, 2, 1], [0.2, 5, 1], [0.05, 20, 1],
  [1.5, 2, 3], [2.5, 4, 10], [1.25, 8, 10], [12.5, 8, 100],
];

function t3Dec() {
  const [d, i] = DEC_PAIRS[randInt(0, DEC_PAIRS.length - 1)];
  const m = randInt(2, 9);
  const dm = round(d * m);
  // 倍数乘到整数侧（0.125 × 24）或小数侧（0.375 × 8）。
  // 小数侧必须保证乘完仍带小数，否则会退化成「4 × 2」这种纯整数题（就不是小数互补了）。
  if (Math.random() < 0.5 && !Number.isInteger(dm)) {
    const text = `${fmt(dm)} × ${i}`;
    return q(3, text, round(dm * i));
  }
  const text = `${fmt(d)} × ${i * m}`;
  return q(3, text, round(d * (i * m)));
}

function t3Add() {
  // 加减凑整：两个加数都只差一点点到整百/整千，先看成整百再多退少补
  const base = [100, 200, 1000][randInt(0, 2)];
  const b = base - randInt(1, 5);
  // 少量（20%）出一个略超 base 的干扰项：103 + 98
  const a = Math.random() < 0.2 ? base + randInt(1, 4) : base - randInt(1, 5);
  return q(3, `${a} + ${b}`, a + b);
}

// 教学加权：凑整 / 分配律 / 提公因 是课本高频，各 25%；
//         小数互补 / 加减凑整 是补充，各 12.5%
const T3_WEIGHTS = [
  [t3Round, 0.25],
  [t3Dist, 0.25],
  [t3Factor, 0.25],
  [t3Dec, 0.125],
  [t3Add, 0.125],
];

function pickT3() {
  const total = T3_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [fn, w] of T3_WEIGHTS) {
    r -= w;
    if (r <= 0) return fn();
  }
  return T3_WEIGHTS[0][0]();
}

export function t3() {
  return pickT3();
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

/* ---------------- T5 小数连续加减混合 ---------------- */
export function t5() {
  let total = Number((randInt(10, 99) / 10).toFixed(1)); // 1.0 .. 9.9
  const parts = [fmt(total)];
  const extra = randInt(2, 3); // 共 3–4 项
  for (let i = 0; i < extra; i++) {
    const p = randInt(1, 3);
    const subtract = Math.random() < 0.5 && total > 0.6;
    if (subtract) {
      const maxUnits = Math.max(1, Math.floor(total * 10 ** p) - 1);
      const term = dec(p, 1, maxUnits); // 保证 term < total 且 > 0
      total = round(total - term);
      parts.push("\u2212", fmt(term));
    } else {
      const term = dec(p, 1, 999);
      total = round(total + term);
      parts.push("+", fmt(term));
    }
  }
  return q(5, parts.join(" "), round(total));
}

/* ---------------- T6 混合计算（含括号） ---------------- */
export function t6() {
  const r = randInt(0, 2);
  if (r === 0) {
    const useDec = Math.random() < 0.5;
    const a = useDec ? dec(2, 100, 999) : randInt(12, 99);
    const b = dec(1, 11, 99);
    const c = dec(1, 11, 99);
    const d = useDec ? dec(2, 100, 999) : randInt(12, 99);
    return q(6, `${fmt(a)} × ${fmt(b)} + ${fmt(c)} × ${fmt(d)}`, round(a * b + c * d));
  }
  if (r === 1) {
    const a = randInt(2, 9);
    const b = dec(1, 11, 99), c = dec(1, 11, 99);
    return q(6, `${a} × (${fmt(b)} + ${fmt(c)})`, round(a * (b + c)));
  }
  const a = randInt(2, 9);
  let b = dec(1, 20, 99), c = dec(1, 5, 60);
  if (b < c) [b, c] = [c, b];
  const d = dec(1, 11, 99), e = dec(1, 11, 99);
  return q(6, `${a} × (${fmt(b)} − ${fmt(c)}) + ${fmt(d)} × ${fmt(e)}`, round(a * (b - c) + d * e));
}

/* ---------------- T7 简单一元一次方程（单括号，整数解） ---------------- */
function trySimpleEq() {
  const b = randInt(2, 9);
  const x = randInt(1, 12);
  const c = randInt(1, 99), d = randInt(1, 99), a = randInt(20, 99);
  const form = randInt(0, 2);
  if (form === 0) {
    // a − (bx + c) = d
    const A = b * x + c + d;
    return q(7, `${A} − (${b}x + ${c}) = ${d}`, x);
  }
  if (form === 1) {
    // a − (bx − c) = d
    const A = b * x + d - c;
    if (A < 1) return null;
    return q(7, `${A} − (${b}x − ${c}) = ${d}`, x);
  }
  // (bx + c) − a = d
  const cc = a + d - b * x;
  if (cc < 1) return null;
  return q(7, `(${b}x + ${cc}) − ${a} = ${d}`, x);
}
export function t7() {
  for (let i = 0; i < 60; i++) {
    const e = trySimpleEq();
    if (e) return e;
  }
  return q(7, "87 − (5x + 40) = 22", 5);
}

/* ---------------- T8 复杂一元一次方程 ---------------- */
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
  const text = `${p}(${coef(qq)}x ${sign(r)} ${Math.abs(r)}) ${sign(s)} ${Math.abs(s)} = ${t} − ${u}(${coef(v)}x ${sign(w)} ${Math.abs(w)})`;
  return q(8, text, round(x));
}
export function t8() {
  for (let i = 0; i < 200; i++) {
    const e = tryEquation();
    if (e) return e;
  }
  return q(8, "2(3x + 1) + 4 = 68 − 2(3x + 1)", 5);
}

export const GENERATORS = { 1: t1, 2: t2, 3: t3, 4: t4, 5: t5, 6: t6, 7: t7, 8: t8 };
