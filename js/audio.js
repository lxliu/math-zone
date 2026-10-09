// WebAudio 合成音效引擎（无 BGM）
let ctx = null;
let master = null;
let enabled = true;
let volume = 0.7;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = volume;
  master.connect(ctx.destination);
  return ctx;
}

// 需在首次用户手势时调用（iOS 要求）
export function unlockAudio() {
  const c = ensure();
  if (c && c.state === "suspended") c.resume();
}

export function setSoundEnabled(v) { enabled = !!v; }
export function setVolume(v) { volume = Math.max(0, Math.min(1, Number(v) || 0)); if (master) master.gain.value = volume; }
export function isEnabled() { return enabled; }

function tone(freq, dur, { type = "sine", vol = 0.15, at = 0, slideTo = null } = {}) {
  if (!enabled) return;
  const c = ensure();
  if (!c) return;
  if (c.state === "suspended") c.resume();
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const SFX = {
  key() { tone(620, 0.04, { type: "sine", vol: 0.10 }); },
  button() { tone(400, 0.05, { type: "triangle", vol: 0.10 }); },
  correct() { tone(660, 0.10, { vol: 0.16 }); tone(990, 0.14, { vol: 0.16, at: 0.09 }); },
  wrong() { tone(330, 0.16, { type: "sine", vol: 0.07, slideTo: 270 }); }, // 刻意轻
  submit() { tone(520, 0.05, { type: "triangle", vol: 0.10 }); },
  star() { tone(1200, 0.10, { vol: 0.12 }); tone(1800, 0.12, { vol: 0.10, at: 0.08 }); },
  collect() { [784, 988, 1175].forEach((f, i) => tone(f, 0.12, { vol: 0.12, at: i * 0.07 })); },
  unlock() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.16, { vol: 0.14, at: i * 0.09 })); },
  complete() { [659, 784, 1047].forEach((f, i) => tone(f, 0.18, { vol: 0.15, at: i * 0.12 })); },
};

export function play(name) { const fn = SFX[name]; if (fn) fn(); }
