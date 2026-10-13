// 真 3D 查看器（three.js r160）：glTF 模型 + 骨骼动画 + 环境光照 + 点击互动
import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import { RoomEnvironment } from "../vendor/addons/RoomEnvironment.js";
import { build3DModel, has3DModel } from "./models/index.js";
import { CHEER_CLIP, LOOP_CLIP, TAP_CLIP } from "./models/registry.js";
import { tierById, tierThemeClass, TIERS } from "./animals.js";
import { el } from "./utils.js";
import { play as sfx } from "./audio.js";

/* ------------------------------------------------------------------ */
/* 地面 / 灯光按等级走色                                                */
/*   中心一律近白，避免给模型本身染色；只有外圈、接地阴影、补光跟档位走。 */
/* ------------------------------------------------------------------ */
const GROUND_BY_TIER = {
  common: { stops: ["#fffdf8", "#f6f9fc", "#e5ebf1"], shadow: "70,80,92", hemi: 0xe8eef5, fill: 0xffffff },
  rare:   { stops: ["#ffffff", "#ebf5ff", "#cfe6ff"], shadow: "40,80,130", hemi: 0xdcecff, fill: 0xe8f4ff },
  epic:   { stops: ["#fffdff", "#f4ecff", "#dfcbff"], shadow: "92,52,152", hemi: 0xeee2ff, fill: 0xf3e9ff },
  legend: { stops: ["#fffdfb", "#fff0f7", "#ffe3c9"], shadow: "150,60,100", hemi: 0xffe9f3, fill: 0xfff1e0 },
};

/* ------------------------------------------------------------------ */
/* 小工具：生成径向渐变贴图（地面光晕 / 接地阴影）                        */
/* ------------------------------------------------------------------ */
function radialTexture(stops, size = 256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [at, col] of stops) g.addColorStop(at, col);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 打开某只动物的 3D 查看器。
 * @returns {Promise<boolean>} WebGL 不可用 / 没有模型 / 加载失败 → false（调用方回退到 2D 悬浮）
 */
