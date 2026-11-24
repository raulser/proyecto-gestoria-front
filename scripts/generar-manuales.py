"""Genera los tres manuales PDF a partir del mismo contenido que lee Angular.

Requiere Python 3, reportlab y pypdf. Ejecutar desde cualquier directorio.
En Windows se usa Segoe UI; se puede indicar --fuentes con otra familia TTF
que contenga Regular.ttf y Bold.ttf.
"""
from pathlib import Path
from xml.sax.saxutils import escape
import argparse
import json

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, CondPageBreak, Frame, KeepTogether, ListFlowable, ListItem,
    PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents
from pypdf import PdfReader

RAIZ = Path(__file__).resolve().parents[1]
DATOS = json.loads((RAIZ / 'src/app/ayuda/manuales.json').read_text(encoding='utf-8'))
VIOLETA = colors.HexColor('#7140c8')
TINTA = colors.HexColor('#302b42')
GRIS = colors.HexColor('#6a6279')
BORDE = colors.HexColor('#e8e1f1')


class ManualDoc(BaseDocTemplate):
    def __init__(self, destino, perfil):
        self.perfil = perfil
        super().__init__(str(destino), pagesize=A4, leftMargin=52, rightMargin=52,
                         topMargin=62, bottomMargin=54, title=f'Manual de Savia - {perfil}',
                         author='Savia', subject=f'Manual de usuario. Perfil {perfil}.')
        self.addPageTemplates(PageTemplate(id='manual', frames=[Frame(
            self.leftMargin, self.bottomMargin, self.width, self.height,
            leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)], onPage=self.pagina))

    def pagina(self, canvas, doc):
        canvas.saveState()
        canvas.setFillColor(VIOLETA)
        canvas.setFont('SaviaBold', 18)
        canvas.drawString(52, A4[1] - 34, 'savia')
        canvas.setFillColor(GRIS)
        canvas.setFont('Savia', 8)
        canvas.drawRightString(A4[0] - 52, A4[1] - 32, f'MANUAL DE USUARIO / {self.perfil.upper()}')
        canvas.setStrokeColor(BORDE)
        canvas.line(52, A4[1] - 44, A4[0] - 52, A4[1] - 44)
        canvas.line(52, 39, A4[0] - 52, 39)
        canvas.setFont('Savia', 8)
        canvas.drawString(52, 25, f'Savia · Versión {DATOS["version"]}')
        canvas.drawRightString(A4[0] - 52, 25, f'{doc.page:02d}')
        canvas.restoreState()

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name == 'Capitulo':
            titulo = flowable.getPlainText()
            clave = 'capitulo-' + titulo.split(' ', 1)[0]
            self.canv.bookmarkPage(clave)
            self.canv.addOutlineEntry(titulo, clave, 0)
            self.notify('TOCEntry', (0, titulo, self.page, clave))


def estilos():
    estilos_base = getSampleStyleSheet()
    return {
        'titulo': ParagraphStyle('Portada', fontName='SaviaBold', fontSize=36, leading=43, textColor=TINTA, spaceAfter=12),
        'perfil': ParagraphStyle('Perfil', fontName='SaviaBold', fontSize=19, leading=25, textColor=VIOLETA, spaceAfter=18),
        'capitulo': ParagraphStyle('Capitulo', fontName='SaviaBold', fontSize=18, leading=24, textColor=TINTA, spaceAfter=9, keepWithNext=True),
        'subtitulo': ParagraphStyle('Subtitulo', fontName='SaviaBold', fontSize=11, leading=16, textColor=TINTA, spaceBefore=14, spaceAfter=8, keepWithNext=True),
        'resumen': ParagraphStyle('Resumen', fontName='Savia', fontSize=11, leading=17, textColor=VIOLETA, spaceAfter=16, keepWithNext=True),
        'texto': ParagraphStyle('Texto', fontName='Savia', fontSize=10, leading=15.7, textColor=GRIS, spaceAfter=10),
        'paso': ParagraphStyle('Paso', fontName='Savia', fontSize=10, leading=15.7, textColor=GRIS, spaceAfter=8),
        'estado': ParagraphStyle('Estado', fontName='SaviaBold', fontSize=9.2, leading=13.6, textColor=TINTA),
        'descripcion': ParagraphStyle('Descripcion', fontName='Savia', fontSize=9.2, leading=13.6, textColor=GRIS),
        'indice': ParagraphStyle('Indice', fontName='Savia', fontSize=10.5, leading=16, textColor=TINTA, spaceBefore=7, leftIndent=0, firstLineIndent=0, rightIndent=18, alignment=TA_LEFT),
    }


