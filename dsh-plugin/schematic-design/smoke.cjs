// Render-smoke check: load the client module, run apply(), and render every
// registered slot component twice. Catches the class of bug that `node --check`
// cannot see — an undefined hook, a missing style, a bad property read — which
// otherwise shows up only as an inactive slot in the running app.
//
// Usage: node smoke.cjs [path-to-client.js]
const fs = require('fs');
const file = process.argv[2] || 'client.js';
const src = fs.readFileSync(file, 'utf8');

const registered = [];
let hookSlots = [];
let hookIndex = 0;
function resetHooks() { hookIndex = 0; }

function useState(init) {
  const i = hookIndex++;
  if (!(i in hookSlots)) hookSlots[i] = typeof init === 'function' ? init() : init;
  return [hookSlots[i], v => { hookSlots[i] = typeof v === 'function' ? v(hookSlots[i]) : v; }];
}

const React = {
  createElement(type, props, ...kids) {
    const children = kids.flat(Infinity).filter(k => k !== null && k !== undefined && k !== false);
    if (typeof type === 'function') {
      resetHooks();
      return { __c: type.name, out: type({ ...(props || {}) }), children };
    }
    return { type, props: props || {}, children };
  },
  useState,
  useCallback: f => f,
  useMemo: f => f(),
  useEffect: () => {},
  useRef: v => ({ current: v }),
  useReducer: (r, i) => [i, () => {}],
  useLayoutEffect: () => {},
};

const window = {
  localStorage: { getItem: () => null, setItem: () => {} },
  __ModuleLoader__: { load: def => { global.__DEF = def } },
};
const host = { call: async () => ({}) };
const quiet = { log() {}, error() {}, warn() {} };

let failures = 0;

try {
  new Function('window', 'host', 'styles', 'console', src)(window, host, { insert: () => () => {} }, quiet);
} catch (e) {
  console.log('LOAD FAILED:', e.message);
  process.exit(1);
}

let plugin;
try {
  plugin = global.__DEF.factory(n => n === 'react' ? { ...React, createElement: React.createElement } : (() => { throw new Error('unexpected require: ' + n) })());
} catch (e) {
  console.log('FACTORY FAILED:', e.message);
  process.exit(1);
}

const ctx = {
  get: () => undefined,
  effect: f => { try { f() } catch (e) { console.log('EFFECT FAILED:', e.message); failures++ } return () => {} },
  slots: {
    inject: (key, cb) => { try { cb() } catch (e) { console.log('INJECT ' + key + ' FAILED:', e.message); failures++ } },
    register: (opts, comp) => { registered.push({ opts, comp }); return () => {} },
  },
};

try {
  plugin.apply(ctx);
} catch (e) {
  console.log('APPLY FAILED:', e.message);
  process.exit(1);
}

console.log('registered:', registered.map(r => r.opts.name + '#' + (r.opts.id || r.opts.key)).join(', '));

for (const r of registered) {
  if (typeof r.comp !== 'function') { console.log('  ✗ comp not callable'); failures++; continue }
  try {
    hookSlots = []; resetHooks();
    r.comp({ size: 20, active: false });
    hookSlots = []; resetHooks();
    r.comp({ size: 20, active: true });
    console.log('  ✓ ' + r.opts.name);
  } catch (e) {
    console.log('  ✗ ' + r.opts.name + ' -> ' + e.message);
    console.log('      ' + (e.stack.split('\n')[1] || '').trim());
    failures++;
  }
}

process.exit(failures ? 1 : 0);
