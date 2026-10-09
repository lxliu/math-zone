// 程序化低多边形模型：小刺猬（细化 v4）
import * as THREE from "../../vendor/three.module.min.js";

const mat = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, metalness: 0, ...extra });

const ico = (r, d = 0) => new THREE.IcosahedronGeometry(r, d);

const P = {
  body: 0xc79a6a,
  bodyDark: 0xb07f52,
  spike: 0x8a6642,
  spikeTip: 0xb08a5e,
  face: 0xd9b489,
  cream: 0xf0e2cd,
  dark: 0x3b3b4a,
  pink: 0xf3a6a6,
  paw: 0x9c7350,
};

const HEAD_C = new THREE.Vector3(0, 0.16, 0.66);
const HEAD_R = 0.66;
const UP = new THREE.Vector3(0, 1, 0);

// 在球面上按方向取点
function onSphere(center, r, dir) {
  return center.clone().addScaledVector(dir.clone().normalize(), r);
}

export function build() {
  const g = new THREE.Group();
  g.name = "hedgehog";

  const bodyMat = mat(P.body);
  const spikeMat = mat(P.spike);
  const spikeTipMat = mat(P.spikeTip);
  const faceMat = mat(P.face);
  const creamMat = mat(P.cream);
  const darkMat = mat(P.dark, { roughness: 0.5 });
  const pinkMat = mat(P.pink, { roughness: 0.95 });
  const whiteMat = mat(0xffffff, { roughness: 0.4 });
  const pawMat = mat(P.paw);

  // 身体
  const body = new THREE.Mesh(ico(1, 1), bodyMat);
  body.scale.set(1.18, 1.0, 1.08);
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);

  // 肚皮
  const belly = new THREE.Mesh(ico(0.82, 1), creamMat);
  belly.position.set(0, -0.18, 0.42);
  belly.scale.set(0.95, 0.9, 0.7);
  belly.castShadow = true;
  g.add(belly);

  // 背刺（双层双色，正面留空）
  const baseGeo = new THREE.ConeGeometry(0.14, 0.5, 5);
  const tipGeo = new THREE.ConeGeometry(0.075, 0.26, 5);
  const rows = 6;
  for (let r = 0; r < rows; r++) {
    const v = r / (rows - 1);
    const lat = THREE.MathUtils.lerp(0.1 * Math.PI, 0.62 * Math.PI, v);
    const y = Math.cos(lat);
    const rad = Math.sin(lat);
    const count = Math.max(5, Math.round(13 * rad) + 4);
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2 + r * 0.42;
      const dir = new THREE.Vector3(Math.cos(theta) * rad, y, Math.sin(theta) * rad);
      if (dir.z > 0.2) continue;
      const n = dir.clone().normalize();
      const pos = new THREE.Vector3(dir.x * 1.16, dir.y * 0.99, dir.z * 1.06);
      const len = 0.38 + 0.14 * Math.abs(dir.y);
      const base = new THREE.Mesh(baseGeo, spikeMat);
      base.position.copy(pos);
      base.scale.set(1, len / 0.5, 1);
      base.quaternion.setFromUnitVectors(UP, n);
      base.castShadow = true;
      g.add(base);
      const tip = new THREE.Mesh(tipGeo, spikeTipMat);
      tip.position.copy(pos).addScaledVector(n, len * 0.62);
      tip.quaternion.setFromUnitVectors(UP, n);
      tip.castShadow = true;
      g.add(tip);
    }
  }

  // 头
  const head = new THREE.Mesh(ico(HEAD_R, 1), faceMat);
  head.position.copy(HEAD_C);
  head.castShadow = true;
  g.add(head);

  // 口鼻（奶油色锥，沿朝下前方）
  const sdir = new THREE.Vector3(0, -0.28, 0.96);
  const muzzle = new THREE.Mesh(ico(0.3, 1), creamMat);
  muzzle.position.copy(onSphere(HEAD_C, HEAD_R + 0.02, sdir));
  muzzle.scale.set(1.0, 0.85, 1.35);
  muzzle.castShadow = true;
  g.add(muzzle);

  const nose = new THREE.Mesh(ico(0.12, 1), darkMat);
  nose.position.copy(onSphere(HEAD_C, HEAD_R + 0.4, sdir));
  g.add(nose);

  const mouth = new THREE.Mesh(ico(0.1, 0), darkMat);
  mouth.position.copy(onSphere(HEAD_C, HEAD_R + 0.05, new THREE.Vector3(0, -0.7, 0.72)));
  mouth.scale.set(1.2, 0.42, 0.5);
  g.add(mouth);

  // 眼睛：白底 + 瞳孔 + 高光，按方向贴在脸球表面
  for (const sx of [-1, 1]) {
    const eyeDir = new THREE.Vector3(0.46 * sx, 0.36, 0.81);
    const white = new THREE.Mesh(ico(0.17, 1), whiteMat);
    white.position.copy(onSphere(HEAD_C, HEAD_R, eyeDir));
    white.castShadow = true;
    g.add(white);
    const pupil = new THREE.Mesh(ico(0.115, 1), darkMat);
    pupil.position.copy(onSphere(HEAD_C, HEAD_R + 0.07, eyeDir));
    g.add(pupil);
    const shine = new THREE.Mesh(ico(0.05, 0), whiteMat);
    shine.position.copy(onSphere(HEAD_C, HEAD_R + 0.14, new THREE.Vector3(0.52 * sx, 0.56, 0.83)));
    g.add(shine);
  }

  // 耳朵（外 + 内粉，位于头顶两侧）
  for (const sx of [-1, 1]) {
    const earDir = new THREE.Vector3(0.58 * sx, 0.8, 0.04);
    const ear = new THREE.Mesh(ico(0.19, 0), bodyMat);
    ear.position.copy(onSphere(HEAD_C, HEAD_R + 0.05, earDir));
    ear.castShadow = true;
    g.add(ear);
    const inner = new THREE.Mesh(ico(0.1, 0), pinkMat);
    inner.position.copy(onSphere(HEAD_C, HEAD_R + 0.15, earDir));
    g.add(inner);
  }

  // 腮红（两侧偏下）
  for (const sx of [-1, 1]) {
    const cheek = new THREE.Mesh(ico(0.13, 0), pinkMat);
    cheek.position.copy(onSphere(HEAD_C, HEAD_R + 0.02, new THREE.Vector3(0.94 * sx, -0.14, 0.42)));
    cheek.scale.set(0.9, 0.7, 0.5);
    g.add(cheek);
  }

  // 四肢 + 脚掌
  const legGeo = new THREE.CapsuleGeometry(0.155, 0.2, 3, 6);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, pawMat);
      leg.position.set(0.5 * sx, -0.96, 0.32 * sz);
      leg.castShadow = true;
      g.add(leg);
      const paw = new THREE.Mesh(ico(0.16, 0), creamMat);
      paw.position.set(0.5 * sx, -1.14, 0.36 * sz);
      paw.scale.set(1, 0.7, 1.1);
      paw.castShadow = true;
      g.add(paw);
    }
  }

  // 小尾巴
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 5), mat(P.bodyDark));
  tail.rotation.x = -Math.PI / 2;
  tail.position.set(0, 0.05, -1.18);
  tail.castShadow = true;
  g.add(tail);

  g.position.y = 0.4;
  return g;
}
