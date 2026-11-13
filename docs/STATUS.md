# CircuitNexus｜状态与验收追踪

> 更新基线：2026-11-12。此文档记录的是**已确认的讨论成果/已存档资产**，不等于已验证的软件功能。

| 项目 | 状态 | 说明 / 下步验证 |
|---|---|---|
| 品牌名称 CircuitNexus / 电路智枢 | 已确定 | 统一替换旧名 |
| 品牌定位 / 视觉关键词 | 已确定 | 作为文案与 UI 设计依据 |
| C + 三走线 Logo 构图与几何规则 | 已确定 | 与参考位图比对并测试小尺寸 |
| Logo SVG 结构源文件 | 已提交 | 核对深浅模式、轮廓与尺寸 |
| 标准 PNG / ICO 导出件 | 已自动生成入库 | GitHub Actions 从当前 SVG 母版导出，存放在 `assets/exports/`；早期原始概念图不属于这批自动导出 |
| 石墨黑金 / 暖白金配色 | 已确定 | 测试实际 DSH 控件的背景合成 |
| 两主题完整 Token（CSS/JSON） | 已提交 | 需映射到 DSH 实际 Theme API |
| 欢迎页 PCB 背景与透明层 SVG | 已提交 | 实际 16:9、16:10、窄屏验证 |
| 深色/亮色设计规范文档 | 已提交 | 作为统一设计约束 |
| DSH 品牌 Fork / 安装器 | 规划中 | 未在本仓库完成打包 |
| 内置 Hardware Skill | 规划中 | 需验证注册与安装包包含 |
| KiCad MCP / 网表规则闭环 | 实验/规划 | 需移植既有 Demo 并建立测试证据 |
| 完整可用的 AI 硬件工作台 | 目标 | 未宣称完成 |
| 官网页面视觉资源 / OG / 功能图标 | SVG 已入库，PNG 已自动生成 | `assets/brand/website/` 与 `assets/exports/website/`；网站本身尚未部署 |
| Landing Page 实际部署 | 已部署（外部静态站） | `circuit.1616516.xyz`：Cloudflare DNS A → 149.104.5.12；NPM Proxy Host #93 → Apache httpd 容器 3002；复用 `*.1616516.xyz` 通配符证书并强制 SSL；视觉验收截图仍待补 |
| 官网单页落地页源码（`index.html`） | 已构建并部署 / 未视觉验收 | 静态单文件、亮暗双主题、同源 SVG 图标与 Logo、响应式；部署副本位于 `httpd/website/circuitnexus/`；需补双主题 × 桌面/手机截图、对比度与 Lighthouse 记录 |

## 2026-11-12 UI 视觉交付

- [x] 新版产品标志、欢迎页文案与 Dark/Light 设计原型已归档。
- [x] 三张原始 PNG：暗色欢迎页、亮色欢迎页、对角双色宣传图已推送至 `assets/ui/prototypes/`。
- [x] 已归档 [设计视觉约束](UI_VISUAL_SPEC_V1.md) 与 [开发交接说明](UI_PROTOTYPE_HANDOFF.md)。
- [ ] 将原型真正集成到 DSH Fork 后的客户端，运行时截图验收仍未完成。

## 2026-11-12 官网落地页

- [x] 参考 chipbuddy.ai 产品介绍页的信息架构（Hero / 能力 / 工作流 / 双主题 / 路线图 / FAQ / CTA），构建单文件静态 `index.html`。
- [x] 亮暗双主题由 `assets/tokens/circuitnexus-theme-tokens.css` 驱动：`data-cnx-theme` 切换、本地记忆、首帧无闪屏；Logo 与 PCB 背景按主题切换同源 SVG。
- [x] 8 组功能图标、Logo、favicon、OG 卡片与对角双主题原型图直接引用 `assets/` 现有资产，未改写一个源 SVG / PNG。
- [x] 对角双主题展示区用局部 Token 变量同屏对照，遵循「对角拼图仅用于官网营销展示」的约束。
- [x] 已部署至 `https://circuit.1616516.xyz`：NPM Proxy Host #93 + Cloudflare DNS + Apache httpd；HTTP→HTTPS、证书链与关键资源访问已验证。
- [ ] 桌面 / 手机 × 亮 / 暗截图、WCAG 对比度实测、Lighthouse 与 100/125/150% 缩放验收未完成。
- [ ] 本页仍为设计预览，不代表已发布可安装产品；Apache vhost 配置写于容器内，重建容器需执行 `/root/httpd/config-backup/` 中的恢复脚本。
- [x] 按产品口径精简为能力介绍：移除双主题展示、工作闭环、工程原则、路线图、FAQ、GET INVOLVED 与页脚文档/仓库链接及所有 GitHub 外链；能力文案覆盖子模块原理图设计、器件选型、设计文档辅助编制、Cadence OrCAD 网表解析、110+ 条评审要素、复杂电路机理分析、PCB 指导、Agent/Harness/Skill/知识库/MCP 与 AI 驱动 KiCad；修复主题按钮 hover 旋转导致的歪斜与 Hero 产品 UI 图比例。
- [x] 新增中英切换：默认中文，`data-i18n` 驱动 53 处文案及标题/元信息，切换按钮位于顶部主题按钮之前；技术架构图经三轮视觉迭代增强（同源功能图标、逐层增强金色边缘、发光总线与焊盘节点、阶梯宽度、一次性流光），已用 Chromium 截图与计算样式验证双主题 / 中英 / 移动端一致性与无溢出。
- [x] 英文版 Hero 产品图替换为用户提供的 1672×941 英文 UI 图（`assets/ui/prototypes/theme-split-diagonal-en.jpg`），中文版仍用原对角双主题 PNG；由语言切换 JS 联动 src/alt，比例与主题一致性已截图核验。
- [x] 左上角 / 页脚 Logo 改用纯英文变体 `circuitnexus-logo-en-{dark,light}.svg`：去掉小号中文，图形与英文名称按同一中心线垂直对齐；原定稿 Logo 与导出 PNG 保持不变。
- [x] 落地页自包含副本推送至仓库 `landingpage/`（`index.html` + 17 个同源资产 + README），可独立静态托管；线上仍由 `/root/httpd/website/circuitnexus/` 提供服务。

## V0.1 软件验收
- [ ] 应用名、图标、任务栏、安装器完全统一为 CircuitNexus；
- [ ] 深浅主题切换正确、首帧无闪屏；
- [ ] 欢迎页 SVG 无遮挡；长文本关闭/淡化背景；
- [ ] Skill 无须用户手动安装；
- [ ] 样例网表能解析并得到规则校核报告；
- [ ] 错误工具/插件能恢复且不导致无法启动；
- [ ] 全新 Windows 环境测试通过；
- [ ] 公开仓库无机密数据、Token、第三方无授权内容。

## 证据要求
软件/工具功能以测试记录为证；Logo/页面以尺寸截图为证；用户确认的审美方向不等于色彩对比和小尺寸渲染已经测试。每个发布里程碑都需要明确上游 DSH Commit、构建环境、测试系统、结果与已知问题。
