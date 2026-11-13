// Smoke test for the CircuitNexus skin client module (run: node smoke.cjs).
// Executes the real client.js in a stubbed browser/module environment and
// asserts the brand seats, the token layer, the injected stylesheet, the
// light/dark switch, and — most importantly — that a missing service can never
// fail the client entry.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const file = path.join(__dirname, 'client.js');
const source = fs.readFileSync(file, 'utf8');

let definition = null;
const window = { __ModuleLoader__: { load(def) { definition = def; } } };

const React = {
  createElement(type, props) {
    const out = { type, props: props || {}, children: [] };
    for (const item of Array.prototype.slice.call(arguments, 2)) {
      if (item === undefined || item === null) continue;
      if (Array.isArray(item)) out.children.push(...item.filter((x) => x !== undefined && x !== null));
      else out.children.push(item);
    }
    return out;
  },
  useState: (v) => [v, () => {}],
  useCallback: (f) => f,
  useMemo: (f) => f(),
  useEffect: () => {},
};

const sandbox = { window, console, require: (id) => (id === 'react' ? React : require(id)), document: undefined };
vm.runInNewContext(source, sandbox, { filename: file });

const failures = [];
function check(name, condition, detail) {
  if (condition) console.log('  ok   ' + name);
  else {
    failures.push(name + (detail ? ' -> ' + detail : ''));
    console.log('  FAIL ' + name + (detail ? ' -> ' + detail : ''));
  }
}

check('module loader registered the factory', definition && typeof definition.factory === 'function');
check('factory id is the package name', definition.id === '@local/hardware-agent-skin', definition.id);

function makeDocument() {
  const created = [];
  const html = new Map();
  const bodyAttrs = new Map();
  const root = {
    setAttribute(k, v) { html.set(k, v); },
    getAttribute(k) { return html.has(k) ? html.get(k) : null; },
    removeAttribute(k) { html.delete(k); },
    hasAttribute(k) { return html.has(k); },
    appendChild(node) { created.push(node); node.parentNode = root; },
  };
  const head = {
    appendChild(node) { created.push(node); node.parentNode = head; },
    removeChild(node) { const i = created.indexOf(node); if (i >= 0) created.splice(i, 1); node.parentNode = null; },
  };
  return {
    documentElement: root,
    head,
    body: {
      setAttribute(k, v) { bodyAttrs.set(k, v); },
      hasAttribute(k) { return bodyAttrs.has(k); },
      removeAttribute(k) { bodyAttrs.delete(k); },
    },
    created,
    attrs: html,
    createElement(tag) { return { tagName: tag, id: '', textContent: '', parentNode: null }; },
    getElementById(id) { return created.find((node) => node.id === id) || null; },
  };
}

function makeHarness(options) {
  const opts = options || {};
  const h = {
    themeCalls: [],
    setThemeCalls: [],
    changeListeners: [],
    slotInjections: [],
    slotRegistrations: [],
    listeners: [],
    cleanups: [],
    document: makeDocument(),
    themePreference: opts.themePreference || 'dark',
    activeLocale: opts.activeLocale || 'zh',
    onRegister: opts.onRegister,
    services: opts.services === undefined ? true : opts.services,
  };

  h.theme = {
    overrideTokens(source, tokens) {
      h.themeCalls.push({ source, tokens });
      return () => {};
    },
    getTheme() { return { preference: h.themePreference }; },
    setTheme(id) {
      h.setThemeCalls.push(id);
      h.themePreference = id;
      for (const listener of h.changeListeners) listener({ preference: id });
    },
  };

  h.slots = {
    inject(key, callback) {
      h.slotInjections.push(key);
      callback();
      return () => {};
    },
    register(options, component) {
      if (h.onRegister) h.onRegister(options, component);
      h.slotRegistrations.push({ options, component });
      return () => {};
    },
  };

  // Deliberately NO ctx.inject: the skin's `optional()` falls back to ctx,
  // which is also how a composition without scoped services behaves.
  h.ctx = {
    slots: h.slots,
    get(name) {
      if (!h.services) return undefined;
      if (name === 'locale') return { getSnapshot: () => ({ active: h.activeLocale, locales: ['zh', 'en'] }) };
      if (name === 'theme') return h.theme;
      if (name === 'slots') return h.slots;
      return undefined;
    },
    effect(fn) {
      const result = fn();
      if (typeof result === 'function') h.cleanups.push(result);
      return result;
    },
    on(name, listener) {
      h.listeners.push({ name, listener });
      if (name === 'theme/change') h.changeListeners.push(listener);
      return () => {};
    },
  };
  return h;
}

