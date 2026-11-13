// Launch-behaviour test: drive the "新建任务" tab the way a user does (type a
// directory, a project name and the requirement text, then confirm) and assert
// that the design instruction is dispatched to the new Session's Agent via
// `sessions.retain(...).binding.session.prompt(..., 'queue')`, not merely staged
// as a composer draft.
//
// Also covers the three degraded paths: no `sessions.retain`, a Host that
// refuses the prompt, and a Session that never opens (bounded wait).
//
// Usage: node test-launch.cjs [path-to-client.js]
const fs = require('fs')

const file = process.argv[2] || 'client.js'
const src = fs.readFileSync(file, 'utf8')

// ---- React stand-in whose state survives a re-render -----------------------
let currentKey = null
let stores = new Map()
const cursors = new Map()

function enter(name) {
  currentKey = name
  cursors.set(name, 0)
}

function useState(init) {
  const key = currentKey
  const index = cursors.get(key) || 0
  cursors.set(key, index + 1)
  if (!stores.has(key)) stores.set(key, [])
  const slots = stores.get(key)
  if (!(index in slots)) slots[index] = typeof init === 'function' ? init() : init
  return [slots[index], value => {
    slots[index] = typeof value === 'function' ? value(slots[index]) : value
  }]
}

function createElement(type, props, ...kids) {
  const saved = currentKey
  const children = kids.flat(Infinity)
    .filter(kid => kid !== null && kid !== undefined && kid !== false)
  if (typeof type === 'function') {
    const merged = { ...(props || {}) }
    if (children.length === 1) merged.children = children[0]
    else if (children.length > 1) merged.children = children
    const name = type.name || 'anonymous'
    enter(name)
    let out
    try {
      out = type(merged)
    } finally {
      currentKey = saved
    }
    return { component: name, type, props: merged, out, children }
  }
  return { type, props: props || {}, children }
}

const React = {
  createElement,
  useState,
  useCallback: fn => fn,
  useMemo: fn => fn(),
  useEffect: () => {},
  useLayoutEffect: () => {},
  useRef: value => ({ current: value }),
  useReducer: (_reducer, initial) => [initial, () => {}],
}

const stored = new Map()
const quiet = { log() {}, error() {}, warn() {} }

function load() {
  const window = {
    localStorage: {
      getItem: key => (stored.has(key) ? stored.get(key) : null),
      setItem: (key, value) => { stored.set(key, String(value)) },
    },
    __ModuleLoader__: { load: definition => { global.__DEF = definition } },
  }
  new Function('window', 'host', 'styles', 'console', src)(
    window,
    { call: async () => ({}) },
    { insert: () => () => {} },
    quiet,
  )
  return global.__DEF.factory(name => {
    if (name === 'react') return React
    throw new Error('unexpected require: ' + name)
  })
}

const plugin = load()

// ---- Tree helpers ----------------------------------------------------------
function collect(root) {
  const nodes = []
  const visit = node => {
    if (!node || typeof node !== 'object') return
    nodes.push(node)
    if (node.out) visit(node.out)
    else if (Array.isArray(node.children)) node.children.forEach(visit)
  }
  visit(root)
  return nodes
}

function textOf(node) {
  if (node === null || node === undefined) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (typeof node !== 'object') return ''
  const own = node.out ? textOf(node.out) : ''
  return own + textOf(node.children)
}

const findButton = (tree, label) => collect(tree).find(node =>
  node.type === 'button' && node.props.onClick && textOf(node).trim() === label)

const findField = (tree, placeholder) => collect(tree).find(node =>
  (node.type === 'input' || node.type === 'textarea') && node.props.placeholder === placeholder)

// ---- Services --------------------------------------------------------------
function buildServices(log, options = {}) {
  const session = {
    prompt: async (content, mode) => {
      log.push(['prompt', content, mode])
      if (options.refusePrompt) {
        return { ok: false, error: { code: 'gateway/internal', message: 'agent busy' } }
      }
      return { ok: true, value: { accepted: true } }
    },
  }
  const reference = {
    ready: options.stuckReady
      ? new Promise(() => {})
      : Promise.resolve({ sessionId: 'sess-1', session }),
    binding: { session },
    release: () => log.push(['release']),
  }
  const services = {
    workspaces: {
      create: async input => {
        log.push(['ws.create', input])
        return { workspaceId: 'ws-1', path: input.path }
      },
    },
    sessions: {
      create: async opts => {
        log.push(['sessions.create', opts])
        return 'sess-1'
      },
      retain: (id, opts) => {
        log.push(['sessions.retain', id, opts])
        return reference
      },
    },
    uiWorkspace: {
      openSession: id => log.push(['openSession', id]),
      startSession: (workspaceId, opts) => log.push(['startSession', workspaceId, opts]),
      connectWorkspace: async id => log.push(['connectWorkspace', id]),
      pickDirectory: async () => 'C:/picked/ref',
    },
  }
  if (options.noRetain) delete services.sessions.retain
  return services
}

