"""
Render a report model (written by build-report.mts or build-visibility.mts) into DOCX and XLSX,
plus the charts.

WHY PYTHON, AND WHY IT READS THE MODEL RATHER THAN THE SCAN. The engine is TypeScript and stays
the only thing that scores a page. This file owns presentation only: it never computes a score,
a weight or a point value, and it never invents a string - every heading, label and caveat comes
from the model's `copy` block, which build-report.mts fills for both languages. That is what keeps
the Markdown, the DOCX and the XLSX saying the same thing.

TWO REPORT TYPES, ONE SET OF PRIMITIVES. `model["reportType"]` selects the document: the default
("geo-scan") is the technical GEO diagnosis of one domain, and "ai-visibility" is the report built
from measured answers to questions put to a model (scripts/report/build-visibility.mts). They are
different documents with different sections - that is the point of a second type - so they have
separate builders. What they do NOT have separately is the machinery underneath: docx_tools(),
docx_scaffold(), xlsx_tools() and verify_geometry() are shared, which is why both documents are A4
with the same text area and both are checked against it. A second copy of set_table_geometry is how
one report gets fixed and the other keeps clipping its columns.

WHY THE DISPATCH IS IN THIS FILE AND NOT A SECOND PYTHON FILE. verify_geometry() is the file's
closing guarantee, and a sibling renderer would either import this module (whose name has a hyphen
and therefore cannot be imported by name) or carry a second geometry check - and a second check is
a second thing to keep in step. Adding a branch here keeps the assertion on the path of every
document this pipeline produces.

WHY THE CHARTS ARE DRAWN WITH PILLOW RATHER THAN MATPLOTLIB. matplotlib is not in the runtime this
repository is developed against, and installing one for a report generator is not worth a
dependency. Pillow is present, and the figures here - labelled bars, a radar, a count axis, and the
two-slice pie the entity finding is drawn as - are shapes rather than plots. Chinese labels need a
CJK font, so the font is chosen from the system's own files with an explicit East Asian fallback
rather than left to the renderer's default.

Usage:
    <python> scripts/report/render-report.py --model=<dir>/report-model.json --out=<dir>
"""

from __future__ import annotations

import argparse
import json
import math
import os
from pathlib import Path
from types import SimpleNamespace

from PIL import Image, ImageDraw, ImageFont

# --------------------------------------------------------------------------------------
# Palette: the site's own CSS tokens, so a printed report and the report page agree.
# --------------------------------------------------------------------------------------
INK_1 = "#1d1d1f"
INK_2 = "#6e6e73"
INK_3 = "#86868b"
LINE = "#d2d2d7"
SURFACE_1 = "#f5f5f7"
SURFACE_2 = "#ffffff"
ACCENT = "#0071e3"
OK = "#1a7f37"
WARN = "#9a6700"

FONT_CANDIDATES_ZH = [
    r"C:\Windows\Fonts\msyh.ttc",
    r"C:\Windows\Fonts\msyhbd.ttc",
    r"C:\Windows\Fonts\simhei.ttf",
    r"C:\Windows\Fonts\Deng.ttf",
    "/System/Library/Fonts/PingFang.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
]
FONT_BOLD_CANDIDATES_ZH = [
    r"C:\Windows\Fonts\msyhbd.ttc",
    r"C:\Windows\Fonts\simhei.ttf",
    "/System/Library/Fonts/PingFang.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
]

"""
TL;DR the charts get a font chosen for the report's language, not one font for both.

A CJK font renders Latin, so using the Chinese font everywhere "works" - and it looks wrong: the
Latin glyphs in a CJK font are designed to sit beside ideographs, with wider spacing and a different
weight, which is visible in a chart label. An English report is the default case here, so it gets a
Latin font and falls back to the CJK files only if none is present.
"""
FONT_CANDIDATES_EN = [
    r"C:\Windows\Fonts\arial.ttf",
    r"C:\Windows\Fonts\segoeui.ttf",
    r"C:\Windows\Fonts\calibri.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
] + FONT_CANDIDATES_ZH
FONT_BOLD_CANDIDATES_EN = [
    r"C:\Windows\Fonts\arialbd.ttf",
    r"C:\Windows\Fonts\segoeuib.ttf",
    r"C:\Windows\Fonts\calibrib.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
] + FONT_BOLD_CANDIDATES_ZH

# Selected once in main() from the model's language.
REGULAR: str | None = None
BOLD: str | None = None


def pick_font(candidates: list[str]) -> str | None:
    for path in candidates:
        if os.path.exists(path):
            return path
    return None


def select_fonts(lang: str) -> None:
    global REGULAR, BOLD
    if lang == "zh":
        REGULAR = pick_font(FONT_CANDIDATES_ZH)
        BOLD = pick_font(FONT_BOLD_CANDIDATES_ZH) or REGULAR
    else:
        REGULAR = pick_font(FONT_CANDIDATES_EN)
        BOLD = pick_font(FONT_BOLD_CANDIDATES_EN) or REGULAR


def font(size: int, bold: bool = False):
    path = BOLD if bold else REGULAR
    if path:
        return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def grade_color(score: int) -> str:
    """Three tokens, four bands - no invented colour."""
    if score >= 90:
        return OK
    if score >= 70:
        return ACCENT
    return WARN


def text_w(draw: ImageDraw.ImageDraw, s: str, f) -> int:
    return int(draw.textlength(s, font=f))


def status_marker(competitor: dict) -> str:
    """
    "(HTTP 403)", appended to every cell of a competitor that did not answer 200 - or "".

    WHY THIS IS ON THE CELL AND NOT ONLY IN THE PARAGRAPH ABOVE THE TABLE. The engine scores an
    error response on purpose (see app/api/scan/route.ts: "a non-200 homepage is NOT treated as
    unreachable"), so a rival that refuses this scanner has a real score that describes the
    refusal. "14 / 100 F (HTTP 403)" cannot be read as "this rival scores 14 at GEO"; a bare 14 in
    a column otherwise full of zeros can, and that is a fabricated finding about a third party.
    It repeats on every row because a reader quotes one row, not the footnote, and it is shared by
    the DOCX and the workbook so the two cannot mark different columns.
    """
    status = competitor.get("homeStatus")
    if competitor.get("measured") and status is not None and status != 200:
        return f" (HTTP {status})"
    return ""


def competitor_cell(competitor: dict, unmeasured_label: str, suffix: str | int | None = None) -> str:
    """
    One comparison cell: "52 / 100 F", "14 / 100 F (HTTP 403)", "42", "0 (HTTP 403)", or "not
    measured".

    ONE FUNCTION FOR BOTH RENDERERS, for the reason this whole file opens with: the DOCX and the
    workbook are two renderings of one model, and the way they drift is by each formatting the same
    field its own way. `suffix` is what a per-dimension cell carries (a bare score) where the
    overall row carries the score and grade; the status marker is added here, so no caller can
    forget it and print a refusal as if it were a page score.

    WHY `suffix is None` AND NOT `if suffix`. The first version of this tested the value's truth,
    and a dimension score of 0 is falsy - so every dimension a refused competitor scored zero on
    rendered as "52 / 100 F", the OVERALL cell of a different column, because the row passed 0 and
    the function took its other branch. That is not a cosmetic bug: a reader would have seen a rival
    with four 52s and thought the tool was repeating the overall score down the table. Absence is
    None here, and the falsy-but-real value 0 is a number like any other.
    """
    if not competitor.get("measured"):
        return unmeasured_label
    if suffix is None:
        value = f"{competitor['score']} / 100 {competitor.get('grade') or ''}".strip()
        return value + status_marker(competitor)
    return f"{suffix}{status_marker(competitor)}"


# --------------------------------------------------------------------------------------
# Figure 1: dimension bars
# --------------------------------------------------------------------------------------
def chart_dimensions(model: dict, out: Path) -> None:
    """
    The label column is measured from the labels, not fixed.

    WHY: it was fixed at 250 units, which fits Chinese dimension names ("机器可读性", four or five
    characters) and does not fit English ones ("Metadata & Discoverability", twenty-six). The bars
    are drawn after the labels, so the overflow was covered by the bar rather than reported - the
    first English chart showed "AI Crawler Acces" and half a bar over the rest of the word. The
    width now comes from the longest label as rendered in the chosen font, so a longer language or
    a renamed dimension cannot reintroduce it.
    """
    dims = model["dimensions"]
    scale = 2
    pad = 28 * scale
    tag_w = 78 * scale
    gap = 30 * scale
    value_w = 90 * scale
    row_h = 46 * scale
    track_w = 900 * scale

    f_label = font(22 * scale, bold=True)
    f_small = font(18 * scale)
    probe = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    widest = max((probe.textlength(d["label"], font=f_label) for d in dims), default=0)
    label_w = tag_w + int(widest) + gap

    width = pad * 2 + label_w + track_w + value_w
    height = pad * 2 + row_h * len(dims)
    img = Image.new("RGB", (width, height), SURFACE_2)
    d = ImageDraw.Draw(img)

    for i, dim in enumerate(dims):
        y = pad + i * row_h
        cy = y + row_h // 2

        # weight tag, so the bar length is never read as importance
        d.text((pad, cy), f"{dim['applicableWeight']}%", font=f_small, fill=INK_3, anchor="lm")
        d.text((pad + tag_w, cy), dim["label"], font=f_label, fill=INK_1, anchor="lm")

        x0 = pad + label_w
        d.rectangle([x0, cy - 12 * scale, x0 + track_w, cy + 12 * scale], fill=SURFACE_1)
        filled = int(track_w * max(0, min(100, dim["score"])) / 100)
        if filled > 0:
            d.rectangle([x0, cy - 12 * scale, x0 + filled, cy + 12 * scale], fill=grade_color(dim["score"]))
        d.text((x0 + track_w + 16 * scale, cy), f"{dim['score']}", font=f_label, fill=INK_1, anchor="lm")

    img.save(out, dpi=(2 * 96, 2 * 96))


# --------------------------------------------------------------------------------------
# Figure 2: six-metric radar
# --------------------------------------------------------------------------------------
def chart_radar(model: dict, out: Path) -> None:
    """
    The canvas is sized to the labels, which the English ones need and the Chinese ones did not.

    A radar's labels hang off the ends of the axes, outside the polygon, so the canvas has to be
    wider than the ring by the width of the longest label on each side. At the original fixed size
    the English labels ("Crawlability 100") were cut off by the canvas edge - the same latent
    assumption as the bar chart's label column, in the other figure.
    """
    metrics = model["metrics"]
    scale = 2
    f_label = font(19 * scale, bold=True)
    f_ring = font(14 * scale)

    probe = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    widest = max((probe.textlength(f"{m['label']} {m['score']}", font=f_label) for m in metrics), default=0)
    margin = int(widest) + 24 * scale

    radius = 300 * scale
    width = 2 * (radius + margin)
    height = 2 * (radius + margin) + 40 * scale
    img = Image.new("RGB", (width, height), SURFACE_2)
    d = ImageDraw.Draw(img)

    cx, cy = width // 2, int(height * 0.47)
    n = len(metrics)

    def point(i: int, value: float):
        angle = -math.pi / 2 + (2 * math.pi * i) / n
        rr = radius * value / 100.0
        return cx + rr * math.cos(angle), cy + rr * math.sin(angle)

    for ring in (20, 40, 60, 80, 100):
        pts = [point(i, ring) for i in range(n)]
        d.polygon(pts, outline=LINE)
        if ring in (60, 100):
            x, y = point(0, ring)
            d.text((x + 6 * scale, y), f"{ring}%", font=f_ring, fill=INK_3, anchor="lm")
    for i in range(n):
        x, y = point(i, 100)
        d.line([cx, cy, x, y], fill=LINE)

    pts = [point(i, m["score"]) for i, m in enumerate(metrics)]
    d.polygon(pts, fill="#e8f1fd", outline=ACCENT)
    for x, y in pts:
        d.ellipse([x - 4 * scale, y - 4 * scale, x + 4 * scale, y + 4 * scale], fill=ACCENT)

    for i, m in enumerate(metrics):
        x, y = point(i, 100)
        dx, dy = x - cx, y - cy
        if abs(dx) > abs(dy):
            anchor = "lm" if dx > 0 else "rm"
        elif dy < 0:
            anchor = "mb"
        else:
            anchor = "mt"
        ox = 10 * scale if anchor == "lm" else (-10 * scale if anchor == "rm" else 0)
        oy = -10 * scale if anchor == "mb" else (10 * scale if anchor == "mt" else 0)
        d.text((x + ox, y + oy), f"{m['label']} {m['score']}", font=f_label, fill=INK_1, anchor=anchor)

    img.save(out, dpi=(2 * 96, 2 * 96))


