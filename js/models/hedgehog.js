// 程序化低多边形模型：小刺猬
import * as THREE from "../../vendor/three.module.min.js";

const M = (color) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, metalness: 0.0 });

export function build() {
  const g = new THREE.Group();
  g.name = "hedgehog";

  const BROWN = 0xb58a63;
  const DARK = 0x8c6a4a;
  const CREAM = 0xeadbc8;
  const FACE = 0xc79c6e;

  // 身体
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), M(BROWN));
  body.scale.set(1.18, 0.98, 1.06);
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // 肚皮（前下方）
  const belly = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 1), M(CREAM));
  belly.position.set(0, -0.22, 0.34);
  belly.scale.set(0.95, 0.8, 0.7);
  belly.castShadow = true;
  g.add(belly);

  // 背刺（低多边形圆锥，铺满上半球，正面留空）
  const spikeGeo = new THREE.ConeGeometry(0.13, 0.52, 4);
  const spikeMat = M(DARK);
  const up = new THREE.Vector3(0, 1, 0);
  const rows = 6;
  for (let r = 0; r < rows; r++) {
    const v = r / (rows - 1);
    const lat = THREE.MathUtils.lerp(0.12 * Math.PI, 0.6 * Math.PI, v);
    const y = Math.cos(lat);
    const rad = Math.sin(lat);
    const count = Math.max(5, Math.round(12 * rad) + 4);
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2 + r * 0.45;
      const dir = new THREE.Vector3(Math.cos(theta) * rad, y, Math.sin(theta) * rad);
      if (dir.z > 0.5) continue; // 正面留空给脸
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.set(dir.x * 1.16, dir.y * 0.96, dir.z * 1.04);
      spike.quaternion.setFromUnitVectors(up, dir.clone().normalize());
      spike.castShadow = true;
      g.add(spike);
    }
  }

  // 脸（前伸的口鼻）
  const face = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 1), M(FACE));
  face.position.set(0, 0.08, 0.66);
  face.scale.set(1.05, 0.98, 0.92);
  face.castShadow = true;
  g.add(face);

  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 6), M(FACE));
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, -0.04, 1.02);
  snout.castShadow = true;
  g.add(snout);

  const nose = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), M(0x3b3b4a));
  nose.position.set(0, -0.04, 1.28);
  g.add(nose);

  // 眼睛
  const eyeGeo = new THREE.IcosahedronGeometry(0.14, 0);
  const eyeMat = M(0x3b3b4a);
  const shineGeo = new THREE.IcosahedronGeometry(0.05, 0);
  const shineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0.34 * sx, 0.32, 0.96);
    eye.castShadow = true;
    g.add(eye);
    const shine = new THREE.Mesh(shineGeo, shineMat);
    shine.position.set(0.37 * sx, 0.37, 1.05);
    g.add(shine);
  }

  // 耳朵
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 0), M(FACE));
    ear.position.set(0.54 * sx, 0.52, 0.36);
    ear.castShadow = true;
    g.add(ear);
  }

  // 腮红
  const cheekMat = new THREE.MeshStandardMaterial({ color: 0xf6a6a6, roughness: 0.9 });
  for (const sx of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 0), cheekMat);
    cheek.position.set(0.52 * sx, 0.08, 0.82);
    cheek.scale.set(1, 0.7, 0.5);
    g.add(cheek);
  }

  // 四条小短腿
  const legGeo = new THREE.CapsuleGeometry(0.16, 0.22, 3, 6);
  const legMat = M(DARK);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(0.5 * sx, -0.98, 0.34 * sz);
      leg.castShadow = true;
      g.add(leg);
    }
  }

  // 整体稍微抬高，让腿着地
  g.position.y = 0.35;
  return g;
}
