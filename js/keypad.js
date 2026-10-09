// 屏幕数字键盘组件
import { play } from "./audio.js";

export function createKeypad({ onInput, onSubmit, onDelete, allowDecimal = true } = {}) {
  const root = document.createElement("div");
  root.className = "keypad";
  const keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", allowDecimal ? "." : "", "⌫"];
  for (const k of keys) {
    if (!k) { root.appendChild(document.createElement("span")); continue; }
    const b = document.createElement("button");
    b.className = "key";
    b.textContent = k;
    b.addEventListener("click", () => {
      if (k === "⌫") { play("key"); onDelete?.(); }
      else { play("key"); onInput?.(k); }
    });
    root.appendChild(b);
  }
  const submit = document.createElement("button");
  submit.className = "key wide";
  submit.textContent = "确定";
  submit.addEventListener("click", () => { play("submit"); onSubmit?.(); });
  root.appendChild(submit);

  // 键盘支持（MacBook）
  const handler = (e) => {
    if (/^[0-9]$/.test(e.key)) { play("key"); onInput?.(e.key); }
    else if (e.key === "." && allowDecimal) { play("key"); onInput?.("."); }
    else if (e.key === "Backspace") { play("key"); onDelete?.(); }
    else if (e.key === "Enter") { play("submit"); onSubmit?.(); }
  };
  document.addEventListener("keydown", handler);
  root.destroy = () => document.removeEventListener("keydown", handler);
  return root;
}
