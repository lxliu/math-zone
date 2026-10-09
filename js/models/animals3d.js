// 19 只动物的程序化低多边形参数（小刺猬在 hedgehog.js）
import { buildQuadruped, buildPenguin, buildFrog, buildWhale, buildDragon } from "./lib.js";

export const BUILDERS = {
  // 普通（小）
  "common-01": () => buildQuadruped({ // 咪咪猫
    colors: { body: 0xf4a25a, belly: 0xfbe3cf, muzzle: 0xfbe3cf, nose: 0xe8863c, ear: 0xf4a25a, earInner: 0xf6c3a0 },
    ears: "pointy", tail: { type: "long" }, headR: 0.74,
  }),
  "common-02": () => buildQuadruped({ // 跳跳兔
    colors: { body: 0xf6e7d8, belly: 0xffffff, muzzle: 0xffffff, nose: 0xf7b8c4, ear: 0xf1dcc8, earInner: 0xf7b8c4 },
    ears: "long", tail: { type: "short", color: 0xffffff }, headR: 0.72,
  }),
  "common-04": () => buildFrog({ body: 0x8fcb6e, belly: 0xeadfbf }),
  "common-05": () => buildPenguin({ body: 0x3e4a5b, belly: 0xf6f8fb, beak: 0xf5a623 }),
  "common-06": () => buildQuadruped({ // 小火狐
    colors: { body: 0xf28c28, belly: 0xfbe9d8, muzzle: 0xfbe9d8, nose: 0x3b3b4a, ear: 0xe5721f, earInner: 0xf7c9a8 },
    ears: "pointy", tail: { type: "bushy" }, headR: 0.72,
  }),
  "common-07": () => buildQuadruped({ // 汪汪狗
    colors: { body: 0xc9a26b, belly: 0xefdcc0, muzzle: 0xefdcc0, nose: 0x3b3b4a, ear: 0xb8905a },
    ears: "floppy", tail: { type: "short", color: 0xb8905a }, headR: 0.74,
  }),
  "common-08": () => buildQuadruped({ // 考拉
    colors: { body: 0xa9a9b0, belly: 0xc9c9cf, nose: 0x3b3b4a, ear: 0x9a9aa2, earInner: 0xc9c9cf },
    ears: "fluffy", tail: { type: "none" }, headR: 0.8,
    eyeOpts: { spacing: 0.46, y: 0.3, z: 0.86, size: 0.15, pupil: 0.1 },
  }),

  // 稀有（中）
  "rare-01": () => buildQuadruped({ // 小浣熊
    colors: { body: 0x9aa0a6, belly: 0xe6e8ea, muzzle: 0xe6e8ea, nose: 0x2f3237, ear: 0x8c8f94, mask: 0x4a4e54 },
    ears: "pointy", tail: { type: "bushy", color: 0x8c8f94 }, headR: 0.74,
  }),
  "rare-02": () => buildQuadruped({ // 机灵猴
    colors: { body: 0xa9714c, belly: 0xd8a279, muzzle: 0xd8a279, nose: 0x3b3b4a, ear: 0xa9714c, earInner: 0xd8a279 },
    ears: "round", tail: { type: "long" }, headR: 0.76,
  }),
  "rare-03": () => buildQuadruped({ // 胖达
    colors: { body: 0xf6f6f8, belly: 0xffffff, muzzle: 0xffffff, nose: 0x3b3b4a, ear: 0x3b3b4a, earInner: 0x3b3b4a, eyePatch: 0x3b3b4a },
    ears: "round", tail: { type: "short", color: 0x3b3b4a }, headR: 0.78,
    eyeOpts: { spacing: 0.44, y: 0.32, z: 0.88, size: 0.14, pupil: 0.09 },
  }),
  "rare-04": () => buildQuadruped({ // 小狮王
    colors: { body: 0xe8a33d, head: 0xf0b85a, belly: 0xfbe9d0, muzzle: 0xfbe9d0, nose: 0xc9772a, ear: 0xe8a33d, mane: 0xc9772a },
    ears: "round", mane: true, tail: { type: "long", color: 0xc9772a }, headR: 0.7,
  }),
  "rare-05": () => buildQuadruped({ // 小老虎
    colors: { body: 0xf2a73b, belly: 0xfbe9d0, muzzle: 0xfbe9d0, nose: 0x3b3b4a, ear: 0xe08a2b, earInner: 0xf6c79b, stripe: 0x4a3210 },
    ears: "round", stripes: true, tail: { type: "long" }, headR: 0.74,
  }),
  "rare-06": () => buildQuadruped({ // 棕熊
    colors: { body: 0x8b5e3c, belly: 0xd8b892, muzzle: 0xd8b892, nose: 0x3b3b4a, ear: 0x7a4f32, earInner: 0xc39a72 },
    ears: "round", tail: { type: "short", color: 0x7a4f32 }, headR: 0.78,
    bodyScale: [1.4, 1.1, 1.7], legs: { r: 0.19, h: 0.8 },
  }),

  // 史诗（大）
  "epic-01": () => buildQuadruped({ // 河马
    colors: { body: 0x9b8fa3, belly: 0xb7acbe, muzzle: 0xb7acbe, nose: 0x5b5266, ear: 0x8a7e92 },
    ears: "tiny", tail: { type: "short", color: 0x8a7e92 }, headR: 0.86,
    bodyScale: [1.5, 1.2, 1.8], legs: { r: 0.2, h: 0.7 },
    eyeOpts: { spacing: 0.5, y: 0.42, z: 0.8, size: 0.14, pupil: 0.09 },
  }),
  "epic-02": () => buildQuadruped({ // 长颈鹿
    colors: { body: 0xe8c46a, belly: 0xf3e2b8, muzzle: 0xf3e2b8, nose: 0x7a5a20, ear: 0xd9b45a, horn: 0x8b6a2e, spot: 0xc79a3e },
    ears: "long", spots: true, horn: "ossicone", neck: true,
    tail: { type: "long", color: 0xd9b45a }, headR: 0.56, headY: 1.95, headZ: 0.7,
    bodyScale: [1.1, 1.0, 1.5], legs: { r: 0.17, h: 1.3, zSpread: 0.6 },
  }),
  "epic-03": () => buildQuadruped({ // 大象
    colors: { body: 0x9aa0a6, belly: 0xb7bcc2, trunk: 0x9aa0a6, nose: 0x6e747a, ear: 0xb7bcc2 },
    ears: "big", trunk: true, tail: { type: "short", color: 0x8a9096 }, headR: 0.8,
    bodyScale: [1.5, 1.15, 1.7], legs: { r: 0.22, h: 0.75 },
  }),
  "epic-04": () => buildWhale({ body: 0x5b9bd5, belly: 0xbfe0f5, fin: 0x8fc7f0 }),

  // 传说（神话）
  "legend-01": () => buildDragon({ body: 0x4fb58c, belly: 0x7fd1b0, muzzle: 0x7fd1b0, nose: 0x2e6e52, horn: 0xe8d08a, wing: 0x3a8f6c, leg: 0x3a8f6c }),
  "legend-02": () => buildQuadruped({ // 独角兽
    colors: { body: 0xfbeaf3, belly: 0xffffff, muzzle: 0xffffff, nose: 0x8a5a72, ear: 0xfbeaf3, earInner: 0xf7a8d0, horn: 0xffe08a },
    ears: "pointy", horn: "unicorn", tail: { type: "bushy", color: 0xf7a8d0 }, headR: 0.72,
  }),
};
