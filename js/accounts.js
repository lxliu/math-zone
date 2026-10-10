// 账号：创建 / 列表 / 切换 / 头像
import { commit, state } from "./store.js";
import { uid } from "./utils.js";
import { ANIMAL_ROSTER_VERSION } from "./storage.js";

// 初始可选的 2 个小朋友头像
export const KID_AVATARS = [
  { id: "kid-boy", name: "小男孩" },
  { id: "kid-girl", name: "小女孩" },
];

export function avatarSrc(avatarId) {
  if (!avatarId) return "assets/avatars/kid-boy.svg";
  if (avatarId.startsWith("kid-")) return `assets/avatars/${avatarId}.svg`;
  return `assets/animals/${avatarId}.svg`;
}

export function createAccount({ name, gender, birthDate, avatarId }) {
  const account = {
    id: uid(),
    name: (name || "").trim() || "小朋友",
    gender: gender || "boy",
    birthDate: birthDate || "",
    avatarId: avatarId || "kid-boy",
    createdAt: Date.now(),
    stars: 0,
    ownedAnimals: [],
    animalRosterVersion: ANIMAL_ROSTER_VERSION,
    sessions: {},
    settings: { sound: true, volume: 0.7 },
  };
  commit((s) => {
    s.accounts.push(account);
    s.currentAccountId = account.id;
  });
  return account;
}

export function switchAccount(id) {
  commit((s) => { s.currentAccountId = id; });
}

export function listAccounts() { return state.accounts; }

export function hasAccounts() { return state.accounts.length > 0; }
