/**
 * CircuitNexus · 电路智枢 — DSH Web UI skin.
 *
 * Brand baseline: mrgolftech/CircuitNexus @ 2026-11-12 (README.md,
 * BRAND_IDENTITY.md, UI_VISUAL_SPEC_V1.md, assets/tokens/*). One brand,
 * Precision Black & Gold, with two appearance modes (Dark 石墨黑金 / Light
 * 暖白香槟金) driven by the Host's own theme preference. Board Green is an
 * optional extension theme in that repo and is intentionally NOT shipped here.
 *
 * What this plugin can and cannot do:
 *  - CAN: sidebar brand, blank-session headline/subtitle, wallpaper, the
 *    --dsw-* token layer, the light/dark switch in the sidebar footer, and the
 *    package icon.
 *  - CANNOT: application/window title, taskbar icon, installer metadata. Those
 *    belong to the DSH Fork described in the repo's INTEGRATION_PLAN.md.
 *
 * All rules are gated on html[data-circuitnexus-skin] so disabling the plugin
 * restores the stock UI. `apply()` never throws: a failed client entry aborts
 * the whole web boot ("1 entry did not activate").
 */
window.__ModuleLoader__.load({
  id: '@local/hardware-agent-skin',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const THEME_SOURCE = '@local/hardware-agent-skin'
    const GATE_ATTR = 'data-circuitnexus-skin'
    const STYLE_ID = 'circuitnexus-skin-style'

    /** Product identity — fixed by BRAND_IDENTITY.md §1. */
    const BRAND = 'CircuitNexus'
    const BRAND_CN = '电路智枢'
    /** UI_VISUAL_SPEC_V1.md §2.2 / UI_PROTOTYPE_HANDOFF.md §2-3. */
    const HERO_TITLE = '开启智能硬件研发工作流'
    const HERO_SUBTITLE = 'CircuitNexus · AI 硬件研发工作台'

    /**
     * Official PCB trace overlays (transparent), inlined as editable SVG source
     * (not base64) so the geometry stays reviewable. Encoded to a data URI once
     * at load time — the plugin has no asset-serving route. The baked welcome
     * SVGs are NOT used: their 1440x900 background got cropped by `cover` and
     * flattened the depth, so the canvas gradient is CSS (viewport-sized, no
     * cropping) and only the corner traces come from these overlays. All four
     * official SVGs remain in assets/ as the source of truth.
     */
    const PCB_SVG = {
      darkOverlay: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"
 role="img" aria-label="CircuitNexus dark theme PCB trace background">
  <title>CircuitNexus · Dark PCB Background Overlay</title>
  <desc>Fully editable vector circuit paths, pads, dotted drafting grid and a transparent overlay.</desc>
  <defs>
    <radialGradient id="bg" cx="52%" cy="47%" r="76%" gradientTransform="translate(0 0)">
          <stop offset="0%" stop-color="#1B1918"/>
          <stop offset="47%" stop-color="#121316"/>
          <stop offset="100%" stop-color="#0D0E10"/>
        </radialGradient>
    <linearGradient id="copper" x1="0" y1="0" x2="1" y2="1" objectBoundingBox="true">
          <stop offset="0%" stop-color="#725224"/>
          <stop offset="50%" stop-color="#C59642"/>
          <stop offset="100%" stop-color="#E0B452"/>
        </linearGradient>
    <pattern id="dot-grid" width="25" height="25" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.82" fill="#827762" opacity="0.20"/>
    </pattern>
    <pattern id="via-lattice" width="180" height="144" patternUnits="userSpaceOnUse">
      <circle cx="90" cy="72" r="10" fill="#D79C35" opacity="0.06"/>
      <circle cx="90" cy="72" r="6.2" fill="none" stroke="#E5B751" stroke-width="1.2" opacity="0.3"/>
      <circle cx="90" cy="72" r="2.4" fill="#E5B751" opacity="0.45"/>
    </pattern>
  </defs>
  
  <rect width="1440" height="900" fill="url(#dot-grid)"/>
  <rect width="1440" height="900" fill="url(#via-lattice)"/>
  <g id="circuit-traces" stroke="url(#copper)" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <g id="main-traces" stroke-width="1.6" opacity="0.76">
  <path d="M-24 118 H144 Q155 118 164 109 L208 65 Q215 58 229 58 H324 L354 28 Q358 24 364 24 H465 L501 -12"/>
  <path d="M-10 136 H138 Q153 136 164 125 L207 82 Q214 75 223 75 H313"/>
  <path d="M1454 136 H1383 Q1374 136 1367 129 L1328 90 Q1321 83 1311 83 H1245 L1205 43 Q1201 39 1193 39 H1088 L1044 -7"/>
  <path d="M1454 157 H1373 L1322 106 Q1317 101 1307 101 H1243"/>
  <path d="M-18 711 H111 Q120 711 127 718 L180 771 Q187 778 197 778 H231"/>
  <path d="M-18 733 H103 Q114 733 121 741 L212 832 Q220 840 229 840 H423 L485 902"/>
  <path d="M1454 860 H1335 Q1327 860 1319 868 L1286 901"/>
    </g>
    <g id="secondary-traces" stroke-width="1.05" opacity="0.35">
  <path d="M-18 95 H114 L165 44 Q171 38 180 38 H305 L336 7 H465"/>
  <path d="M1450 116 H1392 L1330 54 H1255 L1205 4"/>
  <path d="M-20 693 H110 L180 763 H215"/>
  <path d="M1446 883 H1336 L1318 900"/>
    </g>
  </g>
  <g id="pads-and-symbols">
<circle cx="354" cy="28" r="13" fill="#D79C35" opacity="0.065"/>
        <circle cx="354" cy="28" r="9" fill="none" stroke="#E5B751" stroke-width="1.7" opacity="0.95"/>
        <circle cx="354" cy="28" r="4" fill="#E5B751" opacity="0.9"/>
<circle cx="1367" cy="129" r="12" fill="#D79C35" opacity="0.065"/>
        <circle cx="1367" cy="129" r="8" fill="none" stroke="#E5B751" stroke-width="1.7" opacity="0.95"/>
        <circle cx="1367" cy="129" r="4" fill="#E5B751" opacity="0.9"/>
<circle cx="180" cy="771" r="13" fill="#D79C35" opacity="0.065"/>
        <circle cx="180" cy="771" r="9" fill="none" stroke="#E5B751" stroke-width="1.7" opacity="0.95"/>
        <circle cx="180" cy="771" r="4" fill="#E5B751" opacity="0.9"/>
<circle cx="1335" cy="860" r="12" fill="#D79C35" opacity="0.065"/>
        <circle cx="1335" cy="860" r="8" fill="none" stroke="#E5B751" stroke-width="1.7" opacity="0.95"/>
        <circle cx="1335" cy="860" r="4" fill="#E5B751" opacity="0.9"/>
<g fill="none" stroke="#D1A14A" stroke-width="1.4" opacity="0.74">
    <path d="M217 125.5 H241 M271 125.5 H295"/>
    <rect x="241" y="117" width="30" height="17" rx="3"/>
    </g>
<g fill="none" stroke="#D1A14A" stroke-width="1.4" opacity="0.74">
    <path d="M261 799.5 H285 M316 799.5 H340"/>
    <rect x="285" y="792" width="31" height="15" rx="3"/>
    </g>
<g fill="none" stroke="#D1A14A" stroke-width="1.35" stroke-linecap="round" opacity="0.66">
      <path d="M1135 92 H1155 M1169 92 H1189 M1155 79 V105 M1169 79 V105" />
    </g>
  </g>

  <!-- extension: mid-band routing, vias, passives, length-matched serpentine -->
  <g id="mid-traces" stroke="url(#copper)" stroke-linecap="round" stroke-linejoin="round" fill="none"
     stroke-width="1.6" opacity="0.62">
    <path d="M-20 300 H186 Q202 300 214 312 L276 374 Q288 386 304 386 H430"/>
    <path d="M1460 268 H1306 Q1290 268 1278 280 L1216 342 Q1204 354 1188 354 H1174"/>
    <path d="M1162 354 H1080"/>
    <path d="M420 872 H596"/>
    <path d="M688 872 H780 L840 812 Q852 800 868 800 H1000"/>
    <path d="M300 -12 V64 L376 140 Q388 152 404 152 H446"/>
    <path d="M458 152 H600"/>
    <path d="M140 400 V520 Q140 536 152 548 L252 648"/>
    <path d="M1300 420 V520 L1244 576 Q1232 588 1216 588 H1120"/>
  </g>
  <g id="mid-secondary-traces" stroke="url(#copper)" stroke-linecap="round" stroke-linejoin="round" fill="none"
     stroke-width="1.05" opacity="0.32">
    <path d="M-20 344 H150 L214 408"/>
    <path d="M1440 316 H1322 L1258 380"/>
    <path d="M520 912 V836 L592 764"/>
    <path d="M980 912 V852 L1032 800"/>
  </g>
  <g id="mid-vias">
        <circle cx="430" cy="386" r="11" fill="#D79C35" opacity="0.06"/>
        <circle cx="430" cy="386" r="7.5" fill="none" stroke="#E5B751" stroke-width="1.6" opacity="0.85"/>
        <circle cx="430" cy="386" r="3.2" fill="#E5B751" opacity="0.85"/>
        <circle cx="1080" cy="354" r="11" fill="#D79C35" opacity="0.06"/>
        <circle cx="1080" cy="354" r="7.5" fill="none" stroke="#E5B751" stroke-width="1.6" opacity="0.85"/>
        <circle cx="1080" cy="354" r="3.2" fill="#E5B751" opacity="0.85"/>
        <circle cx="1000" cy="800" r="11" fill="#D79C35" opacity="0.06"/>
        <circle cx="1000" cy="800" r="7.5" fill="none" stroke="#E5B751" stroke-width="1.6" opacity="0.85"/>
        <circle cx="1000" cy="800" r="3.2" fill="#E5B751" opacity="0.85"/>
        <circle cx="600" cy="152" r="11" fill="#D79C35" opacity="0.06"/>
        <circle cx="600" cy="152" r="7.5" fill="none" stroke="#E5B751" stroke-width="1.6" opacity="0.85"/>
        <circle cx="600" cy="152" r="3.2" fill="#E5B751" opacity="0.85"/>
        <circle cx="252" cy="648" r="11" fill="#D79C35" opacity="0.06"/>
        <circle cx="252" cy="648" r="7.5" fill="none" stroke="#E5B751" stroke-width="1.6" opacity="0.85"/>
        <circle cx="252" cy="648" r="3.2" fill="#E5B751" opacity="0.85"/>
        <circle cx="1120" cy="588" r="11" fill="#D79C35" opacity="0.06"/>
        <circle cx="1120" cy="588" r="7.5" fill="none" stroke="#E5B751" stroke-width="1.6" opacity="0.85"/>
        <circle cx="1120" cy="588" r="3.2" fill="#E5B751" opacity="0.85"/>
  </g>
  <g id="length-matched-serpentine" stroke="url(#copper)" fill="none"
     stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" opacity="0.62">
    <path id="serpentine" d="M560 620 H600 L640 660 H680 L720 620 H760 L800 660 H840 L880 620"/>
  </g>
  <g id="mid-passives" fill="none" stroke="#D1A14A" stroke-width="1.4"
     stroke-linejoin="round" stroke-linecap="round" opacity="0.72">
    <path d="M596 872 H610 M674 872 H688"/>
    <rect x="610" y="864" width="64" height="16" rx="3"/>
    <path d="M1162 342 V366 M1174 342 V366"/>
    <path d="M446 140 V164 M458 140 V164"/>
  </g>
</svg>`,
      lightOverlay: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"
 role="img" aria-label="CircuitNexus light theme PCB trace background">
  <title>CircuitNexus · Light PCB Background Overlay</title>
  <desc>Fully editable vector circuit paths, pads, dotted drafting grid and a transparent overlay.</desc>
  <defs>
    <radialGradient id="bg" cx="50%" cy="47%" r="72%">
          <stop offset="0%" stop-color="#FFFDFA"/>
          <stop offset="59%" stop-color="#FCF9F4"/>
          <stop offset="100%" stop-color="#FBF7EF"/>
        </radialGradient>
    <linearGradient id="copper" x1="0" y1="0" x2="1" y2="1" objectBoundingBox="true">
          <stop offset="0%" stop-color="#D7BA7D"/>
          <stop offset="56%" stop-color="#C79A3B"/>
          <stop offset="100%" stop-color="#E6CE9E"/>
        </linearGradient>
    <pattern id="dot-grid" width="25" height="25" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.82" fill="#BFA57B" opacity="0.33"/>
    </pattern>
    <pattern id="via-lattice" width="180" height="144" patternUnits="userSpaceOnUse">
      <circle cx="90" cy="72" r="10" fill="#C79A3B" opacity="0.05"/>
      <circle cx="90" cy="72" r="6.2" fill="none" stroke="#C79A3B" stroke-width="1.2" opacity="0.26"/>
      <circle cx="90" cy="72" r="2.4" fill="#C79A3B" opacity="0.4"/>
    </pattern>
  </defs>
  
  <rect width="1440" height="900" fill="url(#dot-grid)"/>
  <rect width="1440" height="900" fill="url(#via-lattice)"/>
  <g id="circuit-traces" stroke="url(#copper)" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <g id="main-traces" stroke-width="1.55" opacity="0.60">
  <path d="M-18 116 H147 Q157 116 164 109 L224 49 Q233 40 245 40 H331 Q340 40 348 32 L382 -2"/>
  <path d="M-18 136 H166 Q175 136 182 129 L230 81 Q239 72 250 72 H326 L385 13"/>
  <path d="M1458 52 H1310 Q1298 52 1290 61 L1190 161 Q1182 169 1171 169 H1043"/>
  <path d="M1458 91 H1329 Q1316 91 1307 100 L1213 194 Q1204 203 1194 203 H1065"/>
  <path d="M-18 714 H114 Q125 714 133 723 L193 783 Q203 792 216 792 H367"/>
  <path d="M-18 737 H104 Q118 737 128 747 L207 826 Q217 836 230 836 H476"/>
  <path d="M1458 777 H1199 Q1188 777 1180 785 L1120 845 Q1112 853 1103 853 H1034"/>
  <path d="M1458 811 H1198 Q1188 811 1180 819 L1137 862 Q1127 872 1117 872 H1034"/>
    </g>
    <g id="secondary-traces" stroke-width="1.1" opacity="0.36">
  <path d="M-12 92 H118 Q129 92 138 83 L200 21 Q209 12 222 12 H326"/>
  <path d="M1462 28 H1343 Q1335 28 1327 36 L1173 190 H1075"/>
  <path d="M-12 693 H131 Q142 693 150 702 L199 751"/>
  <path d="M1454 793 H1212 L1143 862"/>
    </g>
  </g>
  <g id="pads-and-symbols">
<circle cx="230" cy="81" r="9" fill="none" stroke="#C79A3B" stroke-width="1.65" opacity="0.82"/>
        <circle cx="230" cy="81" r="4" fill="#C79A3B" opacity="0.76"/>
<circle cx="1043" cy="169" r="9" fill="none" stroke="#C79A3B" stroke-width="1.65" opacity="0.82"/>
        <circle cx="1043" cy="169" r="4" fill="#C79A3B" opacity="0.76"/>
<circle cx="476" cy="836" r="10" fill="none" stroke="#C79A3B" stroke-width="1.65" opacity="0.82"/>
        <circle cx="476" cy="836" r="4" fill="#C79A3B" opacity="0.76"/>
<circle cx="1034" cy="853" r="9" fill="none" stroke="#C79A3B" stroke-width="1.65" opacity="0.82"/>
        <circle cx="1034" cy="853" r="4" fill="#C79A3B" opacity="0.76"/>
<g fill="none" stroke="#C99B4A" stroke-width="1.4" opacity="0.69">
    <path d="M1265 172.5 H1289 M1330 172.5 H1354"/>
    <rect x="1289" y="164" width="41" height="17" rx="3"/>
    </g>
<g fill="none" stroke="#C99B4A" stroke-width="1.4" opacity="0.69">
    <path d="M1206 844.0 H1230 M1271 844.0 H1295"/>
    <rect x="1230" y="835" width="41" height="18" rx="3"/>
    </g>
<g fill="none" stroke="#C99B4A" stroke-width="1.35" stroke-linecap="round" opacity="0.64">
      <path d="M258 783 H278 M292 783 H312 M278 770 V796 M292 770 V796" />
    </g>
  </g>

  <!-- extension: mid-band routing, vias, passives, length-matched serpentine -->
  <g id="mid-traces" stroke="url(#copper)" stroke-linecap="round" stroke-linejoin="round" fill="none"
     stroke-width="1.55" opacity="0.52">
    <path d="M-20 300 H186 Q202 300 214 312 L276 374 Q288 386 304 386 H430"/>
    <path d="M1460 268 H1306 Q1290 268 1278 280 L1216 342 Q1204 354 1188 354 H1174"/>
    <path d="M1162 354 H1080"/>
    <path d="M420 872 H596"/>
    <path d="M688 872 H780 L840 812 Q852 800 868 800 H1000"/>
    <path d="M300 -12 V64 L376 140 Q388 152 404 152 H446"/>
    <path d="M458 152 H600"/>
    <path d="M140 400 V520 Q140 536 152 548 L252 648"/>
    <path d="M1300 420 V520 L1244 576 Q1232 588 1216 588 H1120"/>
  </g>
  <g id="mid-secondary-traces" stroke="url(#copper)" stroke-linecap="round" stroke-linejoin="round" fill="none"
     stroke-width="1.05" opacity="0.32">
    <path d="M-20 344 H150 L214 408"/>
    <path d="M1440 316 H1322 L1258 380"/>
    <path d="M520 912 V836 L592 764"/>
    <path d="M980 912 V852 L1032 800"/>
  </g>
  <g id="mid-vias">
        <circle cx="430" cy="386" r="11" fill="#C79A3B" opacity="0.05"/>
        <circle cx="430" cy="386" r="7.5" fill="none" stroke="#C79A3B" stroke-width="1.6" opacity="0.85"/>
        <circle cx="430" cy="386" r="3.2" fill="#C79A3B" opacity="0.85"/>
        <circle cx="1080" cy="354" r="11" fill="#C79A3B" opacity="0.05"/>
        <circle cx="1080" cy="354" r="7.5" fill="none" stroke="#C79A3B" stroke-width="1.6" opacity="0.85"/>
        <circle cx="1080" cy="354" r="3.2" fill="#C79A3B" opacity="0.85"/>
        <circle cx="1000" cy="800" r="11" fill="#C79A3B" opacity="0.05"/>
        <circle cx="1000" cy="800" r="7.5" fill="none" stroke="#C79A3B" stroke-width="1.6" opacity="0.85"/>
        <circle cx="1000" cy="800" r="3.2" fill="#C79A3B" opacity="0.85"/>
        <circle cx="600" cy="152" r="11" fill="#C79A3B" opacity="0.05"/>
        <circle cx="600" cy="152" r="7.5" fill="none" stroke="#C79A3B" stroke-width="1.6" opacity="0.85"/>
        <circle cx="600" cy="152" r="3.2" fill="#C79A3B" opacity="0.85"/>
        <circle cx="252" cy="648" r="11" fill="#C79A3B" opacity="0.05"/>
        <circle cx="252" cy="648" r="7.5" fill="none" stroke="#C79A3B" stroke-width="1.6" opacity="0.85"/>
        <circle cx="252" cy="648" r="3.2" fill="#C79A3B" opacity="0.85"/>
        <circle cx="1120" cy="588" r="11" fill="#C79A3B" opacity="0.05"/>
        <circle cx="1120" cy="588" r="7.5" fill="none" stroke="#C79A3B" stroke-width="1.6" opacity="0.85"/>
        <circle cx="1120" cy="588" r="3.2" fill="#C79A3B" opacity="0.85"/>
  </g>
  <g id="length-matched-serpentine" stroke="url(#copper)" fill="none"
     stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" opacity="0.52">
    <path id="serpentine" d="M560 620 H600 L640 660 H680 L720 620 H760 L800 660 H840 L880 620"/>
  </g>
  <g id="mid-passives" fill="none" stroke="#C99B4A" stroke-width="1.4"
     stroke-linejoin="round" stroke-linecap="round" opacity="0.66">
    <path d="M596 872 H610 M674 872 H688"/>
    <rect x="610" y="864" width="64" height="16" rx="3"/>
    <path d="M1162 342 V366 M1174 342 V366"/>
    <path d="M446 140 V164 M458 140 V164"/>
  </g>
</svg>`,
    }
    const PCB_URI = {}
    for (const key of Object.keys(PCB_SVG)) {
      PCB_URI[key] = 'data:image/svg+xml,' + encodeURIComponent(PCB_SVG[key])
    }


    /**
     * The seven --dsw-* tokens we override, mapped 1:1 from
     * assets/tokens/circuitnexus-theme-tokens.json. Text tokens are deliberately
     * left to the Host so its contrast tuning survives; the one exception is
     * brand-primary, which we pin to a *readable* gold: Light uses #805C1E
     * (5.67:1 on #FBF7EF), never #C79A3B (2.42:1 — forbidden for small text by
     * THEME_LIGHT.md §"对比度硬约束").
     */
    const TOKENS = {
      '--dsw-alias-bg-base': { light: 'rgba(251, 247, 239, 0.10)', dark: 'rgba(13, 14, 16, 0.10)' },
      '--dsw-alias-bg-layer-1': { light: '#FFFFFF', dark: '#23262C' },
      '--dsw-alias-bg-layer-2': { light: '#FFFCF8', dark: '#1D2025' },
      '--dsw-alias-border-l1': { light: '#E4D9C7', dark: '#3C3D42' },
      '--dsw-alias-border-l2': { light: '#9B8768', dark: '#646065' },
      '--dsw-specific-sidebar-fill': { light: '#F4E9D8', dark: '#16181D' },
      '--dsw-alias-brand-primary': { light: '#805C1E', dark: '#D4AF37' },
    }

    /** Runtime state. Module-level: slot components receive props only. */
    const state = {
      mode: 'dark',
      chinese: true,
      theme: null,
      gateSet: false,
      gatePrevious: null,
    }
    const listeners = new Set()

    function notify() {
      for (const listener of Array.from(listeners)) {
        try {
          listener()
        } catch (error) {
          /* a broken subscriber must not break the switch */
        }
      }
    }

    function useSkinState() {
      const [, force] = React.useState(0)
      React.useEffect(() => {
        const listener = () => force((n) => n + 1)
        listeners.add(listener)
        return () => {
          listeners.delete(listener)
        }
      }, [])
    }

    /**
     * The Host owns the appearance preference (THEME_PREFERENCES =
     * light|dark|system, stored as ui-theme.preference). `system` resolves to
     * whatever the presenter actually applied on <body>.
     */
    function resolveMode(snapshot) {
      const preference = snapshot && snapshot.preference
      if (preference === 'light' || preference === 'dark') return preference
      try {
        if (typeof document !== 'undefined' && document.body && typeof document.body.hasAttribute === 'function') {
          return document.body.hasAttribute('data-ds-dark-theme') ? 'dark' : 'light'
        }
      } catch (error) {
        /* fall through */
      }
      return 'light'
    }

    function setMode(next) {
      if (next !== 'light' && next !== 'dark') return
      if (state.theme && typeof state.theme.setTheme === 'function') {
        try {
          state.theme.setTheme(next)
        } catch (error) {
          console.warn('[circuitnexus] theme.setTheme failed:', error)
        }
      }
      // The theme/change event normally updates state; this also covers a
      // composition where the event never arrives.
      state.mode = next
      notify()
    }

    // ---------------------------------------------------------------- artwork

    /**
     * The sidebar/hero mark: the full official
     * circuitnexus-symbol-hero-gold.svg — open C, three equal-width 45-degree
     * traces, three ring pads, and its metal gradient (#FFF0A7 / #E6BC4F /
     * #AD7617). The user explicitly asked for this asset at BOTH positions
     * instead of the tiny-size favicon simplification.
     *
     * Path data is scaled from the source 256 viewBox into our 32 viewBox by
     * translate(2.288 2.112) scale(0.032) - the offsets centre the actual INK from `size`
     * because two marks can be mounted at once; duplicate ids would make the
     * second one resolve the first one's paint.
     */
     function HardwareMark(props) {
       useSkinState()
       const size = props && typeof props.size === 'number' && props.size > 0 ? props.size : 32
       const label = (props && props.label) || (BRAND + ' ' + BRAND_CN)
       const gradientId = 'cn-gold-' + Math.round(size)
       const gold = 'url(#' + gradientId + ')'
       const traceProps = {
         strokeWidth: 30,
         strokeLinecap: 'butt',
         strokeLinejoin: 'miter',
         strokeMiterlimit: 3,
       }
       return h(
         'svg',
         {
           viewBox: '0 0 32 32',
           width: size,
           height: size,
           fill: 'none',
           className: props ? props.className : undefined,
           role: 'img',
           'aria-label': label,
           focusable: 'false',
           overflow: 'visible',
           style: { display: 'inline-block', verticalAlign: 'middle', flex: 'none', overflow: 'visible' },
         },
         [
           h('defs', { key: 'defs' }, h('linearGradient', {
             id: gradientId,
             x1: '0', y1: '0', x2: '0.9', y2: '1',
           }, [
             h('stop', { key: 's0', offset: '0', stopColor: '#FFF0A7' }),
             h('stop', { key: 's1', offset: '0.42', stopColor: '#E6BC4F' }),
             h('stop', { key: 's2', offset: '1', stopColor: '#AD7617' }),
           ])),
           h('g', {
             key: 'mark',
             transform: 'translate(2.288 2.112) scale(0.032)',
             stroke: gold,
             fill: 'none',
             strokeLinecap: 'round',
             strokeLinejoin: 'round',
           }, [
             h('path', {
               key: 'c',
               d: 'M686 219 L445 88 L117 282 L117 588 L445 780 L687 653',
               strokeWidth: 92,
             }),
             h('path', Object.assign({ key: 'trace-1', d: 'M 222 495 L 409 308 L 525 308' }, traceProps)),
             h('path', Object.assign({ key: 'trace-2', d: 'M 283 556 L 427 412 L 700 412' }, traceProps)),
             h('path', Object.assign({ key: 'trace-3', d: 'M 342 617 L 419 617 L 490 546 L 593 546' }, traceProps)),
             h('circle', { key: 'pad-1', cx: 566, cy: 308, r: 29, strokeWidth: 30 }),
             h('circle', { key: 'pad-2', cx: 742, cy: 412, r: 29, strokeWidth: 30 }),
             h('circle', { key: 'pad-3', cx: 635, cy: 546, r: 29, strokeWidth: 30 }),
           ]),
         ],
       )
     }

    /** Brand row text. A product name is not translated. */
    function BrandName(props) {
      return h(
        'span',
        {
          style: {
            display: 'inline-block',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 17,
            verticalAlign: 'middle',
            lineHeight: '1',
            fontWeight: 700,
            letterSpacing: '0.02em',
            color: 'var(--cn-brand-ink)',
          },
        },
        props.text,
      )
    }

    // ------------------------------------------------------------- stylesheet

    function buildCss() {
      const G = 'html[' + GATE_ATTR + ']'
      const headline = G + ' [class$="_titleGroup"]:has(> [class$="_previewBadge"]) > span:first-child'
      const headlineDark = G + ':has(body[data-ds-dark-theme]) [class$="_titleGroup"]:has(> [class$="_previewBadge"]) > span:first-child'
      return [
        '/* 1. Canvas gradient. Measured from the two welcome prototypes',
        '   (1672x941): dark centre #101114 with warmer/brighter corners',
        '   #262524; light centre #FCF6F0 with warmer corners #E9DDCF.',
        '   A CSS radial gradient fills ANY viewport (no SVG cropping) and',
        '   restores the depth that a flat canvas colour was missing. */',
        G + ' {',
        '  --cn-canvas: #FBF7EF;',
        '  --cn-brand: #C79A3B;',
        '  --cn-brand-ink: #805C1E;',
        '  --cn-brand-wash: rgba(199, 154, 59, 0.34);',
        '  --cn-brand-wash-hover: rgba(199, 154, 59, 0.40);',
        '  --cn-paper: rgba(252, 246, 240, 0.32);',
        '  --cn-ink-secondary: #6F6659;',
        '  --cn-trace-alpha: 0.50;',
        '  --cn-name-grad-1: #825D1D;',
        '  --cn-name-grad-2: #66450F;',
        '  --cn-name-grad-3: #46300A;',
        '  background-color: #FBF7EF;',
        '  background-image: radial-gradient(ellipse 90% 85% at 50% 44%, #FCF6F0 0%, #F6EBDD 58%, #E9DDCF 100%);',
        '  background-attachment: fixed;',
        '}',
        G + ':has(body[data-ds-dark-theme]) {',
        '  --cn-canvas: #0D0E10;',
        '  --cn-brand: #D4AF37;',
        '  --cn-brand-ink: #D4AF37;',
        '  --cn-brand-wash: rgba(212, 175, 55, 0.42);',
        '  --cn-brand-wash-hover: rgba(212, 175, 55, 0.42);',
        '  --cn-paper: rgba(13, 14, 16, 0.48);',
        '  --cn-ink-secondary: #9AA0A6;',
        '  --cn-trace-alpha: 0.40;',
        '  --cn-name-grad-1: #FFF0A7;',
        '  --cn-name-grad-2: #E6BC4F;',
        '  --cn-name-grad-3: #AD7617;',
        '  background-color: #0D0E10;',
        '  background-image: radial-gradient(ellipse 90% 85% at 50% 44%, #0F1013 0%, #17171A 58%, #262320 100%);',
        '}',
        G + ' body { background-color: transparent; }',
        '/* The Windows shell paints the whole frame with an opaque token; as an',
        '   in-flow element it covers a negative z-index layer. Keep it clear. */',
        G + ' [id="root"] { background: transparent; }',
        G + ' [class$="_frame"] { background-color: transparent; }',
        '',
        '/* 2. Official PCB trace layer. 100% 100% is the only sizing that',
        '   shows the WHOLE composition on every viewport: `cover` cropped the',
        '   corners, `contain` letterboxed it into a small centred rectangle',
        '   (1585x186 -> scale 0.207). Stretching costs a little aspect',
        '   accuracy on ultrawide screens, which is acceptable for a',
        '   low-contrast decorative texture. ONE opacity',
        '   on EVERY page: the previous per-page split (0.16 / 0.55) made the',
        '   conversation background differ from the welcome page. */',
        G + ' body::before {',
        "  content: '';",
        '  position: fixed;',
        '  inset: 0;',
        '  z-index: -1;',
        '  pointer-events: none;',
        '/* The official overlay only drew the four corners. The additions live',
        '   INSIDE the same SVG (assets/...-overlay-ext.svg, generated by',
        '   build-ext: via lattice + mid-band routing + passives + a',
        '   length-matched serpentine), drawn with the official copper',
        '   gradient and Q-fillet grammar. One SVG, one layer. */',
        "  background-image: url('" + PCB_URI.lightOverlay + "');",
        '  background-position: 50% 50%;',
        '  background-size: 100% 100%;',
        '  background-repeat: no-repeat;',
        '  opacity: var(--cn-trace-alpha);',
        '}',
        G + ' body[data-ds-dark-theme]::before {',
        "  background-image: url('" + PCB_URI.darkOverlay + "');",
        '}',
        '/* Page tiers (explicitly requested): the blank session shows the',
        '   artwork strongly, conversation pages keep it faint so long text',
        '   stays comfortable. Only intensity differs, not the canvas gradient. */',
        G + ' body:has([class*="_previewBadge"]) {',
        '  --cn-trace-alpha: 1;',
        '  --cn-paper: rgba(252, 246, 240, 0.14);',
        '}',
        G + ' body[data-ds-dark-theme]:has([class*="_previewBadge"]) {',
        '  --cn-trace-alpha: 0.80;',
        '  --cn-paper: rgba(13, 14, 16, 0.26);',
        '}',
        '',
        '/* 3. ONE translucent paper layer on every page. Removing the blank-',
        '   session exception makes both pages share the same background. */',
        G + ' [class*="_centerCol"],',
        G + ' [class*="_rightbarCol"] { background-color: var(--cn-paper); }',
        G + ' [class*="_tabHost"] { background: transparent; }',
        G + ' [class*="_root"][data-phase] { background-color: transparent; }',
        G + ' :has(> [data-slot="conversation.header"]) { background-color: transparent; }',
        '/* The band around the composer paints its own surface; clear it so the',
        '   canvas gradient and traces reach the input area. */',
        G + ' :has(> [data-composer-card]) { background-color: transparent !important; }',
        '',
        '/* 3a. Brand row. The host sets ._logoRow{height:40px} with no flex and',
        '   nudges ._brandIdentity/.brandMark by 1px; that clips the 32px mark',
        '   and drops the 17px name. Force a centred flex row. */',
        G + ' [class*="_logoRow"],',
        G + ' [class*="_brand"],',
        G + ' [class*="_brandIdentity"] {',
        '  display: flex !important;',
        '  align-items: center !important;',
        '  gap: 10px !important;',
        '  overflow: visible !important;',
        '  transform: none !important;',
        '}',
        G + ' [class*="_brandName"] {',
        '  display: inline-flex !important;',
        '  align-items: center !important;',
        '  line-height: 1 !important;',
        '  overflow: visible !important;',
        '}',
        G + ' [class*="_brandMark"] { overflow: visible !important; transform: none !important; }',
        '',
        '/* 3a-2. Structural fallback: target the DIRECT PARENT of the brand',
        '   name/mark through :has(), so centring no longer depends on',
        '   guessing the host module class name. */',
        G + ' :has(> [class*="_brandName"]),',
        G + ' :has(> [class*="_brandMark"]) {',
        '  display: flex !important;',
        '  align-items: center !important;',
        '}',
        G + ' [class*="_brandName"],',
        G + ' [class*="_brandMark"],',
        G + ' [class*="_brandIdentity"] > * {',
        '  align-self: center !important;',
        '  vertical-align: middle !important;',
        '}',
        '/* Measured: the name ink centre sat 2.5px below the mark centre',
        '   (Latin ink sits low inside its line box). Nudge up 2px. */',
        G + ' [class*="_brandName"] { position: relative !important; top: -2px !important; }',
        '/* The host renders the product name with differently coloured child',
        '   spans (dark mode showed Circuit white / Nexus gold). Force one',
        '   brand colour across the element and every descendant. */',
        G + ' [class*="_brandName"],',
        G + ' [class*="_brandName"] * { color: var(--cn-brand-ink) !important; }',
        '/* Same metal-gradient treatment as the hero headline. Stops are',
        '   per-mode because the name is 17px (normal text, AA 4.5:1), so the',
        '   light stops must be much darker than the dark ones. */',
        G + ' [class*="_brandName"],',
        G + ' [class*="_brandName"] * {',
        '  background-image: linear-gradient(100deg, var(--cn-name-grad-1) 0%, var(--cn-name-grad-2) 55%, var(--cn-name-grad-3) 100%) !important;',
        '  -webkit-background-clip: text !important;',
        '  background-clip: text !important;',
        '  -webkit-text-fill-color: transparent !important;',
        '}',
        '',
        '/* 3a-3. Hero row. The host headline element is already flex with',
        '   align-items:center, but it also sets flex-wrap:wrap and our',
        '   subtitle side rules widened the title group until it wrapped,',
        '   leaving the logo alone on line 1. Force a single line. */',
        '/* 3a-3. Hero row. The subtitle is moved OUT OF FLOW (see ::after), so',
        '   this row is exactly one line tall and align-items:center puts the',
        '   mark on the headline centreline with no magic offset. fit-content',
        '   makes the row span logo..title only, so the absolute subtitle can',
        '   line up with that same left and right edge. padding-bottom',
        '   reserves the space the subtitle used to occupy. */',
        G + ' [class*="_headline"]:has(> [class*="_titleGroup"]) {',
        '  position: relative !important;',
        '  display: flex !important;',
        '  flex-wrap: nowrap !important;',
        '  align-items: center !important;',
        '  justify-content: center !important;',
        '  gap: 14px !important;',
        '  width: fit-content !important;',
        '  max-width: 100% !important;',
        '  margin: 0 auto !important;',
        '  padding-bottom: 42px !important;',
        '}',
        G + ' [class*="_headline"]:has(> [class*="_titleGroup"]) > * { flex: none !important; }',
        '',
        '/* 3b. New Session: its host rule has no background of its own.',
        '   Only the button gets the deep gold-brown wash; inner spans/icons stay',
        '   transparent, and host ::before/::after decorations are cleared. */',
        G + ' button[class*="_newSession"] {',
        '  background: var(--cn-brand-wash) !important;',
        '  border: 1px solid var(--cn-brand) !important;',
        '  border-radius: 10px !important;',
        '  box-shadow: none !important;',
        '  color: var(--cn-brand-ink) !important;',
        '}',
        G + ' button[class*="_newSession"]::before,',
        G + ' button[class*="_newSession"]::after { background: none !important; border: 0 !important; box-shadow: none !important; }',
        G + ' button[class*="_newSession"] span,',
        G + ' button[class*="_newSession"] svg {',
        '  background: transparent !important;',
        '  color: var(--cn-brand-ink) !important;',
        '}',
        G + ' button[class*="_newSession"]:hover { background: var(--cn-brand-wash-hover) !important; }',
        G + ' [data-composer-card] button[aria-label*="Send"],',
        G + ' [data-composer-card] button[aria-label*="发送"],',
        G + ' [data-composer-card] button[title*="Send"],',
        G + ' [data-composer-card] button[title*="发送"],',
        G + ' [data-composer-card] [class*="_trailing"] > button:last-child {',
        '  background-color: var(--cn-brand) !important;',
        '  color: #221B12 !important;',
        '  border: 1px solid var(--cn-brand) !important;',
        '  border-radius: 10px;',
        '}',
        G + ' [data-composer-card] [class*="_trailing"] > button:last-child:hover { filter: brightness(1.08); }',
        
        
        '/* 4. Blank-session copy. The Host renders hero.headline in the first',
        '   span of the title group; we zero it and draw two lines in its',
        '   pseudo-elements. The 预览版 badge is hidden (not removed) because',
        '   the :has() anchor above still needs it in the DOM. */',
        headline + ' {',
        '  font-size: 0;',
        '  letter-spacing: 0;',
        '  line-height: 1;',
        '}',
        headline + '::before {',
        "  content: '" + HERO_TITLE + "';",
        '  display: block;',
        '  font-size: 32px;',
        '  font-weight: 700;',
        '  letter-spacing: 0.02em;',
        '  line-height: 40px;',
        '  text-align: center;',
        '  background-image: linear-gradient(100deg, #A87A1E 0%, #7E5A16 52%, #4F3708 100%);',
        '  -webkit-background-clip: text;',
        '  background-clip: text;',
        '  -webkit-text-fill-color: transparent;',
        '}',
        headlineDark + '::before {',
        '  background-image: linear-gradient(100deg, #FFF0A7 0%, #E6BC4F 42%, #AD7617 100%);',
        '}',
        headline + '::after {',
        "  content: '" + HERO_SUBTITLE + "';",
        '  position: absolute !important;',
        '  left: 0 !important;',
        '  right: 0 !important;',
        '  bottom: 0 !important;',
        '  display: block;',
        '  margin-top: 0 !important;',
        '  padding: 0 56px;',
        '  font-size: 14px;',
        '  font-weight: 400;',
        '  letter-spacing: 0.12em;',
        '  line-height: 24px;',
        '  text-align: center;',
        '  color: var(--cn-ink-secondary);',
        '  background-image: linear-gradient(to right, var(--cn-brand), var(--cn-brand)), linear-gradient(to right, var(--cn-brand), var(--cn-brand));',
        '  background-size: 72px 1px, 72px 1px;',
        '  background-position: left center, right center;',
        '  background-repeat: no-repeat;',
        '}',
        G + ' [class$="_titleGroup"] > [class$="_previewBadge"] { display: none; }',
        '',
        '@media print {',
        G + ' body::before { display: none; }',
        '}',
      ].join('\n')
    }

    /** Idempotent: a mode change rewrites the same <style> node. */
    function installDom() {
      if (typeof document === 'undefined' || !document || !document.documentElement) {
        return function () {}
      }
      const root = document.documentElement
      if (!state.gateSet) {
        try {
          state.gatePrevious = typeof root.getAttribute === 'function' ? root.getAttribute(GATE_ATTR) : null
          root.setAttribute(GATE_ATTR, '1')
          state.gateSet = true
        } catch (error) {
          return function () {}
        }
      }

      let tag = null
      try {
        tag = typeof document.getElementById === 'function' ? document.getElementById(STYLE_ID) : null
      } catch (error) {
        tag = null
      }
      if (!tag) {
        tag = document.createElement('style')
        tag.id = STYLE_ID
        if (typeof tag.setAttribute === 'function') tag.setAttribute('data-plugin', '@local/hardware-agent-skin')
        const host = document.head || root
        if (host && typeof host.appendChild === 'function') host.appendChild(tag)
      }
      tag.textContent = buildCss()

      return function () {
        try {
          if (tag && tag.parentNode && typeof tag.parentNode.removeChild === 'function') {
            tag.parentNode.removeChild(tag)
          }
        } catch (error) {
          /* already gone */
        }
        try {
          if (state.gatePrevious === null || state.gatePrevious === undefined) root.removeAttribute(GATE_ATTR)
          else root.setAttribute(GATE_ATTR, state.gatePrevious)
          state.gateSet = false
          state.gatePrevious = null
        } catch (error) {
          /* nothing else to restore */
        }
      }
    }

    /** Sidebar footer: light/dark switch, backed by the Host theme service. */
    function ThemeToggle() {
      useSkinState()
      const zh = state.chinese
      const dark = state.mode === 'dark'
      const next = dark ? 'light' : 'dark'
      const label = dark ? (zh ? '深色' : 'Dark') : (zh ? '浅色' : 'Light')
      const hint = zh ? '切换到' + (dark ? '浅色' : '深色') : 'Switch to ' + (dark ? 'light' : 'dark')
      return h(
        'button',
        {
          type: 'button',
          'data-cn-theme-toggle': state.mode,
          title: hint,
          'aria-label': hint,
          'aria-pressed': dark,
          onClick: () => setMode(next),
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            margin: '0 8px',
            padding: '3px 10px 3px 8px',
            border: '1px solid rgba(128, 128, 128, 0.35)',
            borderRadius: '999px',
            background: 'transparent',
            color: 'inherit',
            font: 'inherit',
            fontSize: '11px',
            lineHeight: '16px',
            fontWeight: 600,
            cursor: 'pointer',
          },
        },
        [
          h('span', {
            key: 'dot',
            'aria-hidden': 'true',
            style: {
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: dark ? '#D4AF37' : '#9B7227',
              boxShadow: '0 0 0 1px rgba(128, 128, 128, 0.35)',
            },
          }),
          h('span', { key: 'label' }, label),
        ],
      )
    }

    // ------------------------------------------------------------------ plugin

    function activeIdOf(snapshot) {
      const active = snapshot && snapshot.active
      if (typeof active === 'string') return active
      if (active && typeof active === 'object' && typeof active.id === 'string') return active.id
      return ''
    }

    function isChinese(id) {
      return !id || String(id).toLowerCase().startsWith('zh')
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        try {
          const locale = ctx.get('locale')
          let activeId = ''
          try {
            activeId = locale && typeof locale.getSnapshot === 'function' ? activeIdOf(locale.getSnapshot()) : ''
          } catch (error) {
            activeId = ''
          }
          state.chinese = isChinese(activeId)

          const optional = (deps, run) => {
            try {
              if (typeof ctx.inject === 'function') ctx.inject(deps, (scoped) => run(scoped))
              else run(ctx)
            } catch (error) {
              console.warn('[circuitnexus] optional service "' + deps.join(',') + '" unavailable:', error)
            }
          }

          // Theme service: one token layer + the light/dark preference switch.
          optional(['theme'], (scoped) => {
            try {
              const theme = scoped.get('theme')
              if (!theme || typeof theme.overrideTokens !== 'function') return
              state.theme = theme
              try {
                const snapshot = typeof theme.getTheme === 'function' ? theme.getTheme() : null
                state.mode = resolveMode(snapshot)
              } catch (error) {
                /* keep the dark default */
              }
              scoped.effect(() => {
                const dispose = theme.overrideTokens(THEME_SOURCE, TOKENS)
                return () => {
                  if (typeof dispose === 'function') dispose()
                  state.theme = null
                }
              }, 'theme:circuitnexus')
            } catch (error) {
              console.warn('[circuitnexus] theme layer was not applied:', error)
            }
          })

          // Follow the Host when the user changes Appearance elsewhere.
          try {
            if (typeof ctx.effect === 'function') {
              ctx.effect(() => {
                const off = ctx.on('theme/change', (snapshot) => {
                  state.mode = resolveMode(snapshot)
                  notify()
                })
                return () => {
                  if (typeof off === 'function') off()
                }
              }, 'theme-change:circuitnexus')
            }
          } catch (error) {
            /* a composition without events still works with the footer button */
          }

          const seat = (key, options, component) => {
            try {
              ctx.slots.inject(key, () => ctx.slots.register(options, component))
            } catch (error) {
              console.warn('[circuitnexus] seat "' + key + '" was not registered:', error)
            }
          }

          seat('sidebar.brand.mark', { name: 'sidebar.brand.mark', priority: -10 }, (props) =>
            h(HardwareMark, {
              size: 32,
              className: props ? props.className : undefined,
              label: BRAND + ' ' + BRAND_CN,
            }),
          )
          seat('sidebar.brand.name', { name: 'sidebar.brand.name', priority: -10 }, () =>
            h(BrandName, { text: BRAND }),
          )
          seat('conversation.hero.brand.mark', { name: 'conversation.hero.brand.mark' }, (props) =>
            h(HardwareMark, {
              size: 52,
              className: props ? props.className : undefined,
              label: BRAND + ' ' + BRAND_CN,
            }),
          )
          seat(
            'sidebar.footer.action',
            { name: 'sidebar.footer.action', id: 'circuitnexus-theme-toggle', order: 40 },
            () => h(ThemeToggle, {}),
          )

          try {
            if (typeof document !== 'undefined' && document && document.documentElement) {
              if (typeof ctx.effect === 'function') {
                ctx.effect(() => installDom(), 'dom:circuitnexus')
              } else {
                installDom()
              }
            }
          } catch (error) {
            console.warn('[circuitnexus] stylesheet was not applied:', error)
          }
        } catch (error) {
          console.warn('[circuitnexus] skin was skipped:', error)
        }
      },
    }
  },
})