export async function open3DModel(animal, opts = {}) {
  if (!has3DModel(animal.id)) return false;

  const root = document.getElementById("overlay-root");
  const backdrop = el("div", "backdrop");
  const box = el("div", "viewer");
  const tier = tierById(animal.tier) || TIERS[0];
  const groundPal = GROUND_BY_TIER[animal.tier] || GROUND_BY_TIER.common;
  // 等级主题：弹窗边框/底色/纹理跟着档位走（与图鉴卡片、解锁仪式同一套）
  box.classList.add(tierThemeClass(animal.tier));
  box.innerHTML = `
    <button class="viewer-close btn ghost sm">✕</button>
    <div class="three-stage">
      <div class="three-loading"><span class="three-spin">⭐</span><span class="three-loading-text">正在唤醒它…</span></div>
    </div>
    <div class="viewer-name">${animal.name} <span class="badge ${tier.cls}">${tier.label}</span></div>
    <div class="viewer-hint">👆 点一点它 · 拖动可以转圈圈</div>
    <div class="viewer-ctrls">
      <button class="btn ghost sm" data-act="reset">↺ 重置视角</button>
    </div>
  `;
  backdrop.appendChild(box);
  root.appendChild(backdrop);

  const stage = box.querySelector(".three-stage");

  /* --- WebGL 可用性 --- */
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
  // 色彩管线：sRGB 输出 + ACES 色调映射（比默认的线性输出柔和很多）
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0x000000, 0);
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 100);

  /* --- 环境贴图（PMREM + RoomEnvironment）：让方块的高光有层次 --- */
  let envRT = null;
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    envRT = pmrem.fromScene(new RoomEnvironment(renderer), 0.04);
    scene.environment = envRT.texture;
    pmrem.dispose();
  } catch (e) {
    console.warn("[3d] 环境贴图生成失败，跳过", e);
  }

  /* --- 光照（底色跟档位微调，幅度小，保证金红模型不发灰） --- */
  scene.add(new THREE.HemisphereLight(0xffffff, groundPal.hemi, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(3.5, 6.5, 4.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 24;
  key.shadow.camera.left = -5;
  key.shadow.camera.right = 5;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -5;
  key.shadow.bias = -0.0012;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 3;
  scene.add(key);
  const fill = new THREE.DirectionalLight(groundPal.fill, 0.5);
  fill.position.set(-4, 3, -3.5);
  scene.add(fill);

  /* --- 模型 --- */
  const built = await build3DModel(animal.id);
  if (!built) {
    // 注意：此时 ro / raf / controls 还没建，不能引用
    renderer.dispose();
    envRT?.dispose();
    backdrop.remove();
    return false;
  }
  const group = built.group;
  const clips = built.animations || [];
  const isGlb = built.source === "glb";

  group.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = false;
      o.frustumCulled = false;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!m) continue;
        // 环境反射强度调低一点，避免方块像塑料板
        if ("envMapIntensity" in m) m.envMapIntensity = 0.55;
        m.needsUpdate = true;
      }
    }
  });
  scene.add(group);

  /* --- 包围盒归一化：统一构图 --- */
  const bbox = new THREE.Box3().setFromObject(group);
  const size = bbox.getSize(new THREE.Vector3());
  const groundY = bbox.min.y;

  // 地面：径向渐变（中心亮、边缘淡）；颜色按等级走
  const groundTex = radialTexture([
    [0.0, groundPal.stops[0]],
    [0.55, groundPal.stops[1]],
    [1.0, groundPal.stops[2]],
  ]);
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(Math.max(2.6, size.x * 2.4), 56),
    new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = groundY - 0.01;
  ground.receiveShadow = true;
  scene.add(ground);

  // 接地阴影贴片（在真实投影之外再补一层柔和的"落地感"）
  const contactTex = radialTexture([
    [0.0, `rgba(${groundPal.shadow},.42)`],
    [0.45, `rgba(${groundPal.shadow},.20)`],
    [1.0, `rgba(${groundPal.shadow},0)`],
  ]);
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.max(2.0, size.x * 2.1), Math.max(2.0, size.z * 2.1)),
    new THREE.MeshBasicMaterial({ map: contactTex, transparent: true, depthWrite: false, opacity: 0.9 })
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = groundY - 0.005;
  scene.add(contact);

  const targetY = groundY + size.y * 0.5;

  /* --- 相机 / 控制 --- */
  const modelR = Math.max(0.6, size.length() * 0.5);
  const dist = Math.max(3.6, size.length() * (isGlb ? 1.05 : 1.15));
  const homeCam = new THREE.Vector3(dist * 0.15, targetY + size.y * 0.5, dist);
  camera.near = 0.05;
  camera.position.copy(homeCam);
  camera.updateProjectionMatrix();

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.enablePan = false;
  controls.autoRotate = !clips.length; // 有 idle 动画时不自动转，避免"乱晃"
  controls.autoRotateSpeed = 1.4;
  controls.zoomSpeed = 1.5;
  controls.zoomToCursor = false;
  controls.minDistance = Math.max(1.1, modelR * 0.9);
  controls.maxDistance = dist * 4.5;
  controls.minPolarAngle = 0.35;
  controls.maxPolarAngle = 1.55;
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE };
  controls.target.set(0, targetY, 0);
  controls.update();

  /* --- 动画 --- */
  let mixer = null;
  let actions = {};
  let loopAction = null;
  let oneShot = null;
  if (clips.length) {
    mixer = new THREE.AnimationMixer(group);
    for (const clip of clips) {
      const a = mixer.clipAction(clip);
      actions[clip.name] = a;
    }
    loopAction = actions[LOOP_CLIP] || actions[clips[0].name] || null;
    if (loopAction) {
      loopAction.setLoop(THREE.LoopRepeat, Infinity);
      loopAction.play();
    }
  }

  /** 播一次性动画（点它 / 庆祝），结束后淡回 idle */
  function playOnce(name) {
    if (!mixer) return;
    const a = actions[name];
    if (!a) return;
    if (oneShot && oneShot !== a) oneShot.fadeOut(0.15);
    oneShot = a;
    a.reset();
    a.setLoop(THREE.LoopOnce, 1);
    a.clampWhenFinished = true;
    a.setEffectiveWeight(1);
    a.fadeIn(0.12).play();
    if (loopAction) loopAction.setEffectiveWeight(0.25);
    clearTimeout(playOnce._t);
    const dur = (a.getClip().duration || 0.4) * 1000;
    playOnce._t = setTimeout(() => {
      a.fadeOut(0.22);
      if (loopAction) loopAction.setEffectiveWeight(1);
      oneShot = null;
    }, dur + 60);
  }

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

  /* --- 点击互动（拖拽不算点击） --- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let downAt = null;
  function onDown(e) {
    downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
  }
  function onUp(e) {
    if (!downAt) return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    const quick = performance.now() - downAt.t < 450;
    downAt = null;
    if (moved > 8 || !quick) return; // 是拖动/长按，不算点击
    const r = renderer.domElement.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    if (ray.intersectObject(group, true).length) {
      playOnce(TAP_CLIP);
      sfx("star");
    }
  }
  renderer.domElement.addEventListener("pointerdown", onDown);
  renderer.domElement.addEventListener("pointerup", onUp);

  /* --- 渲染循环 --- */
  let raf = 0;
  const clock = new THREE.Clock();
  let firstFrame = false;
  function tick() {
    const dt = clock.getDelta();
    if (mixer) mixer.update(dt);
    controls.update();
    renderer.render(scene, camera);
    if (!firstFrame) {
      firstFrame = true;
      stage.querySelector(".three-loading")?.classList.add("gone");
      box.classList.add("ready");
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  /* --- 关闭与清理 --- */
  function close() {
    cancelAnimationFrame(raf);
    clearTimeout(playOnce._t);
    renderer.domElement.removeEventListener("pointerdown", onDown);
    renderer.domElement.removeEventListener("pointerup", onUp);
    ro.disconnect();
    controls.dispose();
    if (mixer) { mixer.stopAllAction(); mixer.uncacheRoot(group); }
    renderer.dispose();
    envRT?.dispose();
    groundTex.dispose();
    contactTex.dispose();
    group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) { if (m && m.map) m.map.dispose(); m?.dispose(); }
      }
    });
    backdrop.remove();
  }

  box.querySelector(".viewer-close").addEventListener("click", close);
  box.querySelector('[data-act="reset"]').addEventListener("click", () => {
    camera.position.copy(homeCam);
    controls.target.set(0, targetY, 0);
    controls.update();
  });
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });

  // 解锁仪式：进门先来一段庆祝动作
  if (opts.cheer && actions[opts.cheer]) setTimeout(() => playOnce(opts.cheer), 260);

  sfx("star");
  return true;
}

/** 解锁仪式用：进门就是一段庆祝动作 */
export function cheer3DModel(animal) {
  return open3DModel(animal, { cheer: CHEER_CLIP });
}
