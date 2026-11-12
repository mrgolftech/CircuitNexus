# UI 原型交接与实现清单

设计视觉：`docs/UI_VISUAL_SPEC_V1.md`

## 开发实现

1. 左上角 HardBuddy 旧标识 → 新 SVG C + CircuitNexus 字标。
2. 欢迎主标题 → **开启智能硬件研发工作流**。
3. 欢迎副标题 → **CircuitNexus · AI 硬件研发工作台**。
4. Dark / Light 使用 `assets/tokens/circuitnexus-theme-tokens.css` 与现有 PCB SVG。
5. 关闭右下角原型配色说明面板（仅在设计开发工具中使用）。
6. 侧栏和输入框功能保留；切主题不影响数据、权限、工具行为。
7. 组件状态需兼容 hover, active, focus, disabled, loading, error。
8. 修复各窗口尺寸下的标题、输入框及 PCB 线路布局。
9. 任务成功报告应保留可复核来源、验证状态，不能让 UI 隐藏风险。

## 交付验收

- 桌面端：Dark/Light 一一对比 [原型图](../assets/ui/prototypes/)；导航、输入、浮层、插件、工作区、对话内容均检查；
- 主题：文字/图标/按钮对比度、键盘可操作性、动画降级策略；
- 品牌：SVG 图形在 16/24/32px 不粘连，字标比例与既定设计一致；
- 首页不显示“主题配色建议”浮层；
- 对角拼图仅用于官网/营销物料，不作为真实的双色混合主题。

验收完成后将实际应用截图和测试信息更新到 `docs/STATUS.md`。
