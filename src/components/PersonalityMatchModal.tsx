import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Heart,
  BookOpen,
  Compass,
  ArrowRight,
  RotateCcw,
  Bot,
  MapPin,
  CheckCircle,
  HelpCircle,
  Percent,
} from 'lucide-react';
import { Book, PersonalityRecommendation } from '../types.js';

interface PersonalityMatchModalProps {
  isOpen?: boolean;
  embedded?: boolean;
  onClose?: () => void;
  onSelectBook: (book: Book) => void;
}

const PERSONALITY_PRESETS = [
  { id: 'introvert', label: 'Trầm tính, hướng nội, thích suy ngẫm sâu', icon: '🌿' },
  { id: 'active', label: 'Năng động, hướng ngoại, thích phiêu lưu', icon: '⚡' },
  { id: 'logic', label: 'Tư duy logic, yêu khoa học & thực tế', icon: '🔬' },
  { id: 'sensitive', label: 'Giàu cảm xúc, tâm hồn nghệ thuật & lãng mạn', icon: '🎨' },
  { id: 'curious', label: 'Hiếu học, tò mò, thích khám phá tri thức mới', icon: '💡' },
  { id: 'stressed', label: 'Đang áp lực thi cử, cần bình yên & chữa lành', icon: '🍃' },
  { id: 'ambitious', label: 'Muốn bứt phá giới hạn, tìm động lực sống', icon: '🎯' },
  { id: 'philosophical', label: 'Thích triết lý nhân sinh, ý nghĩa cuộc sống', icon: '💭' },
];

const GENRE_PRESETS = [
  'Văn học',
  'Khoa học',
  'Tâm lý',
  'Kỹ năng sống',
  'Lịch sử',
  'Phiêu lưu & Kỳ bí',
];

const GOAL_PRESETS = [
  { id: 'relax', label: 'Thư giãn tâm hồn, xả stress sau giờ học', icon: '☕' },
  { id: 'inspire', label: 'Truyền cảm hứng & thắp lửa động lực', icon: '🔥' },
  { id: 'intellect', label: 'Mở mang tư duy khoa học & thế giới quan', icon: '🧠' },
  { id: 'empathy', label: 'Thấu hiểu bản thân & nuôi dưỡng lòng nhân ái', icon: '❤️' },
];

