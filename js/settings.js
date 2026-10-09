// 设置逻辑（供设置页与其它入口复用）
import { currentAccount, commit } from "./store.js";
import { setSoundEnabled, setVolume } from "./audio.js";

function update(patch) {
  const a = currentAccount();
  if (!a) return;
  commit((s) => {
    const acc = s.accounts.find((x) => x.id === a.id);
    Object.assign(acc, patch);
  });
}

export function setAvatar(avatarId) { update({ avatarId }); }

export function setSound(on) {
  const a = currentAccount();
  if (!a) return;
  update({ settings: { ...a.settings, sound: on } });
  setSoundEnabled(on);
}

export function setVolumeLevel(v) {
  const a = currentAccount();
  if (!a) return;
  update({ settings: { ...a.settings, volume: v } });
  setVolume(v);
}