// ---- One user journey ------------------------------------------------------
async function drive(options = {}) {
  stores = new Map()
  cursors.clear()
  stored.clear()

  const log = []
  const services = buildServices(log, options)
  const registry = {}

  const ctx = {
    get: name => services[name],
    slots: {
      inject: (_key, callback) => { callback() },
      register: (opts, component) => {
        registry[opts.name + '|' + (opts.key || opts.id)] = component
        return () => {}
      },
    },
  }
  plugin.apply(ctx)

  const panel = registry['main|schematic-design']
  if (typeof panel !== 'function') throw new Error('main panel did not register')
  const render = () => panel({})

  let tree = render()
  const dirInput = findField(tree, '尚未选择目录')
  if (!dirInput) throw new Error('directory input not found')
  dirInput.props.onChange({ target: { value: 'C:/proj/design' } })

  tree = render()
  const nameInput = findField(tree, '例如：ch347-board')
  if (!nameInput) throw new Error('project name input not found')
  nameInput.props.onChange({ target: { value: 'sensor-board' } })

  tree = render()
  const reqInput = findField(tree, '粘贴或输入设计需求原文…')
  if (!reqInput) throw new Error('requirement textarea not found')
  reqInput.props.onChange({ target: { value: '输入 12V，输出 3V3/2A，需 USB-C 与 ESD 保护' } })

  tree = render()
  const start = findButton(tree, '开始设计…')
  if (!start) throw new Error('start button not found')
  start.props.onClick()

  tree = render()
  const confirm = findButton(tree, '确认并启动 Agent')
  if (!confirm) throw new Error('confirm button not found')
  await confirm.props.onClick()

  const raw = stored.get('dsh.schematic-design.tasks.v1')
  const tasks = raw ? JSON.parse(raw) : []
  return { log, tree: render(), task: tasks[0] }
}

// ---- Assertions ------------------------------------------------------------
let failures = 0
function check(label, condition, detail) {
  if (condition) {
    console.log('  \u2713 ' + label)
    return
  }
  failures++
  console.log('  \u2717 ' + label + (detail ? ' -> ' + detail : ''))
}

const called = (log, name) => log.filter(entry => entry[0] === name)
const find = (log, name) => log.find(entry => entry[0] === name)

;(async () => {
  console.log('scenario: direct dispatch')
  {
    const { log, tree, task } = await drive()
    const prompt = find(log, 'prompt')
    check('workspace registered for the chosen directory',
      find(log, 'ws.create') && find(log, 'ws.create')[1].path === 'C:/proj/design')
    check('session created in that workspace',
      find(log, 'sessions.create') && find(log, 'sessions.create')[1].workspaceId === 'ws-1')
    check('created session opened for the user', find(log, 'openSession') &&
      find(log, 'openSession')[1] === 'sess-1')
    check('session retained as controllerOperation',
      find(log, 'sessions.retain') && find(log, 'sessions.retain')[2].source === 'controllerOperation')
    check('prompt dispatched to the agent', Boolean(prompt), 'no prompt call')
    check('prompt delivered as a queue-mode user turn',
      prompt && prompt[2] === 'queue' && Array.isArray(prompt[1]) && prompt[1][0].type === 'text')
    const body = prompt ? prompt[1][0].text : ''
    check('prompt carries the requirement verbatim',
      body.includes('输入 12V，输出 3V3/2A，需 USB-C 与 ESD 保护'))
    check('prompt names the hw-design Skill', body.includes('hw-design'))
    check('prompt states the design scope and stage markers',
      body.includes('设计需求') && body.includes('执行阶段') && body.includes('[阶段N 完成]'))
    check('prompt lists KiCad MCP tools for library and schematic work',
      body.includes('create_symbol') && body.includes('create_schematic')
        && body.includes('run_erc') && body.includes('register_symbol_library'))
    check('prompt states evidence gates',
      body.includes('数据手册') && body.includes('证据不足') && body.includes('net') && body.includes('pin'))
    check('prompt asks for an inventory before any design work',
      body.indexOf('第一步：先只做输入清点') === 0 && body.includes('清点完成后停下来'))
    check('composer draft NOT used', called(log, 'startSession').length === 0,
      JSON.stringify(called(log, 'startSession')))
    check('session reference released', called(log, 'release').length === 1)
    check('task records the direct delivery and the request',
      task && task.delivery === 'agent' && task.sessionId === 'sess-1'
        && task.workspaceId === 'ws-1' && task.dir === 'C:/proj/design'
        && task.projectName === 'sensor-board' && Array.isArray(task.phases)
        && task.phases.length === 4, JSON.stringify(task))
    check('result card reports the agent as started',
      textOf(tree).includes('Agent 已启动') && textOf(tree).includes('设计进行中'))
  }

  console.log('scenario: no direct dispatch available (fallback to draft)')
  {
    const { log, task } = await drive({ noRetain: true })
    check('no prompt attempted', called(log, 'prompt').length === 0)
    check('composer draft staged instead', called(log, 'startSession').length === 1)
    check('task records the draft delivery', task && task.delivery === 'draft')
  }

  console.log('scenario: host refuses the prompt (fallback to draft)')
  {
    const { log, task } = await drive({ refusePrompt: true })
    check('prompt attempted', called(log, 'prompt').length === 1)
    check('refusal surfaced to the composer fallback', called(log, 'startSession').length === 1)
    check('task records the draft delivery', task && task.delivery === 'draft')
  }

  console.log('scenario: session never opens (bounded wait, then draft)')
  {
    const started = Date.now()
    const { log, task } = await drive({ stuckReady: true })
    const waited = Date.now() - started
    check('gave up instead of hanging', waited < 15000, waited + 'ms')
    check('no prompt attempted', called(log, 'prompt').length === 0)
    check('session reference still released', called(log, 'release').length === 1)
    check('composer draft staged instead', called(log, 'startSession').length === 1)
    check('task records the draft delivery', task && task.delivery === 'draft')
  }

  console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed')
  process.exit(failures ? 1 : 0)
})().catch(error => {
  console.log('TEST CRASHED: ' + (error && error.stack ? error.stack : error))
  process.exit(1)
})
