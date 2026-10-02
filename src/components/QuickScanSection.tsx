import React, { useState } from 'react';
import { Camera, Search, Barcode, Sparkles, ArrowRight, BookMarked } from 'lucide-react';
import { sounds } from '../utils/audio.js';

interface QuickScanSectionProps {
  onOpenScanner: () => void;
  onSearchIsbn: (isbn: string) => void;
  isSearching: boolean;
}

export const QuickScanSection: React.FC<QuickScanSectionProps> = ({
  onOpenScanner,
  onSearchIsbn,
  isSearching,
}) => {
  const [isbnInput, setIsbnInput] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isbnInput.trim()) return;
    sounds.playTap();
    onSearchIsbn(isbnInput.trim());
  };

  const sampleBarcodes = [
    { label: 'Hoàng Tử Bé', isbn: '9786042171922' },
    { label: 'Dế Mèn Phiêu Lưu Ký', isbn: '9786042183246' },
    { label: 'Sapiens: Lược Sử', isbn: '9786045656105' },
    { label: 'Cosmos: Vũ Trụ', isbn: '9786047771233' },
    { label: 'AI Superpowers', isbn: '9786045892341' },
    { label: 'Lão Hạc', isbn: '9786042189910' },
  ];

  return (
    <section id="quick-scan-section" className="py-12 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-white via-[#FFF8F0] to-[#F5F0FF] dark:from-[#171722] dark:via-[#1A1A26] dark:to-[#171720] border-2 border-orange-200/60 dark:border-white/10 shadow-xl shadow-orange-900/5 relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/15 text-[#FF7A00]">
              <Barcode className="w-3.5 h-3.5" />
              <span>NHẬN DIỆN MÃ VẠCH SIÊU TỐC</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              Cuốn sách đang ở ngay trước mặt bạn?
            </h2>

            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              Chỉ cần đưa mã vạch sau bìa sách vào camera hoặc nhập mã ISBN, AI sẽ tự động phân tích và sẵn sàng đối thoại cùng bạn.
            </p>
          </div>

          {/* Action Boxes */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Camera Scan Button */}
            <div className="md:col-span-5">
              <button
                id="quick-scan-camera-btn"
                onClick={() => {
                  sounds.playTap();
                  onOpenScanner();
                }}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF7A00] to-[#6C63FF] text-white font-extrabold text-base shadow-lg shadow-orange-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.99] transition-all flex items-center justify-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
                <span>BẬT CAMERA QUÉT MÃ</span>
              </button>
            </div>

            <div className="md:col-span-1 text-center font-bold text-xs uppercase tracking-wider text-gray-400">
              HOẶC
            </div>

            {/* Manual ISBN Input */}
            <form onSubmit={handleManualSubmit} className="md:col-span-6 flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  id="manual-isbn-input"
                  value={isbnInput}
                  onChange={(e) => setIsbnInput(e.target.value)}
                  placeholder="Nhập mã ISBN (ví dụ: 9786042171922)..."
                  className="w-full h-14 pl-11 pr-4 rounded-2xl bg-white dark:bg-[#20202C] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF7A00] transition-all shadow-sm"
                />
                <Barcode className="w-5 h-5 text-gray-400 absolute left-3.5 top-4.5" />
              </div>

              <button
                type="submit"
                id="manual-isbn-submit-btn"
                disabled={isSearching || !isbnInput.trim()}
                className="h-14 px-6 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
              >
                {isSearching ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Tìm</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Demo Test Buttons */}
          <div className="mt-6 pt-5 border-t border-gray-200/70 dark:border-white/5 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#FF7A00]" />
              Thử mã nhanh:
            </span>
            {sampleBarcodes.map((item) => (
              <button
                key={item.isbn}
                type="button"
                id={`sample-barcode-${item.isbn}`}
                onClick={() => {
                  sounds.playTap();
                  setIsbnInput(item.isbn);
                  onSearchIsbn(item.isbn);
                }}
                className="px-3 py-1.5 rounded-full bg-white dark:bg-[#232330] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-medium hover:border-[#FF7A00] hover:text-[#FF7A00] dark:hover:text-orange-400 transition-all flex items-center gap-1 shadow-2xs"
              >
                <BookMarked className="w-3 h-3 text-[#6C63FF]" />
                <span>{item.label}</span>
                <span className="font-mono text-[10px] text-gray-400">({item.isbn.slice(-4)})</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
