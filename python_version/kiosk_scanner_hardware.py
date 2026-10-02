"""
LibraAI — Hardware Barcode Scanner & Speech Station (Python + OpenCV / PyZbar / USB Scanner)
Chương trình Python độc lập dùng để chạy trên Raspberry Pi hoặc máy tính thư viện.
Tự động quét mã vạch qua Camera/USB, đọc to tóm tắt (TTS) và gọi Gemini AI.
"""

import sys
import time
import requests

SERVER_URL = "http://localhost:8000"  # Hoặc URL của server LibraAI

def speak_text(text: str):
    """Phát âm thanh đọc to văn bản tiếng Việt"""
    print(f"\n🔊 [TTS Đọc sách]: {text}")
    try:
        import pyttsx3
        engine = pyttsx3.init()
        engine.setProperty("rate", 150)
        engine.say(text)
        engine.runAndWait()
    except Exception:
        # Nếu chưa cài pyttsx3, chỉ in ra màn hình
        pass

def handle_scanned_barcode(barcode: str):
    print(f"\n⚡ [Phát hiện mã vạch]: {barcode}")
    try:
        response = requests.post(
            f"{SERVER_URL}/api/barcode/scan",
            json={"barcode": barcode, "source": "hardware-scanner"},
            timeout=5
        )
        data = response.json()
        if data.get("success") and data.get("book"):
            book = data["book"]
            print("=" * 60)
            print(f"📖 TÊN SÁCH: {book.get('title')}")
            print(f"✍️ TÁC GIẢ: {book.get('author')} ({book.get('year')})")
            print(f"🏷️ THỂ LOẠI: {book.get('category')}")
            print(f"📝 TÓM TẮT: {book.get('summary')}")
            print(f"✨ THÔNG ĐIỆP: {book.get('message')}")
            print("=" * 60)
            
            # Đọc to qua loa
            tts_text = f"Chào bạn! Bạn vừa quét cuốn sách {book.get('title')} của tác giả {book.get('author')}. {book.get('message')}"
            speak_text(tts_text)

            # Tự động gợi ý câu hỏi AI
            ask_ai = input("\n🤖 Bạn có muốn hỏi AI câu gì về cuốn sách này không? (Nhấn Enter để bỏ qua): ")
            if ask_ai.strip():
                ai_resp = requests.post(
                    f"{SERVER_URL}/api/ai/chat",
                    json={"bookId": book.get("id"), "question": ask_ai},
                    timeout=15
                ).json()
                if ai_resp.get("success"):
                    print("\n--- CÂU TRẢ LỜI TỪ LIBRAAI ---")
                    print(ai_resp.get("answer"))
                    print("-----------------------------")
        else:
            print(f"❌ Không tìm thấy sách trong thư viện với mã: {barcode}")
    except Exception as e:
        print(f"Lỗi kết nối máy chủ: {e}")

def run_usb_scanner_mode():
    """Chế độ lắng nghe máy quét mã vạch cổng USB (hoạt động như bàn phím)"""
    print("\n[CHẾ ĐỘ MÁY QUÉT MÃ VẠCH USB]")
    print("Vui lòng cầm đầu đọc mã vạch và bắn vào mã ISBN phía sau sách.")
    print("Nhập 'exit' để thoát.\n")

    while True:
        try:
            code = input(">> Quét mã vạch (hoặc nhập ISBN): ").strip()
            if code.lower() in ["exit", "quit"]:
                break
            if code:
                handle_scanned_barcode(code)
        except KeyboardInterrupt:
            break

if __name__ == "__main__":
    print("=" * 60)
    print("📚 LIBRAAI — TRẠM PHẦN CỨNG QUÉT SÁCH THƯ VIỆN (PYTHON)")
    print("=" * 60)
    run_usb_scanner_mode()
