import React, { useState, useEffect, useRef } from 'react';
import {
  MonitorSmartphone,
  Camera,
  Cpu,
  Volume2,
  VolumeX,
  Sparkles,
  Barcode,
  Bot,
  ArrowLeft,
  CheckCircle2,
  Star,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Book } from '../types.js';
import { sounds } from '../utils/audio.js';

interface DeviceKioskModeProps {
  onExit: () => void;
  onSelectBook: (book: Book) => void;
}

export const DeviceKioskMode: React.FC<DeviceKioskModeProps> = ({ onExit, onSelectBook }) => {
  const [scannedBook, setScannedBook] = useState<Book | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState<any>(null);
  const [inputBuffer, setInputBuffer] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Quick Barcode Demo List for Kiosk Touchscreen
  const kioskDemoBarcodes = [
    { title: 'Hoàng Tử Bé', isbn: '9786042171922' },
    { title: 'Dế Mèn Phiêu Lưu Ký', isbn: '9786042183246' },
    { title: 'Cosmos: Vũ Trụ', isbn: '9786047771233' },
    { title: 'AI Superpowers', isbn: '9786045892341' },
    { title: 'Lão Hạc', isbn: '9786042189910' },
  ];

  // Fetch device hardware status
  useEffect(() => {
    fetch('/api/device/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDeviceStatus(data.device);
        }
      })
      .catch(() => {});
  }, []);

  // Hardware USB Barcode Scanner keystroke listener (scanner acts as a keyboard sending digits + Enter)
  useEffect(() => {
    let keyBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      // Most hardware barcode scanners type within 20-50ms per key
      if (now - lastKeyTime > 300) {
        keyBuffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (keyBuffer.length >= 8) {
          handleProcessBarcode(keyBuffer);
          keyBuffer = '';
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        keyBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleProcessBarcode = async (barcodeStr: string) => {
    setIsScanning(true);
    sounds.playTap();

    try {
      const res = await fetch('/api/device/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: barcodeStr }),
      });
      const data = await res.json();

      if (data.success && data.book) {
        setScannedBook(data.book);
        sounds.playScanSuccess();
        try {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FF7A00', '#6C63FF', '#00C2A8'],
          });
        } catch (e) {}

        // Auto read out book intro in Kiosk Mode
        if (data.ttsText) {
          setIsSpeaking(true);
          sounds.speak(data.ttsText, () => setIsSpeaking(false));
        }
      } else {
        sounds.playError();
        alert(`Không tìm thấy sách với mã: ${barcodeStr}`);
      }
    } catch (err) {
      sounds.playError();
    } finally {
      setIsScanning(false);
    }
  };

  const handleResetKiosk = () => {
    sounds.stopSpeaking();
    setIsSpeaking(false);
    setScannedBook(null);
  };

  return (
    <div
      id="kiosk-mode-container"
      className="fixed inset-0 z-50 bg-[#0F0F17] text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-y-auto"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF7A00] to-[#6C63FF] flex items-center justify-center text-white shadow-md">
            <MonitorSmartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
              <span>THƯ VIỆN THÔNG MINH — Smart Kiosk</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </h2>
            <p className="text-xs text-gray-400">
              Trạm khám phá sách thông minh • {deviceStatus?.location || 'Sảnh thư viện'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.stopSpeaking();
            onExit();
          }}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Thoát chế độ Kiosk</span>
        </button>
      </div>

      {/* Main Kiosk Center Screen */}
      <div className="my-auto max-w-4xl mx-auto w-full py-8 text-center space-y-8">
        {!scannedBook ? (
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wider uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Sparkles className="w-4 h-4" />
              <span>SẴN SÀNG QUÉT MÃ VẠCH</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
              👋 Xin chào bạn! <br />
              <span className="bg-gradient-to-r from-[#FF7A00] via-[#FFA34D] to-[#6C63FF] bg-clip-text text-transparent">
                Đưa mã vạch sách vào để khám phá
              </span>
            </h1>

            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Hướng mã ISBN phía sau cuốn sách vào máy quét laser hoặc camera bên dưới.
            </p>

            {/* Scanner Visual Frame */}
            <div className="relative w-72 h-44 mx-auto rounded-3xl bg-[#181826] border-2 border-dashed border-[#FF7A00]/60 flex items-center justify-center overflow-hidden shadow-2xl shadow-orange-950/40">
              <div className="absolute inset-x-4 h-1 bg-[#FF7A00] shadow-[0_0_15px_#FF7A00] animate-laser-scan" />
              <div className="text-center space-y-2 text-gray-400">
                <Barcode className="w-12 h-12 mx-auto text-[#FF7A00]" />
                <span className="text-xs font-mono tracking-widest uppercase">
                  Vùng nhận diện mã
                </span>
              </div>
            </div>

            {/* Simulated Barcode Input for Touchscreen testing */}
            <div className="pt-4 space-y-3">
              <p className="text-xs text-gray-400">Chạm nhanh 1 cuốn sách để thử nghiệm trên Kiosk:</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {kioskDemoBarcodes.map((item) => (
                  <button
                    key={item.isbn}
                    onClick={() => handleProcessBarcode(item.isbn)}
                    className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-orange-500/20 hover:border-orange-500 border border-white/10 font-bold text-xs text-white transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#FF7A00]" />
                    <span>{item.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Book Found State in Kiosk Mode */
          <div className="rounded-3xl p-8 bg-[#181828] border border-white/10 text-left grid grid-cols-1 md:grid-cols-12 gap-8 items-center shadow-2xl animate-in fade-in">
            <div className="md:col-span-4 flex justify-center">
              <img
                src={scannedBook.coverImage}
                alt={scannedBook.title}
                referrerPolicy="no-referrer"
                className="w-52 aspect-[3/4] object-cover rounded-2xl shadow-2xl border-4 border-white/10"
              />
            </div>

            <div className="md:col-span-8 space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#FF7A00] text-white">
                  {scannedBook.category}
                </span>
                <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400" />
                  {scannedBook.rating}
                </span>
              </div>

              <h2 className="text-3xl font-black text-white">{scannedBook.title}</h2>
              <p className="text-sm font-semibold text-gray-400">
                Tác giả: <span className="text-orange-400">{scannedBook.author}</span> • {scannedBook.year}
              </p>

              <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">
                {scannedBook.summary}
              </p>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1 text-xs">
                <span className="font-bold text-[#FF7A00]">✨ THÔNG ĐIỆP TÁC PHẨM</span>
                <p className="italic text-gray-200">"{scannedBook.message}"</p>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    sounds.stopSpeaking();
                    onSelectBook(scannedBook);
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#6C63FF] text-white font-bold text-sm shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                >
                  <Bot className="w-4 h-4" />
                  <span>Trò chuyện với AI về cuốn sách</span>
                </button>

                <button
                  onClick={handleResetKiosk}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Quét cuốn sách khác</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hardware Specs Footer */}
      <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-gray-400 font-mono">
            <Cpu className="w-3.5 h-3.5 text-[#00C2A8]" />
            Raspberry Pi 5 (8GB RAM)
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="text-gray-400">Camera Module 3 Wide</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-gray-400">Hi-Fi DAC Audio Output</span>
        </div>
        <div className="font-mono text-[11px] text-gray-400">
          THƯ VIỆN THÔNG MINH Firmware: v2.4 Edge • Port 3000 Active
        </div>
      </div>
    </div>
  );
};
