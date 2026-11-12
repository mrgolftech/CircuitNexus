# CircuitNexus 官网 Landing Page 设计说明

## 目标
10 秒内让第一次访问的硬件工程师看懂：这是**面向硬件研发任务的 AI 工作台**，而不是通用聊天机器人，也不是某个 EDA 的皮肤。

## 建议页面信息架构
1. **Hero**：横排 CircuitNexus Logo、简洁主标题、AI 硬件研发工作台副标题、产品工作台截图或 30s 演示入口；
2. **核心能力**：原理图设计、网表解析、电路评审、电源树、器件分析、PCB/SI、知识库与 EDA 连接；
3. **工作闭环**：导入需求/数据手册/网表 → Agent 调工具 → 校验 → 报告；
4. **真实示例**：选择已有可公开样例，展示可审计输入、过程与输出；
5. **工具兼容**：OrCAD/KiCad/其他格式的“已支持/实验/规划”标识；
6. **安全与部署**：本地处理优先、可配置模型、权限控制（以真实实现为准）；
7. **下载与文档**：Windows 下载、安装说明、版本日志、许可来源；
8. **社区**：GitHub、问题反馈、后续路线。

## 视觉建议
- 首页默认 Dark 黑金，提供 Light 暖白金切换；
- 主要 CTA 每屏一个：如“下载 Windows 体验版”——未发布之前改为“查看项目进度”；
- 左文右图或中轴布局均可，但主标题/CTA 必须落在无纹理区；
- Hero 背景来自 `assets/brand/website/hero-background-dark.svg` 和 `-light.svg`；
- 官网页眉使用完整版 Logo SVG；Favicon 使用简化 SVG；
- 卡片/代码区遵守桌面 Token 的语义体系，不要网站另发明电蓝主配色。

## 品牌文案（推荐）
- 主标题：**让硬件研发真正进入 AI Agent 时代**
- 副标题：**从电路理解、网表解析到智能评审与可验证交付，CircuitNexus 将专业知识和工程工具汇入同一工作台。**
- 英文简写：**AI Hardware Engineering Workspace**
- 功能描述应根据真实开发状态使用“支持 / 正在验证 / 规划”，不能营销化夸大。

## 网站资源
- `assets/brand/logo/*.svg`（品牌）
- `assets/brand/website/hero-background-*.svg`（首屏）
- `assets/brand/app-icons/favicon.svg`（浏览器）
- `assets/themes/pcb/*.svg`（内部工作台背景，官网使用需控制对比度）
- `assets/tokens/*.css`（全局语义 Token）

## 体验与技术约束
响应式最小宽度下Logo不得截断；移动端 Hero 装饰可隐藏；图片要提供 alt；减少动态效果设置应生效；必要文本对比度符合可访问性目标；网站性能预算和动画应由真实 Lighthouse 数据验证。
