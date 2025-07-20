"""
Create a simple test invoice image for testing the OCR system
"""
from PIL import Image, ImageDraw, ImageFont
import os

def create_test_invoice():
    """Create a simple test invoice image"""
    
    # Create a white image
    width, height = 800, 600
    image = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(image)
    
    # Try to use a default font, fallback to basic if not available
    try:
        font_large = ImageFont.truetype("arial.ttf", 24)
        font_medium = ImageFont.truetype("arial.ttf", 18)
        font_small = ImageFont.truetype("arial.ttf", 14)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Draw invoice content
    y_pos = 50
    
    # Header
    draw.text((50, y_pos), "INVOICE", font=font_large, fill='black')
    y_pos += 60
    
    # Invoice details
    draw.text((50, y_pos), "Invoice Number: INV-2024-001", font=font_medium, fill='black')
    y_pos += 30
    
    draw.text((50, y_pos), "Date: January 20, 2024", font=font_medium, fill='black')
    y_pos += 30
    
    draw.text((50, y_pos), "Due Date: February 20, 2024", font=font_medium, fill='black')
    y_pos += 50
    
    # Vendor info
    draw.text((50, y_pos), "From:", font=font_medium, fill='black')
    y_pos += 25
    draw.text((50, y_pos), "Test Company Ltd.", font=font_small, fill='black')
    y_pos += 20
    draw.text((50, y_pos), "123 Business Street", font=font_small, fill='black')
    y_pos += 20
    draw.text((50, y_pos), "Prague, Czech Republic", font=font_small, fill='black')
    y_pos += 50
    
    # Customer info
    draw.text((50, y_pos), "To:", font=font_medium, fill='black')
    y_pos += 25
    draw.text((50, y_pos), "Customer Name", font=font_small, fill='black')
    y_pos += 20
    draw.text((50, y_pos), "456 Customer Avenue", font=font_small, fill='black')
    y_pos += 20
    draw.text((50, y_pos), "Brno, Czech Republic", font=font_small, fill='black')
    y_pos += 50
    
    # Items
    draw.text((50, y_pos), "Description", font=font_medium, fill='black')
    draw.text((400, y_pos), "Quantity", font=font_medium, fill='black')
    draw.text((500, y_pos), "Price", font=font_medium, fill='black')
    draw.text((600, y_pos), "Total", font=font_medium, fill='black')
    y_pos += 30
    
    # Draw line
    draw.line([(50, y_pos), (700, y_pos)], fill='black', width=1)
    y_pos += 20
    
    # Item 1
    draw.text((50, y_pos), "Web Development Services", font=font_small, fill='black')
    draw.text((400, y_pos), "1", font=font_small, fill='black')
    draw.text((500, y_pos), "25,000 CZK", font=font_small, fill='black')
    draw.text((600, y_pos), "25,000 CZK", font=font_small, fill='black')
    y_pos += 25
    
    # Item 2
    draw.text((50, y_pos), "Consulting Hours", font=font_small, fill='black')
    draw.text((400, y_pos), "10", font=font_small, fill='black')
    draw.text((500, y_pos), "1,500 CZK", font=font_small, fill='black')
    draw.text((600, y_pos), "15,000 CZK", font=font_small, fill='black')
    y_pos += 40
    
    # Total
    draw.line([(450, y_pos), (700, y_pos)], fill='black', width=1)
    y_pos += 20
    
    draw.text((500, y_pos), "Subtotal:", font=font_medium, fill='black')
    draw.text((600, y_pos), "40,000 CZK", font=font_medium, fill='black')
    y_pos += 25
    
    draw.text((500, y_pos), "VAT (21%):", font=font_medium, fill='black')
    draw.text((600, y_pos), "8,400 CZK", font=font_medium, fill='black')
    y_pos += 25
    
    draw.text((500, y_pos), "TOTAL:", font=font_large, fill='black')
    draw.text((600, y_pos), "48,400 CZK", font=font_large, fill='black')
    
    # Save the image
    output_path = "test_invoice.png"
    image.save(output_path)
    print(f"Test invoice created: {output_path}")
    return output_path

if __name__ == "__main__":
    create_test_invoice()