export const PersonalityMatchModal: React.FC<PersonalityMatchModalProps> = ({
  isOpen = true,
  embedded = false,
  onClose,
  onSelectBook,
}) => {
  const [selectedTraits, setSelectedTraits] = useState<string[]>(['Trầm tính, hướng nội, thích suy ngẫm sâu']);
  const [customTrait, setCustomTrait] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Văn học']);
  const [selectedGoal, setSelectedGoal] = useState<string>('Thư giãn tâm hồn, xả stress sau giờ học');

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PersonalityRecommendation[] | null>(null);
  const [aiComment, setAiComment] = useState('');
  const [provider, setProvider] = useState('');

  if (!embedded && !isOpen) return null;

  const toggleTrait = (label: string) => {
    setSelectedTraits((prev) =>
      prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]
    );
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleMatch = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/personality-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'self',
          targetName: '',
          personalityTraits: selectedTraits,
          customPersonality: customTrait.trim(),
          favoriteGenres: selectedGenres,
          readingGoal: selectedGoal,
        }),
      });

      const data = await res.json();
      if (data.success && data.recommendations) {
        setResults(data.recommendations);
        setAiComment(data.aiComment || '');
        setProvider(data.provider || '');
      }
    } catch (err) {
      console.error('Error fetching personality match:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setAiComment('');
  };

  const targetLabel = 'bạn';

  const modalCard = (
    <div className={`bg-white w-full flex flex-col ${
      embedded
        ? 'border border-gray-200 shadow-sm rounded-2xl'
        : 'max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:rounded-2xl shadow-2xl border-0 sm:border border-gray-100 overflow-hidden'
    }`}>
      {/* Modal Header */}
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50/70 via-white to-purple-50/70 shrink-0">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#FF7A00] to-[#6C63FF] text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-1.5 truncate">
              <span className="truncate">Gợi ý Sách theo Sở thích & Tính cách</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-semibold bg-orange-100 text-orange-700 shrink-0">
                AI Gemini
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-500 truncate">
              Tìm cuốn sách chạm đúng tâm hồn và năng lượng riêng của bạn
            </p>
          </div>
        </div>
        {onClose && !embedded && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-5 sm:space-y-6 text-sm">
          {!results ? (
            <>
              {/* Section 1: Personality Traits */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>1. Nét tính cách & Tâm lý của {targetLabel}</span>
                  </label>
                  <span className="text-[11px] text-gray-400">Có thể chọn nhiều mục</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PERSONALITY_PRESETS.map((p) => {
                    const isSelected = selectedTraits.includes(p.label);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleTrait(p.label)}
                        className={`px-3 py-2 rounded-xl text-xs text-left border flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-gray-900 bg-gray-900 text-white font-medium shadow-xs'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <span className="text-sm">{p.icon}</span>
                        <span className="flex-1 truncate">{p.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1">
                  <input
                    type="text"
                    value={customTrait}
                    onChange={(e) => setCustomTrait(e.target.value)}
                    placeholder="Mô tả thêm tính cách hoặc hoàn cảnh (VD: hơi ít nói, mê thiên văn, cần sự tĩnh lặng...)"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-gray-300"
                  />
                </div>
              </div>

              {/* Section 2: Favorite Genres */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#00C2A8]" />
                  <span>2. Thể loại hoặc phong cách yêu thích</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {GENRE_PRESETS.map((genre) => {
                    const isSelected = selectedGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => toggleGenre(genre)}
                        className={`px-3 py-1.5 rounded-lg text-xs border font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#FF7A00] border-[#FF7A00] text-white'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Reading Goal */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-blue-500" />
                  <span>3. Cảm xúc hoặc mục tiêu mong muốn đạt được</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {GOAL_PRESETS.map((g) => {
                    const isSelected = selectedGoal === g.label;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setSelectedGoal(g.label)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'border-[#6C63FF] bg-purple-50/50 text-[#6C63FF] font-semibold ring-1 ring-[#6C63FF]'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <span className="text-base">{g.icon}</span>
                        <span className="flex-1">{g.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Results View */
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* AI Thought Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 via-white to-purple-50 border border-orange-100 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                  <Bot className="w-4 h-4 text-[#FF7A00]" />
                  <span>Phân tích từ Trợ lý AI Thư viện ({provider || 'Google Gemini'})</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed italic">
                  "{aiComment}"
                </p>
              </div>

              {/* Recommendation Cards */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Sách được tuyển chọn phù hợp nhất cho {targetLabel} ({results.length} cuốn):
                  </h3>
                  <button
                    onClick={handleReset}
                    className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 font-medium"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Đổi tiêu chí khác</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {results.map((item, idx) => (
                    <div
                      key={item.book.id || idx}
                      className="p-3.5 rounded-xl border border-gray-200 bg-white hover:border-gray-400 hover:shadow-xs transition-all flex flex-col sm:flex-row gap-3.5 items-start"
                    >
                      {/* Cover Thumbnail */}
                      <img
                        src={item.book.coverImage}
                        alt={item.book.title}
                        className="w-16 h-22 object-cover rounded-lg border border-gray-200 shadow-xs shrink-0 self-center sm:self-start"
                        referrerPolicy="no-referrer"
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1.5 w-full">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <h4 className="font-bold text-sm text-gray-900 leading-tight">
                            {item.book.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <Percent className="w-2.5 h-2.5" />
                            <span>{item.matchScore}% Phù hợp</span>
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span>{item.book.author}</span>
                          <span>•</span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-medium text-gray-700">
                            {item.book.category}
                          </span>
                          {item.book.shelfLocation && (
                            <>
                              <span>•</span>
                              <span className="text-[11px] text-gray-500 flex items-center gap-0.5">
                                <MapPin className="w-3 h-3 text-orange-500" />
                                <span>{item.book.shelfLocation}</span>
                              </span>
                            </>
                          )}
                        </div>

                        {/* Match Reason */}
                        <div className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100 space-y-1">
                          <div className="font-semibold text-gray-900 flex items-center gap-1 text-[11px]">
                            <Sparkles className="w-3 h-3 text-[#FF7A00]" />
                            <span>Lý do cuốn sách này đồng điệu với {targetLabel}:</span>
                          </div>
                          <p className="text-gray-600 leading-relaxed">
                            {item.matchReason}
                          </p>
                          {item.highlightQuoteOrLesson && (
                            <p className="text-[11px] text-[#6C63FF] font-medium pt-1 italic">
                              "Lời gửi gắm: {item.highlightQuoteOrLesson}"
                            </p>
                          )}
                        </div>

                        {/* Action CTA */}
                        <div className="pt-1 flex items-center justify-end">
                          <button
                            onClick={() => {
                              onSelectBook(item.book);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <span>Xem chi tiết & Hỏi Chatbot AI</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          {!results ? (
            <>
              <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF7A00]" />
                <span>AI sẽ phân tích ngữ cảnh sách & tâm lý để ghép đôi</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleMatch}
                  disabled={loading || selectedTraits.length === 0}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#6C63FF] hover:opacity-95 text-white text-xs font-bold flex items-center gap-2 shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Gemini đang phân tích tâm lý...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Tìm sách phù hợp</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Chọn lại tính cách & sở thích</span>
              </button>
              {onClose && !embedded && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-black transition-colors"
                >
                  Đã xong
                </button>
              )}
            </div>
          )}
        </div>
      </div>
  );

  if (embedded) {
    return <div className="w-full max-w-4xl mx-auto">{modalCard}</div>;
  }

  return (
    <div
      id="personality-match-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-hidden overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      {modalCard}
    </div>
  );
};
