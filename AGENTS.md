# AGENTS.md —— 开发指南（面向 pi / coding agent）

幸运星计算乐园：一个**纯静态、零依赖、零构建**的 H5 数学练习 PWA。
面向 iPad（Safari 添加到主屏幕）与 MacBook，数据全部在浏览器本地。

> 家长使用说明见 [README.md](./README.md)（本文只讲开发）。

## 第一原则

- **不要引入构建工具 / 框架 / 依赖**。原生 ES Modules + 原生 DOM，`package.json` 只有两个静态服务器脚本。
- **所有资源用相对路径**（`./js/main.js`、`../vendor/...`）。线上是 GitHub Pages 子路径
  `https://lxliu.github.io/math-zone/`，绝对路径 `/...` 会 404。
- **UI 文案与代码注释用中文**，改动保持简洁直接。
- 改代码前先读实际文件，不要凭记忆断言；尤其是**版本号、题量、价格、缓存桶**这类会漂移的值。
- 不为了“文档改动”去动版本号或业务代码。

## 本地运行与部署

```bash
npm run dev     # node tools/dev-server.mjs → http://127.0.0.1:4173
npm run serve   # 同上
```

ES Modules 必须经 http(s) 访问，双击 `index.html` 不可用。

> **为什么不用 `python3 -m http.server`**：它只发 `Last-Modified`、不发 `Cache-Control`，
> 浏览器会对 js/css 做启发式缓存；而页面内 import 都是**没有 `?v=` 的相对路径**
> （`import "./screens/setup.js"`），于是会出现“改了代码、本地页面不动、F5 也没用”，
> 而线上（靠 `?v=` + SW 四层击穿）正常。`tools/dev-server.mjs` 对所有响应加 `no-store`，
> 本地改完刷新即生效；它零依赖，也不影响 SW 的 Cache Storage 预缓存。

- 部署：push 到 `main` → `.github/workflows/pages.yml` 自动发布到 GitHub Pages。
- 仓库：`git@github.com:lxliu/math-zone.git`，线上：https://lxliu.github.io/math-zone/

## 目录与架构

```
index.html                 单一入口：导航栏 #navbar + 屏幕挂载 #screen + #overlay-root
manifest.webmanifest       PWA 清单（standalone / 横屏）
sw.js                      Service Worker（离线缓存策略）
styles/                    tokens / base / components / screens
assets/icons/              PWA 图标；assets/avatars/ 初始头像 kid-boy/kid-girl.svg
assets/animals/*.webp      26 张图鉴图标（由 3D 模型渲染生成）
assets/3d/                 26 个 .glb（Kenney Cube Pets 2.0 CC0 ×24 + 自制神话 ×2）
assets/3d/CREDITS.md       素材来源/许可证/动画清单/模型约定（改素材前必读）
js/                        业务逻辑（见下）
tools/                     开发工具，不参与线上运行
vendor/                    three.js r160 + OrbitControls + addons（本地相对 import）
```

核心链路：

- `js/main.js` 入口：注册路由 → `startRouter()` → 订阅 store 变化重绘顶栏 → 注册 SW。
- `js/router.js` hash 路由（`#/name`）：`register(name, render, cleanup)`、全局守卫 `setGuard`、
  单屏离开拦截 `setLeaveGuard`。
- `js/store.js`：`state` / `currentAccount()` / `commit(fn)` / `subscribe(fn)`。所有写操作走 `commit`。
- `js/storage.js`：`loadState` / `saveState` / `migrate`（迁移必须**幂等**）。
- `js/ui.js`：`renderNavbar`、`mountScreen`、`modal`、`toast`；`NAV_TABS` 定义底/顶栏标签。
- `js/screens/*.js`：每个路由一屏（setup / today / play / result / calendar / animals / settings / parent / dev）。
- `js/game.js` + `js/scoring.js`：答题流程与计分；`js/keypad.js` 数字键盘；`js/audio.js`/`js/anim.js` 音效动画。

## 题库系统（改题型必看）

- `js/config.js` 是**唯一数据源**：`QUESTION_TYPES` 同时驱动组卷和家长设置页渲染
  （`name/short/skill/range/rule/samples/tips/subs`）。
  **改了生成器的数值范围/保证，必须同步更新这里的 `range`/`rule`/`samples`**，否则家长页说明会骗人。
- `STARS_PER_QUESTION = 2`、`DEFAULT_PER_TYPE = 3`、`MAX_PER_TYPE = 20`。
- `js/questions/types.js`：`t1()`…`t8()`，统一返回 `{ type, text, answer }`（`q()` 构造器）。
  题面用 `−`（U+2212）而不是 `-`；系数为 1 不写 `1x`。
