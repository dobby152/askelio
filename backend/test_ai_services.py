#!/usr/bin/env python3
"""
Test všech AI služeb v projektu
"""
import asyncio
import os
import sys
from dotenv import load_dotenv

# Přidej backend do cesty
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

async def test_ai_service():
    """Test základní AI služby"""
    print("=== Testing AI Service ===")
    
    try:
        from services.ai_service import ai_service
        
        # Test 1: Generate insights
        print("\n1. Testing generate_insights...")
        test_data = {
            'totalIncome': 50000,
            'totalExpenses': 30000,
            'profit': 20000,
            'transactions': [
                {'amount': 10000, 'category': 'Příjmy'},
                {'amount': -5000, 'category': 'Výdaje'}
            ]
        }
        
        insights = await ai_service.generate_insights(test_data)
        print(f"✅ Insights generated: {len(insights)} items")
        for insight in insights:
            print(f"   - {insight.get('type', 'unknown')}: {insight.get('title', 'No title')}")
        
        # Test 2: Chat response
        print("\n2. Testing chat_response...")
        response = await ai_service.chat_response("Jak si vedu finančně?", test_data)
        print(f"✅ Chat response: {response[:100]}...")
        
        # Test 3: Trend analysis
        print("\n3. Testing analyze_trends...")
        previous_data = {
            'totalIncome': 40000,
            'totalExpenses': 25000,
            'profit': 15000
        }
        
        trends = await ai_service.analyze_trends(test_data, previous_data)
        print(f"✅ Trend analysis: {trends['trend']} - {trends['message']}")
        
        return True
        
    except Exception as e:
        print(f"❌ AI Service test failed: {e}")
        return False

async def test_cost_effective_llm():
    """Test cost-effective LLM engine"""
    print("\n=== Testing Cost-Effective LLM Engine ===")

    try:
        from cost_effective_llm_engine import CostEffectiveLLMEngine

        engine = CostEffectiveLLMEngine()

        # Test document processing
        test_text = """
        FAKTURA č. 2025001

        Dodavatel: Test s.r.o.
        Odběratel: Zákazník s.r.o.

        Položky:
        - Služby: 10,000 Kč
        - DPH 21%: 2,100 Kč

        Celkem k úhradě: 12,100 Kč
        Datum splatnosti: 2025-02-15
        """

        # Use correct API method
        result = engine.structure_invoice_data(test_text, "test_invoice.txt")
        print(f"✅ Document processed successfully")
        print(f"   - Success: {result.success}")
        print(f"   - Extracted data: {len(result.structured_data)} fields")
        print(f"   - Processing time: {result.processing_time:.2f}s")
        print(f"   - Provider used: {result.provider_used}")
        print(f"   - Cost: ${result.cost_estimate:.6f}")

        # Show stats
        stats = engine.get_stats()
        print(f"   - Total processed: {stats['total_processed']}")
        print(f"   - Success rate: {stats['success_rate']:.1%}")

        return result.success

    except Exception as e:
        print(f"❌ Cost-Effective LLM test failed: {e}")
        return False

async def test_openrouter_llm():
    """Test OpenRouter LLM engine"""
    print("\n=== Testing OpenRouter LLM Engine ===")

    try:
        from openrouter_llm_engine import OpenRouterLLMEngine

        engine = OpenRouterLLMEngine()

        # Test with budget tier
        test_text = "FAKTURA: Celkem 5000 Kč, splatnost 2025-02-01"

        # Use correct API method
        result = engine.structure_invoice_data(test_text, "simple_invoice.txt", complexity="simple", max_cost_usd=0.01)
        print(f"✅ OpenRouter processing successful")
        print(f"   - Success: {result.success}")
        print(f"   - Model: {result.model_used}")
        print(f"   - Cost: ${result.cost_usd:.6f}")
        print(f"   - Processing time: {result.processing_time:.2f}s")
        print(f"   - Confidence: {result.confidence_score:.2f}")

        return result.success

    except Exception as e:
        print(f"❌ OpenRouter LLM test failed: {e}")
        return False

async def test_ocr_manager():
    """Test OCR Manager"""
    print("\n=== Testing OCR Manager ===")

    try:
        from ocr_manager import OCRManager
        from PIL import Image, ImageDraw, ImageFont
        import io

        manager = OCRManager()

        # Create a simple test image with text
        img = Image.new('RGB', (400, 200), color='white')
        draw = ImageDraw.Draw(img)

        # Add some text to the image
        try:
            font = ImageFont.load_default()
        except:
            font = None

        draw.text((50, 50), "FAKTURA č. 2025001", fill='black', font=font)
        draw.text((50, 80), "Celkem: 5000 Kč", fill='black', font=font)
        draw.text((50, 110), "Splatnost: 2025-02-15", fill='black', font=font)

        # Save test image
        test_file = "test_invoice_image.png"
        img.save(test_file)

        try:
            # Use correct API method
            result = manager.process_image_with_structuring(test_file, "invoice")
            print(f"✅ OCR processing result:")
            print(f"   - Success: {result.get('success', False)}")
            print(f"   - Raw text length: {len(result.get('raw_text', ''))} chars")
            print(f"   - Confidence: {result.get('confidence', 0):.2f}")
            print(f"   - Processing time: {result.get('processing_time', 0):.2f}s")
            print(f"   - Has structured data: {result.get('structured_data') is not None}")

            return result.get('success', False)

        finally:
            # Cleanup
            if os.path.exists(test_file):
                os.remove(test_file)

    except Exception as e:
        print(f"❌ OCR Manager test failed: {e}")
        return False

async def main():
    """Spusť všechny testy"""
    print("🤖 Testing All AI Services\n")
    
    results = []
    
    # Test jednotlivých služeb
    results.append(("AI Service", await test_ai_service()))
    results.append(("Cost-Effective LLM", await test_cost_effective_llm()))
    results.append(("OpenRouter LLM", await test_openrouter_llm()))
    results.append(("OCR Manager", await test_ocr_manager()))
    
    # Shrnutí výsledků
    print("\n" + "="*50)
    print("📊 TEST RESULTS SUMMARY")
    print("="*50)
    
    passed = 0
    total = len(results)
    
    for service, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{service:20} {status}")
        if success:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed ({passed/total:.1%})")
    
    if passed == total:
        print("🎉 All AI services are working correctly!")
    else:
        print("⚠️ Some AI services need attention.")

if __name__ == "__main__":
    asyncio.run(main())
