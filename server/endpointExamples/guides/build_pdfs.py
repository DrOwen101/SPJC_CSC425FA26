"""Rebuild the OS handouts from adjacent Markdown files.
Install reportlab and pymupdf in a Python virtual environment, then run this file.
"""
import re
from pathlib import Path
from html import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Preformatted, Table, TableStyle,
    PageBreak, KeepTogether,
)
import fitz

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent

NAVY = colors.HexColor("#17324D")
BLUE = colors.HexColor("#1E5C85")
GRAY = colors.HexColor("#526170")
PALE = colors.HexColor("#F1F5F8")
LINE = colors.HexColor("#CDD8E1")

styles = {
    "title": ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=25, leading=29, textColor=NAVY, spaceAfter=9),
    "subtitle": ParagraphStyle("subtitle", fontName="Helvetica", fontSize=12, leading=17, textColor=GRAY, spaceAfter=15),
    "h1": ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=18, leading=22, textColor=NAVY, spaceAfter=11),
    "h2": ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=12, leading=16, textColor=BLUE, spaceBefore=8, spaceAfter=5, keepWithNext=True),
    "body": ParagraphStyle("body", fontName="Helvetica", fontSize=10.5, leading=14, spaceAfter=6),
    "small": ParagraphStyle("small", fontName="Helvetica", fontSize=9, leading=12, spaceAfter=5),
    "cell": ParagraphStyle("cell", fontName="Helvetica", fontSize=9.3, leading=12.5),
    "code": ParagraphStyle("code", fontName="Courier", fontSize=8.6, leading=11.2, leftIndent=0, spaceAfter=0),
}
story = []

def p(text, style="body"):
    story.append(Paragraph(text, styles[style]))

def h(text):
    p(text, "h2")

def code(text):
    block = Table([[Preformatted(text.strip("\n"), styles["code"])]], colWidths=[516])
    block.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PALE),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.extend([block, Spacer(1, 6)])

def table(rows, widths, header=True):
    data = [[Paragraph(str(value), styles["cell"]) for value in row] for row in rows]
    t = Table(data, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
    ]
    if header:
        commands.append(("BACKGROUND", (0, 0), (-1, 0), PALE))
    t.setStyle(TableStyle(commands))
    story.extend([t, Spacer(1, 9)])

def checkpoint(text):
    p("<b>Checkpoint:</b> " + text)

def page(title):
    story.append(PageBreak())
    p(title, "h1")

def link(label, url):
    return f'<link href="{url}" color="#1E5C85"><u>{label}</u></link>'


def inline(text):
    text = escape(text)
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', lambda m: f'<link href="{m[2]}" color="#1E5C85"><u>{m[1]}</u></link>', text)
    text = re.sub(r'`([^`]+)`', r'<font name="Courier">\1</font>', text)
    return re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', text)


def build(platform):
    story.clear()
    source = (HERE / f'PostgreSQL_Lab_{platform}.md').read_text()
    output = HERE / f'PostgreSQL_Express_Lab_{platform}.pdf'
    lines = iter(source.splitlines())
    new_page = True
    for line in lines:
        if not line.strip():
            continue
        if line == '<!-- pagebreak -->':
            story.append(PageBreak())
            new_page = True
        elif line.startswith('```'):
            block = []
            for value in lines:
                if value.startswith('```'):
                    break
                block.append(value)
            code('\n'.join(block))
        else:
            style = 'body'
            if line.startswith('# '):
                style, line = 'title', line[2:]
            elif line.startswith('## '):
                style, line = ('h1' if new_page else 'h2'), line[3:]
            elif line.startswith('### '):
                style, line = 'h2', line[4:]
            p(inline(line), style)
            new_page = False

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(LINE)
        canvas.line(48, 40, 564, 40)
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(GRAY)
        canvas.drawString(48, 27, f'CSC 425 | PostgreSQL + Student Lookup | {platform} | October 20, 2026')
        canvas.drawRightString(564, 27, f'Page {doc.page}')
        canvas.restoreState()

    doc = SimpleDocTemplate(str(output), pagesize=letter, rightMargin=48, leftMargin=48,
                            topMargin=42, bottomMargin=53, title=f'PostgreSQL + Student Lookup - {platform}', author='CSC 425')
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    with fitz.open(output) as pdf:
        data = pdf.tobytes(garbage=4, deflate=True, clean=True, use_objstms=1)
    output.write_bytes(data)
    with fitz.open(output) as pdf:
        expected = source.count('<!-- pagebreak -->') + 1
        assert len(pdf) == expected, f'{platform}: page overflow ({len(pdf)} vs {expected})'
        text = '\n'.join(page.get_text() for page in pdf)
        for required in ['CREATE DATABASE student_lookup;', '\\conninfo', 'getStudents()',
                         "app.use('/api/students', studentRoutes)", 'Morgan Ellis']:
            assert required in text, f'{platform}: missing {required}'
        for i,page in enumerate(pdf):
            for word in page.get_text('words'):
                assert word[0] >= 40 and word[2] <= 574, f'{platform} page {i+1}: horizontal overflow {word}'
                assert word[1] >= 35 and word[3] <= 770, f'{platform} page {i+1}: vertical overflow {word}'
        print(f'{platform}: {len(pdf)} pages, commands and layout verified')


if __name__ == '__main__':
    for platform in ['Mac', 'Windows', 'Linux']:
        build(platform)
