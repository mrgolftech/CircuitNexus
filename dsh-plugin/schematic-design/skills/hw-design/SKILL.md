---
name: hw-design
description: "从设计需求与参考资料出发做原理图辅助设计时使用，覆盖四个阶段：需求分析、器件选型、KiCad 原理图符号库建库与原理图生成。本 Skill 只定义方法、证据门槛与判定标准（方法/证据规范），不直接执行进程、不读取工程文件、不调用 KiCad MCP；具体工具调用由会话 Agent 通过 KiCad MCP 完成。不适用于 PCB 布局布线、封装设计或仿真。"
---

# hw-design · 原理图辅助设计方法与证据规范

面向有多年经验的硬件工程师。本 Skill 是**方法与判定标准**：它规定每个阶段要产出什么、每条结论要挂什么证据、什么情况下必须停下问人。它**不是执行脚本**——不启动进程、不解析工程文件、不直接调用 KiCad MCP。所有 `kicad__*` 工具调用、文件读写与确认门，均由执行本 Skill 的会话 Agent 通过 KiCad MCP 完成，并受该 Agent 的审批策略、已启用 MCP 与已安装 Skill 约束。

## 0. 定位与边界

- **只做原理图层面**：需求分析、器件选型、原理图符号库（`.kicad_sym`）、原理图（`.kicad_sch`）、网表与 ERC。
- **明确不做**：PCB 布局布线、封装焊盘设计（`.kicad_mod` / `.pretty`）、SI/PI 仿真、热仿真、叠层与 EMC 物理检查。遇到这类诉求，标注「超出本 Skill 范围」，不自行推断补答案。
- 术语澄清：需求或口语里的「**原理图封装库**」在 KiCad 语境下按 **`.kicad_sym` 原理图符号库**（逻辑符号与引脚电气类型）理解，**不是** PCB 的 `.kicad_mod` / `.pretty` 封装库；二者不得混用。
- 符号的 `footprint` 属性**只能引用已存在的封装库条目**；找不到对应条目就标注「待确认」，**不得编造封装名**。设计/新建 PCB 封装库（焊盘几何、`.kicad_mod`）不在本 Skill 范围。
- 生成结果**必须**经人工复核与 ERC 签核后才算可用；工具生成的符号 pin map 仍需与数据手册逐脚核对。

### 事实优先级（冲突处理）

```
用户原始需求与参考资料
  > 数据手册（型号 + 页码 + 修订版本）
    > KiCad 官方库 / 厂商库
      > 命名约定
        > 经验推断
```

- 高优先级覆盖低优先级；**同层或跨层出现冲突时，记录冲突本身及双方出处，不擅自取舍**，列为「未决问题」交人工裁决。
- 注意：本优先级是**设计态**的（此时尚无网表）。不得套用审查态的「网表 > BOM」优先级；设计中若用户提供了参考设计的网表/BOM，它属于「参考资料」层，仍需与数据手册交叉验证。
- 「经验推断」只能用于提出待验证项，不能作为结论依据。

## 1. 证据与判定总则（适用于全部阶段）

### 1.1 三件套：每个检查项必须同时给出

| 要素 | 内容 |
| --- | --- |
| **判定方式** | `确定性检查` / `辅助判断` / `人工确认` 三选一 |
| **证据引用** | 能追溯到具体出处；参数须带 **型号 + 页码 + 修订版本**；连接须带 **具体 net 与 pin** |
| **结论** | `已证实问题` / `疑似待确认` / `已核对通过` 三选一 |

- `确定性检查`：工具返回值或结构事实可直接判定（如 `list_symbol_pins` 返回的脚号与手册 pin table 逐项比对、`generate_netlist` 的 net→pin 与 `netlist-plan.md` 比对）。
- `辅助判断`：工具只给出结构/候选，需结合手册标称值与工程意图解读（如电流预算是否满足、电平是否兼容）。
- `人工确认`：证据不足、存在冲突、或涉及设计意图取舍，必须由人拍板；结论只能是 `疑似待确认`。

### 1.2 结论三态

