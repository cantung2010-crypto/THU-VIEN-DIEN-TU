import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Flame,
  ArrowRight,
  Filter,
  Check,
  Brain,
  Layers,
  Lightbulb,
  BookOpen,
  Volume2,
  VolumeX,
  Send,
} from 'lucide-react';
import {
  MULTIPLE_CHOICE_QUIZZES,
  TRUE_FALSE_QUIZZES,
  MATCHING_QUIZZES,
  FILL_BLANK_QUIZZES,
  ALL_QUIZZES,
} from '../data/interactiveQuizzes.js';
import {
  UniversalQuiz,
  MultipleChoiceQuiz,
  TrueFalseQuiz,
  MatchingQuiz,
  FillBlankQuiz,
  Book,
} from '../types.js';

interface QuizLearningHubProps {
  books?: Book[];
  onSelectBook?: (book: Book) => void;
  onOpenGeminiWithPrompt?: (prompt: string, bookTitle?: string) => void;
  initialBookId?: string;
  onClose?: () => void;
}

type FilterMode = 'all' | 'multiple_choice' | 'true_false' | 'matching' | 'fill_blank';

export const QuizLearningHub: React.FC<QuizLearningHubProps> = ({
  books = [],
  onSelectBook,
  onOpenGeminiWithPrompt,
  initialBookId,
  onClose,
}) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBookFilter, setSelectedBookFilter] = useState<string>(initialBookId || 'all');

  // Gameplay state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showClue, setShowClue] = useState(false);

  // For Multiple Choice & True/False & Fill In Blank
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [selectedTFAnswer, setSelectedTFAnswer] = useState<boolean | null>(null);
  const [fillBlankInput, setFillBlankInput] = useState('');
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  // For Matching Challenge
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [matchingErrorPair, setMatchingErrorPair] = useState<{ left: string; right: string } | null>(null);

  // Sound feedback toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    ALL_QUIZZES.forEach((q) => {
      if (q.category) set.add(q.category);
    });
    return Array.from(set);
  }, []);

  // Filtered quizzes list
  const filteredQuizzes = useMemo(() => {
    return ALL_QUIZZES.filter((q) => {
      // Mode filter
      if (filterMode !== 'all' && q.type !== filterMode) return false;
      // Category filter
      if (selectedCategory !== 'all' && q.category !== selectedCategory) return false;
      // Book filter
      if (selectedBookFilter !== 'all' && q.bookId !== selectedBookFilter) return false;
      return true;
    });
  }, [filterMode, selectedCategory, selectedBookFilter]);

  const activeQuiz: UniversalQuiz | undefined = filteredQuizzes[currentIndex % (filteredQuizzes.length || 1)];

  // Helper to play short audio feedback using Web Audio API
  const playSound = (isSuccess: boolean) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      if (isSuccess) {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(320, audioCtx.currentTime);
        osc.frequency.setValueAtTime(220, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      }
    } catch {
      // Ignore audio failure if restricted
    }
  };

  // Multiple Choice click handler
  const handleSelectMCOption = (index: number) => {
    if (isAnswerSubmitted || !activeQuiz || activeQuiz.type !== 'multiple_choice') return;
    setSelectedAnswerIndex(index);
    setIsAnswerSubmitted(true);
    const isCorrect = index === activeQuiz.correctIndex;
    if (isCorrect) {
      setScore((s) => s + 10 + streak * 2);
      setStreak((st) => st + 1);
      playSound(true);
    } else {
      setStreak(0);
      playSound(false);
    }
  };

  // True/False click handler
  const handleSelectTF = (val: boolean) => {
    if (isAnswerSubmitted || !activeQuiz || activeQuiz.type !== 'true_false') return;
    setSelectedTFAnswer(val);
    setIsAnswerSubmitted(true);
    const isCorrect = val === activeQuiz.isTrue;
    if (isCorrect) {
      setScore((s) => s + 10 + streak * 2);
      setStreak((st) => st + 1);
      playSound(true);
    } else {
      setStreak(0);
      playSound(false);
    }
  };

  // Matching click handlers
  const handleSelectLeftMatching = (pairId: string) => {
    if (matchedPairIds.includes(pairId)) return;
    setSelectedLeftId(pairId);
    setMatchingErrorPair(null);
  };

  const handleSelectRightMatching = (pairId: string) => {
    if (matchedPairIds.includes(pairId) || !selectedLeftId) return;

    if (selectedLeftId === pairId) {
      // Correct match!
      const newMatched = [...matchedPairIds, pairId];
      setMatchedPairIds(newMatched);
      setSelectedLeftId(null);
      playSound(true);
      setScore((s) => s + 15);

      if (activeQuiz && activeQuiz.type === 'matching' && newMatched.length === activeQuiz.pairs.length) {
        setStreak((st) => st + 1);
      }
    } else {
      // Wrong match
      setMatchingErrorPair({ left: selectedLeftId, right: pairId });
      playSound(false);
      setTimeout(() => {
        setMatchingErrorPair(null);
        setSelectedLeftId(null);
      }, 700);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswerIndex(null);
    setSelectedTFAnswer(null);
    setIsAnswerSubmitted(false);
    setShowClue(false);
    setSelectedLeftId(null);
    setMatchedPairIds([]);
    setMatchingErrorPair(null);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleResetChallenge = () => {
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setSelectedAnswerIndex(null);
    setSelectedTFAnswer(null);
    setIsAnswerSubmitted(false);
    setShowClue(false);
    setSelectedLeftId(null);
    setMatchedPairIds([]);
  };

  // Find matching book object if user wants to view book details
  const currentBookObj = books.find((b) => b.id === activeQuiz?.bookId);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* Top Banner & Header */}
      <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-purple-500/10 border-b border-gray-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  Đấu Trường Tri Thức & Thử Thách Sách
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-900 border border-amber-300">
                  Học Tập Tương Tác
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Trắc nghiệm hình ảnh, câu hỏi Đúng/Sai và thử thách ghép nối cặp đôi tri thức sinh động
              </p>
            </div>
          </div>

          {/* Controls: Score, Streak, Sound, Close */}
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-900 shadow-2xs">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>{score} điểm</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-200 rounded-lg text-xs font-bold text-orange-900 shadow-2xs">
              <Flame className="w-4 h-4 text-orange-600" />
              <span>Chuỗi: {streak} 🔥</span>
            </div>

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
              title={soundEnabled ? 'Tắt âm thanh phản hồi' : 'Bật âm thanh phản hồi'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                Đóng
              </button>
            )}
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="mt-4 pt-3 border-t border-amber-200/50 flex flex-wrap items-center justify-between gap-2.5">
          {/* Modes */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => {
                setFilterMode('all');
                handleNextQuestion();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                filterMode === 'all'
                  ? 'bg-gray-900 text-white border-gray-900 shadow-2xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tất cả ({ALL_QUIZZES.length})</span>
            </button>

            <button
              onClick={() => {
                setFilterMode('multiple_choice');
                handleNextQuestion();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                filterMode === 'multiple_choice'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Trắc nghiệm 4 đáp án ({MULTIPLE_CHOICE_QUIZZES.length})</span>
            </button>

            <button
              onClick={() => {
                setFilterMode('true_false');
                handleNextQuestion();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                filterMode === 'true_false'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đúng / Sai nhanh ({TRUE_FALSE_QUIZZES.length})</span>
            </button>

            <button
              onClick={() => {
                setFilterMode('matching');
                handleNextQuestion();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                filterMode === 'matching'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ghép nối cặp đôi ({MATCHING_QUIZZES.length})</span>
            </button>
          </div>

          {/* Category / Book Filter */}
          <div className="flex items-center gap-2 ml-auto">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                handleNextQuestion();
              }}
              className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-gray-700 font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">Tất cả chủ đề</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Quiz Area */}
      <div className="p-4 sm:p-6 flex-1 bg-gray-50/50">
        {filteredQuizzes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
            <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-800">Không có câu hỏi phù hợp bộ lọc này</p>
            <p className="text-xs text-gray-500 mt-1">Hãy bấm "Tất cả" hoặc chọn chủ đề khác.</p>
            <button
              onClick={() => {
                setFilterMode('all');
                setSelectedCategory('all');
                setSelectedBookFilter('all');
              }}
              className="mt-3 px-3.5 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-semibold"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : !activeQuiz ? null : (
          <div className="max-w-3xl mx-auto space-y-5">
            {/* Progress Indicator */}
            <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>
                  Thử thách {(currentIndex % filteredQuizzes.length) + 1} / {filteredQuizzes.length}
                </span>
                {activeQuiz.bookTitle && (
                  <span className="text-gray-400">· Sách: {activeQuiz.bookTitle}</span>
                )}
              </span>

              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[11px] font-semibold">
                {activeQuiz.type === 'multiple_choice'
                  ? 'Trắc nghiệm 4 đáp án'
                  : activeQuiz.type === 'true_false'
                  ? 'Câu hỏi Đúng / Sai'
                  : 'Trò chơi ghép nối'}
              </span>
            </div>

            {/* ================= MODE 1: MULTIPLE CHOICE ================= */}
            {activeQuiz.type === 'multiple_choice' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs space-y-4">
                {/* Vivid Question Image */}
                <div className="relative rounded-xl overflow-hidden aspect-21/9 max-h-56 w-full border border-gray-100 shadow-2xs group">
                  <img
                    src={activeQuiz.imageUrl}
                    alt={activeQuiz.question}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {activeQuiz.imageCaption && (
                    <div className="absolute bottom-2.5 left-3 right-3 text-[11px] sm:text-xs text-white/90 font-medium line-clamp-1 italic">
                      📷 {activeQuiz.imageCaption}
                    </div>
                  )}
                  <span className="absolute top-2.5 left-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-amber-300 text-[10px] font-bold">
                    {activeQuiz.category}
                  </span>
                </div>

                {/* Question text */}
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                    {activeQuiz.question}
                  </h3>

                  {/* Clue button */}
                  {activeQuiz.clue && (
                    <div>
                      {!showClue ? (
                        <button
                          type="button"
                          onClick={() => setShowClue(true)}
                          className="inline-flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-800 font-semibold bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md transition-colors"
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                          <span>Mở gợi ý manh mối</span>
                        </button>
                      ) : (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 animate-in fade-in">
                          <span className="font-bold mr-1">💡 Manh mối:</span>
                          <span>{activeQuiz.clue}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 4 Interactive Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {activeQuiz.options.map((opt, idx) => {
                    const isSelected = selectedAnswerIndex === idx;
                    const isCorrect = idx === activeQuiz.correctIndex;
                    let btnStyle = 'border-gray-200 hover:border-amber-400 hover:bg-amber-50/40 text-gray-800 bg-white';

                    if (isAnswerSubmitted) {
                      if (isCorrect) {
                        btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-2xs';
                      } else if (isSelected) {
                        btnStyle = 'border-red-400 bg-red-50 text-red-900';
                      } else {
                        btnStyle = 'border-gray-100 bg-gray-50/60 text-gray-400 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isAnswerSubmitted}
                        onClick={() => handleSelectMCOption(idx)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all duration-150 flex items-start gap-2.5 ${btnStyle}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 ${
                            isAnswerSubmitted && isCorrect
                              ? 'bg-emerald-600 text-white'
                              : isAnswerSubmitted && isSelected
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1 leading-relaxed">{opt}</span>
                        {isAnswerSubmitted && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                        )}
                        {isAnswerSubmitted && isSelected && !isCorrect && (
                          <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Feedback Box */}
                {isAnswerSubmitted && (
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-amber-50/70 to-orange-50/70 border border-amber-200 animate-in fade-in space-y-3">
                    <div className="flex items-center gap-2">
                      {selectedAnswerIndex === activeQuiz.correctIndex ? (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Chính xác hoàn toàn! (+10 điểm)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-red-700 font-bold text-sm">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span>Chưa chính xác! Đáp án đúng là {String.fromCharCode(65 + activeQuiz.correctIndex)}.</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-700 leading-relaxed bg-white/80 p-3 rounded-lg border border-amber-100">
                      <span className="font-bold text-gray-900 block mb-1">📖 Lời giải chi tiết:</span>
                      {activeQuiz.explanation}
                    </div>

                    {activeQuiz.didYouKnow && (
                      <div className="text-xs text-amber-900 bg-amber-100/60 p-2.5 rounded-lg font-medium italic">
                        ⭐ {activeQuiz.didYouKnow}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      {onOpenGeminiWithPrompt && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenGeminiWithPrompt(
                              `Hãy phân tích chi tiết câu hỏi này trong tác phẩm "${activeQuiz.bookTitle || ''}": "${activeQuiz.question}" và giải thích sâu hơn ý nghĩa nhân văn/khoa học đằng sau.`,
                              activeQuiz.bookTitle
                            );
                          }}
                          className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Hỏi Chatbot Gemini phân tích sâu câu này</span>
                        </button>
                      )}

                      {currentBookObj && onSelectBook && (
                        <button
                          type="button"
                          onClick={() => onSelectBook(currentBookObj)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-gray-600" />
                          <span>Xem chi tiết cuốn sách</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        className="ml-auto px-4 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <span>Câu hỏi tiếp theo</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= MODE 2: TRUE / FALSE ================= */}
            {activeQuiz.type === 'true_false' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs space-y-4">
                {/* Vivid Image */}
                <div className="relative rounded-xl overflow-hidden aspect-21/9 max-h-56 w-full border border-gray-100 shadow-2xs group">
                  <img
                    src={activeQuiz.imageUrl}
                    alt="Khám phá đúng sai"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                  {activeQuiz.imageCaption && (
                    <div className="absolute bottom-2.5 left-3 right-3 text-[11px] sm:text-xs text-white/90 font-medium line-clamp-1 italic">
                      📷 {activeQuiz.imageCaption}
                    </div>
                  )}
                  <span className="absolute top-2.5 left-3 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold">
                    {activeQuiz.category}
                  </span>
                </div>

                {/* Statement Banner */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                    Nhận định sau đây ĐÚNG hay SAI?
                  </span>
                  <p className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                    "{activeQuiz.statement}"
                  </p>
                  {activeQuiz.clue && (
                    <div className="text-xs text-gray-500 italic pt-1">
                      💡 Gợi ý: {activeQuiz.clue}
                    </div>
                  )}
                </div>

                {/* True / False Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    disabled={isAnswerSubmitted}
                    onClick={() => handleSelectTF(true)}
                    className={`py-4 px-4 rounded-xl border text-sm sm:text-base font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isAnswerSubmitted
                        ? activeQuiz.isTrue
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-md scale-102'
                          : selectedTFAnswer === true
                          ? 'bg-red-500 text-white border-red-600'
                          : 'bg-gray-100 text-gray-400 border-gray-200 opacity-50'
                        : 'bg-white hover:bg-emerald-50 hover:border-emerald-400 text-gray-800 border-gray-200 active:scale-98'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>✓ ĐÚNG</span>
                  </button>

                  <button
                    type="button"
                    disabled={isAnswerSubmitted}
                    onClick={() => handleSelectTF(false)}
                    className={`py-4 px-4 rounded-xl border text-sm sm:text-base font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isAnswerSubmitted
                        ? !activeQuiz.isTrue
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-md scale-102'
                          : selectedTFAnswer === false
                          ? 'bg-red-500 text-white border-red-600'
                          : 'bg-gray-100 text-gray-400 border-gray-200 opacity-50'
                        : 'bg-white hover:bg-red-50 hover:border-red-400 text-gray-800 border-gray-200 active:scale-98'
                    }`}
                  >
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span>✕ SAI</span>
                  </button>
                </div>

                {/* Feedback Box */}
                {isAnswerSubmitted && (
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-emerald-50/70 to-teal-50/70 border border-emerald-200 animate-in fade-in space-y-3">
                    <div className="flex items-center gap-2">
                      {selectedTFAnswer === activeQuiz.isTrue ? (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Xuất sắc! Bạn đã phán đoán hoàn toàn chính xác (+10 điểm).</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-red-700 font-bold text-sm">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span>Rất tiếc! Nhận định này thực chất là: {activeQuiz.isTrue ? 'ĐÚNG' : 'SAI'}.</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-700 leading-relaxed bg-white/80 p-3 rounded-lg border border-emerald-100">
                      <span className="font-bold text-gray-900 block mb-1">💡 Bản chất khoa học / văn học:</span>
                      {activeQuiz.explanation}
                    </div>

                    {activeQuiz.didYouKnow && (
                      <div className="text-xs text-teal-900 bg-teal-100/60 p-2.5 rounded-lg font-medium italic">
                        ⭐ {activeQuiz.didYouKnow}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1">
                      {onOpenGeminiWithPrompt && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenGeminiWithPrompt(
                              `Phân tích nhận định sau: "${activeQuiz.statement}". Tại sao thực tế lại là ${activeQuiz.isTrue ? 'Đúng' : 'Sai'}?`,
                              activeQuiz.bookTitle
                            );
                          }}
                          className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Hỏi Gemini phân tích sâu</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        className="ml-auto px-4 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <span>Câu hỏi tiếp theo</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= MODE 3: MATCHING CHALLENGE ================= */}
            {activeQuiz.type === 'matching' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs space-y-4">
                {/* Title and instructions */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">
                      {activeQuiz.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {activeQuiz.instruction}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-bold shrink-0">
                    Đã nối {matchedPairIds.length} / {activeQuiz.pairs.length}
                  </span>
                </div>

                {/* Progress banner */}
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-purple-600 h-full transition-all duration-300"
                    style={{
                      width: `${(matchedPairIds.length / activeQuiz.pairs.length) * 100}%`,
                    }}
                  />
                </div>

                {/* Two Columns Interactive Match Board */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Column A (Left items) */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                      Cột A: Nhân vật / Khái niệm
                    </span>
                    {activeQuiz.pairs.map((p) => {
                      const isMatched = matchedPairIds.includes(p.id);
                      const isSelected = selectedLeftId === p.id;
                      const isError = matchingErrorPair?.left === p.id;

                      let style = 'bg-white border-gray-200 hover:border-purple-400 hover:bg-purple-50/40 text-gray-800';
                      if (isMatched) {
                        style = 'bg-emerald-50 border-emerald-400 text-emerald-900 opacity-90 shadow-2xs cursor-default';
                      } else if (isError) {
                        style = 'bg-red-50 border-red-400 text-red-900 animate-shake';
                      } else if (isSelected) {
                        style = 'bg-purple-50 border-purple-600 text-purple-950 font-bold ring-2 ring-purple-200 shadow-sm';
                      }

                      return (
                        <button
                          key={p.id}
                          type="button"
                          disabled={isMatched}
                          onClick={() => handleSelectLeftMatching(p.id)}
                          className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between gap-2 cursor-pointer ${style}`}
                        >
                          <div>
                            <div className="font-bold">{p.leftText}</div>
                            {p.leftSubtitle && (
                              <div className="text-[11px] text-gray-500 mt-0.5">{p.leftSubtitle}</div>
                            )}
                          </div>
                          {isMatched && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                          {!isMatched && isSelected && (
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Column B (Right items) */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                      Cột B: Tác phẩm / Ý nghĩa tương ứng
                    </span>
                    {activeQuiz.pairs.map((p) => {
                      const isMatched = matchedPairIds.includes(p.id);
                      const isError = matchingErrorPair?.right === p.id;

                      let style = 'bg-white border-gray-200 hover:border-purple-400 hover:bg-purple-50/40 text-gray-800';
                      if (isMatched) {
                        style = 'bg-emerald-50 border-emerald-400 text-emerald-900 opacity-90 shadow-2xs cursor-default';
                      } else if (isError) {
                        style = 'bg-red-50 border-red-400 text-red-900 animate-shake';
                      }

                      return (
                        <button
                          key={p.id}
                          type="button"
                          disabled={isMatched}
                          onClick={() => handleSelectRightMatching(p.id)}
                          className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between gap-2 cursor-pointer ${style}`}
                        >
                          <div>
                            <div className="font-bold">{p.rightText}</div>
                            {p.rightSubtitle && (
                              <div className="text-[11px] text-gray-500 mt-0.5">{p.rightSubtitle}</div>
                            )}
                          </div>
                          {isMatched && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Victory Completion Banner */}
                {matchedPairIds.length === activeQuiz.pairs.length && (
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 via-emerald-50 to-amber-50 border border-purple-200 animate-in fade-in space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <span>Tuyệt đỉnh! Bạn đã ghép đúng toàn bộ các cặp tri thức (+{activeQuiz.pairs.length * 15} điểm)!</span>
                    </div>

                    <p className="text-xs text-gray-700 leading-relaxed">
                      {activeQuiz.explanation}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMatchedPairIds([]);
                          setSelectedLeftId(null);
                        }}
                        className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Chơi lại màn này</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        className="px-4 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <span>Thử thách kế tiếp</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleResetChallenge}
                className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Bắt đầu lại từ đầu</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0))}
                  disabled={currentIndex === 0}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                >
                  Câu trước
                </button>
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="px-3.5 py-1.5 text-xs font-bold text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                >
                  <span>Bỏ qua / Tiếp tục</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
