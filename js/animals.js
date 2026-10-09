// 动物图鉴元数据（按体型分级、逐只定价）
export const TIERS = [
  { id: "common", label: "普通", cls: "tier-common" },
  { id: "rare", label: "稀有", cls: "tier-rare" },
  { id: "epic", label: "史诗", cls: "tier-epic" },
  { id: "legend", label: "传说", cls: "tier-legend" },
];

// 价格：最小基准 猫咪=50，最大 大象/鲸鱼=300，传说固定 500
export const ANIMALS = [
  // 普通（小）
  { id: "common-01", tier: "common", name: "咪咪猫", price: 50, emoji: "🐱" },
  { id: "common-02", tier: "common", name: "跳跳兔", price: 55, emoji: "🐰" },
  { id: "common-03", tier: "common", name: "小刺猬", price: 58, emoji: "🦔" },
  { id: "common-04", tier: "common", name: "呱呱蛙", price: 60, emoji: "🐸" },
  { id: "common-05", tier: "common", name: "企鹅仔", price: 68, emoji: "🐧" },
  { id: "common-06", tier: "common", name: "小火狐", price: 75, emoji: "🦊" },
  { id: "common-07", tier: "common", name: "汪汪狗", price: 82, emoji: "🐶" },
  { id: "common-08", tier: "common", name: "考拉", price: 90, emoji: "🐨" },
  // 稀有（中）
  { id: "rare-01", tier: "rare", name: "小浣熊", price: 100, emoji: "🦝" },
  { id: "rare-02", tier: "rare", name: "机灵猴", price: 115, emoji: "🐵" },
  { id: "rare-03", tier: "rare", name: "胖达", price: 135, emoji: "🐼" },
  { id: "rare-04", tier: "rare", name: "小狮王", price: 155, emoji: "🦁" },
  { id: "rare-05", tier: "rare", name: "小老虎", price: 175, emoji: "🐯" },
  { id: "rare-06", tier: "rare", name: "棕熊", price: 195, emoji: "🐻" },
  // 史诗（大）
  { id: "epic-01", tier: "epic", name: "河马", price: 230, emoji: "🦛" },
  { id: "epic-02", tier: "epic", name: "长颈鹿", price: 260, emoji: "🦒" },
  { id: "epic-03", tier: "epic", name: "大象", price: 300, emoji: "🐘" },
  { id: "epic-04", tier: "epic", name: "鲸鱼", price: 300, emoji: "🐳" },
  // 传说（神话）
  { id: "legend-01", tier: "legend", name: "神龙", price: 500, emoji: "🐉" },
  { id: "legend-02", tier: "legend", name: "独角兽", price: 500, emoji: "🦄" },
];

export const TOTAL_ANIMALS = ANIMALS.length;

export function animalById(id) { return ANIMALS.find((a) => a.id === id) || null; }
export function animalsByTier(tier) { return ANIMALS.filter((a) => a.tier === tier); }
export function tierById(id) { return TIERS.find((t) => t.id === id) || null; }
export function animalSrc(id) { return `assets/animals/${id}.svg`; }
// 全身图（仅 3D 查看 / 解锁仪式使用；未提供时回退头像）
export function animalFullSrc(id) { return `assets/animals/full/${id}.svg`; }
export function tierClass(tier) { return `glow-${tier}`; }
