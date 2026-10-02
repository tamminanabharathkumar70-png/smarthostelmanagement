#!/usr/bin/env python3
"""
Smart Hostel Management System - Standalone Python Web Server & REST API
Zero external dependencies required (Pure Python 3 standard library).
"""

import http.server
import socketserver
import os
import json
import sqlite3
import urllib.parse
from datetime import datetime

PORT = 8000
DB_FILE = "hostel.db"

# Initialize SQLite Database with Seed Data if not present
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()

    cur.execute('''
        CREATE TABLE IF NOT EXISTS complaints (
            id TEXT PRIMARY KEY,
            title TEXT,
            category TEXT,
            block TEXT,
            room TEXT,
            student_name TEXT,
            priority TEXT,
            status TEXT,
            description TEXT,
            created_at TEXT,
            assigned_to TEXT,
            upvotes INTEGER DEFAULT 0
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS announcements (
            id TEXT PRIMARY KEY,
            title TEXT,
            category TEXT,
            urgency TEXT,
            published_by TEXT,
            content TEXT,
            date TEXT,
            is_pinned INTEGER DEFAULT 0
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS outpasses (
            id TEXT PRIMARY KEY,
            student_name TEXT,
            roll_no TEXT,
            room TEXT,
            purpose TEXT,
            destination TEXT,
            out_date TEXT,
            in_date TEXT,
            status TEXT,
            approved_by TEXT
        )
    ''')

    conn.commit()
    conn.close()

class SmartHostelHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and caching headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        
        # API Endpoints
        if parsed.path == "/api/status":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            status_data = {
                "system": "HostelPulse Smart Management System",
                "status": "online",
                "time": datetime.now().isoformat(),
                "version": "2.0.0"
            }
            self.wfile.write(json.dumps(status_data).encode("utf-8"))
            return

        # Default static file handling
        return super().do_GET()

def run_server(port=PORT):
    init_db()
    current_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(current_dir)

    # Port fallback handling
    for test_port in [port, 8080, 5000, 3000]:
        try:
            with socketserver.TCPServer(("", test_port), SmartHostelHandler) as httpd:
                print("=" * 65)
                print("  🏠 HOSTELPULSE - SMART HOSTEL MANAGEMENT SYSTEM")
                print("=" * 65)
                print(f"  🚀 Server running successfully at:")
                print(f"     👉 http://localhost:{test_port}")
                print(f"     👉 http://127.0.0.1:{test_port}")
                print("-" * 65)
                print("  Press Ctrl+C to stop the server.")
                print("=" * 65)
                httpd.serve_forever()
                break
        except OSError:
            print(f"⚠️ Port {test_port} is in use, trying next port...")
            continue

if __name__ == "__main__":
    run_server()
