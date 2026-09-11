import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def build_jury_handout():
    os.makedirs("generated_pdfs", exist_ok=True)
    filepath = "generated_pdfs/SANKET_AI_JURY_EXECUTIVE_BRIEF.pdf"
    
    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=28,
        leftMargin=28,
        topMargin=20,
        bottomMargin=20,
    )
    
    styles = getSampleStyleSheet()
    
    # Brand Colors
    c_primary = colors.HexColor('#0A5C36')     # Oil India Green
    c_navy = colors.HexColor('#0F172A')        # Dark Slate
    c_gold = colors.HexColor('#B45309')        # Alert Amber
    c_red = colors.HexColor('#B91C1C')         # SIF Red
    c_border = colors.HexColor('#CBD5E1')
    c_bg_light = colors.HexColor('#F8FAFC')
    
    style_title = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=19,
        textColor=c_navy,
    )
    
    style_sub = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=c_primary,
    )
    
    style_body = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#334155'),
    )
    
    style_bold = ParagraphStyle(
        'BoldText',
        parent=style_body,
        fontName='Helvetica-Bold',
    )
    
    style_h2 = ParagraphStyle(
        'Heading2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=c_navy,
    )

    story = []
    
    # ── HEADER TABLE: Title + Ministry Info + QR Code ──
    qr_img_path = "frontend/public/oil_sanket_worker_qr.png"
    if not os.path.exists(qr_img_path):
        qr_img_path = "frontend/public/worker_qr_local.png"
        
    qr_flowable = Image(qr_img_path, width=78, height=78) if os.path.exists(qr_img_path) else Paragraph("[QR CODE]", style_body)

    header_text = [
        Paragraph("<b>SANKET · AI — EXECUTIVE JURY BRIEF</b>", style_title),
        Paragraph("Smart India Hackathon 2026 · Problem Statement <b>SIH26165</b>", style_sub),
        Paragraph("<b>Ministry of Petroleum & Natural Gas · Oil India Limited (Upper Assam Basin)</b>", style_body),
        Paragraph("<i>AI/NLP Engine for SIF Precursor Detection & Cross-Shift Bow-Tie Intelligence</i>", style_body),
    ]
    
    header_table = Table([[header_text, qr_flowable]], colWidths=[450, 90])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,0), (1,0), 'CENTER'),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_primary, spaceAfter=8, spaceBefore=4))

    # ── SECTION 1: THE HUMAN ANCHOR & PROBLEM ──
    story.append(Paragraph("<b>1. The Human Anchor: Baghjan Well #5 (May 27, 2020)</b>", style_h2))
    story.append(Spacer(1, 2))
    p_baghjan = (
        "During the Baghjan blowout in Tinsukia, Assam (burning 160+ days, 3 firefighter fatalities, ₹580 Cr loss), "
        "the DGMS inquiry proved the disaster was <b>NOT an unpredictable act of God</b>. For 14 consecutive days, "
        "precursors were noticed across shifts: mud loss (Day -14), casing vibration (Day -10), cellar gas bubbling (Day -6), "
        "and a leaking BOP valve (Day -3). <b>Because Shift B never saw Shift A's paper logbook, the signals remained disconnected until the explosion.</b>"
    )
    story.append(Paragraph(p_baghjan, style_body))
    story.append(Spacer(1, 6))

    # ── SECTION 2: 4 KILLER USPs TABLE ──
    story.append(Paragraph("<b>2. SANKET AI Architectural USPs (Why We Win)</b>", style_h2))
    story.append(Spacer(1, 3))
    
    usp_data = [
        [
            Paragraph("<b>Core Capability</b>", style_bold),
            Paragraph("<b>Industry Reality / Existing Gaps</b>", style_bold),
            Paragraph("<b>SANKET · AI Proprietary Solution</b>", style_bold)
        ],
        [
            Paragraph("<b>Indic Multilingual Voice</b>", style_bold),
            Paragraph("Roughnecks speak Assamese/Hindi; typed English forms are ignored or filled 4 days late.", style_body),
            Paragraph("Zero-tap voice notes in Assamese, Hindi, Bengali & English with automatic acoustic entity extraction.", style_body)
        ],
        [
            Paragraph("<b>Bow-Tie Causal Graph</b>", style_bold),
            Paragraph("Isolated rows in Excel; no link between a valve leak today and a pressure surge tomorrow.", style_body),
            Paragraph("NetworkX graph correlates multi-day signals into active degradation chains before the blowout apex.", style_body)
        ],
        [
            Paragraph("<b>Air-Gapped Sovereign</b>", style_bold),
            Paragraph("Cloud-dependent solutions fail at remote drilling wellpads with zero 4G/satellite link.", style_body),
            Paragraph("100% offline CPU embeddings (multilingual-e5-small) & SQLite. ₹0 monthly cloud API dependency.", style_body)
        ],
        [
            Paragraph("<b>Sub-Second SWA Reflex</b>", style_bold),
            Paragraph("Paper PTW approval takes hours; stop-work authority is rarely exercised in real-time.", style_body),
            Paragraph("Instant Emergency Stop Work trigger locks DCS perimeter, alerts Control Room sirens & creates SHA-256 audit.", style_body)
        ],
    ]
    
    usp_table = Table(usp_data, colWidths=[110, 200, 230])
    usp_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_bg_light),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(usp_table)
    story.append(Spacer(1, 6))

    # ── SECTION 3: SYSTEM DEMO NAVIGATION MAP ──
    story.append(Paragraph("<b>3. Live Demonstration Flight Plan (4 Killer Screens)</b>", style_h2))
    story.append(Spacer(1, 3))

    demo_data = [
        [
            Paragraph("<b>Screen & Route</b>", style_bold),
            Paragraph("<b>What Judges See</b>", style_bold),
            Paragraph("<b>Strategic Impact / Regulatory Compliance</b>", style_bold)
        ],
        [
            Paragraph("<b>Control Room Siren</b><br/><code>/dashboard/control-room</code>", style_body),
            Paragraph("Live DCS telemetry (Wellhead PSI, H2S PPM, Blowout Barrier integrity, audio sirens).", style_body),
            Paragraph("Standard OISD-189 Real-Time Process Barrier Monitoring.", style_body)
        ],
        [
            Paragraph("<b>Baghjan Disaster Replay</b><br/><code>/dashboard/replay</code>", style_body),
            Paragraph("Chronological time-travel through the 14 days of May 2020 warning signals.", style_body),
            Paragraph("Demonstrates how SANKET would have halted the blowout on Day -6.", style_body)
        ],
        [
            Paragraph("<b>Bow-Tie Safety Graph</b><br/><code>/dashboard/graph</code>", style_body),
            Paragraph("Interactive causal network linking threats, barriers, precursors, and consequence apexes.", style_body),
            Paragraph("Proves cross-shift intelligence correlating isolated shift reports.", style_body)
        ],
        [
            Paragraph("<b>Mobile Worker Terminal</b><br/><code>/worker</code>", style_body),
            Paragraph("Ruggedized frontline phone UI: 1-Tap Assamese Voice, Quick Incidents, Red SWA Button.", style_body),
            Paragraph("Empowers roughnecks with statutory Stop Work Authority without friction.", style_body)
        ],
    ]
    
    demo_table = Table(demo_data, colWidths=[130, 220, 190])
    demo_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_bg_light),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(demo_table)
    story.append(Spacer(1, 6))

    # ── FOOTER STATUTORY BOX ──
    footer_text = (
        "<b>Statutory Alignment:</b> Directorate General of Mines Safety (DGMS) Guidelines · "
        "Oil Industry Safety Directorate <b>OISD-189 / OISD-GDN-206</b> · "
        "IOGP Report 459 (9 Life-Saving Rules) · ISO 45001 / OSHA 1910 Process Safety Management.<br/>"
        "<b>Live Cloud URL:</b> <u>https://oil-sanket.up.railway.app</u> · "
        "<b>Scan the QR Code at the top-right to test the live mobile frontline worker terminal directly on your phone.</b>"
    )
    footer_table = Table([[Paragraph(footer_text, style_body)]], colWidths=[540])
    footer_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FEF3C7')),
        ('BOX', (0,0), (-1,-1), 1, c_gold),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(footer_table)

    doc.build(story)
    print(f"[OK] Generated Jury Handout PDF: {filepath}")

if __name__ == "__main__":
    build_jury_handout()
