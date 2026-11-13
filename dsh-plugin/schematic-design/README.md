# 原理图设计插件（schematic-design）

面向 DeepSeek Harness 的 **KiCad 原理图辅助设计工作台**面板插件。它把「设计需求 + 参考资料」整理成一条指令，派发给新会话的 Agent，由 Agent 加载 `hw-design` Skill、通过 KiCad MCP 按四个阶段推进原理图设计。

> **先说清楚边界**：这个插件**本身不执行任何设计动作**。它不启动进程、不读取/解析工程文件、不直接调用 Skill 或 KiCad MCP；它只负责「范围与输入」——选工程目录、填需求原文、挂参考资料、勾选阶段、把指令派发给会话里的 Agent，并在「任务管理」里跟踪进度。真正的设计、判定标准与工具调用由 **Skill（方法）+ 会话 Agent（执行）** 承担，并受该 Agent 的审批策略、已启用 MCP、已安装 Skill 约束。

## 插件是什么

- 包名 `@local/dsh-plugin-schematic-design`，bundle patch id `schematic-design`，面板 id / main key `schematic-design`。
- 侧栏 label `原理图设计`（order `31`），面板标题 `原理图设计`、副标题 `KiCad 辅助设计工作台`。
- 三张选项卡：`新建任务` / `任务管理` / `说明`；任务存浏览器本地 `dsh.schematic-design.tasks.v1`。
- 默认 Skill `hw-design`（可在界面覆盖为其他已安装 Skill）。
- 一次设计流程的输入：工程目录、项目名称、设计需求原文、参考资料路径列表、符号库文件名、原理图文件名、阶段勾选（1–4）、写入前确认门、导出预览开关。

## 与原理图审查插件的界面一致性

界面以 `../hardware-review-plugin`（`hw-review`，原理图审查）为样板，**完全复用其视觉与交互结构**，只把内容换成设计流程：

- 相同的主题 token、header / tab / card / 步骤编号 / 按钮 / 徽标风格。
- 相同的三选项卡命名（`新建任务` / `任务管理` / `说明`）、任务管理页与说明页结构。
- 相同的「建工作区 → 建会话 → 派发指令给会话 Agent」启动链路，以及基于会话事件流的进度跟踪。
- 差异只在内容：审查插件是「选网表目录 + 勾检查项」，本插件是「填设计需求 + 挂参考资料 + 勾四阶段」；进度统计的是 `[阶段N 完成]` 标记，不是「设计完成率」。

> 注：用户原话「界面和原理图辅助设计保持一致」在本机没有对应既有插件，SPEC.md 已据此确定「与原理图审查插件界面一致」为基线。

## 目录结构

```
schematic-design-plugin/
├── package.json            # 包名 / exports / dsh.bundle 与 dsh.client 声明
├── cordis.patch.yml        # bundle patch：插入 id: schematic-design
├── index.js                # 插件入口
├── client.js               # Web 面板（新建任务 / 任务管理 / 说明）
├── icon.svg                # 侧栏图标
├── locale/
│   ├── zh.json
│   └── en.json
├── smoke.cjs               # 渲染冒烟测试（加载 client、apply、渲染所有 slot）
├── test-launch.cjs         # 启动行为测试（指令是否派发给会话 Agent）
├── install.ps1             # 一键安装脚本（junction / package.json / Skill 三件事）
├── SPEC.md                 # 实现契约（内部文档）
├── README.md               # 本文件
└── skills/
    └── hw-design/
        └── SKILL.md        # hw-design Skill（方法 / 证据门槛 / 判定标准）
```

`skills/hw-design/SKILL.md` 是随插件分发的 Skill 源；安装时需复制到用户 Skill 目录（见下）。插件运行时产物在工程目录的 `design/` 与 `.kicad_*` 下，**不写回插件目录**。

## 四阶段工作流（文字图）

