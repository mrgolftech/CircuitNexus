# dsh-plugin

DeepSeek Harness 硬件工作台的三个插件/预设。

| 目录 | 包名 | 版本 | 作用 |
| --- | --- | --- | --- |
| `hardware-review/` | `@local/dsh-plugin-hardware-review` | 1.0.0 | OrCAD 原理图评审工作台：以网表 / BOM / 数据手册为证据来源，结论须可追溯到 net/pin 与手册页码 |
| `schematic-design/` | `@local/dsh-plugin-schematic-design` | 1.0.0 | KiCad 原理图设计工作台 |
| `hw-preset/` | `@local/dsh-hw-preset` | 0.1.0 | Agent preset：`hw-review`（硬件评审），在新建会话的模式列表里增加一项 |

## 安装

三个包都用本地安装（`link:` 或 `install_bundle` 指向本目录）：

```powershell
# 逐个装：把 <repo>\dsh-plugin\<插件目录> 的绝对路径传给 plugin_manager 的 install_bundle
plugin_manager -> install_bundle(target = "<repo>\dsh-plugin\hardware-review")
```

装好后需 `set_bundle(false)` -> `set_bundle(true)`，或重启 DSH，bundle 才会重新组合生效。

## 边界

- 这三个包是 **Agent 侧的插件 / 预设**，不改变宿主应用名、窗口标题、任务栏图标或安装器元数据（那是 DSH Fork 路线）。
- 本仓库目前**没有 LICENSE 文件**。仓库公开可见，但品牌素材与插件代码的对外复用许可尚未确定，商用前请先做授权与商标清查。
