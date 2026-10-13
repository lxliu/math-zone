// 共用密码门控（家长设置 / 调试面板）
export const GATE_PASSWORD = "test123456";

export function checkPassword(pw) {
  return String(pw) === GATE_PASSWORD;
}

/* ------------------------------------------------------------------ */
/* 家长设置的两种进入方式                                               */
/*   1) 新建账号后的「首次配置」：一次性令牌，免密码（见 grantFirstSetup）*/
/*   2) 日常修改：输入密码后放行（grantParentAccess）                    */
/* 两者都只放 sessionStorage，关掉标签页即失效。                         */
/* ------------------------------------------------------------------ */

const KEY_UNLOCKED = "parentUnlocked";
const KEY_ONBOARD = "parentOnboard"; // 值 = 账号 id，只对“刚创建的那个账号”放行一次

export function grantParentAccess() {
  try { sessionStorage.setItem(KEY_UNLOCKED, "1"); } catch (e) {}
}

export function hasParentAccess() {
  try { return sessionStorage.getItem(KEY_UNLOCKED) === "1"; } catch (e) { return false; }
}

// 新建账号后调用：让 parent 页面免密码进一次
export function grantFirstSetup(accountId) {
  try { sessionStorage.setItem(KEY_ONBOARD, String(accountId)); } catch (e) {}
}

export function isFirstSetup(accountId) {
  try { return !!accountId && sessionStorage.getItem(KEY_ONBOARD) === String(accountId); } catch (e) { return false; }
}

// 保存/跳过/离开配置页时都要清掉，保证“免密码”只此一次
export function clearFirstSetup() {
  try { sessionStorage.removeItem(KEY_ONBOARD); } catch (e) {}
}
