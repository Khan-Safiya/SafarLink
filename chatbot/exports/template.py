import io
import os
import urllib.request
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from agents.route import RouteAgentOutput, TransitModeRoutes, DetailedRoute

BLACK  = colors.HexColor("#0d0d0d")
DARK   = colors.HexColor("#1f1f1f")
MID    = colors.HexColor("#3d3d3d")
GREY   = colors.HexColor("#707070")
LIGHT  = colors.HexColor("#c8c8c8")
PALE   = colors.HexColor("#f0f0f0")
WHITE  = colors.white

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm


def _styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=20,
                                textColor=WHITE, leading=26, alignment=TA_LEFT),
        "subtitle": ParagraphStyle("subtitle", fontName="Helvetica", fontSize=10,
                                   textColor=LIGHT, leading=14, alignment=TA_LEFT),
        "mode_label": ParagraphStyle("mode", fontName="Helvetica-Bold", fontSize=12,
                                     textColor=WHITE, leading=16, alignment=TA_LEFT),
        "route_header": ParagraphStyle("rh", fontName="Helvetica-Bold", fontSize=10,
                                       textColor=DARK, leading=14),
        "route_meta": ParagraphStyle("rm", fontName="Helvetica", fontSize=9,
                                     textColor=MID, leading=12),
        "step_text": ParagraphStyle("st", fontName="Helvetica", fontSize=8,
                                    textColor=DARK, leading=11),
        "step_mode": ParagraphStyle("sm", fontName="Helvetica-Oblique", fontSize=7,
                                    textColor=GREY, leading=10),
        "transit_line": ParagraphStyle("tl", fontName="Helvetica-Bold", fontSize=7,
                                       textColor=MID, leading=10),
        "unavailable": ParagraphStyle("ua", fontName="Helvetica-Oblique", fontSize=9,
                                      textColor=GREY, leading=12),
        "section_title": ParagraphStyle("sc", fontName="Helvetica-Bold", fontSize=8,
                                        textColor=GREY, leading=11, alignment=TA_LEFT),
        "footer": ParagraphStyle("ft", fontName="Helvetica", fontSize=7,
                                 textColor=GREY, leading=10, alignment=TA_CENTER),
    }


def _map_image(origin: str, destination: str, width: float) -> Image | None:
    api_key = os.getenv("GOOGLE_MAPS_API_KEY", "")
    if not api_key:
        return None
    url = (
        "https://maps.googleapis.com/maps/api/staticmap"
        f"?size=640x200&maptype=roadmap"
        f"&markers=color:black|label:A|{urllib.request.quote(origin)}"
        f"&markers=color:gray|label:B|{urllib.request.quote(destination)}"
        f"&style=element:geometry|color:0xf5f5f5"
        f"&style=element:labels.icon|visibility:off"
        f"&style=element:labels.text.fill|color:0x616161"
        f"&style=feature:road|element:geometry|color:0xffffff"
        f"&style=feature:road|element:geometry.stroke|color:0xc8c8c8"
        f"&style=feature:water|element:geometry|color:0xd0d0d0"
        f"&key={api_key}"
    )
    try:
        with urllib.request.urlopen(url, timeout=8) as resp:
            data = resp.read()
        img = Image(io.BytesIO(data), width=width, height=width * 0.3)
        img.hAlign = "LEFT"
        return img
    except Exception:
        return None


