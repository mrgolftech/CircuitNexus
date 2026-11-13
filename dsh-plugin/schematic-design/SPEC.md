# 原理图设计插件 — 实现契约（内部文档）

本文件是 `原理图设计`（schematic-design）插件的开发契约，供 UI 与 Skill 两侧共同遵守。
界面以 `../hardware-review-plugin/client.js`（原理图审查）为样板：相同的主题 token、
相同的 header / tab / card / 步骤编号 / 按钮 / 徽标 / 任务管理 / 说明页结构，
仅把内容换成「需求 → 参考资料 → 阶段 → 派发」的设计流程。

> 用户原话「界面和原理图辅助设计保持一致」在本机没有对应的既有插件
> （已检索 workspace、`~/.dsh/profiles`、`~/.dsh/skills`、
> `Desktop/hardwarecheck/dsh-plugins`、app.asar，均无此名称）。
> 因此按「与原理图审查插件的界面保持一致，同时界面元素服务于原理图辅助设计流程」实现。

## 1. 身份

| 项 | 值 |
| --- | --- |
| 包名 | `@local/dsh-plugin-schematic-design` |
| bundle patch id | `schematic-design` |
| 目录 | `schematic-design-plugin/` |
| 面板 id / main key | `schematic-design` |
| 侧栏 label / order | `原理图设计` / `31` |
| 面板标题 / 副标题 | `原理图设计` / `KiCad 辅助设计工作台` |
| 选项卡 | `新建任务` / `任务管理` / `说明`（与审查插件同名） |
| localStorage key | `dsh.schematic-design.tasks.v1` |
| Skill | `hw-design`（可由界面覆盖） |

## 2. 设计流程（四阶段）

| 阶段 | 名称 | 手段 | 主要产物 |
| --- | --- | --- | --- |
| 1 | 需求分析 | 加载 `hw-design` Skill 的「阶段 1 需求分析」 | `design/requirements.md` |
| 2 | 器件选型 | 加载 `hw-design` Skill 的「阶段 2 器件选型」 | `design/selection.csv`、`design/selection.md` |
| 3 | 原理图符号库建库 | KiCad MCP：`list_symbol_libraries` / `search_symbols` / `get_symbol_info` / `list_symbol_pins` → 复用；否则 `create_symbol` → `validate_symbol_library` → `register_symbol_library` | `<项目名>.kicad_sym`、`design/symbol-plan.md` |
| 4 | 原理图生成与验证 | KiCad MCP：`create_project` / `create_schematic` / `add_schematic_component`（或 `batch_add_components`）→ `add_schematic_wire` / `add_schematic_net_label` / `connect_to_net` / `batch_connect` / `batch_add_no_connects` → `annotate_schematic` → `set_schematic_component_property` → `validate_schematic` / `list_schematic_components` / `list_schematic_nets` / `list_floating_labels` / `find_orphaned_wires` / `lint_offgrid` / `run_erc` / `generate_netlist` → `export_schematic_pdf` / `export_schematic_svg` / `get_schematic_view` | `<项目名>.kicad_sch`、`design/netlist-plan.md`、ERC 报告、导出预览 |

面板本身**不调用** Skill / KiCad，也不解析工程文件；它只负责把范围与输入写成一条指令，
派发给新会话的 Agent。方法与判定标准来自 Skill，工具调用由 Agent 通过 MCP 完成。

## 3. 输入字段

