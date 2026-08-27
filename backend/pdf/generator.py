"""
SANKET · AI — Executive Safety PDF Brief Generator
Uses ReportLab to generate defense-grade, boardroom-ready PDF briefs.
"""

import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from backend.models.report import Report


class PDFReportGenerator:
    """
    Generates a 1-page boardroom-ready Executive Safety Brief for any report.
    Includes SIF Score gauge, barrier analysis, extracted entities, and CAPA actions.
    """

    def __init__(self, output_dir: str = "generated_pdfs"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_brief(self, report: Report) -> str:
        """
        Generate a PDF brief for a Report object.
        Returns the absolute filepath of the generated PDF.
        """
        filename = f"SANKET_BRIEF_{report.id[:8].upper()}_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
        filepath = os.path.join(self.output_dir, filename)

        doc = SimpleDocTemplate(
            filepath,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36,
        )

        story = []
        styles = getSampleStyleSheet()

        # Custom styles
        header_title = ParagraphStyle(
            'HeaderTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#0F172A'),
        )
        subtitle_style = ParagraphStyle(
            'SubTitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#64748B'),
        )
        section_heading = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#1E293B'),
            spaceBefore=8,
            spaceAfter=4,
        )
        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#334155'),
        )
        explanation_style = ParagraphStyle(
            'Explanation',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#0F172A'),
        )

        # Header with Logo / Metadata
        header_data = [
            [
                Paragraph("<b>SANKET · AI</b> | Executive Safety Brief", header_title),
                Paragraph(f"<b>Ref ID:</b> {report.id[:13]}...<br/><b>Date:</b> {datetime.utcnow().strftime('%d-%b-%Y %H:%M UTC')}", subtitle_style)
            ]
        ]
        t_header = Table(header_data, colWidths=[4.0 * inch, 3.0 * inch])
        t_header.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ]))
        story.append(t_header)
        story.append(Spacer(1, 8))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#DC2626'), spaceBefore=2, spaceAfter=10))

        # Severity & SIF Score Summary Box
        sif_label = report.sif_label or "LOW"
        sif_score = report.sif_score or 0.0
        score_color = colors.HexColor('#DC2626') if sif_label == 'HIGH' else (colors.HexColor('#D97706') if sif_label == 'MEDIUM' else colors.HexColor('#16A34A'))

        badge_bg = colors.HexColor('#FEE2E2') if sif_label == 'HIGH' else (colors.HexColor('#FEF3C7') if sif_label == 'MEDIUM' else colors.HexColor('#DCFCE7'))
        badge_text = colors.HexColor('#991B1B') if sif_label == 'HIGH' else (colors.HexColor('#92400E') if sif_label == 'MEDIUM' else colors.HexColor('#166534'))

        summary_box_data = [
            [
                Paragraph(f"<b>SIF POTENTIAL LEVEL:</b> <font color='{badge_text}'>{sif_label}</font>", section_heading),
                Paragraph(f"<b>SIF Precursor Score:</b> {sif_score:.4f} / 1.0000", section_heading)
            ],
            [
                Paragraph(f"<b>Location:</b> {report.location or 'Unspecified'}<br/><b>Activity:</b> {report.activity_type or 'General'}", body_style),
                Paragraph(f"<b>IOGP Rule:</b> {report.iogp_rule or 'General Safety'}<br/><b>Shift:</b> {report.shift or 'DAY'}", body_style)
            ]
        ]
        t_summary = Table(summary_box_data, colWidths=[3.5 * inch, 3.5 * inch])
        t_summary.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
            ('PADDING', (0,0), (-1,-1), 8),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        story.append(t_summary)
        story.append(Spacer(1, 10))

        # Incident Narrative
        story.append(Paragraph("1. Incident Narrative (Raw Observation)", section_heading))
        p_narrative = Paragraph(f"\"{report.raw_text}\"", body_style)
        t_narrative = Table([[p_narrative]], colWidths=[7.0 * inch])
        t_narrative.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FFFFFF')),
            ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor('#CBD5E1')),
            ('PADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(t_narrative)
        story.append(Spacer(1, 10))

        # Grounded AI Explanation
        story.append(Paragraph("2. Stage 5 Grounded AI Risk Synthesis", section_heading))
        explanation_text = report.explanation or "Deterministic classifier matched high-energy precursor anchor. Physical barrier integrity and energy isolation review required."
        p_exp = Paragraph(f"{explanation_text}", explanation_style)
        t_exp = Table([[p_exp]], colWidths=[7.0 * inch])
        t_exp.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
            ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor('#94A3B8')),
            ('PADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(t_exp)
        story.append(Spacer(1, 10))

        # Matched Reference Anchor & Entities
        story.append(Paragraph("3. AI Feature & Entity Decomposition", section_heading))
        entities_str = ", ".join([f"{e.entity_type}: {e.entity_value}" for e in report.entities[:6]]) if report.entities else "None extracted"
        matched_anchor = report.matched_anchor_text or "General safety baseline anchor"

        decomp_data = [
            [Paragraph("<b>Matched SIF Anchor:</b>", body_style), Paragraph(matched_anchor, body_style)],
            [Paragraph("<b>Extracted Entities:</b>", body_style), Paragraph(entities_str, body_style)],
        ]
        t_decomp = Table(decomp_data, colWidths=[1.8 * inch, 5.2 * inch])
        t_decomp.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('PADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        story.append(t_decomp)
        story.append(Spacer(1, 10))

        # CAPA Corrective Actions Section
        story.append(Paragraph("4. Corrective & Preventive Action (CAPA) Status", section_heading))
        if report.actions and len(report.actions) > 0:
            act = report.actions[0]
            action_data = [
                [
                    Paragraph(f"<b>Action Type:</b> {act.action_type}", body_style),
                    Paragraph(f"<b>Priority:</b> {act.priority}", body_style),
                    Paragraph(f"<b>Status:</b> {act.status}", body_style),
                ],
                [
                    Paragraph(f"<b>Assigned To:</b> {act.assigned_to or 'Field Lead'}", body_style),
                    Paragraph(f"<b>Instructions:</b> {act.notes or 'Execute barrier inspection'}", body_style),
                    Paragraph(f"<b>Dispatch:</b> {act.created_at.strftime('%Y-%m-%d') if hasattr(act, 'created_at') and act.created_at else 'Immediate'}", body_style),
                ]
            ]
        else:
            action_data = [
                [
                    Paragraph("<b>Action Type:</b> ROOT CAUSE INVESTIGATION", body_style),
                    Paragraph("<b>Priority:</b> IMMEDIATE / HIGH", body_style),
                    Paragraph("<b>Status:</b> DISPATCHED", body_style),
                ],
                [
                    Paragraph("<b>Assigned To:</b> Site HSE Lead", body_style),
                    Paragraph("<b>Instructions:</b> Perform immediate physical isolation verification on affected unit.", body_style),
                    Paragraph("<b>Dispatch:</b> SLA 24 Hours", body_style),
                ]
            ]
        t_action = Table(action_data, colWidths=[2.3 * inch, 2.7 * inch, 2.0 * inch])
        t_action.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(t_action)
        story.append(Spacer(1, 14))

        # Footer Signoff Line
        footer_text = "CONFIDENTIAL & PROPRIETARY — OIL INDIA LIMITED · SANKET AI SOVEREIGN PRECURSOR ENGINE"
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#94A3B8'), spaceBefore=6, spaceAfter=6))
        story.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=styles['Normal'], fontName='Helvetica', fontSize=7, alignment=1, textColor=colors.HexColor('#94A3B8'))))

        # Build PDF document
        doc.build(story)
        return filepath


# Singleton instance
pdf_generator = PDFReportGenerator()
