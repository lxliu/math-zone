// 共用密码门控（家长设置 / 调试面板）
export const GATE_PASSWORD = "test123456";

export function checkPassword(pw) {
  return String(pw) === GATE_PASSWORD;
}