- `已证实问题`：有确定证据表明不满足需求/手册/规范。
- `疑似待确认`：证据不足、互相冲突、或依赖未决问题，无法定性。
- `已核对通过`：证据充分且逐项核对一致。

### 1.3 红线

- **禁止把推断写成已验证**；没有手册/工具返回支撑，不得写「已核对通过」。
- **禁止**「基本没问题」「应该可以」「通常如此」这类模糊表述。
- **证据不足就明确写「证据不足」**，并说明缺哪份文件、哪个字段、影响哪个结论；**不得补全成合理故事**。
- 任何器件参数必须能追溯到**型号 + 页码 + 修订版本**；查不到写「证据不足」，不得编造。
- 任何连接关系必须能追溯到**具体 net 与 pin**；不得用推断把连接补成合理故事。
- 「原理图封装库」一律按 `.kicad_sym` 符号库理解，**不是** PCB `.kicad_mod` 封装库；符号的 `footprint` 属性**只能引用已存在的封装库条目**，查不到标「待确认」，**不得编造封装名**；PCB 封装库设计不在本 Skill 范围。
- 工具不可用或未成功返回时，明确写「未执行 / 未生成」及原因，**不得声称已生成**。
- 先给结论，再给依据与风险；主动指出隐患，不迎合用户判断。

### 1.4 参数出处格式

`MPN <型号> / <厂商> / Datasheet Rev.<修订版本> / p.<页码> / <章节或表号>`
例：`TPS54302DDCR / TI / Rev. C / p.6 / Pin Functions`。修订版本缺失时写 `Rev. 未提供（证据不足）`，不得省略该字段。

## 2. 四阶段总览

| 阶段 | 名称 | 手段 | 主要产物 |
| --- | --- | --- | --- |
| 1 | 需求分析 | 本 Skill「阶段 1」 | `design/requirements.md` |
| 2 | 器件选型 | 本 Skill「阶段 2」 | `design/selection.csv`、`design/selection.md` |
| 3 | 原理图符号库建库 | KiCad MCP 复用/新建符号 | `<项目名>.kicad_sym`、`design/symbol-plan.md` |
| 4 | 原理图生成与验证 | KiCad MCP 建工程→连线→标注→验证→导出 | `<项目名>.kicad_sch`、`design/netlist-plan.md`、ERC 报告、导出预览 |

阶段 1、2 不调用 KiCad MCP，产物为 `design/` 下的文档；阶段 3、4 才进入 `.kicad_*` 写盘。按勾选范围执行，未勾选的阶段不做、也不为其输出完成标记。

## 3. 阶段 1 · 需求分析

对设计需求原文**逐条**分解，不改写用户原文；原文引用时加 `> ` 前缀。

必须覆盖：

1. **功能分解**：把需求拆成可验证的功能块（输入→处理→输出），每块标注对应需求原文。
2. **电源轨与电流预算**：列出每条电源轨（标称电压、容差、来源、负载清单、各负载电流与合计、裕量）。无数据的负载写「电流未知（证据不足）」，**不得擅自假定典型值**。
3. **接口与电平**：每个外部/内部接口的信号、电平标准、方向、速率、连接器与引脚数。
4. **时钟/复位**：时钟源、频率、精度、分配；复位源、阈值、时序、上电/掉电行为。
5. **环境与约束**：温度范围、供电范围、认证/安规、尺寸、成本、可制造性、供货周期等（来自需求或参考资料）。
6. **验收标准**：可测量、可判定的验收项与判定方法，作为阶段 4 ERC/网表核对的对照基线。
7. **未决问题清单**：逐条列出「问题 / 缺哪份输入 / 影响哪个阶段哪个结论 / 需谁确认」。

- **产物**：`design/requirements.md`。
- **缺失信息一律进「未决问题清单」，不得擅自假定**；假定值不得进入后续阶段作为依据。
- 每项给出三件套；缺输入的项结论为 `疑似待确认`。

## 4. 阶段 2 · 器件选型

每个器件一行，字段固定：

