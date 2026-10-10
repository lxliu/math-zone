// 动物图鉴元数据（按体型分级、逐只定价）
// 3D 素材：Kenney「Cube Pets 2.0」(CC0) —— 见 assets/3d/CREDITS.md
export const TIERS = [
  { id: "common", label: "普通", cls: "tier-common" },
  { id: "rare", label: "稀有", cls: "tier-rare" },
  { id: "epic", label: "史诗", cls: "tier-epic" },
  // 神话档目前留空：只放神龙这类不存在的动物，以后再加。
  // 内部 id 保持 legend，只改了中文名（避免动 CSS 变量与类名）。
  { id: "legend", label: "神话", cls: "tier-legend" },
];

// 价格区间：普通 50–70 / 稀有 100–140 / 史诗 150–200 / 神话 300–500（预留）
// 合计 2595 星：按每支 48 星算约 54 天集齐。
// id 前缀与 tier 一致（common-* 即为普通档），新增动物时请遵守。
// `model` 对应 assets/3d/<model>.glb
export const ANIMALS = [
  // 普通（家养 / 常见小动物）—— 每两只同一个价，从 50 递增到 70
  { id: "common-01", tier: "common", name: "小鸡仔", price: 50, emoji: "🐤", model: "animal-chick" },
  { id: "common-02", tier: "common", name: "跳跳兔", price: 50, emoji: "🐰", model: "animal-bunny" },
  { id: "common-03", tier: "common", name: "咪咪猫", price: 55, emoji: "🐱", model: "animal-cat" },
  { id: "common-04", tier: "common", name: "汪汪狗", price: 55, emoji: "🐶", model: "animal-dog" },
  { id: "common-05", tier: "common", name: "哼哼猪", price: 60, emoji: "🐷", model: "animal-pig" },
  { id: "common-06", tier: "common", name: "哞哞牛", price: 60, emoji: "🐮", model: "animal-cow" },
  { id: "common-07", tier: "common", name: "小蜜蜂", price: 65, emoji: "🐝", model: "animal-bee" },
  { id: "common-08", tier: "common", name: "毛毛虫", price: 65, emoji: "🐛", model: "animal-caterpillar" },
  { id: "common-09", tier: "common", name: "泡泡鱼", price: 70, emoji: "🐟", model: "animal-fish" },
  { id: "common-10", tier: "common", name: "小螃蟹", price: 70, emoji: "🦀", model: "animal-crab" },
  // 稀有（野生动物）
  { id: "rare-01", tier: "rare", name: "小火狐", price: 100, emoji: "🦊", model: "animal-fox" },
  { id: "rare-02", tier: "rare", name: "小鹿", price: 105, emoji: "🦌", model: "animal-deer" },
  { id: "rare-03", tier: "rare", name: "小海狸", price: 110, emoji: "🦫", model: "animal-beaver" },
  { id: "rare-04", tier: "rare", name: "小野猪", price: 115, emoji: "🐗", model: "animal-hog" },
  { id: "rare-05", tier: "rare", name: "考拉", price: 120, emoji: "🐨", model: "animal-koala" },
  { id: "rare-06", tier: "rare", name: "企鹅仔", price: 125, emoji: "🐧", model: "animal-penguin" },
  { id: "rare-07", tier: "rare", name: "巧嘴鹦鹉", price: 130, emoji: "🦜", model: "animal-parrot" },
  { id: "rare-08", tier: "rare", name: "机灵猴", price: 140, emoji: "🐵", model: "animal-monkey" },
  // 史诗（动物园大明星）
  { id: "epic-01", tier: "epic", name: "长颈鹿", price: 150, emoji: "🦒", model: "animal-giraffe" },
  { id: "epic-02", tier: "epic", name: "小狮王", price: 160, emoji: "🦁", model: "animal-lion" },
  { id: "epic-03", tier: "epic", name: "大象", price: 170, emoji: "🐘", model: "animal-elephant" },
  { id: "epic-04", tier: "epic", name: "北极熊", price: 180, emoji: "🐻", model: "animal-polar" },
  { id: "epic-05", tier: "epic", name: "大熊猫", price: 190, emoji: "🐼", model: "animal-panda" },
  { id: "epic-06", tier: "epic", name: "小老虎", price: 200, emoji: "🐯", model: "animal-tiger" },
  // 神话（300–500）—— 现在空着，只收神龙这类不存在的动物
];