def _step_rows(route: DetailedRoute, styles: dict) -> list:
    usable = PAGE_W - 2 * MARGIN
    col_widths = [10 * mm, usable - 10 * mm - 22 * mm - 18 * mm, 22 * mm, 18 * mm]
    header = [
        Paragraph("No.", styles["section_title"]),
        Paragraph("Instruction", styles["section_title"]),
        Paragraph("Distance", styles["section_title"]),
        Paragraph("Duration", styles["section_title"]),
    ]
    rows = [header]
    for step in route.steps:
        cell_lines = [Paragraph(step.instruction, styles["step_text"])]
        if step.transit_info:
            ti = step.transit_info
            cell_lines.append(Paragraph(
                f"{ti.vehicle_type.upper()}  {ti.line_name}  "
                f"{ti.departure_stop} → {ti.arrival_stop}  ({ti.num_stops} stops)",
                styles["transit_line"],
            ))
        else:
            cell_lines.append(Paragraph(step.travel_mode, styles["step_mode"]))
        rows.append([
            Paragraph(str(step.step_number), styles["step_text"]),
            cell_lines,
            Paragraph(step.distance, styles["step_text"]),
            Paragraph(step.duration, styles["step_text"]),
        ])
    n_data = len(rows)
    row_bg = []
    for idx in range(1, n_data):
        bg = PALE if idx % 2 == 0 else WHITE
        row_bg.append(("BACKGROUND", (0, idx), (-1, idx), bg))
    style = TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT),
        ("TEXTCOLOR",  (0, 0), (-1, 0), MID),
        ("GRID",       (0, 0), (-1, -1), 0.3, LIGHT),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, PALE]),
        ("VALIGN",     (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING",  (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING",   (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 3),
        *row_bg,
    ])
    return [Table(rows, colWidths=col_widths, style=style, repeatRows=1)]


def _mode_block(group: TransitModeRoutes, styles: dict) -> list:
    usable = PAGE_W - 2 * MARGIN
    elems = []
    elems.append(
        Table(
            [[Paragraph(group.mode, styles["mode_label"])]],
            colWidths=[usable],
            style=TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), DARK),
                ("LEFTPADDING",  (0, 0), (-1, -1), 8),
                ("TOPPADDING",   (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
            ]),
        )
    )
    elems.append(Spacer(1, 3 * mm))
    if not group.available:
        elems.append(Paragraph("No service available between these locations.", styles["unavailable"]))
        elems.append(Spacer(1, 5 * mm))
        return elems
    for route in group.routes:
        elems.append(Paragraph(
            f"Route {route.route_number}  ·  {route.total_distance}  ·  {route.total_duration}",
            styles["route_header"],
        ))
        elems.append(Paragraph(
            f"{route.origin}  →  {route.destination}",
            styles["route_meta"],
        ))
        elems.append(Spacer(1, 2 * mm))
        elems.extend(_step_rows(route, styles))
        elems.append(Spacer(1, 5 * mm))
    return elems


def generate_pdf(route_output: RouteAgentOutput, filepath: str) -> str:
    os.makedirs(os.path.dirname(filepath) or ".", exist_ok=True)
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN,
        title=f"Route Report: {route_output.origin} → {route_output.destination}",
    )
    styles = _styles()
    usable = PAGE_W - 2 * MARGIN
    elems = []

    elems.append(
        Table(
            [[
                Paragraph(f"{route_output.origin}  →  {route_output.destination}", styles["title"]),
                Paragraph(
                    datetime.now().strftime("%d %b %Y  %H:%M"),
                    ParagraphStyle("ts", fontName="Helvetica", fontSize=9,
                                   textColor=LIGHT, alignment=TA_CENTER),
                ),
            ]],
            colWidths=[usable * 0.75, usable * 0.25],
            style=TableStyle([
                ("BACKGROUND",   (0, 0), (-1, -1), BLACK),
                ("LEFTPADDING",  (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING",   (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING",(0, 0), (-1, -1), 10),
                ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
            ]),
        )
    )
    elems.append(Spacer(1, 4 * mm))

    map_img = _map_image(route_output.origin, route_output.destination, usable)
    if map_img:
        elems.append(map_img)
        elems.append(Spacer(1, 4 * mm))

    elems.append(HRFlowable(width=usable, thickness=0.5, color=LIGHT))
    elems.append(Spacer(1, 3 * mm))

    for group in route_output.transit_options:
        elems.extend(_mode_block(group, styles))

    elems.append(HRFlowable(width=usable, thickness=0.5, color=LIGHT))
    elems.append(Spacer(1, 2 * mm))
    elems.append(Paragraph("Generated by Route Agent  ·  Google Maps Data", styles["footer"]))

    doc.build(elems)
    return filepath
