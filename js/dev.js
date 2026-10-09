// 开发调试：仅本机(127.0.0.1)且带 ?dev=1 时启用
const PASSWORD = "test123456";

export function isDevEnabled() {
  try {
    const p = new URLSearchParams(location.search);
    return p.get("dev") === "1" && location.hostname === "127.0.0.1";
  } catch (e) {
    return false;
  }
}

export function checkDevPassword(pw) {
  return String(pw) === PASSWORD;
}