| 字段 | 控件 | 默认 | 说明 |
| --- | --- | --- | --- |
| 工程目录 | 目录选择 + 路径输入 | 空 | 输出目录 / 工作区路径 |
| 项目名称 | 文本输入 | 空 | 用于 `.kicad_pro` / `.kicad_sch` / `.kicad_sym` 命名 |
| 设计需求 | 多行文本域 | 空 | 用户原文，指令中原样引用，不改写 |
| 参考资料 | 路径列表（可增删，可追加目录） | 空 | 手册 / 需求文档 / 参考设计目录 |
| 符号库文件名 | 文本 | `<项目名>.kicad_sym` | 相对工程目录 |
| 原理图文件名 | 文本 | `<项目名>.kicad_sch` | 相对工程目录 |
| Skill 名称 | 文本 | `hw-design` | 允许覆盖为其他已安装 Skill |
| 阶段勾选 | 4 个复选框 | 全选 | 只执行勾选的阶段 |
| 写入前确认门 | 复选框 | 勾选 | 阶段 1、2 产出后暂停，确认后才写 `.kicad_*` |
| 导出预览 | 复选框 | 勾选 | 生成 PDF / SVG；工具不可用则明确说明未导出 |

## 4. 指令文本模板（`designInstruction(plan)`）

必须逐字包含下列结构（`<...>` 为运行时替换）：

```
第一步：先只做输入清点，不要开始设计。

目标目录（输出 / 工作区）：<dir>
项目名称：<projectName>

请列出该目录及其子目录中的文件，并逐项告诉我是否找到：
  - 需求文档（.md / .txt / .pdf / .docx）
  - 参考资料与关键器件数据手册
  - 已有 KiCad 工程（.kicad_pro / .kicad_sch / .kicad_sym / sym-lib-table）
  - 现有 BOM 或参考设计
每项写「找到 <文件名>」或「未找到」，并说明在哪个子目录。
明确指出哪些输入缺失、会导致哪个阶段无法验证。

清点完成后停下来，等我确认再继续。

---

我确认后，按下面范围执行设计。
本次是原理图辅助设计任务，不是原理图评审：不要套用评审态的「网表 > BOM」事实优先级
或检查项清单口径；按 <skillName> Skill 的设计态规则执行。
先加载 <skillName> Skill，遵循它的阶段划分、证据门槛与报告规范；
方法与判定标准以 Skill 为准，本指令只规定范围与输入。

【设计需求（用户原文，不得改写）】
> <requirement 每行前缀 "> "；为空时写「（未提供）」>

【参考资料路径】
<每条 "- <path>"；为空时写「（未提供）」>

【输出约定】
- 工程目录：<dir>
- 项目名称：<projectName>
- 符号库：<dir>/<libName>
- 原理图：<dir>/<schName>
- 中间产物目录：<dir>/design/

【执行阶段（按顺序，只执行下列勾选的阶段）】
<对每个勾选阶段输出一行："阶段 N · <名称> → <手段与工具> → <产物>"；
 对未勾选阶段输出："阶段 N · <名称>：本次不执行">

【阶段完成标记】
每完成一个阶段，在回复中单独一行输出 [阶段N 完成]（N 为 1..4 的阶段号），
面板据此跟踪进度。不要为未完成的阶段输出该标记，也不要在引用本指令时输出。

【确认门】
<勾选> 阶段 1、2 的文档产出后暂停，等我确认再进入 KiCad 写盘阶段（3、4）；
        暂停期间不要创建或修改任何 .kicad_* 文件。
<未勾选> 连续执行全部勾选阶段，中途不要等待确认。

【证据与红线】
- 任何器件参数必须能追溯到数据手册的型号、页码与修订版本；查不到就写「证据不足」，不得编造。
- 任何连接关系必须能追溯到具体 net 与 pin；不得用推断补成合理故事。
- 每个结论给出三样东西：判定方式（确定性检查 / 辅助判断 / 人工确认）、证据引用、结论。
- 结论只有三种：已证实问题 / 疑似待确认 / 已核对通过。禁止把推断写成已验证；
  禁止「基本没问题」这类模糊表述。
- 写盘前先列出将创建 / 修改的路径；不得覆盖用户已有工程文件。
- 「原理图封装库」按 KiCad 的 .kicad_sym 符号库理解；符号的 footprint 属性只能引用
  已存在的封装库条目，找不到就标注「待确认」，不得编造封装名，也不把 PCB 封装库设计
  混入本流程。
- KiCad MCP 工具不可用或未成功返回时，明确说明未执行 / 未生成，不得声称已生成。
- 先给结论，再给依据与风险；主动指出隐患。

【导出】
<勾选> 最后调用 kicad 的 export_schematic_pdf / export_schematic_svg（或 get_schematic_view）
       输出预览，并在报告里给出实际文件路径。
<未勾选> 本次不导出预览文件。
```

