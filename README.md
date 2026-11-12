# CircuitNexus · 电路智枢

**AI Hardware Engineering Workspace｜AI 硬件研发工作台**

> 基于开源 DeepSeek Harness 的专业硬件研发 Agent 产品项目。当前仓库首先作为产品目标、品牌资产、双主题视觉规范和设计决策的**单一事实来源**，随后逐步承载客户端定制与工程能力集成。

![CircuitNexus logo](assets/brand/logo/circuitnexus-logo-light.svg)

## 项目定位

CircuitNexus 不是普通硬件问答机器人，而是通过 **Agent + Skill + MCP / CLI / EDA 工具 + 知识库 + 确定性验证** 完成真实硬件研发任务的工作台。

目标工作流：**需求 → 资料理解 → 工具执行 → 设计/分析 → 检查修正 → 工程交付**。

计划能力：原理图设计与修改、网表解析、原理分析、原理图评审、电源树提取、器件分析、PCB/高速接口辅助、工程报告与可追溯验证。

> 状态声明：项目目标不等于已实现功能。当前首先锁定品牌视觉与技术路线；工程集成成果及功能验收应独立记录。参考 [进度与状态](docs/STATUS.md)。

## 品牌定稿（2026-11-12）

- **正式英文名称：CircuitNexus**
- **正式中文名称：电路智枢**
- **产品定位：AI 硬件研发工作台 / AI Hardware Engineering Workspace**
- **品牌视觉语言：Precision Black & Gold｜精密黑金**
- **Logo：开放式几何 C + 三条等宽 PCB 走线 + 三个环形焊盘。内部走线为水平与 ±45°，转弯形成 135° 内角。**
- **两套主界面主题：石墨黑金 Dark 与暖白香槟金 Light。** Board Green 仅为延展主题，非这次两套主规范。
- 废弃旧产品名 **HardBuddy**，其历史 UI 截图仅作布局参考，不是现行品牌标识。

## 导航

| 范围 | 文档或资源 |
|---|---|
| 产品定位、目标、范围 | [产品目标](docs/PRODUCT_VISION.md) |
| Logo、品牌色、使用要求 | [品牌识别规范](docs/BRAND_IDENTITY.md) |
| 暗色主题 | [Dark 主题规范](docs/THEME_DARK.md) |
| 亮色主题 | [Light 主题规范](docs/THEME_LIGHT.md) |
| 组件、排版、背景、可访问性 | [UI 设计规范](docs/UI_GUIDELINES.md) |
| 矢量、图片、图标、来源与状态 | [素材清单](docs/ASSET_MANIFEST.md) |
| DSH Fork 集成路径 | [技术集成计划](docs/INTEGRATION_PLAN.md) |
| 决策/历史产物记录 | [设计决策日志](docs/DECISIONS.md) |
| 已完成 / 验证中 / 规划 | [进度与状态](docs/STATUS.md) |
| 可编辑 SVG 及主题 Token | [assets/brand](assets/brand/) / [assets/themes](assets/themes/) |

## 核心品牌色

| Token | Dark | Light |
|---|---|---|
| Canvas | `#0D0E10` | `#FBF7EF` |
| Sidebar | `#16181D` | `#F4E9D8` |
| Card/Input | `#23262C` | `#FFFFFF` |
| Primary text | `#F2F4F7` | `#3E2E0B` |
| Secondary text | `#9AA0A6` | `#6F6659` |
| Brand accent | `#D4AF37` | `#C79A3B` |
| PCB trace (decorative) | `#3A3124` | `#E6D6B8` |

**重要：** 亮色主题金色 `#C79A3B` 适合按钮与装饰，普通小字必须使用深金 `#805C1E`，确保对比度。

## 使用素材

优先使用仓库内的 SVG 源文件；PNG、ICO 应从同源 SVG 生成，避免多版本漂移。高清预览、早期概念稿和全部会话阶段素材另列于素材清单；早期蓝绿概念与旧 H 芯片标志均不作为正式品牌使用。

## 工程原则

确定性任务由程序/EDA 执行，Agent 负责协调与推理；结论尽量给出网表、器件手册或工具证据；遵循模块化、Windows/Linux、离线能力和安全权限设计。

## 版权与分发

本仓库的品牌素材、第三方依赖、DeepSeek Harness 源码并不自动属于同一许可证。Fork 与再分发时，应保留上游许可通知并核查第三方字体、图标及商标权利。**“CircuitNexus”与其 Logo 在正式商用前还需要进行商标与近似标识清查。** 请勿向公开仓库提交内部真实设计文件、专有知识库或 API Key。

---
*Design baseline: 2026-11-12 · v1.0 · 内容维护以提交记录为准。*
