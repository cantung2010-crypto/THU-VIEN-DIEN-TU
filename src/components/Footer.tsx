import React from 'react';
import { BookOpen, Sparkles, Heart, Cpu, ShieldCheck } from 'lucide-react';
import { sounds } from '../utils/audio.js';

interface FooterProps {
  onNavigate: (tab: string) => void;
  onOpenScanner: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenScanner }) => {
  return (
    <footer id="main-footer" className="mt-20 border-t border-orange-200/50 dark:border-white/5 bg-white/50 dark:bg-[#111119]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF7A00] to-[#6C63FF] flex items-center justify-center text-white shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                THƯ VIỆN <span className="text-[#FF7A00]">THÔNG MINH</span>
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 max-w-sm leading-relaxed">
              Hệ thống khám phá sách thông minh bằng Trí tuệ Nhân tạo & Thị giác máy tính dành cho thư viện trường học hiện đại.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Sẵn sàng kết nối Trạm Kiosk & Raspberry Pi</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Tính năng chính
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400 font-medium">
              <li>
                <button
                  onClick={() => {
                    sounds.playTap();
                    onOpenScanner();
                  }}
                  className="hover:text-[#FF7A00] transition-colors"
                >
                  📷 Quét mã vạch / ISBN
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    sounds.playTap();
                    onNavigate('explore');
                  }}
                  className="hover:text-[#FF7A00] transition-colors"
                >
                  📖 Toàn bộ danh mục sách
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    sounds.playTap();
                    onNavigate('categories');
                  }}
                  className="hover:text-[#FF7A00] transition-colors"
                >
                  🗂️ 8 Thể loại tri thức
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    sounds.playTap();
                    onNavigate('kiosk');
                  }}
                  className="hover:text-[#FF7A00] transition-colors"
                >
                  🖥️ Chế độ Kiosk Station
                </button>
              </li>
            </ul>
          </div>

          {/* System & Tech */}
          <div className="md:col-span-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Công nghệ tích hợp
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Vận hành bởi mô hình <strong>Gemini 3.8 Flash</strong> kết hợp kiến trúc Grounded RAG, bộ giải mã quang học <strong>html5-qrcode</strong> và giao thức kết nối thiết bị biên Raspberry Pi 5.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  sounds.playTap();
                  onNavigate('admin');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#6C63FF]" />
                <span>Cổng quản trị Thủ thư</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-10 pt-6 border-t border-gray-200/50 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 gap-2">
          <p>© {new Date().getFullYear()} THƯ VIỆN THÔNG MINH — Nền tảng Thư viện Số Thông minh.</p>
          <p className="flex items-center gap-1">
            Dành tặng học sinh và các thầy cô giáo tâm huyết với văn hóa đọc.
          </p>
        </div>
      </div>
    </footer>
  );
};
