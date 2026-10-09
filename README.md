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

## 数据

- 存储位置：浏览器 `localStorage`，键名 `luckyStar.v1`
- 每个账号包含：姓名 / 性别 / 出生日期 / 头像 / 幸运星 / 已解锁动物 / 每日记录
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
  animals/                 动物 SVG（里程碑 6）
js/
  main router store storage utils ui audio anim
  accounts animals shop calendar settings backup
  game scoring constants keypad
  questions/               level1-4 + tricks + index（组卷）
  screens/                 setup today difficulty play result calendar animals settings
```

## 里程碑

- [x] 1. 骨架 + PWA
- [x] 2. 存储层 + 账号 + 头像（含 2 个小朋友头像）
- [x] 3. 题库生成器（4 难度 + 巧算 5 子类 + 综合组卷）
- [x] 4. 答题流程 + 数字键盘 + 计分 + 音效/动画
- [x] 5. 每日状态机 + 续做 + 错题循环
- [x] 6. 动物系统（图鉴 / 解锁仪式 / CSS 3D）+ 20 只 SVG + 解锁后可作头像
- [x] 7. 月度日历看板
- [x] 8. 导出 / 导入备份
- [~] 9. iPad Pro / MacBook 真机调优与测试（自动化校验已过，真机待验证）

## 真机测试清单（请在设备上过一遍）

- [ ] 首次进入 → 新建账号 → 进入今日
- [ ] 开始今天的 20 题 → 数字键盘输入 → 答对/答错反馈与音效
- [ ] 故意答错若干题 → 出现「再挑战一次」→ 重做至全对
- [ ] 结算页显示总耗时与幸运星 → 飞星收集动画 → 顶栏星星增加
- [ ] 顶栏「今日」状态变为「已完成」，今日页按钮禁用
- [ ] 动物页：余额够时解锁 → 翻牌仪式 → 已解锁可 3D 旋转/缩放
- [ ] 设置：把已解锁动物设为头像 → 顶栏头像变化
- [ ] 日历：今日/已完成/错过状态正确，连续天数正确
- [ ] 设置 → 导出备份 → 清除站点数据 → 导入备份 → 数据恢复
- [ ] 分享 → 添加到主屏幕 → 断网仍可打开（离线）
- [ ] 旋转屏幕：横屏左右分栏、竖屏上下堆叠

## 玩法规则（已定稿）

- 4 个难度 + 综合；每题幸运星 2/3/4/5，满额 40/60/80/100，综合 70
- 不限时间；**全部做对**才得当天幸运星，差一个 = 0
- 答错只提示、不给答案；错题循环重做直到全对
- 每天一次、只能做当天、错过不补；中途退出自动保存进度
- 计时全程隐藏，只在结算页显示总耗时
