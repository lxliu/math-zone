// 全局状态 + 订阅
import { loadState, saveState } from "./storage.js";

const listeners = new Set();

export const state = loadState() || { version: 1, currentAccountId: null, accounts: [] };

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emit() {
  for (const fn of Array.from(listeners)) fn(state);
}

export function persist() { saveState(state); }

// 修改状态 -> 持久化 -> 通知
export function commit(mutator) {
  mutator(state);
  persist();
  emit();
}

export function currentAccount() {
  return state.accounts.find((a) => a.id === state.currentAccountId) || null;
}

export function hasAccounts() { return state.accounts.length > 0; }