# --------------------------------------------------------------------------------------
# DOCX
# --------------------------------------------------------------------------------------
DOCX_LATIN = "Arial"
"""
LATIN IS ARIAL, AND PORTABILITY IS THE WHOLE REASON. This report is sent to clients who may open
it in Word on Windows, Word or Pages on macOS, LibreOffice, or Google Docs, and only one
sans-serif is present by default on all of them. Segoe UI - the obvious choice, and the first one
used here - exists on Windows and nowhere else, so a macOS reader gets whatever their substitution
table picks. Arial also has metric-compatible substitutes on Linux (Liberation Sans) and in Google
Docs, so the line breaks a reader sees match the ones this file laid out.

The East Asian slot stays Microsoft YaHei: it only applies to runs that contain CJK, which an
English report does not have, and a Chinese report is read on a machine that has it.
"""
DOCX_EA = "Microsoft YaHei"


def docx_tools(doc):
    """
    Every DOCX primitive this file has, built against one document and handed back by name.

    WHY THESE MOVED OUT OF build_docx. Until the AI-visibility report existed, build_docx was the
    only DOCX writer here and the helpers could be nested inside it. There are two writers now, and
    the thing this repository refuses everywhere else is exactly what a second copy would create: a
    second `set_table_geometry` is a second definition of "16.4cm inside a 16.6cm text area", and
    the day somebody fixes the clipping in one of them the other report still runs past the margin.
    verify_geometry() is the check that is supposed to catch that, and it can only do its job if
    there is one geometry rule to check documents against.

    WHY THIS RETURNS A NAMESPACE RATHER THAN BEING A CLASS. These are functions over a document they
    close over; a class would add a `self` to every call site for no other reason. What matters is
    that build_docx binds them back to the names it already used, so the scan report's layout is
    unchanged by the move - the refactor is a move, not a rewrite.
    """
    from docx.enum.table import WD_TABLE_ALIGNMENT
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    from docx.shared import Cm, Pt, RGBColor

    LATIN, EA = DOCX_LATIN, DOCX_EA

    def set_run(run, size=None, bold=None, color=None, latin=LATIN, ea=EA):
        run.font.name = latin
        rpr = run._element.get_or_add_rPr()
        rfonts = rpr.find(qn("w:rFonts"))
        if rfonts is None:
            rfonts = OxmlElement("w:rFonts")
            rpr.append(rfonts)
        rfonts.set(qn("w:ascii"), latin)
        rfonts.set(qn("w:hAnsi"), latin)
        rfonts.set(qn("w:eastAsia"), ea)
        if size is not None:
            run.font.size = Pt(size)
        if bold is not None:
            run.font.bold = bold
        if color is not None:
            run.font.color.rgb = RGBColor.from_string(color.lstrip("#"))
        return run

    def style_font(name, size, bold=False, color=INK_1, space_before=0, space_after=6):
        st = doc.styles[name]
        st.font.size = Pt(size)
        st.font.bold = bold
        st.font.color.rgb = RGBColor.from_string(color.lstrip("#"))
        st.font.name = LATIN
        rpr = st.element.get_or_add_rPr()
        rfonts = rpr.find(qn("w:rFonts"))
        if rfonts is None:
            rfonts = OxmlElement("w:rFonts")
            rpr.append(rfonts)
        rfonts.set(qn("w:ascii"), LATIN)
        rfonts.set(qn("w:hAnsi"), LATIN)
        rfonts.set(qn("w:eastAsia"), EA)
        st.paragraph_format.space_before = Pt(space_before)
        st.paragraph_format.space_after = Pt(space_after)
        return st

    def shade(cell, fill):
        tcpr = cell._tc.get_or_add_tcPr()
        shd = OxmlElement("w:shd")
        shd.set(qn("w:val"), "clear")
        shd.set(qn("w:color"), "auto")
        shd.set(qn("w:fill"), fill.lstrip("#"))
        tcpr.append(shd)

    def left_accent(cell, color=ACCENT, size=18):
        tcpr = cell._tc.get_or_add_tcPr()
        borders = OxmlElement("w:tcBorders")
        left = OxmlElement("w:left")
        left.set(qn("w:val"), "single")
        left.set(qn("w:sz"), str(size))
        left.set(qn("w:color"), color.lstrip("#"))
        borders.append(left)
        tcpr.append(borders)

    def cell_text(cell, text, size=9, bold=False, color=INK_1, align=None):
        cell.text = ""
        p = cell.paragraphs[0]
        if align is not None:
            p.alignment = align
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        for i, chunk in enumerate(str(text).split("\n")):
            if i:
                p = cell.add_paragraph()
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(2)
            set_run(p.add_run(chunk), size=size, bold=bold, color=color)

    def set_table_geometry(t, widths_cm):
        """
        Pin the table to an explicit total width.

        MEASURED TWICE, which is why this version uses get_or_add rather than append. Setting only
        `cell.width` leaves the total to the sum of the cells, and the first version of this file
        asked for 17.0cm of columns in a 16.6cm text area (A4, 2.2cm margins) - so the table ran
        past the right margin and the long final-URL and timestamp cells were clipped mid-string.

        The first fix appended a second `w:tblW` carrying the right value. It changed nothing, and
        the reason is worth keeping: python-docx had already written `<w:tblW w:type="auto"/>`
        ahead of it, the layout engine reads the first one, and a duplicate element later in
        `w:tblPr` is not an override. get_or_add_tblW returns the element already there, so there
        is one width and it is the intended one.
        """
        total = int(sum(widths_cm) * 567)
        tblpr = t._tbl.tblPr
        tblw = tblpr.get_or_add_tblW() if hasattr(tblpr, "get_or_add_tblW") else tblpr.find(qn("w:tblW"))
        if tblw is None:
            tblw = OxmlElement("w:tblW")
            tblpr.insert(0, tblw)
        tblw.set(qn("w:w"), str(total))
        tblw.set(qn("w:type"), "dxa")
        layout = (
            tblpr.get_or_add_tblLayout()
            if hasattr(tblpr, "get_or_add_tblLayout")
            else tblpr.find(qn("w:tblLayout"))
        )
        if layout is None:
            layout = OxmlElement("w:tblLayout")
            tblpr.append(layout)
        layout.set(qn("w:type"), "fixed")

        """
        The grid is the authoritative column geometry for a fixed-layout table, and python-docx
        creates it with EQUAL columns totalling the section's text width. Setting only `cell.width`
        leaves that grid describing different columns from the ones the cells ask for - two
        descriptions of the same table, which is the drift this repository refuses everywhere else.
        Writing the grid from the same list removes the second description.
        """
        grid = t._tbl.find(qn("w:tblGrid"))
        if grid is None:
            grid = OxmlElement("w:tblGrid")
            t._tbl.insert(1, grid)
        for col in list(grid.findall(qn("w:gridCol"))):
            grid.remove(col)
        for width in widths_cm:
            col = OxmlElement("w:gridCol")
            col.set(qn("w:w"), str(int(width * 567)))
            grid.append(col)

        for row in t.rows:
            for i, cell in enumerate(row.cells):
                cell.width = Cm(widths_cm[i])

    def make_table(headers, rows, widths_cm, align=None, size=8.5):
        assert sum(widths_cm) <= 16.5, f"table is wider than the text area: {sum(widths_cm)}cm"
        t = doc.add_table(rows=1, cols=len(headers))
        t.style = "Table Grid"
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        t.autofit = False
        for i, h in enumerate(headers):
            c = t.rows[0].cells[i]
            cell_text(c, h, size=size, bold=True, color=INK_1,
                      align=(align[i] if align else None))
            shade(c, SURFACE_1)
        for row in rows:
            cells = t.add_row().cells
            for i, v in enumerate(row):
                cell_text(cells[i], v, size=size, align=(align[i] if align else None))
        set_table_geometry(t, widths_cm)
        return t

    def callout(text, size=10):
        t = doc.add_table(rows=1, cols=1)
        t.autofit = False
        c = t.rows[0].cells[0]
        cell_text(c, text, size=size, bold=False, color=INK_1)
        shade(c, SURFACE_1)
        left_accent(c)
        set_table_geometry(t, [16.4])
        doc.add_paragraph()

    def figure(path, width_cm, caption, keep_with_caption=True):
        """
        An inline image is a paragraph, and a paragraph that lands on a page boundary gets split
        by the layout engine - which is what a first render did to the bar chart, showing two of
        its twelve rows at the foot of one page and the rest on the next. keep_together moves the
        whole figure instead, and keep_with_next holds its caption against it.
        """
        doc.add_picture(str(path), width=Cm(width_cm))
        img_p = doc.paragraphs[-1]
        img_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        img_p.paragraph_format.keep_together = True
        if keep_with_caption:
            img_p.paragraph_format.keep_with_next = True
        cap = doc.add_paragraph(caption, style="Small")
        cap.paragraph_format.keep_together = True

    def heading(text, level=1):
        """A heading is not allowed to be the last thing on a page."""
        h = doc.add_heading(text, level=level)
        h.paragraph_format.keep_with_next = True
        return h

    return SimpleNamespace(
        set_run=set_run,
        style_font=style_font,
        shade=shade,
        left_accent=left_accent,
        cell_text=cell_text,
        set_table_geometry=set_table_geometry,
        make_table=make_table,
        callout=callout,
        figure=figure,
        heading=heading,
    )


def docx_scaffold(model: dict):
    """
    A document carrying this product's styles, page box, header and footer - and nothing else.

    WHY THIS IS SHARED RATHER THAN COPIED PER REPORT. The two reports have to look like documents
    from the same product, and the parts that carry that are exactly these: Arial in the Latin
    slots, Microsoft YaHei in the East Asian one, A4 with 2.2cm side margins (which is where the
    16.6cm text area that verify_geometry asserts against comes from), the Small/Score/Subtitle2
    styles the cover uses, and a header naming the subject and the date. A second copy of these
    numbers is how the second report quietly gets a different text width while the geometry check
    still passes - because it would be checking the number the first report declared.

    The header's subject falls back from `domain` to `subject`, because a scan report is about a
    domain and an AI-visibility report is about a named company. The date falls back the same way,
    from the scan's `scanDate` to the measurement's `measuredOn`.
    """
    from docx import Document
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    from docx.shared import Cm, Pt

    C, meta = model["copy"], model["meta"]
    doc = Document()
    T = docx_tools(doc)

    # Default body font, including the East Asian slot: without this a Chinese report can fall
    # back to a font the reader does not have.
    T.style_font("Normal", 10, space_after=6)
    T.style_font("Heading 1", 16, bold=True, space_before=16, space_after=8)
    T.style_font("Heading 2", 12, bold=True, space_before=12, space_after=6)
    T.style_font("Title", 26, bold=True, space_after=4)
    doc.styles.add_style("Small", 1)
    T.style_font("Small", 8.5, color=INK_3, space_after=10)
    doc.styles.add_style("Score", 1)
    T.style_font("Score", 40, bold=True, color=ACCENT, space_before=4, space_after=2)
    doc.styles.add_style("Subtitle2", 1)
    T.style_font("Subtitle2", 11, color=INK_2, space_after=12)

    sec = doc.sections[0]
    sec.page_width = Cm(21.0)
    sec.page_height = Cm(29.7)
    for attr, val in (("left_margin", 2.2), ("right_margin", 2.2), ("top_margin", 2.0), ("bottom_margin", 1.8)):
        setattr(sec, attr, Cm(val))

    subject = meta.get("domain") or meta.get("subject") or ""
    stamp = meta.get("scanDate") or meta.get("measuredOn") or ""

    # Header / footer
    hp = sec.header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.LEFT
    T.set_run(hp.add_run(f"{subject}  /  {C['reportName']}"), size=8, color=INK_3)
    T.set_run(hp.add_run(f"        {stamp}"), size=8, color=INK_3)
    fp = sec.footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.LEFT
    T.set_run(fp.add_run(f"{C['footer']}   |   "), size=8, color=INK_3)
    fld_run = fp.add_run()
    T.set_run(fld_run, size=8, color=INK_3)
    for el, attr, text in (
        ("w:fldChar", "begin", None),
        ("w:instrText", None, "PAGE"),
        ("w:fldChar", "end", None),
    ):
        e = OxmlElement(el)
        if attr:
            e.set(qn("w:fldCharType"), attr)
        if text:
            e.set(qn("xml:space"), "preserve")
            e.text = text
        fld_run._r.append(e)

    return doc, T


