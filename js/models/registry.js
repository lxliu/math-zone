// glTF 模型注册表 —— Kenney「Cube Pets 2.0」(CC0)，详见 assets/3d/CREDITS.md
//
// 素材事实（已实测，改素材前请重新核对）：
//   · 朝向 +Z（前腿节点 leg-front-* 的 z = +0.25）→ three.js 相机在 +Z，无需旋转
//   · 世界坐标 Y 最低点 = 0（脚已落地）→ 无需 yOffset
//   · 无蒙皮（skins = 0），动画是刚体节点变换 → 普通 clone 即可，无需 SkeletonUtils
//   · 单材质 pbrMetallicRoughness + baseColorTexture = Textures/colormap.png（外链，必须同级保留）
//
// 每只都带同 8 条动画，且每条都从 t = 0 开始 → 不需要 AnimationUtils.subclip。
import { animalById, animalModelSrc } from "../animals.js";
import { BUILDERS as PROC_BY_OLD_ID } from "./animals3d.js";
import * as hedgehog from "./hedgehog.js";

export const GLB_CLIPS = [
  "static",
  "idle",
  "walk",
  "run",
  "eat",
  "dance",
  "gesture-positive",
  "gesture-negative",
];

export const CLIP_DURATION = {
  static: 0.1,
  idle: 1.0,
  walk: 0.5,
  run: 0.25,
  eat: 0.5,
  dance: 0.5,
  "gesture-positive": 0.25,
  "gesture-negative": 0.25,
};

// 常驻循环 / 点击互动 / 解锁庆祝 用哪条
export const LOOP_CLIP = "idle";
export const CHEER_CLIP = "dance";
export const TAP_CLIP = "gesture-positive";

// ---------------------------------------------------------------------------
// 旧程序化模型：按【动物种类】重新索引
// 新名单的 id 已经变了（现在的 common-03 是猫，不再是刺猬），
// 所以绝不能再按 id 复用，否则会张冠李戴。
// ---------------------------------------------------------------------------
const OLD_ID_TO_SPECIES = {
  "common-01": "cat",
  "common-02": "bunny",
  "common-03": "hedgehog",
  "common-04": "frog",
  "common-05": "penguin",
  "common-06": "fox",
  "common-07": "dog",
  "common-08": "koala",
  "rare-01": "raccoon",
  "rare-02": "monkey",
  "rare-03": "panda",
  "rare-04": "lion",
  "rare-05": "tiger",
  "rare-06": "bear",
  "epic-01": "hippo",
  "epic-02": "giraffe",
  "epic-03": "elephant",
  "epic-04": "whale",
  "legend-01": "dragon",
  "legend-02": "unicorn",
};

export const PROC_BY_SPECIES = (() => {
  const m = { hedgehog: hedgehog.build };
  for (const [oldId, fn] of Object.entries(PROC_BY_OLD_ID)) {
    const species = OLD_ID_TO_SPECIES[oldId];
    if (species) m[species] = fn;
  }
  return m;
})();

// 缓存后的加载决策（避免每帧重复读 window）
let useGlbOverride = null;

/** 运行时切换 glTF / 程序化模型（调试面板用，null = 回到默认） */
export function setGlbOverride(v) { useGlbOverride = v; }
export function getGlbOverride() { return useGlbOverride; }

/** 动物种类，如 "cat"；由 model 字段推导（animal-cat → cat） */
export function speciesOf(id) {
  const a = animalById(id);
  return a && a.model ? a.model.replace(/^animal-/, "") : null;
}

/** GLB 路径，如 assets/3d/animal-cat.glb；没有则 null */
export function glbSrc(id) { return animalModelSrc(id); }

/** 该动物有没有对应的旧程序化模型（仅 12/24 只命中） */
export function fallbackBuilder(id) {
  const s = speciesOf(id);
  return (s && PROC_BY_SPECIES[s]) || null;
}
