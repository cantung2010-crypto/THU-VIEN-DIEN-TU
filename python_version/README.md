# 📚 LibraAI — Phiên bản Python (FastAPI + Gemini AI)

Thư mục này chứa **toàn bộ mã nguồn hoàn chỉnh của hệ thống LibraAI được viết bằng ngôn ngữ Python**.

---

## 🏗️ Kiến trúc Python bao gồm:
1. **`main.py`**:
   - Backend API viết bằng **FastAPI** + **Uvicorn**.
   - Tích hợp **Google Gen AI Python SDK (`google-genai`)** sử dụng mô hình **Gemini 2.5/Flash**.
   - Bộ máy **Local RAG Fallback Engine** tích hợp sẵn dữ liệu bối cảnh 22 cuốn sách kinh điển.
   - Nhúng sẵn giao diện Web tương tác trực quan (HTML5 + Tailwind CSS).
2. **`kiosk_scanner_hardware.py`**:
   - Tập lệnh Python chạy trực tiếp trên **Raspberry Pi** hoặc máy tính thư viện.
   - Kết nối máy quét mã vạch USB / đầu đọc laser quang học và tự động phát âm thanh Text-to-Speech (TTS).
3. **`requirements.txt`**:
   - Danh sách các thư viện Python cần thiết (`fastapi`, `uvicorn`, `google-genai`, `requests`,...).

---

## 🚀 Hướng dẫn cài đặt và khởi chạy:

### Bước 1: Cài đặt thư viện
```bash
cd python_version
pip install -r requirements.txt
```

### Bước 2: Thiết lập Gemini API Key (Tùy chọn)
```bash
export GEMINI_API_KEY="khoa_gemini_cua_ban"
```
*(Nếu không có khóa API, hệ thống sẽ tự động chuyển sang bộ máy Fallback RAG nội bộ vẫn trả lời câu hỏi mượt mà).*

### Bước 3: Chạy máy chủ Web
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Truy cập trình duyệt tại địa chỉ: **`http://localhost:8000`**

### Bước 4 (Dành cho trạm Kiosk / Raspberry Pi):
Chạy song song trạm quét phần cứng:
```bash
python kiosk_scanner_hardware.py
```
