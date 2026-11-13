/**
 * Client half of the Schematic Design workbench.
 *
 * Registers a sidebar panel entry (`sidebar.panellist`, id `schematic-design`)
 * and the matching main-column panel (`main`, key `schematic-design`).
 *
 * Styling is entirely inline style objects using host theme tokens, matching
 * the schematic-review plugin. The optional `styles` builtin is not required.
 *
 * The panel never executes a process, never reads the project directory and
 * never calls a Skill or KiCad MCP directly: it composes ONE instruction
 * describing scope + inputs, then hands it to a new Session's Agent. Agent
 * execution is bounded by its own approval policy, enabled MCP servers and
 * installed Skills.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-plugin-schematic-design',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useCallback, useMemo } = React

    const PANEL_ID = 'schematic-design'
    const STORAGE_KEY = 'dsh.schematic-design.tasks.v1'

    // ---- Four phases (SPEC §2) ------------------------------------------------
    // `method(skillName)` produces the exact "手段与工具" text used in the
    // instruction; `shortMethod` is the condensed form shown in the phase rows.
    const PHASE3_TOOLS = 'KiCad MCP：list_symbol_libraries / search_symbols / get_symbol_info / list_symbol_pins → 复用；否则 create_symbol → validate_symbol_library → register_symbol_library'
    const PHASE4_TOOLS = 'KiCad MCP：create_project / create_schematic / add_schematic_component（或 batch_add_components）→ add_schematic_wire / add_schematic_net_label / connect_to_net / batch_connect / batch_add_no_connects → annotate_schematic → set_schematic_component_property → validate_schematic / list_schematic_components / list_schematic_nets / list_floating_labels / find_orphaned_wires / lint_offgrid / run_erc / generate_netlist → export_schematic_pdf / export_schematic_svg / get_schematic_view'

    const PHASES = [
      {
        id: 1, name: '需求分析', means: 'Skill',
        method: sk => '加载 ' + sk + ' Skill 的「阶段 1 需求分析」',
        shortMethod: '加载 Skill 的「阶段 1 需求分析」',
        outputs: 'design/requirements.md',
      },
      {
        id: 2, name: '器件选型', means: 'Skill',
        method: sk => '加载 ' + sk + ' Skill 的「阶段 2 器件选型」',
        shortMethod: '加载 Skill 的「阶段 2 器件选型」',
        outputs: 'design/selection.csv、design/selection.md',
      },
      {
        id: 3, name: '原理图符号库建库', means: 'KiCad MCP',
        method: () => PHASE3_TOOLS,
        shortMethod: '查找 / 复用现有符号；否则新建并校验、注册符号库',
        outputs: '<项目名>.kicad_sym、design/symbol-plan.md',
      },
      {
        id: 4, name: '原理图生成与验证', means: 'KiCad MCP',
        method: () => PHASE4_TOOLS,
        shortMethod: '建工程与图纸、放置元件、连线与网标、标注与属性、校验与 ERC、导出预览',
        outputs: '<项目名>.kicad_sch、design/netlist-plan.md、ERC 报告、导出预览',
      },
    ]

    function phaseById(id) {
      return PHASES.find(p => p.id === Number(id)) || null
    }

    /** Join a workspace directory and a relative file name for the instruction. */
    function joinPath(dir, name) {
      const d = String(dir || '').replace(/[\\/]+$/, '')
      const n = String(name || '')
      return d ? d + '/' + n : n
    }

    // ---- Instruction (SPEC §4) -----------------------------------------------
    /**
     * Compose the single instruction handed to the Session's Agent.
     *
     * It states only WHAT (inputs, scope, output names, gates). HOW comes from
     * the Skill. No device parameter and no net/pin relationship is invented
     * here: the requirement is quoted verbatim, refs are just paths.
     */
    function designInstruction(plan) {
      const dir = String((plan && plan.dir) || '').trim()
      const projectName = String((plan && plan.projectName) || '').trim()
      const skillName = String((plan && plan.skillName) || '').trim() || 'hw-design'
      const libName = String((plan && plan.libName) || '').trim()
      const schName = String((plan && plan.schName) || '').trim()
      const requirement = String((plan && plan.requirement) || '')
      const refs = Array.isArray(plan && plan.refs)
        ? plan.refs.map(r => String(r == null ? '' : r).trim()).filter(Boolean)
        : []
      const phases = Array.isArray(plan && plan.phases)
        ? plan.phases.map(n => Number(n))
        : []
      const confirmGate = Boolean(plan && plan.confirmGate)
      const exportOutputs = Boolean(plan && plan.exportOutputs)

      const lines = []

      // --- Step one: input inventory only, then STOP. ---
      lines.push('第一步：先只做输入清点，不要开始设计。')
      lines.push('')
      lines.push('目标目录（输出 / 工作区）：' + dir)
      lines.push('项目名称：' + projectName)
      lines.push('')
      lines.push('请列出该目录及其子目录中的文件，并逐项告诉我是否找到：')
      lines.push('  - 需求文档（.md / .txt / .pdf / .docx）')
      lines.push('  - 参考资料与关键器件数据手册')
      lines.push('  - 已有 KiCad 工程（.kicad_pro / .kicad_sch / .kicad_sym / sym-lib-table）')
      lines.push('  - 现有 BOM 或参考设计')
      lines.push('每项写「找到 <文件名>」或「未找到」，并说明在哪个子目录。')
      lines.push('明确指出哪些输入缺失、会导致哪个阶段无法验证。')
      lines.push('')
      lines.push('清点完成后停下来，等我确认再继续。')
      lines.push('')
      lines.push('---')
      lines.push('')
      lines.push('我确认后，按下面范围执行设计。')
      // New sessions in this profile default to the hw-review "评审" preset.
      // State the role explicitly so a review persona cannot silently turn a
      // design task into a checklist review.
      lines.push('本次是原理图辅助设计任务，不是原理图评审：不要套用评审态的「网表 > BOM」事实优先级')
      lines.push('或检查项清单口径；按 ' + skillName + ' Skill 的设计态规则执行。')
      lines.push('先加载 ' + skillName + ' Skill，遵循它的阶段划分、证据门槛与报告规范；')
      lines.push('方法与判定标准以 Skill 为准，本指令只规定范围与输入。')
      lines.push('')

      // --- Requirement: verbatim, one "> " prefix per line. ---
      lines.push('【设计需求（用户原文，不得改写）】')
      if (requirement.trim()) {
        const reqLines = requirement.replace(/\r\n/g, '\n').split('\n')
        if (reqLines.length && reqLines[reqLines.length - 1] === '') reqLines.pop()
        for (const line of reqLines) lines.push('> ' + line)
      } else {
        lines.push('> （未提供）')
      }
      lines.push('')

      // --- Reference paths: one "- " prefix per entry. ---
      lines.push('【参考资料路径】')
      if (refs.length) {
        for (const ref of refs) lines.push('- ' + ref)
      } else {
        lines.push('（未提供）')
      }
      lines.push('')

      // --- Output convention. .kicad_sym is the KiCad SYMBOL library, not a
      // PCB footprint library; keep that suffix even when the name is defaulted. ---
      const symLib = libName || (projectName ? projectName + '.kicad_sym' : '')
      lines.push('【输出约定】')
      lines.push('- 工程目录：' + dir)
      lines.push('- 项目名称：' + projectName)
      lines.push('- 符号库：' + joinPath(dir, symLib))
      lines.push('- 原理图：' + joinPath(dir, schName))
      lines.push('- 中间产物目录：' + joinPath(dir, 'design/'))
      lines.push('')

      // --- Phase scope. Unchecked phases are explicitly excluded. ---
      lines.push('【执行阶段（按顺序，只执行下列勾选的阶段）】')
      for (const p of PHASES) {
        if (phases.indexOf(p.id) !== -1) {
          lines.push('阶段 ' + p.id + ' · ' + p.name + ' → ' + p.method(skillName) + ' → ' + p.outputs)
        } else {
          lines.push('阶段 ' + p.id + ' · ' + p.name + '：本次不执行')
        }
      }
      lines.push('')

      // --- Progress marker contract (literal "[阶段N 完成]"). ---
      lines.push('【阶段完成标记】')
      lines.push('每完成一个阶段，在回复中单独一行输出 [阶段N 完成]（N 为 1..4 的阶段号），')
      lines.push('面板据此跟踪进度。不要为未完成的阶段输出该标记，也不要在引用本指令时输出。')
      lines.push('')

      // --- Write gate. ---
      lines.push('【确认门】')
      if (confirmGate) {
        lines.push('阶段 1、2 的文档产出后暂停，等我确认再进入 KiCad 写盘阶段（3、4）；')
        lines.push('        暂停期间不要创建或修改任何 .kicad_* 文件。')
      } else {
        lines.push('连续执行全部勾选阶段，中途不要等待确认。')
      }
      lines.push('')

      // --- Evidence gates / red lines. ---
      lines.push('【证据与红线】')
      lines.push('- 任何器件参数必须能追溯到数据手册的型号、页码与修订版本；查不到就写「证据不足」，不得编造。')
      lines.push('- 任何连接关系必须能追溯到具体 net 与 pin；不得用推断补成合理故事。')
      lines.push('- 『原理图封装库』按 KiCad 的 .kicad_sym 符号库理解；符号的 footprint 属性只能引用已存在的封装库条目，找不到就标注「待确认」，不得编造封装名，也不把 PCB 封装库设计混入本流程。')
      lines.push('- 每个结论给出三样东西：判定方式（确定性检查 / 辅助判断 / 人工确认）、证据引用、结论。')
      lines.push('- 结论只有三种：已证实问题 / 疑似待确认 / 已核对通过。禁止把推断写成已验证；')
      lines.push('  禁止「基本没问题」这类模糊表述。')
      lines.push('- 写盘前先列出将创建 / 修改的路径；不得覆盖用户已有工程文件。')
      lines.push('- KiCad MCP 工具不可用或未成功返回时，明确说明未执行 / 未生成，不得声称已生成。')
      lines.push('- 先给结论，再给依据与风险；主动指出隐患。')
      lines.push('')

      // --- Export. ---
      lines.push('【导出】')
      if (exportOutputs) {
        lines.push('最后调用 kicad 的 export_schematic_pdf / export_schematic_svg（或 get_schematic_view）')
        lines.push('        输出预览，并在报告里给出实际文件路径。')
      } else {
        lines.push('本次不导出预览文件。')
      }

      return lines.join('\n')
    }

    // ---- Launch (SPEC §5) -----------------------------------------------------

    /** How long a Session may take to open before the launch gives up. */
    const SESSION_OPEN_TIMEOUT_MS = 6000

    /** Reject instead of waiting forever, so a stuck open cannot spin the UI. */
    function withTimeout(promise, ms, message) {
      let timer
      const guard = new Promise((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms)
      })
      return Promise.race([promise, guard]).finally(() => clearTimeout(timer))
    }

    /**
     * Hand `text` to an existing Session's Agent as a real user turn.
     * Returns true when accepted, false when this build exposes no direct
     * dispatch, throws when the Host refuses it. The reference is released on
     * every path so the panel never pins a Session open.
     */
    async function dispatchToAgent(ctx, sessionId, text) {
      const sessions = ctx && ctx.get ? ctx.get('sessions') : undefined
      if (!sessions || typeof sessions.retain !== 'function') return false
      const reference = sessions.retain(sessionId, { source: 'controllerOperation' })
      try {
        const binding = await withTimeout(
          reference.ready, SESSION_OPEN_TIMEOUT_MS, '会话没有在预期时间内打开',
        )
        const session = binding && binding.session
        if (!session || typeof session.prompt !== 'function') return false
        const result = await session.prompt([{ type: 'text', text }], 'queue')
        if (result && result.ok === false) {
          const failure = result.error || {}
          throw new Error(failure.message || failure.code || '会话拒绝接收该指令')
        }
        return true
      } finally {
        try {
          if (reference && typeof reference.release === 'function') reference.release()
        } catch { /* releasing is best-effort */ }
      }
    }

    /**
     * Start one design: register the Workspace, create the Session, dispatch.
     *
     * Delivery is reported instead of assumed:
     *   'agent' — the instruction became a user turn; the Agent is running.
     *   'draft' — direct dispatch was unavailable, so the text was staged into
     *             the composer as a fallback and still needs an Enter.
     *   'none'  — not even a draft could be staged; only the Workspace opened.
     */
    async function startDesign(ctx, plan) {
      const ws = ctx && ctx.get ? ctx.get('workspaces') : undefined
      const ui = ctx && ctx.get ? ctx.get('uiWorkspace') : undefined
      const sessions = ctx && ctx.get ? ctx.get('sessions') : undefined
      if (!ws || typeof ws.create !== 'function') {
        throw new Error('当前环境未提供 workspaces 服务，无法建立工作区。')
      }

      const view = await ws.create({ path: plan.dir })
      const text = designInstruction(plan)
      let sessionId = null
      let delivery = 'none'
      let warning = ''

      if (sessions && typeof sessions.create === 'function') {
        sessionId = await sessions.create({ workspaceId: view.workspaceId })
        if (ui && typeof ui.openSession === 'function') {
          try { ui.openSession(sessionId) } catch { /* navigation is best-effort */ }
        }
        try {
          if (await dispatchToAgent(ctx, sessionId, text)) delivery = 'agent'
          else warning = '当前客户端没有暴露会话的 prompt 接口'
        } catch (error) {
          warning = (error && error.message) || String(error)
        }
      } else {
        warning = '当前客户端没有暴露 sessions 服务'
      }

      if (delivery !== 'agent') {
        if (ui && typeof ui.startSession === 'function') {
          // Fallback only: a composer draft still needs the user to press Enter.
          try {
            ui.startSession(view.workspaceId, { prompt: text, whenDraftExists: 'replace' })
            delivery = 'draft'
          } catch (error) {
            const detail = (error && error.message) || String(error)
            warning = [warning, detail].filter(Boolean).join('；')
          }
        }
        if (delivery === 'none' && ui && typeof ui.connectWorkspace === 'function') {
          try {
            await ui.connectWorkspace(view.workspaceId)
          } catch (error) {
            const detail = (error && error.message) || String(error)
            warning = [warning, detail].filter(Boolean).join('；')
          }
        }
      }

      return {
        sessionId, workspaceId: view && view.workspaceId, text, delivery, warning,
      }
    }

    // ---- Task store -----------------------------------------------------------
    // One task per started design. Persisted so the panel still lists them
    // after a restart; the design itself lives in its Session.
    function loadTasks() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed.filter(t => t && typeof t === 'object' && t.id && t.dir)
      } catch {
        return []
      }
    }

    function saveTasks(tasks) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.slice(0, 40)))
      } catch {
        /* private mode or quota: the panel still works, it just forgets */
      }
    }

    function newTaskId() {
      return 'task-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7)
    }

    /** Subscribe to a task store shared by every panel instance. */
    function useTaskStore() {
      const [tasks, setTasks] = useState(loadTasks)
      const write = useCallback(next => {
        setTasks(next)
        saveTasks(next)
      }, [])
      return { tasks, write }
    }

    // ---- Theme tokens (kept as names so light/dark both work) -----------------
    const T = {
      bg: 'var(--dsw-alias-bg-base)',
      layer1: 'var(--dsw-alias-bg-layer-1)',
      layer2: 'var(--dsw-alias-bg-layer-2)',
      overlay: 'var(--dsw-alias-bg-overlay)',
      border1: 'var(--dsw-alias-border-l1)',
      border2: 'var(--dsw-alias-border-l2)',
      brand: 'var(--dsw-alias-brand-primary)',
      text: 'var(--dsw-alias-label-primary)',
      text2: 'var(--dsw-alias-label-secondary)',
      idle: 'var(--dsw-alias-state-idle-primary)',
      warn: 'var(--dsw-alias-state-warn-primary)',
      ok: 'var(--dsw-alias-state-success-primary)',
      err: 'var(--dsw-alias-state-error-primary)',
    }
    const MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace'

    function catTint(pct) {
      return 'color-mix(in srgb, var(--dsw-alias-brand-primary) ' + (pct || 12)
        + '%, transparent)'
    }

    // ---- Reusable style objects (same vocabulary as the review plugin) -------
    const S = {
      root: {
        display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
        boxSizing: 'border-box', background: T.bg, color: T.text,
        fontFamily: 'inherit', fontSize: 13, lineHeight: 1.5,
      },
      header: {
        flex: 'none', padding: '22px 28px 0',
        borderBottom: '1px solid ' + T.border1,
      },
      headerRow: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, marginBottom: 14,
      },
      h1: { margin: 0, fontSize: 17, fontWeight: 600, lineHeight: 1.3 },
      sub: { color: T.text2, fontSize: 13, whiteSpace: 'nowrap' },
      tabRow: { display: 'flex', gap: 4 },
      tab: (on) => ({
        appearance: 'none', background: 'transparent', border: 'none',
        borderBottom: '2px solid ' + (on ? T.brand : 'transparent'),
        color: on ? T.text : T.text2,
        padding: '8px 12px 9px', cursor: 'pointer', font: 'inherit',
        fontSize: 13, fontWeight: on ? 600 : 400, whiteSpace: 'nowrap',
      }),
      body: {
        flex: 1, minHeight: 0, overflowY: 'auto',
        padding: '20px 28px 36px',
      },
      card: {
        background: T.layer1, border: '1px solid ' + T.border1,
        borderRadius: 12, padding: '16px 18px', marginBottom: 14,
      },
      cardTitle: {
        margin: '0 0 4px', fontSize: 13, fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      },
      cardHint: { color: T.text2, fontSize: 12, marginBottom: 14, lineHeight: 1.5 },
      field: { marginBottom: 12 },
      label: {
        display: 'block', fontSize: 12, fontWeight: 600,
        color: T.text2, marginBottom: 5,
      },
      input: {
        width: '100%', boxSizing: 'border-box', background: T.layer2,
        border: '1px solid ' + T.border1, borderRadius: 8,
        padding: '8px 11px', color: T.text, font: 'inherit', fontSize: 13,
      },
      inputMono: {
        width: '100%', boxSizing: 'border-box', background: T.layer2,
        border: '1px solid ' + T.border1, borderRadius: 8,
        padding: '8px 11px', color: T.text, fontFamily: MONO, fontSize: 12,
      },
      row: { display: 'flex', alignItems: 'center', gap: 8 },
      btn: {
        appearance: 'none', border: '1px solid ' + T.border1,
        background: T.layer2, color: T.text, borderRadius: 8,
        padding: '8px 14px', cursor: 'pointer', font: 'inherit',
        fontSize: 13, whiteSpace: 'nowrap',
      },
      btnPrimary: {
        appearance: 'none', border: '1px solid ' + T.brand,
        background: T.brand, color: '#fff', borderRadius: 8,
        padding: '8px 16px', cursor: 'pointer', font: 'inherit',
        fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
      },
      btnDisabled: { opacity: 0.45, cursor: 'not-allowed' },
      check: { marginTop: 2, accentColor: T.brand, cursor: 'pointer', flex: 'none' },
      cmd: {
        background: T.layer2, border: '1px solid ' + T.border1,
        borderRadius: 9, padding: '11px 13px', marginBottom: 10,
      },
      badge: (tone) => {
        const color = tone === 'warn' ? T.warn : tone === 'ok' ? T.ok
          : tone === 'err' ? T.err : T.text2
        return {
          display: 'inline-block', padding: '1px 8px', borderRadius: 999,
          fontSize: 11, fontWeight: 600, color,
          border: '1px solid ' + color, whiteSpace: 'nowrap',
        }
      },
      priority: (p) => {
        const color = p === 'P0' ? T.err : p === 'P1' ? T.warn : T.text2
        const filled = p === 'P0' || p === 'P1'
        return {
          display: 'inline-block', padding: '1px 8px', borderRadius: 999,
          fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
          color: filled ? '#fff' : T.text2,
          background: filled
            ? color
            : 'color-mix(in srgb, ' + T.text2 + ' 16%, transparent)',
          border: '1px solid ' + (filled ? color
            : 'color-mix(in srgb, ' + T.text2 + ' 34%, transparent)'),
        }
      },
      statGrid: {
        display: 'grid', gap: 8,
        gridTemplateColumns: 'repeat(auto-fit, minmax(112px, 1fr))',
      },
      stat: {
        background: T.layer2, borderRadius: 8, padding: '9px 11px',
        border: '1px solid ' + T.border1,
      },
      statK: { fontSize: 11, color: T.text2, marginBottom: 2 },
      statV: {
        fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
      },
      list: { display: 'flex', flexDirection: 'column', gap: 7 },
      item: {
        border: '1px solid ' + T.border1, background: T.layer1,
        borderRadius: 9, padding: '10px 12px',
      },
      itemTop: {
        display: 'flex', alignItems: 'baseline',
        justifyContent: 'space-between', gap: 10,
      },
      empty: {
        textAlign: 'center', color: T.text2, padding: '48px 20px', fontSize: 13,
      },
      ul: { margin: 0, paddingLeft: 18, color: T.text2, fontSize: 12.5, lineHeight: 1.75 },
      path: { fontFamily: MONO, fontSize: 11.5, color: T.text2, wordBreak: 'break-all' },
      stepNum: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 18, height: 18, borderRadius: '50%', flex: 'none',
        background: T.brand, color: '#fff', fontSize: 11, fontWeight: 700,
      },
      catTab: (on) => ({
        appearance: 'none', cursor: 'pointer', font: 'inherit',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', borderRadius: 999, whiteSpace: 'nowrap',
        fontSize: 12.5, fontWeight: on ? 600 : 400,
        border: '1px solid ' + (on ? T.brand : T.border1),
        background: on ? catTint(16) : 'transparent',
        color: on ? T.text : T.text2,
        transition: 'border-color .12s, background .12s',
      }),
      catBar: {
        display: 'flex', alignItems: 'center', gap: 8,
        flexWrap: 'wrap', margin: '4px 0 10px',
      },
      catName: { fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' },
      catCount: {
        fontSize: 11.5, color: T.text2, fontVariantNumeric: 'tabular-nums',
      },
      checkList: {
        display: 'flex', flexDirection: 'column',
        border: '1px solid ' + T.border1, borderRadius: 10, overflow: 'hidden',
      },
      checkRow: (on) => ({
        display: 'flex', alignItems: 'flex-start', gap: 9,
        padding: '10px 12px',
        borderTop: '1px solid ' + T.border1,
        background: on ? T.layer2 : 'transparent',
        cursor: 'pointer',
      }),
      checkTop: { display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
      checkId: {
        fontFamily: MONO, fontSize: 11, fontWeight: 600,
        color: T.brand, flex: 'none',
      },
      checkTitle: { fontSize: 12.5, lineHeight: 1.45 },
      checkMeta: { fontSize: 11, color: T.text2, marginTop: 3, lineHeight: 1.45 },
      miniBtn: {
        appearance: 'none', border: '1px solid ' + T.border1,
        background: 'transparent', color: T.text2, borderRadius: 6,
        padding: '3px 9px', cursor: 'pointer', font: 'inherit', fontSize: 11.5,
        whiteSpace: 'nowrap',
      },
      sumRow: {
        display: 'flex', gap: 8, alignItems: 'baseline',
        padding: '5px 0', borderBottom: '1px solid ' + T.border1,
      },
    }

    const TEXTAREA_STYLE = {
      ...S.input, minHeight: 110, resize: 'vertical', lineHeight: 1.55,
    }
    const PRE_STYLE = {
      ...S.cmd, marginBottom: 0, maxHeight: 220, overflowY: 'auto',
      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      fontFamily: MONO, fontSize: 11.5, lineHeight: 1.55,
    }
    const GRID_STYLE = {
      display: 'grid', gap: 10,
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    }

    /** One label/value row used by both the confirmation card and detail view. */
    function detailRow(key, label, value, mono) {
      const shown = value === '' || value === null || value === undefined
        ? '（未提供）'
        : String(value)
      return h('div', { key: key }, [
        h('div', { key: 'l', style: S.label }, label),
        h('div', {
          key: 'v',
          style: mono
            ? S.path
            : { fontSize: 12.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
        }, shown),
      ])
    }

    /**
     * The Client context captured at apply() time. Slot views are plain
     * components with no context of their own, so services are read from here.
     */
    const ctxRef = { current: null }

    /** Hover-aware button. */
    function Button({ primary, disabled, onClick, children, style }) {
      const [hover, setHover] = useState(false)
      const base = primary ? S.btnPrimary : S.btn
      return h('button', {
        type: 'button',
        disabled,
        onClick,
        onMouseEnter: () => setHover(true),
        onMouseLeave: () => setHover(false),
        style: {
          ...base,
          ...(disabled ? S.btnDisabled : null),
          ...(hover && !disabled
            ? (primary ? { filter: 'brightness(1.08)' } : { borderColor: T.border2, background: T.overlay })
            : null),
          ...style,
        },
      }, children)
    }

    /** Copy-to-clipboard with transient confirmation. */
    function CopyButton({ text }) {
      const [done, setDone] = useState(false)
      const onClick = useCallback(() => {
        const promise = navigator.clipboard && navigator.clipboard.writeText
          ? navigator.clipboard.writeText(text)
          : Promise.reject(new Error('clipboard unavailable'))
        promise.then(() => {
          setDone(true); setTimeout(() => setDone(false), 1400)
        }).catch(() => setDone(false))
      }, [text])
      const [hover, setHover] = useState(false)
      return h('button', {
        type: 'button', onClick,
        onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false),
        style: {
          ...S.btn, padding: '5px 11px', fontSize: 12,
          ...(hover ? { borderColor: T.border2, background: T.overlay } : null),
          ...(done ? { color: T.ok, borderColor: T.ok } : null),
        },
      }, done ? '✓ 已复制' : '复制')
    }

    // ------------------------------------------------------------- Design tab

    function DesignTab({ store, onOpenTask }) {
      const [dir, setDir] = useState('')
      const [pickBusy, setPickBusy] = useState(false)
      const [pickError, setPickError] = useState('')
      // Separate state so a failed "追加目录…" is reported next to the reference
      // list, not under step 1's directory card.
      const [refPickError, setRefPickError] = useState('')
      const [projectName, setProjectName] = useState('')
      const [requirement, setRequirement] = useState('')
      const [refs, setRefs] = useState([''])
      const [libNameInput, setLibNameInput] = useState('')
      const [schNameInput, setSchNameInput] = useState('')
      const [skillName, setSkillName] = useState('hw-design')
      const [phaseChecked, setPhaseChecked] = useState({ 1: true, 2: true, 3: true, 4: true })
      const [confirmGate, setConfirmGate] = useState(true)
      const [exportOutputs, setExportOutputs] = useState(true)
      const [confirm, setConfirm] = useState(null)
      const [launching, setLaunching] = useState(false)
      const [result, setResult] = useState(null)

      // File names auto-fill from the project name until the user edits them.
      // .kicad_sym is the KiCad schematic SYMBOL library — not a PCB footprint
      // library (.pretty). PCB footprint library design is out of scope.
      const autoLib = projectName.trim() ? projectName.trim() + '.kicad_sym' : ''
      const autoSch = projectName.trim() ? projectName.trim() + '.kicad_sch' : ''
      const libName = libNameInput.trim() || autoLib
      const schName = schNameInput.trim() || autoSch

      const selectedPhases = useMemo(
        () => PHASES.filter(p => phaseChecked[p.id]).map(p => p.id),
        [phaseChecked])
      const cleanRefs = useMemo(
        () => refs.map(r => String(r == null ? '' : r).trim()).filter(Boolean),
        [refs])

      const ready = Boolean(dir.trim())
        && Boolean(projectName.trim())
        && Boolean(requirement.trim())
        && selectedPhases.length > 0

      /** Ask the Host half for a directory. The browser cannot list a directory. */
      const pick = useCallback(async () => {
        setPickError('')
        const ctx = ctxRef.current
        const svc = ctx && ctx.get ? ctx.get('uiWorkspace') : undefined
        if (!svc || typeof svc.pickDirectory !== 'function') {
          setPickError('当前环境未提供目录选择服务，请直接在输入框中粘贴路径。')
          return
        }
        setPickBusy(true)
        try {
          const chosen = await svc.pickDirectory()
          if (chosen) {
            setDir(chosen)
            setConfirm(null)
            setResult(null)
          }
        } catch (error) {
          setPickError('选择目录失败：' + ((error && error.message) || String(error)))
        }
        setPickBusy(false)
      }, [])

      const updateRef = useCallback((index, value) => {
        setRefs(prev => prev.map((r, i) => i === index ? value : r))
        setConfirm(null)
        setResult(null)
      }, [])

      const removeRef = useCallback(index => {
        setRefs(prev => {
          const next = prev.filter((_r, i) => i !== index)
          return next.length ? next : ['']
        })
        setConfirm(null)
        setResult(null)
      }, [])

      const addRefRow = useCallback(() => {
        setRefs(prev => [...prev, ''])
        setConfirm(null)
        setResult(null)
      }, [])

      const addRefDirectory = useCallback(async () => {
        setRefPickError('')
        const ctx = ctxRef.current
        const svc = ctx && ctx.get ? ctx.get('uiWorkspace') : undefined
        if (!svc || typeof svc.pickDirectory !== 'function') {
          setRefPickError('当前环境未提供目录选择服务，请直接在输入框中粘贴路径。')
          return
        }
        try {
          const chosen = await svc.pickDirectory()
          if (chosen) {
            setRefs(prev => [...prev, chosen])
            setConfirm(null)
            setResult(null)
          }
        } catch (error) {
          setRefPickError('追加目录失败：' + ((error && error.message) || String(error)))
        }
      }, [])

      const togglePhase = useCallback(id => {
        setPhaseChecked(prev => ({ ...prev, [id]: !prev[id] }))
        setConfirm(null)
        setResult(null)
      }, [])

      const setAllPhases = useCallback(on => {
        const next = {}
        for (const p of PHASES) next[p.id] = on
        setPhaseChecked(next)
        setConfirm(null)
        setResult(null)
      }, [])

      const buildPlan = useCallback(() => ({
        dir: dir.trim(),
        projectName: projectName.trim(),
        requirement,
        refs: cleanRefs.slice(),
        libName,
        schName,
        skillName: skillName.trim() || 'hw-design',
        phases: selectedPhases.slice(),
        confirmGate,
        exportOutputs,
      }), [dir, projectName, requirement, cleanRefs, libName, schName,
        skillName, selectedPhases, confirmGate, exportOutputs])

      const askConfirm = useCallback(() => {
        if (!ready) return
        const plan = buildPlan()
        setConfirm({ plan, text: designInstruction(plan) })
        setResult(null)
      }, [ready, buildPlan])

      const launch = useCallback(async () => {
        const pending = confirm
        if (!pending) return
        setLaunching(true)
        try {
          const started = await startDesign(ctxRef.current, pending.plan)
          const task = {
            id: newTaskId(),
            dir: pending.plan.dir,
            projectName: pending.plan.projectName,
            requirement: pending.plan.requirement,
            refs: pending.plan.refs,
            libName: pending.plan.libName,
            schName: pending.plan.schName,
            skillName: pending.plan.skillName,
            phases: pending.plan.phases,
            confirmGate: pending.plan.confirmGate,
            exportOutputs: pending.plan.exportOutputs,
            workspaceId: started.workspaceId,
            sessionId: started.sessionId,
            delivery: started.delivery,
            warning: started.warning || '',
            createdAt: Date.now(),
          }
          store.write([task, ...store.tasks])
          setConfirm(null)
          setResult({
            ok: true,
            dir: pending.plan.dir,
            text: started.text,
            started: started.delivery === 'agent',
            delivery: started.delivery,
            warning: started.warning,
            task,
          })
        } catch (error) {
          setResult({ error: '建立工作区失败：' + ((error && error.message) || String(error)) })
        }
        setLaunching(false)
      }, [confirm, store])

      const clearDir = useCallback(() => {
        setDir('')
        setConfirm(null)
        setResult(null)
      }, [])

      const requirementSummary = confirm
        ? (confirm.plan.requirement.length > 240
            ? confirm.plan.requirement.slice(0, 240) + '…（完整原文见下方指令）'
            : confirm.plan.requirement)
        : ''

      const hint = !dir.trim()
        ? h('span', { key: 'n', style: { fontSize: 12, color: T.warn } }, '请先选择工程目录')
        : !projectName.trim()
          ? h('span', { key: 'n', style: { fontSize: 12, color: T.warn } }, '请填写项目名称')
          : !requirement.trim()
            ? h('span', { key: 'n', style: { fontSize: 12, color: T.warn } }, '请填写设计需求')
            : !selectedPhases.length
              ? h('span', { key: 'n', style: { fontSize: 12, color: T.warn } }, '请至少勾选一个阶段')
              : h('span', { key: 'n', style: { fontSize: 12, color: T.text2 } },
                  `${selectedPhases.length} 个阶段将在新会话中执行`)

      return h('div', null, [
        // ---- Step 1: workspace directory ----
        h('div', { key: 'dir', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, [
            h('span', { key: 'n', style: S.stepNum }, '1'),
            '选择工程目录',
          ]),
          h('div', { key: 'd', style: S.cardHint },
            '这是输出目录 / 工作区路径。Agent 会在该目录中清点需求文档、参考资料、'
            + '已有 KiCad 工程与 BOM，并先向你确认是否齐全；面板本身不读取目录内容。'),
          h('div', { key: 'r', style: S.row }, [
            h('input', {
              key: 'i', style: { ...S.inputMono, flex: 1, minWidth: 0 },
              spellCheck: false, value: dir,
              placeholder: '尚未选择目录',
              onChange: e => {
                setDir(e.target.value)
                setConfirm(null)
                setResult(null)
              },
            }),
            h(Button, { key: 'b', primary: true, disabled: pickBusy, onClick: pick },
              pickBusy ? '…' : '选择目录…'),
            dir.trim()
              ? h(Button, {
                  key: 'c',
                  onClick: clearDir,
                  title: '清除', style: { padding: '8px 10px' },
                }, '×')
              : null,
          ]),
          pickError
            ? h('div', {
                key: 'pe', style: { marginTop: 9, fontSize: 12, color: T.err, lineHeight: 1.5 },
              }, pickError)
            : null,
          dir.trim()
            ? h('div', { key: 'ok', style: { marginTop: 9, fontSize: 12, color: T.text2 } }, [
                h('span', { key: 'b', style: S.badge('ok') }, '已选择'),
                h('span', { key: 'p', style: { ...S.path, marginLeft: 8 } }, dir.trim()),
              ])
            : null,
        ]),

        // ---- Step 2: project name, requirement, Skill ----
        h('div', { key: 'proj', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, [
            h('span', { key: 'n', style: S.stepNum }, '2'),
            '项目名称与设计需求',
          ]),
          h('div', { key: 'd', style: S.cardHint },
            '项目名称用于 .kicad_pro / .kicad_sch / .kicad_sym 命名；设计需求原文会原样写进指令，不改写。'),
          h('div', { key: 'n', style: S.field }, [
            h('label', { key: 'l', style: S.label }, '项目名称'),
            h('input', {
              key: 'i', style: S.input, value: projectName,
              placeholder: '例如：ch347-board',
              onChange: e => {
                setProjectName(e.target.value)
                setConfirm(null)
                setResult(null)
              },
            }),
          ]),
          h('div', { key: 'r', style: S.field }, [
            h('label', { key: 'l', style: S.label }, '设计需求（用户原文）'),
            h('textarea', {
              key: 't', style: TEXTAREA_STYLE, value: requirement,
              placeholder: '粘贴或输入设计需求原文…',
              onChange: e => {
                setRequirement(e.target.value)
                setConfirm(null)
                setResult(null)
              },
            }),
          ]),
          h('div', { key: 's', style: S.field }, [
            h('label', { key: 'l', style: S.label }, 'Skill 名称'),
            h('input', {
              key: 'i', style: S.input, value: skillName,
              placeholder: 'hw-design',
              onChange: e => {
                setSkillName(e.target.value)
                setConfirm(null)
                setResult(null)
              },
            }),
            h('div', { key: 'h', style: { ...S.checkMeta, marginTop: 5 } },
              '默认 hw-design；可覆盖为其他已安装 Skill。方法与判定标准以 Skill 为准。'),
          ]),
        ]),

        // ---- Step 3: reference paths ----
        h('div', { key: 'refs', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, [
            h('span', { key: 'n', style: S.stepNum }, '3'),
            '参考资料路径',
            h('span', { key: 'b', style: S.badge('ok') }, `${cleanRefs.length} 条`),
          ]),
          h('div', { key: 'd', style: S.cardHint },
            '手册 / 需求文档 / 参考设计目录。每行一个路径；可增删，也可用目录选择器追加目录。'),
          h('div', { key: 'l', style: S.list }, refs.map((ref, index) =>
            h('div', { key: index, style: S.row }, [
              h('input', {
                key: 'i', style: { ...S.inputMono, flex: 1, minWidth: 0 },
                spellCheck: false, value: ref,
                placeholder: '参考资料或数据手册路径',
                onChange: e => updateRef(index, e.target.value),
              }),
              h(Button, {
                key: 'x', onClick: () => removeRef(index),
                title: '删除这一行', style: { padding: '8px 10px' },
              }, '×'),
            ]))),
          refPickError
            ? h('div', {
                key: 'pe', style: { marginTop: 9, fontSize: 12, color: T.err, lineHeight: 1.5 },
              }, refPickError)
            : null,
          h('div', { key: 'a', style: { ...S.row, marginTop: 10 } }, [
            h(Button, { key: 'add', onClick: addRefRow }, '＋ 添加路径'),
            h(Button, { key: 'pick', onClick: addRefDirectory }, '追加目录…'),
          ]),
        ]),

        // ---- Step 4: output file names and execution options ----
        h('div', { key: 'opt', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, [
            h('span', { key: 'n', style: S.stepNum }, '4'),
            '输出文件名与执行选项',
          ]),
          h('div', { key: 'd', style: S.cardHint },
            '符号库与原理图文件名随项目名自动填充，可编辑；路径相对工程目录。'),
          h('div', { key: 'f', style: GRID_STYLE }, [
            h('div', { key: 'lib', style: S.field }, [
              h('label', { key: 'l', style: S.label }, '符号库文件名'),
              h('input', {
                key: 'i', style: S.inputMono, value: libName, spellCheck: false,
                onChange: e => {
                  setLibNameInput(e.target.value)
                  setConfirm(null)
                  setResult(null)
                },
              }),
            ]),
            h('div', { key: 'sch', style: S.field }, [
              h('label', { key: 'l', style: S.label }, '原理图文件名'),
              h('input', {
                key: 'i', style: S.inputMono, value: schName, spellCheck: false,
                onChange: e => {
                  setSchNameInput(e.target.value)
                  setConfirm(null)
                  setResult(null)
                },
              }),
            ]),
          ]),
          h('label', { key: 'cg', style: S.checkRow(confirmGate) }, [
            h('input', {
              key: 'i', type: 'checkbox', checked: confirmGate,
              onChange: () => {
                setConfirmGate(!confirmGate)
                setConfirm(null)
                setResult(null)
              },
              style: S.check,
            }),
            h('div', { key: 'x', style: { flex: 1, minWidth: 0 } }, [
              h('div', { key: 't', style: S.checkTitle }, '写入前确认门'),
              h('div', { key: 'e', style: S.checkMeta },
                '阶段 1、2 产出后暂停，确认后才写 .kicad_* 文件。'),
            ]),
          ]),
          h('label', { key: 'ex', style: S.checkRow(exportOutputs) }, [
            h('input', {
              key: 'i', type: 'checkbox', checked: exportOutputs,
              onChange: () => {
                setExportOutputs(!exportOutputs)
                setConfirm(null)
                setResult(null)
              },
              style: S.check,
            }),
            h('div', { key: 'x', style: { flex: 1, minWidth: 0 } }, [
              h('div', { key: 't', style: S.checkTitle }, '导出预览'),
              h('div', { key: 'e', style: S.checkMeta },
                '生成 PDF / SVG；工具不可用则明确说明未导出。'),
            ]),
          ]),
        ]),

        // ---- Step 5: phase scope ----
        h('div', { key: 'phases', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, [
            h('span', { key: 'n', style: S.stepNum }, '5'),
            '勾选执行阶段',
            h('span', { key: 'b', style: S.badge('ok') },
              `已选 ${selectedPhases.length} / ${PHASES.length}`),
          ]),
          h('div', { key: 'd', style: S.cardHint },
            '阶段勾选是范围，不是已完成的检查；进度来自会话事件流中的 [阶段N 完成] 标记，不是估算。'),
          h('div', { key: 'bulk', style: { ...S.row, marginBottom: 10 } }, [
            h('span', { key: 'l', style: { ...S.label, marginBottom: 0 } }, '快捷选择'),
            h(Button, {
              key: 'all', onClick: () => setAllPhases(true),
              style: { padding: '5px 11px', fontSize: 12 },
            }, '全选 4 个阶段'),
            h(Button, {
              key: 'none', onClick: () => setAllPhases(false),
              style: { padding: '5px 11px', fontSize: 12 },
            }, '清空'),
          ]),
          h('div', { key: 'l', style: S.checkList }, PHASES.map(p =>
            h('label', { key: p.id, style: S.checkRow(phaseChecked[p.id]) }, [
              h('input', {
                key: 'i', type: 'checkbox', checked: Boolean(phaseChecked[p.id]),
                onChange: () => togglePhase(p.id), style: S.check,
              }),
              h('div', { key: 'x', style: { flex: 1, minWidth: 0 } }, [
                h('div', { key: 't', style: S.checkTop }, [
                  h('span', { key: 'id', style: S.checkId }, '阶段 ' + p.id),
                  h('span', { key: 'n', style: S.checkTitle }, p.name),
                  h('span', {
                    key: 'm',
                    style: S.badge(p.means === 'Skill' ? 'ok' : 'warn'),
                  }, p.means),
                ]),
                h('div', { key: 'e', style: S.checkMeta }, '手段：' + p.shortMethod),
                h('div', { key: 'o', style: S.checkMeta }, '产物：' + p.outputs),
                !phaseChecked[p.id]
                  ? h('div', { key: 'x', style: S.checkMeta }, '本次不执行')
                  : null,
              ]),
            ]))),
        ]),

        // ---- Step 6: start ----
        h('div', { key: 'go', style: { ...S.row, marginBottom: 14 } }, [
          h('span', { key: 'n', style: S.stepNum }, '6'),
          h(Button, {
            key: 'b', primary: true, disabled: !ready || launching, onClick: askConfirm,
          }, '开始设计…'),
          hint,
        ]),

        // ---- Confirmation ----
        confirm ? h('div', {
          key: 'cf',
          style: { ...S.card, borderColor: T.brand, background: T.layer2 },
        }, [
          h('h3', { key: 't', style: S.cardTitle }, [
            '确认后执行',
            h('span', { key: 'b', style: S.badge('warn') }, '尚未建立任何东西'),
          ]),
          h('div', { key: 'd', style: S.cardHint },
            '点击确认后：把该目录注册为工作区、在其中新建会话，并把指令直接派给该会话的 Agent。'
            + 'Agent 会立即开始输入清点，不需要你再按回车。'),
          h('div', { key: 'rows', style: GRID_STYLE }, [
            detailRow('dir', '工程目录', confirm.plan.dir, true),
            detailRow('name', '项目名称', confirm.plan.projectName),
            detailRow('lib', '符号库文件名', confirm.plan.libName, true),
            detailRow('sch', '原理图文件名', confirm.plan.schName, true),
            detailRow('skill', 'Skill 名称', confirm.plan.skillName),
            detailRow('gate', '写入前确认门',
              confirm.plan.confirmGate ? '已勾选：阶段 1、2 后暂停等待确认' : '未勾选：连续执行'),
            detailRow('export', '导出预览',
              confirm.plan.exportOutputs ? '已勾选：输出 PDF / SVG' : '未勾选：不导出预览'),
          ]),
          h('div', { key: 'req', style: S.field }, [
            h('label', { key: 'l', style: S.label }, '设计需求摘要'),
            h('div', {
              key: 'v',
              style: { fontSize: 12.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
            }, requirementSummary || '（未提供）'),
          ]),
          h('div', { key: 'refs', style: S.field }, [
            h('label', { key: 'l', style: S.label },
              `参考资料（${confirm.plan.refs.length}）`),
            confirm.plan.refs.length
              ? h('div', { key: 'v', style: S.list }, confirm.plan.refs.map(r =>
                  h('div', { key: r, style: S.path }, '- ' + r)))
              : h('div', { key: 'v', style: { fontSize: 12.5, color: T.text2 } }, '（未提供）'),
          ]),
          h('div', { key: 'phases', style: S.field }, [
            h('label', { key: 'l', style: S.label },
              `勾选的阶段（${confirm.plan.phases.length}）`),
            h('div', { key: 'v', style: S.checkList }, PHASES.map(p => {
              const on = confirm.plan.phases.indexOf(p.id) !== -1
              return h('div', {
                key: p.id,
                style: {
                  display: 'flex', gap: 8, alignItems: 'baseline',
                  padding: '7px 11px', borderTop: '1px solid ' + T.border1,
                },
              }, [
                h('span', { key: 'i', style: S.checkId }, '阶段 ' + p.id),
                h('span', { key: 't', style: { ...S.checkTitle, flex: 1, minWidth: 0 } }, p.name),
                h('span', { key: 'm', style: S.badge(on ? 'ok' : undefined) },
                  on ? p.means + ' · 执行' : '本次不执行'),
              ])
            })),
          ]),
          h('div', { key: 'tx', style: { marginTop: 4 } }, [
            h('div', {
              key: 'l',
              style: {
                ...S.label, display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
              },
            }, [
              h('span', { key: 't' }, '将派发的指令全文'),
              h(CopyButton, { key: 'c', text: confirm.text }),
            ]),
            h('pre', { key: 'p', style: PRE_STYLE }, confirm.text),
          ]),
          h('div', { key: 'btn', style: { ...S.row, marginTop: 14 } }, [
            h(Button, { key: 'y', primary: true, disabled: launching, onClick: launch },
              launching ? '正在启动…' : '确认并启动 Agent'),
            h(Button, { key: 'n', disabled: launching, onClick: () => setConfirm(null) }, '取消'),
          ]),
        ]) : null,

        // ---- Result ----
        result && result.error
          ? h('div', { key: 'err', style: S.card }, [
              h('h3', { key: 't', style: S.cardTitle }, '未能建立工作区'),
              h('div', { key: 'e', style: { fontSize: 12.5, color: T.err, lineHeight: 1.5 } },
                result.error),
            ])
          : null,

        result && result.ok
          ? h('div', { key: 'okres', style: S.card }, [
              h('h3', { key: 't', style: S.cardTitle }, [
                result.delivery === 'agent'
                  ? 'Agent 已启动'
                  : result.delivery === 'draft'
                    ? '工作区已就绪'
                    : '工作区已建立',
                h('span', {
                  key: 'b',
                  style: S.badge(result.delivery === 'agent' ? 'ok' : 'warn'),
                }, result.delivery === 'agent'
                  ? '设计进行中'
                  : result.delivery === 'draft'
                    ? '等待你按回车'
                    : '需手动派发'),
              ]),
              h('div', { key: 'd', style: S.cardHint },
                result.delivery === 'agent'
                  ? '已在左侧打开该工作区的新会话，并把指令直接派给了会话的 Agent——'
                    + '它会立刻开始输入清点，不需要你再按回车。'
                  : result.delivery === 'draft'
                    ? '已在左侧打开该工作区的新会话，指令已填入输入框，需要你按回车才会开始。'
                      + (result.warning ? '（直接派发失败：' + result.warning + '）' : '')
                    : '工作区已建立。请到左侧打开它并新建会话，再把下面内容填入输入框后按回车。'
                      + (result.warning ? '（降级说明：' + result.warning + '）' : '')),
              h('div', { key: 'ws', style: S.field }, [
                h('label', { key: 'l', style: S.label }, '工作区'),
                h('div', { key: 'p', style: S.path }, result.dir),
              ]),
              result.delivery === 'agent'
                ? null
                : h('div', { key: 'tx', style: { marginTop: 4 } }, [
                    h('div', {
                      key: 'l',
                      style: {
                        ...S.label, display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between',
                      },
                    }, [
                      h('span', { key: 't' }, '指令内容'),
                      h(CopyButton, { key: 'c', text: result.text }),
                    ]),
                    h('pre', { key: 'p', style: PRE_STYLE }, result.text),
                  ]),
              result.warning
                ? h('div', {
                    key: 'w',
                    style: { marginTop: 10, fontSize: 12, color: T.warn, lineHeight: 1.5 },
                  }, '降级 / 警告：' + result.warning)
                : null,
            ])
          : null,
      ])
    }

    // -------------------------------------------------------------- About tab

    function AboutTab() {
      const facts = [
        ['阶段数', '4'],
        ['默认 Skill', 'hw-design'],
        ['输出文件', '.kicad_sym / .kicad_sch'],
        ['进度来源', '会话事件流'],
        ['范围', '原理图层面'],
      ]
      return h('div', null, [
        h('div', { key: 'a', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, '这个插件做什么'),
          h('div', { key: 'd', style: { ...S.cardHint, marginBottom: 14 } },
            '把设计流程变成一个可操作的应用：填需求 → 补参考资料 → 勾阶段 → 建工作区并驱动 Agent，'
            + '任务在「任务管理」里被持续跟踪，进度直接读会话事件流中的阶段标记。'),
          h('div', { key: 'g', style: S.statGrid }, facts.map(([k, v]) =>
            h('div', { key: k, style: S.stat }, [
              h('div', { key: 'k', style: S.statK }, k),
              h('div', { key: 'v', style: S.statV }, v),
            ]))),
        ]),
        h('div', { key: 'flow', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, '四阶段与「先清点输入、停等确认」'),
          h('div', { key: 'd', style: S.cardHint },
            '指令第一段只让 Agent 清点输入并停等确认；确认后才加载 Skill、按勾选阶段执行。'
            + '面板只规定范围与输入，方法与判定标准来自 Skill，工具调用由 Agent 通过 MCP 完成。'),
          h('ol', { key: 'u', style: { ...S.ul, paddingLeft: 20 } }, [
            h('li', { key: 'inv' }, '先清点输入：列出目标目录及子目录中的需求文档、参考资料 / '
              + '关键器件数据手册、已有 KiCad 工程（.kicad_pro / .kicad_sch / .kicad_sym / '
              + 'sym-lib-table）与现有 BOM / 参考设计；每项写「找到 <文件名>」或「未找到」，'
              + '明确指出哪些输入缺失、会导致哪个阶段无法验证。清点完成后停下来，等我确认再继续。'),
            h('li', { key: 'skill' }, '确认后：先加载 hw-design Skill（可在界面覆盖），'
              + '遵循它的阶段划分、证据门槛与报告规范。'),
            ...PHASES.map(p => h('li', { key: 'p' + p.id },
              '阶段 ' + p.id + ' · ' + p.name + '（' + p.means + '）→ ' + p.outputs)),
          ]),
        ]),
        h('div', { key: 'how', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, '三步使用'),
          h('ol', { key: 'u', style: { ...S.ul, paddingLeft: 20 } }, [
            h('li', { key: '1' }, '「新建任务」：选择工程目录，填写项目名称与设计需求原文，'
              + '补充参考资料，确认文件名、Skill、阶段与执行选项。'),
            h('li', { key: '2' }, '点「开始设计…」并确认：插件把该目录注册为工作区、'
              + '新建会话，并把设计指令直接派给该会话的 Agent——Agent 立即开始输入清点，无需按回车。'),
            h('li', { key: '3' }, '「任务管理」：每个任务实时显示来自会话事件流的阶段标记，'
              + '可一键跳回它的会话。任务保存在浏览器本地，重启后仍在。'),
          ]),
        ]),
        h('div', { key: 'agent', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, 'Agent 会怎么做'),
          h('div', { key: 'd', style: { ...S.cardHint, marginBottom: 0 } },
            '先按指令做输入清点并报告缺件，等你确认后再加载 Skill、按它的证据门槛执行勾选阶段；'
            + 'KiCad MCP 工具调用由 Agent 通过 MCP 完成。面板不执行进程、不读取工程、'
            + '不直接调 Skill 或 KiCad。若工具不可用或未成功返回，Agent 必须明确说明未执行 / 未生成。'),
        ]),
        h('div', { key: 'b', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, '边界与免责'),
          h('ul', { key: 'u', style: S.ul }, [
            h('li', { key: '1' }, '面板不执行进程、不读取工程文件、不直接调用 Skill 或 KiCad MCP。'),
            h('li', { key: '2' }, '真正执行由新会话的 Agent 承担，受其审批策略、已启用 MCP、已安装 Skill 约束。'),
            h('li', { key: '3' }, '阶段勾选是范围，不是已完成的检查；进度来自会话事件流中的阶段标记，不是估算。'),
            h('li', { key: '4' }, '只做原理图层面：符号库与原理图；不做 PCB 布局布线、封装焊盘设计、SI/PI 仿真。'),
            h('li', { key: '5' }, '生成结果必须经人工复核与 ERC 签核；工具生成的符号 pin map 仍需与手册逐脚核对。'),
            h('li', { key: '6' }, '缺少参考资料 / 数据手册时，Agent 必须标注「证据不足」，不得补全。'),
          ]),
        ]),
      ])
    }

    // ------------------------------------------------------------------ Panel

    function WorkbenchPanel() {
      const [tab, setTab] = useState('design')
      const store = useTaskStore()
      const running = store.tasks.length

      /** Open a task's Session and show it. */
      const openTask = useCallback(task => {
        const ctx = ctxRef.current
        const ui = ctx && ctx.get ? ctx.get('uiWorkspace') : undefined
        if (ui && typeof ui.openSession === 'function' && task.sessionId) {
          try { ui.openSession(task.sessionId); return } catch { /* fall through */ }
        }
        if (ui && typeof ui.connectWorkspace === 'function' && task.workspaceId) {
          Promise.resolve(ui.connectWorkspace(task.workspaceId)).catch(() => {})
        }
      }, [])

      const tabs = [
        { id: 'design', label: '新建任务' },
        { id: 'tasks', label: '任务管理', count: running },
        { id: 'about', label: '说明' },
      ]

      return h('div', { style: S.root }, [
        h('div', { key: 'h', style: S.header }, [
          h('div', { key: 'r', style: S.headerRow }, [
            h('h1', { key: 't', style: S.h1 }, '原理图设计'),
            h('span', { key: 's', style: S.sub },
              running ? `${running} 个任务跟踪中 · KiCad 辅助设计工作台` : 'KiCad 辅助设计工作台'),
          ]),
          h('div', { key: 'tb', style: S.tabRow, role: 'tablist' }, tabs.map(t =>
            h('button', {
              key: t.id, type: 'button', role: 'tab',
              'aria-selected': String(tab === t.id),
              onClick: () => setTab(t.id),
              style: S.tab(tab === t.id),
            }, [
              t.label,
              t.count
                ? h('span', {
                    key: 'c',
                    style: {
                      marginLeft: 6, padding: '0 6px', borderRadius: 999,
                      background: T.brand, color: '#fff', fontSize: 10,
                      fontWeight: 700, verticalAlign: 'middle',
                    },
                  }, String(t.count))
                : null,
            ]))),
        ]),
        h('div', { key: 'b', style: S.body }, [
          tab === 'design'
            ? h(DesignTab, { key: 'd', store, onOpenTask: openTask })
            : tab === 'tasks'
              ? h(TasksTab, { key: 't', store, onOpen: openTask })
              : h(AboutTab, { key: 'a' }),
        ]),
      ])
    }

    /** Sidebar rail icon: a component box with a plus and connection wires. */
    function PanelIcon(props) {
      const size = (props && props.size) || 20
      return h('svg', {
        viewBox: '0 0 64 64', width: size, height: size,
        fill: 'none', 'aria-hidden': true, style: { display: 'block' },
      }, [
        h('path', {
          key: 'wires',
          d: 'M4 20 H14 M4 44 H14 M50 20 H60 M50 44 H60 M32 4 V14 M32 50 V60',
          stroke: 'currentColor', strokeWidth: 4,
          strokeLinecap: 'round', opacity: 0.7,
        }),
        h('rect', {
          key: 'body', x: 14, y: 14, width: 36, height: 36, rx: 4,
          stroke: 'currentColor', strokeWidth: 4,
        }),
        h('path', {
          key: 'plus', d: 'M32 24 V40 M24 32 H40',
          stroke: 'currentColor', strokeWidth: 4, strokeLinecap: 'round',
        }),
      ])
    }

    // ---- Progress (SPEC §6) ---------------------------------------------------
    /**
     * Read one session's event window and report phase markers.
     *
     * Only `[阶段N 完成]` in assistant text counts, only for phases in `wanted`.
     * The instruction itself lives in a user message and is never counted.
     * `instructionSeen` is diagnostic only — it never gates the count.
     */
    function blocksOf(d) {
      const msg = d && d.message
      let raw = (msg && msg.content !== undefined) ? msg.content : (d && d.content)
      if (typeof raw === 'string') return [raw]
      if (Array.isArray(raw)) {
        return raw
          .filter(b => b && (b.type === 'text' || typeof b.text === 'string'))
          .map(b => String(b.text == null ? '' : b.text))
      }
      if (msg && typeof msg.text === 'string') return [msg.text]
      if (d && typeof d.text === 'string') return [d.text]
      return [JSON.stringify(d || {})]
    }

    function summarize(entries, wanted) {
      const raw = Array.isArray(wanted) ? wanted : []
      const wantSet = new Set(raw.map(n => Number(n)).filter(n => n >= 1 && n <= 4))
      if (!wantSet.size) return { detected: false }

      let running = false
      let calls = 0
      let skillCalls = 0
      let kicadCalls = 0
      let instructionSeen = false
      const reported = new Set()

      for (const entry of (entries || [])) {
        if (!entry || entry.type !== 'event' || !entry.event) continue
        const event = entry.event
        const d = event.data || {}

        if (event.type === 'turn/start' || event.type === 'step/start') running = true
        if (event.type === 'turn/end') running = false

        if (event.type === 'user/message') {
          const body = blocksOf(d).join('\n')
          if (body.indexOf('设计需求') !== -1 || body.indexOf('执行阶段') !== -1) {
            instructionSeen = true
          }
          continue
        }

        if (event.type === 'tool/call') {
          const name = String((d && (d.name || d.tool || d.toolName)) || '')
          const lower = name.toLowerCase()
          const args = (d && (d.params || d.arguments || d.args || d.input)) || {}
          let argsText = ''
          try { argsText = typeof args === 'string' ? args : JSON.stringify(args) }
          catch { argsText = String(args) }
          if (lower.indexOf('skill') !== -1) skillCalls++
          if (lower.indexOf('kicad') !== -1 || argsText.indexOf('kicad__') !== -1) kicadCalls++
          if (name === 'bash' || name === 'pwsh' || name === 'ops_bash'
            || name === 'terminal_open') calls++
          continue
        }

        if (event.type === 'assistant/message') {
          for (const text of blocksOf(d)) {
            for (const m of String(text).matchAll(/\[阶段\s*([1-4])\s*完成\]/g)) {
              const n = Number(m[1])
              if (wantSet.has(n)) reported.add(n)
            }
          }
        }
      }

      const total = wantSet.size
      const done = reported.size
      const complete = done >= total
      return {
        detected: true,
        done,
        total,
        calls,
        skillCalls,
        kicadCalls,
        complete,
        phase: running ? 'working' : complete ? 'done' : 'idle',
        instructionSeen,
      }
    }

    /**
     * Follow the design session started by this panel: `sessions.retain`
     * subscribes from any scope, so the panel can show live progress without
     * living inside the conversation. Unsubscribes and releases on unmount.
     */
    function useDesignProgress(sessionId, wanted) {
      const [state, setState] = useState(null)

      // Join phase ids so the effect re-runs only when the set actually changes.
      const key = Array.isArray(wanted) ? wanted.join(',') : ''

      React.useEffect(() => {
        if (!sessionId) { setState(null); return undefined }
        const ctx = ctxRef.current
        const sessions = ctx && ctx.get ? ctx.get('sessions') : undefined
        if (!sessions || typeof sessions.retain !== 'function') return undefined

        let ref
        let unsub
        let cancelled = false
        try {
          ref = sessions.retain(sessionId, { source: 'controllerOperation' })
        } catch {
          return undefined
        }

        const read = () => {
          try {
            const binding = ref.binding
            if (!binding || !binding.eventSource) return
            const window = binding.eventSource.getSnapshot()
            if (window && window.entries) {
              setState(summarize(window.entries, key ? key.split(',') : []))
            }
          } catch {
            /* a partially opened session simply shows nothing yet */
          }
        }

        // The reference opens history asynchronously; subscribe once ready.
        Promise.resolve(ref.ready).then(() => {
          if (cancelled) return
          try {
            unsub = ref.binding.eventSource.subscribe(read)
            read()
          } catch { /* ignore */ }
        }).catch(() => { /* ignore */ })

        return () => {
          cancelled = true
          try { if (unsub) unsub() } catch { /* ignore */ }
          try { if (ref && typeof ref.release === 'function') ref.release() } catch { /* ignore */ }
        }
      }, [sessionId, key])

      return state
    }

    /** Progress line shared by the row and the detail view. */
    function progressText(state) {
      if (!state || !state.detected) return '尚未在该会话中检测到阶段完成标记'
      let text = `阶段 ${state.done} / ${state.total} 已报告`
      if (state.complete) text += ' · 全部阶段已报告'
      if (state.skillCalls) text += ` · Skill 调用 ${state.skillCalls} 次`
      if (state.kicadCalls) text += ` · KiCad 调用 ${state.kicadCalls} 次`
      if (state.calls) text += ` · 命令 ${state.calls} 次`
      return text
    }

    /** One task row: what was started, and which phase markers were reported. */
    function TaskRow({ task, onOpen, onSelect, onRemove }) {
      const state = useDesignProgress(task.sessionId, task.phases)

      const pct = state && state.detected
        ? Math.round((state.done / Math.max(1, state.total)) * 100)
        : 0

      const tone = !state || !state.detected ? undefined
        : state.phase === 'done' ? 'ok'
        : state.phase === 'working' ? 'brand'
        : undefined

      return h('div', {
        style: { ...S.item, cursor: 'pointer' },
        onClick: onSelect,
      }, [
        h('div', { key: 't', style: S.itemTop }, [
          h('div', { key: 'l', style: { minWidth: 0, flex: 1 } }, [
            h('div', { key: 'p', style: S.path }, task.dir),
            h('div', { key: 'm', style: { fontSize: 11, color: T.text2, marginTop: 3 } },
              `${task.projectName || '（未命名项目）'} · ${(Array.isArray(task.phases) ? task.phases.length : 0)} 个阶段 · ${new Date(task.createdAt).toLocaleString()}`),
          ]),
          h('span', { key: 'b', style: S.badge(tone) },
            !state || !state.detected ? '等待中'
              : state.phase === 'done' ? '全部阶段已报告'
              : state.phase === 'working' ? '进行中'
              : '已启动'),
        ]),

        state && state.detected
          ? h('div', { key: 'p', style: { marginTop: 9 } }, [
              h('div', {
                key: 'bar',
                style: {
                  height: 5, borderRadius: 999, background: T.border1,
                  overflow: 'hidden', marginBottom: 5,
                },
              }, h('div', {
                style: {
                  width: pct + '%', height: '100%',
                  background: tone === 'ok' ? T.ok : T.brand, transition: 'width .3s',
                },
              })),
              h('div', { key: 'n', style: { fontSize: 11, color: T.text2 } },
                progressText(state)),
              !state.done
                ? h('div', {
                    key: 'z',
                    style: { fontSize: 11, color: T.text2, marginTop: 3 },
                  }, '尚未在该会话中检测到阶段完成标记')
                : null,
            ])
          : h('div', { key: 'n', style: { fontSize: 11, color: T.text2, marginTop: 7 } },
              '尚未在该会话中检测到阶段完成标记'),

        h('div', { key: 'a', style: { ...S.row, marginTop: 10 } }, [
          h('span', {
            key: 'w', style: { display: 'contents' },
            onClick: ev => ev.stopPropagation(),
          }, [
            h(Button, { key: 'o', onClick: () => onOpen(task) }, '打开会话'),
            h(Button, { key: 'd', onClick: onSelect }, '详情'),
            h(Button, {
              key: 'r', onClick: () => onRemove(task), style: { padding: '8px 10px' },
            }, '移除'),
          ]),
        ]),
      ])
    }

    /** Detail route: reads progress for the selected task, then renders it. */
    function TaskDetailRoute({ task, onBack, onOpen, onRemove }) {
      const state = useDesignProgress(task.sessionId, task.phases)
      return h(TaskDetail, { task, state, onBack, onOpen, onRemove })
    }

    /**
     * Full detail for one task: exactly what was asked for at launch time.
     * The stored record is the only durable copy of the request.
     */
    function TaskDetail({ task, state, onBack, onOpen, onRemove }) {
      const phases = Array.isArray(task.phases) ? task.phases.map(n => Number(n)) : []
      const refs = Array.isArray(task.refs) ? task.refs : []
      const detected = Boolean(state && state.detected)
      const done = detected ? state.done : 0
      const total = detected ? state.total : phases.length
      const pct = detected ? Math.round((done / Math.max(1, total)) * 100) : 0

      return h('div', null, [
        h('div', { key: 'back', style: { marginBottom: 12 } },
          h(Button, { onClick: onBack }, '← 返回任务列表')),

        h('div', { key: 'a', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, [
            '任务详情',
            detected
              ? h('span', {
                  key: 'b',
                  style: S.badge(state.complete ? 'ok'
                    : state.phase === 'working' ? 'brand' : undefined),
                }, state.complete ? '全部阶段已报告'
                  : state.phase === 'working' ? '进行中' : '已启动')
              : h('span', { key: 'b', style: S.badge() }, '等待中'),
          ]),
          h('div', { key: 'rows', style: { display: 'flex', flexDirection: 'column', gap: 9 } }, [
            detailRow('dir', '工程目录', task.dir, true),
            detailRow('name', '项目名称', task.projectName),
            detailRow('time', '创建时间', new Date(task.createdAt).toLocaleString()),
            detailRow('progress', '进度（阶段标记）', progressText(state)),
            detected
              ? detailRow('diag', '诊断（不影响计数）',
                  state.instructionSeen
                    ? '已在会话中看到指令（仅诊断）'
                    : '尚未在会话中看到指令（仅诊断）')
              : null,
            detailRow('delivery', '派发方式',
              task.delivery === 'agent' ? 'Agent（指令已成为用户回合）'
                : task.delivery === 'draft' ? '草稿（需按回车）'
                : '未派发（仅建立工作区）'),
            task.warning
              ? detailRow('warning', '降级 / 警告', task.warning)
              : null,
            detailRow('ws', '工作区 / 会话',
              (task.workspaceId || '—') + ' / ' + (task.sessionId || '—'), true),
          ]),
          detected
            ? h('div', {
                key: 'bar',
                style: {
                  height: 5, borderRadius: 999, background: T.border1,
                  overflow: 'hidden', marginTop: 12,
                },
              }, h('div', {
                style: {
                  width: pct + '%', height: '100%',
                  background: state.complete ? T.ok : T.brand, transition: 'width .3s',
                },
              }))
            : null,
          !detected || !done
            ? h('div', {
                key: 'none',
                style: { fontSize: 11, color: T.text2, marginTop: 8 },
              }, '尚未在该会话中检测到阶段完成标记')
            : null,
        ]),

        h('div', { key: 'b', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, '设计需求（用户原文）'),
          h('div', { key: 'd', style: S.cardHint },
            '任务创建时的原文，面板不改写；指令中也原样引用。'),
          h('pre', { key: 'p', style: PRE_STYLE }, task.requirement || '（未提供）'),
        ]),

        h('div', { key: 'c', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, `参考资料路径（${refs.length}）`),
          refs.length
            ? h('div', { key: 'l', style: S.list }, refs.map(r =>
                h('div', { key: r, style: S.path }, '- ' + r)))
            : h('div', { key: 'e', style: { fontSize: 12.5, color: T.text2 } }, '（未提供）'),
        ]),

        h('div', { key: 'd', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, '执行阶段'),
          h('div', { key: 'd', style: S.cardHint },
            '这是任务创建时确定的范围，不是已完成的检查；未勾选的阶段本次不执行。'),
          h('div', { key: 'l', style: S.checkList }, PHASES.map(p => {
            const on = phases.indexOf(p.id) !== -1
            return h('div', {
              key: p.id,
              style: {
                display: 'flex', gap: 8, alignItems: 'baseline',
                padding: '7px 11px', borderTop: '1px solid ' + T.border1,
              },
            }, [
              h('span', { key: 'i', style: S.checkId }, '阶段 ' + p.id),
              h('span', { key: 't', style: { ...S.checkTitle, flex: 1, minWidth: 0 } }, p.name),
              h('span', { key: 'm', style: S.badge(on ? 'ok' : undefined) },
                on ? p.means + ' · 执行' : '本次不执行'),
            ])
          })),
        ]),

        h('div', { key: 'e', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, '文件名与执行选项'),
          h('div', { key: 'rows', style: GRID_STYLE }, [
            detailRow('lib', '符号库文件名', task.libName, true),
            detailRow('sch', '原理图文件名', task.schName, true),
            detailRow('skill', 'Skill 名称', task.skillName),
            detailRow('gate', '写入前确认门', task.confirmGate ? '已勾选' : '未勾选'),
            detailRow('export', '导出预览', task.exportOutputs ? '已勾选' : '未勾选'),
          ]),
        ]),

        h('div', { key: 'f', style: { ...S.row, marginBottom: 14 } }, [
          h(Button, { key: 'o', primary: true, onClick: () => onOpen(task) }, '打开会话'),
          h(Button, { key: 'r', onClick: () => onRemove(task) }, '删除此任务'),
        ]),
      ])
    }

    /** The task list: everything this panel has started. */
    function TasksTab({ store, onOpen }) {
      const [selected, setSelected] = useState(null)
      const tasks = store.tasks

      const current = selected ? tasks.find(t => t.id === selected) : null
      if (current) {
        return h(TaskDetailRoute, {
          task: current,
          onBack: () => setSelected(null),
          onOpen,
          onRemove: task => {
            store.write(tasks.filter(x => x.id !== task.id))
            setSelected(null)
          },
        })
      }

      if (!tasks.length) {
        return h('div', { style: S.empty }, [
          h('div', { key: 'a' }, '还没有设计任务。'),
          h('div', { key: 'b', style: { marginTop: 8, fontSize: 12 } },
            '在「新建任务」里填写目录、项目、需求与阶段并开始设计，任务会出现在这里。'),
        ])
      }
      return h('div', null, [
        h('div', { key: 'h', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, [
            '设计任务',
            h('span', { key: 'b', style: S.badge('ok') }, `${tasks.length} 个`),
          ]),
          h('div', { key: 'd', style: { ...S.cardHint, marginBottom: 0 } },
            '每个任务跟踪它在会话中的阶段完成标记。进度来自会话事件流中的 [阶段N 完成] 标记，不是估算。'),
        ]),
        ...tasks.map(t => h(TaskRow, {
          key: t.id, task: t, onOpen,
          onSelect: () => setSelected(t.id),
          onRemove: task => store.write(store.tasks.filter(x => x.id !== task.id)),
        })),
      ])
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        // Expose services to slot components, which receive no context.
        ctxRef.current = ctx

        // Sidebar entry: the list id doubles as the main-panel key.
        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register({
            name: 'sidebar.panellist',
            id: PANEL_ID,
            order: 31,
            label: '原理图设计',
          }, PanelIcon))

        // Matching central panel, dispatched by the sidebar entry id.
        ctx.slots.inject('main', () =>
          ctx.slots.register({ name: 'main', key: PANEL_ID },
            () => h(WorkbenchPanel)))
      },
    }
  },
})
