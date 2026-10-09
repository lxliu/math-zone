// 低多边形动物生成库（参数化）
import * as THREE from "../../vendor/three.module.min.js";

export const ico = (r, d = 0) => new THREE.IcosahedronGeometry(r, d);
export const cone = (r, h, s = 6) => new THREE.ConeGeometry(r, h, s);
export const cyl = (r1, r2, h, s = 8) => new THREE.CylinderGeometry(r1, r2, h, s);
export const cap = (r, len) => new THREE.CapsuleGeometry(r, len, 3, 6);

export const mat = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, metalness: 0, ...extra });

const UP = new THREE.Vector3(0, 1, 0);
export function onSphere(center, r, dir) {
  return center.clone().addScaledVector(dir.clone().normalize(), r);
}
export function add(g, geo, material, pos = [0, 0, 0], scale = [1, 1, 1], rot = null) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(pos[0], pos[1], pos[2]);
  m.scale.set(scale[0], scale[1], scale[2]);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  m.castShadow = true;
  g.add(m);
  return m;
}

export function addEyes(g, center, r, opts = {}) {
  const { spacing = 0.44, y = 0.34, z = 0.86, size = 0.16, pupil = 0.105 } = opts;
  const whiteMat = mat(0xffffff, { roughness: 0.4 });
  const darkMat = mat(0x3b3b4a, { roughness: 0.5 });
  for (const sx of [-1, 1]) {
    const dir = new THREE.Vector3(spacing * sx, y, z);
    add(g, ico(size, 1), whiteMat, onSphere(center, r, dir).toArray());
    add(g, ico(pupil, 1), darkMat, onSphere(center, r + 0.07, dir).toArray());
    add(g, ico(0.045, 1), whiteMat, onSphere(center, r + 0.14, new THREE.Vector3((spacing + 0.06) * sx, y + 0.18, z)).toArray());
  }
}

function addEars(g, type, headC, r, c) {
  if (!type || type === "none") return;
  const earMat = mat(c.ear || c.body);
  const innerMat = mat(c.earInner || 0xf3a6a6);
  const sides = [-1, 1];
  if (type === "round") {
    for (const sx of sides) {
      const dir = new THREE.Vector3(0.6 * sx, 0.78, 0.05);
      add(g, ico(0.24, 0), earMat, onSphere(headC, r + 0.04, dir).toArray());
      add(g, ico(0.12, 0), innerMat, onSphere(headC, r + 0.16, dir).toArray());
    }
  } else if (type === "pointy") {
    for (const sx of sides) {
      const dir = new THREE.Vector3(0.5 * sx, 0.86, 0.0);
      const e = new THREE.Mesh(cone(0.22, 0.5, 4), earMat);
      e.position.copy(onSphere(headC, r + 0.12, dir));
      e.quaternion.setFromUnitVectors(UP, dir.clone().normalize());
      e.castShadow = true;
      g.add(e);
      const inr = new THREE.Mesh(cone(0.11, 0.3, 4), innerMat);
      inr.position.copy(onSphere(headC, r + 0.2, new THREE.Vector3(0.5 * sx, 0.84, 0.22)));
      inr.quaternion.setFromUnitVectors(UP, dir.clone().normalize());
      g.add(inr);
    }
  } else if (type === "long") {
    for (const sx of sides) {
      add(g, cap(0.13, 0.5), earMat, onSphere(headC, r + 0.3, new THREE.Vector3(0.32 * sx, 0.94, 0.02)).toArray(), [1, 1, 0.8]);
      add(g, cap(0.07, 0.4), innerMat, onSphere(headC, r + 0.34, new THREE.Vector3(0.32 * sx, 0.94, 0.3)).toArray(), [1, 1, 0.7]);
    }
  } else if (type === "floppy") {
    for (const sx of sides) {
      add(g, ico(0.26, 1), earMat, onSphere(headC, r + 0.05, new THREE.Vector3(0.92 * sx, 0.32, 0.05)).toArray(), [0.6, 1.25, 0.8]);
    }
  } else if (type === "big") {
    for (const sx of sides) {
      add(g, ico(0.5, 1), earMat, onSphere(headC, r + 0.05, new THREE.Vector3(0.95 * sx, 0.15, -0.05)).toArray(), [0.5, 1.1, 0.9]);
    }
  } else if (type === "tiny") {
    for (const sx of sides) {
      add(g, ico(0.11, 0), earMat, onSphere(headC, r + 0.05, new THREE.Vector3(0.7 * sx, 0.72, 0.05)).toArray());
    }
  } else if (type === "fluffy") {
    for (const sx of sides) {
      const dir = new THREE.Vector3(0.78 * sx, 0.62, 0.0);
      add(g, ico(0.34, 1), earMat, onSphere(headC, r + 0.02, dir).toArray());
      add(g, ico(0.19, 1), innerMat, onSphere(headC, r + 0.16, dir).toArray());
    }
  }
}

