#!/usr/bin/env python3
"""Export CircuitNexus SVG master assets into PNG/ICO previews for desktop and web.

Install dependencies: python -m pip install pillow cairosvg
Run: python tools/export_assets.py
No font files, external assets, API keys or network calls are required.
"""
from pathlib import Path
from PIL import Image
import cairosvg
import io

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "exports"
OUT.mkdir(parents=True, exist_ok=True)

def png(source, target, width):
    src = ROOT / source
    dst = OUT / target
    dst.parent.mkdir(parents=True, exist_ok=True)
    cairosvg.svg2png(url=str(src), write_to=str(dst), output_width=width)
    print(f"SVG -> PNG: {source} => {dst.relative_to(ROOT)}")
    return dst

for name in ["circuitnexus-logo", "circuitnexus-logo-dark", "circuitnexus-logo-light"]:
    png(f"assets/brand/logo/{name}.svg", f"logo/{name}-2000.png", 2000)

for name in ["circuitnexus-symbol-gold", "circuitnexus-symbol-hero-gold",
             "circuitnexus-symbol-light", "circuitnexus-symbol-white", "circuitnexus-symbol-black"]:
    png(f"assets/brand/logo/{name}.svg", f"logo/{name}-1024.png", 1024)

for theme in ["dark", "light", "board-green"]:
    for size in ([16,24,32,48,64,128,192,256,512,1024] if theme=="dark" else [32,64,128,256,512,1024]):
        png(f"assets/brand/app-icons/app-icon-{theme}.svg", f"app-icons/app-icon-{theme}-{size}.png", size)

for size in [16, 32, 48, 64, 180, 192, 512]:
    png("assets/brand/app-icons/favicon.svg", f"favicon/favicon-{size}.png", size)

for src, dest in [
    ("assets/brand/website/hero-background-dark.svg", "website/hero-background-dark-1600.png"),
    ("assets/brand/website/hero-background-light.svg", "website/hero-background-light-1600.png"),
    ("assets/themes/pcb/circuitnexus-pcb-dark-welcome.svg", "themes/pcb-dark-1920.png"),
    ("assets/themes/pcb/circuitnexus-pcb-light-welcome.svg", "themes/pcb-light-1920.png"),
    ("assets/themes/pcb/circuitnexus-pcb-dark-overlay.svg", "themes/pcb-dark-overlay-1920.png"),
    ("assets/themes/pcb/circuitnexus-pcb-light-overlay.svg", "themes/pcb-light-overlay-1920.png"),
    ("assets/guides/theme-dark-board.svg", "guides/theme-dark-board-1600.png"),
    ("assets/guides/theme-light-board.svg", "guides/theme-light-board-1600.png"),
    ("assets/brand/website/og-card-dark.svg", "website/og-card-dark-1200.png"),
    ("assets/brand/website/og-card-light.svg", "website/og-card-light-1200.png")
]:
    if (ROOT / src).is_file():
        width = 1920 if "1920" in dest else (1200 if "1200" in dest else 1600)
        png(src, dest, width)

for item in sorted((ROOT / "assets/brand/website/feature-icons").glob("*.svg")):
    png(str(item.relative_to(ROOT)), f"website/feature-icons/{item.stem}-96.png", 96)

def make_ico(base_png, filename, sizes):
    original = Image.open(base_png).convert("RGBA")
    dest=OUT/filename
    dest.parent.mkdir(parents=True,exist_ok=True)
    original.save(dest,format="ICO",sizes=[(s,s) for s in sizes],bitmap_format="png")
    print(f"PNG -> ICO: {dest.relative_to(ROOT)}")

make_ico(OUT/"app-icons/app-icon-dark-1024.png","app-icons/CircuitNexus-app.ico",[16,24,32,48,64,128,256])
make_ico(OUT/"favicon/favicon-512.png","favicon/favicon.ico",[16,32,48])
print(f"Export complete: {OUT}")