```
[新建任务] 填需求原文 + 参考资料 + 勾阶段 + 确认门
        │  designInstruction(plan) 生成指令
        ▼
[清点门] 第一步只做输入清点：找需求文档 / 数据手册 / 已有工程 / BOM，缺件报告 → 停下等确认
        │  用户确认
        ▼
┌─────────────────────────────────────────────────────────────┐
│ 阶段 1 需求分析   → design/requirements.md                    │  文档阶段
│ 阶段 2 器件选型   → design/selection.csv / selection.md       │  文档阶段
│        └── [写入前确认门] 阶段 1、2 产出后暂停，确认后才写 .kicad_* │
│ 阶段 3 符号库建库 → <项目名>.kicad_sym / design/symbol-plan.md │  KiCad MCP 写盘
│ 阶段 4 生成与验证 → <项目名>.kicad_sch / design/netlist-plan.md │  + ERC / 导出预览
└─────────────────────────────────────────────────────────────┘
        │  每个阶段完成在回复中单独一行输出 [阶段N 完成]
        ▼
[任务管理] 读会话事件流里的阶段标记，实时显示「阶段 N / M 已报告」
```

- **阶段 1 需求分析**：功能分解、电源轨与电流预算、接口与电平、时钟/复位、环境与约束、验收标准、未决问题清单。缺信息列为未决问题，不擅自假定。
- **阶段 2 器件选型**：位号/功能/候选型号/厂商/MPN/关键参数与出处/封装/供货与替代/风险/结论；原则上两个以上候选；参数带型号+页码+修订版本。
- **阶段 3 原理图符号库建库**：先复用官方库/厂商库，缺失才新建；pins 的 number/name/type/at 与手册 pin table 逐脚一致；`create_symbol` → `validate_symbol_library` → `register_symbol_library`（`scope=project`）。
- **阶段 4 原理图生成与验证**：先落 `net → pin` 计划，再建工程/放器件/连线/标注/写属性，走验证链（`run_erc` 等），最后导出 PDF/SVG 预览。
- 每阶段、每条连接、每个参数都遵循 `hw-design` Skill 的**三件套**（判定方式 / 证据引用 / 结论）与**三态结论**（已证实问题 / 疑似待确认 / 已核对通过）。

## 前置条件

1. **已启用 magpie 的 kicad MCP**：会话 Agent 能用 `kicad__*` 工具（建工程、建符号、连线、ERC、导出）。未启用时工具调用会失败，Agent 必须明确写「未执行 / 未生成」，不得声称已生成。
2. **已安装 `hw-design` Skill**：把本仓库的 `skills/hw-design/SKILL.md` 安装到用户 Skill 目录，Agent 才会按四阶段、证据门槛与报告规范执行。
3. **KiCad 与 `kicad-cli` 可用**：`export_schematic_pdf` / `export_schematic_svg` 等导出依赖 `kicad-cli`；缺失时导出步骤记为「未导出」。
4. **桌面 profile 可写**：安装需要改 `~/.dsh/profiles/desktop/package.json` 并在其 `node_modules/@local` 下建 junction。
5. **术语前提**：本插件/Skill 里的「原理图封装库」指 **KiCad `.kicad_sym` 符号库**，**不是** PCB `.kicad_mod` 封装库。符号的 `footprint` 属性**只能引用已存在的封装库条目**；找不到必须标「待确认」，**不得编造封装名**；**PCB 封装库设计不在本插件 / Skill 范围**。若设计需要新封装，须由人工在 KiCad 封装库中先行建立并确认，Skill 只做引用。

## 安装步骤

