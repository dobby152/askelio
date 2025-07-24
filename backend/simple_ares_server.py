#!/usr/bin/env python3
"""
Jednoduchý test server pro ARES integraci
Bez závislostí na FastAPI - pouze základní HTTP server
"""

import json
import sys
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading
import time

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ares_client import ares_client

class AresTestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query_params = parse_qs(parsed_path.query)
        
        if path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                "message": "ARES Test Server",
                "description": "Simple test server for ARES integration",
                "endpoints": {
                    "GET /": "This info",
                    "GET /ares/{ico}": "Get company data from ARES",
                    "GET /test": "Test ARES functionality",
                    "GET /health": "Health check"
                },
                "status": "running"
            }
            
            self.wfile.write(json.dumps(response, indent=2, ensure_ascii=False).encode('utf-8'))
            
        elif path.startswith('/ares/'):
            # Extract IČO from path
            ico = path.split('/ares/')[-1]
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            try:
                # Get company data from ARES
                company_data = ares_client.get_company_data(ico)
                
                if company_data:
                    response = {
                        "success": True,
                        "ico": company_data.ico,
                        "name": company_data.name,
                        "dic": company_data.dic,
                        "address": company_data.address,
                        "legal_form": company_data.legal_form,
                        "is_active": company_data.is_active,
                        "is_vat_payer": company_data.is_vat_payer
                    }
                else:
                    response = {
                        "success": False,
                        "error": "Company not found",
                        "ico": ico
                    }
                    
            except Exception as e:
                response = {
                    "success": False,
                    "error": str(e),
                    "ico": ico
                }
            
            self.wfile.write(json.dumps(response, indent=2, ensure_ascii=False).encode('utf-8'))
            
        elif path == '/test':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            # Test známých IČO
            test_icos = [
                ("02445344", "Skanska Residential a.s."),
                ("27082440", "Alza.cz a.s.")
            ]
            
            results = []
            
            for ico, expected_name in test_icos:
                try:
                    company_data = ares_client.get_company_data(ico)
                    
                    if company_data:
                        results.append({
                            "ico": ico,
                            "expected_name": expected_name,
                            "actual_name": company_data.name,
                            "dic": company_data.dic,
                            "address": company_data.address,
                            "is_active": company_data.is_active,
                            "is_vat_payer": company_data.is_vat_payer,
                            "success": True,
                            "name_match": expected_name.lower() in company_data.name.lower()
                        })
                    else:
                        results.append({
                            "ico": ico,
                            "expected_name": expected_name,
                            "success": False,
                            "error": "Company not found"
                        })
                        
                except Exception as e:
                    results.append({
                        "ico": ico,
                        "expected_name": expected_name,
                        "success": False,
                        "error": str(e)
                    })
            
            response = {
                "test_results": results,
                "summary": {
                    "total_tests": len(test_icos),
                    "successful": len([r for r in results if r.get("success", False)]),
                    "failed": len([r for r in results if not r.get("success", False)])
                }
            }
            
            self.wfile.write(json.dumps(response, indent=2, ensure_ascii=False).encode('utf-8'))
            
        elif path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            response = {
                "status": "healthy",
                "server": "ARES Test Server",
                "ares_client": "initialized",
                "timestamp": time.time()
            }
            
            self.wfile.write(json.dumps(response, indent=2, ensure_ascii=False).encode('utf-8'))
            
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            response = {
                "error": "Not found",
                "path": path,
                "available_endpoints": ["/", "/ares/{ico}", "/test", "/health"]
            }
            
            self.wfile.write(json.dumps(response, indent=2, ensure_ascii=False).encode('utf-8'))
    
    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        """Custom log format"""
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")

def run_server(port=8001):
    """Run the test server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, AresTestHandler)
    
    print(f"🚀 ARES Test Server starting on port {port}")
    print(f"📍 Available at: http://localhost:{port}")
    print(f"🧪 Test endpoint: http://localhost:{port}/test")
    print(f"🏢 ARES lookup: http://localhost:{port}/ares/02445344")
    print()
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        httpd.shutdown()

if __name__ == "__main__":
    run_server()
