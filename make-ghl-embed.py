#!/usr/bin/env python3
"""Build hub-GHL-embed.html: the Melody Circle hub as one self-contained block that
survives being pasted inside GoHighLevel's own <body> (Custom Code element).
Rules from system/LESSONS.md: no html/body/head, one wrapper id, ground carried twice,
CSS scoped under the wrapper, runtime pass that clears GHL's ancestor wrappers."""
import re, sys, pathlib

BUILD = pathlib.Path("/Users/javier/Design - Funnels - Website /builds/melody-circle-funnel")
BASE = "https://javmartz04-ship-it.github.io/melody-circle/"
ROOT = "#mc-root"

html = (BUILD / "hub.html").read_text()
css = (BUILD / "assets/home.css").read_text() + "\n" + (BUILD / "assets/hub.css").read_text()
js = "\n".join((BUILD / f"assets/{n}").read_text() for n in ("events.js", "melody.js", "hub.js"))
assert "</script" not in js.lower()

# ---------- body markup ----------
body = html.split("<body>", 1)[1].split("</body>", 1)[0]
body = re.sub(r'<script src="assets/[^"]+"></script>\s*', "", body)
body = body.replace('href="index.html"', f'href="{BASE}"')
body = re.sub(r'(src|href)="assets/', rf'\1="{BASE}assets/', body)
body = body.replace('href="', 'href="', 1)
assert "assets/" not in re.sub(r'https://[^"\s]+', "", body), "unresolved relative asset"

# ---------- css scoping ----------
def strip_comments(s):
    return re.sub(r"/\*.*?\*/", "", s, flags=re.S)

def scope_selector(sel):
    sel = sel.strip()
    if not sel:
        return sel
    if sel == ":root":
        return ROOT
    if sel == "html":
        return "html"
    if sel == "body":
        return ROOT
    if sel.startswith("html.") or sel.startswith("html["):
        # html.fonts-in .x  ->  html.fonts-in #mc-root .x
        head, _, rest = sel.partition(" ")
        return f"{head} {ROOT} {rest}".strip()
    if sel.startswith("body."):
        head, _, rest = sel.partition(" ")
        return f"{head} {ROOT} {rest}".strip() if rest else head  # body.sheet-open{overflow:hidden} stays on host body
    if sel.startswith("*"):
        return f"{ROOT} {sel}"
    return f"{ROOT} {sel}"

def scope(block):
    """Walk rules at one nesting level."""
    out, i, n = [], 0, len(block)
    while i < n:
        j = block.find("{", i)
        if j < 0:
            out.append(block[i:]); break
        prelude = block[i:j].strip()
        # find matching brace
        depth, k = 1, j + 1
        while k < n and depth:
            if block[k] == "{": depth += 1
            elif block[k] == "}": depth -= 1
            k += 1
        inner = block[j + 1:k - 1]
        if prelude.startswith("@media") or prelude.startswith("@supports"):
            out.append(f"{prelude}{{{scope(inner)}}}")
        elif prelude.startswith("@keyframes") or prelude.startswith("@font-face") or prelude.startswith("@"):
            out.append(f"{prelude}{{{inner}}}")
        else:
            sels = ",".join(scope_selector(s) for s in prelude.split(","))
            out.append(f"{sels}{{{inner}}}")
        i = k
    return "".join(out)

scoped = scope(strip_comments(css))
assert ":is(" not in css and ":where(" not in css