- `js/questions/index.js` `buildQuestions(config)`：逐类生成 → 类内按 `text` 去重 → 类内打乱 → 拼接。
- 新增/修改题型后跑 `node tools/gen-check.mjs`（见下）验证结构与多样性。

题目里对“正确性”的口径（文档/说明不要写反）：

- T3「巧算」是**固定技巧骨架 + 随机参数**，五个子类带教学加权（凑整 25% / 分配律 25% /
  提公因数 25% / 小数互补 12.5% / 加减凑整 12.5%）；答案都凑成整百整千或整数。
- 方程类解域：T7 解为 1–12 正整数；T8 解为 0–100 的整数或一位小数。
- 除法都除得尽；减法不会小减大；结果都是有限小数。

## 图鉴与动物系统

## 图鉴与动物系统

- **等级主题（图鉴卡片 / 3D 查看器 / 解锁仪式 / 2D 漂浮）**：
  - 唯一入口是 `styles/components.css` 里的 `.theme-<tier>`（设置 `--tier-bg` / `--tier-pattern` / `--tier-deep`），
    由 `js/animals.js` 的 `tierThemeClass(tier)` 生成类名，四处 JS 都调它。
  - **改配色只改 `styles/tokens.css`** 的 `--tier-<tier>-soft / -deep / -pat`；
    `.tier-common` 等类**只属于徽章**（`background: var(--tier-*)`），不要往里塞主题样式。
  - 同档必须长得一样（卡片底色/纹理/边框）；3D 场景内的地面/接地阴影/补光按档位走色，
    定义在 `js/threeViewer.js` 顶部的 `GROUND_BY_TIER`（中心一律近白，避免给模型染色）。
  - 图标是带透明通道的 WebP，所以卡片底纹能透出来；若以后换成不透明图，底纹会看不见。
- `js/animals.js`：`TIERS`（common/rare/epic/legend 四档）、`ANIMALS`（26 只）、
  `TOTAL_ANIMALS`、`animalById`、`animalSrc`、`animalModelSrc`、`LEGACY_ANIMAL_MAP`。
- 关键约定：**id 前缀必须等于 tier**（`common-*`/`rare-*`/`epic-*`/`legend-*`）；
  `model` 字段对应 `assets/3d/<model>.glb`；图鉴里的图标文件 `assets/animals/<id>.webp`
  必须与 3D 模型同源生成。
- `js/shop.js` 购买/解锁；`js/accounts.js` 头像（`avatarSrc` 委托到动物图标）；账号与出生日期无关
  （出生日期已移除，迁移会删除该字段）。
- 增删动物要动存档时：更新 `ANIMALS` 并**升 `ANIMAL_ROSTER_VERSION`（现为 3）**，
  在 `js/storage.js` 写幂等迁移；`legend-*` 这类 id 不要盲目复用给旧存档。
  **只是往现有档位追加新动物、不改旧 id 时，不必升版本**（但不要偷偷给旧存档发礼物）。

## 存档与迁移

- 位置：`localStorage`，键 **`luckyStar.v1`**；`SCHEMA_VERSION = 1`（`js/storage.js`）。
- 一切读写经 `loadState()`（会跑迁移并在变化时落盘）/`commit`。
- 迁移函数必须幂等；`loadState` 会对比序列化结果决定是否回写。
- 备份导出/导入：`js/backup.js`；导入也要过迁移。

## 家长门控与调试

- `js/gate.js`：`GATE_PASSWORD = "test123456"`，家长设置与调试面板共用。
  另有**首次配置一次性令牌**：`grantFirstSetup(accountId)` / `isFirstSetup(accountId)` / `clearFirstSetup()`
  （`sessionStorage.parentOnboard`，值为账号 id）。
- 家长页 `#/parent`：
  - **刚建号那一次免密码**：`js/screens/setup.js` 建完账号后 `grantFirstSetup(id)` 再 `go("parent")`；
    页面显示首次引导（默认题量偏多的提醒、“以后怎么改 + 密码”、iOS/Android 加到主屏幕提示）。
  - 其余情况要密码：`promptParentPassword` 成功后 `grantParentAccess()`（`sessionStorage.parentUnlocked`）。
  - 草稿 + 显式「保存」，有未保存徽标与离开确认。
  - `register("parent", …, parent.cleanup)`：cleanup 里 `clearFirstSetup()`，保证令牌**只在这一次访问内有效**
    （刷新同一标签页仍有效，离开即失效）。改注册时别漏掉 cleanup。
- 调试面板只在 `location.hostname === "127.0.0.1"` 且 URL 带 `?dev=1` 时可用。
  不要把调试入口当成家长的常规使用方法。

## 3D 与素材

