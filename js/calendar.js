// 日历逻辑
import { pad } from "./utils.js";

export function dateKeyOf(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

// 返回某月每个日期对应的 session（或 undefined）
export function monthSessions(account, year, month) {
  const map = {};
  const days = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= days; d++) {
    const key = dateKeyOf(year, month, d);
    map[key] = account.sessions[key];
  }
  return map;
}
