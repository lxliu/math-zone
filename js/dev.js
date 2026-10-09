// 开发调试：仅本机(127.0.0.1)且带 ?dev=1 时启用；密码与家长设置共用
import { checkPassword } from "./gate.js";

export { checkPassword };

export function isDevEnabled() {
  try {
    const p = new URLSearchParams(location.search);
    return p.get("dev") === "1" && location.hostname === "127.0.0.1";
  } catch (e) {
    return false;
  }
}

export const checkDevPassword = checkPassword;
