// 难度4：小数乘除（结果为有限小数）
import { randInt, formatNumber } from "../utils.js";

const round = (x) => Number(x.toFixed(6));

export function generate() {
  const r = Math.random();
  if (r < 0.4) {
    // 一位小数 × 整数
    const a = randInt(11, 99) / 10;
    const b = randInt(2, 9);
    return { level: 4, tag: "dec_mul", text: `${formatNumber(a)} × ${b}`, answer: round(a * b) };
  }
  if (r < 0.7) {
    // 两位小数 × 整数（如 0.25 / 1.25）
    const a = round(randInt(25, 975) / 100);
    const b = randInt(2, 8);
    return { level: 4, tag: "dec_mul", text: `${formatNumber(a)} × ${b}`, answer: round(a * b) };
  }
  // 小数 ÷ 小数（整除）
  const d = randInt(2, 9) / 10; // 0.2 ~ 0.9
  const q = randInt(2, 9);
  const a = round(d * q);
  return { level: 4, tag: "dec_div", text: `${formatNumber(a)} ÷ ${formatNumber(d)}`, answer: q };
}
