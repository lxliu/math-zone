// 难度3：两位数 × 两位数
import { randInt } from "../utils.js";

export function generate() {
  const a = randInt(12, 99);
  const b = randInt(12, 99);
  return { level: 3, tag: "mul2", text: `${a} × ${b}`, answer: a * b };
}
