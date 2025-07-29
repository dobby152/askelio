#!/usr/bin/env python3
"""
Create a test invoice image for Google Vision API testing
"""
from PIL import Image, ImageDraw, ImageFont
import os

def create_test_invoice():
    """Create a test invoice image"""
    # Create image
    width, height = 800, 600
    img = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(img)
    
    try:
        # Try to use a better font if available
        font_large = ImageFont.truetype("arial.ttf", 24)
        font_medium = ImageFont.truetype("arial.ttf", 18)
        font_small = ImageFont.truetype("arial.ttf", 14)
    except:
        # Fallback to default font
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Draw invoice content
    y_pos = 50
    
    # Header
    draw.text((50, y_pos), "FAKTURA", fill='black', font=font_large)
    y_pos += 40
    
    # Invoice number
    draw.text((50, y_pos), "Číslo faktury: 2025-001", fill='black', font=font_medium)
    y_pos += 30
    
    # Date
    draw.text((50, y_pos), "Datum vystavení: 29.01.2025", fill='black', font=font_small)
    y_pos += 25
    draw.text((50, y_pos), "Datum splatnosti: 28.02.2025", fill='black', font=font_small)
    y_pos += 40
    
    # Supplier
    draw.text((50, y_pos), "Dodavatel:", fill='black', font=font_medium)
    y_pos += 25
    draw.text((50, y_pos), "Test s.r.o.", fill='black', font=font_small)
    y_pos += 20
    draw.text((50, y_pos), "IČO: 12345678", fill='black', font=font_small)
    y_pos += 20
    draw.text((50, y_pos), "DIČ: CZ12345678", fill='black', font=font_small)
    y_pos += 40
    
    # Customer
    draw.text((50, y_pos), "Odběratel:", fill='black', font=font_medium)
    y_pos += 25
    draw.text((50, y_pos), "Zákazník s.r.o.", fill='black', font=font_small)
    y_pos += 20
    draw.text((50, y_pos), "IČO: 87654321", fill='black', font=font_small)
    y_pos += 40
    
    # Items table header
    draw.text((50, y_pos), "Položka", fill='black', font=font_medium)
    draw.text((300, y_pos), "Množství", fill='black', font=font_medium)
    draw.text((450, y_pos), "Cena", fill='black', font=font_medium)
    draw.text((600, y_pos), "Celkem", fill='black', font=font_medium)
    y_pos += 25
    
    # Draw line
    draw.line([(50, y_pos), (750, y_pos)], fill='black', width=1)
    y_pos += 10
    
    # Items
    draw.text((50, y_pos), "Konzultační služby", fill='black', font=font_small)
    draw.text((300, y_pos), "1 ks", fill='black', font=font_small)
    draw.text((450, y_pos), "20,661 CZK", fill='black', font=font_small)
    draw.text((600, y_pos), "20,661 CZK", fill='black', font=font_small)
    y_pos += 30
    
    # Totals
    draw.text((450, y_pos), "Základ DPH 21%:", fill='black', font=font_small)
    draw.text((600, y_pos), "20,661 CZK", fill='black', font=font_small)
    y_pos += 20
    
    draw.text((450, y_pos), "DPH 21%:", fill='black', font=font_small)
    draw.text((600, y_pos), "4,339 CZK", fill='black', font=font_small)
    y_pos += 25
    
    # Draw line
    draw.line([(450, y_pos), (750, y_pos)], fill='black', width=2)
    y_pos += 10
    
    # Total
    draw.text((450, y_pos), "CELKEM K ÚHRADĚ:", fill='black', font=font_medium)
    draw.text((600, y_pos), "25,000 CZK", fill='black', font=font_medium)
    y_pos += 40
    
    # Payment info
    draw.text((50, y_pos), "Způsob platby: Bankovní převod", fill='black', font=font_small)
    y_pos += 20
    draw.text((50, y_pos), "Číslo účtu: 123456789/0100", fill='black', font=font_small)
    y_pos += 20
    draw.text((50, y_pos), "Variabilní symbol: 2025001", fill='black', font=font_small)
    
    # Save image
    output_path = "test_invoice.png"
    img.save(output_path)
    print(f"✅ Test invoice image created: {output_path}")
    return output_path

if __name__ == "__main__":
    create_test_invoice()
