# CircuitNexus 素材资产清单 V1.0

> 目的：区分“可用于发布的定稿素材”“设计阶段预览”和“历史中间产物”，避免官网或应用误用早期图片。

## A. 当前仓库中已纳管的源素材（优先使用）
| 文件/目录 | 格式 | 使用场景 | 版本状态 |
|---|---|---|---|
| `assets/brand/logo/circuitnexus-logo.svg` | SVG | 横排品牌 Logo | V1 几何重建基线 |
| `assets/brand/logo/circuitnexus-logo-dark.svg` | SVG | 深色背景字标 | V1 |
| `assets/brand/logo/circuitnexus-logo-light.svg` | SVG | 亮色背景字标 | V1 |
| `assets/brand/logo/circuitnexus-symbol-gold.svg` | SVG | 独立 Logo 图形 | V1 |
| `assets/brand/logo/circuitnexus-symbol-hero-gold.svg` | SVG | 大型宣传渐变金图形 | V1 |
| `assets/brand/app-icons/favicon.svg` | SVG | 小尺寸网站浏览器标签 | V1 |
| `assets/themes/pcb/*-welcome.svg` | SVG | 欢迎页四角 PCB 背景 | V1 重建 |
| `assets/themes/pcb/*-overlay.svg` | SVG | 透明背景叠层 | V1 重建 |
| `assets/brand/website/hero-background-*.svg` | SVG | 官网 Hero | V1 |
| `assets/tokens/circuitnexus-brand.{css,json}` | 文本 | 全局品牌变量 | V1 |
| `assets/tokens/circuitnexus-theme-tokens.{css,json}` | 文本 | 深浅双主题 | V1 |

## B. 原始完整品牌素材包（已在本次对话生成）
本轮提供的 **CircuitNexus_Logo_Web_App_Assets_V1.zip** 包括以下内容：
- 组合 Logo：SVG、透明 PNG、深色/浅色 2000px 横版；
- 独立 Logo：金色/深色/浅色/黑白变体和渐变金；
- Desktop：Windows 多尺寸 `.ico`、应用图标 PNG（16–1024px 按用途）、板卡绿可选版；
- Website：Favicon、Apple Touch 图标、Web Manifest、OG 分享卡片 PNG/SVG；
- Website Feature：原理图设计、网表分析、电路审查、电源树、PCB/SI、知识库、工程报告、EDA 集成 8 组 SVG/PNG；
- Hero：亮色/暗色 SVG 及 PNG 效果预览；
- 预览样机、配色 CSS/JSON、资产生成源码。

**重要：** GitHub 版本以此清单中“当前仓库”列出的路径为准。PNG/ICO 二进制、预览稿及另外一些 Logo 变体若尚未通过仓库提交校验，就不能宣称已经入库；请使用 [素材导出脚本](../tools/export_assets.py) 从 SVG 生成标准 PNG/ICO，并与对话中的完整 ZIP 对照。

## C. PCB 纹理中间产物
本轮历史包含 `CircuitNexus_PCB_Backgrounds_SVG_V1.zip`：
- 暗色/亮色完整背景 SVG；
- 暗色/亮色透明纹理 SVG；
- 两种主题 PNG 预览、CSS 接入样例及 README。
它们从用户提供的 UI 截图进行**高保真矢量重建**，不是原始 CSS/SVG 的无损提取。

## D. 设计规范中间产物
- `CircuitNexus_UI_Design_System_v1.0.md` → 已归并为 `docs/UI_GUIDELINES.md`
- `circuitnexus-theme-tokens.css/json` → `assets/tokens/`
- `circuitnexus-brand.css/json` → `assets/tokens/`
- 两张独立亮/暗 UI 规范设计板：作为视觉参考，文字要求以 Markdown+Token 为准；
- 最初蓝绿 Logo 方案：**废弃 / 仅归档**；
- 已确认金色 C 三等宽走线 Logo 设计板：作为结构参考。

## E. 对外发布规格
| 目标 | 资产 | 建议尺寸 |
|---|---|---|
| 网站页眉 | 完整 SVG Logo | 高 32–48px |
| Windows EXE | ICO | 含 16, 24, 32, 48, 64, 128, 256px |
| App 平台介绍 | PNG 图标 | 512 / 1024px |
| 浏览器 Favicon | 简化 SVG/ICO | 16 / 32 / 48px |
| 官网社交分享 | OG PNG | 1200×630px |
| Website Hero | SVG 背景 | 16:9、16:10 响应式 |
| 产品说明 / 演示 | 暗色/亮色 UI 预览 | 1920×1080 / 1440×900 |

## F. 补全待办
- [ ] 二进制 PNG/ICO 与预览图上传并核对哈希；
- [ ] 8 组功能图标全部统一到同一图标尺寸和视觉基准；
- [ ] 最终 SVG 比例和小图标清晰度逐尺寸验收；
- [ ] 商标/域名/近似 Logo 查重及第三方许可归档。

完整来源与迭代见 [决策日志](DECISIONS.md)。
