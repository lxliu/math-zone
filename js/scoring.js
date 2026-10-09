// 幸运星规则
import { QUESTIONS_PER_DAY } from "./constants.js";

// 每题幸运星（按难度）
export const STAR_PER_QUESTION = { 1: 2, 2: 3, 3: 4, 4: 5 };

export const DIFFICULTIES = [
  { id: 1, name: "100 以内加减", desc: "两位数以内的加减法", perQuestion: 2, mixed: false },
  { id: 2, name: "多位数 ×÷ 一位数", desc: "两/三位数乘或除以一位数", perQuestion: 3, mixed: false },
  { id: 3, name: "两位数 × 两位数", desc: "两位数乘两位数", perQuestion: 4, mixed: false },
  { id: 4, name: "小数 + 巧算", desc: "小数乘除与巧算技巧", perQuestion: 5, mixed: false },
  { id: "mixed", name: "综合", desc: "每类 5 题，共 20 题", perQuestion: null, mixed: true },
];

export function difficultyById(id) {
  return DIFFICULTIES.find((d) => String(d.id) === String(id)) || null;
}

// 当日满额幸运星
export function dayTotalStars(id) {
  if (String(id) === "mixed") {
    // 每类 5 题
    return 5 * (STAR_PER_QUESTION[1] + STAR_PER_QUESTION[2] + STAR_PER_QUESTION[3] + STAR_PER_QUESTION[4]);
  }
  const d = difficultyById(id);
  if (!d || d.mixed) return 0;
  return d.perQuestion * QUESTIONS_PER_DAY;
}