> **推荐用一键脚本**：插件目录下的 `install.ps1` 已把下面三件事自动化（幂等、可重复运行、不删除任何东西、不覆盖已存在的 `SKILL.md`），并在末尾打印校验结果。在插件目录执行：
>
> ```powershell
> powershell -ExecutionPolicy Bypass -File .\install.ps1
> ```
>
> 脚本做且只做三件事：① 在 `<profile>/node_modules/@local` 建 junction；② 给 `<profile>/package.json` 加 link 依赖与 `dsh.profile.bundles` 条目（写入前用 `ConvertFrom-Json` 校验 JSON）；③ 把 `skills/hw-design/SKILL.md` 装进共享 Skill 库（真实目录 `.config/magpie/library/skills/hw-design` + `.dsh/skills/hw-design` junction）。它**不配置 kicad MCP**（需在 GUI 的 magpie hub 里启用），也**不覆盖已有工程的 `.kicad_*`**。跑完后刷新 Web GUI 或重启应用。
>
> 下面是脚本所对应的人工步骤，供手工安装或排查用。

以下路径以本机为例（`<user>\...`），按实际用户名与工作区调整。插件目录记为 `<PLUGIN>` = `C:/Users/usbtgw/Documents/deepseek-harness/default-workspace/schematic-design-plugin`。

1. **在 desktop profile 的 `node_modules/@local` 下建 junction**（PowerShell）：

   ```powershell
   $dst = "$env:USERPROFILE\.dsh\profiles\desktop\node_modules\@local\dsh-plugin-schematic-design"
   $src = "<path-to-schematic-design-plugin>"
   New-Item -ItemType Directory -Force "$env:USERPROFILE\.dsh\profiles\desktop\node_modules\@local" | Out-Null
   cmd /c mklink /J "$dst" "$src"
   ```

   junction 名 `dsh-plugin-schematic-design` 对应包名 `@local/dsh-plugin-schematic-design` 的 `@local/` 作用域。

2. **改 `~/.dsh/profiles/desktop/package.json`**：

   - `dependencies` 增加一条 link 依赖：
     ```json
     "@local/dsh-plugin-schematic-design": "link:C:/Users/usbtgw/Documents/deepseek-harness/default-workspace/schematic-design-plugin"
     ```
   - `dsh.profile.bundles` 数组增加条目：
     ```json
     "@local/dsh-plugin-schematic-design"
     ```
   bundle patch（`cordis.patch.yml`）会插入 `id: schematic-design`；bundle 名与包名一致。

3. **安装 `hw-design` Skill 到用户 Skill 目录**：把 `skills/hw-design/SKILL.md` 复制到 `~/.dsh/skills/hw-design/SKILL.md`：

   ```powershell
   $skillDst = "$env:USERPROFILE\.dsh\skills\hw-design"
   New-Item -ItemType Directory -Force $skillDst | Out-Null
   Copy-Item "<PLUGIN>\skills\hw-design\SKILL.md" "$skillDst\SKILL.md" -Force
   ```

   > 注意：本机 `~/.dsh/skills/` 下已有 Skill 都是指向 `~/.config/magpie/library/skills/<name>` 的 junction，Magpie 从该真实目录加载。仅把 `SKILL.md` 复制进 `.dsh/skills/hw-design` 未必被识别。稳妥做法是「真实目录 + junction」两步：
   > ```powershell
   > $lib = "$env:USERPROFILE\.config\magpie\library\skills\hw-design"
   > New-Item -ItemType Directory -Force $lib | Out-Null
   > Copy-Item "<PLUGIN>\skills\hw-design\SKILL.md" "$lib\SKILL.md" -Force
   > cmd /c mklink /J "$env:USERPROFILE\.dsh\skills\hw-design" "$lib"
   > ```
   > `install.ps1` 已按此结构处理，且检测到已有 `SKILL.md` 时不会覆盖。

4. **重启 / 重载 GUI**：新增 bundle 需要 Host 重新组合 profile 的 cordis 树并重建 client bundle。本机未运行 `pnpm run dev:web` 监听，client-plugin HMR 不会自动重载，因此**仅刷新页面不一定生效**；稳妥做法是重启 DeepSeek Harness（或在 GUI 里重新加载 profile），之后刷新 Web GUI，侧栏应出现 `原理图设计`。Skill 目录是每次新会话扫描的，安装后新会话即可加载（可用 `skill` 工具验证 `hw-design` 是否已注册）。

