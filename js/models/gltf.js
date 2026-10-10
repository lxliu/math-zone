// GLB 加载（Kenney Cube Pets 2.0，CC0）
import * as THREE from "../../vendor/three.module.min.js";
import { GLTFLoader } from "../../vendor/addons/GLTFLoader.js";
import { glbSrc } from "./registry.js";

// 24 只共用同一张 Textures/colormap.png：开 Cache 让缓冲与贴图只取一次
THREE.Cache.enabled = true;

const loader = new GLTFLoader();

/**
 * 加载一只动物的 GLB。
 * 故意不做 Promise 级缓存：three 的 Cache 已经缓存了文件缓冲与贴图，
 * 而 GLTF 对象每次都是新的（有动画状态），共享同一个 Object3D 会互相打架。
 * @returns {Promise<{scene: THREE.Object3D, animations: THREE.AnimationClip[]}>}
 */
export function loadAnimalGlb(id) {
  const src = glbSrc(id);
  if (!src) return Promise.reject(new Error(`no glb for ${id}`));
  return new Promise((resolve, reject) => {
    loader.load(src, resolve, undefined, (err) => reject(err));
  });
}
