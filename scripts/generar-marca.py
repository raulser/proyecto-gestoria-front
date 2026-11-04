"""Generate the brand SVGs. Development dependency: fonttools.

Uses public/fonts/Manrope.ttf and its included license, with no system fonts.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parents[1]
font = instantiateVariableFont(TTFont(ROOT / "public/fonts/Manrope.ttf"), {"wght": 650})
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
scale = 44 / font["head"].unitsPerEm
pen = SVGPathPen(glyphs)
x = 62.0
for character in "savia":
    glyph = glyphs[cmap[ord(character)]]
    glyph.draw(TransformPen(pen, (scale, 0, 0, -scale, x, 38)))
    x += glyph.width * scale - 0.8
width = round(x + 4)
wordmark = pen.getCommands()

# Interlocking ribbons, without an initial or surrounding tile.
loop_a = "M15 7a4.25 4.25 0 0 1 6 0l10 10a4.25 4.25 0 0 1 0 6L21 33a4.25 4.25 0 0 1-6 0L5 23a4.25 4.25 0 0 1 0-6Z"
loop_b = "M27 15a4.25 4.25 0 0 1 6 0l10 10a4.25 4.25 0 0 1 0 6L33 41a4.25 4.25 0 0 1-6 0L17 31a4.25 4.25 0 0 1 0-6Z"
symbol = f'<g fill="none" stroke-width="5.5" stroke-linejoin="round"><path d="{loop_a}" stroke="url(#violeta)"/><path d="{loop_b}" stroke="url(#coral)"/></g>'
gradients = '<defs><linearGradient id="violeta" x1="4" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse"><stop stop-color="#7140D2"/><stop offset="1" stop-color="#A34EAD"/></linearGradient><linearGradient id="coral" x1="17" y1="15" x2="45" y2="44" gradientUnits="userSpaceOnUse"><stop stop-color="#DB6F75"/><stop offset="1" stop-color="#B34B83"/></linearGradient><linearGradient id="nombre" x1="62" y1="24" x2="175" y2="24" gradientUnits="userSpaceOnUse"><stop stop-color="#6B3FD1"/><stop offset="1" stop-color="#AE4277"/></linearGradient></defs>'

def logo(ink):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} 48">{gradients}{symbol}<path d="{wordmark}" fill="{ink}"/></svg>'

assets = {
    "savia-logo-v6.svg": logo("url(#nombre)"),
    "savia-logo-light-v6.svg": logo("#FFF8FF"),
    "savia-symbol-v6.svg": f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">{gradients}{symbol}</svg>',
}
for target in [ROOT / "public", ROOT / "keycloak-theme/savia/login/resources/img"]:
    for name, content in assets.items():
        (target / name).write_text(content, encoding="utf-8")
