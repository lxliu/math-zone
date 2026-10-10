# 3D 素材来源与许可

## Cube Pets (2.0)

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

## 如何重新生成 2D 图标

`assets/animals/*.webp`（24 张，256px，共约 300 KB）不是手绘的，
而是用 `tools/icon-gen.html` 在同一机位 / 同一光照下把上面这些 GLB 渲染出来的，
所以**图鉴图标与 3D 模型永远一致**。换模型或调机位后重跑一次即可：

```bash
python3 tools/icon-gen-server.py 4174 24
# 浏览器打开 http://127.0.0.1:4174/tools/icon-gen.html?size=256&format=webp
```

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