def build_docx(model: dict, out: Path, charts: dict) -> None:
    doc, T = docx_scaffold(model)

    """
    THE HELPERS KEEP THE NAMES THEY HAD WHEN THEY WERE NESTED IN THIS FUNCTION, so every call site
    below is untouched by the move into docx_tools(). If a future edit needs a primitive that does
    not exist yet, it belongs in docx_tools and not here - a helper defined next to one report's
    layout is a helper the other report cannot have.
    """
    set_run, style_font = T.set_run, T.style_font
    shade, left_accent, cell_text = T.shade, T.left_accent, T.cell_text
    make_table, callout, figure, heading = T.make_table, T.callout, T.figure, T.heading
    set_table_geometry = T.set_table_geometry

    from docx.enum.text import WD_ALIGN_PARAGRAPH

    C = model["copy"]
    meta, score = model["meta"], model["score"]

    # --- Cover / one-page overview -------------------------------------------------
    doc.add_paragraph(C["reportName"], style="Heading 1")
    p = doc.add_paragraph(style="Score")
    set_run(p.add_run(f"{score['total']} / 100"), size=40, bold=True, color=ACCENT)
    p = doc.add_paragraph(style="Subtitle2")
    set_run(p.add_run(f"{C['scoreCaption']} · {score['grade']} — {score['gradeLabel']}"), size=11, color=INK_2)
    callout(model["callout"])

    make_table(
        [C["tableItem"], C["tableValue"]],
        [
            [C["kScore"], f"{score['total']} / 100 ({score['grade']})"],
            [C["kPassed"], f"{score['checksPassed']} / {score['checksRun']}"],
            [C["kNotApplicable"], str(score["checksNotApplicable"])],
            [C["kPageType"], str(meta["pageType"])],
            [C["kScheme"], meta["scheme"]],
            [C["kHomeStatus"], str(meta["homeStatus"])],
            [C["kBrowserProbe"], C["probeNotNeeded"] if meta["browserStatus"] is None else str(meta["browserStatus"])],
            [C["kFinalUrl"], meta["finalUrl"]],
            [C["kTruncated"], C["yes"] if meta["truncated"] else C["no"]],
            [C["kScannedAt"], meta.get("scannedAtDisplay", meta["scannedAt"])],
        ],
        [5.0, 11.4],
    )

    # --- Figures -------------------------------------------------------------------
    heading(C["sectionDimensions"])
    if charts.get("dimensions"):
        figure(charts["dimensions"], 16.4, C["figBar"])
    if charts.get("radar"):
        figure(charts["radar"], 11.5, C["figRadar"])

    make_table(
        [C["tableDimension"], C["tableWeight"], C["tableScore"], C["tablePoints"], C["tableRationale"]],
        [
            [d["label"], f"{d['applicableWeight']}%", str(d["score"]), f"{d['earned']} / {d['possible']}", d["rationale"]]
            for d in model["dimensions"]
        ],
        [3.2, 1.3, 1.3, 2.0, 8.6],
        align=[None, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, None],
    )

    # --- Competitor comparison ------------------------------------------------------
    """
    ONE ENGINE, MANY COLUMNS: WHAT THIS TABLE IS AND IS NOT.

    It is the twelve dimension scores of this site beside the same twelve scores for the sites the
    client named, scanned by the same code on the same day. It is not a market view, not a ranking
    and not a sample of the industry, and the paragraph above the table says all three in the
    client's language rather than leaving the reader to assume the columns are representative.

    WHY "NOT MEASURED" IS TYPESET AND NOT SKIPPED. A rival whose scan returned nothing has no
    score, and the failure this table must not have is a fabricated 0 - a client reads a zero as
    "this competitor is worse than us at GEO" and acts on it. So the cell says "not measured" and
    the note under the table names the domains and the reason. Nothing in this section sums,
    averages or ranks the columns: an average over a column containing "not measured" would be a
    number this run did not measure, which is the whole thing the repository refuses.
    """
    rivals = model.get("competitors") or []
    if rivals:
        unmeasured_label = C.get("competitorsUnmeasured") or "not measured"

        """
        The paragraph and the two caveats are printed exactly as the model carries them, and this
        file deliberately does NOT rebuild them from `competitors`. build-report.mts composes them,
        for one reason worth repeating here: it is the only process that knows which rivals the run
        actually attempted, and it is the process that writes the Markdown. Rebuilding the same
        sentences in Python would give one run two authors for one caveat, which is the drift
        lib/geo/scan.ts exists to prevent on the scoring side. The `.get` chains serve a model
        written before this section existed; a fresh model always carries both keys.
        """
        heading(C.get("sectionCompetitors") or "Competitor comparison")
        doc.add_paragraph(model.get("competitorsNote") or "")
        header_row = (
            [
                C.get("competitorsHeaderDimension") or C["tableDimension"],
                # "This site: example.com" rather than the bare domain, which beside three rival
                # domains reads as a fourth competitor - and this is the only column the reader
                # can act on.
                f"{C.get('competitorsHeaderSite') or 'This site'}: {meta['domain']}",
            ]
            + [c["domain"] for c in rivals]
        )
        body_rows = [
            [
                C.get("competitorsOverallRow") or "Overall",
                f"{score['total']} / 100 {score['grade']}",
            ]
            + [competitor_cell(c, unmeasured_label) for c in rivals]
        ]
        for d in model["dimensions"]:
            body_rows.append(
                [d["label"], str(d["score"])]
                + [
                    competitor_cell(
                        c,
                        unmeasured_label,
                        str((c.get("dimensions") or {}).get(d["id"]))
                        if c.get("measured") and (c.get("dimensions") or {}).get(d["id"]) is not None
                        else None,
                    )
                    for c in rivals
                ]
            )

        """
        Column widths are solved from the text area rather than written per table, because the
        number of competitors is the client's choice and this file cannot know it. Summing to 16.4
        of the 16.6cm text area keeps the margin the other tables already keep; the first version
        of this report asked for 17.0cm and clipped the last column, which is the bug
        set_table_geometry's docstring is about. The dimension column never goes below 3.2cm (it
        holds "Metadata & Discoverability" and its Chinese equivalent) and no value column below
        2.2cm, so a wide comparison stays legible instead of becoming twelve slivers.
        """
        value_cols = len(rivals) + 1
        value_width = max(2.2, (16.4 - 3.2) / value_cols)
        widths = [3.2] + [value_width] * value_cols
        widths = [w * (16.4 / sum(widths)) for w in widths]
        make_table(
            header_row,
            body_rows,
            widths,
            align=[None] + [WD_ALIGN_PARAGRAPH.CENTER] * value_cols,
        )

        for warning in model.get("competitorsWarnings") or []:
            doc.add_paragraph(warning, style="Small")

    # --- Fix list ------------------------------------------------------------------
    heading(C["sectionFixes"])
    if not model["fixes"]:
        doc.add_paragraph(C["calloutAllPass"])
    else:
        make_table(
            ["#", C["tableCheck"], C["tableDimension"], C["tableSeverity"], C["tableAtStake"], C["tableEvidence"], C["tableFix"]],
            [
                [
                    str(f["priority"]),
                    f["title"],
                    f["dimension"],
                    C["severityHigh"] if f["severity"] == "high" else C["severityMedium"] if f["severity"] == "medium" else C["severityLow"],
                    f"{f['pointsAtStake']}{C['pointsUnit']}",
                    f["evidence"],
                    f["recommendation"],
                ]
                for f in model["fixes"]
            ],
            [0.8, 3.2, 2.1, 1.1, 1.5, 3.9, 3.8],
            align=[WD_ALIGN_PARAGRAPH.CENTER, None, None, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.RIGHT, None, None],
        )

    # --- Every check ---------------------------------------------------------------
    heading(C["sectionChecks"])
    status_of = {"pass": C["statusPass"], "warn": C["statusWarn"], "fail": C["statusFail"], "na": C["statusNa"]}
    make_table(
        [C["tableCheck"], C["tableDimension"], C["tableStatus"]],
        [[c["title"], c["dimension"], status_of.get(c["status"], c["status"])] for c in model["checks"]],
        [8.2, 5.2, 3.0],
    )

    # --- Limits and method ---------------------------------------------------------
    heading(C["sectionLimits"])
    for key in ["limitOnlyHomepage", "limitNoAi", "limitNoCitation", "limitWaf", "limitCwv"]:
        doc.add_paragraph(C[key], style="List Bullet")
    if meta["browserStatus"] is not None:
        doc.add_paragraph(C["limitIpHint"], style="List Bullet")

    heading(C["sectionMethod"])
    for text in [
        C["methodEngine"],
        C["methodWeights"].replace("{url}", model["site"]),
        C["methodPointsAtStake"],
        C["methodApplicable"],
        C["methodGenerated"].replace("{url}", model["site"]).replace("{date}", meta["scanDate"]),
    ]:
        doc.add_paragraph(text, style="List Bullet")

    doc.save(out)


# --------------------------------------------------------------------------------------
# XLSX
# --------------------------------------------------------------------------------------
def xlsx_tools(wb):
    """
    The workbook's one sheet writer and its house style, in one place for both report types.

    WHY THE SAME ARGUMENT AS docx_tools APPLIES HERE. `sheet()` is the only thing in this file that
    writes a worksheet: it sets the header fill and font, the thin border, the column widths, the
    freeze pane and the autofilter, and every sheet in both workbooks goes through it. A second copy
    for the AI-visibility workbook would be a second answer to "what does a header row look like",
    and the first thing to drift would be the autofilter - which is the one part of a spreadsheet
    that a reader notices only when it is missing.

    `used` is returned rather than hidden because the workbook's first sheet is the one openpyxl
    creates for free, and the caller decides at the end whether that default sheet was consumed.
    """
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
    from openpyxl.utils import get_column_letter

    head_fill = PatternFill("solid", fgColor="0071E3")
    head_font = Font(color="FFFFFF", bold=True, size=10)
    thin = Side(style="thin", color="D2D2D7")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)
    wrap = Alignment(vertical="top", wrap_text=True)
    top = Alignment(vertical="top")
    used = [False]

    def sheet(title, headers, rows, widths, wrap_cols=()):
        ws = wb.create_sheet(title) if wb.sheetnames != ["Sheet"] or used[0] else wb.active
        if ws.title == "Sheet":
            ws.title = title
        used[0] = True
        ws.append(headers)
        for i, h in enumerate(headers, start=1):
            c = ws.cell(row=1, column=i)
            c.fill = head_fill
            c.font = head_font
            c.border = border
            c.alignment = Alignment(vertical="center", wrap_text=True)
            ws.column_dimensions[get_column_letter(i)].width = widths[i - 1]
        for row in rows:
            ws.append(row)
        for r in ws.iter_rows(min_row=2, max_row=ws.max_row, max_col=len(headers)):
            for c in r:
                c.border = border
                c.alignment = wrap if c.column in wrap_cols else top
                c.font = Font(size=10)
        ws.freeze_panes = "A2"
        if ws.max_row > 1:
            ws.auto_filter.ref = f"A1:{get_column_letter(len(headers))}{ws.max_row}"
        return ws

    return SimpleNamespace(sheet=sheet, used=used)


