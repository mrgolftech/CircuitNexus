# CircuitNexus × DeepSeek Harness｜产品集成方案

## 1. 原则
在官方 DeepSeek Harness 开源仓库基础上 Fork。保留 Agent/核心运行时，新增独立 CircuitNexus 品牌、主题、硬件插件、Skill、知识库与工具目录。**低侵入，可合并上游版本**。

```text
CircuitNexus Desktop
├── Brand & UI：图标、名称、浅/深色 Token、任务侧栏、Welcome SVG
├── Harness Core：模型/上下文/规划/插件管理/会话/权限
├── Hardware Skills：原理图分析/审查/电源树/器件分析/接口设计
├── Hardware Tools：OrCAD PST/KiCad 网表解析器、规则引擎、EDA MCP
└── Knowledge：器件手册、规则来源、设计案例、评审依据
```

## 2. 建议源树（独立代码仓库或 Fork 中的目录）
```text
hardbuddy/ 或 circuitnexus/
  branding/
  plugins/circuitnexus-theme/
  plugins/circuitnexus-ui/
  plugins/circuitnexus-tools/
  skills/schematic-review/
  skills/power-tree-analysis/
  skills/component-analysis/
  knowledge/
  tools/netlist-parser/
  tools/rule-engine/
  tests/
```
**注意：** 上述是提议路径，不是官方 DSH 已验证目录名。实际接入应依据固定的上游 Commit 与可用插件/Skill 注册接口。

## 3. 推荐集成次序
1. 锁定 DSH 上游 Commit，能完整开发启动、测试打包与卸载；
2. 更换应用 Logo、名称、桌面应用标识、安装器元数据，隔离 DSH 用户数据目录；
3. 集成两套主题插件，验证主题 Token、欢迎页、会话/代码/表格；
4. 将硬件 Skill 随安装包预置和启动注册，避免用户手工部署；
5. 将 Python 网表解析与规则引擎以 CLI / 本地受控服务集成；
6. 可选检测 KiCad 与 MCP 依赖，未安装时不影响基础检查；
7. 打通上传样例 → 解析 → 查询 → 审查 → 报告 → 回归验证的闭环；
8. 构建 Windows x64 测试安装包，在无开发环境的新机器验收。

## 4. 首装与插件恢复
- 无须用户另装 Node/npm/pnpm/编译工具便可运行已内置模块；
- 模型 API Key 由用户配置，不随包分发；
- 自定义插件异常时可启动安全模式并禁用第三方扩展；
- 独立更新/签名/卸载及数据保留策略；
- 区分“离线安装”与“完全离线模型运行”。

## 5. 工程检查与安全
- 不允许 Agent 绕过专业校验输出“已验证通过”；
- 每个自动化结论附工具版本、网络/器件证据与验证状态；
- 工具调用遵循最小权限和工作目录隔离；
- 原始硬件工程/专用规范只在授权环境中使用。

## 6. 验收指标
- 网表解析成功率和网络连接一致性；
- 规则覆盖率/误报率/漏报率；
- 生成原理图可导入/可 ERC 的比例；
- 工具调用成功率、P95 时延、错误恢复与跨版本升级测试；
- 实际工程任务端到端可交付率。

## 7. 法律及品牌边界
遵守 DSH 官方许可证以及依赖/字体/图标第三方许可证要求；自有品牌不能暗示 DeepSeek 官方授权。公开仓库不提交第三方未经许可内容。
