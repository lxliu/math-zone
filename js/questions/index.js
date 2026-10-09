// 按家长配置组卷：类型 1→6 分组，组内打乱
import { QUESTION_TYPES, STARS_PER_QUESTION } from "../config.js";
import { shuffle } from "../utils.js";
import { GENERATORS } from "./types.js";

export function buildQuestions(config) {
  const out = [];
  for (const t of QUESTION_TYPES) {
    const n = config[t.id] || 0;
    if (!n) continue;
    const seen = new Set();
    const list = [];
    let guard = 0;
    while (list.length < n && guard++ < n * 50) {
      let qp = null;
      try { qp = GENERATORS[t.id](); } catch (e) { qp = null; }
      if (!qp || seen.has(qp.text)) continue;
      seen.add(qp.text);
      list.push({ ...qp, stars: STARS_PER_QUESTION });
    }
    for (const qp of shuffle(list)) out.push(qp);
  }
  return out;
}
