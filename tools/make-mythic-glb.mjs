// 生成两只「神话」动物：腾云龙（蛇形，非四足）与火麒麟（四足，但形态与现有动物区分）
//
//   node tools/make-mythic-glb.mjs
//
// 设计约束（为了和 Kenney Cube Pets 24 只混在一起看不违和）：
//   · 全部零件都是轴对齐立方体，无圆角、无斜面
//   · 共用 Kenney 的色图集 assets/3d/Textures/colormap.png（外链，与其它 GLB 一致）
//   · 单材质 pbrMetallicRoughness + metallicFactor 0 + doubleSided，与 Kenney 相同
//   · 8 条动画的名称与时长严格对齐 Kenney：
//     static 0.1 / idle 1.0 / walk 0.5 / run 0.25 / eat 0.5 / dance 0.5
//     gesture-positive 0.25 / gesture-negative 0.25，全部从 t=0 开始
//   · 面朝 +Z、Y 最低点 = 0（与现有模型一致，viewer 无需特殊处理）
//
// 色块坐标来自对 colormap.png 的实测采样（该图集是 3 行 × 12 列的渐变色块，
// 行边界 v = 0.25 / 0.50 / 0.75）。见文件末尾的 SWATCHES 注释。

import { writeFileSync } from "node:fs";

/* ============================ 色块 ============================ */
// u/v = 色块中心，w = 半宽（都是实测出来的"纯色区"内部，避免采到渐变边界）
const SWATCHES = {
  // 绿色系（第 2 行 col 9 附近）
  green: { u: 0.784, v: 0.62, w: 0.024 }, // #61cb8b 龙身
  greenDark: { u: 0.845, v: 0.62, w: 0.022 }, // #3ea87a 龙背/阴影面
  // 金色系（第 2 行 col 10-11）
  gold: { u: 0.905, v: 0.62, w: 0.020 }, // #ffc044 角/鳍/蹄
  goldDeep: { u: 0.965, v: 0.62, w: 0.024 }, // #ffb54a 麒麟身
  // 浅色系（第 2 行 col 7-8）
  cream: { u: 0.648, v: 0.62, w: 0.018 }, // #fde4c7 腹部
  creamDark: { u: 0.712, v: 0.62, w: 0.018 }, // #f8d7af 腹部阴影
  // 眼睛（第 2 行 col 1 白 / 第 3 行 col 7 深灰）
  white: { u: 0.166, v: 0.62, w: 0.020 }, // #ffffff 眼白
  dark: { u: 0.648, v: 0.90, w: 0.018 }, // #38383d 瞳孔
  // 彩虹鬃毛 / 火焰尾（第 1 行，颜色窄一些所以半宽取小）
  red: { u: 0.125, v: 0.37, w: 0.013 }, // #cf534f
  orange: { u: 0.042, v: 0.37, w: 0.013 }, // #ff7e44
  blue: { u: 0.375, v: 0.37, w: 0.016 }, // #d0e8ff
  purple: { u: 0.542, v: 0.37, w: 0.014 }, // #a878e8
  magenta: { u: 0.625, v: 0.37, w: 0.014 }, // #f378f0
};

/* ============================ 数学 ============================ */
const D2R = Math.PI / 180;
function eulerToQuat([x, y, z]) {
  const [cx, sx] = [Math.cos(x / 2), Math.sin(x / 2)];
  const [cy, sy] = [Math.cos(y / 2), Math.sin(y / 2)];
  const [cz, sz] = [Math.cos(z / 2), Math.sin(z / 2)];
  return [
    sx * cy * cz + cx * sy * sz,
    cx * sy * cz - sx * cy * sz,
    cx * cy * sz + sx * sy * cz,
    cx * cy * cz - sx * sy * sz,
  ];
}
const v3 = (a) => [a[0] || 0, a[1] || 0, a[2] || 0];