def generar(perfil, salida):
    manual = DATOS['perfiles'][perfil]
    estilo = estilos()
    doc = ManualDoc(salida, manual['nombre'])
    contenido = [Spacer(1, 35), Paragraph('Manual de usuario', estilo['titulo']),
                 Paragraph(manual['nombre'], estilo['perfil']),
                 Paragraph(escape(manual['descripcion']), estilo['texto']),
                 Paragraph('Esta guía describe los recorridos disponibles para tu perfil en Savia. '
                           'El contenido coincide con el manual consultable dentro de Ayuda.', estilo['texto']),
                 Spacer(1, 22), Paragraph('Contenido', estilo['subtitulo'])]
    indice = TableOfContents()
    indice.levelStyles = [estilo['indice']]
    indice.dotsMinLevel = 0
    contenido += [indice, PageBreak()]
    for numero, identificador in enumerate(manual['capitulos'], 1):
        inicio_capitulo = len(contenido)
        capitulo = DATOS['secciones'][identificador]
        contenido += [CondPageBreak(145), Paragraph(f'{numero:02d}  {escape(capitulo["titulo"])}', estilo['capitulo']),
                      Paragraph(escape(capitulo['resumen']), estilo['resumen'])]
        contenido += [Paragraph(escape(parrafo), estilo['texto']) for parrafo in capitulo['parrafos']]
        if capitulo.get('pasos'):
            contenido += [Paragraph('Paso a paso', estilo['subtitulo']), ListFlowable(
                [ListItem(Paragraph(escape(paso), estilo['paso'])) for paso in capitulo['pasos']],
                bulletType='1', leftIndent=17, bulletFontName='SaviaBold', bulletFontSize=9,
                bulletColor=VIOLETA, spaceAfter=10)]
        if capitulo.get('estados'):
            filas = [[Paragraph(escape(estado['estado']), estilo['estado']),
                      Paragraph(escape(estado['descripcion']), estilo['descripcion'])]
                     for estado in capitulo['estados']]
            tabla = Table(filas, colWidths=[155, doc.width - 155], hAlign='LEFT')
            tabla.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 10), ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f6f2fb')),
                ('LINEBELOW', (0, 0), (-1, -1), .5, BORDE),
            ]))
            contenido += [Spacer(1, 6), tabla]
        contenido += [Spacer(1, 24)]
        if identificador == 'cuenta':
            # Evita que el cierre del manual quede aislado en una página casi vacía.
            contenido[inicio_capitulo:] = [KeepTogether(contenido[inicio_capitulo:])]
    doc.multiBuild(contenido)
    lector = PdfReader(salida)
    texto = '\n'.join(pagina.extract_text() for pagina in lector.pages)
    for identificador in manual['capitulos']:
        if DATOS['secciones'][identificador]['titulo'] not in texto:
            raise RuntimeError(f'Falta el capítulo {identificador} en {salida.name}')
    if len(lector.outline) != len(manual['capitulos']):
        raise RuntimeError('El índice de marcadores está incompleto')
    print(f'{salida.name}: {len(lector.pages)} páginas, {len(lector.outline)} capítulos, {salida.stat().st_size} bytes')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--salida', type=Path, default=RAIZ / 'public/manuales')
    parser.add_argument('--fuentes', type=Path)
    args = parser.parse_args()
    regular = args.fuentes / 'Regular.ttf' if args.fuentes else Path('C:/Windows/Fonts/segoeui.ttf')
    negrita = args.fuentes / 'Bold.ttf' if args.fuentes else Path('C:/Windows/Fonts/segoeuib.ttf')
    pdfmetrics.registerFont(TTFont('Savia', str(regular)))
    pdfmetrics.registerFont(TTFont('SaviaBold', str(negrita)))
    pdfmetrics.registerFontFamily('Savia', normal='Savia', bold='SaviaBold')
    args.salida.mkdir(parents=True, exist_ok=True)
    for perfil in DATOS['perfiles']:
        generar(perfil, args.salida / f'manual-savia-{perfil}.pdf')
