"""Generate the brand SVGs. Development dependency: fonttools.

Uses public/fonts/Manrope.ttf and its included license, with no system fonts.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parents[1]
font = instantiateVariableFont(TTFont(ROOT / "public/fonts/Manrope.ttf"), {"wght": 600})
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
scale = 40 / font["head"].unitsPerEm
pen = SVGPathPen(glyphs)
x = 62.0
for character in "Savia":
    glyph = glyphs[cmap[ord(character)]]
    glyph.draw(TransformPen(pen, (scale, 0, 0, -scale, x, 38)))
    x += glyph.width * scale - 0.8
width = round(x + 4)
wordmark = pen.getCommands()

# Interlocking ribbons, without an initial or surrounding tile.
loop_a = "M15 7a4.25 4.25 0 0 1 6 0l10 10a4.25 4.25 0 0 1 0 6L21 33a4.25 4.25 0 0 1-6 0L5 23a4.25 4.25 0 0 1 0-6Z"
loop_b = "M27 15a4.25 4.25 0 0 1 6 0l10 10a4.25 4.25 0 0 1 0 6L33 41a4.25 4.25 0 0 1-6 0L17 31a4.25 4.25 0 0 1 0-6Z"
symbol = f'<g fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"><path d="{loop_a}"/><path d="{loop_b}"/></g>'

def logo(ink, accent):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} 48" color="{accent}">{symbol}<path d="{wordmark}" fill="{ink}"/></svg>'

assets = {
    "savia-logo-v5.svg": logo("#172339", "#2463EB"),
    "savia-logo-light-v5.svg": logo("#F6F8FC", "#83B3FF"),
    "savia-symbol-v5.svg": f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" color="#2463EB">{symbol}</svg>',
}
art = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 640" fill="none">
<defs><linearGradient id="r" x1="100" y1="50" x2="490" y2="600" gradientUnits="userSpaceOnUse"><stop stop-color="#C5DAFF"/><stop offset="1" stop-color="#729CF1"/></linearGradient></defs>
<g transform="translate(50 58) rotate(-12 230 260)">
<path d="M160 70H330Q380 70 380 120V360Q380 410 330 410H160Q110 410 110 360V120Q110 70 160 70Z" stroke="#9CBDF7" stroke-opacity=".24"/>
<path d="M70 120H260Q300 120 300 160V430Q300 470 260 470H70Q30 470 30 430V160Q30 120 70 120Z" fill="#FFFFFF" fill-opacity=".07" stroke="#A9C7FA" stroke-opacity=".36"/>
<path d="M190 190H380Q420 190 420 230V500Q420 540 380 540H190Q150 540 150 500V230Q150 190 190 190Z" fill="url(#r)" fill-opacity=".15" stroke="#A9C7FA" stroke-opacity=".65"/>
<path d="M150 255H300M150 385H300" stroke="#B8D3FF" stroke-opacity=".5"/>
</g></svg>'''
assets["savia-flow-v5.svg"] = art
for target in [ROOT / "public", ROOT / "keycloak-theme/savia/login/resources/img"]:
    for name, content in assets.items():
        (target / name).write_text(content, encoding="utf-8")