reset = f"""
/* ---- element reset inside the wrapper: GHL themes style bare tags, the design styles classes ---- */
{ROOT} div,{ROOT} span,{ROOT} section,{ROOT} article,{ROOT} aside,{ROOT} nav,{ROOT} header,{ROOT} footer,{ROOT} main,{ROOT} form,{ROOT} figure,{ROOT} figcaption,{ROOT} label,{ROOT} small,{ROOT} b,{ROOT} strong,{ROOT} em,{ROOT} i,{ROOT} ul,{ROOT} li,{ROOT} h1,{ROOT} h2,{ROOT} h3,{ROOT} h4,{ROOT} p,{ROOT} a{{background:transparent; margin:0; padding:0; border:0; border-radius:0; box-shadow:none; text-shadow:none; text-decoration:none; text-transform:none; letter-spacing:normal; max-width:none; float:none; color:inherit; font-family:inherit; line-height:inherit; text-align:inherit; opacity:1}}
{ROOT} h1,{ROOT} h2,{ROOT} h3,{ROOT} h4{{font-weight:inherit; font-style:normal}}
{ROOT} b,{ROOT} strong{{font-weight:700}} {ROOT} em,{ROOT} i{{font-style:italic}}
{ROOT} ul,{ROOT} li{{list-style:none}}
{ROOT} img{{display:block; max-width:100%; height:auto; margin:0; padding:0; border:0; border-radius:0; box-shadow:none}}
{ROOT} button,{ROOT} input,{ROOT} select,{ROOT} textarea{{font:inherit; color:inherit; background:none; margin:0; padding:0; border:0; border-radius:0; box-shadow:none; text-shadow:none; text-transform:none; letter-spacing:normal; line-height:inherit; min-height:0; height:auto; width:auto; -webkit-appearance:none; appearance:none; outline:none}}
{ROOT} button{{cursor:pointer}}
"""

armor = f"""
/* ---- GHL armor: the wrapper is the page ---- */
{ROOT}{{display:inline-block; vertical-align:top; width:100%; max-width:none; min-height:100vh; margin:0; padding:0; border:0; box-shadow:none; text-shadow:none; text-decoration:none; text-align:left; letter-spacing:normal; text-transform:none; float:none; position:relative; isolation:auto; overflow:visible}}
{ROOT} .mc-plate{{position:fixed; inset:0; z-index:-2; background:var(--ground); pointer-events:none}}
{ROOT} *{{text-decoration:none}}
{ROOT} u,{ROOT} ins{{text-decoration:underline}}
"""

# ---------- runtime armor ----------
armor_js = """
(function(){
  var root=document.getElementById('mc-root'); if(!root) return;
  var ground='#F8F1E7';
  function clear(){
    var el=root.parentElement;
    while(el && el!==document.documentElement){
      var s=el.style;
      s.setProperty('background','transparent','important');
      s.setProperty('background-color','transparent','important');
      s.setProperty('background-image','none','important');
      s.setProperty('padding','0','important');
      s.setProperty('margin','0','important');
      s.setProperty('max-width','none','important');
      s.setProperty('width','auto','important');
      s.setProperty('border','0','important');
      s.setProperty('box-shadow','none','important');
      s.setProperty('transform','none','important');
      s.setProperty('filter','none','important');
      s.setProperty('perspective','none','important');
      s.setProperty('overflow','visible','important');
      el=el.parentElement;
    }
    var b=document.body, h=document.documentElement;
    b.style.setProperty('background',ground,'important'); h.style.setProperty('background',ground,'important');
    b.style.setProperty('margin','0','important'); b.style.setProperty('padding','0','important');
  }
  clear(); window.addEventListener('load',clear); setTimeout(clear,400); setTimeout(clear,1500); setTimeout(clear,4000);
})();
"""

fonts = '<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Nunito:wght@400;500;600;700&display=swap" rel="stylesheet">'

embed = f"""<!-- Melody Circle · hub page · GoHighLevel embed. Paste the whole thing into one Custom Code element on an otherwise empty page. Built from builds/melody-circle-funnel (hub.html + assets). Images load from {BASE}. -->
{fonts}
<style>
{reset}
{scoped}
{armor}
</style>
<div id="mc-root">
<div class="mc-plate" aria-hidden="true"></div>
{body.strip()}
<script>{armor_js}</script>
<script>
{js}
</script>
</div>
"""
out = BUILD / "hub-GHL-embed.html"
out.write_text(embed)
print(out, len(embed.encode()) // 1024, "KB")
