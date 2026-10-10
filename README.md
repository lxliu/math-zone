# 幸运星计算乐园 🦊⭐

让小朋友**每天坚持**做计算练习的 H5 小游戏。完成后收集**幸运星** → 解锁可爱**动物图鉴**。

- 家长配置每日题量（**8 类题型**，每题 2 星），孩子不选难度
- 纯静态、离线可用、可"添加到主屏幕"（PWA）
- iPad 优先，兼容 MacBook
- 数据全部存在浏览器本地，支持多账号与导出/导入备份

## 本地运行

ES Modules 需要 http(s) 环境（不能直接双击 `index.html`）。

```bash
cd kids-playground
npm run dev          # 等价于 python3 -m http.server 4173
# 打开 http://localhost:4173
```

或用任意静态服务器：

```bash
npx serve .          # 或  python3 -m http.server
```

## 部署（iPad 用）

**已配置 GitHub Actions 自动部署**：push 到 `main` 后自动发布到 GitHub Pages。

- 仓库：https://github.com/lxliu/math-zone
- 线上地址：**https://lxliu.github.io/math-zone/**
- 首次需在 **Settings → Pages → Source 选 “GitHub Actions”**（工作流已尝试自动启用）
- 之后每次 push 到 main，`.github/workflows/pages.yml` 会自动重新部署

iPad 上：

1. Safari 打开线上地址
2. 点 **分享 → 添加到主屏幕**
3. 从主屏幕图标进入（全屏、离线）

> 重要：**必须 HTTPS** 才能启用 Service Worker / PWA。iPad Safari 对**非主屏网站**的本地存储有"7 天无交互即清理"策略；**添加到主屏幕**后不受此限制。仍建议定期用「设置 → 导出备份」。

其他可选：Netlify / Vercel 导入该仓库即可。

## 发版三步（缓存版本号）

改完代码发布前，把这三处版本号对齐（现在是 `0.7.0`）：

| 文件 | 改什么 | 为什么 |
|---|---|---|
| `index.html` | 5 处 `?v=0.7.0`（4 个 CSS + `js/main.js`） | 纯静态 HTML 读不到 JS 常量，只能手改；URL 一变就必然缓存击穿 |
| `js/constants.js` | `APP_VERSION` | 会拼进 `sw.js?v=`；sw.js 的 URL 一变，浏览器必然装新 SW 并清旧缓存 |
| `sw.js` | `CACHE`（如 `lucky-star-v12`） | 手动保险：换个新缓存桶 |

> 这三处外面还包了两层自动防护，日常 F5 就会拿到新版：
> `sw.js` 的 `networkFirst()` 用 `fetch(request, { cache: "reload" })` 绕过浏览器 HTTP 缓存；
> `sw.js` 的 `cacheKey()` 把 `?v=` 去掉再存/取，所以版本串既能击穿缓存、又不破坏离线。

## 数据

- 存储位置：浏览器 `localStorage`，键名 `luckyStar.v1`
- 每个账号包含：姓名 / 性别 / 头像 / 幸运星 / 已解锁动物 / 每日记录
- 备份：设置页「导出 / 导入」（JSON 文件）

## 目录结构

```
index.html                 入口（导航栏 + 屏幕挂载）
manifest.webmanifest       PWA 清单
sw.js                      Service Worker（离线缓存）
styles/                    tokens / base / components / screens
assets/
  icons/                   PWA 图标
  avatars/                 初始头像（kid-boy / kid-girl）
  animals/                 24 张动物图标（.webp，由 3D 模型渲染生成）
  3d/                      24 个 Kenney Cube Pets 2.0 模型（.glb + 图集）
    CREDITS.md             素材来源 / 许可证 / 动画清单 / 关键约定
    animal-*.glb           每只一个 glb，含 8 条动画
    Textures/colormap.png  全 24 只共用的渐变图集（GLB 外链，必须同级保留）
tools/                     开发工具（不参与线上运行）
  icon-gen.html            由 GLB 批量渲染动物图标（256px WebP）
  icon-gen-server.py       配套落盘服务
  3d-selftest.html         3D 素材自检（逐只校验模型 / 动画 / 地面高度）
  gen-check.mjs            题目生成器采样自检（node tools/gen-check.mjs 20000）
  smoke.html / smoke-server.py  注入存档的界面冒烟测试
js/
  main router store storage utils ui audio anim
  accounts animals shop calendar settings backup
  game scoring constants keypad config gate dev
  threeViewer.js           3D 查看器（glTF + 动画 + 环境光 + 点击互动）
  models/                  registry（映射表）gltf（加载）index（入口）
                           lib / animals3d / hedgehog（旧程序化模型，兼底用）
  questions/               level1-4 + tricks + types + index（组卷）
  screens/                 setup today play result calendar animals settings parent dev
```

