// 3D 模型注册表：id -> builder
import * as hedgehog from "./hedgehog.js";
import { BUILDERS as ANIMALS } from "./animals3d.js";

const BUILDERS = {
  "common-03": hedgehog.build, // 小刺猬（手工定制）
  ...ANIMALS, // 其余 19 只（参数化）
};

export function has3DModel(id) { return typeof BUILDERS[id] === "function"; }

export function build3DModel(id) {
  const b = BUILDERS[id];
  if (!b) return null;
  try { return b(); } catch (e) { console.warn("build3DModel failed", id, e); return null; }
}