export const TOTAL_ANIMALS = ANIMALS.length;

export function animalById(id) { return ANIMALS.find((a) => a.id === id) || null; }
export function animalsByTier(tier) { return ANIMALS.filter((a) => a.tier === tier); }
export function tierById(id) { return TIERS.find((t) => t.id === id) || null; }
export function animalSrc(id) { return `assets/animals/${id}.webp`; }
// 全身图：解锁仪式 / 3D 悬浮兼底用（图标本身已足够清晰，直接复用同一张）
export function animalFullSrc(id) { return `assets/animals/${id}.webp`; }
export function tierClass(tier) { return `glow-${tier}`; }
// 3D 模型：assets/3d/animal-*.glb（贴图 assets/3d/Textures/colormap.png 由 GLB 相对引用）
export function animalModelSrc(id) {
  const a = animalById(id);
  return a && a.model ? `assets/3d/${a.model}.glb` : null;
}

// ---------------------------------------------------------------------------
// 旧存档迁移（20 只 → 24 只）
// 旧名单里消失的动物（刺猬/青蛙/浣熊/棕熊/河马/鲸鱼/神龙/独角兽）在此表里
// 映射到同档的新动物；迁移时还会补足"已解锁总数"，见 js/storage.js。
// ---------------------------------------------------------------------------
export const LEGACY_ANIMAL_MAP = {
  "common-01": "common-03", // 咪咪猫 → 咪咪猫
  "common-02": "common-02", // 跳跳兔 → 跳跳兔
  "common-03": "common-01", // 小刺猬（已移除）→ 小鸡仔
  "common-04": "common-05", // 呱呱蛙（已移除）→ 哼哼猪
  "common-05": "rare-06", // 企鹅仔 → 企鹅仔（升档）
  "common-06": "rare-01", // 小火狐 → 小火狐（升档）
  "common-07": "common-04", // 汪汪狗 → 汪汪狗
  "common-08": "rare-05", // 考拉 → 考拉（升档）
  "rare-01": "rare-02", // 小浣熊（已移除）→ 小鹿
  "rare-02": "epic-01", // 机灵猴 → 机灵猴（升档）
  "rare-03": "legend-01", // 胖达 → 大熊猫（升档）
  "rare-04": "epic-03", // 小狮王 → 小狮王（升档）
  "rare-05": "legend-02", // 小老虎 → 小老虎（升档）
  "rare-06": "rare-03", // 棕熊（已移除）→ 小海狸
  "epic-01": "epic-05", // 河马（已移除）→ 北极熊
  "epic-02": "epic-02", // 长颈鹿 → 长颈鹿
  "epic-03": "epic-04", // 大象 → 大象
  "epic-04": "rare-04", // 鲸鱼（已移除）→ 小野猪
  "legend-01": "legend-01", // 神龙（已移除）→ 大熊猫
  "legend-02": "legend-02", // 独角兽（已移除）→ 小老虎
};

// ---------------------------------------------------------------------------
// 第二段迁移（v2 → v3）：24 只重新划分档位后的 id 重编号
// 只有 7 只变了（机灵猴降到稀有尾；史诗其余前移；熊猫/老虎从神话档并入史诗）。
// 其余 id 自我映射，也一并列出以便对照。
// 迁移时会先跑 LEGACY_ANIMAL_MAP 再跑这张表，所以 v1 时代的老存档也能一路迁到最新。
// ---------------------------------------------------------------------------
export const RENUMBER_V3 = {
  "epic-01": "rare-08", // 机灵猴 → 稀有档尾
  "epic-02": "epic-01", // 长颈鹿 → 史诗 01
  "epic-03": "epic-02", // 小狮王 → 史诗 02
  "epic-04": "epic-03", // 大象 → 史诗 03
  "epic-05": "epic-04", // 北极熊 → 史诗 04
  "legend-01": "epic-05", // 大熊猫 → 史诗 05（神话档改为留空）
  "legend-02": "epic-06", // 小老虎 → 史诗 06（神话档改为留空）
};
