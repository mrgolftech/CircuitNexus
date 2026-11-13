# CircuitNexus · 电路智枢 — DSH Web 外观插件

把 DeepSeek Harness 的 Web 界面换成 **CircuitNexus（Precision Black & Gold｜精密黑金）** 品牌外观。
插件是纯装饰层：不启动进程、不读写文件、不注册 Host 服务，所有改动通过 Harness 公开的 Slot、
`theme.overrideTokens` 与一条注入的样式表完成。

| 项 | 值 |
| --- | --- |
| 包名 | `@local/hardware-agent-skin` |
| 版本 | 1.26.0 |
| 位置 | `dsh-plugins/hardware-agent-skin` |
| 品牌与设计事实来源 | [mrgolftech/CircuitNexus](https://github.com/mrgolftech/CircuitNexus)（design baseline 2026-11-12 v1.0） |
| 安装方式 | `plugin_manager` → `install_bundle`（绝对路径） |
| 依赖 | 无（`dsh.client` 只做激活排序，不 import 任何 Harness Client 包） |

## 品牌定稿（来自上游仓库，不得擅自改变）

| 项 | 定稿内容 | 依据 |
| --- | --- | --- |
| 名称 | **CircuitNexus｜电路智枢**，弃用 HardBuddy | README.md:21-27、BRAND_IDENTITY.md:4-10、DECISIONS.md:7,11 |
| 定位 | AI 硬件研发工作台 / AI Hardware Engineering Workspace | README.md:23 |
| 视觉 | Precision Black & Gold｜精密黑金 | BRAND_IDENTITY.md:7 |
| Logo | 开放式几何 C + 三条等宽 PCB 走线 + 三个环形焊盘；旧 H 芯片标志废弃 | BRAND_IDENTITY.md:12-28 |
| 两套主主题 | Dark 石墨黑金 / Light 暖白香槟金；**Board Green 仅延展，本插件不发售** | README.md:26 |
| 欢迎语 | 主标题「开启智能硬件研发工作流」；副标题「CircuitNexus · AI 硬件研发工作台」 | UI_VISUAL_SPEC_V1.md:24、UI_PROTOTYPE_HANDOFF.md:8-9 |
| 背景 | 四角 PCB 走线 + 稀疏点阵、中央留白；正文/网表/报告页降到 4–6% 或隐藏 | UI_VISUAL_SPEC_V1.md:27,62-66 |
| 对比度 | Light 小金字必须 `#805C1E`（5.67:1），`#C79A3B`（2.42:1）禁止作小字 | THEME_LIGHT.md:26-29 |

## 本插件实现了什么

| 位置 | 实现 |
| --- | --- |
| 侧栏品牌标识 | `sidebar.brand.mark`：官方 **`circuitnexus-symbol-hero-gold.svg`** 完整结构（开放 C + 三条等宽 45° 走线 + 三个环形焊盘）与金属渐变 `#FFF0A7→#E6BC4F→#AD7617`，内联 React，**32px** |
| 侧栏品牌名 | `sidebar.brand.name`：**CircuitNexus**（产品名不翻译），17px / 700 |
| 空会话标识 | `conversation.hero.brand.mark`：**同一个 hero-gold 标识**，放大到 **52px** |
| 空会话文案 | `hero.headline` 的 span 字号归零：`::before` 主标题 32px **金色渐变文字**（`background-clip:text`），`::after` 副标题 14px 居中带左右 72px 金线；副标题**绝对定位**出流后横跨「Logo + 主标题」整个宽度，hero 行 `width:fit-content` 因此只有一行高，Logo 与标题自动同中心线（无需像素补偿）；Logo 的 `transform` 按**墨迹范围**居中，不是按 viewBox 居中 |
| 预览版角标 | `display:none` 隐藏（**不移除**——标题选择器靠它做 `:has()` 锚点） |
| 左下角按钮 | `sidebar.footer.action`：**亮暗切换**，调用宿主 `theme.setTheme('light'\|'dark')` |
| 主题 token | `theme.overrideTokens` 一层 7 个 `--dsw-*`，明暗成对，由宿主 presenter 选择 |
| PCB 背景 | **CSS 径向渐变铺底**（随视口自适应、不裁切）+ 官方 overlay SVG 走线层（`contain` 完整显示）；**所有页面常显** |
| 品牌控件 | 侧栏「新会话」= 深金褐底 + 金边 + 深金字（覆盖全部子元素）；输入框发送按钮 = 金底 `#221B12` 字（唯一实心主 CTA） |

### Token 映射（`assets/tokens/circuitnexus-theme-tokens.json` → `--dsw-*`）

| `--dsw-*` token | Light（暖白香槟金） | Dark（石墨黑金） | 上游语义 |
| --- | --- | --- | --- |
| `bg-base` | `#FBF7EF` | `#0D0E10` | canvas |
| `bg-layer-1` | `#FFFFFF` | `#23262C` | surface-raised |
| `bg-layer-2` | `#FFFCF8` | `#1D2025` | surface |
| `border-l1` | `#E4D9C7` | `#3C3D42` | border |
| `border-l2` | `#9B8768` | `#646065` | border-strong |
| `sidebar-fill` | `#F4E9D8` | `#16181D` | sidebar |
| `brand-primary` | **`#805C1E`** | `#D4AF37` | brand-text / brand |

**为什么 Light 的 brand-primary 是 `#805C1E` 而不是品牌金 `#C79A3B`**：品牌金在暖白底上只有
2.42:1，连 WCAG AA 大字（3:1）都不到。THEME_LIGHT.md:26 明确禁止它作文字色。非文字的品牌金
以 `--cn-brand: #C79A3B` 单独提供，供装饰/按钮使用。`label-*` 文字 token 一律不碰，正文对比度
仍由宿主保证。

### 亮暗切换

按钮调宿主 `theme.setTheme(id)`（`THEME_PREFERENCES = light|dark|system`，写入 `ui-theme.preference`），
宿主 presenter 自动选择我们 `{light, dark}` 成对 token 中的一套；插件同时订阅 `theme/change`，
所以在设置 → 外观里改主题，左下角按钮也会同步。无 theme 服务时不会崩，只是按钮不起作用。

### 背景策略（1.15.0 修正，1.16.0 再修「两页不一致」）

1.14.0 把官方 `welcome.svg`（1440×900、自带底色）用 `background-size: cover` 铺在 `body::before`，
结果**被视口裁切**（"只显示了一部分"）、**列不透明把中心盖住**（"没有渐变质感"）、
**正文页只留 5% overlay 且列全不透明**（"有对话的页面看不到纹理"）。三个现象同一个根因。
1.15.0 改成 CSS 渐变 + `contain` 走线，但还留了「空会话页 0.55 / 正文页 0.16」和「空会话页列透明」
两处分级，用户实测**点击发送后两个页面背景不一样、正文页仍看不到纹理**。1.16.0 把分级全部去掉。

现在只有一套、所有页面完全一致：

```
html                    → CSS radial-gradient（视口自适应、不裁切）
  Dark : #0F1013 中心 → #17171A → #262320 四角（原型实测四角更暖亮）
  Light: #FCF6F0 中心 → #F6EBDD → #E9DDCF 四角（原型实测四角更暖暗）
body::before            → 官方 overlay SVG（透明走线 + 点阵）
  background-size: 100% 100%（单层：官方 overlay + 内联扩展，无平铺）
  opacity: var(--cn-trace-alpha) —— 按页面分档：
    欢迎页 Light 1.00 / Dark 0.80   对话页 Light 0.50 / Dark 0.40
    对应亮度对比：Light 1.94 / 1.28，Dark 3.65 / 1.44（1.5:1 以上可辨、2.5:1 以上开始干扰文字）
列 / 页面               → --cn-paper 半透明（light .32 / dark .45），所有页面同一条规则
画布底漆                → --dsw-alias-bg-base 带 0.10 alpha（不透明值会把纹理整层盖掉）
  卡片/输入框仍用不透明 --dsw-alias-bg-layer-1
```

原型像素实测（1672×941，`checkdemo/outputs/circuitnexus-skin/` 内两张 PNG）：
Dark 网格中心 `#17181A`、四角 `#262524`/`#2D2925`；Light 中心 `#FCF6F0`、四角 `#E9DDCF`/`#EFE6DC`。
**两套渐变方向不同**（亮色不是暗色简单反相，THEME_LIGHT.md 开篇即强调），所以没有用同一条渐变取反。

按 `body[data-ds-dark-theme]` 自动切换 dark/light 走线版本。`_frame` 置透明（Windows 宿主会拿不透明
token 刷整框，盖住负 z-index 层）；列与嵌套页面沿用 paper model 规则，避免双层纸面。

## 改了什么 / 依据与风险

### 已核对通过

- `node --check client.js` / `index.js` / `smoke.cjs`：通过；`package.json` JSON 解析通过
- `node smoke.cjs`：**99 项断言全过**——4 个座位契约、7 个 token 且不含 `label-*`、
  Light/Dark 品牌墨色对比度（由测试重算，≥4.5:1）、2 张官方 overlay SVG 的 data URI、
  **两行欢迎语、完整 C + 三走线 + 三焊盘 + 三段金属渐变、侧栏 32px / hero 52px、品牌名 17px、
  CSS 径向渐变、`contain` 不裁切、纹理 0.32 全页面统一、新会话/发送按钮金色规则、副标题左右横线、品牌行居中与 logo 防裁切**
  `:has()` 锚点、预览版角标隐藏、Windows frame 透明、亮暗切换与 `theme/change` 同步、
  英文 UI、服务全缺不崩、座位被拒不影响其余、dispose 回滚
- 官方 4 张 PCB SVG 与 9 个品牌 SVG 源件留在 `assets/`，PNG/ICO 未手工复制
- 原型图已落到 `checkdemo/outputs/circuitnexus-skin/{dark,light}-welcome.png`，供目视验收对照

### 已证实问题 / 明确边界（不补全成合理故事）

1. **插件 ≠ Fork，品牌统一没做完。** 上游 V0.1 验收第 1 条要求「应用名、图标、任务栏、安装器
   完全统一为 CircuitNexus」（STATUS.md:31），但那是 `INTEGRATION_PLAN.md` 的 DSH Fork 路线。
   本插件只能改 Web UI 内的品牌位；窗口标题、任务栏图标、安装器元数据、应用显示名**未改**。
   STATUS.md:16 也明确「DSH 品牌 Fork / 安装器：规划中，未在本仓库完成打包」。
2. **授权缺口。** 上游 public 仓库**没有 LICENSE 文件**，README.md:67-69 写明「品牌素材、第三方依赖、
   DSH 源码并不自动属于同一许可证」「商标与近似标识正式商用前还需清查」。本插件内联了上游
   SVG，是作为仓库所有者提供的原创素材使用；**正式商用/对外分发前请补一份书面授权与商标清查**。
3. **无实机渲染验证。** 本机沙箱禁止 Chromium 创建命名管道，headless 起不来；上游 STATUS.md:28
   也承认「运行时截图验收仍未完成」。16/24/32px 小图标、100/125/150% 缩放、16:9/16:10/窄窗口、
   以及 `contain` 在不同宽高比下的留白，都只做了原型像素采样与 CSS/断言的静态核对，**未做目视验收**。
   按钮选择器同样未在真实 DOM 上验证，见「视觉验收」一节。
4. **DOM 文案仍与视觉不一致。** 标题靠 `::before/::after` 重落字，`hero.headline` 的 DOM 文本
   仍是「探索未至之境」（宿主 i18n），屏幕阅读器与复制粘贴拿到的是原文。这是 CSS 重落字方案的固有代价。
5. **标题选择器依赖「预览版」角标存在于 DOM**。它被 `display:none` 隐藏但没删；若上游某版本
   不再渲染该角标，标题会静默变回原文，壁纸与配色不受影响。
6. `body::before/::after`、`_frame`、`_centerCol` 等依赖宿主 CSS Module 局部类名，宿主改结构会静默失效。

## 视觉验收（需你在 GUI 里确认）

原型（上游 `assets/ui/prototypes/`，本地副本在 `checkdemo/outputs/circuitnexus-skin/`）：

![Dark 欢迎页原型](../../checkdemo/outputs/circuitnexus-skin/dark-welcome.png)
![Light 欢迎页原型](../../checkdemo/outputs/circuitnexus-skin/light-welcome.png)

本机**没有浏览器渲染能力**（沙箱禁命名管道，Chromium 起不来），所以我做的是可核查的静态核对
（原型像素采样、CSS 规则、断言），**不是运行截图**。重启 DSH 后请按这张表逐项目视验收：

| 验收点 | 期望 | 依据 |
| --- | --- | --- |
| 左上 Logo | 金色渐变 C + 三走线 + 三焊盘，32px，与原型同构 | hero-gold.svg |
| 左上名称 | `CircuitNexus`，17px/700，**与主标题同款金色渐变文字**（`background-clip:text`，亮 `#825D1D→#46300A` 4.95:1 / 暗 `#FFF0A7→#AD7617` 4.55:1），覆盖宿主拆色的子 span | 用户要求统一质感 |
| 欢迎页 Logo | 同上，52px | 用户要求两处都用 hero-gold |
| 背景渐变 | 四角暖、中心净，深浅方向不同，无矩形边界 | 原型像素实测 |
| PCB 走线 | 四角完整可见、不裁切；**有对话的页面也能看到、且与欢迎页同一背景** | `contain` + 按明暗取 alpha（Light .85 / Dark .32） |
| 新会话按钮 | 深金褐底 + 金边 + 深金字，`button[class*="_newSession"]` 命中并清掉宿主伪元素（次要） | 原型该区域 dark `#614F34` 采样 |
| 发送按钮 | 金底 `#221B12` 字，每屏唯一实心主 CTA | THEME_DARK.md:27 |
| 缩放 | 100/125/150% 与 16:9/16:10/窄窗口均不遮挡输入框 | UI_VISUAL_SPEC_V1.md §7 |

按钮选择器（`[class$="_newSession"]`、`[data-composer-card] [class$="_trailing"] > button:last-child`、
`aria-label*="Send"`）依赖宿主 CSS Module 局部类名与可访问名，**未在真实 DOM 上验过**；
若某个按钮没变金色或误伤了别的控件，把 DevTools 里该按钮的实际 class/aria-label 发我，我收窄选择器。

## 修改素材

- 2 张官方 PCB **overlay** SVG 以**可编辑源码**（非 base64）内联在 `client.js` 的 `PCB_SVG` 常量里，
  运行时 `encodeURIComponent` 成 data URI；渐变底由 CSS 生成。4 张官方 SVG 全部留在 `assets/` 作溯源，
  改走线请同时改两处（副本不参与运行时加载）。
- Logo 是 `HardwareMark` 里的官方 `circuitnexus-symbol-hero-gold.svg` 路径数据与渐变
  （256 viewBox 缩放到 32）；渐变 id 按尺寸派生，避免两个实例串色。包图标是根目录 `icon.svg`。
- 改完跑 `node smoke.cjs`（99 项）再重新打发布包。本插件**没有构建步骤**，不要引入 base64 大字符串。

## 启用 / 停用

- 生效：profile 的 client bundle 在 graph 组合时缓存，改完 JS 需 `plugin_manager set_bundle(false)`
  → `set_bundle(true)`，或**重启 DSH**（`link:` 安装时源文件即插件本体）。
- 停用：`set_bundle(enabled: false)`；dispose 会移除注入的 `<style>` 与 `html[data-circuitnexus-skin]`。
- 卸载：`remove_bundle`，`target: "@local/hardware-agent-skin"`。
- 回退品牌：用 `hardware-agent-skin-v1.13.1-*.zip` 覆盖同一目录（HardBuddy 旧品牌，仅作回滚用）。

## 变更记录

| 版本 | 1.26.0 |
| --- | --- |
| 1.26.0 | 清理：删除两层方案遗留的 `circuitnexus-pcb-tile-*.svg`（已无引用）；发布到 `mrgolftech/CircuitNexus` 的 `dsh-theme/` 目录 |
| 1.25.0 | 背景改回单层：把点阵/走线/过孔/阻容/蛇形线直接写进官方 overlay（`…-overlay-ext.svg`，由官方原件生成，保持原件不动），移除 280px 平铺贴图层 |
| 1.24.0 | 蛇形线由 90° H/V 折角改为 45° 折线（4 段斜线 dx=dy=40 + 5 段水平线各 40，段长全部相等），修掉直角走线 |
| 1.23.0 | 贴图重画：去掉全出血横竖通线，改为 5×5 规则发光过孔点阵 + 散布 45° 走线与钻孔 + 电阻/电容封装 + 等长蛇形线（45° 折线、段长相等；所有 motif 均在框内，平铺无缝） |
| 1.22.0 | 纹理改为矢量贴图：发光过孔点 + PCB 走线 + 电阻/电容符号（600×600 无缝平铺，280px 重复），移除上一版的 CSS 斜线网格 |
| 1.21.0 | 纹理补面积并分档：官方 overlay 只有四角有走线，中间大片空白 —— 叠加两层全屏 45°/135° 走线网格填补；欢迎页浓（Light 1.00 / Dark 0.80）、对话页淡（Light 0.50 / Dark 0.40），亮度对比 Light 1.94/1.28、Dark 3.65/1.44 |
| 1.20.2 | 纹理改为 `background-size: 100% 100%`（cover 裁四角、contain 缩小，都不是"完整显示"）；暗色层叠对比度由 1.22:1 提到 **1.80:1**（trace .32→.55、paper .60→.45），透过率 36%→50% |
| 1.20.1 | 修「会话页看不到纹理」：`--dsw-alias-bg-base` 由不透明改为 0.10 alpha（宿主拿它刷页面根与输入框周边，不透明即等于盖住壁纸）；overlay 由 `contain` 改 `cover`（1585×186 视口下 contain 缩放比仅 0.207，纹理只剩中间一小块）；清掉 `:has(> [data-composer-card])` 的底色。层叠后纹理对比度 1.34:1 → 1.54:1，透过率 42% → 61% |
| 1.20.0 | 产品名加金色渐变（与主标题同款，按 17px 正文字号反推可读档位）；Logo 的 transform 改为按**墨迹范围**居中（墨迹 y 42..826，中心 434 而非 viewBox 中点 512），修掉「看着还差一点」的残留 |
| 1.19.0 | 副标题改绝对定位（出流后 hero 行只剩一行高，Logo 与标题自动同中心线，去掉 -6px 魔数；`width:fit-content` + 左右 0 让副标题横跨 Logo..标题）；品牌名统一品牌金，修掉暗色下「Circuit 白 / Nexus 金」 |
| 1.18.0 | 按用户截图像素量测修正：hero Logo 中心原低于标题 14px（对齐了标题+副标题整块而非标题行）→ `align-items:flex-start` + `margin-top:-6px`；品牌名原低 2.5px → `top:-2px`；标题改为金色渐变文字（亮色档位为可读版 #A87A1E/#7E5A16/#4F3708，暗色用 Logo 原档 #FFF0A7/#E6BC4F/#AD7617） |
| 1.17.0 | 修 3 项残留：品牌行强制 flex 居中并清掉宿主 1px 偏移（名称与 Logo 对齐）、新会话按钮改用 `button[class*="_newSession"]` 并清掉伪元素（`$=` 选择器被宿主状态类打断是上一版失效的真因）、浅色模式走线 alpha 0.32→0.85（合成对比度 1.11:1→1.51:1） |
| 1.16.0 | 修 5 项视觉反馈：两页背景统一（去掉 0.55/0.16 与空会话列透明分级）、新会话按钮覆盖全部子元素并加深、logo 防裁切、品牌名垂直居中、副标题加左右金线 |
| 1.15.0 | 按原型修视觉：两处 Logo 换 `circuitnexus-symbol-hero-gold.svg` 完整渐变 C（32/52px）、品牌名 17px、CSS 径向渐变铺底 + `contain` 走线层（所有页面可见、不裁切）、新会话/发送按钮金色化 |
| 1.14.0 | 按 CircuitNexus 定稿全量重做：产品名/Logo/欢迎语/Token/官方 PCB 背景；移除 Board Green 配色切换，改为亮暗切换 |
| 1.13.1 | 品牌名 HardBuddy（已废弃） |
| 1.13.0 | 接入 HardBuddy 图标包（已废弃） |
| 1.12.x | 隐藏预览版角标、Logo 重绘（已废弃） |
| 1.10–1.11 | PCB 壁纸、板卡绿/黑金切换（已废弃） |
| 1.9.0 | 修 Web 启动崩溃、撤掉语言包 |