- `js/threeViewer.js` + `js/models/`：registry（模型/动画映射）、gltf（加载）、
  index（入口，含程序化兜底）、animals3d/hedgehog（旧程序化模型）。
- 素材约定（详见 `assets/3d/CREDITS.md`）：模型面朝 +Z、脚在 Y=0、无蒙皮（刚体节点动画），
  每只 8 条动画 `static/idle/walk/run/eat/dance/gesture-positive/gesture-negative`。
  贴图 `assets/3d/Textures/colormap.png` 是 GLB 外链，**必须同级保留**。
- 自制神话模型由 `tools/make-mythic-glb.mjs`（纯 Node 手写 glTF 2.0）生成，保持可复现。
- 换模型后必须重出图标：`tools/icon-gen.html`（见下）。图标与 3D 必须永远一致。
- `USE_GLB_MODELS`（`js/config.js`）可一键回退旧程序化模型。

## 缓存 / Service Worker（发版最容易翻车的地方）

`sw.js` 事实，改动前务必理解：

- 一个缓存桶 `CACHE`（当前 `lucky-star-v17`）+ 一份 `CORE` 预缓存清单。
- `document/script/style/manifest` 走 **network-first**，其余走 **cache-first**。
- `cacheKey()` 去掉查询串再存取，所以 `?v=` 能击穿缓存又不破坏离线。
- **GLB 故意不放进 `CORE`**：按需加载后进入 cache-first，避免首屏下 3MB。
- 新增会离线用到的文件 → 加进 `CORE`；纯按需资源（GLB/新图）可不加。

**发版要同时对齐三处版本号（当前 0.9.1）：**

| 位置 | 改什么 |
|---|---|
| `index.html` | 5 处 `?v=`（4 个 CSS + `js/main.js`）——纯静态 HTML 读不到 JS 常量 |
| `js/constants.js` | `APP_VERSION`（会拼进 `sw.js?v=`） |
| `sw.js` | `CACHE` 桶名（如 `lucky-star-v18`） |

- 只改文档、不改代码时**不要**动这些版本号。
- 若在**同一 URL** 替换了图标/GLB 等 cache-first 资源的内容，必须 bump 缓存桶，否则老用户拿不到新内容。
- 不要声称“缓存被完全禁用”——离线可用正依赖缓存。

## 工具与自检

- `npm run dev` 后：`node tools/gen-check.mjs 20000` —— 采样校验 8 类题目（唯一题量、结构断言、T3 子类占比）。
- **本地页面“改了不动”先怀疑缓存**：确认已用 `npm run dev`（no-store）而不是 `python3 -m http.server`；
  再看设置页底部的版本号是否等于 `APP_VERSION`。
- **被旧 SW 污染的 origin**（最老那版 SW 是「所有请求 cache-first」，会让 `F5` 完全无效）：
  打开 `tools/reset-sw.html`（如 `http://127.0.0.1:4173/tools/reset-sw.html`）——
  它会注销所有 SW、删光 Cache Storage 并跳回首页。该页只靠内联脚本，
  所以即使旧 SW 控制着页面，也能靠“新 URL 未命中缓存 → 回源”拿到。
  另：换一个端口（新 origin）也能立即回到干净状态。
- `node --check <file>` 校验语法（js / tools / sw / vendor 都能过）。
- 改完 import 后确认目标存在，且 `sw.js` 里 `CORE` 的相对路径都能命中真实文件。
- `tools/3d-selftest.html` 3D 素材自检（逐只校验模型/动画/落地面）。
- 图标重出：`tools/icon-gen.html?size=256&format=webp&ids=legend-01,legend-02`，
  配 `tools/icon-gen-server.py` 落盘。
- 界面冒烟：`tools/smoke.html` + `tools/smoke-server.py`，注入测试存档。
  **必须用独立 origin / 独立浏览器 profile，绝不能污染真实家长的 localStorage。**
- 注：`tools/` 页面目前用 `base href="/"` 的根绝对路径 import，只保证本地根目录托管下能跑，
  不代表 Pages 子路径下可用。
- 浏览器截图走 CDP(9222) + Node WebSocket；旧的无头截图/虚拟时间方案会挂，
  一律加超时、用隔离 profile，别写无终止的 sleep，也别用大范围 `pkill`。
- iPad 真机性能只能由用户在设备上验证，自动化测试不能替代。

## 发版检查清单

1. 功能做完，`node --check` 通过，`gen-check` / 相关工具自检通过。
2. 对齐三处版本号（见上表）。
3. 若替换了同 URL 的 cache-first 资源 → bump 缓存桶。
4. commit → push `main` → 等 Pages 部署 → 打开线上地址确认。
5. 涉及 3D / 缓存 / PWA 的改动，在真机（iPad Safari）上复验。
