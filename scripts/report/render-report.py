"""
Render a report model (written by build-report.mts) into DOCX and XLSX, plus the charts.

WHY PYTHON, AND WHY IT READS THE MODEL RATHER THAN THE SCAN. The engine is TypeScript and stays
the only thing that scores a page. This file owns presentation only: it never computes a score,
a weight or a point value, and it never invents a string - every heading, label and caveat comes
from the model's `copy` block, which build-report.mts fills for both languages. That is what keeps
the Markdown, the DOCX and the XLSX saying the same thing.

WHY THE CHARTS ARE DRAWN WITH PILLOW RATHER THAN MATPLOTLIB. matplotlib is not in the runtime this
repository is developed against, and installing one for a report generator is not worth a
dependency. Pillow is present, and the two figures here - a labelled bar chart and a radar - are
shapes rather than plots. Chinese labels need a CJK font, so the font is chosen from the system's
own files with an explicit East Asian fallback rather than left to the renderer's default.

Usage:
    <python> scripts/report/render-report.py --model=<dir>/report-model.json --out=<dir>
"""

from __future__ import annotations

import argparse
import json
import math
import os
from pathlib import Path

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
def build_docx(model: dict, out: Path, charts: dict) -> None:
    from docx import Document
    from docx.enum.section import WD_SECTION
    from docx.enum.table import WD_TABLE_ALIGNMENT
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    from docx.shared import Cm, Inches, Pt, RGBColor

    C = model["copy"]
    meta, score = model["meta"], model["score"]
    """
    LATIN IS ARIAL, AND PORTABILITY IS THE WHOLE REASON. This report is sent to clients who may open
    it in Word on Windows, Word or Pages on macOS, LibreOffice, or Google Docs, and only one
    sans-serif is present by default on all of them. Segoe UI - the obvious choice, and the first
    one used here - exists on Windows and nowhere else, so a macOS reader gets whatever their
    substitution table picks. Arial also has metric-compatible substitutes on Linux (Liberation
    Sans) and in Google Docs, so the line breaks a reader sees match the ones this file laid out.

    The East Asian slot stays Microsoft YaHei: it only applies to runs that contain CJK, which an
    English report does not have, and a Chinese report is read on a machine that has it.
    """
    LATIN, EA = "Arial", "Microsoft YaHei"

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

    def callout(text):
        t = doc.add_table(rows=1, cols=1)
        t.autofit = False
        c = t.rows[0].cells[0]
        cell_text(c, text, size=10, bold=False, color=INK_1)
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

    doc = Document()

    # Default body font, including the East Asian slot: without this a Chinese report can fall
    # back to a font the reader does not have.
    style_font("Normal", 10, space_after=6)
    style_font("Heading 1", 16, bold=True, space_before=16, space_after=8)
    style_font("Heading 2", 12, bold=True, space_before=12, space_after=6)
    style_font("Title", 26, bold=True, space_after=4)
    caption_style = doc.styles.add_style("Small", 1)
    style_font("Small", 8.5, color=INK_3, space_after=10)
    score_style = doc.styles.add_style("Score", 1)
    style_font("Score", 40, bold=True, color=ACCENT, space_before=4, space_after=2)
    sub_style = doc.styles.add_style("Subtitle2", 1)
    style_font("Subtitle2", 11, color=INK_2, space_after=12)

    sec = doc.sections[0]
    sec.page_width = Cm(21.0)
    sec.page_height = Cm(29.7)
    for attr, val in (("left_margin", 2.2), ("right_margin", 2.2), ("top_margin", 2.0), ("bottom_margin", 1.8)):
        setattr(sec, attr, Cm(val))

    # Header / footer
    hp = sec.header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.LEFT
    set_run(hp.add_run(f"{meta['domain']}  /  {C['reportName']}"), size=8, color=INK_3)
    set_run(hp.add_run(f"        {meta['scanDate']}"), size=8, color=INK_3)
    fp = sec.footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.LEFT
    set_run(fp.add_run(f"{C['footer']}   |   "), size=8, color=INK_3)
    fld_run = fp.add_run()
    set_run(fld_run, size=8, color=INK_3)
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
def build_xlsx(model: dict, out: Path) -> None:
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
    from openpyxl.utils import get_column_letter

    C = model["copy"]
    meta, score = model["meta"], model["score"]
    wb = Workbook()

    head_fill = PatternFill("solid", fgColor="0071E3")
    head_font = Font(color="FFFFFF", bold=True, size=10)
    thin = Side(style="thin", color="D2D2D7")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)
    wrap = Alignment(vertical="top", wrap_text=True)
    top = Alignment(vertical="top")

    def sheet(title, headers, rows, widths, wrap_cols=()):
        ws = wb.create_sheet(title) if wb.sheetnames != ["Sheet"] or ws_used[0] else wb.active
        if ws.title == "Sheet":
            ws.title = title
        ws_used[0] = True
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

    ws_used = [False]

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
        ],
        [22, 100],
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

    charts = {}
    bar = charts_dir / "dimensions.png"
    radar = charts_dir / "radar.png"
    chart_dimensions(model, bar)
    chart_radar(model, radar)
    charts["dimensions"], charts["radar"] = bar, radar

    docx_path = out / "report.docx"
    xlsx_path = out / "report.xlsx"
    build_docx(model, docx_path, charts)
    build_xlsx(model, xlsx_path)

    print(f"wrote {docx_path}")
    print(f"wrote {xlsx_path}")
    print(f"wrote {bar}")
    print(f"wrote {radar}")
    return 0 if verify_geometry(docx_path, 16.6) else 1


if __name__ == "__main__":
    raise SystemExit(main())
