#!/usr/bin/env python3
"""
Create a sample PDF invoice for testing the preview functionality
"""

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
import os

def create_sample_invoice():
    """Create a sample invoice PDF"""
    filename = "uploads/sample_invoice.pdf"
    
    # Create the PDF
    c = canvas.Canvas(filename, pagesize=A4)
    width, height = A4
    
    # Header
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, "FAKTURA - DAŇOVÝ DOKLAD č. 2024067")
    
    # Company info
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 100, "MEMOS Software s.r.o.")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 115, "Na Královce 3114")
    c.drawString(50, height - 130, "101 00 Praha 10")
    c.drawString(50, height - 145, "IČO: 12345678")
    c.drawString(50, height - 160, "DIČ: CZ12345678")
    
    # Customer info
    c.setFont("Helvetica-Bold", 10)
    c.drawString(300, height - 100, "Odběratel:")
    c.setFont("Helvetica", 10)
    c.drawString(300, height - 115, "Redque s.r.o.")
    c.drawString(300, height - 130, "Jiráskova 1234")
    c.drawString(300, height - 145, "110 00 Praha 1")
    
    # Invoice details
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 200, "Datum vystavení: 08.04.2024")
    c.drawString(300, height - 200, "Datum splatnosti: 31.04.2024")
    
    # Table header
    y_pos = height - 250
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, y_pos, "Popis služby")
    c.drawString(250, y_pos, "Množství")
    c.drawString(320, y_pos, "Cena za MJ")
    c.drawString(400, y_pos, "DPH %")
    c.drawString(450, y_pos, "Celkem")
    
    # Draw line under header
    c.line(50, y_pos - 5, 500, y_pos - 5)
    
    # Table content
    y_pos -= 25
    c.setFont("Helvetica", 10)
    c.drawString(50, y_pos, "Fakturace Vám služby Redque 03/2024")
    c.drawString(250, y_pos, "1")
    c.drawString(320, y_pos, "24 400,00")
    c.drawString(400, y_pos, "21%")
    c.drawString(450, y_pos, "24 400,00")
    
    y_pos -= 20
    c.drawString(50, y_pos, "Měsíční služby za 03/2024")
    c.drawString(250, y_pos, "1")
    c.drawString(320, y_pos, "4 198,00")
    c.drawString(400, y_pos, "21%")
    c.drawString(450, y_pos, "4 198,00")
    
    # Totals
    y_pos -= 50
    c.line(400, y_pos + 10, 500, y_pos + 10)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(350, y_pos, "Celkem bez DPH:")
    c.drawString(450, y_pos, "23 636,36 CZK")
    
    y_pos -= 20
    c.drawString(350, y_pos, "DPH 21%:")
    c.drawString(450, y_pos, "4 963,64 CZK")
    
    y_pos -= 20
    c.setFont("Helvetica-Bold", 12)
    c.drawString(350, y_pos, "Celkem k úhradě:")
    c.drawString(450, y_pos, "29 582,49 CZK")
    
    # Payment info
    y_pos -= 50
    c.setFont("Helvetica", 10)
    c.drawString(50, y_pos, "Způsob platby: Bankovní převod")
    c.drawString(50, y_pos - 15, "Číslo účtu: 123456789/0100")
    c.drawString(50, y_pos - 30, "Variabilní symbol: 2024067")
    
    # Footer
    c.drawString(50, 50, "Děkujeme za Vaši důvěru!")
    
    c.save()
    print(f"Sample invoice created: {filename}")
    return filename

if __name__ == "__main__":
    # Install reportlab if not available
    try:
        from reportlab.pdfgen import canvas
    except ImportError:
        print("Installing reportlab...")
        os.system("pip install reportlab")
        from reportlab.pdfgen import canvas
    
    create_sample_invoice()