function addTail(g, spec, c) {
  if (!spec || spec.type === "none") return;
  const m = mat(spec.color || c.tail || c.body);
  const by = 0.1, bz = -1.55;
  if (spec.type === "short") add(g, ico(0.2, 0), m, [0, by, bz - 0.1]);
  else if (spec.type === "bushy") add(g, ico(0.34, 1), m, [0, by + 0.15, bz - 0.25], [0.9, 0.9, 1.3]);
  else if (spec.type === "long") add(g, cap(0.09, 0.9), m, [0, by + 0.3, bz - 0.55], [1, 1, 1], [0.9, 0, 0]);
  else if (spec.type === "curl") {
    for (let i = 0; i < 4; i++) add(g, ico(0.09, 0), m, [0, by + 0.1 + i * 0.12, bz - 0.3 - i * 0.14]);
  }
}

function addLegs(g, spec, c) {
  const legMat = mat(spec.color || c.legs || c.body);
  const pawMat = mat(spec.pawColor || c.paw || spec.color || c.legs || c.body);
  const h = spec.h ?? 0.9;
  const xs = spec.xSpread ?? 0.55;
  const zs = spec.zSpread ?? 0.55;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      add(g, cap(spec.r ?? 0.16, h), legMat, [xs * sx, -0.85, zs * sz], [1, h / 0.9, 1]);
      if (spec.paw !== false) add(g, ico(0.17, 0), pawMat, [xs * sx, -0.85 - h * 0.62, zs * sz + 0.03], [1, 0.7, 1.15]);
    }
  }
}

