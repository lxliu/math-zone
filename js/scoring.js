// 计分：每道题统一 2 颗幸运星
import { totalQuestions, totalStars, STARS_PER_QUESTION } from "./config.js";

export { STARS_PER_QUESTION };

// 当日满额幸运星 = 2 × 总题数
export function dayTotalStars(config) {
  return totalStars(config);
}

export function dayTotalQuestions(config) {
  return totalQuestions(config);
}
