import React from 'react';
import { BookOpen, Camera, Sparkles } from 'lucide-react';

interface NavbarProps {
  onOpenScanner: () => void;
  totalBooks?: number;
  onOpenPersonalityMatch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenScanner,
  onOpenPersonalityMatch,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white shadow-xs shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-xs sm:text-base text-gray-950 tracking-tight block truncate">
              THƯ VIỆN THÔNG MINH
            </span>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onOpenPersonalityMatch && (
            <button
              type="button"
              onClick={onOpenPersonalityMatch}
              className="px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-gradient-to-r from-orange-50 to-purple-50 text-gray-800 border border-orange-200/60 hover:border-orange-300 active:scale-95 transition-all shadow-2xs cursor-pointer"
              title="Gợi ý theo sở thích & tính cách cá nhân"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span className="hidden xs:inline sm:inline">Gợi ý AI</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenScanner}
            className="group relative px-2.5 sm:px-3.5 py-1.5 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 active:scale-95 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-orange-600/20 hover:shadow-orange-600/35 shrink-0 cursor-pointer border border-orange-400/40"
            title="Quét mã vạch ISBN & QR sách siêu nhạy"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <Camera className="w-3.5 h-3.5 text-white transition-transform group-hover:scale-110" />
            <span className="font-extrabold tracking-tight">Quét mã</span>
          </button>
        </div>
      </div>
    </header>
  );
};
