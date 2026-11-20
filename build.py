"""Bundles src/ into one self-contained page: _site/index.html (assets inlined as data URIs)."""
import base64, pathlib, re, sys

root = pathlib.Path(__file__).parent
src_dir = root / "src"
out_dir = root / (sys.argv[1] if len(sys.argv) > 1 else "_site")

html = (src_dir / "index.src.html").read_text()

def asset(m):
    p = src_dir / "assets" / m.group(1)
    mime = "image/svg+xml" if p.suffix == ".svg" else "image/png"
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()

html = re.sub(r"\{\{ASSET:([^}]+)\}\}", asset, html)
ball = re.sub(r"^export ", "", (src_dir / "ball-field-background.js").read_text(), flags=re.M)
html = html.replace("{{BALLFIELD}}", ball).replace("{{ORB}}", (src_dir / "voice-orb.js").read_text())
assert "{{" not in html.split("<script", 1)[0], "unresolved placeholder"

out_dir.mkdir(parents=True, exist_ok=True)
(out_dir / "index.html").write_text(html)
(out_dir / ".nojekyll").write_text("")
print(f"built {out_dir / 'index.html'} ({len(html):,} bytes)")
