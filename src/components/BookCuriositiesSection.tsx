import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Eye,
  RotateCcw,
  ArrowRight,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Bot,
  Zap,
} from 'lucide-react';
import { Book, BookCuriosityQuestion } from '../types.js';
import { getCuriositiesForBook } from '../data/bookCuriosities.js';

interface BookCuriositiesSectionProps {
  book: Book;
  onAskGemini: (prompt: string) => void;
}

export const BookCuriositiesSection: React.FC<BookCuriositiesSectionProps> = ({
  book,
  onAskGemini,
}) => {
  const [curiosities, setCuriosities] = useState<BookCuriosityQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [provider, setProvider] = useState<string>('');

  // Load curated curiosities when book changes
  useEffect(() => {
    const initial = getCuriositiesForBook(book);
    setCuriosities(initial);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setRevealed({});
    setProvider('Dữ liệu tuyển chọn Thư viện');
  }, [book.id]);

  const currentQ = curiosities[currentIndex] || null;

  const handleSelectOption = (qId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optionIndex }));
    setRevealed((prev) => ({ ...prev, [qId]: true }));
  };

  const handleToggleReveal = (qId: string) => {
    setRevealed((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleNext = () => {
    if (currentIndex < curiosities.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0); // loop
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(curiosities.length - 1);
    }
  };

  const handleGenerateWithAi = async () => {
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/ai/book-curiosities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id }),
      });
      const data = await res.json();
      if (data.success && data.curiosities && data.curiosities.length > 0) {
        setCuriosities(data.curiosities);
        setCurrentIndex(0);
        setSelectedAnswers({});
        setRevealed({});
        setProvider(data.provider || 'Google Gemini AI');
      }
    } catch (err) {
      console.error('Error fetching AI curiosities:', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  if (!currentQ) return null;

  const selectedOpt = selectedAnswers[currentQ.id];
  const isAnswered = selectedOpt !== undefined;
  const isRevealed = revealed[currentQ.id] || isAnswered;
  const isCorrect = isAnswered && selectedOpt === currentQ.correctOptionIndex;

  return (
    <div id="book-curiosities-section" className="space-y-4">
      {/* Section Header */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-purple-500/10 p-3.5 rounded-xl border border-amber-200/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xs">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              <span>Hiểu biết về sách & Câu hỏi khơi gợi tò mò</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                {curiosities.length} câu đố
              </span>
            </h3>
            <p className="text-[11px] text-gray-500">
              Khám phá bí mật, góc nhìn phản biện & hình ảnh sinh động
            </p>
          </div>
        </div>

        {/* AI refresh curiosity button */}
        <button
          type="button"
          onClick={handleGenerateWithAi}
          disabled={isLoadingAi}
          title="Tạo thêm câu hỏi tò mò mới từ Gemini AI"
          className="px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:text-gray-900 hover:border-gray-300 text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
        >
          {isLoadingAi ? (
            <>
              <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span className="hidden sm:inline">AI đang suy nghĩ...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span className="hidden sm:inline">Đổi câu hỏi</span>
              <span className="sm:hidden">Đổi</span>
            </>
          )}
        </button>
      </div>

      {/* Main Question Card with Vivid Imagery */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs transition-all">
        {/* Vivid Thematic Illustration */}
        <div className="relative aspect-video sm:aspect-[21/9] w-full overflow-hidden bg-gray-950 group">
          <img
            src={currentQ.imageUrl}
            alt={currentQ.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-black/60 backdrop-blur-md text-amber-300 border border-white/20 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{currentQ.tag}</span>
            </span>

            {/* Navigation pill */}
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 text-white text-[11px] font-mono">
              <span>{currentIndex + 1}</span>
              <span className="text-gray-400">/</span>
              <span>{curiosities.length}</span>
            </div>
          </div>

          {/* Image caption on bottom of image */}
          <div className="absolute bottom-2.5 left-3 right-3">
            <h4 className="text-white text-sm sm:text-base font-bold drop-shadow-sm leading-snug">
              {currentQ.title}
            </h4>
            <p className="text-[11px] text-gray-300 line-clamp-1 italic mt-0.5">
              {currentQ.imageCaption}
            </p>
          </div>
        </div>

        {/* Card Content & Question */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* The Curiosity Question */}
          <div className="space-y-2">
            <div className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                ?
              </span>
              <h5 className="text-sm sm:text-[15px] font-bold text-gray-900 leading-snug">
                {currentQ.question}
              </h5>
            </div>

            {/* Mystery clue teaser */}
            {currentQ.mysteryClue && (
              <div className="ml-8 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/50 text-xs text-amber-900 flex items-start gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span className="italic leading-relaxed">{currentQ.mysteryClue}</span>
              </div>
            )}
          </div>

          {/* Interactive Multiple Choice Options */}
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
              <span>Chọn phương án phán đoán của bạn:</span>
              {isAnswered && (
                <span className={`text-[11px] font-bold flex items-center gap-1 ${
                  isCorrect ? 'text-emerald-600' : 'text-amber-700'
                }`}>
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Chính xác tuyệt vời!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Chưa chuẩn xác, xem giải thích bên dưới</span>
                    </>
                  )}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedOpt === idx;
                const isCorrectOption = idx === currentQ.correctOptionIndex;

                let stateClasses = 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50/80';
                if (isAnswered) {
                  if (isCorrectOption) {
                    stateClasses = 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-semibold ring-1 ring-emerald-400';
                  } else if (isSelected && !isCorrectOption) {
                    stateClasses = 'border-rose-400 bg-rose-50/60 text-rose-900 line-through';
                  } else {
                    stateClasses = 'border-gray-200 bg-gray-50/50 text-gray-400 opacity-70';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(currentQ.id, idx)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 ${stateClasses}`}
                  >
                    <span className="w-5 h-5 rounded-md border flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 bg-white shadow-2xs">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 leading-relaxed">{option}</span>
                    {isAnswered && isCorrectOption && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reveal Toggle if not yet answered */}
          {!isAnswered && (
            <div className="flex items-center justify-center pt-1">
              <button
                type="button"
                onClick={() => handleToggleReveal(currentQ.id)}
                className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-orange-500" />
                <span>{isRevealed ? 'Ẩn lời giải' : 'Xem ngay lời giải & Bật mí bí mật'}</span>
              </button>
            </div>
          )}

          {/* Revealed Secret & Explanation Box */}
          {isRevealed && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-orange-50/30 border border-orange-200/60 space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-bold text-gray-900 border-b border-gray-200/70 pb-1.5">
                <span className="flex items-center gap-1.5 text-orange-700">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  <span>Bí mật tác phẩm & Lời giải đáp:</span>
                </span>
                <span className="text-[10px] text-gray-400 font-normal">
                  {provider}
                </span>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed">
                {currentQ.answerExplanation}
              </p>

              {currentQ.funFactOrQuote && (
                <div className="pt-1.5 border-t border-gray-200/50 flex items-start gap-2 text-[11px] text-[#6C63FF] font-medium italic">
                  <span className="font-bold shrink-0 not-italic">💡 Điểm chạm tâm đắc:</span>
                  <span>{currentQ.funFactOrQuote}</span>
                </div>
              )}

              {/* Action Button: Ask Gemini AI to analyze deeper */}
              <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onAskGemini(`Hãy giải thích và phân tích sâu sắc cho tôi về bí mật: "${currentQ.question}". Ý nghĩa thực sự là gì?`);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Bot className="w-3.5 h-3.5 text-orange-400" />
                  <span>Hỏi Chatbot Gemini phân tích sâu chi tiết này</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Carousel Footer Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Câu hỏi trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1 px-1">
                {curiosities.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => setCurrentIndex(dotIdx)}
                    className={`h-1.5 rounded-full transition-all ${
                      dotIdx === currentIndex ? 'w-5 bg-gray-900' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Đi tới câu ${dotIdx + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Câu hỏi tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="text-xs font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-1"
            >
              <span>Khám phá câu tiếp</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