`位号 / 功能 / 候选型号 / 厂商 / MPN / 关键参数与出处 / 封装 / 供货与替代 / 风险 / 结论`

- **原则上给两个以上候选**，并给出比较口径；只有一个候选时，必须写明「唯一性理由」（如封装/认证/软件生态/供货锁定）及其出处。
- **禁止用「常用型号」「行业通用」「大厂料」当证据**；每个关键参数挂 `MPN + 页码 + 修订版本`。
- `供货与替代`：标注可替代型号及差异（引脚兼容/需改板），差异无手册证据时写「证据不足」。
- `风险`：如降额、温漂、生命周期（NRND/EOL）、单一来源、参数边界。
- **必须单列说明**：哪些器件的**引脚定义已有手册证据**（给出 pin table 出处），哪些**证据不足**。证据不足的器件，其符号 pin map 在阶段 3 只能列为「待人工确认」，不得据经验补全。
- **产物**：`design/selection.csv`（机器可读，表头即上述字段）与 `design/selection.md`（候选比较、唯一性理由、风险与未决问题）。
- `selection.csv` 的「结论」列同样只用三态；证据不足的候选写 `疑似待确认`。

## 5. 阶段 3 · 原理图符号库建库规格

目标：为选型中每个器件确定一个**引脚定义可追溯**的逻辑符号。

### 5.1 先复用，缺失才新建

复用链：`kicad__list_symbol_libraries` / `search_symbols` / `get_symbol_info` / `list_symbol_pins`（可补 `list_library_symbols` 枚举某库内符号）。只有确认官方库/厂商库中**没有**匹配符号、或匹配符号的 pin table 与手册不一致时，才 `create_symbol`。

- 复用必须核对：`list_symbol_pins` 返回的脚号/脚名/电气类型与手册 pin table **逐脚一致**；不一致则不得直接复用。
- 复用来源、库名、符号名、核对结论写入 `symbol-plan.md`。

### 5.2 新建符号的硬约束

- `create_symbol` 的 `pins` 数组，每个元素的 `number` / `name` / `type` / `at` **必须与数据手册 pin table 逐脚一致**，并在 `symbol-plan.md` 的 pin map 对照表里逐行给出手册出处（型号 + 页码 + 修订版本 + 表号）。
- `type`（电气类型）依据手册引脚功能选定，不得为省事统一填 `passive`；隐藏电源脚用 `power_in`。
- 处理三类易错项：
  - **隐藏电源脚**：脚号/脚名/电气类型照手册填写；符号隐藏不等于电气上已连接——在阶段 4 需确认其通过电源符号/全局标签接到正确电源轨并加 PWR_FLAG，否则 ERC 会报「电源输入未驱动」。
  - **NC 脚**：区分「手册标注 NC（不得连接）」与「本设计主动悬空」。前者符号脚类型按手册处理，后者在原理图侧用 `batch_add_no_connects`（SPEC §2）标记；两者不得混淆。若确需单脚 no-connect 工具，先按 §9 用 `mcp__magpie__find_tools` 查询其参数，不臆造工具名。
  - **复用多单元器件**（双/四运放、多门逻辑等）：声明各 unit 及公共电源 unit；pin map 标明每个引脚属于哪个 unit、公共脚在各 unit 的重复脚号；位号形如 `U1A/U1B`，电源 unit 的脚号不得遗漏。
- `create_symbol` 之后**必须**先 `validate_symbol_library`，通过后 `register_symbol_library`，且 `scope=project`、`projectPath` 指向工程目录（写入工程旁的 `sym-lib-table`）。顺序不得颠倒；`validate_symbol_library` 未通过不得注册。
- **符号 `footprint` 属性**：`create_symbol` 的 `footprint` 参数只是**对已存在封装库条目的引用**（如 `Package_SO:SOIC-8_3.9x4.9mm_P1.27mm`）。填之前必须确认该封装库条目在本机**确实存在**；查不到或不确定就**留空并在 `symbol-plan.md` 标「待确认」**，**不得编造封装名**（不臆造库名或封装名凑格式）。本 Skill **不设计、不新建 PCB 封装库**（`.kicad_mod` / `.pretty`、焊盘几何），这属于 PCB 封装库设计，超出范围。
- 明确：产物是 `.kicad_sym` 原理图符号库，**不是** PCB 封装库；需求里说的「原理图封装库」也按 `.kicad_sym` 理解。

