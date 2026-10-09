// 真 3D 查看器（three.js）：自由环绕 + 缩放 + 自动旋转 + 光照阴影
import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import { build3DModel, has3DModel } from "./models/index.js";
import { el } from "./utils.js";
import { play as sfx } from "./audio.js";

export function open3DModel(animal) {
  if (!has3DModel(animal.id)) return false;

  const root = document.getElementById("overlay-root");
  const backdrop = el("div", "backdrop");
  const box = el("div", "viewer");
  box.innerHTML = `
    <button class="viewer-close btn ghost sm">✕</button>
    <div class="three-stage"></div>
    <div class="viewer-name">${animal.name}</div>
    <div class="viewer-ctrls">
      <button class="btn ghost sm" data-act="reset">↺ 重置视角</button>
    </div>
  `;
  backdrop.appendChild(box);
  root.appendChild(backdrop);

  const stage = box.querySelector(".three-stage");

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) {
    backdrop.remove();
    return false;
  }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);

  // 光照
  scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe8ff, 1.05));
  const dir = new THREE.DirectionalLight(0xffffff, 2.1);
  dir.position.set(3.5, 6, 4.5);
  dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024);
  dir.shadow.camera.near = 1;
  dir.shadow.camera.far = 22;
  dir.shadow.camera.left = -5;
  dir.shadow.camera.right = 5;
  dir.shadow.camera.top = 5;
  dir.shadow.camera.bottom = -5;
  scene.add(dir);
  const fill = new THREE.DirectionalLight(0xffffff, 0.45);
  fill.position.set(-4, 3, -3.5);
  scene.add(fill);

  // 模型
  const group = build3DModel(animal.id);
  if (!group) { backdrop.remove(); renderer.dispose?.(); return false; }
  scene.add(group);

  // 地面（接阴影）
  const bbox = new THREE.Box3().setFromObject(group);
  const size = bbox.getSize(new THREE.Vector3());
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(Math.max(2.6, size.x * 2.4), 56),
    new THREE.MeshStandardMaterial({ color: 0xfff3dd, roughness: 1, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = bbox.min.y - 0.01;
  ground.receiveShadow = true;
  scene.add(ground);

  const targetY = bbox.min.y + size.y * 0.5;

  // 相机 / 控制（缩放参照手机照片：幅度大、可贴近）
  const modelR = Math.max(0.6, size.length() * 0.5);
  const dist = Math.max(3.6, size.length() * 1.15);
  camera.near = 0.05;
  camera.position.set(dist * 0.15, targetY + size.y * 0.55, dist);
  camera.updateProjectionMatrix();

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.6;
  controls.zoomSpeed = 1.5;
  controls.zoomToCursor = false;
  controls.minDistance = Math.max(1.1, modelR * 0.9);
  controls.maxDistance = dist * 4.5;
  controls.minPolarAngle = 0.35;
  controls.maxPolarAngle = 1.55;
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE };
  controls.target.set(0, targetY, 0);
  controls.update();

  function resize() {
    const w = stage.clientWidth || 1;
    const h = stage.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  let raf = 0;
  const clock = new THREE.Clock();
  function tick() {
    clock.getDelta();
    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  function close() {
    cancelAnimationFrame(raf);
    ro.disconnect();
    controls.dispose();
    renderer.dispose();
    group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) m.dispose();
      }
    });
    backdrop.remove();
  }

  box.querySelector(".viewer-close").addEventListener("click", close);
  box.querySelector('[data-act="reset"]').addEventListener("click", () => {
    camera.position.set(dist * 0.15, targetY + size.y * 0.55, dist);
    controls.target.set(0, targetY, 0);
    controls.zoomSpeed = 1.5;
    controls.update();
  });
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });

  sfx("star");
  return true;
}
