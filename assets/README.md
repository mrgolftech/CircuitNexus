# CircuitNexus 设计素材

| 路径 | 用途 |
|---|---|
| `brand/logo/` | 正式标志、深浅字标、金/白/黑独立 C |
| `brand/app-icons/` | 桌面深浅/板卡绿 SVG 图标和网站 favicon |
| `brand/website/` | 官网 Hero、8 个功能图标、社交分享 OG |
| `themes/pcb/` | 深浅背景和透明叠层 SVG |
| `tokens/` | 品牌与 UI 配色 CSS/JSON |
| `guides/` | 可编辑的两主题 UI 设计准则展示板（SVG） |
| `exports/` | 自动从 SVG 导出的 PNG/ICO，供官网/客户端直接使用 |

## 选用原则
- SVG 是权威可编辑源文件；PNG/ICO 是派生物。
- Dark 应用图标作为默认 Windows 安装/任务栏图标，不因应用主题切换。
- 主页背景仅用四角 PCB 装饰，不可进入长文/图表/网表正文。
- 颜色/尺寸的约束以 `../docs/` 和 `tokens/` 为准，展示板仅用于视觉核对。
- 生成派生资产：`python -m pip install pillow cairosvg && python tools/export_assets.py`（从仓库根目录执行）。