def build_xlsx(model: dict, out: Path) -> None:
    from openpyxl import Workbook

    C = model["copy"]
    meta, score = model["meta"], model["score"]
    wb = Workbook()

    T = xlsx_tools(wb)
    sheet, ws_used = T.sheet, T.used

    sheet(
        C["sheetOverview"],
        [C["tableItem"], C["tableValue"]],
        [
            [C["kScore"], f"{score['total']} / 100"],
            [C["kGrade"], f"{score['grade']} — {score['gradeLabel']}"],
            [C["kPassed"], f"{score['checksPassed']} / {score['checksRun']}"],
            [C["kNotApplicable"], score["checksNotApplicable"]],
            [C["kPageType"], meta["pageType"]],
            [C["kScheme"], meta["scheme"]],
            [C["kHomeStatus"], meta["homeStatus"]],
            [C["kBrowserProbe"], C["probeNotNeeded"] if meta["browserStatus"] is None else meta["browserStatus"]],
            [C["kFinalUrl"], meta["finalUrl"]],
            [C["kTruncated"], C["yes"] if meta["truncated"] else C["no"]],
            [C["kScannedAt"], meta.get("scannedAtDisplay", meta["scannedAt"])],
            ["—", model["callout"]],
        ],
        [22, 90],
        wrap_cols=(2,),
    )

    sheet(
        C["sheetDimensions"],
        ["id", C["tableDimension"], C["tableWeight"], C["tableScore"], C["tablePoints"], C["tableRationale"]],
        [
            [d["id"], d["label"], d["applicableWeight"], d["score"], f"{d['earned']} / {d['possible']}", d["rationale"]]
            for d in model["dimensions"]
        ],
        [22, 24, 10, 10, 14, 70],
        wrap_cols=(6,),
    )

    sheet(
        C["sheetFixes"],
        [C["tablePriority"], "id", C["tableCheck"], C["tableDimension"], C["tableSeverity"], C["tableAtStake"], C["tableEvidence"], C["tableFix"]],
        [
            [
                f["priority"],
                f["id"],
                f["title"],
                f["dimension"],
                C["severityHigh"] if f["severity"] == "high" else C["severityMedium"] if f["severity"] == "medium" else C["severityLow"],
                f["pointsAtStake"],
                f["evidence"],
                f["recommendation"],
            ]
            for f in model["fixes"]
        ],
        [10, 22, 34, 22, 10, 12, 60, 60],
        wrap_cols=(7, 8),
    )

    status_of = {"pass": C["statusPass"], "warn": C["statusWarn"], "fail": C["statusFail"], "na": C["statusNa"]}
    sheet(
        C["sheetChecks"],
        ["id", C["tableCheck"], C["tableDimension"], "dimension_id", C["tableStatus"]],
        [[c["id"], c["title"], c["dimension"], c["dimensionId"], status_of.get(c["status"], c["status"])] for c in model["checks"]],
        [24, 46, 24, 22, 12],
        wrap_cols=(2,),
    )

    """
    The comparison as its own sheet, and the reason it is a sheet rather than an addition to the
    Dimensions one: the two are keyed differently. Dimensions is one row per dimension for THIS
    site; the comparison is one row per dimension with a column per site, and appending columns to
    the first sheet would leave every row about this site carrying four empty cells. It is a small
    addition only because it is exactly the shape `sheet()` already writes - no new helper, no new
    geometry rule, and the workbook's own text area is not a constraint.

    A not-measured competitor gets the same word the other two formats print, not an empty cell:
    a blank cell in a spreadsheet column of numbers is read as a zero by every average anyone will
    ever run over it, which is the invented number this feature exists to avoid.

    A refused competitor keeps its number here too, and carries the "(HTTP 403)" marker in the
    same cell through competitor_cell() - a workbook is where somebody will run =AVERAGE() down a
    column, so the marker has to travel with the value rather than sit in a note. The overall row
    is the one row here that is a STRING ("14 / 100 F (HTTP 403)") rather than a number, because
    that row is the score and its grade; the twelve rows below it stay numeric so the column can
    actually be averaged, which is the only reason a spreadsheet exists.
    """
    rivals = model.get("competitors") or []
    if rivals:
        unmeasured_label = C.get("competitorsUnmeasured") or "not measured"
        """
        Sheet names are capped at 31 characters by the format itself and openpyxl only warns, so
        the cap is applied here: the Chinese heading for this section is longer than that, and a
        workbook whose sheet name the format does not allow is one a client's Excel may refuse to
        open. The full heading is still the section title in the DOCX and the Markdown, which have
        no such limit.
        """
        sheet_title = (C.get("sectionCompetitors") or "Competitors")[:31]
        sheet(
            sheet_title,
            [C.get("competitorsHeaderDimension") or C["tableDimension"]]
            + [f"{C.get('competitorsHeaderSite') or 'This site'}: {meta['domain']}"]
            + [c["domain"] for c in rivals],
            [
                [C.get("competitorsOverallRow") or "Overall", score["total"]]
                + [competitor_cell(c, unmeasured_label) for c in rivals]
            ]
            + [
                [d["label"], d["score"]]
                + [
                    competitor_cell(
                        c,
                        unmeasured_label,
                        (c.get("dimensions") or {}).get(d["id"])
                        if c.get("measured") and (c.get("dimensions") or {}).get(d["id"]) is not None
                        else None,
                    )
                    for c in rivals
                ]
                for d in model["dimensions"]
            ],
            [26] + [22] * (len(rivals) + 1),
        )

    sheet(
        C["sheetMeta"],
        ["key", "value"],
        [
            ["domain", meta["domain"]],
            ["scanned_at", meta["scannedAt"]],
            ["scanned_at_display", meta.get("scannedAtDisplay", meta["scannedAt"])],
            ["scan_date", meta["scanDate"]],
            ["scheme", meta["scheme"]],
            ["home_status", meta["homeStatus"]],
            ["browser_status", meta["browserStatus"]],
            ["final_url", meta["finalUrl"]],
            ["truncated", meta["truncated"]],
            ["page_type", meta["pageType"]],
            ["checks_run", score["checksRun"]],
            ["checks_passed", score["checksPassed"]],
            ["checks_not_applicable", score["checksNotApplicable"]],
            ["total_applicable_weight", score["totalApplicableWeight"]],
            ["engine", model["generatedBy"]],
            ["site", model["site"]],
            ["lang", model["lang"]],
            # The comparison's method and its caveats, in the machine-readable sheet as well as the
            # About one: whoever pulls this workbook into a spreadsheet is exactly the reader who
            # will average a column, and that reader needs "HTTP 403" and "not measured" to be in
            # the data rather than in a paragraph on another tab.
            *(
                [[f"competitor_{i + 1}", c["domain"]] for i, c in enumerate(model.get("competitors") or [])]
                + [["competitors_note", model.get("competitorsNote") or ""]]
                + [[f"competitors_warning_{i + 1}", w] for i, w in enumerate(model.get("competitorsWarnings") or [])]
                if model.get("competitors")
                else []
            ),
        ],
        [28, 80],
        wrap_cols=(2,),
    )

    sheet(
        C["sheetAbout"],
        [C["tableItem"], C["tableValue"]],
        [
            [C["aboutPurpose"], C["aboutPurposeText"]],
            [C["sectionLimits"], C["limitOnlyHomepage"]],
            ["", C["limitNoAi"]],
            ["", C["limitNoCitation"]],
            ["", C["limitWaf"]],
            ["", C["limitCwv"]],
            [C["sectionMethod"], C["methodEngine"]],
            ["", C["methodWeights"].replace("{url}", model["site"])],
            ["", C["methodPointsAtStake"]],
            ["", C["methodApplicable"]],
            ["", C["methodGenerated"].replace("{url}", model["site"]).replace("{date}", meta["scanDate"])],
            # The comparison's own method and caveats, so the workbook is not the one format a
            # reader has to open the DOCX beside to find out what its columns mean.
            *(
                [[C.get("sectionCompetitors") or "Competitors", model.get("competitorsNote") or ""]]
                + [["", w] for w in (model.get("competitorsWarnings") or [])]
                if model.get("competitors")
                else []
            ),
        ],
        [22, 100],
        wrap_cols=(2,),
    )

    if "Sheet" in wb.sheetnames and not ws_used[0]:
        del wb["Sheet"]
    wb.save(out)


# --------------------------------------------------------------------------------------
# Figure: brand mentions per question, counted in runs
# --------------------------------------------------------------------------------------
def truncate(text: str, limit: int) -> str:
    text = str(text).strip()
    return text if len(text) <= limit else text[:limit] + "…"


# --------------------------------------------------------------------------------------
# Figure machinery shared by the four AI-visibility charts
# --------------------------------------------------------------------------------------
"""
THE WIDTH EVERY VISIBILITY FIGURE IS PLACED AT, in cm: the same 16.4 the report's tables sum to
inside the 16.6cm text area. It is declared here because a chart's own DPI has to describe the size
a reader sees. At the scan report's 192 DPI the ten-row per-question figure is 28cm wide as stored
- not the width it is printed at - so "does this image fit the page?" cannot be answered from the
file itself, which is exactly the question verify_geometry() and a reader both ask. save_figure()
writes the DPI that makes the stored size equal the placed size.

THE SCAN REPORT'S CHARTS KEEP THEIR OWN DPI. They are placed at two different widths (16.4cm and
11.5cm), so a single constant would be wrong for one of them, and rewriting the metadata of a
figure nobody complained about is a change with no reader-visible benefit. The rule lives with the
charts that need it.
"""
FIGURE_WIDTH_CM = 16.4


def save_figure(img: Image.Image, out: Path, width_cm: float = FIGURE_WIDTH_CM) -> int:
    """Save a chart with the DPI of the width it is placed at, and return that DPI."""
    dpi = max(1, round(img.width / (width_cm / 2.54)))
    img.save(out, dpi=(dpi, dpi))
    return dpi


def count_label(text: str) -> str:
    """
    Every string an AI-visibility chart draws goes through here.

    WHY A GUARD AT THE DRAWING SITE AND NOT ONLY assertNoPercent() IN THE BUILD SCRIPT. That check
    covers the model's copy block - the captions, the axis labels, the legend entries. It cannot see
    a label this file composes out of the model's numbers ("2 / 3", "14"), and it cannot see a
    number either. The rule this whole report is built on is that no percentage is printed anywhere,
    and a figure is the one place a percentage appears without anybody deciding to write one: an
    axis, a slice, a share. So the drawing helpers refuse a "%" at the moment it would be drawn,
    which is the last point at which one could enter a figure.
    """
    text = str(text)
    assert "%" not in text, f"a chart label may not contain a percentage: {text!r}"
    return text


