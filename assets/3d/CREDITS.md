# 3D 素材来源与许可

这个目录里有两类模型：

1. **Kenney「Cube Pets 2.0」** —— 24 只，CC0，见下方第一节。
2. **本仓库自制** —— 火麒麟与腾云龙两只神话动物，用脚本生成，见第二节。

---

## 一、Kenney「Cube Pets 2.0」

- **来源页面**：https://kenney.nl/assets/cube-pets
- **作者**：Kenney（https://kenney.nl）
- **许可证**：**CC0 1.0 Universal（公共领域）** — https://creativecommons.org/publicdomain/zero/1.0/
  - 可商用、可修改、无需署名。作者请求（非强制）署名 `Kenney` 或 `www.kenney.nl`。
- **下载地址**：https://kenney.nl/media/pages/assets/cube-pets/44e58e945f-1774520254/kenney_cube-pets_1.0.zip
- **下载日期**：2026-10-10
- **原始版本**：Cube Pets 2.0（包内 `License.txt` 标注 "Cube Pets (2.0)"，创建日期 26-03-2026）
- **原始压缩包**：2.81 MB（内含 FBX / OBJ / GLB 三种格式各一份）

### 本仓库保留的内容

| 仓库路径 | 说明 |
|---|---|
| `assets/3d/animal-*.glb` | 24 个动物模型，直接取自 `Models/GLB format/`，**未做任何修改** |
| `assets/3d/Textures/colormap.png` | 全 24 只共用的单张渐变图集（GLB 通过相对路径 `Textures/colormap.png` 引用） |
| `assets/3d/LICENSE-kenney.txt` | 原始 `License.txt` 原样保留 |

FBX / OBJ 格式、每只的参考 PNG 预览、`Overview.html` 未保留（无需要）。

### 从原始包中提取的文件名

`Models/GLB format/animal-<name>.glb` → `assets/3d/animal-<name>.glb`（24 个，文件名未改）
`Models/GLB format/Textures/colormap.png` → `assets/3d/Textures/colormap.png`

> ⚠️ 贴图是**外链**（GLB 内 `images[0].uri = "Textures/colormap.png"`），
> 移动 GLB 时必须保持同级 `Textures/` 目录，否则模型会变纯白。

## 24 只模型清单与技术参数

| 英文名 | 文件 | 三角面 | 世界高度 | GLB 体积 |
|---|---|---|---|---|
| beaver | `animal-beaver.glb` | 670 | 1.501 | 146.2 KB |
| bee | `animal-bee.glb` | 742 | 2.024 | 160.5 KB |
| bunny | `animal-bunny.glb` | 575 | 2.010 | 128.5 KB |
| cat | `animal-cat.glb` | 684 | 1.710 | 161.3 KB |
| caterpillar | `animal-caterpillar.glb` | 578 | 1.747 | 127.9 KB |
| chick | `animal-chick.glb` | 490 | 1.594 | 122.5 KB |
| cow | `animal-cow.glb` | 578 | 1.612 | 125.1 KB |
| crab | `animal-crab.glb` | 676 | 1.431 | 147.2 KB |
| deer | `animal-deer.glb` | 760 | 1.993 | 146.9 KB |
| dog | `animal-dog.glb` | 490 | 1.584 | 116.7 KB |
| elephant | `animal-elephant.glb` | 676 | 1.431 | 145.4 KB |
| fish | `animal-fish.glb` | 422 | 1.732 | 89.4 KB |
| fox | `animal-fox.glb` | 568 | 1.686 | 138.6 KB |
| giraffe | `animal-giraffe.glb` | 598 | 1.714 | 129.6 KB |
| hog | `animal-hog.glb` | 706 | 1.516 | 138.3 KB |
| koala | `animal-koala.glb` | 594 | 1.463 | 127.9 KB |
| lion | `animal-lion.glb` | 889 | 1.746 | 168.9 KB |
| monkey | `animal-monkey.glb` | 918 | 1.610 | 170.8 KB |
| panda | `animal-panda.glb` | 734 | 1.501 | 130.5 KB |
| parrot | `animal-parrot.glb` | 530 | 1.681 | 150.5 KB |
| penguin | `animal-penguin.glb` | 558 | 1.594 | 127.3 KB |
| pig | `animal-pig.glb` | 424 | 1.584 | 124.1 KB |
| polar | `animal-polar.glb` | 522 | 1.501 | 96.6 KB |
| tiger | `animal-tiger.glb` | 951 | 1.710 | 168.3 KB |