### 5.3 产物

`design/symbol-plan.md`，包含：符号清单（位号↔符号名↔库）、来源（复用/新建及出处）、**pin map 对照表**（手册 pin table ↔ 符号 `number/name/type/at`，逐行给出型号+页码+修订版本）、**`footprint` 引用核对**（每个符号引用的封装库条目是否已确认存在；查不到标「待确认」，不编造）、手册出处汇总、**待人工确认项**。凡证据不足、存在冲突的引脚或无法确认的封装引用，一律进「待人工确认项」，结论 `疑似待确认`。

## 6. 阶段 4 · 原理图生成规格

### 6.1 先落连接计划，再动原理图

写 `design/netlist-plan.md`：`net → pin 清单`，逐条给出 `net 名 / 连接的所有 <位号>.<脚号> / 依据（需求条目或手册页码）`。**每条连接都要能追溯到具体 net 与 pin**。阶段 1 的电源轨与接口、阶段 2 的引脚定义是它的输入；证据不足的连接标注「证据不足」，不得补成合理故事。

### 6.2 建工程与放置

`create_project` → `create_schematic` → `add_schematic_component`（或 `batch_add_components`）。放置的符号必须来自阶段 3 已核对的库。

### 6.3 连线

按 `netlist-plan.md` 用 `add_schematic_wire` / `add_schematic_net_label` / `connect_to_net` / `batch_connect` / `batch_add_no_connects` 落实每条 net；NC 脚显式加 no-connect 标记。连完后 `netlist-plan.md` 中每条连接都应能在原理图里找到对应 pin。

### 6.4 标注与属性

`annotate_schematic` 分配位号；`set_schematic_component_property` 为每个器件写入 `MPN` / `Manufacturer` / `Datasheet`，取值来自 `selection.csv`，不得臆造。

### 6.5 验证链（按顺序）

`validate_schematic` / `list_schematic_components` / `list_schematic_nets` / `list_floating_labels` / `find_orphaned_wires` / `lint_offgrid` / `run_erc` / `generate_netlist`。

- 用 `list_schematic_nets` 与 `generate_netlist` 的结果逐条回对 `netlist-plan.md`：差异项给三件套。
- **ERC 每条告警必须分类**并给出「依据」或「豁免理由」：可作为 `已证实问题`（有确定证据且需改图）/ `疑似待确认`（证据不足或依赖设计意图）/ `已核对通过`（有豁免依据，如已加 PWR_FLAG、该悬空为设计意图并已加 no-connect）。**不得整体写「ERC 通过」而忽略告警**。
- `lint_offgrid` / `find_orphaned_wires` / `list_floating_labels` 的每一条命中同样逐条分类。

### 6.6 导出预览

最后 `export_schematic_pdf` / `export_schematic_svg` / `get_schematic_view` 导出预览，并在报告里给出**实际文件路径**。这些工具依赖 `kicad-cli`；**工具不可用或未返回成功时，明确写「未执行 / 未生成」及原因，不得声称已导出**。

## 7. 确认门、写盘约束与阶段标记

- **写盘前列出将创建/修改的全部路径**（`.kicad_*`、`sym-lib-table`、`design/*`、导出预览），交人工确认。
- **不得覆盖用户已有工程文件**：目标目录已存在 `.kicad_pro` / `.kicad_sch` / `.kicad_sym` / `sym-lib-table` 时，先停下报告，不擅自覆盖或改名。
- **确认门**：阶段 1、2 的文档产出后暂停，经人工确认再进入阶段 3、4 的 `.kicad_*` 写盘；暂停期间不创建、不修改任何 `.kicad_*` 文件。（若会话指令关闭确认门，则连续执行，但仍须遵守写盘前路径清单与不覆盖约束。）
- **阶段完成标记**：每完成一个阶段，在**回复正文里单独一行**输出 `[阶段N 完成]`（N=1..4），供面板跟踪。**未完成的阶段不得输出该标记**；引用/复述指令时也不得输出该标记。标记必须对应真实完成的阶段，不得为凑进度提前输出。

