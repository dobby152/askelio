#!/usr/bin/env python3
"""
Test script to verify PyMuPDF installation and functionality
"""

def test_pymupdf_import():
    """Test if PyMuPDF can be imported"""
    try:
        import fitz  # PyMuPDF
        print("✅ PyMuPDF imported successfully")
        print(f"   Version: {fitz.version}")
        return True
    except ImportError as e:
        print(f"❌ PyMuPDF import failed: {e}")
        return False

def test_pdf_processing():
    """Test basic PDF processing functionality"""
    try:
        import fitz
        
        # Create a simple test PDF in memory
        doc = fitz.open()  # Create empty document
        page = doc.new_page()  # Add a page
        
        # Add some text
        text = "Test PDF for PyMuPDF verification"
        page.insert_text((50, 50), text)
        
        # Convert to image
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img_data = pix.tobytes("png")
        
        print("✅ PDF processing test successful")
        print(f"   Generated image size: {len(img_data)} bytes")
        
        doc.close()
        return True
        
    except Exception as e:
        print(f"❌ PDF processing test failed: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Testing PyMuPDF installation...")
    
    import_ok = test_pymupdf_import()
    if import_ok:
        processing_ok = test_pdf_processing()
        
        if processing_ok:
            print("\n🎉 All tests passed! PyMuPDF is working correctly.")
        else:
            print("\n⚠️ Import successful but processing failed.")
    else:
        print("\n❌ PyMuPDF is not available.")