## 3D 动物素材

- 模型：[Kenney「Cube Pets」2.0](https://kenney.nl/assets/cube-pets)，**CC0 公共领域**，可商用无需署名
- 24 只全部带 `static / idle / walk / run / eat / dance / gesture-positive / gesture-negative` 八条动画
- 每只仅 422–951 三角面、单材质，单只 GLB 89–171 KB（全量 3.3 MB，**解锁时按需加载**，不预缓存）
- 模型面朝 +Z、脚在 Y=0，无需旋转或偏移；详见 [`assets/3d/CREDITS.md`](assets/3d/CREDITS.md)
- 图鉴里的 2D 图标由同一批 GLB 渲染而来，所以**图标与 3D 永远一致**；换模型后跑一次 `tools/icon-gen.html` 即可重出
- 旧名单旧存档会自动迁移（同种动物换 id、已移除的换同档新动物，**不退款、不清空**），见 `js/storage.js` 的 `migrateAnimals()`

## 里程碑

- [x] 1. 骨架 + PWA
- [x] 2. 存储层 + 账号 + 头像（含 2 个小朋友头像）
- [x] 3. 题库生成器（4 难度 + 巧算 5 子类 + 综合组卷）
- [x] 4. 答题流程 + 数字键盘 + 计分 + 音效/动画
- [x] 5. 每日状态机 + 续做 + 错题循环
- [x] 6. 动物系统（图鉴 / 解锁仪式 / 3D）+ 20 只 SVG + 解锁后可作头像
- [x] 7. 月度日历看板
- [x] 8. 导出 / 导入备份
- [x] 9. 3D 大升级：换成 Kenney Cube Pets 2.0（24 只，CC0，带 8 条动画）+ 渲染管线升级
- [x] 10. 图鉴扩到 24 只 + 旧存档迁移 + 图标改由 3D 渲染
- [x] 11. 24 只重新划分档位（普通/稀有/史诗 + 神话预留），价格改为 50–200
- [x] 12. 巧算改为「固定技巧骨架 + 随机参数」（题量 10 → 上千）+ 家长设置页每类详细说明
- [x] 13. 移除出生日期；修头像即时刷新；修迁移结果不落盘
- [~] 14. iPad Pro / MacBook 真机调优与测试（自动化校验已过，真机待验证）

## 真机测试清单（请在设备上过一遍）

- [ ] 首次进入 → 新建账号 → 进入今日
- [ ] 开始今天的 20 题 → 数字键盘输入 → 答对/答错反馈与音效
- [ ] 故意答错若干题 → 出现「再挑战一次」→ 重做至全对
- [ ] 结算页显示总耗时与幸运星 → 飞星收集动画 → 顶栏星星增加
- [ ] 顶栏「今日」状态变为「已完成」，今日页按钮禁用
- [ ] 动物页：余额够时解锁 → 翻牌仪式 → 自动进入 3D 并跳一段庆祝动作
- [ ] 3D 里点一下动物会做动作；拖动旋转、双指缩放流畅；关闭后无卡顿/不发烫
- [ ] 3D 加载中看到星星转圈（不是白屏），弱网下稍等也能出
- [ ] 用旧存档（老的 20 只时代）打开 → 收藏数量不减少、没有动物凭空消失
- [ ] 设置：把已解锁动物设为头像 → 顶栏头像变化
- [ ] 日历：今日/已完成/错过状态正确，连续天数正确
- [ ] 设置 → 导出备份 → 清除站点数据 → 导入备份 → 数据恢复
- [ ] 分享 → 添加到主屏幕 → 断网仍可打开（离线）
- [ ] 旋转屏幕：横屏左右分栏、竖屏上下堆叠

## 玩法规则（已定稿）

- **8 类题型**，每题 **2 颗幸运星**；家长在「家长设置」里为每类配 0–20 题（默认 3 题/类 → 24 题/天 → 48 星/天）
- 不限时间；**全部做对**才得当天幸运星，差一个 = 0
- 答错只提示、不给答案；错题循环重做直到全对
- 每天一次、只能做当天、错过不补；中途退出自动保存进度
- 计时全程隐藏，只在结算页显示总耗时
- 图鉴共 **24 只**动物，分三档：**普通 10 只（50–70 星）/ 稀有 8 只（100–140 星）/ 史诗 6 只（150–200 星）**；全套 **2595 星 ≈ 54 天**（按 48 星/天）
- **神话档（300–500 星）目前留空**，只留给神龙这类不存在的动物；图鉴里会显示占位说明
- 最便宜的 50 星 > 每天满星 48，所以**第一只动物最快第 2 天**解锁
- 解锁永久有效，可作头像；解锁后点动物可让它跳舞，拖动可旋转