function expand(node) {
  if (node === null || node === undefined || typeof node !== 'object') return node;
  if (typeof node.type === 'function') {
    const props = Object.assign({}, node.props);
    if (node.children.length) props.children = node.children;
    return expand(node.type(props));
  }
  return { type: node.type, props: node.props, children: node.children.map(expand) };
}
function textOf(node) {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  return (node.children || []).map(textOf).join(' ');
}

// ---- default scenario (Chinese UI, dark) --------------------------------
const harness = makeHarness();
const plugin = definition.factory(sandbox.require);
check(
  'plugin injects only slots',
  Array.isArray(plugin.inject) && plugin.inject.length === 1 && plugin.inject[0] === 'slots',
  JSON.stringify(plugin.inject),
);
sandbox.document = harness.document;
plugin.apply(harness.ctx);

const seatNames = harness.slotRegistrations.map((r) => r.options.name);
check('four seats registered', harness.slotRegistrations.length === 4, JSON.stringify(seatNames));
check(
  'brand mark + brand name + hero mark + footer switch',
  ['sidebar.brand.mark', 'sidebar.brand.name', 'conversation.hero.brand.mark', 'sidebar.footer.action'].every((k) => seatNames.includes(k)),
  JSON.stringify(seatNames),
);
const mark = harness.slotRegistrations.find((r) => r.options.name === 'sidebar.brand.mark');
const brand = harness.slotRegistrations.find((r) => r.options.name === 'sidebar.brand.name');
const hero = harness.slotRegistrations.find((r) => r.options.name === 'conversation.hero.brand.mark');
const toggle = harness.slotRegistrations.find((r) => r.options.name === 'sidebar.footer.action');
check('sidebar mark shadows the shipped occupant', mark && mark.options.priority === -10);
check('brand name shadows the shipped occupant', brand && brand.options.priority === -10);
check('hero mark needs no priority (empty seat)', hero && hero.options.priority === undefined);
check(
  'the footer switch is a list seat with id + order',
  Boolean(toggle) && toggle.options.id === 'circuitnexus-theme-toggle' && typeof toggle.options.order === 'number',
  toggle && JSON.stringify(toggle.options),
);

// ---- token layer --------------------------------------------------------
check('one theme layer registered', harness.themeCalls.length === 1);
const tokens = (harness.themeCalls[0] && harness.themeCalls[0].tokens) || {};
const TOKEN_KEYS = [
  '--dsw-alias-bg-base',
  '--dsw-alias-bg-layer-1',
  '--dsw-alias-bg-layer-2',
  '--dsw-alias-border-l1',
  '--dsw-alias-border-l2',
  '--dsw-specific-sidebar-fill',
  '--dsw-alias-brand-primary',
];
check('all seven --dsw-* tokens present', TOKEN_KEYS.every((k) => tokens[k] && tokens[k].light && tokens[k].dark), Object.keys(tokens).join(','));
check('theme layer leaves text tokens alone', !Object.keys(tokens).some((k) => k.includes('label-')));
check('theme layer source names the package', harness.themeCalls[0] && harness.themeCalls[0].source === '@local/hardware-agent-skin');
check(
  'Light uses the readable deep gold, never #C79A3B as text',
  tokens['--dsw-alias-brand-primary'].light === '#805C1E' && tokens['--dsw-alias-brand-primary'].dark === '#D4AF37',
  JSON.stringify(tokens['--dsw-alias-brand-primary']),
);
check(
  'canvas colours follow the official token file',
  tokens['--dsw-alias-bg-base'].light === 'rgba(251, 247, 239, 0.10)' && tokens['--dsw-alias-bg-base'].dark === 'rgba(13, 14, 16, 0.10)',
  JSON.stringify(tokens['--dsw-alias-bg-base']),
);

