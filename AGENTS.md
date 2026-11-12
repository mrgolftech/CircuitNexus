# CircuitNexus Agent / 开发协作约束

> 本仓库是 CircuitNexus（电路智枢）品牌、产品定位与设计语言的事实来源。先阅读 `README.md`、`docs/PRODUCT_VISION.md`、`docs/BRAND_IDENTITY.md`、`docs/UI_GUIDELINES.md`。

## 不得擅自改变的已定稿内容
- 正式产品名：**CircuitNexus｜电路智枢**；不再使用 HardBuddy 作为面向用户的名称。
- 定位：**AI 硬件研发工作台**，不是通用聊天工具。
- 品牌主题：**Precision Black & Gold**；主界面为 **Dark 石墨黑金** 和 **Light 暖白香槟金**。
- Logo：开放几何 C + 3 条等宽 PCB 线路 + 3 个环形焊盘。走线仅水平和 ±45°，不得改变现有整体比例、角度与路径顺序，不得制作粗细不一致的内部线。
- 背景：欢迎页四角 PCB SVG 纹理、中央留白；长文本/代码/网表报告页淡化或关闭。
- Token 以 `assets/tokens/` 为准，颜色不能在组件里随意硬编码或复制两套相互矛盾的规范。

## 产品工程准则
- 以开源 DSH 为基座进行低侵入集成；Skill/MCP/工具/知识库与主题独立模块化；
- Agent 负责理解、计划、调度、解释与复查；确定性检查由程序/EDA 工具执行；
- 硬件工程结论必须尽可能附连接证据、器件参数、手册/规则来源和验证状态；
- 任何能力输出都要标注“已实现/实验验证/规划”，不得用模型文字等同工程验证；
- 软件安全：最小权限、输入隔离、插件安全模式、离线部署可选、Windows/Linux 兼容。
- 不在公共代码仓库存储真实客户原理图、专有报告、敏感规则库、访问密钥。

## 修改工作流
1. 检查相关 `docs/` 和 `assets/` 是否已有权威版本；
2. 以源 SVG/Token 为修改源，不手工替换单独 PNG；
3. 一并更新 Dark/Light 的状态、Hover/Focus、背景与可读性测试；
4. 通过 `python tools/export_assets.py` 重新导出 PNG/ICO（需要 Pillow、CairoSVG）；
5. 更新 `docs/DECISIONS.md`（设计决策变化）与 `docs/STATUS.md`（验收状态变化）；
6. 提交前检查 Windows 小图标尺寸、中文字体、两个主题及响应式。

## 验收红线
- 正文对比度目标 ≥4.5:1；金色小字在 Light 主题使用 `#805C1E` 而不是 `#C79A3B`；
- 单屏通常只有一个主 CTA；品牌金不能代替工程告警色；
- 背景装饰不可挡住输入框、原理图、代码和表格；
- 任何 UI 改动不得改变工具结果的电气工程含义；
- PNG/ICO 只能由 SVG 同源导出，保留 16/24/32px 观感检查。

## 项目进度
按 [产品路线图](docs/ROADMAP.md) 推进。先构建有可复现验收的 HardBuddy 遗留能力到 CircuitNexus 的迁移流程，不从零改写已有验证程序。不得在缺少测试记录时将路线图项目宣称“完成”。
