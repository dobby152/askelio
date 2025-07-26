"""
Simple test for AI service
"""

import asyncio
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.ai_service import ai_service

async def test_ai_insights():
    """Test AI insights generation"""
    print("🧪 Testing AI insights generation...")
    
    # Test data
    financial_data = {
        'totalIncome': 150000,
        'totalExpenses': 120000,
        'netProfit': 30000
    }
    
    try:
        insights = await ai_service.generate_insights(financial_data)
        print(f"✅ Generated {len(insights)} insights:")
        
        for i, insight in enumerate(insights, 1):
            print(f"   {i}. [{insight.get('type', 'unknown')}] {insight.get('title', 'No title')}")
            print(f"      {insight.get('description', 'No description')}")
        
        return True
        
    except Exception as e:
        print(f"❌ AI insights test failed: {e}")
        return False

async def test_ai_chat():
    """Test AI chat functionality"""
    print("\n🧪 Testing AI chat...")
    
    financial_context = {
        'totalIncome': 150000,
        'totalExpenses': 120000
    }
    
    test_messages = [
        "Jaký je můj zisk?",
        "Kolik mám příjmů?",
        "Jak si vedu finančně?"
    ]
    
    success_count = 0
    
    for message in test_messages:
        try:
            response = await ai_service.chat_response(message, financial_context)
            print(f"✅ Q: {message}")
            print(f"   A: {response[:100]}{'...' if len(response) > 100 else ''}")
            success_count += 1
            
        except Exception as e:
            print(f"❌ Chat test failed for '{message}': {e}")
    
    print(f"\n📊 Chat tests: {success_count}/{len(test_messages)} successful")
    return success_count == len(test_messages)

async def test_trend_analysis():
    """Test trend analysis"""
    print("\n🧪 Testing trend analysis...")
    
    current_data = {'totalIncome': 150000}
    previous_data = {'totalIncome': 130000}
    
    try:
        trend = await ai_service.analyze_trends(current_data, previous_data)
        print(f"✅ Trend analysis:")
        print(f"   Trend: {trend.get('trend', 'unknown')}")
        print(f"   Message: {trend.get('message', 'No message')}")
        print(f"   Change: {trend.get('change_percent', 0):.1f}%")
        
        return True
        
    except Exception as e:
        print(f"❌ Trend analysis test failed: {e}")
        return False

async def main():
    """Run all tests"""
    print("🚀 Starting AI Service Tests")
    print("=" * 50)
    
    # Check if OpenRouter API key is available
    if not os.getenv("OPENROUTER_API_KEY"):
        print("⚠️  OPENROUTER_API_KEY not found - tests will use fallback responses")
    else:
        print("✅ OPENROUTER_API_KEY found")
    
    print()
    
    # Run tests
    tests = [
        test_ai_insights(),
        test_ai_chat(), 
        test_trend_analysis()
    ]
    
    results = await asyncio.gather(*tests, return_exceptions=True)
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 Test Summary:")
    
    success_count = 0
    for i, result in enumerate(results, 1):
        if isinstance(result, Exception):
            print(f"   Test {i}: ❌ Exception - {result}")
        elif result:
            print(f"   Test {i}: ✅ Passed")
            success_count += 1
        else:
            print(f"   Test {i}: ❌ Failed")
    
    print(f"\n🎯 Overall: {success_count}/{len(results)} tests passed")
    
    if success_count == len(results):
        print("🎉 All tests passed! AI service is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the output above for details.")

if __name__ == "__main__":
    asyncio.run(main())
