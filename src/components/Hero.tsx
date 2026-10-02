import React from 'react';
import { Camera, ArrowRight, Sparkles, BookOpen, Bot, Star, Compass } from 'lucide-react';
import { sounds } from '../utils/audio.js';
import { Book } from '../types.js';

interface HeroProps {
  onOpenScanner: () => void;
  onExplore: () => void;
  onSelectBook: (book: Book) => void;
  featuredBook: Book | null;
  totalBooksCount: number;
}

export const Hero: React.FC<HeroProps> = ({
  onOpenScanner,
  onExplore,
  onSelectBook,
  featuredBook,
  totalBooksCount,
}) => {
  // Fallback demo book for the mockup if not loaded yet
  const sampleBook: Book = featuredBook || {
    id: 'hoang-tu-be',
    isbn: '9786042171922',
    title: 'Hoàng Tử Bé (Le Petit Prince)',
    author: 'Antoine de Saint-Exupéry',
    publisher: 'NXB Hội Nhà Văn',
    year: 1943,
    category: 'Văn học',
    description: 'Kiệt tác triết học và tình cảm nhân loại về cuộc gặp gỡ diệu kỳ trên sa mạc Sahara.',
    summary: 'Một viên phi công gặp Hoàng Tử Bé đến từ tiểu hành tinh B612, khám phá bí mật: Người ta chỉ thấy rõ bằng trái tim.',
    keyTakeaways: ['Thấy rõ bằng trái tim', 'Có trách nhiệm với điều mình thuần hóa'],
    themes: ['Tình yêu', 'Sự gắn kết', 'Trưởng thành'],
    message: 'Điều cốt yếu vô hình đối với mắt trần.',
    targetAge: 'Học sinh THPT',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    aiContext: '',
    rating: 5.0,
    views: 2180,
    scanCount: 489,
    createdAt: '',
    updatedAt: '',
  };

  return (
    <section id="hero-section" className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-gradient-to-tr from-[#FF7A00]/15 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-28 right-10 w-96 h-96 bg-gradient-to-bl from-[#6C63FF]/15 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-gradient-to-tr from-[#00C2A8]/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline & Action */}
          <div className="lg:col-span-7 text-left space-y-6">
            {/* AI-Powered Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-orange-500/10 dark:bg-orange-500/20 text-[#FF7A00] border border-orange-500/20 shadow-sm">
              <Sparkles className="w-4 h-4 text-[#FF7A00]" />
              <span>AI-POWERED SMART LIBRARY</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-[1.12]">
              Mở một cuốn sách. <br className="hidden sm:inline" />
              Khám phá cả một thế giới cùng{' '}
              <span className="bg-gradient-to-r from-[#FF7A00] via-[#E85D04] to-[#6C63FF] bg-clip-text text-transparent">
                AI
              </span>
              .
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
              Quét mã sách, khám phá nội dung, trò chuyện với AI và tìm cuốn sách tiếp theo dành riêng cho bạn trong thư viện trường học.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                id="hero-scan-cta"
                onClick={() => {
                  sounds.playTap();
                  onOpenScanner();
                }}
                className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-[#FF7A00] to-[#FF9330] hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Quét mã sách</span>
              </button>

              <button
                id="hero-explore-cta"
                onClick={() => {
                  sounds.playTap();
                  onExplore();
                }}
                className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl font-bold text-base text-gray-800 dark:text-white bg-white/80 dark:bg-[#1E1E28] hover:bg-white dark:hover:bg-[#272736] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all group"
              >
                <span>Khám phá thư viện</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#6C63FF]" />
              </button>
            </div>

            {/* Micro stats under CTA */}
            <div className="pt-4 flex items-center gap-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {totalBooksCount || 22} tác phẩm sẵn sàng
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-[#6C63FF]" />
                <span>RAG Trả lời chính xác ngữ cảnh</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D / Glass Mockup */}
          <div className="lg:col-span-5 relative flex justify-center">
            {/* Outer Mockup Card Container */}
            <div
              id="hero-mockup-card"
              onClick={() => {
                sounds.playTap();
                onSelectBook(sampleBook);
              }}
              className="w-full max-w-sm rounded-3xl p-5 bg-white/85 dark:bg-[#17171F]/90 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-2xl shadow-orange-950/10 dark:shadow-black/60 relative cursor-pointer group hover:-translate-y-1 transition-all duration-300"
            >
              {/* Header inside Mockup */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00C2A8]/15 text-[#00a892] dark:text-[#00c2a8]">
                  <Sparkles className="w-3 h-3" />
                  <span>AI VERIFIED</span>
                </div>
              </div>

              {/* Book Cover Showcase */}
              <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-[4/3] mb-4 group-hover:scale-[1.02] transition-transform">
                <img
                  src={sampleBook.coverImage}
                  alt={sampleBook.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-white">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-orange-300">
                    {sampleBook.category}
                  </span>
                  <h3 className="text-xl font-black leading-tight line-clamp-1">{sampleBook.title}</h3>
                  <p className="text-xs text-gray-300 font-medium">{sampleBook.author}</p>
                </div>
              </div>

              {/* Mockup Book Stats & AI Insight */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{sampleBook.rating}</span>
                    <span className="text-gray-400 font-normal">/ 5.0</span>
                  </div>
                  <span className="text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                    ISBN: {sampleBook.isbn}
                  </span>
                </div>

                {/* AI Insight Box inside Card */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-teal-500/10 border border-orange-500/20 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#FF7A00] dark:text-orange-400">
                    <Bot className="w-3.5 h-3.5" />
                    <span>AI Insight</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 line-clamp-2 italic text-[11px]">
                    "{sampleBook.message}"
                  </p>
                </div>
              </div>

              {/* Tap to inspect hint */}
              <div className="mt-4 pt-2 text-center text-[11px] font-bold text-[#6C63FF] dark:text-[#9c96ff] flex items-center justify-center gap-1 group-hover:underline">
                <span>Chạm để xem chi tiết & hỏi AI</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Floating Card 1: AI đang phân tích */}
            <div className="absolute -top-6 -left-6 sm:-left-10 bg-white/95 dark:bg-[#1f1f2a]/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 flex items-center gap-3 animate-float-slow pointer-events-none">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6C63FF] to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">AI đang phân tích...</p>
                <p className="text-[10px] text-gray-400">Trích xuất bối cảnh & nhân vật</p>
              </div>
            </div>

            {/* Floating Card 2: 1,284 cuốn sách */}
            <div className="absolute -bottom-6 -left-4 sm:-left-8 bg-white/95 dark:bg-[#1f1f2a]/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 flex items-center gap-2.5 animate-pulse-glow pointer-events-none">
              <BookOpen className="w-4 h-4 text-[#FF7A00]" />
              <div>
                <span className="text-xs font-extrabold text-gray-900 dark:text-white">Thư viện số hóa</span>
                <p className="text-[10px] text-gray-400">Tra cứu tức thì bằng camera</p>
              </div>
            </div>

            {/* Floating Card 3: Gợi ý dành cho bạn */}
            <div className="absolute top-1/2 -right-6 sm:-right-8 bg-white/95 dark:bg-[#1f1f2a]/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 flex items-center gap-2 animate-float-slow pointer-events-none">
              <Sparkles className="w-4 h-4 text-[#00C2A8]" />
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">✨ Gợi ý cá nhân hóa</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
