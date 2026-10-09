// 难度2：多位数 ×÷ 一位数
import { randInt } from "../utils.js";

export function generate() {
  if (Math.random() < 0.5) {
    // 两/三位数 × 一位数
    const threeDigit = Math.random() < 0.4;
    const a = threeDigit ? randInt(101, 999) : randInt(12, 99);
    const b = randInt(2, 9);
    return { level: 2, tag: "mul", text: `${a} × ${b}`, answer: a * b };
  }
  // 两/三位数 ÷ 一位数（整除）
  const d = randInt(2, 9);
  const useThree = Math.random() < 0.4;
  const quotient = useThree ? randInt(101, 999) : randInt(12, 99);
  const a = d * quotient;
  return { level: 2, tag: "div", text: `${a} ÷ ${d}`, answer: quotient };
}
