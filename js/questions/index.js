// 组卷：4 难度 + 巧算 + 综合
import * as level1 from "./level1.js";
import * as level2 from "./level2.js";
import * as level3 from "./level3.js";
import * as level4 from "./level4.js";
import * as tricks from "./tricks.js";
import { QUESTIONS_PER_DAY, MIXED_PER_TYPE } from "../constants.js";
import { STAR_PER_QUESTION } from "../scoring.js";

const GENERATORS = { 1: level1, 2: level2, 3: level3, 4: level4 };

// 难度4 会混入巧算
export function generateOne(level) {
  if (level === 4) {
    const useTrick = Math.random() < 0.5;
    return (useTrick ? tricks.generate() : level4.generate());
  }
  return GENERATORS[level]?.generate() ?? null;
}

function withStars(q) {
  return { ...q, stars: STAR_PER_QUESTION[q.level] || 1 };
}

// 生成一组题（默认 20 题，题面去重）
export function buildQuestions(difficultyId, count = QUESTIONS_PER_DAY) {
  const seen = new Set();
  const out = [];
  const take = (level) => {
    for (let i = 0; i < 40; i++) {
      const q = generateOne(level);
      if (q && !seen.has(q.text)) {
        seen.add(q.text);
        out.push(withStars(q));
        return true;
      }
    }
    return false;
  };

  if (String(difficultyId) === "mixed") {
    for (const lv of [1, 2, 3, 4]) {
      for (let i = 0; i < MIXED_PER_TYPE; i++) take(lv);
    }
  } else {
    const lv = Number(difficultyId);
    let guard = 0;
    while (out.length < count && guard++ < count * 30) take(lv);
  }
  return out;
}