// 通用四足动物
export function buildQuadruped(s) {
  const c = s.colors;
  const g = new THREE.Group();
  add(g, ico(1, 1), mat(c.body), [0, 0, 0], s.bodyScale || [1.25, 1.0, 1.55]);
  if (c.belly) add(g, ico(0.8, 1), mat(c.belly), [0, -0.22, 0.25], [0.95, 0.82, 1.15]);

  const headC = new THREE.Vector3(0, s.headY ?? 0.78, s.headZ ?? 1.25);
  const r = s.headR ?? 0.72;

  if (s.neck) {
    const from = new THREE.Vector3(0, 0.45, 0.95);
    const dir = headC.clone().sub(from);
    const len = dir.length();
    const n = new THREE.Mesh(cyl(0.42, 0.26, len), mat(c.neck || c.body));
    n.position.copy(from.clone().add(headC).multiplyScalar(0.5));
    n.quaternion.setFromUnitVectors(UP, dir.clone().normalize());
    n.castShadow = true;
    g.add(n);
  }

  add(g, ico(r, 1), mat(c.head || c.body), headC.toArray());

  const nz = new THREE.Vector3(0, -0.28, 0.96);
  if (c.muzzle) add(g, ico(r * 0.5, 1), mat(c.muzzle), onSphere(headC, r + 0.02, nz).toArray(), [1.05, 0.82, 1.15]);
  if (s.trunk) {
    const tm = mat(c.trunk || c.body);
    let p = onSphere(headC, r + 0.05, new THREE.Vector3(0, -0.45, 0.88));
    const dir = new THREE.Vector3(0, -0.78, 0.42).normalize();
    for (let i = 0; i < 5; i++) {
      add(g, ico(0.24 - i * 0.035, 1), tm, p.toArray());
      p.addScaledVector(dir, 0.22);
    }
  } else {
    add(g, ico(0.12, 1), mat(c.nose || 0x3b3b4a), onSphere(headC, r + (c.muzzle ? 0.42 : 0.36), nz).toArray());
  }

  if (c.eyePatch) for (const sx of [-1, 1]) add(g, ico(0.2, 1), mat(c.eyePatch), onSphere(headC, r - 0.02, new THREE.Vector3(0.44 * sx, 0.3, 0.9)).toArray(), [1, 1.25, 0.7]);
  if (c.mask) add(g, ico(r * 0.92, 1), mat(c.mask), onSphere(headC, r - 0.06, new THREE.Vector3(0, 0.16, 0.92)).toArray(), [1.02, 0.5, 0.9]);

  if (s.eyes !== false) addEyes(g, headC, r, s.eyeOpts || {});
  addEars(g, s.ears, headC, r, c);

  if (s.mane) {
    const mm = mat(c.mane || c.body);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const dir = new THREE.Vector3(Math.cos(a), Math.sin(a) * 0.9, -0.15);
      const e = new THREE.Mesh(cone(0.22, 0.5, 5), mm);
      e.position.copy(onSphere(headC, r * 1.05, dir));
      e.quaternion.setFromUnitVectors(UP, dir.clone().normalize());
      e.castShadow = true;
      g.add(e);
    }
  }

  if (s.stripes) {
    const sm = mat(c.stripe || 0x4a3210);
    for (let i = 0; i < 4; i++) {
      const z = 0.6 - i * 0.5;
      for (const sx of [-1, 1]) add(g, ico(0.16, 0), sm, [0.95 * sx, 0.55, z], [0.5, 1.1, 0.7]);
    }
    add(g, ico(0.16, 0), sm, [0, 0.92, 0.15], [0.6, 0.7, 1.2]);
  }

  if (s.spots) {
    const pm = mat(c.spot || 0xc79a3e);
    for (const [x, y, z] of [[0.65, 0.5, 0.8], [-0.7, 0.3, 0.1], [0.75, 0.2, -0.5], [0, 0.6, -0.9], [-0.5, 0.5, 1.05]]) {
      add(g, ico(0.15, 0), pm, [x, y, z], [1, 0.8, 1]);
    }
  }

  if (s.horn === "ossicone") {
    for (const sx of [-1, 1]) {
      add(g, cyl(0.06, 0.06, 0.4), mat(c.horn || 0x8b6a2e), [0.22 * sx, headC.y + r * 0.95, headC.z - 0.05]);
      add(g, ico(0.09, 0), mat(c.horn || 0x8b6a2e), [0.22 * sx, headC.y + r * 0.95 + 0.22, headC.z - 0.05]);
    }
  } else if (s.horn === "unicorn") {
    add(g, cone(0.13, 0.5, 6), mat(c.horn || 0xffe08a), [0, headC.y + r + 0.2, headC.z + 0.05], [1, 1, 1], [-0.3, 0, 0]);
  } else if (s.horn === "dragon") {
    for (const sx of [-1, 1]) {
      const e = new THREE.Mesh(cone(0.1, 0.45, 5), mat(c.horn || 0xe8d08a));
      e.position.set(0.26 * sx, headC.y + r + 0.05, headC.z - 0.2);
      e.rotation.set(-0.6, 0, 0.3 * sx);
      e.castShadow = true;
      g.add(e);
    }
  }

  addLegs(g, s.legs || {}, c);
  addTail(g, s.tail, c);
  return g;
}

export function buildPenguin(c) {
  const g = new THREE.Group();
  add(g, ico(1, 1), mat(c.body), [0, 0.1, 0], [0.95, 1.2, 0.85]);
  add(g, ico(0.72, 1), mat(c.belly || 0xf6f8fb), [0, 0.0, 0.42], [0.85, 1.15, 0.6]);
  const headC = new THREE.Vector3(0, 1.25, 0.15);
  add(g, ico(0.62, 1), mat(c.body), headC.toArray());
  add(g, ico(0.44, 1), mat(c.belly || 0xf6f8fb), onSphere(headC, 0.6, new THREE.Vector3(0, -0.15, 1)).toArray(), [1, 1.05, 0.5]);
  addEyes(g, headC, 0.62, { spacing: 0.42, y: 0.18, z: 0.9, size: 0.15, pupil: 0.1 });
  add(g, cone(0.16, 0.4, 4), mat(c.beak || 0xf5a623), [0, 1.2, 0.95], [1, 1, 1], [Math.PI / 2, 0, 0]);
  for (const sx of [-1, 1]) add(g, ico(0.42, 1), mat(c.body), [0.85 * sx, 0.15, 0], [0.35, 1.0, 0.7]);
  for (const sx of [-1, 1]) add(g, ico(0.2, 0), mat(c.beak || 0xf5a623), [0.3 * sx, -1.05, 0.3], [1, 0.5, 1.5]);
  g.position.y = 0.7;
  return g;
}