## 5. 启动流程（`startDesign(ctx, plan)`）

与审查插件的 `startReview` 逐行对齐：

1. `ctx.get('workspaces').create({ path: plan.dir })` → `view.workspaceId`
2. `ctx.get('sessions').create({ workspaceId })` → `sessionId`
3. `ctx.get('uiWorkspace').openSession(sessionId)`（尽力而为）
4. `dispatchToAgent(ctx, sessionId, text)`：`sessions.retain(sessionId, { source: 'controllerOperation' })`
   → `reference.ready`（6s 超时）→ `binding.session.prompt([{ type:'text', text }], 'queue')`
   → 释放引用。返回 `true` 表示 `delivery = 'agent'`。
5. 失败或接口缺失 → `uiWorkspace.startSession(workspaceId, { prompt: text, whenDraftExists:'replace' })`
   → `delivery = 'draft'`；再失败 → `uiWorkspace.connectWorkspace(workspaceId)`，`delivery = 'none'`。
6. 返回 `{ sessionId, workspaceId, text, delivery, warning }`。

任务记录字段：
`{ id, dir, projectName, requirement, refs, libName, schName, skillName,
   phases:[1..4], confirmGate, exportOutputs, workspaceId, sessionId,
   delivery, warning, createdAt }`

`warning` 记录启动时的降级原因，任务详情中可回看；空字符串表示无降级。

## 6. 进度跟踪（`summarize(entries, wanted)`）

- `wanted` 是启动时勾选的阶段号数组；为空返回 `{ detected:false }`。
- `user/message` 中出现 `设计需求` 或 `执行阶段` → `instructionSeen = true`（仅用于诊断）。
- `assistant/message` 文本中匹配 `/\[阶段\s*([1-4])\s*完成\]/g`，命中且属于 `wanted` 才计入 `done`。
  只统计 assistant 文本，指令自身不计数。
- `tool/call` 计数：名称含 `skill` → `skillCalls`；名称含 `kicad` 或参数含 `kicad__` → `kicadCalls`；
  `bash` / `pwsh` / `ops_bash` / `terminal_open` → `calls`。
- `turn/start` / `step/start` → `running = true`；`turn/end` → `running = false`。
- 返回 `{ detected, done, total, calls, skillCalls, kicadCalls, complete, phase, instructionSeen }`。
- `useDesignProgress(sessionId, wanted)` 复用审查插件的 `sessions.retain` +
  `binding.eventSource.getSnapshot()/subscribe()` 模式，卸载时取消订阅并 `release()`。

面板 UI 文案必须如实：进度是「阶段 N / M 已报告」，不是「设计完成率」；
阶段标记未出现时显示「尚未在该会话中检测到阶段完成标记」。

## 7. 边界（写进「说明」页）

- 面板不执行进程、不读取工程文件、不直接调用 Skill 或 KiCad MCP。
- 真正执行由新会话的 Agent 承担，受其审批策略、已启用 MCP、已安装 Skill 约束。
- 阶段勾选是范围，不是已完成的检查；进度来自会话事件流中的阶段标记，不是估算。
- 只做原理图层面：符号库与原理图；不做 PCB 布局布线、封装焊盘设计、SI/PI 仿真。
- 生成结果必须经人工复核与 ERC 签核；工具生成的符号 pin map 仍需与手册逐脚核对。
- 缺少参考资料 / 数据手册时，Agent 必须标注「证据不足」，不得补全。