def chart_mentions(model: dict, out: Path) -> None:
    """
    One bar per question: how many of that question's runs mentioned the brand.

    THE AXIS IS RUNS - 0, 1, 2, 3 - AND NOT A PERCENTAGE, which is the whole reason this figure
    looks unlike the scan report's charts. A 0-100 axis would invite the reader to divide, and the
    service definition for this product refuses percentages outright: three runs cannot support
    one, and a chart is where a percentage is most likely to appear without anybody deciding to
    write it. The value beside each bar is printed as "2 / 3", which is the same form the tables
    use, so the figure and the tables cannot be read differently.

    THE LABEL COLUMN IS MEASURED FROM THE LABELS, for the reason chart_dimensions gives: a fixed
    width fits one language's questions and clips another's. The question text is truncated rather
    than wrapped - a wrapped row would need a variable row height and a legend explaining where the
    column went; the tables below carry every question in full.

    WHAT CHANGED WHEN THE OTHER THREE FIGURES ARRIVED, reported here because this figure already
    was 逐题提及 and the task was to improve it rather than draw a second one: the axis label now
    names what is counted and over how many runs, a rule separates the three question blocks inside
    a ten-row chart, and the file carries the DPI of its placed width (see save_figure) instead of
    the scan report's 192.
    """
    questions = model["questions"]
    t = count_label
    scale = 2
    pad = 28 * scale
    tag_w = 44 * scale
    gap = 24 * scale
    value_w = 150 * scale
    row_h = 46 * scale
    track_w = 420 * scale
    """
    TWO AXIS LINES, NOT ONE. The unit label used to share the tick row and be right-aligned past
    the end of the track - which was fine for the four-character "运行次数" and collided with the
    last tick the moment the label became a sentence ("提及次数（每题 3 次运行）"): the "3" of a
    0-3 axis was drawn underneath it. The ticks keep the first line and the unit gets the second,
    centred under the track where an axis title belongs.
    """
    axis_h = 62 * scale

    f_label = font(20 * scale, bold=True)
    f_small = font(16 * scale)
    f_tick = font(15 * scale)
    probe = ImageDraw.Draw(Image.new("RGB", (1, 1)))

    labels = [f"Q{q['q']}  {truncate(q['question'], 16)}" for q in questions]
    widest = max((probe.textlength(label, font=f_label) for label in labels), default=0)
    label_w = tag_w + int(widest) + gap

    width = pad * 2 + label_w + track_w + value_w
    height = pad * 2 + row_h * len(questions) + axis_h
    img = Image.new("RGB", (width, height), SURFACE_2)
    d = ImageDraw.Draw(img)

    x0 = pad + label_w
    base = pad + row_h * len(questions) + 4 * scale

    """
    THE GRID LINES ARE DRAWN BEFORE THE BARS, not after. The first version drew the rows first and the
    axis second, and the vertical rules at 1, 2 and 3 landed ON TOP of every bar - a full bar read as
    three coloured segments, which is the opposite of what a count chart is for. Drawing the scale
    first puts the bars over it and keeps the ticks visible in the whitespace beside them.
    """
    for tick in range(4):
        x = x0 + int(track_w * tick / 3)
        d.line([x, pad, x, base], fill=SURFACE_1)

    for i, q in enumerate(questions):
        y = pad + i * row_h
        cy = y + row_h // 2
        runs = max(1, int(q.get("okRuns") or 0))
        count = int(q["brandMentions"])

        d.text((pad, cy), t(q.get("groupShort", "")), font=f_small, fill=INK_3, anchor="lm")
        d.text((pad + tag_w, cy), t(labels[i]), font=f_label, fill=INK_1, anchor="lm")

        d.rectangle([x0, cy - 12 * scale, x0 + track_w, cy + 12 * scale], fill=SURFACE_1)
        filled = int(track_w * min(count, runs) / runs)
        if count > 0:
            # Two tokens, no invented colour: full marks gets the "ok" green, any other mention the
            # accent. A zero bar stays the surface colour rather than being drawn as a red - a
            # question that was not mentioned is a measurement, not a failure.
            d.rectangle([x0, cy - 12 * scale, x0 + max(filled, 2 * scale), cy + 12 * scale],
                        fill=OK if count >= runs else ACCENT)
        if count == 0:
            d.rectangle([x0, cy - 12 * scale, x0 + 2 * scale, cy + 12 * scale], fill=LINE)
        d.text((x0 + track_w + 16 * scale, cy), t(f"{count} / {runs}"), font=f_label, fill=INK_1, anchor="lm")

    """
    A rule between the question blocks. Ten identical rows do not say that Q1-Q4, Q5-Q7 and Q8-Q10
    are three different measurements with three different questions behind them, and that is the
    one thing the section this figure sits in keeps saying. The rule is drawn last so it crosses no
    bar, and the group tag in the left column still names every row.
    """
    for i in range(1, len(questions)):
        if questions[i].get("group") != questions[i - 1].get("group"):
            y = pad + i * row_h
            d.line([pad, y, width - pad, y], fill=LINE)

    # The axis says what it counts. The unit is written out because "3/3" alone could be read as a score.
    for tick in range(4):
        x = x0 + int(track_w * tick / 3)
        d.text((x, base + 6 * scale), t(str(tick)), font=f_tick, fill=INK_3, anchor="mm")
    d.text((x0 + track_w // 2, base + 38 * scale),
           t(model["copy"].get("figMentionsAxis", "")), font=f_tick, fill=INK_3, anchor="mm")

    save_figure(img, out)


# --------------------------------------------------------------------------------------
# Figure: brand mentions per question group, counted in runs
# --------------------------------------------------------------------------------------
def chart_groups(model: dict, out: Path) -> None:
    """
    One bar per question group: how many of that group's runs mentioned the brand.

    WHY THE BAR IS THE COUNT AND THE DENOMINATOR IS IN THE LABEL. The three groups do not share a
    denominator - 12, 9 and 9 completed runs - so a bar drawn as a fraction of its own group would
    put a complete "9 / 9" and a partial "4 / 12" on two different scales and make the complete one
    look shorter. The axis is therefore a count axis up to the largest group's run count, the bar is
    the mention count, the label carries "4 / 12" in the same form every table in this report uses,
    and a tick marks where that group's own runs run out. Nothing here is a rate; the number of runs
    is printed beside every bar precisely so nobody has to divide.
    """
    groups = model["groups"]
    C = model["copy"]
    t = count_label
    scale = 2
    pad = 28 * scale
    gap = 26 * scale
    value_w = 150 * scale
    row_h = 54 * scale
    track_w = 420 * scale
    axis_h = 62 * scale

    f_label = font(21 * scale, bold=True)
    f_small = font(16 * scale)
    f_tick = font(15 * scale)
    probe = ImageDraw.Draw(Image.new("RGB", (1, 1)))

    sub = [f"{g['questions']} 题 · {g['runs']} 次运行" for g in groups]
    widest = max(
        [probe.textlength(g["short"], font=f_label) for g in groups]
        + [probe.textlength(s, font=f_small) for s in sub],
        default=0,
    )
    label_w = int(widest) + gap

    width = pad * 2 + label_w + track_w + value_w
    height = pad * 2 + row_h * len(groups) + axis_h
    img = Image.new("RGB", (width, height), SURFACE_2)
    d = ImageDraw.Draw(img)

    x0 = pad + label_w
    base = pad + row_h * len(groups) + 4 * scale
    max_runs = max((int(g["runs"]) for g in groups), default=1) or 1

    step = max(1, math.ceil(max_runs / 4))
    ticks = list(range(0, max_runs + 1, step))
    if ticks[-1] != max_runs:
        ticks.append(max_runs)

    for tick in ticks:
        x = x0 + int(track_w * tick / max_runs)
        d.line([x, pad, x, base], fill=SURFACE_1)

    for i, g in enumerate(groups):
        y = pad + i * row_h
        cy = y + row_h // 2
        runs = max(1, int(g.get("runs") or 0))
        count = int(g["brandMentions"])

        d.text((pad, cy - 10 * scale), t(g["short"]), font=f_label, fill=INK_1, anchor="lm")
        d.text((pad, cy + 15 * scale), t(sub[i]), font=f_small, fill=INK_3, anchor="lm")

        d.rectangle([x0, cy - 13 * scale, x0 + track_w, cy + 13 * scale], fill=SURFACE_1)
        filled = int(track_w * min(count, max_runs) / max_runs)
        if count > 0:
            # The same two tokens chart_mentions uses: a group whose every run mentioned the brand
            # gets the "ok" green, any other non-zero count the accent, and a zero stays a measured
            # zero rather than being drawn as a failure.
            d.rectangle([x0, cy - 13 * scale, x0 + max(filled, 2 * scale), cy + 13 * scale],
                        fill=OK if count >= runs else ACCENT)
        else:
            d.rectangle([x0, cy - 13 * scale, x0 + 2 * scale, cy + 13 * scale], fill=LINE)

        # Where this group's runs run out: "9 / 9" is a complete group and the tick says so without
        # the bar having to be read against another group's denominator.
        xr = x0 + int(track_w * min(runs, max_runs) / max_runs)
        d.line([xr, cy - 19 * scale, xr, cy + 19 * scale], fill=INK_3)

        d.text((x0 + track_w + 16 * scale, cy), t(f"{count} / {runs}"), font=f_label, fill=INK_1, anchor="lm")

    for tick in ticks:
        x = x0 + int(track_w * tick / max_runs)
        d.text((x, base + 6 * scale), t(str(tick)), font=f_tick, fill=INK_3, anchor="mm")
    d.text((x0 + track_w // 2, base + 38 * scale),
           t(C.get("figGroupsAxis", "")), font=f_tick, fill=INK_3, anchor="mm")

    save_figure(img, out)


# --------------------------------------------------------------------------------------
# Figure: the entity conclusion, 2 runs against 1, as a pie
# --------------------------------------------------------------------------------------
def chart_entity_conclusion(model: dict, out: Path) -> None:
    """
    The report's headline finding as a pie: how the three Q6 runs concluded.

    A PIE ENCODES A PROPORTION, AND THIS ONE IS STILL LABELLED AS COUNTS. The angle is the only
    place in this report where a share is drawn at all, and it is drawn because this is the one
    finding that IS a composition - two runs concluded the two names are the same company, one
    concluded they are not - and because the owner asked for a pie. What the figure may not do is
    turn that composition into a rate: every slice is labelled with its count of runs, the legend
    repeats the count in words, the note states n = 3, and count_label() refuses to draw a "%" at
    all. The caption under the figure states the classification rule and points at the verbatim
    excerpts later in the same section, so a reader checks the two slices against the answers rather
    than estimating an angle.
    """
    conc = model["entityConclusion"]
    C = model["copy"]
    t = count_label
    scale = 2
    pad = 28 * scale
    gap = 44 * scale
    radius = 250 * scale
    swatch = 26 * scale

    f_legend = font(21 * scale, bold=True)
    f_note = font(15 * scale)
    f_slice = font(20 * scale, bold=True)
    probe = ImageDraw.Draw(Image.new("RGB", (1, 1)))

    same, not_same = int(conc["same"]), int(conc["notSame"])
    total = int(conc["total"]) or 1

    legend = [
        (ACCENT, t(C["figEntitySame"]), f_legend),
        (WARN, t(C["figEntityNotSame"]), f_legend),
    ]
    note = t(C["figEntityN"])
    legend_w = max(
        [probe.textlength(text, font=f) for _, text, f in legend]
        + [probe.textlength(note, font=f_note)]
    )

    width = pad * 2 + 2 * radius + gap + swatch + 16 * scale + int(legend_w)
    height = pad * 2 + 2 * radius
    img = Image.new("RGB", (width, height), SURFACE_2)
    d = ImageDraw.Draw(img)

    box = [pad, pad, pad + 2 * radius, pad + 2 * radius]
    cx = cy = pad + radius
    # Pillow measures from 3 o'clock; -90 puts the first slice's edge at 12 o'clock.
    start = -90.0
    for value, colour in ((same, ACCENT), (not_same, WARN)):
        if value <= 0:
            continue
        extent = 360.0 * value / total
        d.pieslice(box, start, start + extent, fill=colour, outline=SURFACE_2, width=2 * scale)
        mid = math.radians(start + extent / 2.0)
        d.text(
            (cx + 0.62 * radius * math.cos(mid), cy + 0.62 * radius * math.sin(mid)),
            t(f"{value} 次"),
            font=f_slice,
            fill=SURFACE_2,
            anchor="mm",
        )
        start += extent

    lx = pad + 2 * radius + gap
    ly = cy - 46 * scale
    for colour, text, f in legend:
        d.rectangle([lx, ly - 8 * scale, lx + swatch, ly + 8 * scale], fill=colour)
        d.text((lx + swatch + 16 * scale, ly), text, font=f, fill=INK_1, anchor="lm")
        ly += 40 * scale
    d.text((lx, ly + 6 * scale), note, font=f_note, fill=INK_2, anchor="lm")

    save_figure(img, out)


# --------------------------------------------------------------------------------------
# Figure: the cited domains, as bars
# --------------------------------------------------------------------------------------
def chart_sources(model: dict, out: Path) -> None:
    """
    A horizontal bar per cited domain: how many citation events named it.

    WHY A BAR CHART AND NOT A PIE, which is a choice this figure has to make and the entity figure
    does not. The source distribution is a long tail: the twelve domains drawn here carry 80 of the
    176 citation events and the other 71 domains carry 96. A pie would therefore spend more than
    half its circle on an "其他" slice - a slice that is not a source, that no reader can act on,
    and that would still compress the twelve real domains into hairlines nothing can be read off.
    Bars keep every count comparable and legible, which is the only thing this figure is for; the
    table above it carries the same numbers, so the figure adds shape rather than information.

    THE BARS ARE COUNTS, NOT RATINGS. The label is the raw citation-event count, the axis is that
    same count, there is no percentage and no ranking language: a domain cited often is a domain the
    answers linked often. The paragraph above the table says what that does and does not mean, and
    the caption repeats the "not a ranking" caveat because a reader may look at the figure first.
    """
    domains = model["domains"]
    C = model["copy"]
    t = count_label
    scale = 2
    pad = 28 * scale
    gap = 24 * scale
    value_w = 90 * scale
    row_h = 46 * scale
    track_w = 420 * scale
    axis_h = 62 * scale

    f_label = font(19 * scale, bold=True)
    f_tick = font(15 * scale)
    probe = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    widest = max((probe.textlength(entry["domain"], font=f_label) for entry in domains), default=0)
    label_w = int(widest) + gap

    width = pad * 2 + label_w + track_w + value_w
    height = pad * 2 + row_h * len(domains) + axis_h
    img = Image.new("RGB", (width, height), SURFACE_2)
    d = ImageDraw.Draw(img)

    x0 = pad + label_w
    base = pad + row_h * len(domains) + 4 * scale
    max_count = max((int(entry["count"]) for entry in domains), default=1) or 1

    step = max(1, math.ceil(max_count / 4))
    ticks = list(range(0, max_count + 1, step))
    if ticks[-1] != max_count:
        ticks.append(max_count)

    for tick in ticks:
        x = x0 + int(track_w * tick / max_count)
        d.line([x, pad, x, base], fill=SURFACE_1)

    for i, entry in enumerate(domains):
        y = pad + i * row_h
        cy = y + row_h // 2
        count = int(entry["count"])

        d.text((pad, cy), t(entry["domain"]), font=f_label, fill=INK_1, anchor="lm")
        d.rectangle([x0, cy - 12 * scale, x0 + track_w, cy + 12 * scale], fill=SURFACE_1)
        filled = int(track_w * count / max_count)
        # One colour for every bar. A "top domain" in a different colour would be this file making
        # the ranking judgement the caption says the figure is not making.
        d.rectangle([x0, cy - 12 * scale, x0 + max(filled, 2 * scale), cy + 12 * scale], fill=ACCENT)
        d.text((x0 + track_w + 16 * scale, cy), t(str(count)), font=f_label, fill=INK_1, anchor="lm")

    for tick in ticks:
        x = x0 + int(track_w * tick / max_count)
        d.text((x, base + 6 * scale), t(str(tick)), font=f_tick, fill=INK_3, anchor="mm")
    d.text((x0 + track_w // 2, base + 38 * scale),
           t(C.get("figSourcesAxis", "")), font=f_tick, fill=INK_3, anchor="mm")

    save_figure(img, out)


# --------------------------------------------------------------------------------------
# DOCX - AI visibility report
# --------------------------------------------------------------------------------------
def build_visibility_docx(model: dict, out: Path, charts: dict) -> None:
    """
    The AI-visibility report: measured answers in, a document out, and no score anywhere in it.

    WHY THERE IS NO HEADLINE SCORE AND NO WEIGHTED APPENDIX. The reference document this report's
    STRUCTURE follows publishes a score out of 100 built from six weighted indicators. That is a
    legitimate thing to do with 400 synthesised records; it is not a legitimate thing to do with 30
    measured answers, three per question. A weighted score would be a number with no measurement
    behind it, and it is the one number a client would quote. So the headline slot holds the reach
    count ("4 / 12") and the appendix says in as many words why no score is given.
    """
    doc, T = docx_scaffold(model)
    set_run, make_table = T.set_run, T.make_table
    callout, figure, heading = T.callout, T.figure, T.heading

    from docx.enum.text import WD_ALIGN_PARAGRAPH

    C = model["copy"]
    meta = model["meta"]

    def para(text, style=None):
        return doc.add_paragraph(text, style=style) if style else doc.add_paragraph(text)

    def bullets(items, style="List Bullet"):
        for item in items:
            doc.add_paragraph(item, style=style)

    def count_cell(mentions, runs):
        """
        Counts, or the words that say there is no count - never a zero standing in for neither.

        `mentions is None` is a column that could NOT be measured (the intake listed no category
        vocabulary, so the collector recorded null): printing "0 / 3" there would be a finding about the
        answers produced by a missing input. Two ways of having no number, and the cell must not turn
        either of them into zero.
        """
        if not runs or mentions is None:
            return C["notMeasured"]
        return f"{mentions} / {runs}"

    # --- Cover / one-page overview -------------------------------------------------
    doc.add_paragraph(C["reportName"], style="Heading 1")
    p = doc.add_paragraph(style="Score")
    set_run(p.add_run(model["headline"]["value"]), size=40, bold=True, color=ACCENT)
    p = doc.add_paragraph(style="Subtitle2")
    set_run(p.add_run(model["headline"]["caption"]), size=11, color=INK_2)
    callout(model["headline"]["callout"])

    make_table(
        [C["tableItem"], C["tableValue"]],
        [
            [C["kSubject"], meta["subject"]],
            [C["kModel"], meta["model"]],
            [C["kRunMode"], meta["runModeLabel"]],
            [C["kMeasuredOn"], meta["measuredOn"]],
            [C["kWebSearch"], C["yes"] if meta["webSearch"] else C["no"]],
            [C["kRunsPerQuestion"], f"{meta['runsPerQuestion']}"],
            [C["kAnswersFile"], meta["answersFile"]],
            [C["kCompleted"], f"{meta['answersOk']} / {meta['answersFileLines']}"],
            [C["kExcluded"], meta["failureSummary"]],
            [C["kTokens"], f"{meta['totalTokens']:,}"],
            [C["kCitations"], f"{meta['citationEvents']} / {meta['distinctDomains']}"],
            [C["kGeneratedAt"], meta["generatedAtDisplay"]],
        ],
        [5.0, 11.4],
    )

    """
    WHERE EACH FIGURE SITS, and why none of them is a decorative opening image: 图 1 in 本次测量覆盖
    了什么 beside the group table it summarizes, 图 2 in AI 可见度总览 beside the per-question table, 图
    3 in 实体识别 immediately under the finding it is the headline of, 图 4 in 信源网络 beside the
    domain table. A chart on the cover and the same numbers three pages later is how a reader ends up
    treating the chart as the finding and the table as the appendix.
    """

    # --- 一、本次问的是什么：题库与批准记录 ------------------------------------------
    """
    WHY THE BANK COMES FIRST, BEFORE ANY CONCLUSION.

    The product's own process (intake/README.md) is: the client approves a bank, the bank is frozen, and
    only then is anything measured. A reader who meets the headline count before meeting the questions
    has no way to judge it, and after a re-test the fingerprint on this page is the only thing that says
    whether the two numbers describe the same questions. Every string here comes from the model, which
    took it from the run file's header - so this page describes the bank that was actually run, not the
    bank somebody remembers approving.
    """
    bank = model.get("bank") or {}
    heading(C["sectionBank"])
    para(C["bankLead"])
    if bank.get("rows"):
        make_table(
            [C["tableItem"], C["tableValue"]],
            [[row["label"], row["value"]] for row in bank["rows"]],
            [5.0, 11.4],
        )
    if C.get("bankFrozen"):
        callout(C["bankFrozen"])
    para(C["bankApprovalLine"])
    if C.get("bankIntakeDrift"):
        para(C["bankIntakeDrift"])
    if bank.get("questions"):
        heading(C["bankQuestionsTitle"], 2)
        for a in bank.get("archetypes", []):
            in_group = [q for q in bank["questions"] if q["group"] == a["id"]]
            if not in_group:
                continue
            heading(a.get("heading") or a["label"], 2)
            if a.get("measures"):
                para(a["measures"])
            make_table(
                [C["thId"], C["thText"]],
                [[q["id"], q["text"]] for q in in_group],
                [3.0, 13.4],
            )

    # --- 二、执行摘要 ---------------------------------------------------------------
    heading(C["sectionSummary"])
    callout(C["summaryCallout"])

    heading(C["sectionSummaryConclusions"], 2)
    for key in ("summaryReach", "summaryEntity", "summaryFacts"):
        para(C[key])

    heading(C["sectionCoverage"], 2)
    para(C["coverageLead"])
    make_table(
        [C["thGroup"], C["thQuestions"], C["thRuns"], C["thBrand"], C["thCoatings"]],
        [
            [
                g["label"],
                str(g["questions"]),
                str(g["runs"]),
                count_cell(g["brandMentions"], g["runs"]),
                count_cell(g["coatingsMentions"], g["runs"]),
            ]
            for g in model["groups"]
        ]
        + [[
            C["thTotal"],
            str(len(model["questions"])),
            str(model["totals"]["runs"]),
            count_cell(model["totals"]["brandMentions"], model["totals"]["runs"]),
            count_cell(model["totals"]["coatingsMentions"], model["totals"]["runs"]),
        ]],
        [4.6, 3.6, 2.6, 3.0, 2.6],
        align=[None, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER],
    )
    para(C["coverageNote"])
    if charts.get("groups"):
        figure(charts["groups"], 16.4, C["figGroups"])

    heading(C["sectionNotMeasured"], 2)
    bullets(model["limits"])

    # --- 二、AI 可见度总览 ----------------------------------------------------------
    heading(C["sectionOverview"])
    para(C["overviewLead"])
    make_table(
        [C["thNo"], C["thQuestion"], C["thGroup"], C["thBrand"], C["thCoatings"]],
        [
            [
                f"Q{q['q']}",
                q["question"],
                q["groupShort"],
                count_cell(q["brandMentions"], q["okRuns"]),
                count_cell(q["coatingsMentions"], q["okRuns"]),
            ]
            for q in model["questions"]
        ],
        [1.4, 7.8, 2.1, 2.6, 2.5],
        align=[WD_ALIGN_PARAGRAPH.CENTER, None, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER],
    )
    if charts.get("mentions"):
        figure(charts["mentions"], 16.4, C["figMentions"])
    for key in ("overviewTotals", "overviewPrompted"):
        para(C[key])

    heading(C["sectionHowToRead"], 2)
    bullets([C[key] for key in ("readCounts", "readPrompted", "readDenominator", "readSameDay")])

    # --- 四、实体识别 ----------------------------------------------------------------
    """
    THE SECTION IS ALWAYS PRINTED, ITS EVIDENCE ONLY WHEN THERE IS SOME. When the intake listed no
    short name, alias or former name, the bank contains no name question, the run carries no
    entityQuote and no per-run excerpts - and the lead paragraph says the question was never asked.
    Skipping the section in that case would be the other failure: a reader would take its absence for
    "the model resolved the name correctly".
    """
    heading(C["sectionEntity"])
    para(C["entityLead"])
    entity_quote = model.get("entityQuote")
    if entity_quote:
        callout(entity_quote["text"], size=9)
        para(entity_quote["note"], style="Small")
    if entity_quote and model.get("entityRuns"):
        heading(C["sectionEntityRuns"], 2)
        para(C["entityRunsLead"])
        make_table(
            [C["thRun"], C["thExcerpt"]],
            [[C["runLabel"].replace("{n}", str(r["run"])), r["text"]] for r in model["entityRuns"]],
            [2.0, 14.4],
        )
        para(C["entityFinding"])
        if charts.get("entity"):
            figure(charts["entity"], 16.4, C["figEntity"])

    # --- 四、按问题组拆解 ------------------------------------------------------------
    heading(C["sectionGroups"])
    para(C["groupsLead"])
    for g in model["groups"]:
        heading(g["label"], 2)
        para(g["reading"])
        make_table(
            [C["thNo"], C["thQuestion"], C["thBrand"], C["thCoatings"]],
            [
                [
                    f"Q{q['q']}",
                    q["question"],
                    count_cell(q["brandMentions"], q["okRuns"]),
                    count_cell(q["coatingsMentions"], q["okRuns"]),
                ]
                for q in model["questions"]
                if q["group"] == g["id"]
            ],
            [1.4, 9.9, 2.5, 2.6],
            align=[WD_ALIGN_PARAGRAPH.CENTER, None, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER],
        )

    # --- 五、竞品 --------------------------------------------------------------------
    """
    TWO SHAPES, ONE SECTION. When the collector marked the client's named competitors, the section is
    a share-of-voice table - the column a client asks for first ("then who was named instead?"). When
    it did not (an older run file, or an intake with no competitors.names), the section says so in
    words: a table of zeros would be read as "no competitor was recommended", which is a different
    claim from "nobody counted".
    """
    heading(C["sectionCompetitors"])
    callout(C["competitorsCallout"])
    competitors = model.get("competitors") or []
    if model.get("competitorsMeasured") and competitors:
        para(C["competitorsLead"])
        make_table(
            [C["thCompName"], C["thCompNonBrand"], C["thCompAll"], C["thCompGroups"]],
            [[r["name"], str(r["nonBrand"]), str(r["all"]), r["byGroup"]] for r in competitors],
            [4.0, 3.2, 2.6, 6.6],
            align=[
                None,
                WD_ALIGN_PARAGRAPH.CENTER,
                WD_ALIGN_PARAGRAPH.CENTER,
                None,
            ],
        )
        para(C["competitorsBody"])
        para(C["competitorsNote"])
    else:
        para(C["competitorsBody"])
        bullets([C[key] for key in ("competitorsNone1", "competitorsNone2", "competitorsNone3")])

    # --- 六、信源网络 ----------------------------------------------------------------
    heading(C["sectionSources"])
    para(C["sourcesLead"])
    make_table(
        [C["thDomain"], C["thCount"], C["thWhere"]],
        [[d["domain"], str(d["count"]), "、".join(d["groups"])] for d in model["domains"]],
        [4.8, 2.0, 9.6],
        align=[None, WD_ALIGN_PARAGRAPH.CENTER, None],
    )
    para(C["sourcesNote"])
    if charts.get("sources"):
        figure(charts["sources"], 16.4, C["figSources"])
    heading(C["sectionSourcesCaveat"], 2)
    bullets([C[key] for key in ("sourcesCaveat1", "sourcesCaveat2", "sourcesCaveat3")])

    # --- 八、回答里的事实断言 --------------------------------------------------------
    heading(C["sectionClaims"])
    callout(C["claimsCallout"])
    if model["claims"]:
        make_table(
            [C["thClaim"], C["thSource"], C["thHandling"]],
            [[c["claim"], c["source"], c["handling"]] for c in model["claims"]],
            [6.0, 2.0, 8.4],
            align=[None, WD_ALIGN_PARAGRAPH.CENTER, None],
        )
    para(C["claimsNote"])

    # --- 八、原文摘录 ----------------------------------------------------------------
    heading(C["sectionQuotes"])
    para(C["quotesLead"])
    for quote in model["quotes"]:
        heading(quote["label"], 2)
        p = doc.add_paragraph()
        set_run(p.add_run(C["quoteQuestion"]), size=10, bold=True, color=INK_2)
        set_run(p.add_run(quote["question"]), size=10)
        p = doc.add_paragraph()
        set_run(p.add_run(C["quoteAnswer"]), size=10, bold=True, color=INK_2)
        set_run(p.add_run(quote["text"]), size=10)
        para(quote["note"], style="Small")

    # --- 九、建议 --------------------------------------------------------------------
    heading(C["sectionAdvice"])
    para(C["adviceLead"])
    for item in model["advice"]:
        heading(item["title"], 2)
        for label, key in (
            (C["adviceProblem"], "problem"),
            (C["adviceAction"], "action"),
            (C["adviceDeliverable"], "deliverable"),
            (C["adviceAcceptance"], "acceptance"),
        ):
            p = doc.add_paragraph()
            set_run(p.add_run(label), size=10, bold=True, color=INK_2)
            set_run(p.add_run(item[key]), size=10)

    # --- 复测计划 --------------------------------------------------------------------
    heading(C["sectionPlan"])
    make_table(
        [C["thStage"], C["thWork"], C["thOutput"]],
        model["plan"],
        [2.6, 6.9, 6.9],
    )
    para(C["planNote"])

    # --- 附录：为什么没有评分 --------------------------------------------------------
    heading(C["sectionNoScore"])
    para(C["noScoreLead"])
    bullets([C[key] for key in ("noScore1", "noScore2", "noScore3", "noScore4")])

    # --- 附录：采样设计、方法与限制 --------------------------------------------------
    heading(C["sectionMethodAppendix"])
    heading(C["sectionSampleDesign"], 2)
    para(C["sampleDesignLead"])
    make_table(
        [C["thGroup"], C["thPurpose"], C["thQuestions"], C["thRuns"]],
        [[g["label"], g["purpose"], str(g["questions"]), str(g["runs"])] for g in model["groups"]],
        [4.0, 6.6, 3.0, 2.8],
        align=[None, None, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER],
    )

    heading(C["sectionGeneration"], 2)
    for text in model["method"]:
        para(text)

    heading(C["sectionCoding"], 2)
    make_table(
        [C["thField"], C["thMeaning"], C["thUsage"]],
        model["coding"],
        [3.4, 6.0, 7.0],
    )

    heading(C["sectionReplication"], 2)
    bullets([C[key] for key in ("replication1", "replication2", "replication3")])

    # --- 完整问题库与标注 ------------------------------------------------------------
    heading(C["sectionQuestions"])
    para(C["questionsLead"], style="Small")
    make_table(
        [C["thNo"], C["thQuestion"], C["thRun1"], C["thRun2"], C["thRun3"], C["thBrand"], C["thCoatings"]],
        [
            [
                f"Q{q['q']}",
                q["question"],
                *[q["runMarks"][i] for i in range(3)],
                count_cell(q["brandMentions"], q["okRuns"]),
                count_cell(q["coatingsMentions"], q["okRuns"]),
            ]
            for q in model["questions"]
        ],
        [1.1, 7.8, 1.1, 1.1, 1.1, 1.9, 1.9],
        align=[WD_ALIGN_PARAGRAPH.CENTER, None, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER,
               WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER],
        size=8,
    )

    # --- 资料来源与核验记录 ----------------------------------------------------------
    heading(C["sectionProvenance"])
    bullets(model["provenance"])

    doc.save(out)


# --------------------------------------------------------------------------------------
# XLSX - AI visibility report
# --------------------------------------------------------------------------------------
def build_visibility_xlsx(model: dict, out: Path) -> None:
    """
    The same measurements as a workbook.

    WHY THESE TABLES MAP ONTO A WORKBOOK CLEANLY, and why that is worth saying rather than assumed:
    every table in this report is one row per question or one row per domain, with counts in the
    value columns - which is exactly the shape a spreadsheet is for. Nothing here is a score, so
    nothing here invites a =SUM over numbers that were never measured, and a question with no
    completed runs carries the word for "not measured" rather than an empty cell that any average
    would read as a zero.
    """
    from openpyxl import Workbook

    C = model["copy"]
    meta = model["meta"]
    wb = Workbook()
    T = xlsx_tools(wb)
    sheet, ws_used = T.sheet, T.used

    def count_cell(mentions, runs):
        """The same rule as the DOCX: no runs OR a column that was never measurable is 未测量, not 0."""
        return C["notMeasured"] if not runs or mentions is None else f"{mentions} / {runs}"

    """
    THE BANK SHEET, because the workbook is where somebody re-uses the numbers: a filtered sheet of
    counts whose bank, fingerprint and approval record live only in a Word page three tabs away is how
    a re-test gets compared against questions nobody checked. The rows come from the model, so this sheet
    and the document's first section cannot disagree.
    """
    bank = model.get("bank") or {}
    sheet(
        C["sheetBank"],
        [C["tableItem"], C["tableValue"]],
        [[row["label"], row["value"]] for row in bank.get("rows", [])]
        + [["", ""]]
        + [
            [a.get("heading") or a["label"], f'{a.get("generated")} / {a.get("target")} · {a.get("status")}']
            for a in bank.get("archetypes", [])
        ],
        [30, 90],
        wrap_cols=(2,),
    )

    sheet(
        C["sheetOverview"],
        [C["tableItem"], C["tableValue"]],
        [
            [C["kSubject"], meta["subject"]],
            [C["kModel"], meta["model"]],
            [C["kRunMode"], meta["runModeLabel"]],
            [C["kMeasuredOn"], meta["measuredOn"]],
            [C["kWebSearch"], C["yes"] if meta["webSearch"] else C["no"]],
            [C["kRunsPerQuestion"], meta["runsPerQuestion"]],
            [C["kAnswersFile"], meta["answersFile"]],
            [C["kCompleted"], f"{meta['answersOk']} / {meta['answersFileLines']}"],
            [C["kExcluded"], meta["failureSummary"]],
            [C["kTokens"], meta["totalTokens"]],
            [C["kSearchCalls"], meta["webSearchCalls"]],
            [C["kCitations"], f"{meta['citationEvents']} / {meta['distinctDomains']}"],
            [C["kGeneratedAt"], meta["generatedAtDisplay"]],
            [C["kHeadline"], f"{model['headline']['value']} — {model['headline']['caption']}"],
            ["—", model["headline"]["callout"]],
        ],
        [24, 96],
        wrap_cols=(2,),
    )

    """
    TWO GROUP COLUMNS ON PURPOSE: the human label and the machine key. A reader sorting this sheet
    wants "行业问题（不含品牌名）"; a formula or a re-import wants `category`. Printing only the key
    (which the first version did) is the same inconsistency as printing only the label - and this is
    the one sheet a reader is likely to filter and re-use, so it carries both.
    """
    sheet(
        C["sheetQuestions"],
        [C["thNo"], C["thQuestion"], C["thGroup"], "group", C["thBrand"], C["thCoatings"], C["thRun1"], C["thRun2"], C["thRun3"]],
        [
            [
                f"Q{q['q']}",
                q["question"],
                q["groupShort"],
                q["group"],
                count_cell(q["brandMentions"], q["okRuns"]),
                count_cell(q["coatingsMentions"], q["okRuns"]),
                *q["runMarks"],
            ]
            for q in model["questions"]
        ],
        [8, 50, 22, 12, 12, 12, 8, 8, 8],
        wrap_cols=(2, 3),
    )

    sheet(
        C["sheetGroups"],
        [C["thGroup"], C["thPurpose"], C["thQuestions"], C["thRuns"], C["thBrand"], C["thCoatings"]],
        [
            [
                g["label"],
                g["purpose"],
                g["questions"],
                g["runs"],
                count_cell(g["brandMentions"], g["runs"]),
                count_cell(g["coatingsMentions"], g["runs"]),
            ]
            for g in model["groups"]
        ],
        [16, 44, 10, 10, 14, 14],
        wrap_cols=(2,),
    )

    sheet(
        C["sheetDomains"],
        [C["thDomain"], C["thCount"], C["thWhere"]],
        [[d["domain"], d["count"], "、".join(d["groups"])] for d in model["domains"]],
        [34, 12, 40],
        wrap_cols=(3,),
    )

    # Only when the collector marked them: an empty sheet would read as "no competitor was named".
    if model.get("competitorsMeasured") and model.get("competitors"):
        sheet(
            C["sheetCompetitors"],
            [C["thCompName"], C["thCompNonBrand"], C["thCompAll"], C["thCompGroups"]],
            [[r["name"], r["nonBrand"], r["all"], r["byGroup"]] for r in model["competitors"]],
            [30, 22, 14, 34],
            wrap_cols=(4,),
        )

    sheet(
        C["sheetClaims"],
        [C["thClaim"], C["thSource"], C["thHandling"]],
        [[c["claim"], c["source"], c["handling"]] for c in model["claims"]],
        [46, 12, 50],
        wrap_cols=(1, 3),
    )

    sheet(
        C["sheetQuotes"],
        ["label", C["thQuestion"], C["thRun"], "text"],
        [[q["label"], q["question"], q["run"], q["text"]] for q in model["quotes"]],
        [30, 40, 8, 80],
        wrap_cols=(2, 4),
    )

    sheet(
        C["sheetMeta"],
        ["key", "value"],
        [
            ["report_type", model["reportType"]],
            ["subject", meta["subject"]],
            ["subject_short", meta["subjectShort"]],
            ["model", meta["model"]],
            ["model_source", meta["modelSource"]],
            ["measured_on", meta["measuredOn"]],
            ["date_source", meta["dateSource"]],
            ["web_search", meta["webSearch"]],
            ["runs_per_question", meta["runsPerQuestion"]],
            ["run_mode", meta.get("runMode")],
            ["run_schema", meta.get("runSchema")],
            ["attempts_total", meta.get("attemptsTotal")],
            ["timeouts_total", meta.get("timeoutsTotal")],
            ["truncated_total", meta.get("truncatedTotal")],
            # The client-specific identity, in the machine-readable sheet as well as in section one:
            # whoever re-runs this measurement needs the bank and the exact spellings it matched on.
            ["bank_path", meta.get("bankPath")],
            ["bank_fingerprint", meta.get("bankFingerprint")],
            ["bank_approved_by", meta.get("bankApprovedBy")],
            ["bank_approved_on", meta.get("bankApprovedOn")],
            ["bank_language", meta.get("bankLanguage")],
            ["brand_tokens", "、".join(meta.get("brandTokens") or [])],
            ["answers_file", meta["answersFile"]],
            ["answers_file_lines", meta["answersFileLines"]],
            ["answers_ok", meta["answersOk"]],
            ["answers_failed", meta["answersFailed"]],
            ["failure_summary", meta["failureSummary"]],
            ["total_tokens", meta["totalTokens"]],
            ["web_search_calls", meta["webSearchCalls"]],
            ["citation_events", meta["citationEvents"]],
            ["distinct_domains", meta["distinctDomains"]],
            ["brand_mentions_all_runs", model["totals"]["brandMentions"]],
            ["brand_mentions_non_brand_questions", model["totals"]["nonBrandBrandMentions"]],
            ["non_brand_runs", model["totals"]["nonBrandRuns"]],
            # The headline finding of the entity section, in the machine-readable sheet as well as
            # in the figure: the two counts, their n, and the rule that produced them. A PNG is not
            # a data store, and this is the number a reader is most likely to quote.
            ["entity_conclusion", C["entityConclusionLine"]],
            ["entity_conclusion_same_runs", model["entityConclusion"]["same"]],
            ["entity_conclusion_not_same_runs", model["entityConclusion"]["notSame"]],
            ["entity_conclusion_runs_total", model["entityConclusion"]["total"]],
            ["entity_conclusion_rule", model["entityConclusion"]["rule"]],
            ["engine", model["generatedBy"]],
            ["lang", model["lang"]],
        ],
        [38, 80],
        wrap_cols=(2,),
    )

    sheet(
        C["sheetAbout"],
        [C["tableItem"], C["tableValue"]],
        [
            [C["sectionNotMeasured"], model["limits"][0]],
            *[["", item] for item in model["limits"][1:]],
            [C["sectionNoScore"], C["noScoreLead"]],
            *[["", C[key]] for key in ("noScore1", "noScore2", "noScore3", "noScore4")],
            [C["sectionGeneration"], model["method"][0]],
            *[["", text] for text in model["method"][1:]],
        ],
        [24, 100],
        wrap_cols=(2,),
    )

    if "Sheet" in wb.sheetnames and not ws_used[0]:
        del wb["Sheet"]
    wb.save(out)


def verify_geometry(docx_path: Path, text_width_cm: float) -> bool:
    """
    Check the saved file, not the object that built it.

    WHY THIS EXISTS. The first version of this report asked for 17.0cm of columns inside a 16.6cm
    text area, and nothing said so: python-docx does not paginate and nothing else in this pipeline
    looks at page geometry either. It was found by rendering the document and measuring the ink, so
    the claim "it fits A4" is now made mechanical: every table width, every column grid and every
    image is read back out of the finished file and compared against the text area. A future edit
    that widens a column fails here rather than silently clipping a client's report.

    WHY THE RENDERED PAGE IMAGES ARE NOT THE ORACLE, which cost an hour to establish and is worth
    recording so nobody repeats it. This environment's rasteriser places body content at 1.5x the
    declared left margin (0.05cm at 0 margin, 1.15cm at 2.2cm) and draws table columns wider than
    the grid they declare - and it does this to every document put through it, including one
    authored elsewhere. Read from the PDF that the same pipeline produces, this report's tables run
    x = 2.16..18.92cm on a 21cm A4 page, which is the declared 2.2cm margin plus a 16.4cm table.
    The images are still worth looking at for legibility, hierarchy and charts; they are not a
    measuring instrument for margins.
    """
    import re
    import zipfile

    twips_per_cm = 567.0
    with zipfile.ZipFile(docx_path) as z:
        xml = z.read("word/document.xml").decode("utf-8")

    problems: list[str] = []
    tables = 0
    for i, m in enumerate(re.finditer(r"<w:tbl>.*?</w:tbl>", xml, re.S)):
        tables += 1
        block = m.group(0)
        """
        Attribute order is not fixed: python-docx writes `w:type` before `w:w`, and this file's
        own writer does the opposite. The first version of this check searched for the literal
        `<w:tblW w:w="`, matched nothing, and therefore passed every table vacuously - a check that
        cannot fail, which is the failure mode the repository's other scripts name explicitly.
        """
        w = re.search(r'<w:tblW[^>]*?w:w="(\d+)"', block)
        if w and int(w.group(1)) / twips_per_cm > text_width_cm + 0.01:
            problems.append(f"table {i}: tblW {int(w.group(1))/twips_per_cm:.2f}cm > {text_width_cm}cm")
        grid = re.search(r"<w:tblGrid>(.*?)</w:tblGrid>", block, re.S)
        if grid:
            total = sum(int(x) for x in re.findall(r'<w:gridCol w:w="(\d+)"', grid.group(1)))
            if total / twips_per_cm > text_width_cm + 0.01:
                problems.append(f"table {i}: grid {total/twips_per_cm:.2f}cm > {text_width_cm}cm")

    images = 0
    for m in re.finditer(r'<wp:extent cx="(\d+)"', xml):
        images += 1
        cm = int(m.group(1)) / 360000.0
        if cm > text_width_cm + 0.01:
            problems.append(f"image {images}: {cm:.2f}cm > {text_width_cm}cm")

    if problems:
        print("GEOMETRY CHECK FAILED - the document is wider than its text area:")
        for p in problems:
            print(f"  - {p}")
        return False
    print(
        f"geometry ok: {tables} tables and {images} images all within {text_width_cm}cm "
        f"(A4, 2.2cm margins)"
    )
    return True


# --------------------------------------------------------------------------------------
def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    model = json.loads(Path(args.model).read_text(encoding="utf-8"))
    select_fonts(model.get("lang", "en"))
    out = Path(args.out)
    charts_dir = out / "charts"
    charts_dir.mkdir(parents=True, exist_ok=True)

    docx_path = out / "report.docx"
    xlsx_path = out / "report.xlsx"

    """
    WHICH DOCUMENT GETS BUILT COMES FROM THE MODEL, not from a command-line flag, and that is a
    correctness choice rather than a convenience: the model is the thing that was produced by the
    run, and a flag would let somebody render an AI-visibility model with the scan layout (or the
    reverse) and get a document whose headings describe measurements it does not contain. A missing
    reportType is the scan report, because every model on disk in reports/ was written before this
    key existed and --from-model is documented as re-rendering them.

    BOTH BRANCHES END AT THE SAME verify_geometry CALL. The scan report's 16.6cm text area is the
    AI-visibility report's text area too - docx_scaffold() is the single source of that number - so
    one assertion still covers both, and a new table in either document is checked rather than
    trusted.
    """
    if model.get("reportType") == "ai-visibility":
        """
        FOUR FIGURES, ONE DICT. The names are the keys build_visibility_docx looks up, and the files
        are written before the document that embeds them - the alternative (drawing inside the
        document builder) is how a figure ends up referenced by a document that was saved before the
        image existed.
        """
        charts = {
            "groups": charts_dir / "groups.png",
            "mentions": charts_dir / "mentions.png",
            "sources": charts_dir / "sources.png",
        }
        chart_groups(model, charts["groups"])
        chart_mentions(model, charts["mentions"])
        """
        THE ENTITY FIGURE ONLY EXISTS WHEN THE ENTITY QUESTION DID. With no name question in the bank
        there is nothing to classify, and a pie with no slices and a legend explaining two categories of
        nothing is a figure that claims a measurement. The section still prints its "never asked" lead.
        """
        if int((model.get("entityConclusion") or {}).get("total") or 0) > 0:
            charts["entity"] = charts_dir / "entity-conclusion.png"
            chart_entity_conclusion(model, charts["entity"])
        chart_sources(model, charts["sources"])
        build_visibility_docx(model, docx_path, charts)
        build_visibility_xlsx(model, xlsx_path)
        print(f"wrote {docx_path}")
        print(f"wrote {xlsx_path}")
        for path in charts.values():
            print(f"wrote {path}")
        return 0 if verify_geometry(docx_path, 16.6) else 1

    charts = {}
    bar = charts_dir / "dimensions.png"
    radar = charts_dir / "radar.png"
    chart_dimensions(model, bar)
    chart_radar(model, radar)
    charts["dimensions"], charts["radar"] = bar, radar

    build_docx(model, docx_path, charts)
    build_xlsx(model, xlsx_path)

    print(f"wrote {docx_path}")
    print(f"wrote {xlsx_path}")
    print(f"wrote {bar}")
    print(f"wrote {radar}")
    return 0 if verify_geometry(docx_path, 16.6) else 1


if __name__ == "__main__":
    raise SystemExit(main())
