import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

def generate_pdf_report(scan: dict, findings: list) -> bytes:
    """
    Generates a security audit PDF report for a completed scan using ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=15
    )

    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=12,
        spaceAfter=8
    )

    normal_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#334155'),
        leading=12
    )

    elements = []

    # Title & Subtitle
    elements.append(Paragraph("SECUREVAULT SECURITY SCAN REPORT", title_style))
    elements.append(Paragraph(f"Generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} | Confidential Security Audit", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#3b82f6'), spaceAfter=15))

    # Meta Overview Box
    filename = scan.get("filename", "Text Scan")
    scan_date = scan.get("created_at", datetime.utcnow()).strftime('%Y-%m-%d %H:%M:%S') if isinstance(scan.get("created_at"), datetime) else str(scan.get("created_at", ""))
    risk_score = scan.get("risk_score", 0)
    risk_level = scan.get("risk_level", "SAFE")
    finding_count = scan.get("finding_count", 0)

    # Risk badge color
    level_color_map = {
        "CRITICAL": colors.HexColor('#ef4444'),
        "HIGH": colors.HexColor('#f97316'),
        "MEDIUM": colors.HexColor('#eab308'),
        "LOW": colors.HexColor('#3b82f6'),
        "SAFE": colors.HexColor('#22c55e')
    }
    badge_color = level_color_map.get(risk_level, colors.HexColor('#64748b'))

    meta_data = [
        [Paragraph(f"<b>Target File / Content:</b> {filename}", normal_style), Paragraph(f"<b>Risk Score:</b> {risk_score} / 100", normal_style)],
        [Paragraph(f"<b>Scan Timestamp:</b> {scan_date}", normal_style), Paragraph(f"<b>Risk Rating:</b> <font color='{badge_color.hexval()}'><b>{risk_level}</b></font>", normal_style)],
        [Paragraph(f"<b>Total Findings:</b> {finding_count}", normal_style), Paragraph(f"<b>Scan Duration:</b> {scan.get('processing_time', '0.05s')}", normal_style)]
    ]

    meta_table = Table(meta_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 15))

    # Findings Table Section
    elements.append(Paragraph("Exposed Sensitive Data Findings", heading_style))

    if not findings:
        elements.append(Paragraph("No sensitive data exposures or credentials were detected in this scan.", normal_style))
    else:
        table_data = [
            ["Line", "Severity", "Finding Type", "Masked Value", "Remediation Recommendation"]
        ]
        
        for f in findings:
            sev = f.get("severity", "LOW")
            sev_color = level_color_map.get(sev, colors.HexColor('#64748b')).hexval()
            
            line_str = str(f.get("line_number", 1))
            sev_p = Paragraph(f"<font color='{sev_color}'><b>{sev}</b></font>", normal_style)
            type_p = Paragraph(f.get("type", ""), normal_style)
            masked_p = Paragraph(f"<code>{f.get('masked_value', '')}</code>", normal_style)
            rec_p = Paragraph(f.get("recommendation", ""), normal_style)
            
            table_data.append([line_str, sev_p, type_p, masked_p, rec_p])

        findings_table = Table(table_data, colWidths=[35, 60, 95, 130, 220])
        findings_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(findings_table)

    elements.append(Spacer(1, 20))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#cbd5e1'), spaceAfter=10))
    elements.append(Paragraph("Notice: Uploaded files are processed strictly in memory/temporary files and deleted after scanning. Raw secret credentials are masked and never persisted by SecureVault.", subtitle_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