## 8. 报告格式

1. **先结论**：本阶段/本次设计的总体判定（三态之一）与是否可进入下一阶段。
2. **依据**：按三件套逐项列出（判定方式 / 证据引用 / 结论），参数带型号+页码+修订版本，连接带 net 与 pin。
3. **风险与隐患**：主动列出未决问题、证据不足项、冲突项、单一来源、ERC 未豁免告警、导出缺失等；不迎合用户判断，明确写出可能出错的地方。
4. **产物清单**：实际生成的文件路径；未生成的明确写「未生成」及原因。
5. **待人工确认项**：汇总需人拍板的条目。

## 9. 工具映射表（四阶段 ↔ `kicad__*`）

下表的工具名来自 `SPEC.md` 第 2 节；SPEC 用裸名简写，**实际可调用的 MCP 名为 `kicad__<裸名>`**。本 Skill 不规定调用参数。

| 阶段 | `kicad__*` 工具（来自 SPEC.md §2） | 用途 |
| --- | --- | --- |
| 1 需求分析 | 无（本阶段不调用 KiCad MCP；产物 `design/requirements.md`） | 需求分解、电源轨与电流预算、接口电平、时钟复位、约束、验收标准、未决问题清单 |
| 2 器件选型 | 无（本阶段不调用 KiCad MCP；产物 `design/selection.*`） | 候选比较、参数出处、封装/供货/替代、引脚定义证据状态 |
| 3 符号库建库 | `kicad__list_symbol_libraries`、`kicad__search_symbols`、`kicad__get_symbol_info`、`kicad__list_symbol_pins`、`kicad__create_symbol`、`kicad__validate_symbol_library`、`kicad__register_symbol_library` | 复用核对 → 缺失才新建 → 校验 → 注册（`scope=project`，`projectPath` 指向工程） |
| 4 原理图生成与验证 | `kicad__create_project`、`kicad__create_schematic`、`kicad__add_schematic_component`、`kicad__batch_add_components`、`kicad__add_schematic_wire`、`kicad__add_schematic_net_label`、`kicad__connect_to_net`、`kicad__batch_connect`、`kicad__batch_add_no_connects`、`kicad__annotate_schematic`、`kicad__set_schematic_component_property`、`kicad__validate_schematic`、`kicad__list_schematic_components`、`kicad__list_schematic_nets`、`kicad__list_floating_labels`、`kicad__find_orphaned_wires`、`kicad__lint_offgrid`、`kicad__run_erc`、`kicad__generate_netlist`、`kicad__export_schematic_pdf`、`kicad__export_schematic_svg`、`kicad__get_schematic_view` | 建工程 → 放器件 → 连线 → 标注/属性 → 验证链 → 导出预览 |

- **不发明不存在的工具**：表中只用 SPEC.md §2 列出的工具；阶段 3 叙述里出现的 `list_library_symbols` 等 SPEC §2 之外的补充工具，以及**任何工具的具体参数**，一律**先用 `mcp__magpie__find_tools` 查询其参数**再调用，**不得编造参数**。
- 工具行为以 MCP 实际返回的 schema 为准；返回失败即按「未执行 / 未生成」记录，不推测成功。

## 10. 职责边界

- **Skill 只定义方法、证据门槛、三件套/三态与报告标准**。
- **具体工具调用由会话 Agent 通过 KiCad MCP 完成**；Agent 负责文件清点、确认门、写盘前路径清单、阶段标记与报告。
- 面板/指令只规定范围与输入，不解析工程文件、不判定电气正确性。
- 勾选的阶段是「执行范围」，不是「已完成的检查」；进度来自会话中真实输出的 `[阶段N 完成]` 标记，不是估算。
