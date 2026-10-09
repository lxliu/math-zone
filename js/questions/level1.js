// 难度1：100 以内加减法
import { randInt } from "../utils.js";

export function generate() {
  if (Math.random() < 0.5) {
    // 加法：和不超过 100
    const a = randInt(11, 88);
    const b = randInt(2, 100 - a);
    return { level: 1, tag: "add", text: `${a} + ${b}`, answer: a + b };
  }
  // 减法：结果非负
  const a = randInt(21, 99);
  const b = randInt(2, a - 1);
  return { level: 1, tag: "sub", text: `${a} − ${b}`, answer: a - b };
}