合计约 **3.3 MB**（24 个 GLB + 10.7 KB 图集）。

## 校验出来的关键约定（写代码时要遵守）

- **朝向**：模型**面朝 +Z**（前腿节点 `leg-front-*` 的 z = +0.25，后腿 `leg-back-*` 的 z = −0.25）。
  three.js 默认相机在 +Z 看向 −Z，所以**不需要额外转 180°**。
- **原点**：世界坐标 **Y 最低点 = 0**（脚已落地），无需 yOffset（`fish` 是 0.104，唯一例外）。
- **高度不一**：1.431 ~ 2.024，展示时要按包围盒归一化，否则镜头远近会跳。
- **无蒙皮**：`skins = 0`，动画是对节点（body / tail / leg-*）的刚体变换，
  因此普通 `.clone()` 即可复制，不需要 `SkeletonUtils.clone`。
- **单材质**：每只只有 1 个材质，`pbrMetallicRoughness` + `baseColorTexture = colormap`，
  `metallicFactor = 0`，`doubleSided = true` → 可以正常吃光照（GLTFLoader 会给 `MeshStandardMaterial`）。

## 动画清单（8 条，每条都从 t=0 开始，无需 subclip）

| 动画名 | 时长(s) | 建议用途 |
|---|---|---|
| `static` | 0.100 | 静态姿势（兜底） |
| `idle` | 1.000 | **常驻循环**（3D 查看默认） |
| `walk` | 0.500 | 走路 |
| `run` | 0.250 | 奔跑 |
| `eat` | 0.500 | 吃东西（可做"投喂"互动） |
| `dance` | 0.500 | **解锁仪式 / 点击互动** |
| `gesture-positive` | 0.250 | **答对/夸奖庆祝** |
| `gesture-negative` | 0.250 | 答错（本产品不用，避免负面反馈） |

每只模型都包含全部 8 条动画（采样率与时长一致）。

---

## 二、自制模型：火麒麟 / 腾云龙

| | 火麒麟 | 腾云龙 |
|---|---|---|
| 图鉴 id | `legend-01` | `legend-02` |
| GLB | `assets/3d/animal-qilin.glb` | `assets/3d/animal-dragon.glb` |
| 体积 | 84 KB | 127 KB |
| 零件数 | 54 个立方体 | 66 个立方体 |
| 配色 | **红金**：红躯干 + 金色头颈/独角/鹿角/蹄 + 金橙火焰鬃毛 | **金身红须**：亮金身体 + 红色鹿角/龙须/背鳍 + 橙色尾焰 |
| 价格 | 300 星 | 350 星 |

**来源：本仓库自己生成，不是外部素材。** 生成脚本：

```bash
node tools/make-mythic-glb.mjs      # 直接重写这两个 .glb
```

脚本用纯 Node 手写 glTF 2.0 二进制容器，没有引入任何依赖。做这两只时遵循的约束：

- 全部零件都是**轴对齐立方体**，无圆角无斜面 —— 与 Kenney 的方块语言一致
- 复用 Kenney 的 `Textures/colormap.png` 色图集（外链），配色与明暗套路一致
- 单材质 `pbrMetallicRoughness` + `metallicFactor 0` + `doubleSided`，与 Kenney 相同
- **8 条动画的名称与时长严格对齐 Kenney**：`static 0.1 / idle 1.0 / walk 0.5 / run 0.25 / eat 0.5 / dance 0.5 / gesture-positive 0.25 / gesture-negative 0.25`，都从 t=0 开始
- 面朝 **+Z**（与 Kenney 一致，viewer 无需旋转）

两个与 Kenney 不同的有意设计：

