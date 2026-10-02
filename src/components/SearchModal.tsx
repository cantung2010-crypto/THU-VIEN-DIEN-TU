import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen, Star, Barcode, ArrowRight } from 'lucide-react';
import { Book } from '../types.js';
import { sounds } from '../utils/audio.js';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  onSelectBook: (book: Book) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  books,
  onSelectBook,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setSelectedCat('all');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ['all', 'Văn học', 'Khoa học', 'Địa lý', 'Tâm lý', 'Công nghệ', 'Nghệ thuật', 'Lịch sử', 'Kỹ năng sống'];

  const filtered = books.filter((b) => {
    const matchesCat = selectedCat === 'all' || b.category.toLowerCase() === selectedCat.toLowerCase();
    if (!matchesCat) return false;

    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.isbn.includes(q) ||
      b.description.toLowerCase().includes(q) ||
      b.themes.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div
      id="search-modal-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-black/70 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="search-modal-box"
        className="w-full max-w-2xl bg-white dark:bg-[#181824] rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            id="search-dialog-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên sách, tác giả, ISBN, chủ đề..."
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 text-sm font-medium focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-2 py-1 rounded bg-gray-100 dark:bg-white/10"
          >
            ESC
          </button>
        </div>

        {/* Category Pills Filter */}
        <div className="p-3 border-b border-gray-100 dark:border-white/10 flex gap-1.5 overflow-x-auto no-scrollbar overscroll-contain text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-colors ${
                selectedCat === cat
                  ? 'bg-[#FF7A00] text-white'
                  : 'bg-gray-100 dark:bg-[#222230] text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'Tất cả' : cat}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto overscroll-contain p-3 divide-y divide-gray-100 dark:divide-white/5 space-y-1">
          {filtered.length > 0 ? (
            filtered.map((book) => (
              <button
                key={book.id}
                id={`search-result-${book.id}`}
                onClick={() => {
                  sounds.playTap();
                  onSelectBook(book);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-2xl hover:bg-orange-50/60 dark:hover:bg-[#202030] transition-colors flex items-center gap-3.5 group"
              >
                <img
                  src={book.coverImage}
                  alt={book.title}
                  referrerPolicy="no-referrer"
                  className="w-12 h-16 object-cover rounded-xl shadow-xs shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-[#FF7A00]">
                      {book.category}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">ISBN: {book.isbn}</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white truncate group-hover:text-[#FF7A00] transition-colors">
                    {book.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {book.author} ({book.year})
                  </p>
                </div>

                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#FF7A00] group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            ))
          ) : (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <BookOpen className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-sm font-semibold">Không tìm thấy cuốn sách nào phù hợp.</p>
              <p className="text-xs">Hãy thử tìm theo từ khóa khác hoặc xóa bộ lọc thể loại.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
