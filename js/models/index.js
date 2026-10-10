// 3D 模型入口：优先 glTF（Kenney Cube Pets），失败自动回退程序化低多边形模型
import { USE_GLB_MODELS } from "../config.js";
import { loadAnimalGlb } from "./gltf.js";
import { fallbackBuilder, getGlbOverride, glbSrc } from "./registry.js";

function wantGlb() {
  const ov = getGlbOverride();
  return ov === null ? USE_GLB_MODELS : ov;
}

/** 有没有可展示的 3D 内容（GLB 或程序化兜底） */
export function has3DModel(id) {
  return !!glbSrc(id) || !!fallbackBuilder(id);
}

/**
 * 构建一只动物的 3D 对象。
 * @returns {Promise<{group: THREE.Object3D, animations: Array, source: "glb"|"procedural"} | null>}
 */
export async function build3DModel(id) {
  if (wantGlb() && glbSrc(id)) {
    try {
      const gltf = await loadAnimalGlb(id);
      if (gltf && gltf.scene) {
        return { group: gltf.scene, animations: gltf.animations || [], source: "glb" };
      }
    } catch (e) {
      console.warn("[3d] GLB 加载失败，回退程序化模型：", id, e);
    }
  }
  const b = fallbackBuilder(id);
  if (!b) return null;
  try {
    return { group: b(), animations: [], source: "procedural" };
  } catch (e) {
    console.warn("[3d] 程序化模型构建失败：", id, e);
    return null;
  }
}