/* ============================ 立方体几何 ============================ */
// 单位立方体（边长 1，中心在原点），6 个面各自 4 个顶点。
// 顶面 / 侧面 / 底面各自取色块内略微不同的位置 → 复刻 Kenney 那种"平色带一点明暗"的观感。
function cubeGeometry(sw) {
  const { u, v, w } = sw;
  const h = w; // 竖向半高就用色块半宽，色块在竖直方向是纯色
  // 三个明暗档：上 / 侧 / 下
  const uTop = u - w * 0.45;
  const uSide = u;
  const uBot = u + w * 0.45;
  const v0 = v - h, v1 = v + h;
  const faces = [
    { n: [0, 0, 1], u: uSide }, // +Z
    { n: [0, 0, -1], u: uSide }, // -Z
    { n: [1, 0, 0], u: uSide }, // +X
    { n: [-1, 0, 0], u: uSide }, // -X
    { n: [0, 1, 0], u: uTop }, // +Y（更亮）
    { n: [0, -1, 0], u: uBot }, // -Y（更暗）
  ];
  const pos = [], nrm = [], uv = [], idx = [];
  for (const f of faces) {
    const base = pos.length / 3;
    // 该面上与法线垂直的两个轴
    const axes = [0, 1, 2].filter((i) => f.n[i] === 0);
    const [a1, a2] = axes;
    const corners = [
      [-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5],
    ];
    for (const [c1, c2] of corners) {
      const p = [0, 0, 0];
      p[a1] = c1; p[a2] = c2;
      for (let i = 0; i < 3; i++) p[i] += f.n[i] * 0.5;
      pos.push(...p);
      nrm.push(...f.n);
      uv.push(f.u + (c1 * w * 0.5), v0 + (c2 + 0.5) * (v1 - v0));
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return { pos, nrm, uv, idx };
}

/* ============================ GLB 构造 ============================ */
class Glb {
  constructor() {
    this.json = {
      asset: { version: "2.0", generator: "lucky-star make-mythic-glb" },
      scene: 0,
      scenes: [{ nodes: [] }],
      nodes: [],
      meshes: [],
      materials: [],
      accessors: [],
      bufferViews: [],
      buffers: [],
      animations: [],
      samplers: [{ minFilter: 9987, magFilter: 9729, wrapS: 10497, wrapT: 10497 }],
      textures: [{ sampler: 0, source: 0 }],
      images: [{ uri: "Textures/colormap.png" }],
    };
    this.bin = [];      // Buffer 分片
    this.binLen = 0;
    this.meshBySwatch = new Map();
  }

  _push(buf, byteLength) {
    while (this.binLen % 4) { this.bin.push(Buffer.from([0])); this.binLen++; }
    const offset = this.binLen;
    this.bin.push(buf);
    this.binLen += buf.length;
    void byteLength;
    return offset;
  }

  _view(buf) {
    const offset = this._push(buf);
    this.json.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: buf.length });
    return this.json.bufferViews.length - 1;
  }

  _accessor(view, componentType, count, type, min, max) {
    const a = { bufferView: view, componentType, count, type };
    if (min) a.min = min;
    if (max) a.max = max;
    this.json.accessors.push(a);
    return this.json.accessors.length - 1;
  }

  /** 每种色块一个立方体 mesh（node 的 scale 负责尺寸） */
  meshFor(swatchName) {
    if (this.meshBySwatch.has(swatchName)) return this.meshBySwatch.get(swatchName);
    const g = cubeGeometry(SWATCHES[swatchName]);
    const pos = Buffer.from(new Float32Array(g.pos).buffer);
    const nrm = Buffer.from(new Float32Array(g.nrm).buffer);
    const uv = Buffer.from(new Float32Array(g.uv).buffer);
    const idx = Buffer.from(new Uint16Array(g.idx).buffer);
    const aPos = this._accessor(this._view(pos), 5126, g.pos.length / 3, "VEC3",
      [-0.5, -0.5, -0.5], [0.5, 0.5, 0.5]);
    const aNrm = this._accessor(this._view(nrm), 5126, g.nrm.length / 3, "VEC3");
    const aUv = this._accessor(this._view(uv), 5126, g.uv.length / 2, "VEC2");
    const aIdx = this._accessor(this._view(idx), 5123, g.idx.length, "SCALAR");
    // 每个色块一个材质
    this.json.materials.push({
      name: swatchName,
      pbrMetallicRoughness: {
        baseColorTexture: { index: 0 },
        metallicFactor: 0,
        roughnessFactor: 0.85,
      },
      doubleSided: true,
    });
    this.json.meshes.push({
      name: "cube-" + swatchName,
      primitives: [{
        attributes: { POSITION: aPos, NORMAL: aNrm, TEXCOORD_0: aUv },
        indices: aIdx,
        material: this.json.materials.length - 1,
      }],
    });
    const mi = this.json.meshes.length - 1;
    this.meshBySwatch.set(swatchName, mi);
    return mi;
  }

  /** 加一个零件节点 */
  addPart(part) {
    const node = {
      name: part.name,
      mesh: this.meshFor(part.swatch),
      translation: v3(part.pos),
      scale: v3(part.size),
      rotation: eulerToQuat((part.rot || [0, 0, 0]).map((d) => d * D2R)),
    };
    this.json.nodes.push(node);
    return this.json.nodes.length - 1;
  }

  /** 动画：keys = [{ t, values: { nodeIndex: { rot?: [deg,deg,deg], pos?: [dx,dy,dz] } } }] */
  addAnimation(name, keys, parts, rootIndex) {
    const EPS = 1e-6;
    const moved = (d) => Math.abs(d[0]) + Math.abs(d[1]) + Math.abs(d[2]) > EPS;

    // 第一遍：先找出这条动画里【真的会动】的节点。
    // 否则会给所有零件都写轨道（45 个零件 × 8 条 = 上千个 accessor，文件白白胖三倍）。
    const movers = new Set();
    for (const k of keys) {
      for (const part of parts) {
        const val = k.values[part.nodeIndex];
        if (val && ((val.rot && moved(val.rot)) || (val.pos && moved(val.pos)))) movers.add(part.nodeIndex);
      }
    }
    const rootMoves = rootIndex != null && keys.some((k) => Math.abs(k.rootDy || 0) > EPS);

    // 第二遍：只为这些节点收集帧（没动的帧写 0 增量，保证插值正确）
    const rotFrames = new Map(), posFrames = new Map();
    const hasPos = new Set();
    for (const k of keys) {
      for (const ni of movers) {
        const part = parts.find((p) => p.nodeIndex === ni);
        const val = k.values[ni] || {};
        const d = val.pos ? val.pos : [0, 0, 0];
        if (moved(d)) hasPos.add(ni);
      }
    }
    for (const k of keys) {
      for (const ni of movers) {
        const part = parts.find((p) => p.nodeIndex === ni);
        const base = part.baseRot || part.rot || [0, 0, 0];
        const dr = (k.values[ni] && k.values[ni].rot) || [0, 0, 0];
        const q = eulerToQuat([(base[0] + dr[0]) * D2R, (base[1] + dr[1]) * D2R, (base[2] + dr[2]) * D2R]);
        if (!rotFrames.has(ni)) rotFrames.set(ni, []);
        rotFrames.get(ni).push({ t: k.t, v: q });
        if (hasPos.has(ni)) {
          const dx = (k.values[ni] && k.values[ni].pos) || [0, 0, 0];
          const bp = v3(part.pos);
          if (!posFrames.has(ni)) posFrames.set(ni, []);
          posFrames.get(ni).push({ t: k.t, v: [bp[0] + dx[0], bp[1] + dx[1], bp[2] + dx[2]] });
        }
      }
    }

    const channels = [], samplers = [];
    const addTrack = (ni, path, frames) => {
      const times = new Float32Array(frames.map((f) => f.t));
      const comps = path === "rotation" ? 4 : 3;
      const flat = new Float32Array(frames.length * comps);
      frames.forEach((f, i) => f.v.forEach((x, c) => { flat[i * comps + c] = x; }));
      const aIn = this._accessor(this._view(Buffer.from(times.buffer)), 5126, frames.length, "SCALAR",
        [Math.min(...times)], [Math.max(...times)]);
      const aOut = this._accessor(this._view(Buffer.from(flat.buffer)), 5126, frames.length,
        path === "rotation" ? "VEC4" : "VEC3");
      samplers.push({ input: aIn, output: aOut, interpolation: "LINEAR" });
      channels.push({ sampler: samplers.length - 1, target: { node: ni, path } });
    };
    for (const [ni, frames] of rotFrames) addTrack(ni, "rotation", frames);
    for (const [ni, frames] of posFrames) addTrack(ni, "translation", frames);
    if (rootMoves) {
      addTrack(rootIndex, "translation", keys.map((k) => ({ t: k.t, v: [0, k.rootDy || 0, 0] })));
    }
    if (!channels.length) {
      // 像 static 这种完全没动作的 clip 也要保留（Kenney 也有），
      // 给第一个零件写一段「不变的」旋转轨道即可
      const p0 = parts[0];
      const q = eulerToQuat((p0.rot || [0, 0, 0]).map((d) => d * D2R));
      addTrack(p0.nodeIndex, "rotation", [{ t: 0, v: q }, { t: 0.1, v: q }]);
    }
    this.json.animations.push({ name, channels, samplers });
  }

  write(file) {
    const binBuf = Buffer.concat(this.bin);
    const binPadded = Buffer.concat([binBuf, Buffer.alloc((4 - binBuf.length % 4) % 4)]);
    this.json.buffers.push({ byteLength: binBuf.length });
    let jsonStr = JSON.stringify(this.json);
    while (Buffer.byteLength(jsonStr) % 4) jsonStr += " ";
    const jsonBuf = Buffer.from(jsonStr, "utf8");
    const total = 12 + 8 + jsonBuf.length + 8 + binPadded.length;
    const head = Buffer.alloc(12);
    head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(total, 8);
    const jh = Buffer.alloc(8); jh.writeUInt32LE(jsonBuf.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
    const bh = Buffer.alloc(8); bh.writeUInt32LE(binPadded.length, 0); bh.writeUInt32LE(0x004e4942, 4);
    writeFileSync(file, Buffer.concat([head, jh, jsonBuf, bh, binPadded]));
    return { file, bytes: total, nodes: this.json.nodes.length, animations: this.json.animations.length };
  }
}

/* ============================ 动画曲线 ============================ */
const sin = (x) => Math.sin(x * Math.PI * 2);
const CLIPS = {
  static: { dur: 0.1, frames: [0, 0.1] },
  idle: { dur: 1.0, frames: [0, 0.25, 0.5, 0.75, 1.0] },
  walk: { dur: 0.5, frames: [0, 0.125, 0.25, 0.375, 0.5] },
  run: { dur: 0.25, frames: [0, 0.0625, 0.125, 0.1875, 0.25] },
  eat: { dur: 0.5, frames: [0, 0.25, 0.5] },
  dance: { dur: 0.5, frames: [0, 0.125, 0.25, 0.375, 0.5] },
  "gesture-positive": { dur: 0.25, frames: [0, 0.125, 0.25] },
  "gesture-negative": { dur: 0.25, frames: [0, 0.125, 0.25] },
};

// 每个 role 在某个 clip、某个归一化进度 p∈[0,1] 下的动作增量
function pose(clip, role, p) {
  const out = { rot: [0, 0, 0], pos: [0, 0, 0] };
  const fam = role.replace(/[0-9]+$/, "");
  const idx = Number((role.match(/(\d+)$/) || [0, 0])[0]) || 0;
  const isSerpent = /^body/.test(fam);
  switch (clip) {
    case "idle": {
      if (isSerpent) out.rot[0] = sin(p - idx * 0.12) * 2.2;
      if (fam === "tail") out.rot[0] = sin(p + 0.3) * 4;
      if (fam === "tailfin") out.rot[0] = sin(p + 0.5) * 7;
      if (fam === "whisker") out.rot[2] = sin(p + (role.endsWith("L") ? 0 : 0.4)) * 5;
      if (fam === "head") out.rot[0] = sin(p) * 1.8;
      if (fam === "mane") out.rot[0] = sin(p + 0.2) * 3;
      break;
    }
    case "walk":
    case "run": {
      const big = clip === "run" ? 1.6 : 1;
      if (/^leg/.test(fam)) {
        const ph = /FL|BR/.test(role) ? 0 : 0.5;
        out.rot[0] = sin(p + ph) * 16 * big;
      }
      if (isSerpent) out.rot[0] = sin(p * 2 - idx * 0.2) * 5 * big;
      if (fam === "body" && !isSerpent) out.pos[1] = Math.abs(sin(p)) * 0.03 * big;
      if (fam === "tail") out.rot[0] = sin(p + 0.25) * 6 * big;
      if (fam === "head") out.rot[0] = sin(p * 2) * 2;
      break;
    }
    case "eat": {
      if (fam === "head") out.rot[0] = -28 * Math.sin(p * Math.PI);
      if (fam === "muzzle") out.rot[0] = -6 * Math.sin(p * Math.PI);
      if (fam === "jaw") out.rot[0] = -13 * Math.sin(p * Math.PI * 2);
      if (isSerpent) out.rot[0] = -6 * Math.sin(p * Math.PI) * (idx / 4);
      break;
    }
    case "dance": {
      if (isSerpent) out.rot[0] = sin(p - idx * 0.15) * 11;
      if (fam === "body") out.rot[0] = sin(p) * 6;
      if (fam === "head") { out.rot[0] = sin(p * 2) * 9; out.rot[2] = sin(p) * 7; }
      if (fam === "jaw") out.rot[0] = -7 - 5 * sin(p * 2);
      if (fam === "tail") out.rot[0] = sin(p + 0.5) * 13;
      if (fam === "tailfin") out.rot[0] = sin(p + 0.7) * 18;
      if (fam === "mane") out.rot[0] = sin(p + 0.35) * 12;
      if (fam === "whisker") out.rot[2] = sin(p + 0.6) * 14;
      if (/^leg/.test(fam)) out.rot[0] = sin(p * 2 + (/FL|BR/.test(role) ? 0 : 0.5)) * 8;
      break;
    }
    case "gesture-positive": {
      const e = Math.sin(p * Math.PI);
      if (fam === "head") out.rot[0] = -13 * e;
      if (fam === "jaw") out.rot[0] = -10 * e;
      if (fam === "tail") out.rot[0] = -6 * e;
      if (fam === "tailfin") out.rot[0] = -12 * e;
      if (fam === "mane") out.rot[0] = -8 * e;
      break;
    }
    case "gesture-negative": {
      const e = Math.sin(p * Math.PI);
      if (fam === "head") out.rot[0] = 11 * e;
      if (fam === "jaw") out.rot[0] = 5 * e;
      if (fam === "tail") out.rot[0] = 5 * e;
      break;
    }
    default: break;
  }
  return out;
}

const rootDyFor = (clip, p) => {
  if (clip === "dance") return sin(p * 2) * 0.055;
  if (clip === "idle") return sin(p) * 0.022;
  if (clip === "gesture-positive") return Math.sin(p * Math.PI) * 0.07;
  if (clip === "walk" || clip === "run") return Math.abs(sin(p)) * 0.03;
  return 0;
};

/* ============================ 建模 ============================ */
// 一个立方体零件：name / swatch / 中心 pos / 尺寸 size / 基础旋转 rot(度) / role（动画用）
// pivot：可选。给了就先把零件挂到一个位于 pivot 的空节点下，旋转绕 pivot 发生
//（下顰需要绕根部开合，绕零件中心转会穿帮）
const P = (name, swatch, pos, size, role, rot, pivot) => ({ name, swatch, pos, size, role: role || name, rot: rot || [0, 0, 0], pivot: pivot || null });

/* ---------- 腾云龙：中式蛇形、金身红须、头不是方块、张嘴露舌与牙 ---------- */
function dragonParts() {
  const parts = [];
  // 7 段身体：比上一版更长、渐细更陡（避免均匀分节的“毛毛虫感”）
  const spine = [
    // z,     y,     size, rotX
    [0.34, 1.06, 0.46, -14],
    [-0.02, 0.98, 0.41, -3],
    [-0.38, 0.92, 0.36, 7],
    [-0.74, 0.89, 0.31, 17],
    [-1.10, 0.90, 0.26, 27],
    [-1.46, 0.95, 0.21, 36],
    [-1.80, 1.03, 0.17, 44],
  ];
  spine.forEach(([z, y, s, rx], i) => {
    parts.push(P(`body${i + 1}`, i >= 4 ? "goldDeep" : "gold", [0, y, z], [s, s * 0.94, s * 1.10], `body${i + 1}`, [rx, 0, 0]));
    parts.push(P(`belly${i + 1}`, "cream", [0, y - s * 0.40, z], [s * 0.70, s * 0.20, s * 0.90], `body${i + 1}`, [rx, 0, 0]));
    parts.push(P(`fin${i + 1}`, "red", [0, y + s * 0.62, z], [0.10, 0.34, 0.22], `body${i + 1}`, [rx, 0, 0]));
  });

  // 脖子 2 段
  parts.push(P("neck1", "gold", [0, 1.24, 0.48], [0.40, 0.40, 0.40], "neck", [-30, 0, 0]));
  parts.push(P("neck0", "gold", [0, 1.46, 0.66], [0.46, 0.46, 0.44], "neck", [-22, 0, 0]));

  /* 龙头：颅骨 → 上颚 → 吻尖 逐级变窄，不再是“大立方 + 小立方” */
  parts.push(P("skull", "gold", [0, 1.72, 0.94], [0.80, 0.72, 0.68], "head"));
  parts.push(P("upperJaw", "gold", [0, 1.64, 1.34], [0.56, 0.32, 0.58], "muzzle", [7, 0, 0]));
  parts.push(P("snout", "goldDeep", [0, 1.60, 1.68], [0.42, 0.26, 0.24], "muzzle", [7, 0, 0]));
  for (const sx of [-1, 1]) {
    parts.push(P(`nostril${sx < 0 ? "L" : "R"}`, "dark", [0.11 * sx, 1.63, 1.79], [0.10, 0.10, 0.06], "muzzle"));
  }
  parts.push(P("brow", "red", [0, 2.00, 1.14], [0.62, 0.10, 0.20], "head"));
  // 口腔（把张开的缝压暗）+ 上颚牙齿
  parts.push(P("mouthCavity", "dark", [0, 1.52, 1.34], [0.46, 0.26, 0.46], "head"));
  for (const sx of [-1, 0, 1]) {
    parts.push(P(`toothU${sx + 1}`, "white", [0.15 * sx, 1.50, 1.58], [0.09, 0.14, 0.08], "head"));
  }
  // 下颚：绕根部旋开 30°，与上颚之间就是张开的嘴
  const JAW_PIVOT = [0, 1.58, 1.06];
  const JAW_ROT = [30, 0, 0];
  parts.push(P("lowerJaw", "gold", [0, 1.44, 1.34], [0.50, 0.24, 0.56], "jaw", JAW_ROT, JAW_PIVOT));
  parts.push(P("tongue", "red", [0, 1.57, 1.38], [0.26, 0.08, 0.44], "jaw", JAW_ROT, JAW_PIVOT));
  for (const sx of [-1, 1]) {
    parts.push(P(`toothL${sx < 0 ? "L" : "R"}`, "white", [0.13 * sx, 1.59, 1.46], [0.09, 0.12, 0.08], "jaw", JAW_ROT, JAW_PIVOT));
  }
  // 大眼睛（眼白 + 瞳孔 + 高光）
  for (const sx of [-1, 1]) {
    const L = sx < 0 ? "L" : "R";
    parts.push(P(`eye${L}`, "white", [0.26 * sx, 1.84, 1.20], [0.28, 0.28, 0.16], "head"));
    parts.push(P(`pupil${L}`, "dark", [0.27 * sx, 1.84, 1.30], [0.16, 0.16, 0.08], "head"));
    parts.push(P(`glint${L}`, "white", [0.32 * sx, 1.90, 1.34], [0.06, 0.06, 0.04], "head"));
  }
  // 红色鹿角（主枝 + 分叉）
  for (const sx of [-1, 1]) {
    const L = sx < 0 ? "L" : "R";
    parts.push(P(`antler${L}`, "red", [0.22 * sx, 2.16, 0.88], [0.10, 0.42, 0.10], "head", [-16, 0, 0]));
    parts.push(P(`antlerFork${L}`, "red", [0.38 * sx, 2.34, 0.80], [0.28, 0.09, 0.09], "head", [0, 0, 20 * sx]));
  }
  // 红色龙须（从上颚两侧向后飘）
  for (const sx of [-1, 1]) {
    parts.push(P(`whisker${sx < 0 ? "L" : "R"}`, "red", [0.30 * sx, 1.56, 1.26], [0.08, 0.08, 1.10], "whiskerL", [-14, 0, 0]));
  }
  // 颅骨后方一圈红/橙鬃毛 → 进一步远离“毛毛虫”
  ["red", "orange", "red", "orange", "red"].forEach((c, i) => {
    const sp = (i - 2) / 2;
    parts.push(P(`mane${i}`, c,
      [sp * 0.34, 1.66 + (1 - Math.abs(sp)) * 0.26, 0.50 - Math.abs(sp) * 0.10],
      [0.20, 0.34 - Math.abs(sp) * 0.06, 0.24], "mane", [-20 + Math.abs(sp) * 12, 0, -sp * 30]));
  });

  // 四只小爪：短、向后收 → 腾云漂浮而不是四足站立
  const legs = [
    ["legFL", 0.21, 0.22],
    ["legFR", -0.21, 0.22],
    ["legBL", 0.18, -0.62],
    ["legBR", -0.18, -0.62],
  ];
  for (const [role, x, z] of legs) {
    parts.push(P(role + "Upper", "goldDeep", [x, 0.68, z + 0.04], [0.16, 0.30, 0.16], role, [22, 0, 0]));
    parts.push(P(role + "Claw", "red", [x, 0.48, z + 0.14], [0.22, 0.16, 0.30], role, [22, 0, 0]));
  }

  // 尾：2 段渐细 + 尾端火焰鳍
  parts.push(P("tail1", "goldDeep", [0, 1.14, -2.04], [0.15, 0.15, 0.32], "tail", [50, 0, 0]));
  parts.push(P("tail2", "goldDeep", [0, 1.34, -2.22], [0.12, 0.12, 0.28], "tail", [56, 0, 0]));
  parts.push(P("tailfin", "red", [0, 1.56, -2.32], [0.44, 0.32, 0.10], "tailfin", [54, 0, 0]));
  parts.push(P("tailfin2", "orange", [0, 1.80, -2.38], [0.24, 0.28, 0.08], "tailfin", [54, 0, 0]));
  return parts;
}

/* ---------- 火麒麟：红金配色，四足但长脖长躯干 + 金色独角 + 金橙火焰鬃毛 ---------- */
function qilinParts() {
  const parts = [];
  parts.push(P("body", "red", [0, 0.92, -0.12], [0.70, 0.62, 1.30], "body"));
  parts.push(P("belly", "cream", [0, 0.64, -0.06], [0.58, 0.20, 1.16], "body"));
  // 金鳞斑块（贴在红躯干两侧）
  const scaleCols = ["gold", "goldDeep", "cream"];
  for (const sx of [-1, 1]) {
    scaleCols.forEach((c, i) => {
      parts.push(P(`scale${sx < 0 ? "L" : "R"}${i}`, c, [0.36 * sx, 1.02 - i * 0.12, 0.20 - i * 0.38], [0.06, 0.20, 0.26], "body"));
    });
  }
  // 背上金橙火焰
  ["gold", "orange", "goldDeep"].forEach((c, i) => {
    parts.push(P(`backFlame${i}`, c, [0, 1.26 - i * 0.04, 0.10 - i * 0.34], [0.10, 0.26 - i * 0.04, 0.24], "body", [-8, 0, 0]));
  });
  // 脖子 2 段（金色，与红躯干对比）
  parts.push(P("neck1", "gold", [0, 1.16, 0.38], [0.50, 0.50, 0.46], "neck", [-20, 0, 0]));
  parts.push(P("neck0", "gold", [0, 1.34, 0.60], [0.46, 0.46, 0.42], "neck", [-24, 0, 0]));

  // 金橙火焰鬃毛：沿头顶向后展开的扇形
  const maneCols = ["gold", "orange", "goldDeep", "orange", "goldDeep", "gold"];
  maneCols.forEach((c, i) => {
    const sp = (i - 2.5) / 2.5;
    parts.push(P(`mane${i}`, c,
      [sp * 0.40, 1.42 - Math.abs(sp) * 0.10, -0.02 - Math.abs(sp) * 0.16],
      [0.22, 0.34 - Math.abs(sp) * 0.06, 0.28], "mane", [-26 + Math.abs(sp) * 10, 0, -sp * 26]));
  });

  // 头（金色）+ 短吻 + 嘴线；3/4 视角能正对镜头看到脸
  parts.push(P("head", "gold", [0, 1.62, 0.90], [0.92, 0.76, 0.76], "head"));
  parts.push(P("muzzle", "creamDark", [0, 1.48, 1.26], [0.54, 0.32, 0.26], "muzzle"));
  parts.push(P("nose", "red", [0, 1.54, 1.38], [0.24, 0.14, 0.08], "muzzle"));
  parts.push(P("mouth", "dark", [0, 1.38, 1.36], [0.32, 0.06, 0.06], "muzzle"));
  parts.push(P("brow", "red", [0, 1.92, 1.04], [0.62, 0.09, 0.18], "head"));
  for (const sx of [-1, 1]) {
    const L = sx < 0 ? "L" : "R";
    parts.push(P(`eye${L}`, "white", [0.28 * sx, 1.74, 1.18], [0.28, 0.28, 0.16], "head"));
    parts.push(P(`pupil${L}`, "dark", [0.29 * sx, 1.74, 1.28], [0.16, 0.16, 0.08], "head"));
    parts.push(P(`glint${L}`, "white", [0.34 * sx, 1.80, 1.32], [0.06, 0.06, 0.04], "head"));
  }
  // 金色独角（三段渐细、向前倾）
  parts.push(P("horn1", "gold", [0, 2.02, 1.00], [0.20, 0.34, 0.20], "horn", [-16, 0, 0]));
  parts.push(P("horn2", "goldDeep", [0, 2.30, 1.08], [0.13, 0.28, 0.13], "horn", [-16, 0, 0]));
  parts.push(P("hornTip", "gold", [0, 2.50, 1.14], [0.07, 0.16, 0.07], "horn", [-16, 0, 0]));
  // 一对分叉鹿角
  for (const sx of [-1, 1]) {
    const L = sx < 0 ? "L" : "R";
    parts.push(P(`antler${L}`, "goldDeep", [0.30 * sx, 1.94, 0.66], [0.10, 0.42, 0.10], "head", [-22, 0, 0]));
    parts.push(P(`antlerFork${L}`, "goldDeep", [0.46 * sx, 2.14, 0.60], [0.26, 0.09, 0.09], "head", [0, 0, 24 * sx]));
  }
  // 金胡子
  parts.push(P("beard", "goldDeep", [0, 1.34, 1.20], [0.22, 0.20, 0.12], "muzzle"));

  // 四条短腿：上红下金 + 金蹄
  const legs = [["legFL", 0.26, 0.38], ["legFR", -0.26, 0.38], ["legBL", 0.25, -0.64], ["legBR", -0.25, -0.64]];
  for (const [role, x, z] of legs) {
    parts.push(P(role + "Upper", "red", [x, 0.58, z], [0.21, 0.30, 0.23], role));
    parts.push(P(role + "Lower", "gold", [x, 0.32, z], [0.18, 0.26, 0.19], role));
    parts.push(P(role + "Hoof", "goldDeep", [x, 0.14, z - 0.02], [0.24, 0.18, 0.28], role));
  }

  // 尾：红 → 橙 → 金 的火焰尾
  parts.push(P("tail1", "red", [0, 0.94, -0.92], [0.24, 0.24, 0.36], "tail", [16, 0, 0]));
  parts.push(P("tail2", "orange", [0, 1.14, -1.08], [0.19, 0.19, 0.32], "tail", [28, 0, 0]));
  parts.push(P("tailfin", "gold", [0, 1.40, -1.18], [0.34, 0.36, 0.12], "tailfin", [26, 0, 0]));
  parts.push(P("tailfin2", "goldDeep", [0, 1.64, -1.22], [0.20, 0.26, 0.08], "tailfin", [26, 0, 0]));
  return parts;
}

/* ============================ 组装并输出 ============================ */
function build(kind, parts, outFile) {
  const glb = new Glb();
  // 预留 node 0 作为 root（提供整体上下浮动）
  glb.json.nodes.push({ name: `animal-${kind}`, children: [] });
  for (const p of parts) {
    if (p.pivot) {
      // 枢轴节点（承担旋转） + 零件作为子节点（相对枢轴偏移）
      glb.json.nodes.push({
        name: p.name + "Pivot",
        translation: v3(p.pivot),
        rotation: eulerToQuat((p.rot || [0, 0, 0]).map((d) => d * D2R)),
        children: [],
      });
      const pivotIndex = glb.json.nodes.length - 1;
      const child = {
        name: p.name,
        mesh: glb.meshFor(p.swatch),
        translation: [p.pos[0] - p.pivot[0], p.pos[1] - p.pivot[1], p.pos[2] - p.pivot[2]],
        scale: v3(p.size),
      };
      glb.json.nodes.push(child);
      glb.json.nodes[pivotIndex].children.push(glb.json.nodes.length - 1);
      glb.json.nodes[0].children.push(pivotIndex);
      p.nodeIndex = pivotIndex;
      p.baseRot = p.rot || [0, 0, 0];
    } else {
      p.nodeIndex = glb.addPart(p);
      glb.json.nodes[0].children.push(p.nodeIndex);
      p.baseRot = p.rot || [0, 0, 0];
    }
  }
  glb.json.scenes[0].nodes.push(0);

  for (const [clip, cfg] of Object.entries(CLIPS)) {
    const keys = cfg.frames.map((t) => {
      const p = cfg.dur ? t / cfg.dur : 0;
      const values = {};
      for (const part of parts) values[part.nodeIndex] = pose(clip, part.role, p);
      return { t, values, rootDy: rootDyFor(clip, p) };
    });
    glb.addAnimation(clip, keys, parts, 0);
  }
  const info = glb.write(outFile);
  // 统计包围盒（用基础 TRS 粗略算，给自检参考）
  let minY = Infinity, maxY = -Infinity;
  for (const p of parts) {
    const halfY = p.size[1] / 2;
    minY = Math.min(minY, p.pos[1] - halfY);
    maxY = Math.max(maxY, p.pos[1] + halfY);
  }
  console.log(`  ${outFile}: ${(info.bytes / 1024).toFixed(1)} KB | 零件 ${parts.length} | 节点 ${info.nodes} | 动画 ${info.animations} | 模型 Y ${minY.toFixed(2)} ~ ${maxY.toFixed(2)}`);
  return { minY, maxY };
}

console.log("生成神话动物：");
const d = build("dragon", dragonParts(), "assets/3d/animal-dragon.glb");
const q = build("qilin", qilinParts(), "assets/3d/animal-qilin.glb");
console.log(`\n腾云龙 Y 最低点 ${d.minY.toFixed(3)}｜火麒麟 Y 最低点 ${q.minY.toFixed(3)}`);
console.log("（Kenney 的 24 只都是脚在 Y=0；腾云龙故意悬空所以 > 0，viewer 会按包围盒自动落地）");
