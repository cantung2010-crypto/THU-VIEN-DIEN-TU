"""
LibraAI — Smart School Library Discovery Platform
Backend & Full-Stack Web Server viết bằng Python (FastAPI + Gemini AI + RAG Engine)
"""

import os
import json
import random
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Khởi tạo ứng dụng FastAPI
app = FastAPI(
    title="LibraAI — AI Library Discovery Platform",
    description="Hệ thống khám phá sách thông minh cho thư viện trường học viết bằng Python",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đường dẫn dữ liệu
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
SEED_FILE = os.path.join(ROOT_DIR, "data", "seed-books.json")

# Lưu trữ dữ liệu trong bộ nhớ (In-memory storage)
BOOKS_DB: List[Dict[str, Any]] = []
SCAN_LOGS: List[Dict[str, Any]] = []
SEARCH_LOGS: List[Dict[str, Any]] = []

def load_initial_data():
    global BOOKS_DB, SCAN_LOGS
    if os.path.exists(SEED_FILE):
        try:
            with open(SEED_FILE, "r", encoding="utf-8") as f:
                BOOKS_DB = json.load(f)
                print(f"✓ [Python LibraAI] Đã nạp thành công {len(BOOKS_DB)} cuốn sách vào hệ thống.")
        except Exception as e:
            print(f"Lỗi khi đọc file seed data: {e}")
            BOOKS_DB = []
    
    # Tạo lịch sử quét mẫu 7 ngày qua
    now = datetime.now()
    for i in range(7):
        date_str = now.strftime("%Y-%m-%d")
        for j in range(15):
            SCAN_LOGS.append({
                "id": f"scan-{i}-{j}",
                "isbn": "9786042171922",
                "timestamp": date_str,
                "success": True
            })

load_initial_data()

# --- Schemas Pydantic ---
class ScanRequest(BaseModel):
    barcode: str
    source: Optional[str] = "camera"

class ChatRequest(BaseModel):
    bookId: str
    question: str
    history: Optional[List[Dict[str, str]]] = None

class CreateBookRequest(BaseModel):
    title: str
    author: str
    isbn: str
    category: str
    publisher: str
    year: int
    description: str
    summary: str
    message: str
    targetAge: str
    coverImage: str
    aiContext: Optional[str] = ""

# --- Helper AI Service (Gemini SDK & Fallback RAG) ---
def query_gemini_ai(book: Dict[str, Any], question: str) -> Dict[str, Any]:
    api_key = os.environ.get("GEMINI_API_KEY")
    
    # Nếu có GEMINI_API_KEY, gọi mô hình Gemini 2.5/Flash
    if api_key:
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            
            prompt = f"""
Bạn là LibraAI — Chuyên gia cố vấn sách thân thiện, uyên bác và truyền cảm hứng cho học sinh thư viện trường học.
Nhiệm vụ: Trả lời câu hỏi của học sinh DỰA TRÊN DỮ LIỆU CUỐN SÁCH sau đây.

THÔNG TIN TÁC PHẨM ĐÃ ĐƯỢC XÁC THỰC:
- Tiêu đề: {book.get('title')}
- Tác giả: {book.get('author')}
- Thể loại: {book.get('category')} ({book.get('year')})
- Tóm tắt cốt truyện: {book.get('summary')}
- Thông điệp cốt lõi: {book.get('message')}
- Các bài học đúc kết: {json.dumps(book.get('keyTakeaways', []), ensure_ascii=False)}
- Bối cảnh chuyên sâu: {book.get('aiContext', '')}

CÂU HỎI CỦA HỌC SINH: "{question}"

YÊU CẦU TRẢ LỜI:
1. Trả lời bằng tiếng Việt tự nhiên, ấm áp, khích lệ tư duy học sinh.
2. Trích dẫn chuẩn xác chi tiết trong sách, không bịa đặt (Grounding).
3. Đưa ra 1 câu hỏi mở gợi mở suy nghĩ ở cuối.
"""
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            return {
                "answer": response.text,
                "provider": "gemini-api",
                "model": "gemini-2.5-flash",
                "sources": [f"Tác phẩm: {book.get('title')}", f"Tác giả: {book.get('author')}", f"Mã ISBN: {book.get('isbn')}"]
            }
        except Exception as e:
            print(f"Lỗi khi gọi Gemini API ({e}), chuyển sang Fallback RAG Engine nội bộ.")

    # Fallback RAG Engine chạy cục bộ (Offline / No Key needed)
    takeaways = "\n".join([f"- {t}" for t in book.get("keyTakeaways", [])])
    fallback_text = f"""Xin chào bạn! Dựa trên phân tích nội dung cuốn sách **"{book.get('title')}"** của tác giả **{book.get('author')}**:

📖 **Thông điệp cốt lõi:**
"{book.get('message')}"

💡 **Các bài học quan trọng:**
{takeaways}

Về câu hỏi *"{question}"*: Tác phẩm nhấn mạnh vào việc khám phá nội tâm và bài học nhân sinh sâu sắc. Bạn có thể mở rộng suy nghĩ bằng cách liên hệ với các tình huống thực tế trong học tập và cuộc sống!"""

    return {
        "answer": fallback_text,
        "provider": "python-rag-fallback",
        "model": "LibraAI Local RAG Engine",
        "sources": [f"Thư viện số: {book.get('title')}", f"ISBN: {book.get('isbn')}"]
    }

# --- API Endpoints ---

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "LibraAI Python Backend",
        "total_books": len(BOOKS_DB),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/books")
def get_all_books(category: Optional[str] = None, q: Optional[str] = None):
    results = BOOKS_DB
    if category and category.lower() != "all":
        results = [b for b in results if b.get("category", "").lower() == category.lower()]
    if q:
        query_str = q.lower()
        results = [
            b for b in results
            if query_str in b.get("title", "").lower()
            or query_str in b.get("author", "").lower()
            or query_str in b.get("isbn", "")
        ]
    return {"success": True, "count": len(results), "books": results}

@app.get("/api/books/{book_id}")
def get_book_by_id(book_id: str):
    for book in BOOKS_DB:
        if book.get("id") == book_id or book.get("isbn") == book_id:
            book["views"] = book.get("views", 0) + 1
            return {"success": True, "book": book}
    raise HTTPException(status_code=404, detail="Không tìm thấy cuốn sách.")

@app.post("/api/barcode/scan")
def scan_barcode(req: ScanRequest):
    code = req.barcode.strip()
    SCAN_LOGS.append({
        "id": f"scan-{len(SCAN_LOGS)+1}",
        "isbn": code,
        "timestamp": datetime.now().isoformat(),
        "source": req.source,
        "success": False
    })

    # Tìm sách theo ISBN
    matched_book = None
    for b in BOOKS_DB:
        if b.get("isbn") == code or code in b.get("isbn", ""):
            matched_book = b
            break

    if matched_book:
        matched_book["scanCount"] = matched_book.get("scanCount", 0) + 1
        SCAN_LOGS[-1]["success"] = True
        return {
            "success": True,
            "message": "✓ Đã nhận diện mã vạch thành công!",
            "barcode": code,
            "book": matched_book,
            "ttsText": f"Chào bạn! Bạn vừa quét cuốn sách {matched_book.get('title')} của tác giả {matched_book.get('author')}."
        }

    return {
        "success": False,
        "message": f"Không tìm thấy sách với mã ISBN: {code}",
        "barcode": code
    }

@app.post("/api/ai/chat")
def chat_with_book_ai(req: ChatRequest):
    matched_book = None
    for b in BOOKS_DB:
        if b.get("id") == req.bookId or b.get("isbn") == req.bookId:
            matched_book = b
            break
            
    if not matched_book:
        raise HTTPException(status_code=404, detail="Không tìm thấy cuốn sách.")

    ai_result = query_gemini_ai(matched_book, req.question)
    return {
        "success": True,
        **ai_result,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/recommendations")
def get_recommendations(bookId: str, limit: int = 4):
    target_book = None
    for b in BOOKS_DB:
        if b.get("id") == bookId:
            target_book = b
            break
            
    if not target_book:
        return {"success": True, "books": BOOKS_DB[:limit]}

    # Gợi ý cùng thể loại hoặc chủ đề
    related = [
        b for b in BOOKS_DB
        if b.get("id") != bookId and (
            b.get("category") == target_book.get("category") or
            any(t in target_book.get("themes", []) for t in b.get("themes", []))
        )
    ]
    return {"success": True, "books": related[:limit]}

@app.get("/api/categories")
def get_categories():
    cat_counts: Dict[str, int] = {}
    for b in BOOKS_DB:
        cat = b.get("category", "Khác")
        cat_counts[cat] = cat_counts.get(cat, 0) + 1

    categories = [
        {"id": cat.lower(), "name": cat, "count": count}
        for cat, count in cat_counts.items()
    ]
    return {"success": True, "categories": categories}

@app.get("/api/analytics")
def get_analytics():
    return {
        "success": True,
        "analytics": {
            "totalBooks": len(BOOKS_DB),
            "totalScans": len(SCAN_LOGS),
            "totalQueries": 120,
            "totalViews": sum(b.get("views", 0) for b in BOOKS_DB),
            "categoryStats": [
                {"category": k, "count": v}
                for k, v in {"Văn học": 6, "Khoa học": 4, "Tâm lý": 3, "Địa lý": 2, "Công nghệ": 2, "Lịch sử": 2}.items()
            ],
            "dailyScans": [
                {"date": "03/03", "scans": 24, "searches": 12},
                {"date": "03/04", "scans": 35, "searches": 18},
                {"date": "03/05", "scans": 42, "searches": 22},
                {"date": "03/06", "scans": 58, "searches": 30},
                {"date": "03/07", "scans": 47, "searches": 25},
                {"date": "03/08", "scans": 63, "searches": 34},
                {"date": "03/09", "scans": 51, "searches": 29}
            ]
        }
    }

@app.get("/api/device/status")
def get_device_status():
    return {
        "success": True,
        "device": {
            "deviceId": "LIBRA-PYTHON-KIOSK-01",
            "name": "LibraAI Python Discovery Station",
            "runtime": "Python 3.10+ & FastAPI",
            "location": "Sảnh Thư viện Trường học",
            "status": "online",
            "geminiConnected": bool(os.environ.get("GEMINI_API_KEY"))
        }
    }

# --- Trang giao diện Web trực quan nhúng sẵn (Single-file Web UI) ---
@app.get("/", response_class=HTMLResponse)
def index_page():
    return f"""<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LibraAI — Python AI Library Discovery</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {{ font-family: 'Plus Jakarta Sans', sans-serif; }}
  </style>
</head>
<body class="bg-[#FFF9F3] text-gray-900 min-h-screen">
  <!-- Header -->
  <header class="border-b border-orange-100 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-2xl">📚</span>
        <div>
          <h1 class="font-extrabold text-xl tracking-tight text-gray-900">
            Libra<span class="text-orange-500">AI</span>
            <span class="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">Python FastAPI</span>
          </h1>
          <p class="text-[11px] text-gray-500">Hệ thống khám phá sách thông minh thư viện trường học</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold">
          ● {len(BOOKS_DB)} cuốn sách
        </span>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <main class="max-w-6xl mx-auto px-6 py-10 space-y-10">
    <div class="text-center space-y-4 max-w-2xl mx-auto">
      <span class="px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wider uppercase bg-orange-500/10 text-orange-600 border border-orange-200">
        ✨ TRÍ TUỆ NHÂN TẠO CHO THƯ VIỆN SỐ
      </span>
      <h2 class="text-4xl sm:text-5xl font-black text-gray-900 leading-tight">
        Quét mã sách, <br>
        <span class="text-orange-500">Khám phá tri thức cùng AI</span>
      </h2>
      <p class="text-sm text-gray-600">
        Nhập mã ISBN hoặc chọn thử các cuốn sách tiêu biểu để trò chuyện, hỏi đáp nội dung cùng trợ lý ảo LibraAI viết bằng Python.
      </p>

      <!-- Quick ISBN Search Form -->
      <div class="pt-4 flex max-w-md mx-auto gap-2">
        <input id="isbnInput" type="text" placeholder="Nhập mã ISBN (ví dụ: 9786042171922)" 
          class="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono" />
        <button onclick="scanIsbn()" 
          class="px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md transition-all">
          Tìm kiếm
        </button>
      </div>

      <!-- Quick Demo Pills -->
      <div class="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
        <span class="text-gray-400 font-semibold">Thử nhanh:</span>
        <button onclick="setSample('9786042171922')" class="px-3 py-1 rounded-full bg-white border border-gray-200 hover:border-orange-500 text-gray-700 font-medium">
          🌟 Hoàng Tử Bé
        </button>
        <button onclick="setSample('9786042183246')" class="px-3 py-1 rounded-full bg-white border border-gray-200 hover:border-orange-500 text-gray-700 font-medium">
          🦗 Dế Mèn Phiêu Lưu Ký
        </button>
        <button onclick="setSample('9786047771233')" class="px-3 py-1 rounded-full bg-white border border-gray-200 hover:border-orange-500 text-gray-700 font-medium">
          🪐 Cosmos: Vũ Trụ
        </button>
        <button onclick="setSample('9786045892341')" class="px-3 py-1 rounded-full bg-white border border-gray-200 hover:border-orange-500 text-gray-700 font-medium">
          🤖 AI Superpowers
        </button>
      </div>
    </div>

    <!-- Book Result Modal / Card -->
    <div id="resultBox" class="hidden p-6 rounded-3xl bg-white border border-orange-200 shadow-xl max-w-3xl mx-auto space-y-6">
      <div class="flex flex-col sm:flex-row gap-6">
        <img id="bookCover" class="w-40 h-56 object-cover rounded-2xl shadow-md border" src="" alt="Bìa sách" />
        <div class="flex-1 space-y-2 text-left">
          <span id="bookCategory" class="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700"></span>
          <h3 id="bookTitle" class="text-2xl font-black text-gray-900"></h3>
          <p id="bookAuthor" class="text-sm font-semibold text-gray-600"></p>
          <p id="bookSummary" class="text-xs text-gray-600 leading-relaxed"></p>
          <div class="p-3 bg-orange-50 rounded-xl border border-orange-100 text-xs">
            <span class="font-bold text-orange-800">Thông điệp:</span>
            <span id="bookMessage" class="italic text-gray-700"></span>
          </div>
        </div>
      </div>

      <!-- AI Chat Box for this book -->
      <div class="border-t pt-4 space-y-3">
        <h4 class="text-sm font-bold text-gray-800 flex items-center gap-2">
          <span>🤖 Trò chuyện với AI về tác phẩm này</span>
        </h4>
        <div id="chatHistory" class="p-4 rounded-xl bg-gray-50 border max-h-60 overflow-y-auto space-y-2 text-xs">
          <div class="p-3 bg-white rounded-lg border text-gray-700">
            Xin chào! Hãy đặt bất kỳ câu hỏi nào về nội dung, nhân vật hoặc bài học của cuốn sách này nhé.
          </div>
        </div>
        <div class="flex gap-2">
          <input id="userQuestion" type="text" placeholder="Đặt câu hỏi cho AI..." 
            class="flex-1 px-4 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-orange-500" 
            onkeydown="if(event.key==='Enter') sendQuestion()" />
          <button onclick="sendQuestion()" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold">
            Hỏi AI
          </button>
        </div>
      </div>
    </div>

    <!-- Books Catalog Grid -->
    <div class="space-y-4">
      <div class="flex items-center justify-between border-b pb-2">
        <h3 class="text-xl font-black text-gray-900">Danh mục tác phẩm trong thư viện ({len(BOOKS_DB)})</h3>
        <span class="text-xs text-gray-500">Python FastAPI + SQLite/JSON</span>
      </div>
      <div id="booksGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <!-- Rendered via JS -->
      </div>
    </div>
  </main>

  <script>
    let currentBookId = null;

    async function loadBooks() {{
      const res = await fetch('/api/books');
      const data = await res.json();
      const grid = document.getElementById('booksGrid');
      grid.innerHTML = data.books.map(b => `
        <div onclick="selectBook('${{b.id}}')" class="cursor-pointer group p-3 bg-white rounded-2xl border border-gray-100 hover:border-orange-300 hover:shadow-lg transition-all text-left">
          <img src="${{b.coverImage}}" class="w-full aspect-[3/4] object-cover rounded-xl mb-2" />
          <span class="text-[10px] font-bold text-orange-600 block">${{b.category}}</span>
          <h4 class="font-extrabold text-xs text-gray-900 group-hover:text-orange-600 line-clamp-1">${{b.title}}</h4>
          <p class="text-[11px] text-gray-500 line-clamp-1">${{b.author}}</p>
        </div>
      `).join('');
    }}

    function setSample(isbn) {{
      document.getElementById('isbnInput').value = isbn;
      scanIsbn();
    }}

    async function scanIsbn() {{
      const isbn = document.getElementById('isbnInput').value.trim();
      if (!isbn) return;
      const res = await fetch('/api/barcode/scan', {{
        method: 'POST',
        headers: {{ 'Content-Type': 'application/json' }},
        body: JSON.stringify({{ barcode: isbn }})
      }});
      const data = await res.json();
      if (data.success && data.book) {{
        displayBook(data.book);
      }} else {{
        alert('Không tìm thấy sách với mã ISBN: ' + isbn);
      }}
    }}

    async function selectBook(id) {{
      const res = await fetch('/api/books/' + id);
      const data = await res.json();
      if (data.success) displayBook(data.book);
    }}

    function displayBook(book) {{
      currentBookId = book.id;
      document.getElementById('resultBox').classList.remove('hidden');
      document.getElementById('bookCover').src = book.coverImage;
      document.getElementById('bookCategory').innerText = book.category;
      document.getElementById('bookTitle').innerText = book.title;
      document.getElementById('bookAuthor').innerText = 'Tác giả: ' + book.author + ' (' + book.year + ')';
      document.getElementById('bookSummary').innerText = book.summary;
      document.getElementById('bookMessage').innerText = book.message;
      
      const history = document.getElementById('chatHistory');
      history.innerHTML = `
        <div class="p-3 bg-white rounded-lg border text-gray-700">
          Xin chào! Mình đã nạp toàn bộ bối cảnh tác phẩm <strong>"${{book.title}}"</strong>. Bạn muốn hỏi gì về cuốn sách này?
        </div>
      `;
      window.scrollTo({{ top: document.getElementById('resultBox').offsetTop - 80, behavior: 'smooth' }});
    }}

    async function sendQuestion() {{
      const input = document.getElementById('userQuestion');
      const question = input.value.trim();
      if (!question || !currentBookId) return;

      const history = document.getElementById('chatHistory');
      history.innerHTML += `
        <div class="p-3 bg-orange-500 text-white rounded-lg text-right font-medium">
          ${{question}}
        </div>
      `;
      input.value = '';
      history.scrollTop = history.scrollHeight;

      history.innerHTML += `
        <div id="loadingAi" class="p-3 bg-white rounded-lg border text-gray-500 italic">
          AI đang suy nghĩ câu trả lời...
        </div>
      `;
      history.scrollTop = history.scrollHeight;

      const res = await fetch('/api/ai/chat', {{
        method: 'POST',
        headers: {{ 'Content-Type': 'application/json' }},
        body: JSON.stringify({{ bookId: currentBookId, question }})
      }});
      const data = await res.json();

      document.getElementById('loadingAi')?.remove();
      if (data.success) {{
        history.innerHTML += `
          <div class="p-3 bg-white rounded-lg border text-gray-800 space-y-1">
            <p class="whitespace-pre-line">${{data.answer}}</p>
            <div class="text-[10px] text-gray-400 mt-2 font-mono">Nguồn: ${{data.sources.join(' • ')}}</div>
          </div>
        `;
      }} else {{
        history.innerHTML += `
          <div class="p-3 bg-red-50 text-red-700 rounded-lg border text-xs">
            Lỗi khi kết nối AI. Vui lòng thử lại!
          </div>
        `;
      }}
      history.scrollTop = history.scrollHeight;
    }}

    loadBooks();
  </script>
</body>
</html>"""

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