> 未在宿主 GUI 中实测前，不要声称侧栏已出现该面板；配置落盘正确与面板实际渲染是两件事。

## 验证命令

在插件目录执行（`<PLUGIN>`）：

```powershell
cd <path-to-schematic-design-plugin>

# 1) 语法检查
node --check client.js
node --check index.js

# 2) 渲染冒烟：加载 client、apply、渲染所有注册 slot 两遍
node smoke.cjs client.js

# 3) 启动行为：断言指令派发给会话 Agent（retain + prompt queue），非仅 composer draft
node test-launch.cjs client.js
```

`smoke.cjs` / `test-launch.cjs` 的第一个参数可省略，默认读取当前目录 `client.js`。`test-launch.cjs` 还覆盖三条降级路径（无 `sessions.retain`、Host 拒收 prompt、会话始终未打开）应回退到 composer draft。

> 这些脚本只验证**面板/派发逻辑**，不验证 KiCad MCP 是否可用、也不验证生成的原理图电气正确性；后者由会话 Agent 按 Skill 的证据门槛与 ERC 签核承担。

## 边界与风险

- **不覆盖已有工程**：写盘前先列出将创建/修改的路径；目标目录已存在 `.kicad_pro` / `.kicad_sch` / `.kicad_sym` / `sym-lib-table` 时先停下报告，不擅自覆盖或改名。写入前确认门默认开启（阶段 1、2 产出后暂停）。
- **符号 pin map 需人工复核**：工具生成的符号，其 `number/name/type/at` 仍需与数据手册 pin table **逐脚核对**；隐藏电源脚、NC 脚、多单元器件尤其易错。
- **`footprint` 只引用不设计**：「原理图封装库」= `.kicad_sym` 符号库，不是 PCB `.kicad_mod` 封装库；符号的 `footprint` 属性**只能引用已存在的封装库条目**，查不到标「待确认」、**不得编造封装名**；**PCB 封装库设计（焊盘几何）不在本插件 / Skill 范围**，需封装时由人工在 KiCad 中先行建立。把「原理图符号」误当成「PCB 封装」、或凭空填一个封装名，是本流程要主动拦截的隐患。
- **ERC 需签核**：`run_erc` 的每条告警必须逐条分类并给依据/豁免理由，不得整体写「ERC 通过」；生成结果须经人工复核与 ERC 签核才算可用。
- **证据不足要标注**：任何器件参数必须能追溯到型号+页码+修订版本，任何连接必须能追溯到具体 net 与 pin；查不到写「证据不足」，不得补全成合理故事，不得把推断写成已验证。
- **进度只是阶段标记统计**：面板显示「阶段 N / M 已报告」，来自会话事件流中真实输出的 `[阶段N 完成]` 标记；阶段勾选是**执行范围**，不是「已完成的检查」，也不是「设计完成率」。标记未出现时显示「尚未在该会话中检测到阶段完成标记」。
- **只做原理图层面**：不做 PCB 布局布线、封装焊盘设计、SI/PI 仿真、热仿真。工具不可用或未成功返回时明确写「未执行 / 未生成」，不得声称已生成。
- **会话 persona 可能继承「评审」模式**：本机 desktop profile 的 `agent-preset-registry.selectedDefault` 是 `hw-review`，插件新建的会话很可能继承评审 persona（事实优先级「网表 > BOM」、199 项检查清单口径）。插件指令已显式写明「本次是原理图辅助设计任务，不是原理图评审」，但 persona 是系统级前缀，不能保证一定压过。若发现 Agent 用评审口径做设计，先在会话里确认当前模式，必要时切到标准/设计向 preset 再继续；这属于 Host preset 配置问题，不是本插件能强制解决的。

## 相关文件

- 方法与证据规范：[skills/hw-design/SKILL.md](skills/hw-design/SKILL.md)
- 实现契约：[SPEC.md](SPEC.md)
- 界面样板：[../hardware-review-plugin/client.js](../hardware-review-plugin/client.js)
