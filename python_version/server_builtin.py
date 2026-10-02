#!/usr/bin/env python3
"""
LibraAI — Standalone Standard-Library Python Server (100% Zero Dependencies)
Chạy bằng Python 3 gốc mà KHÔNG CẦN cài đặt bất kỳ thư viện pip nào (không cần fastapi/uvicorn).
Phục vụ đầy đủ:
- API quét mã vạch ISBN (/api/barcode/scan)
- API trò chuyện hỏi đáp AI & Grounded RAG (/api/ai/chat)
- API danh mục sách & tìm kiếm (/api/books)
- Giao diện Web tương tác hiển thị trực tiếp trên trình duyệt
"""

import http.server
import socketserver
import json
import os
import urllib.parse
from datetime import datetime

PORT = 8000
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
SEED_FILE = os.path.join(ROOT_DIR, "data", "seed-books.json")

# Khởi tạo dữ liệu từ số 0
BOOKS = []
SCAN_LOGS = []
SEARCH_LOGS = []

if os.path.exists(SEED_FILE):
    with open(SEED_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        for b in data:
            b_copy = dict(b)
            b_copy["views"] = 0
            b_copy["scanCount"] = 0
            BOOKS.append(b_copy)
else:
    BOOKS = []

class LibraAIHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == "/api/health":
            self.send_json({"status": "ok", "service": "LibraAI 100% Python Native", "totalBooks": len(BOOKS)})
        elif path == "/api/books":
            q = query.get("q", [""])[0].lower().strip()
            cat = query.get("category", [""])[0].strip()
            res = BOOKS
            if cat and cat.lower() != "all":
                res = [b for b in res if b.get("category", "").lower() == cat.lower()]
            if q:
                res = [b for b in res if q in b.get("title", "").lower() or q in b.get("author", "").lower() or q in b.get("isbn", "")]
            self.send_json({"success": True, "count": len(res), "books": res})
        elif path.startswith("/api/books/"):
            book_id = path.split("/")[-1]
            book = next((b for b in BOOKS if b.get("id") == book_id or b.get("isbn") == book_id), None)
            if book:
                book["views"] = book.get("views", 0) + 1
                self.send_json({"success": True, "book": book})
            else:
                self.send_json({"success": False, "error": "Không tìm thấy sách"}, status=404)
        elif path == "/api/analytics":
            self.send_json({
                "success": True,
                "analytics": {
                    "totalBooks": len(BOOKS),
                    "totalScans": len(SCAN_LOGS),
                    "totalQueries": len(SEARCH_LOGS),
                    "totalViews": sum(b.get("views", 0) for b in BOOKS),
                    "dailyScans": [],
                    "categoryStats": []
                }
            })
        elif path == "/" or path == "/index.html":
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            html_content = self.render_html()
            self.wfile.write(html_content.encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        try:
            payload = json.loads(body)
        except Exception:
            payload = {}

        path = urllib.parse.urlparse(self.path).path

        if path == "/api/barcode/scan":
            code = payload.get("barcode", "").strip()
            matched = next((b for b in BOOKS if b.get("isbn") == code or code in b.get("isbn", "")), None)
            if matched:
                matched["scanCount"] = matched.get("scanCount", 0) + 1
                matched["views"] = matched.get("views", 0) + 1
                SCAN_LOGS.append({"isbn": code, "time": datetime.now().isoformat()})
                self.send_json({
                    "success": True,
                    "barcode": code,
                    "book": matched,
                    "message": "✓ Nhận diện mã vạch thành công!"
                })
            else:
                self.send_json({"success": False, "barcode": code, "message": "Không tìm thấy sách"}, status=404)

        elif path == "/api/ai/chat":
            book_id = payload.get("bookId")
            question = payload.get("question", "").strip()
            book = next((b for b in BOOKS if b.get("id") == book_id or b.get("isbn") == book_id), None)
            if not book:
                self.send_json({"success": False, "error": "Không tìm thấy cuốn sách này"}, status=404)
                return

            SEARCH_LOGS.append({"question": question, "bookId": book_id, "time": datetime.now().isoformat()})
            q_lower = question.lower()
            
            # Grounded RAG Logic
            if "nhân vật" in q_lower:
                chars = book.get("characters", [])
                if chars:
                    ans = f"Các nhân vật chính trong \"{book.get('title')}\":\n\n" + "\n".join([f"• {c['name']} ({c['role']}): {c['description']}" for c in chars])
                else:
                    ans = f"Cuốn sách \"{book.get('title')}\" không tập trung vào nhân vật hư cấu mà đào sâu luận điểm khoa học thực tế."
            elif "tóm tắt" in q_lower or "nội dung" in q_lower:
                ans = f"Tóm tắt cuốn sách \"{book.get('title')}\":\n\n{book.get('summary')}\n\nThông điệp: {book.get('message')}"
            elif "bài học" in q_lower or "học được gì" in q_lower:
                takeaways = "\n".join([f"{i+1}. {t}" for i, t in enumerate(book.get("keyTakeaways", []))])
                ans = f"Những bài học quý giá từ \"{book.get('title')}\":\n\n{takeaways}"
            elif "câu hỏi" in q_lower or "ôn tập" in q_lower:
                ans = f"3 Câu hỏi thảo luận về \"{book.get('title')}\":\n\n1. Thông điệp cốt lõi của tác phẩm có ý nghĩa gì với bạn?\n2. Chi tiết nào khiến bạn ấn tượng sâu sắc nhất?\n3. Bạn sẽ áp dụng bài học của sách như thế nào vào cuộc sống?"
            else:
                ans = f"Dựa trên dữ liệu thư viện về \"{book.get('title')}\":\n\n{book.get('description')}\n\n💡 Thông điệp: {book.get('message')}"

            self.send_json({
                "success": True,
                "answer": ans,
                "provider": "python-grounded-rag",
                "sources": [f"Sách: {book.get('title')}", f"Tác giả: {book.get('author')}", f"ISBN: {book.get('isbn')}"]
            })
        else:
            self.send_response(404)
            self.end_headers()

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def render_html(self):
        return f"""<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>LibraAI — Python Server</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white text-gray-900 p-6 max-w-4xl mx-auto space-y-6">
  <div class="border-b border-gray-200 pb-4 flex justify-between items-center">
    <div>
      <h1 class="text-xl font-bold text-gray-900">LibraAI — Máy chủ Python Thuần</h1>
      <p class="text-xs text-gray-500">Zero Dependencies — Không cần cài thêm thư viện pip</p>
    </div>
    <span class="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded border border-gray-200">Cổng :8000</span>
  </div>

  <div class="grid grid-cols-4 gap-3 text-center">
    <div class="p-3 bg-white rounded-lg border border-gray-200">
      <div class="text-xl font-bold text-gray-900">{len(BOOKS)}</div>
      <div class="text-[11px] text-gray-500">Tổng số sách</div>
    </div>
    <div class="p-3 bg-white rounded-lg border border-gray-200">
      <div class="text-xl font-bold text-gray-900">{len(SCAN_LOGS)}</div>
      <div class="text-[11px] text-gray-500">Lượt quét thực tế</div>
    </div>
    <div class="p-3 bg-white rounded-lg border border-gray-200">
      <div class="text-xl font-bold text-gray-900">{len(SEARCH_LOGS)}</div>
      <div class="text-[11px] text-gray-500">Hỏi đáp AI thực tế</div>
    </div>
    <div class="p-3 bg-white rounded-lg border border-gray-200">
      <div class="text-xl font-bold text-gray-900">{sum(b.get('views', 0) for b in BOOKS)}</div>
      <div class="text-[11px] text-gray-500">Lượt xem thực tế</div>
    </div>
  </div>

  <div class="p-5 bg-white rounded-xl border border-gray-200 space-y-4">
    <h2 class="font-bold text-sm text-gray-800">Quét mã ISBN & Hỏi đáp AI</h2>
    <div class="flex gap-2">
      <input id="isbnBox" type="text" value="9786042171922" class="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-mono text-xs focus:outline-none focus:border-gray-900" />
      <button onclick="scan()" class="px-4 py-2 bg-gray-900 text-white rounded-lg font-semibold text-xs hover:bg-black">Quét sách</button>
    </div>
    <div id="output" class="p-3 bg-gray-50 rounded-lg text-xs whitespace-pre-wrap border border-gray-200 min-h-[90px] text-gray-700">Kết quả sẽ hiển thị tại đây...</div>
    
    <div class="flex gap-2">
      <input id="qBox" type="text" placeholder="Đặt câu hỏi cho AI về cuốn sách..." class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-gray-900" />
      <button onclick="askAi()" class="px-4 py-2 bg-gray-900 text-white rounded-lg font-semibold text-xs hover:bg-black">Hỏi AI</button>
    </div>
  </div>

  <script>
    let activeBookId = 'hoang-tu-be';
    async function scan() {{
      const code = document.getElementById('isbnBox').value.trim();
      const res = await fetch('/api/barcode/scan', {{
        method: 'POST',
        headers: {{ 'Content-Type': 'application/json' }},
        body: JSON.stringify({{ barcode: code }})
      }});
      const d = await res.json();
      if(d.success) {{
        activeBookId = d.book.id;
        document.getElementById('output').innerText = '📖 ' + d.book.title + ' (' + d.book.author + ')\\n' + d.book.summary;
      }} else {{
        document.getElementById('output').innerText = '❌ ' + d.message;
      }}
    }}
    async function askAi() {{
      const q = document.getElementById('qBox').value.trim();
      document.getElementById('output').innerText = 'Đang nhận diện câu trả lời...';
      const res = await fetch('/api/ai/chat', {{
        method: 'POST',
        headers: {{ 'Content-Type': 'application/json' }},
        body: JSON.stringify({{ bookId: activeBookId, question: q }})
      }});
      const d = await res.json();
      document.getElementById('output').innerText = '🤖 CÂU TRẢ LỜI:\\n' + d.answer;
    }}
  </script>
</body>
</html>"""

if __name__ == "__main__":
    print(f"🚀 [LibraAI] Python Standard Server đang chạy tại: http://localhost:{PORT}")
    print(f"✓ Đã nạp {len(BOOKS)} cuốn sách. Số lượt xem và quét thực tế bắt đầu từ 0.")
    with socketserver.TCPServer(("", PORT), LibraAIHandler) as httpd:
        httpd.serve_forever()
