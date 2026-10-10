// 导出 / 导入备份
import { state, commit } from "./store.js";
import { todayKey } from "./utils.js";
import { migrateData } from "./storage.js";

export function exportBackup() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `幸运星备份-${todayKey()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function importBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result));
        if (!raw || !Array.isArray(raw.accounts)) throw new Error("格式不正确");
        // 旧备份里可能是旧的动物 id / 头像，这里就地跑一遍迁移，
        // 不依赖调用方刷新页面，也不依赖 loadState。
        const data = migrateData(raw);
        commit((s) => {
          s.version = data.version || s.version;
          s.accounts = data.accounts;
          s.currentAccountId = data.currentAccountId || data.accounts[0]?.id || null;
        });
        resolve(true);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