// ---- contrast hard constraint (THEME_LIGHT.md) ---------------------------
function channel(c) { const v = c / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
function hexRgb(h) { const v = h.replace('#', ''); return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]; }
function luminance(rgb) { return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]); }
function contrast(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
const lightBrand = contrast(hexRgb(tokens['--dsw-alias-brand-primary'].light), hexRgb('#FBF7EF'));
const darkBrand = contrast(hexRgb(tokens['--dsw-alias-brand-primary'].dark), hexRgb('#0D0E10'));
check('Light brand ink clears AA on the canvas', lightBrand >= 4.5, lightBrand.toFixed(2) + ':1');
check('Dark brand ink clears AA on the canvas', darkBrand >= 4.5, darkBrand.toFixed(2) + ':1');

// ---- injected stylesheet ------------------------------------------------
const doc = harness.document;
const styleTag = doc.created.find((node) => node.id === 'circuitnexus-skin-style');
const css = styleTag ? styleTag.textContent : '';
check('the stylesheet is injected', Boolean(styleTag));
check('the gate attribute is set on <html>', doc.attrs.get('data-circuitnexus-skin') === '1', String(doc.attrs.get('data-circuitnexus-skin')));
check('a single overlay SVG is inlined per mode', (css.match(/data:image\/svg\+xml,/g) || []).length === 2, String((css.match(/data:image\/svg\+xml,/g) || []).length));
check('welcome and conversation pages share one background', !css.includes('opacity: 0.55') && !css.includes('body:has([class$="_previewBadge"]) [class*="_centerCol"]'));
check('the trace layer uses a per-mode alpha', css.includes('opacity: var(--cn-trace-alpha);'));
check('each mode gets its own conversation alpha', css.includes('--cn-trace-alpha: 0.50;') && css.includes('--cn-trace-alpha: 0.40;'));
check('the welcome page is stronger than a conversation page', css.includes('--cn-trace-alpha: 1;') && css.includes('--cn-trace-alpha: 0.80;'));
check('the welcome page opens the paper further', css.includes('--cn-paper: rgba(252, 246, 240, 0.14);') && css.includes('--cn-paper: rgba(13, 14, 16, 0.26);'));
check('columns are translucent on both pages', (css.match(/background-color: var\(--cn-paper\)/g) || []).length === 1);
check('the trace layer fills the viewport without cropping', css.includes('background-size: 100% 100%;'));
check('the overlay is a single, viewport-sized layer', css.includes('background-size: 100% 100%;') && !css.includes('280px 280px'));
check('a regular glowing-via lattice is part of the overlay', source.includes('<pattern id="via-lattice"') && source.includes('fill="url(#via-lattice)"'));
check('mid-band routing, vias, passives and a serpentine were added', source.includes('id="mid-traces"') && source.includes('id="mid-vias"') && source.includes('id="mid-passives"') && source.includes('id="length-matched-serpentine"'));
check('the serpentine turns at 45 degrees with equal segments', source.includes('L640 660 H680 L720 620') && !source.includes('V390 H240'));
check('the extension reuses the official copper gradient and Q fillets', source.includes('stroke="url(#copper)"') && source.includes('Q202 300 214 312'));
check('bg-base carries an alpha of 0.10', tokens['--dsw-alias-bg-base'].light.endsWith('0.10)') && tokens['--dsw-alias-bg-base'].dark.endsWith('0.10)'));
check('the composer band is cleared', css.includes(':has(> [data-composer-card]) { background-color: transparent !important; }'));
check('the canvas has a radial gradient for depth', css.includes('radial-gradient(ellipse 90% 85%'));
check('light and dark gradients are distinct', css.includes('#FCF6F0 0%') && css.includes('#0F1013 0%'));
check('headline is the new product headline', css.includes("content: '开启智能硬件研发工作流';"));
check('subtitle is the new product subtitle', css.includes("content: 'CircuitNexus · AI 硬件研发工作台';"));
check('subtitle carries horizontal gold rules on both sides', css.includes('72px 1px, 72px 1px;') && css.includes('background-position: left center, right center;'));
check('subtitle is centred', css.includes('text-align: center;'));
check('headline text is painted with a gold gradient', css.includes('-webkit-background-clip: text;') && css.includes('background-clip: text;') && css.includes('-webkit-text-fill-color: transparent;'));
check('light headline gradient stays readable', css.includes('linear-gradient(100deg, #A87A1E 0%, #7E5A16 52%, #4F3708 100%)'));
check('dark headline gradient uses the logo stops', css.includes('linear-gradient(100deg, #FFF0A7 0%, #E6BC4F 42%, #AD7617 100%)'));
check('hero row is self-sized and positioned for the absolute subtitle', css.includes('width: fit-content !important;') && css.includes('padding-bottom: 42px !important;'));
check('hero row is exactly one line tall so the mark centres on the headline', css.includes('align-items: center !important;') && !css.includes('margin-top: -6px'));
check('subtitle is taken out of flow to span logo+title', css.includes('position: absolute !important;') && css.includes('bottom: 0 !important;'));
check('brand name is one gold colour in both modes', css.includes('[class*="_brandName"] * { color: var(--cn-brand-ink) !important; }'));
check('brand name is painted with a gold gradient', css.includes('-webkit-text-fill-color: transparent !important;') && css.includes('var(--cn-name-grad-1)'));
check('brand name gradient stops are per-mode', css.includes('--cn-name-grad-1: #825D1D;') && css.includes('--cn-name-grad-1: #FFF0A7;'));
check('brand name is nudged onto the mark centre', css.includes('[class*="_brandName"] { position: relative !important; top: -2px !important; }'));
check('the brand row is forced into a centred flex row', css.includes('display: flex !important;') && css.includes('align-items: center !important;') && css.includes('transform: none !important;'));
check('the brand name is an inline-flex box', css.includes('[class*="_brandName"] {') && css.includes('display: inline-flex !important;'));
check('the mark may overflow its row', css.includes('[class*="_brandMark"] { overflow: visible !important;'));
check('the new-session button is matched by element + contains', css.includes('button[class*="_newSession"] {') && css.includes('button[class*="_newSession"] span,'));
check('the new-session button clears host pseudo decorations', css.includes('button[class*="_newSession"]::before,'));
check('the new-session chip uses the gold wash', css.includes('background: var(--cn-brand-wash) !important;'));
check('the headline still uses the :has() badge anchor', css.includes('[class$="_titleGroup"]:has(> [class$="_previewBadge"]) > span:first-child'));
check('the 预览版 pill is hidden, not removed', css.includes('[class$="_titleGroup"] > [class$="_previewBadge"] { display: none; }'));
check('the Windows app frame is made transparent', css.includes('[class$="_frame"] { background-color: transparent; }'));
check('columns are translucent so the background shows through', css.includes('background-color: var(--cn-paper);'));
check('the new-session button gets the gold chip treatment', css.includes('button[class*="_newSession"]') && css.includes('--cn-brand-wash'));
check('the send button gets the solid gold CTA', css.includes('[data-composer-card]') && css.includes('color: #221B12 !important;'));
check('dark mode is keyed off the Host attribute', css.includes(':has(body[data-ds-dark-theme])'));
check('printing drops the artwork', css.includes('@media print'));

// ---- brand identity -----------------------------------------------------
const markTree = expand(mark.component({ size: 34, className: 'host-mark' }));
check('the sidebar mark is enlarged to 32px', markTree.props.width === 32 && markTree.props.height === 32, String(markTree.props.width));
check('the mark keeps the host class', markTree.props.className === 'host-mark');
check('the mark is labelled with the product name', markTree.props['aria-label'] === 'CircuitNexus 电路智枢', markTree.props['aria-label']);
const heroTree = expand(hero.component({ size: 34, className: 'host-mark' }));
check('the hero mark is enlarged to 52px and uses the same asset', heroTree.props.width === 52 && heroTree.children[1].props.transform.includes('scale(0.032)'));
const markParts = markTree.children[1].children.map((c) => c.props && c.props.key).filter(Boolean);
check('the mark is the full official C + three traces + three pads', ['c', 'trace-1', 'trace-2', 'trace-3', 'pad-1', 'pad-2', 'pad-3'].every((k) => markParts.includes(k)), markParts.join(','));
check('the mark scales the official 256 viewBox into 32', markTree.children[1].props.transform.includes('scale(0.032)'));
check('the mark offsets centre the ink, not the box', markTree.children[1].props.transform.includes('translate(2.288 2.112)'));
check('the mark uses the metal gradient', /^url\(#cn-gold-\d+\)$/.test(markTree.children[1].props.stroke), markTree.children[1].props.stroke);
const goldStops = markTree.children[0].children[0].children.map((c) => c.props.stopColor).join(',');
check('the gradient carries the three official gold stops', goldStops === '#FFF0A7,#E6BC4F,#AD7617', goldStops);
const brandTree = expand(brand.component({}));
check('the brand row reads CircuitNexus', textOf(brandTree) === 'CircuitNexus', textOf(brandTree));
check('the brand name is enlarged to 17px', brandTree.props.style.fontSize === 17, String(brandTree.props.style.fontSize));

// ---- light/dark switch --------------------------------------------------
const toggleTree = expand(toggle.component({}));
check('the footer renders a button', toggleTree.type === 'button');
check('the button reports dark mode', toggleTree.props['data-cn-theme-toggle'] === 'dark', String(toggleTree.props['data-cn-theme-toggle']));
check('the button shows the Chinese dark label', textOf(toggleTree).trim() === '深色', textOf(toggleTree));
check('the Host theme/change event is subscribed', harness.changeListeners.length === 1, String(harness.changeListeners.length));

if (typeof toggleTree.props.onClick === 'function') toggleTree.props.onClick();
check('clicking calls theme.setTheme(light)', harness.setThemeCalls.includes('light'), JSON.stringify(harness.setThemeCalls));
check('the theme/change listener fired', harness.themePreference === 'light', harness.themePreference);
const lightToggle = expand(toggle.component({}));
check('the button now reports light mode', lightToggle.props['data-cn-theme-toggle'] === 'light', String(lightToggle.props['data-cn-theme-toggle']));
check('the button now shows the Chinese light label', textOf(lightToggle).trim() === '浅色', textOf(lightToggle));
const lightMark = expand(mark.component({ size: 32 }));
check('the hero-gold gradient does not change with appearance', lightMark.children[1].props.stroke === markTree.children[1].props.stroke, lightMark.children[1].props.stroke);

// An external Appearance change (Host settings) must also move the button.
for (const listener of harness.changeListeners) listener({ preference: 'dark' });
check('an external preference change updates the switch', expand(toggle.component({})).props['data-cn-theme-toggle'] === 'dark');

// ---- English UI ---------------------------------------------------------
const english = makeHarness({ activeLocale: 'en', themePreference: 'light' });
sandbox.document = english.document;
definition.factory(sandbox.require).apply(english.ctx);
check('english UI still registers four seats', english.slotRegistrations.length === 4);
const englishToggle = expand(english.slotRegistrations.find((r) => r.options.name === 'sidebar.footer.action').component({}));
check('the switch label is localised in English', textOf(englishToggle).trim() === 'Light', textOf(englishToggle));
const englishBrand = expand(english.slotRegistrations.find((r) => r.options.name === 'sidebar.brand.name').component({}));
check('the product name is not translated', textOf(englishBrand) === 'CircuitNexus', textOf(englishBrand));

// ---- hostile composition: no locale/theme, throwing accessors -----------
const hostile = makeHarness({ services: false });
Object.defineProperty(hostile.ctx, 'locale', { get() { throw new Error('Cannot get property "locale" without inject'); } });
Object.defineProperty(hostile.ctx, 'theme', { get() { throw new Error('Cannot get property "theme" without inject'); } });
let hostileThrew = null;
sandbox.document = hostile.document;
try {
  definition.factory(sandbox.require).apply(hostile.ctx);
} catch (error) {
  hostileThrew = error;
}
check('apply never throws when services are absent', hostileThrew === null, hostileThrew && hostileThrew.message);
check('seats still register without locale/theme', hostile.slotRegistrations.length === 4, JSON.stringify(hostile.slotRegistrations.map((r) => r.options.name)));
check('no theme layer without the theme service', hostile.themeCalls.length === 0);
check('the stylesheet still lands without services', hostile.document.created.some((n) => n.id === 'circuitnexus-skin-style'));

// ---- resilience: one rejected seat must not drop the others --------------
const rejected = makeHarness({
  onRegister(options) {
    if (options.name === 'sidebar.brand.mark') throw new Error('single slot "sidebar.brand.mark" already has a registration at priority 0');
  },
});
sandbox.document = rejected.document;
definition.factory(sandbox.require).apply(rejected.ctx);
check(
  'a rejected seat still leaves the other three registered',
  ['sidebar.brand.name', 'conversation.hero.brand.mark', 'sidebar.footer.action'].every((k) =>
    rejected.slotRegistrations.some((r) => r.options.name === k),
  ),
  JSON.stringify(rejected.slotRegistrations.map((r) => r.options.name)),
);

// ---- render every seat --------------------------------------------------
for (const reg of harness.slotRegistrations) {
  let tree;
  try {
    tree = expand(reg.component({ size: 34, className: 'host-mark' }));
  } catch (error) {
    failures.push('render ' + reg.options.name + ' threw: ' + error.message);
    console.log('  FAIL render ' + reg.options.name + ' -> ' + error.message);
    continue;
  }
  check('render ' + reg.options.name, tree && ['svg', 'span', 'button'].includes(tree.type), tree && tree.type);
}

// ---- dispose ------------------------------------------------------------
for (const dispose of harness.cleanups) dispose();
check('dispose removes the stylesheet', !harness.document.created.some((n) => n.id === 'circuitnexus-skin-style'));
check('dispose clears the gate attribute', harness.document.attrs.get('data-circuitnexus-skin') === undefined, String(harness.document.attrs.get('data-circuitnexus-skin')));

console.log('\n' + (failures.length ? 'FAILED: ' + failures.length : 'ALL CHECKS PASSED'));
process.exit(failures.length ? 1 : 0);
