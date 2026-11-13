# CircuitNexus 落地页 · landingpage

此目录是**可独立部署的自包含落地页**：`index.html` 引用的品牌资产、主题 Token、原型图都在本目录的 `assets/` 下，不依赖仓库其它目录结构。

- `index.html` — 单页产品介绍；亮 / 暗双主题、中英切换（默认中文）、响应式。
- `assets/` — 从仓库根 `assets/` 同步的同源资产副本（SVG / PNG / JPG / ICO / CSS）。SVG 为可编辑源，PNG / ICO 由 `tools/export_assets.py` 从源 SVG 导出。
- 线上地址：`https://circuit.1616516.xyz/`（服务器目录 `/root/httpd/website/circuitnexus/`，Nginx Proxy Manager 反代 + Cloudflare DNS）。

## 本地预览

在仓库根目录执行：

```sh
python3 -m http.server 8000
```

然后打开 `http://127.0.0.1:8000/landingpage/`。

## 更新流程

1. 修改 `landingpage/index.html`；
2. 新增或替换资产时，把同源文件放到 `landingpage/assets/` 的对应路径；
3. 同步到服务器部署目录 `/root/httpd/website/circuitnexus/` 后，刷新线上页面验证亮 / 暗主题与中英切换。

品牌、配色与视觉约束以 `docs/UI_VISUAL_SPEC_V1.md`、`docs/UI_GUIDELINES.md` 与 `assets/tokens/` 为准；能力成熟度说明见 `docs/STATUS.md`。
