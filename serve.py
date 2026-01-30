#!/usr/bin/env python3
"""
Simple local development server for testing the rentals page.
Run this script to serve the site locally on http://localhost:8000
"""

import http.server
import socketserver
import webbrowser
import os
from pathlib import Path

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # SECURITY NOTE: CORS headers are only for local development
        # In production, Cloudflare handles CORS via _headers file
        # Only allow localhost origins for security
        origin = self.headers.get('Origin', '')
        if origin.startswith('http://localhost') or origin.startswith('http://127.0.0.1'):
            self.send_header('Access-Control-Allow-Origin', origin)
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        super().end_headers()

def main():
    os.chdir(Path(__file__).parent)
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        url = f"http://localhost:{PORT}"
        print(f"Server running at {url}")
        print(f"Open {url}/rentals/ in your browser")
        print("\nPress Ctrl+C to stop the server")
        
        try:
            webbrowser.open(f"{url}/rentals/")
        except:
            pass
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServer stopped.")

if __name__ == "__main__":
    main()