- **腾云龙**是蛇形（**7 段**渐细身体 + 四只向后收的小爪），有意做成**悬浮**姿态，所以 Y 最低点是 0.40 而不是 0；
  three.js 查看器按包围盒自动落地，所以不影响显示。
  - 头不是"大立方 + 小立方"的方块拼法，而是**颅骨 → 上颚 → 吻尖逐级变窄**的龙首轮廓。
  - 下颚是独立零件，**绕根部枢轴旋开 30°**（生成器里的 `pivot` 支持），口腔压暗、有红色舌头与白色牙齿。
  - 下颚带 `jaw` 动画角色：`eat` 时开合（咬）、`dance` 小幅开合、`gesture-positive` 微张。
- **火麒麟**虽为四足，但做成短腿 + 长躯干 + 金色独角 + 金橙火焰鬃毛，避免与现有 6 只史诗动物混同。
- ⚠️ **龙变长后的一个取舍**：图标是按包围球归一化的，龙越长、头在图标里就越小。
  如果想让龙在图标里更"大"，把 `spine` 的段数从 7 降到 5–6 即可（重跑脚本）。

图标同样由 GLB 渲染生成（见下方步骤），所以与模型始终一致。

### 色图集坐标（实测）

这两只用到的色块全部从 `colormap.png` 采样得到。该图集是 **3 行 × 12 列**的渐变色块，行边界在 `v = 0.25 / 0.50 / 0.75`：

| 用途 | 色块中心 | 实测颜色 |
|---|---|---|
| 龙身 | u 0.784, v 0.62 | #61cb8b |
| 龙背/阴影 | u 0.845, v 0.62 | #3ea87a |
| 金色（角/鳍/蹄） | u 0.905, v 0.62 | #ffc044 |
| 深金（麒麟身） | u 0.965, v 0.62 | #ffb54a |
| 腹部 | u 0.648, v 0.62 | #fde4c7 |
| 腹部阴影/吻部 | u 0.712, v 0.62 | #f8d7af |
| 眼白 | u 0.166, v 0.62 | #ffffff |
| 瞳孔 | u 0.648, v 0.90 | #38383d |
| 彩虹鬃毛 / 火焰 | v 0.37 行，u 分别 0.125 红 / 0.042 橙 / 0.375 浅蓝 / 0.542 紫 / 0.625 品红 | — |

> 图集里的纯色区很窄（每块约 u 宽度 0.06），所以取色时都取了**纯色区中心**，并在 `cubeGeometry()` 里给顶面/侧面/底面取略微不同的 u，复现 Kenney 那种“平色带一点明暗”的观感。

---

## 三、如何重新生成 2D 图标

`assets/animals/*.webp`（24 张，256px，共约 300 KB）不是手绘的，
而是用 `tools/icon-gen.html` 在同一机位 / 同一光照下把上面这些 GLB 渲染出来的，
所以**图鉴图标与 3D 模型永远一致**。换模型或调机位后重跑一次即可：

```bash
python3 tools/icon-gen-server.py 4174 24
# 浏览器打开 http://127.0.0.1:4174/tools/icon-gen.html?size=256&format=webp
# 只重出指定几只（不动其它，避免无意义 diff）：
#   ?size=256&format=webp&ids=legend-01,legend-02
```

> 该工具在 `tools/` 下但需要访问 `assets/3d/*.glb`，所以页面里加了 `<base href="/">`，
> 让运行时相对路径从仓库根解析（import 说明符也因此写成根绝对路径）。**别把 `<base>` 删了。**

无头批量生成（注意：**不要加 `--virtual-time-budget`**，它会在 fetch 过程中卡住不退出）：

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --enable-unsafe-swiftshader --no-sandbox \
  --user-data-dir=/tmp/icongen --window-size=600,400 \
  "http://127.0.0.1:4174/tools/icon-gen.html?size=256&format=webp" &
sleep 25 && pkill -f "user-data-dir=/tmp/icongen"
```

机位参数在 `tools/icon-gen.html` 顶部：包围球归一化半径 `SPHERE_R = 1.0`、
相机距离 `3.35×`、水平偏角 `-28°`、俯仰 `13°`，姿势固定用 `static` 片段第 0.1 秒。
