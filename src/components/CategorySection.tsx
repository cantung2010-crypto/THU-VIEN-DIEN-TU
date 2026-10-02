import React from 'react';
import {
  BookOpen,
  Atom,
  Globe2,
  Brain,
  Laptop,
  Palette,
  Scroll,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Category } from '../types.js';
import { sounds } from '../utils/audio.js';

interface CategorySectionProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="w-6 h-6" />,
  Atom: <Atom className="w-6 h-6" />,
  Globe2: <Globe2 className="w-6 h-6" />,
  Brain: <Brain className="w-6 h-6" />,
  Laptop: <Laptop className="w-6 h-6" />,
  Palette: <Palette className="w-6 h-6" />,
  Scroll: <Scroll className="w-6 h-6" />,
  Sparkles: <Sparkles className="w-6 h-6" />,
};

export const CategorySection: React.FC<CategorySectionProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <section id="categories-section" className="py-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-[#6C63FF]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DANH MỤC ĐA DẠNG</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              Khám phá theo Thể loại
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base max-w-xl">
              Từ văn học kinh điển, công nghệ trí tuệ nhân tạo đến vũ trụ học và kỹ năng thế hệ mới.
            </p>
          </div>

          {selectedCategory !== 'all' && (
            <button
              onClick={() => {
                sounds.playTap();
                onSelectCategory('all');
              }}
              className="text-xs font-bold text-[#FF7A00] hover:underline self-start sm:self-end"
            >
              Hiển thị tất cả thể loại (Reset)
            </button>
          )}
        </div>

        {/* 8 Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.id}
                id={`category-card-${cat.id}`}
                onClick={() => {
                  sounds.playTap();
                  onSelectCategory(cat.name);
                }}
                className={`text-left p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden group flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-transparent border-[#FF7A00] shadow-lg shadow-orange-500/10 scale-[1.02]'
                    : 'bg-white/80 dark:bg-[#181824]/80 hover:bg-white dark:hover:bg-[#1f1f2e] border-gray-100 dark:border-white/5 shadow-xs hover:shadow-md hover:-translate-y-1'
                }`}
              >
                {/* Gradient Accent Glow inside Card */}
                <div
                  className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br ${cat.gradient} opacity-10 group-hover:opacity-20 group-hover:scale-150 transition-all duration-500 blur-xl pointer-events-none`}
                />

                <div className="space-y-4">
                  {/* Category Icon */}
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${cat.gradient} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}
                  >
                    {iconMap[cat.icon] || <BookOpen className="w-6 h-6" />}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-lg text-gray-900 dark:text-white group-hover:text-[#FF7A00] transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-500 dark:text-gray-400">
                    {cat.count} tác phẩm
                  </span>
                  <span className="text-[#FF7A00] font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Xem ngay
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