export function buildFrog(c) {
  const g = new THREE.Group();
  add(g, ico(1, 1), mat(c.body), [0, -0.2, 0], [1.4, 0.95, 1.25]);
  add(g, ico(0.85, 1), mat(c.belly || 0xeadfbf), [0, -0.5, 0.35], [1.1, 0.7, 0.9]);
  for (const sx of [-1, 1]) {
    add(g, ico(0.34, 1), mat(c.body), [0.55 * sx, 0.62, 0.45]);
    add(g, ico(0.26, 1), mat(0xffffff, { roughness: 0.4 }), [0.55 * sx, 0.66, 0.6]);
    add(g, ico(0.14, 1), mat(0x3b3b4a), [0.57 * sx, 0.66, 0.82]);
  }
  add(g, ico(0.16, 0), mat(0x3b3b4a, { roughness: 0.6 }), [0, -0.15, 1.05], [2.2, 0.25, 0.3]);
  for (const sx of [-1, 1]) {
    add(g, cap(0.12, 0.3), mat(c.body), [0.7 * sx, -0.6, 0.55], [1, 1, 1], [0.4, 0, 0]);
    add(g, ico(0.18, 0), mat(c.body), [0.72 * sx, -0.9, 0.75], [1.2, 0.4, 1.4]);
    add(g, ico(0.4, 1), mat(c.body), [0.95 * sx, -0.55, -0.35], [0.7, 0.8, 1.1]);
  }
  g.position.y = 0.55;
  return g;
}

export function buildWhale(c) {
  const g = new THREE.Group();
  add(g, ico(1, 1), mat(c.body), [0, 0, 0], [1.05, 0.95, 1.7]);
  add(g, ico(0.85, 1), mat(c.belly || 0xbfe0f5), [0, -0.4, 0.2], [1.0, 0.6, 1.5]);
  for (const sx of [-1, 1]) add(g, cone(0.4, 0.7, 4), mat(c.body), [0.4 * sx, 0.15, -1.9], [1, 0.3, 1], [0, 0, 0.9 * sx]);
  for (const sx of [-1, 1]) add(g, ico(0.4, 1), mat(c.body), [0.95 * sx, -0.25, 0.3], [0.4, 0.7, 1.1], [0, 0, 0.5 * sx]);
  for (const sx of [-1, 1]) {
    add(g, ico(0.14, 1), mat(0x2c3b4a), [0.8 * sx, 0.05, 1.0]);
    add(g, ico(0.05, 1), mat(0xffffff, { roughness: 0.4 }), [0.85 * sx, 0.12, 1.08]);
  }
  add(g, cone(0.12, 0.5, 5), mat(c.fin || 0x8fc7f0), [0, 1.0, 0.2], [1, 1, 1], [0.3, 0, 0]);
  g.position.y = 0.9;
  return g;
}

export function buildDragon(c) {
  const g = buildQuadruped({
    colors: c,
    bodyScale: [1.2, 1.0, 1.6],
    headR: 0.72,
    ears: "none",
    horn: "dragon",
    eyeOpts: { spacing: 0.46, y: 0.34, z: 0.86 },
    legs: { r: 0.18, h: 0.85, color: c.leg },
    tail: { type: "short", color: c.body },
  });
  for (const sx of [-1, 1]) add(g, cone(0.55, 1.1, 3), mat(c.wing || c.body), [0.7 * sx, 0.8, -0.2], [0.25, 1, 1], [0.2, 0, 0.7 * sx]);
  for (let i = 0; i < 4; i++) add(g, cone(0.1, 0.3, 4), mat(c.horn || 0xe8d08a), [0, 0.35, -1.6 - i * 0.32], [1, 1, 1], [0.4, 0, 0]);
  return g;
}
