import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Trophy,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Flame,
  ArrowRight,
  Brain,
  Layers,
  Lightbulb,
  BookOpen,
  Volume2,
  VolumeX,
  Dices,
  Shuffle,
  Wand2,
  Quote,
  Users,
  Compass,
  Zap,
  Timer,
  Pause,
  Play,
  Award,
  Star,
  Send,
  Check,
  Filter,
  CheckCheck,
  Key,
  Lock,
  Unlock,
  Search,
} from 'lucide-react';
import {
  Book,
  UniversalQuiz,
  MultipleChoiceQuiz,
  TrueFalseQuiz,
  MatchingQuiz,
  FillBlankQuiz,
  CrosswordQuiz,
  MediaAnalysisQuiz,
} from '../types.js';
import { getCuriositiesForBook } from '../data/bookCuriosities.js';
import { getEnrichedBookDetails } from '../data/bookDetailedInsights.js';
import { ALL_QUIZZES } from '../data/interactiveQuizzes.js';
import { buildTenQuestionMasterDeck } from '../data/bookMasterQuizDeck.js';

interface BookQuizModalProps {
  book: Book;
  onClose: () => void;
  onOpenBookDetails?: (book: Book) => void;
}

interface FloatingParticle {
  id: number;
  x: number; // percentage
  y: number; // percentage
  motif: 'butterfly' | 'star' | 'feather' | 'flower' | 'sparkle' | 'scroll';
  emoji: string;
  size: number;
  delay: number;
  duration: number;
}

// Record for the final comprehensive summary
export interface QuestionAnswerHistory {
  quizId: string;
  index: number;
  question: string;
  type: UniversalQuiz['type'];
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  evidence: string;
  category: string;
  didYouKnow?: string;
  clue?: string;
}

// Helper to shuffle multiple-choice options so the correct answer is never predictable by position
export const shuffleQuizOptions = (quiz: UniversalQuiz): UniversalQuiz => {
  if (quiz.type !== 'multiple_choice') return quiz;
  const mc = quiz as MultipleChoiceQuiz;
  if (!mc.options || mc.options.length < 2) return quiz;

  const items = mc.options.map((opt, i) => ({ opt, isCorrect: i === mc.correctIndex }));
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return {
    ...mc,
    options: items.map((it) => it.opt),
    correctIndex: Math.max(0, items.findIndex((it) => it.isCorrect)),
  };
};

export const BookQuizModal: React.FC<BookQuizModalProps> = ({
  book,
  onClose,
  onOpenBookDetails,
}) => {
  // Grounded insight data for this book
  const insightData = useMemo(() => getEnrichedBookDetails(book), [book]);

  // Helper to extract evidence from a quiz item or book context
  const getQuizEvidence = (quiz: UniversalQuiz): string => {
    if ('evidence' in quiz && quiz.evidence) {
      return quiz.evidence;
    }
    if ('didYouKnow' in quiz && quiz.didYouKnow) {
      return `Dẫn chứng & Tư liệu mở rộng: ${quiz.didYouKnow}`;
    }
    return `Trích xuất từ nội dung và tư tưởng cốt lõi tác phẩm "${book.title}" (Tác giả: ${book.author}).`;
  };

  // Curated 10-question master challenge deck combining 7 diverse formats:
  // 1. Media Analysis / Visual Detective (AI nhận diện tư liệu hình ảnh / Google Media)
  // 2. Crossword Matrix (Ô chữ ma trận hàng ngang & Cụm từ khóa tổng)
  // 3. Multiple Choice Paradox (Nghịch lý triết học với 4 phương án cân bằng)
  // 4. True/False Dialectic (Thử thách phản biện Đúng/Sai)
  // 5. Famous Quote Decryption (Giải mã phát ngôn để đời)
  // 6. Symbolic Concept Matching (Ghép nối biểu tượng & nhân sinh)
  // 7. Philosophical Fill-in-the-Blank (Điền từ khuyết triết lý)
  // 8. Academic Critique & Counter-intuitive Deduction (Thám tử phê bình văn học)
  // 9. Hypothetical Moral Dilemma (Tình huống giả định đạo đức)
  // 10. Cognitive Transformation & Modern Praxis (Soi chiếu thời đại)
  const baseQuestions = useMemo(() => {
    const masterDeck = buildTenQuestionMasterDeck(book);
    return masterDeck.map(shuffleQuizOptions);
  }, [book]);

  // Questions deck state
  const [questions, setQuestions] = useState<UniversalQuiz[]>(() => {
    return [...baseQuestions];
  });
  const [currentIdx, setCurrentIdx] = useState(0);

  // Sync questions whenever baseQuestions updates
  useEffect(() => {
    if (baseQuestions && baseQuestions.length > 0) {
      setQuestions([...baseQuestions]);
      setCurrentIdx(0);
      setQuizPhase('welcome');
      resetQuestionState();
    }
  }, [baseQuestions]);

  // Reset to welcome screen when mounted or book changes
  useEffect(() => {
    setQuizPhase('welcome');
    setCurrentIdx(0);
    resetQuestionState();
    setScore(0);
    setStreak(0);
    setAnsweredHistory([]);
  }, [book.id]);

  // Score & streaks
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showClue, setShowClue] = useState(false);

  // Answers & submission states
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [selectedTFAnswer, setSelectedTFAnswer] = useState<boolean | null>(null);
  const [fillBlankInput, setFillBlankInput] = useState('');
  const [lastUserAnswerText, setLastUserAnswerText] = useState('');
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);

  // Matching game state
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [matchingErrorPair, setMatchingErrorPair] = useState<{ left: string; right: string } | null>(null);

  // Crossword matrix game state
  const [solvedCrosswordRows, setSolvedCrosswordRows] = useState<Record<string, string>>({});
  const [activeCrosswordRowId, setActiveCrosswordRowId] = useState<string | null>(null);
  const [crosswordRowInput, setCrosswordRowInput] = useState('');
  const [crosswordRowError, setCrosswordRowError] = useState<string | null>(null);
  const [masterKeywordInput, setMasterKeywordInput] = useState('');
  const [masterKeywordError, setMasterKeywordError] = useState<string | null>(null);
  const [showMasterClue, setShowMasterClue] = useState(false);

  // Quiz flow phase: 'welcome' ("BẠN CÓ SẴN SÀNG THAM GIA KHÔNG?") -> 'playing' (30s timer, long review break with evidence) -> 'completed' (grand summary)
  const [quizPhase, setQuizPhase] = useState<'welcome' | 'playing' | 'completed'>('welcome');

  // Long review timer states (giving the reader sufficient time to learn reasons & evidence)
  const [reviewTimerSeconds, setReviewTimerSeconds] = useState(30); // 30 seconds long duration
  const [isReviewPaused, setIsReviewPaused] = useState(false);
  const [thinkingTimerSeconds, setThinkingTimerSeconds] = useState(30); // 30 seconds per question
  const [isThinkingPaused, setIsThinkingPaused] = useState(false);

  // Comprehensive post-quiz summary history
  const [answeredHistory, setAnsweredHistory] = useState<QuestionAnswerHistory[]>([]);
  const isQuizCompleted = quizPhase === 'completed';
  const setIsQuizCompleted = (completed: boolean) => setQuizPhase(completed ? 'completed' : 'playing');
  const [summaryFilter, setSummaryFilter] = useState<'all' | 'correct' | 'incorrect'>('all');

  // AI Generation State
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiProviderTag, setAiProviderTag] = useState<string | null>(null);

  // Sound feedback toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Surprise floating motifs elements
  const [floatingParticles, setFloatingParticles] = useState<FloatingParticle[]>([]);
  const [floatingBonusText, setFloatingBonusText] = useState<{ text: string; id: number } | null>(null);

  // Surprise Lore Milestone
  const [showSurpriseModal, setShowSurpriseModal] = useState(false);
  const [surpriseBonusMilestone, setSurpriseBonusMilestone] = useState<{
    title: string;
    quote: string;
    author: string;
    pointsBonus: number;
  } | null>(null);

  // Current active question
  const activeQuiz = questions && questions.length > 0 ? questions[currentIdx % questions.length] : null;

  // Sound Synthesizer via Web Audio API
  const playChime = (type: 'success' | 'fail' | 'ai' | 'surprise') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.24);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === 'fail') {
        osc.frequency.setValueAtTime(329.63, ctx.currentTime);
        osc.frequency.setValueAtTime(261.63, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'surprise') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
        osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.24);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } else if (type === 'ai') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.setValueAtTime(900, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // Audio might be muted or blocked by browser policy
    }
  };

  // Launch surprise flying motifs & particles
  const triggerSurpriseMotifs = (isCorrect: boolean) => {
    const emojis = isCorrect
      ? ['🦋', '✨', '🌟', '🕊️', '🌸', '📜', '💫', '🌿', '💎']
      : ['❓', '🍃', '💡', '📖', '✨'];

    const newParticles: FloatingParticle[] = [];
    const count = isCorrect ? 14 : 6;

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Date.now() + i + Math.random(),
        x: Math.floor(Math.random() * 86) + 7,
        y: Math.floor(Math.random() * 40) + 40,
        motif: 'butterfly',
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        size: Math.floor(Math.random() * 16) + 20,
        delay: Math.random() * 0.4,
        duration: Math.random() * 1.2 + 1.8,
      });
    }

    setFloatingParticles(newParticles);

    if (isCorrect) {
      const compliments = [
        '+15 Điểm! Chuẩn Xác 🌟',
        'Bậc Thầy Tri Thức! ✨',
        'Chuỗi Thắng Bùng Nổ! 🔥',
        'Cực Kỳ Tinh Tế! 💫',
        'Đúng Xuất Thần! 🎯',
      ];
      const banner = compliments[Math.floor(Math.random() * compliments.length)];
      setFloatingBonusText({ text: banner, id: Date.now() });

      setTimeout(() => {
        setFloatingBonusText(null);
      }, 2500);
    }

    setTimeout(() => {
      setFloatingParticles([]);
    }, 2800);
  };

  // Milestone surprise lore checker
  const checkMilestoneSurprise = (newStreak: number, newScore: number) => {
    if (newStreak === 3 || newStreak === 6 || (newScore >= 60 && !surpriseBonusMilestone)) {
      const surpriseDrop = {
        title: `BẬT MÍ KHO BÁU TRI THỨC: ${book.title}`,
        quote:
          insightData?.authorDetails?.famousQuote ||
          book.message ||
          'Tri thức là ánh sáng duy nhất xua tan bóng tối của sự vô tri.',
        author: book.author,
        pointsBonus: 30,
      };
      setSurpriseBonusMilestone(surpriseDrop);
      setShowSurpriseModal(true);
      playChime('surprise');
      setScore((s) => s + 30);
    }
  };

  // Helper to get formatted correct answer text for any quiz type
  const getQuizCorrectAnswer = (quiz: UniversalQuiz): string => {
    if (quiz.type === 'multiple_choice') {
      const mc = quiz as MultipleChoiceQuiz;
      return `${String.fromCharCode(65 + mc.correctIndex)}. ${mc.options[mc.correctIndex] || ''}`;
    }
    if (quiz.type === 'media_analysis') {
      const ma = quiz as MediaAnalysisQuiz;
      return `${String.fromCharCode(65 + ma.correctIndex)}. ${ma.options[ma.correctIndex] || ''}`;
    }
    if (quiz.type === 'crossword') {
      const cw = quiz as CrosswordQuiz;
      return `Cụm từ khóa tổng: "${cw.masterKeyword}"`;
    }
    if (quiz.type === 'true_false') {
      const tf = quiz as TrueFalseQuiz;
      return tf.isTrue ? '✓ ĐÚNG (Nhận định này chính xác)' : '✗ SAI (Nhận định này không đúng)';
    }
    if (quiz.type === 'fill_blank') {
      const fb = quiz as FillBlankQuiz;
      return fb.acceptedAnswers[0] || 'Đáp án mẫu';
    }
    if (quiz.type === 'matching') {
      return 'Ghép chính xác tất cả các cặp tương ứng';
    }
    return '';
  };

  // Helper to get formatted question text
  const getQuizQuestionTitle = (quiz: UniversalQuiz): string => {
    if (quiz.type === 'multiple_choice') return (quiz as MultipleChoiceQuiz).question;
    if (quiz.type === 'media_analysis') return (quiz as MediaAnalysisQuiz).question;
    if (quiz.type === 'crossword') return (quiz as CrosswordQuiz).title;
    if (quiz.type === 'true_false') return (quiz as TrueFalseQuiz).statement;
    if (quiz.type === 'fill_blank') return (quiz as FillBlankQuiz).question;
    if (quiz.type === 'matching') return (quiz as MatchingQuiz).title;
    return '';
  };

  // Record answered item into history
  const recordAnswerToHistory = (
    quiz: UniversalQuiz,
    userAns: string,
    isCorrect: boolean
  ) => {
    const historyItem: QuestionAnswerHistory = {
      quizId: quiz.id,
      index: currentIdx + 1,
      question: getQuizQuestionTitle(quiz),
      type: quiz.type,
      userAnswer: userAns,
      correctAnswer: getQuizCorrectAnswer(quiz),
      isCorrect,
      explanation: quiz.explanation || 'Lời giải thích được đúc kết từ tác phẩm.',
      evidence: getQuizEvidence(quiz),
      category: quiz.category,
      didYouKnow: 'didYouKnow' in quiz ? quiz.didYouKnow : undefined,
      clue: 'clue' in quiz ? (quiz as any).clue : undefined,
    };

    setAnsweredHistory((prev) => {
      const filtered = prev.filter((item) => item.quizId !== quiz.id);
      return [...filtered, historyItem];
    });
  };

  // 1. Handle Multiple Choice submission
  const handleSelectMCOption = (idx: number) => {
    if (isAnswerSubmitted || !activeQuiz || activeQuiz.type !== 'multiple_choice') return;
    setSelectedAnswerIndex(idx);
    setIsAnswerSubmitted(true);
    const mc = activeQuiz as MultipleChoiceQuiz;
    const isCorrect = idx === mc.correctIndex;
    const userText = idx >= 0 ? `${String.fromCharCode(65 + idx)}. ${mc.options[idx] || ''}` : '(Chưa chọn)';
    setLastUserAnswerText(userText);
    setLastAnswerCorrect(isCorrect);
    setReviewTimerSeconds(30); // Set long duration (30s) to read evidence and reasons
    setIsReviewPaused(false);

    if (isCorrect) {
      const bonus = 15 + streak * 2;
      const newScore = score + bonus;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      playChime('success');
      triggerSurpriseMotifs(true);
      checkMilestoneSurprise(newStreak, newScore);
    } else {
      setStreak(0);
      playChime('fail');
      triggerSurpriseMotifs(false);
    }

    recordAnswerToHistory(activeQuiz, userText, isCorrect);
  };

  // 2. Handle True / False submission
  const handleSelectTF = (val: boolean) => {
    if (isAnswerSubmitted || !activeQuiz || activeQuiz.type !== 'true_false') return;
    setSelectedTFAnswer(val);
    setIsAnswerSubmitted(true);
    const tf = activeQuiz as TrueFalseQuiz;
    const isCorrect = val === tf.isTrue;
    const userText = val ? '✓ ĐÚNG' : '✗ SAI';
    setLastUserAnswerText(userText);
    setLastAnswerCorrect(isCorrect);
    setReviewTimerSeconds(30); // Set long duration (30s) to read evidence and reasons
    setIsReviewPaused(false);

    if (isCorrect) {
      const bonus = 15 + streak * 2;
      const newScore = score + bonus;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      playChime('success');
      triggerSurpriseMotifs(true);
      checkMilestoneSurprise(newStreak, newScore);
    } else {
      setStreak(0);
      playChime('fail');
      triggerSurpriseMotifs(false);
    }

    recordAnswerToHistory(activeQuiz, userText, isCorrect);
  };

  // 3. Handle Fill-in-the-blank submission ("Điền câu hỏi / Điền đáp án")
  const handleSubmitFillBlank = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isAnswerSubmitted || !activeQuiz || activeQuiz.type !== 'fill_blank') return;
    const fb = activeQuiz as FillBlankQuiz;
    const rawInput = fillBlankInput.trim();
    if (!rawInput) return;

    // Normalize for flexible accent and case-tolerant matching
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');

    const normInput = normalize(rawInput);
    const isCorrect = fb.acceptedAnswers.some((ans) => {
      const normAns = normalize(ans);
      return normInput === normAns || (normInput.length >= 3 && normAns.includes(normInput));
    });

    setIsAnswerSubmitted(true);
    setLastUserAnswerText(rawInput);
    setLastAnswerCorrect(isCorrect);
    setReviewTimerSeconds(30); // Set long duration (30s) to read evidence and reasons
    setIsReviewPaused(false);

    if (isCorrect) {
      const bonus = 20 + streak * 3;
      const newScore = score + bonus;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      playChime('success');
      triggerSurpriseMotifs(true);
      checkMilestoneSurprise(newStreak, newScore);
    } else {
      setStreak(0);
      playChime('fail');
      triggerSurpriseMotifs(false);
    }

    recordAnswerToHistory(activeQuiz, rawInput, isCorrect);
  };

  // 4. Handle Matching Challenge
  const handleSelectLeftMatching = (pairId: string) => {
    if (matchedPairIds.includes(pairId)) return;
    setSelectedLeftId(pairId);
    setMatchingErrorPair(null);
  };

  const handleSelectRightMatching = (pairId: string) => {
    if (matchedPairIds.includes(pairId) || !selectedLeftId) return;

    if (selectedLeftId === pairId) {
      const newMatched = [...matchedPairIds, pairId];
      setMatchedPairIds(newMatched);
      setSelectedLeftId(null);
      playChime('success');
      triggerSurpriseMotifs(true);
      setScore((s) => s + 15);

      if (activeQuiz && activeQuiz.type === 'matching' && newMatched.length === activeQuiz.pairs.length) {
        setStreak((st) => st + 1);
        setIsAnswerSubmitted(true);
        setLastAnswerCorrect(true);
        setLastUserAnswerText('Đã ghép nối chính xác toàn bộ các cặp');
        setReviewTimerSeconds(30);
        setIsReviewPaused(false);
        recordAnswerToHistory(activeQuiz, 'Ghép đúng toàn bộ các cặp', true);
      }
    } else {
      setMatchingErrorPair({ left: selectedLeftId, right: pairId });
      playChime('fail');
      setTimeout(() => {
        setMatchingErrorPair(null);
        setSelectedLeftId(null);
      }, 600);
    }
  };

  // 5. Handle Media Analysis option selection
  const handleSelectMediaOption = (idx: number) => {
    if (isAnswerSubmitted || !activeQuiz || activeQuiz.type !== 'media_analysis') return;
    setSelectedAnswerIndex(idx);
    setIsAnswerSubmitted(true);
    const ma = activeQuiz as MediaAnalysisQuiz;
    const isCorrect = idx === ma.correctIndex;
    const userText = idx >= 0 ? `${String.fromCharCode(65 + idx)}. ${ma.options[idx] || ''}` : '(Chưa chọn)';
    setLastUserAnswerText(userText);
    setLastAnswerCorrect(isCorrect);
    setReviewTimerSeconds(30);
    setIsReviewPaused(false);

    if (isCorrect) {
      const bonus = 20 + streak * 2;
      const newScore = score + bonus;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      playChime('success');
      triggerSurpriseMotifs(true);
      checkMilestoneSurprise(newStreak, newScore);
    } else {
      setStreak(0);
      playChime('fail');
      triggerSurpriseMotifs(false);
    }

    recordAnswerToHistory(activeQuiz, userText, isCorrect);
  };

  // Normalizer for accent/whitespace-tolerant word matching in crossword
  const normalizeCrosswordWord = (s: string) =>
    s
      .toUpperCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9]/g, '');

  // 6. Handle solving a specific horizontal row in the crossword matrix
  const handleAnswerCrosswordRow = (rowId: string, expectedAnswer: string) => {
    if (isAnswerSubmitted || !activeQuiz || activeQuiz.type !== 'crossword') return;
    const normInput = normalizeCrosswordWord(crosswordRowInput);
    const normExpected = normalizeCrosswordWord(expectedAnswer);

    if (!normInput) return;

    if (normInput === normExpected) {
      const newSolved = { ...solvedCrosswordRows, [rowId]: expectedAnswer.toUpperCase() };
      setSolvedCrosswordRows(newSolved);
      setCrosswordRowInput('');
      setCrosswordRowError(null);
      setActiveCrosswordRowId(null);
      playChime('success');
      setScore((s) => s + 10);
      triggerSurpriseMotifs(true);

      const cw = activeQuiz as CrosswordQuiz;
      // Check if all rows are now solved
      const allRowsDone = cw.rows.every((r) => !!newSolved[r.id]);
      if (allRowsDone) {
        setIsAnswerSubmitted(true);
        setLastAnswerCorrect(true);
        const userText = `Đã giải toàn bộ ${cw.rows.length} hàng ngang và mở khóa Từ Khóa Tổng: "${cw.masterKeyword}"`;
        setLastUserAnswerText(userText);
        setScore((s) => s + 30);
        setStreak((st) => st + 1);
        setReviewTimerSeconds(30);
        setIsReviewPaused(false);
        playChime('surprise');
        recordAnswerToHistory(activeQuiz, userText, true);
      }
    } else {
      setCrosswordRowError(`Chưa chính xác (Cần ${expectedAnswer.replace(/\s+/g, '').length} chữ cái). Hãy thử lại!`);
      playChime('fail');
    }
  };

  // 7. Handle directly submitting the Master Keyword ("CỤM TỪ KHÓA TỔNG")
  const handleSubmitMasterKeyword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isAnswerSubmitted || !activeQuiz || activeQuiz.type !== 'crossword') return;
    const cw = activeQuiz as CrosswordQuiz;
    const normInput = normalizeCrosswordWord(masterKeywordInput);
    const normMaster = normalizeCrosswordWord(cw.masterKeyword);

    if (!normInput) return;

    if (normInput === normMaster) {
      // Correct Master Keyword! Reveal all rows
      const allSolved: Record<string, string> = {};
      cw.rows.forEach((r) => {
        allSolved[r.id] = r.answer.toUpperCase();
      });
      setSolvedCrosswordRows(allSolved);
      setMasterKeywordError(null);
      setIsAnswerSubmitted(true);
      setLastAnswerCorrect(true);
      const userText = `Giải mã xuất sắc Cụm Từ Khóa Tổng: "${cw.masterKeyword}" (+50 Điểm Thưởng)`;
      setLastUserAnswerText(userText);
      const newScore = score + 50;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      setReviewTimerSeconds(30);
      setIsReviewPaused(false);
      playChime('surprise');
      triggerSurpriseMotifs(true);
      checkMilestoneSurprise(newStreak, newScore);
      recordAnswerToHistory(activeQuiz, userText, true);
    } else {
      setMasterKeywordError('Chưa đúng Cụm Từ Khóa Tổng. Hãy giải thêm các hàng ngang để thu thập chữ cái gợi ý!');
      playChime('fail');
    }
  };

  // Reset states for current question
  const resetQuestionState = () => {
    setSelectedAnswerIndex(null);
    setSelectedTFAnswer(null);
    setFillBlankInput('');
    setLastUserAnswerText('');
    setIsAnswerSubmitted(false);
    setLastAnswerCorrect(null);
    setShowClue(false);
    setSelectedLeftId(null);
    setMatchedPairIds([]);
    setMatchingErrorPair(null);
    setSolvedCrosswordRows({});
    setActiveCrosswordRowId(null);
    setCrosswordRowInput('');
    setCrosswordRowError(null);
    setMasterKeywordInput('');
    setMasterKeywordError(null);
    setShowMasterClue(false);
    setReviewTimerSeconds(30);
    setIsReviewPaused(false);
    setThinkingTimerSeconds(30);
    setIsThinkingPaused(false);
  };

  // Move to next question or complete the quiz
  const handleNextOrFinish = () => {
    if (currentIdx >= questions.length - 1) {
      // Reached the end of the question set -> show comprehensive summary!
      setQuizPhase('completed');
      playChime('surprise');
    } else {
      resetQuestionState();
      setCurrentIdx((prev) => prev + 1);
    }
  };

  // Restart quiz from beginning
  const handleRestartQuiz = () => {
    const shuffled = [...baseQuestions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setAnsweredHistory([]);
    setQuizPhase('welcome');
    setSummaryFilter('all');
    resetQuestionState();
    playChime('surprise');
  };

  // AI Gemini Dynamic Generator
  const handleGenerateAiQuestion = async () => {
    if (isAiGenerating) return;
    setIsAiGenerating(true);
    playChime('ai');

    try {
      const res = await fetch('/api/ai/book-quiz-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        const formattedQuestions = data.questions.map(shuffleQuizOptions);
        setQuestions((prev) => [...formattedQuestions, ...prev]);
        setAiProviderTag(data.provider || 'Google Gemini 3.8 Flash (Grounded Search)');
        setIsQuizCompleted(false);
        resetQuestionState();
        playChime('surprise');
        triggerSurpriseMotifs(true);
      } else {
        handleRestartQuiz();
      }
    } catch (err) {
      console.error('Failed to generate AI questions:', err);
      handleRestartQuiz();
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Long review timer countdown (Only runs when answer is submitted and NOT paused during playing phase)
  useEffect(() => {
    let interval: any = null;
    if (quizPhase === 'playing' && isAnswerSubmitted && !isReviewPaused) {
      interval = setInterval(() => {
        setReviewTimerSeconds((prev) => {
          if (prev <= 1) {
            handleNextOrFinish();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizPhase, isAnswerSubmitted, isReviewPaused, currentIdx, questions.length]);

  // Thinking timer countdown (before answer is submitted, exactly 30s per question)
  useEffect(() => {
    let interval: any = null;
    if (quizPhase === 'playing' && !isAnswerSubmitted && !isThinkingPaused && activeQuiz) {
      interval = setInterval(() => {
        setThinkingTimerSeconds((prev) => {
          if (prev <= 1) {
            // Time is up for answering (30s limit reached)
            if (activeQuiz.type === 'multiple_choice') {
              handleSelectMCOption(-1);
            } else if (activeQuiz.type === 'media_analysis') {
              handleSelectMediaOption(-1);
            } else if (activeQuiz.type === 'crossword') {
              setIsAnswerSubmitted(true);
              setLastUserAnswerText('(Hết thời gian suy nghĩ 30s)');
              setLastAnswerCorrect(false);
              setReviewTimerSeconds(30);
              recordAnswerToHistory(activeQuiz, '(Hết thời gian suy nghĩ 30s)', false);
            } else if (activeQuiz.type === 'true_false') {
              setIsAnswerSubmitted(true);
              setLastUserAnswerText('(Hết thời gian suy nghĩ 30s)');
              setLastAnswerCorrect(false);
              setReviewTimerSeconds(30);
              recordAnswerToHistory(activeQuiz, '(Hết thời gian suy nghĩ 30s)', false);
            } else if (activeQuiz.type === 'fill_blank') {
              setIsAnswerSubmitted(true);
              setLastUserAnswerText('(Hết thời gian suy nghĩ 30s)');
              setLastAnswerCorrect(false);
              setReviewTimerSeconds(30);
              recordAnswerToHistory(activeQuiz, '(Hết thời gian suy nghĩ 30s)', false);
            } else if (activeQuiz.type === 'matching') {
              setIsAnswerSubmitted(true);
              setLastUserAnswerText('(Hết thời gian suy nghĩ 30s)');
              setLastAnswerCorrect(false);
              setReviewTimerSeconds(30);
              recordAnswerToHistory(activeQuiz, '(Hết thời gian suy nghĩ 30s)', false);
            }
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizPhase, isAnswerSubmitted, isThinkingPaused, activeQuiz]);

  // Filtered history for summary
  const filteredHistory = useMemo(() => {
    if (summaryFilter === 'correct') return answeredHistory.filter((h) => h.isCorrect);
    if (summaryFilter === 'incorrect') return answeredHistory.filter((h) => !h.isCorrect);
    return answeredHistory;
  }, [answeredHistory, summaryFilter]);

  const correctCount = answeredHistory.filter((h) => h.isCorrect).length;
  const incorrectCount = answeredHistory.length - correctCount;
  const accuracyPercentage =
    answeredHistory.length > 0 ? Math.round((correctCount / answeredHistory.length) * 100) : 0;

  return (
    <div
      id="book-quiz-modal-backdrop"
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        id="book-quiz-card"
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#FAFAF8] w-full max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:rounded-2xl border-0 sm:border border-amber-200/90 shadow-2xl flex flex-col overflow-hidden text-gray-900"
      >
        {/* Floating Motifs & Surprise Layer */}
        <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
          {floatingParticles.map((p) => (
            <div
              key={p.id}
              className="absolute animate-float-swirl text-center select-none"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                fontSize: `${p.size}px`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
              }}
            >
              <span className="inline-block animate-butterfly">{p.emoji}</span>
            </div>
          ))}

          {floatingBonusText && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-surprise-pop">
              <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black text-sm sm:text-base px-5 py-2.5 rounded-full shadow-2xl border-2 border-yellow-200 flex items-center gap-2 whitespace-nowrap">
                <Sparkles className="w-5 h-5 text-yellow-200 animate-spin" />
                <span>{floatingBonusText.text}</span>
              </div>
            </div>
          )}
        </div>

        {/* Vintage Literary Ornamental Header */}
        <div className="relative bg-gradient-to-r from-[#1C1A17] via-[#2A241E] to-[#1C1A17] text-white px-5 py-4 flex items-center justify-between border-b border-amber-900/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 shadow-md shrink-0 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base text-amber-100 truncate">
                  {book.title}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 whitespace-nowrap">
                  {book.category}
                </span>
              </div>
              <p className="text-xs text-amber-200/70 truncate">
                Tác giả: <span className="text-amber-100">{book.author}</span> • Đố vui tri thức & Tổng hợp dẫn chứng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
              className="p-2 rounded-lg text-amber-200/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              id="book-quiz-modal-close-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-amber-200/80 hover:text-white hover:bg-white/10 transition-colors"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Header Status & Score Bar */}
        <div className="bg-[#F3EFEA] border-b border-amber-200/80 px-5 py-2.5 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <div
              id="quiz-arena-badge"
              className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-amber-600 text-white shadow-xs"
            >
              <Brain className="w-3.5 h-3.5 text-yellow-200" />
              <span>Đấu Trường Tư Duy Phản Biện & Suy Luận Mới</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">
                {questions.length} câu hỏi
              </span>
            </div>

            {/* Quick Button to Jump to Summary if has answered */}
            {answeredHistory.length > 0 && quizPhase !== 'completed' && (
              <button
                type="button"
                onClick={() => setQuizPhase('completed')}
                className="px-3 py-1 rounded-lg text-xs font-bold text-amber-900 bg-white hover:bg-amber-100 border border-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Xem bảng tổng hợp tất cả câu hỏi đã làm kèm lý do và dẫn chứng"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                <span>Xem Tổng Hợp ({answeredHistory.length} câu)</span>
              </button>
            )}

            {quizPhase === 'completed' && (
              <button
                type="button"
                onClick={() => setQuizPhase('playing')}
                className="px-3 py-1 rounded-lg text-xs font-bold text-stone-800 bg-white hover:bg-stone-100 border border-stone-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Brain className="w-3.5 h-3.5 text-amber-700" />
                <span>Quay lại Câu Hỏi Đang Làm</span>
              </button>
            )}

            {quizPhase === 'playing' && (
              <button
                type="button"
                onClick={() => setQuizPhase('welcome')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-stone-600 bg-white hover:bg-stone-100 border border-stone-200 transition-colors flex items-center gap-1 cursor-pointer"
                title="Quay về màn hình khởi động"
              >
                <RotateCcw className="w-3 h-3 text-stone-500" />
                <span>Màn hình khởi động</span>
              </button>
            )}
          </div>

          {/* Points & Streak Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-300/60">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>{score} Điểm</span>
            </div>

            {streak > 1 && (
              <div className="flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-100 px-2.5 py-1 rounded-lg border border-orange-300 animate-pulse">
                <Flame className="w-3.5 h-3.5 text-orange-600" />
                <span>Chuỗi x{streak}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5">
          {/* ========================================================= */}
          {/* 0. MÀN HÌNH KHỞI ĐẦU: BẠN CÓ SẴN SÀNG THAM GIA KHÔNG?    */}
          {/* ========================================================= */}
          {quizPhase === 'welcome' ? (
            <div className="max-w-2xl mx-auto py-3 sm:py-6 px-2 sm:px-4 text-center space-y-6 animate-fadeIn">
              {/* Book Cover + Visual Avatar badge */}
              <div className="relative inline-block mx-auto">
                <div className="w-28 h-40 sm:w-32 sm:h-44 rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-300/80 mx-auto relative group">
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
                <div className="absolute -bottom-3 -right-3 w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Big Title Asked By User */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold uppercase tracking-wider">
                  <Brain className="w-3.5 h-3.5 text-amber-700" />
                  <span>Đấu Trường Tư Duy Phản Biện & Suy Luận Mới</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  BẠN CÓ SẴN SÀNG THAM GIA KHÔNG?
                </h2>
                <p className="text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">
                  Thử thách trí tuệ với hệ thống câu hỏi đào sâu phân tích, mổ xẻ nghịch lý triết học và khai mở suy luận mới từ tác phẩm{' '}
                  <strong className="text-amber-900 font-bold font-serif">"{book.title}"</strong> của tác giả{' '}
                  <strong className="text-gray-900">{book.author}</strong>.
                </p>
              </div>

              {/* 3 Step Rules Highlighted */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <div className="p-4 rounded-xl bg-white border border-amber-200/90 shadow-2xs space-y-2 hover:border-amber-400 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                    <Timer className="w-5 h-5 text-orange-600" />
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">30 Giây Tư Duy Sâu</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Mỗi câu hỏi có 30 giây suy ngẫm, đòi hỏi phân tích đa chiều và suy luận logic thay vì chỉ đoán mò bề mặt.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-amber-200/90 shadow-2xs space-y-2 hover:border-amber-400 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Quote className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">Bóc Tách & Suy Luận Mới</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Sau mỗi câu trả lời là khoảng dừng để đọc phân tích cặn kẽ, giải mã tầng nghĩa biểu tượng và suy luận mới mở rộng.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-amber-200/90 shadow-2xs space-y-2 hover:border-amber-400 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Award className="w-5 h-5 text-amber-600" />
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">Tổng Hợp & Đánh Giá</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Tổng kết đo lường tư duy phản biện, xem lại toàn bộ câu hỏi kèm dẫn chứng sâu sắc và đúc rút bài học thời đại.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  id="quiz-ready-start-btn"
                  onClick={() => {
                    setQuizPhase('playing');
                    resetQuestionState();
                    playChime('surprise');
                    triggerSurpriseMotifs(true);
                  }}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 hover:from-amber-700 hover:via-orange-600 hover:to-amber-700 active:scale-98 text-white font-black text-sm sm:text-base shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-102"
                >
                  <Sparkles className="w-5 h-5 text-yellow-200" />
                  <span>TÔI ĐÃ SẴN SÀNG • BẮT ĐẦU NGAY</span>
                  <ArrowRight className="w-5 h-5 text-white" />
                </button>

                {onOpenBookDetails && (
                  <button
                    type="button"
                    onClick={() => onOpenBookDetails(book)}
                    className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs sm:text-sm border border-gray-300 shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-amber-700" />
                    <span>Xem thông tin cuốn sách trước</span>
                  </button>
                )}
              </div>
            </div>
          ) : isQuizCompleted ? (
            <div className="space-y-6 animate-fadeIn">
              {/* Grand Summary Card */}
              <div className="bg-gradient-to-br from-[#1E1B18] via-[#2A231C] to-[#1E1B18] text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-amber-800/60 relative overflow-hidden">
                <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-44 h-44 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        BẢNG TỔNG HỢP TRI THỨC TÁC PHẨM
                      </span>
                      <span className="text-xs text-amber-200/70">
                        Hoàn thành {answeredHistory.length} câu
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-amber-100">
                      Tổng Kết Thử Thách: {book.title}
                    </h3>
                    <p className="text-xs text-amber-200/80 leading-relaxed max-w-xl italic">
                      "{insightData?.authorDetails?.famousQuote || book.message || 'Mỗi cuốn sách là một thế giới thu nhỏ, mở ra chân trời hiểu biết và tôi luyện phẩm giá con người.'}"
                    </p>
                  </div>

                  {/* Badges & Metrics */}
                  <div className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-amber-900/50 shrink-0">
                    <div className="text-center px-2">
                      <div className="text-xl sm:text-2xl font-black text-amber-400">
                        {score}
                      </div>
                      <div className="text-[10px] text-amber-200/70 uppercase font-semibold">
                        Điểm số
                      </div>
                    </div>
                    <div className="h-8 w-px bg-amber-900/60" />
                    <div className="text-center px-2">
                      <div className="text-xl sm:text-2xl font-black text-emerald-400">
                        {correctCount}/{answeredHistory.length}
                      </div>
                      <div className="text-[10px] text-amber-200/70 uppercase font-semibold">
                        Đúng ({accuracyPercentage}%)
                      </div>
                    </div>
                    <div className="h-8 w-px bg-amber-900/60" />
                    <div className="text-center px-2">
                      <div className="text-xl sm:text-2xl font-black text-orange-400">
                        x{streak}
                      </div>
                      <div className="text-[10px] text-amber-200/70 uppercase font-semibold">
                        Chuỗi thắng
                      </div>
                    </div>
                  </div>
                </div>

                {/* Literary Assessment Tag */}
                <div className="mt-4 pt-3 border-t border-amber-900/40 flex items-center gap-2 text-xs text-amber-200">
                  <Award className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Danh hiệu độc giả:{' '}
                    <strong className="text-amber-300">
                      {accuracyPercentage >= 80
                        ? 'Bậc Thầy Hiểu Thấu Tác Phẩm 🏆'
                        : accuracyPercentage >= 50
                        ? 'Độc Giả Tri Thức Tinh Hoa 🌟'
                        : 'Người Khám Phá Tri Thức Đầy Triển Vọng 📖'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                  <Filter className="w-3.5 h-3.5 text-amber-700" />
                  <span>Bộ lọc danh sách câu hỏi:</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setSummaryFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      summaryFilter === 'all'
                        ? 'bg-white text-gray-900 shadow-2xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Tất cả ({answeredHistory.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSummaryFilter('correct')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      summaryFilter === 'correct'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-gray-500 hover:text-emerald-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Làm đúng ({correctCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSummaryFilter('incorrect')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      summaryFilter === 'incorrect'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'text-gray-500 hover:text-rose-700'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Chưa đúng ({incorrectCount})</span>
                  </button>
                </div>
              </div>

              {/* Detailed Breakdown with Reasons and Evidence */}
              <div className="space-y-4">
                {filteredHistory.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-xs">
                    Không có câu hỏi nào trong danh mục lọc này.
                  </div>
                ) : (
                  filteredHistory.map((item, idx) => (
                    <div
                      key={item.quizId || idx}
                      className={`bg-white rounded-2xl border-2 p-4 sm:p-5 space-y-3.5 shadow-sm transition-all ${
                        item.isCorrect ? 'border-emerald-200/90' : 'border-rose-200/90'
                      }`}
                    >
                      {/* Header of Question Card */}
                      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">
                            {item.index}
                          </span>
                          <span className="text-xs font-bold text-gray-700">
                            {item.type === 'multiple_choice'
                              ? 'Trắc nghiệm 4 lựa chọn'
                              : item.type === 'media_analysis'
                              ? 'Phân tích tình huống & bối cảnh'
                              : item.type === 'crossword'
                              ? '🧩 Ma Trận Ô Chữ - Cụm Từ Khóa Tổng'
                              : item.type === 'true_false'
                              ? 'Thử thách Đúng / Sai'
                              : item.type === 'fill_blank'
                              ? 'Điền câu trả lời'
                              : 'Ghép nối biểu tượng'}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">
                            {item.category}
                          </span>
                        </div>

                        <div
                          className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                            item.isCorrect
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.isCorrect ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>CHÍNH XÁC (+15 ĐIỂM)</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-rose-600" />
                              <span>CHƯA ĐÚNG</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Question Text */}
                      <h4 className="font-bold text-sm sm:text-base text-gray-950 leading-relaxed">
                        {item.question}
                      </h4>

                      {/* Side by side comparison */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div
                          className={`p-3 rounded-xl border ${
                            item.isCorrect
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                              : 'bg-rose-50/60 border-rose-200 text-rose-950'
                          }`}
                        >
                          <span className="font-semibold text-gray-500 block mb-1">
                            Câu trả lời của bạn:
                          </span>
                          <span className="font-bold text-sm block">
                            {item.userAnswer || '(Chưa có câu trả lời)'}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl border bg-emerald-50/90 border-emerald-300 text-emerald-950">
                          <span className="font-semibold text-emerald-800 block mb-1">
                            Đáp án chính xác:
                          </span>
                          <span className="font-bold text-sm text-emerald-800 block">
                            {item.correctAnswer}
                          </span>
                        </div>
                      </div>

                      {/* 1. LÝ DO & LỜI GIẢI THÍCH CHI TIẾT */}
                      <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300 text-xs sm:text-sm text-amber-950 space-y-1.5 shadow-2xs">
                        <div className="flex items-center gap-2 font-bold text-amber-900">
                          <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Lý do & Lời giải thích chi tiết:</span>
                        </div>
                        <p className="leading-relaxed pl-6 text-gray-800">
                          {item.explanation}
                        </p>
                      </div>

                      {/* 2. DẪN CHỨNG XÁC THỰC TỪ TÁC PHẨM */}
                      <div className="p-4 rounded-xl bg-gradient-to-r from-stone-50 via-amber-50/40 to-stone-50 border border-stone-300/90 text-xs sm:text-sm text-stone-900 space-y-1.5 shadow-2xs">
                        <div className="flex items-center gap-2 font-bold text-stone-900">
                          <Quote className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>Dẫn chứng xác thực từ tác phẩm:</span>
                        </div>
                        <p className="italic text-stone-800 leading-relaxed pl-6 border-l-2 border-amber-500 my-1 font-serif">
                          "{item.evidence}"
                        </p>
                      </div>

                      {/* Extra context if available */}
                      {item.didYouKnow && (
                        <div className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-gray-900">Mở rộng tư liệu:</strong>{' '}
                            {item.didYouKnow}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Action Buttons at the Bottom of Summary */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleRestartQuiz}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Thử thách lại bộ câu hỏi này</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateAiQuestion}
                  disabled={isAiGenerating}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAiGenerating ? 'AI đang khởi tạo...' : 'Tạo thêm câu hỏi mới từ AI'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer ml-auto"
                >
                  <X className="w-4 h-4" />
                  <span>Đóng bảng tổng kết</span>
                </button>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* 2. MÀN HÌNH ĐỐ VUI TRỰC TIẾP (CÓ KHOẢNG THỜI GIAN DÀI)    */
            /* ========================================================= */
            activeQuiz ? (
              <div className="space-y-5">
                {/* Active Question Top Bar & Countdown */}
                <div
                  id="integrated-quiz-status-bar"
                  className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-purple-500/10 p-3 rounded-xl border border-amber-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                    <span className="text-xs font-bold text-amber-950">
                      Thử thách {currentIdx + 1} / {questions.length} • {book.title}
                    </span>
                  </div>

                  {/* Review Time or Thinking Time */}
                  <div className="flex items-center gap-2 text-xs">
                    {isAnswerSubmitted ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsReviewPaused(!isReviewPaused)}
                          className="flex items-center gap-1.5 font-mono font-bold text-amber-950 bg-white hover:bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-300 shadow-2xs cursor-pointer transition-colors"
                          title={isReviewPaused ? 'Bấm để tiếp tục đếm ngược' : 'Bấm để dừng lại đọc kỹ bao lâu tùy thích'}
                        >
                          {isReviewPaused ? (
                            <>
                              <Play className="w-3.5 h-3.5 text-emerald-600" />
                              <span>▶️ Tiếp tục đếm ngược</span>
                            </>
                          ) : (
                            <>
                              <Timer className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                              <span>⏳ Đang giữ kết quả: {reviewTimerSeconds}s</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsThinkingPaused(!isThinkingPaused)}
                        className="flex items-center gap-1 font-mono font-bold text-orange-700 bg-white/95 hover:bg-orange-50 px-2.5 py-1.5 rounded-lg border border-orange-200 shadow-2xs cursor-pointer"
                        title={isThinkingPaused ? 'Tiếp tục thời gian' : 'Tạm dừng suy nghĩ'}
                      >
                        <Timer className={`w-3.5 h-3.5 text-orange-600 ${isThinkingPaused ? '' : 'animate-pulse'}`} />
                        <span>{isThinkingPaused ? 'Tạm dừng ⏸' : `${thinkingTimerSeconds}s suy nghĩ`}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* AI Provider notice */}
                {aiProviderTag && (
                  <div className="text-[11px] text-purple-700 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>
                      Câu hỏi được sinh trực tiếp từ: <strong>{aiProviderTag}</strong>
                    </span>
                  </div>
                )}

                {/* Active Question Card */}
                <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-4 sm:p-6 space-y-4 relative overflow-hidden">
                  {/* Question Type & Clue Bar */}
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                        {activeQuiz.type === 'multiple_choice'
                          ? 'Trắc nghiệm 4 lựa chọn'
                          : activeQuiz.type === 'media_analysis'
                          ? 'Phân tích tình huống & bối cảnh'
                          : activeQuiz.type === 'crossword'
                          ? '🧩 Ma Trận Ô Chữ Hàng Ngang & Cụm Từ Khóa Tổng'
                          : activeQuiz.type === 'true_false'
                          ? 'Thử thách Đúng / Sai'
                          : activeQuiz.type === 'fill_blank'
                          ? 'Điền câu hỏi / Điền từ khuyết'
                          : 'Ghép nối biểu tượng & tri thức'}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        Chủ đề: {activeQuiz.category}
                      </span>
                    </div>

                    {activeQuiz.clue && (
                      <button
                        type="button"
                        onClick={() => setShowClue(!showClue)}
                        className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>{showClue ? 'Ẩn gợi ý' : 'Xem manh mối gợi ý'}</span>
                      </button>
                    )}
                  </div>

                  {/* Clue Panel */}
                  {showClue && activeQuiz.clue && (
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-2.5 rounded-xl border border-amber-300 text-xs text-amber-900 flex items-start gap-2 animate-fadeIn">
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Manh mối suy luận:</span> {activeQuiz.clue}
                      </div>
                    </div>
                  )}

                  {/* Question Text (Compact & Full-width) */}
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-bold text-gray-950 leading-relaxed">
                      {activeQuiz.type === 'multiple_choice' && (activeQuiz as MultipleChoiceQuiz).question}
                      {activeQuiz.type === 'media_analysis' && (activeQuiz as MediaAnalysisQuiz).question}
                      {activeQuiz.type === 'crossword' && (activeQuiz as CrosswordQuiz).title}
                      {activeQuiz.type === 'true_false' && (activeQuiz as TrueFalseQuiz).statement}
                      {activeQuiz.type === 'fill_blank' && (activeQuiz as FillBlankQuiz).question}
                      {activeQuiz.type === 'matching' && (activeQuiz as MatchingQuiz).title}
                    </h3>
                    {activeQuiz.type === 'matching' && (
                      <p className="text-xs text-gray-500 italic">
                        {(activeQuiz as MatchingQuiz).instruction}
                      </p>
                    )}
                    {activeQuiz.type === 'crossword' && (
                      <p className="text-xs text-amber-800 font-medium">
                        {(activeQuiz as CrosswordQuiz).instruction}
                      </p>
                    )}
                  </div>

                  {/* ======================================================== */}
                  {/* INTERACTIVE CONTROLS FOR ANSWERING / FILLING QUESTIONS   */}
                  {/* ======================================================== */}
                  <div className="pt-1">
                    {/* 1. Multiple Choice Options */}
                    {activeQuiz.type === 'multiple_choice' && (
                      <div className="grid grid-cols-1 gap-2">
                        {(activeQuiz as MultipleChoiceQuiz).options.map((option, idx) => {
                          const isSelected = selectedAnswerIndex === idx;
                          const isCorrect = idx === (activeQuiz as MultipleChoiceQuiz).correctIndex;
                          let optionStyle =
                            'bg-white border-stone-200/90 hover:border-amber-400 hover:bg-amber-50/40 text-gray-900';

                          if (isAnswerSubmitted) {
                            if (isCorrect) {
                              optionStyle =
                                'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs';
                            } else if (isSelected) {
                              optionStyle = 'bg-rose-50 border-rose-500 text-rose-950';
                            } else {
                              optionStyle = 'bg-gray-50 border-gray-200 text-gray-400 opacity-60';
                            }
                          }

                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={isAnswerSubmitted}
                              onClick={() => handleSelectMCOption(idx)}
                              className={`p-3 sm:py-3 sm:px-4 rounded-xl border-2 text-left text-xs sm:text-sm font-medium transition-all flex items-start gap-2.5 cursor-pointer ${optionStyle}`}
                            >
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                                  isAnswerSubmitted && isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : isAnswerSubmitted && isSelected
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-amber-100 text-amber-900 border border-amber-300/80'
                                }`}
                              >
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span className="flex-1 leading-relaxed text-gray-900 pt-0.5">{option}</span>
                              {isAnswerSubmitted && isCorrect && (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                              )}
                              {isAnswerSubmitted && isSelected && !isCorrect && (
                                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* 2. True / False Challenge */}
                    {activeQuiz.type === 'true_false' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {[true, false].map((val) => {
                          const isSelected = selectedTFAnswer === val;
                          const isCorrect = val === (activeQuiz as TrueFalseQuiz).isTrue;
                          let btnStyle = 'bg-white border-gray-200 text-gray-800 hover:border-amber-400';

                          if (isAnswerSubmitted) {
                            if (isCorrect) {
                              btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold';
                            } else if (isSelected) {
                              btnStyle = 'bg-rose-50 border-rose-500 text-rose-950';
                            } else {
                              btnStyle = 'bg-gray-50 border-gray-200 text-gray-400 opacity-60';
                            }
                          }

                          return (
                            <button
                              key={String(val)}
                              type="button"
                              disabled={isAnswerSubmitted}
                              onClick={() => handleSelectTF(val)}
                              className={`p-3 sm:py-3.5 sm:px-4 rounded-xl border-2 text-center text-sm font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${btnStyle}`}
                            >
                              <span className="text-base">{val ? '✓ ĐÚNG' : '✗ SAI'}</span>
                              <span className="text-[11px] font-normal text-gray-500">
                                {val ? 'Nhận định này hoàn toàn chính xác' : 'Nhận định này chưa đúng'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* 3. Fill In The Blank ("Điền câu hỏi / Điền đáp án") */}
                    {activeQuiz.type === 'fill_blank' && (
                      <div className="space-y-4">
                        {/* Sentence with blank */}
                        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-sm sm:text-base font-serif italic text-gray-900 leading-relaxed">
                          {(activeQuiz as FillBlankQuiz).sentenceWithBlank}
                        </div>

                        {/* Input Field & Submit Button */}
                        <form onSubmit={handleSubmitFillBlank} className="space-y-3">
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                            <input
                              type="text"
                              value={fillBlankInput}
                              disabled={isAnswerSubmitted}
                              onChange={(e) => setFillBlankInput(e.target.value)}
                              placeholder={
                                (activeQuiz as FillBlankQuiz).placeholder ||
                                'Nhập câu trả lời hoặc từ còn thiếu vào đây...'
                              }
                              className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors outline-hidden ${
                                isAnswerSubmitted
                                  ? lastAnswerCorrect
                                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                                    : 'bg-rose-50 border-rose-400 text-rose-950'
                                  : 'bg-white border-gray-300 focus:border-amber-500'
                              }`}
                            />

                            {!isAnswerSubmitted && (
                              <button
                                type="submit"
                                disabled={!fillBlankInput.trim()}
                                className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                              >
                                <Send className="w-4 h-4" />
                                <span>Kiểm tra đáp án</span>
                              </button>
                            )}
                          </div>
                        </form>
                      </div>
                    )}

                    {/* 4. Matching Challenge */}
                    {activeQuiz.type === 'matching' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Column A */}
                          <div className="space-y-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Cột A
                            </span>
                            {(activeQuiz as MatchingQuiz).pairs.map((p) => {
                              const isMatched = matchedPairIds.includes(p.id);
                              const isSelected = selectedLeftId === p.id;
                              const isError = matchingErrorPair?.left === p.id;

                              let s = 'bg-white border-gray-200 hover:border-amber-400';
                              if (isMatched) s = 'bg-emerald-50 border-emerald-400 text-emerald-900 opacity-75';
                              else if (isError) s = 'bg-rose-50 border-rose-400 animate-shake';
                              else if (isSelected) s = 'bg-amber-100 border-amber-600 font-bold shadow-xs';

                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  disabled={isMatched}
                                  onClick={() => handleSelectLeftMatching(p.id)}
                                  className={`w-full p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${s}`}
                                >
                                  <div className="font-semibold">{p.leftText}</div>
                                  {p.leftSubtitle && (
                                    <div className="text-[10px] text-gray-500 mt-0.5">{p.leftSubtitle}</div>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Column B */}
                          <div className="space-y-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Cột B
                            </span>
                            {(activeQuiz as MatchingQuiz).pairs.map((p) => {
                              const isMatched = matchedPairIds.includes(p.id);
                              const isError = matchingErrorPair?.right === p.id;

                              let s = 'bg-white border-gray-200 hover:border-amber-400';
                              if (isMatched) s = 'bg-emerald-50 border-emerald-400 text-emerald-900 opacity-75';
                              else if (isError) s = 'bg-rose-50 border-rose-400 animate-shake';

                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  disabled={isMatched || !selectedLeftId}
                                  onClick={() => handleSelectRightMatching(p.id)}
                                  className={`w-full p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${s}`}
                                >
                                  <div className="font-semibold">{p.rightText}</div>
                                  {p.rightSubtitle && (
                                    <div className="text-[10px] text-gray-500 mt-0.5">{p.rightSubtitle}</div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5. Phân Tích Bối Cảnh / Tình Huống Tác Phẩm (No images) */}
                    {activeQuiz.type === 'media_analysis' && (() => {
                      const mediaQuiz = activeQuiz as MediaAnalysisQuiz;

                      return (
                        <div className="space-y-3">
                          {/* Context / Focus note */}
                          {mediaQuiz.analysisFocus && (
                            <div className="p-3 rounded-xl bg-amber-50/70 border-l-4 border-amber-500 text-xs sm:text-sm text-stone-800 space-y-1">
                              <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Compass className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                <span>Bối cảnh & Trọng tâm phân tích:</span>
                              </div>
                              <p className="italic text-stone-700 leading-relaxed pl-1">
                                "{mediaQuiz.analysisFocus}"
                              </p>
                            </div>
                          )}

                          {/* 4 Analytical Options */}
                          <div className="grid grid-cols-1 gap-2">
                            {mediaQuiz.options.map((opt, idx) => {
                              const isSelected = selectedAnswerIndex === idx;
                              const isCorrect = idx === mediaQuiz.correctIndex;
                              let optStyle =
                                'bg-white border-stone-200/90 hover:border-amber-400 hover:bg-amber-50/30 text-stone-900';

                              if (isAnswerSubmitted) {
                                if (isCorrect) {
                                  optStyle =
                                    'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs';
                                } else if (isSelected) {
                                  optStyle = 'bg-rose-50 border-rose-500 text-rose-950';
                                } else {
                                  optStyle =
                                    'bg-gray-50 border-gray-200 text-gray-400 opacity-60';
                                }
                              }

                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  disabled={isAnswerSubmitted}
                                  onClick={() => handleSelectMediaOption(idx)}
                                  className={`p-3 sm:py-3 sm:px-4 rounded-xl border-2 text-left text-xs sm:text-sm font-medium transition-all flex items-start gap-2.5 cursor-pointer ${optStyle}`}
                                >
                                  <span
                                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                                      isAnswerSubmitted && isCorrect
                                        ? 'bg-emerald-600 text-white'
                                        : isAnswerSubmitted && isSelected
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-amber-100 text-amber-950 border border-amber-300'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + idx)}
                                  </span>
                                  <span className="flex-1 leading-relaxed text-stone-900 pt-0.5">
                                    {opt}
                                  </span>
                                  {isAnswerSubmitted && isCorrect && (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                  )}
                                  {isAnswerSubmitted && isSelected && !isCorrect && (
                                    <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* 6. Crossword Matrix Challenge & Master Keyword */}
                    {activeQuiz.type === 'crossword' && (() => {
                      const cw = activeQuiz as CrosswordQuiz;
                      const masterLetters = cw.masterKeyword.split('');
                      const solvedCount = Object.keys(solvedCrosswordRows).length;
                      const isFullySolved = isAnswerSubmitted && lastAnswerCorrect;

                      return (
                        <div className="space-y-5">
                          {/* 6.1 Top Master Keyword Banner */}
                          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950 via-stone-900 to-amber-900 text-white border-2 border-amber-400/80 shadow-lg space-y-3 relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Key className="w-5 h-5 text-amber-400 shrink-0" />
                                <div>
                                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                                    CỤM TỪ KHÓA TỔNG (MASTER KEYWORD)
                                  </span>
                                  <div className="text-xs text-amber-100/80">
                                    {isFullySolved
                                      ? '🎉 Chúc mừng! Bạn đã mở khóa hoàn tất Cụm Từ Khóa Cốt Lõi!'
                                      : `Đã mở ${solvedCount}/${cw.rows.length} hàng ngang gợi ý`}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setShowMasterClue(!showMasterClue)}
                                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                              >
                                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                                <span>{showMasterClue ? 'Ẩn gợi ý cốt lõi' : 'Gợi ý tư tưởng cốt lõi'}</span>
                              </button>
                            </div>

                            {/* Master Clue Banner */}
                            {showMasterClue && (
                              <div className="p-3 rounded-xl bg-amber-900/50 border border-amber-400/30 text-xs text-amber-100 leading-relaxed flex items-start gap-2 animate-fadeIn">
                                <Quote className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                                <div>
                                  <strong className="text-amber-300">Manh mối tư tưởng:</strong> {cw.masterClue}
                                </div>
                              </div>
                            )}

                            {/* Letter Tiles for Master Keyword */}
                            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 py-2">
                              {masterLetters.map((char, cIdx) => {
                                if (char === ' ') {
                                  return <div key={cIdx} className="w-3 sm:w-4" />;
                                }

                                // Check if this letter is revealed
                                let isCharRevealed = isFullySolved;
                                if (!isCharRevealed) {
                                  const matchingRow = cw.rows[cIdx];
                                  if (matchingRow && solvedCrosswordRows[matchingRow.id]) {
                                    isCharRevealed = true;
                                  }
                                }

                                return (
                                  <div
                                    key={cIdx}
                                    className={`w-9 h-11 sm:w-11 sm:h-13 rounded-xl border-2 flex flex-col items-center justify-center font-black text-base sm:text-lg transition-all shadow-md ${
                                      isCharRevealed
                                        ? 'bg-gradient-to-b from-amber-300 to-yellow-400 text-stone-950 border-amber-200 scale-105 animate-bounce'
                                        : 'bg-stone-800/90 text-amber-400/60 border-stone-700'
                                    }`}
                                  >
                                    <span>{isCharRevealed ? char.toUpperCase() : '?'}</span>
                                    {!isCharRevealed && (
                                      <Lock className="w-2.5 h-2.5 text-amber-500/50" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Direct Master Keyword Submission Form */}
                            {!isAnswerSubmitted && (
                              <form onSubmit={handleSubmitMasterKeyword} className="pt-2 space-y-2">
                                <div className="text-[11px] text-amber-200/90 font-medium text-center">
                                  💡 Bạn đã đoán ra Cụm Từ Khóa Tổng? Nhập ngay để nhận trọn <strong>+50 Điểm Thưởng</strong>!
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                                  <input
                                    type="text"
                                    value={masterKeywordInput}
                                    onChange={(e) => setMasterKeywordInput(e.target.value)}
                                    placeholder="Nhập cụm từ khóa tổng..."
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-amber-400/50 text-white placeholder-amber-200/40 text-xs sm:text-sm font-bold focus:outline-hidden focus:border-amber-300"
                                  />
                                  <button
                                    type="submit"
                                    disabled={!masterKeywordInput.trim()}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                                  >
                                    <Key className="w-4 h-4 text-stone-950" />
                                    <span>Giải Mã Ngay</span>
                                  </button>
                                </div>
                                {masterKeywordError && (
                                  <div className="text-center text-xs text-rose-300 font-semibold animate-shake">
                                    {masterKeywordError}
                                  </div>
                                )}
                              </form>
                            )}
                          </div>

                          {/* 6.2 Horizontal Rows Matrix */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold text-gray-700 px-1">
                              <span className="flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-amber-600" />
                                <span>CÁC HÀNG NGANG CHỨA CHỮ CÁI GỢI Ý ({cw.rows.length} HÀNG)</span>
                              </span>
                              <span className="text-[11px] text-gray-400 font-normal">
                                Ô viền vàng chứa chữ cái then chốt
                              </span>
                            </div>

                            <div className="space-y-2.5">
                              {cw.rows.map((row) => {
                                const isRowSolved = !!solvedCrosswordRows[row.id] || isFullySolved;
                                const letters = row.answer.split('');
                                const isRowActive = activeCrosswordRowId === row.id;

                                return (
                                  <div
                                    key={row.id}
                                    className={`p-3.5 rounded-xl border-2 transition-all ${
                                      isRowSolved
                                        ? 'bg-emerald-50/70 border-emerald-300'
                                        : isRowActive
                                        ? 'bg-amber-50/70 border-amber-400 shadow-xs'
                                        : 'bg-white border-gray-200 hover:border-amber-300'
                                    }`}
                                  >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                                            isRowSolved
                                              ? 'bg-emerald-600 text-white'
                                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                                          }`}
                                        >
                                          {row.rowNumber}
                                        </span>
                                        <span className="text-xs font-bold text-gray-900">
                                          Hàng {row.rowNumber}:
                                        </span>
                                        <span className="text-xs text-gray-600">
                                          {row.clue}
                                        </span>
                                      </div>

                                      {isRowSolved ? (
                                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1 self-start sm:self-auto shrink-0">
                                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>Đã giải (+10đ)</span>
                                        </span>
                                      ) : (
                                        !isAnswerSubmitted && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveCrosswordRowId(isRowActive ? null : row.id);
                                              setCrosswordRowInput('');
                                              setCrosswordRowError(null);
                                            }}
                                            className="px-3 py-1 rounded-lg text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
                                          >
                                            {isRowActive ? 'Đóng' : '✍️ Giải hàng này'}
                                          </button>
                                        )
                                      )}
                                    </div>

                                    {/* Letter Tiles */}
                                    <div className="flex flex-wrap items-center gap-1 pt-1 pb-1">
                                      {letters.map((char, lIdx) => {
                                        if (char === ' ') {
                                          return <div key={lIdx} className="w-2" />;
                                        }

                                        const isKeyChar = lIdx === row.keyCharIndex;

                                        return (
                                          <div
                                            key={lIdx}
                                            className={`w-7 h-8 sm:w-8 sm:h-9 rounded-lg border-2 flex items-center justify-center font-bold text-xs sm:text-sm uppercase transition-all ${
                                              isRowSolved
                                                ? isKeyChar
                                                  ? 'bg-amber-400 text-stone-950 border-amber-300 font-black ring-2 ring-amber-300 shadow-xs'
                                                  : 'bg-emerald-600 text-white border-emerald-700'
                                                : isKeyChar
                                                ? 'bg-amber-100 border-dashed border-amber-500 text-amber-900 font-black ring-2 ring-amber-300'
                                                : 'bg-gray-100 border-gray-300 text-gray-400'
                                            }`}
                                          >
                                            {isRowSolved ? char : isKeyChar ? '★' : ''}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Inline Row Answer Form */}
                                    {isRowActive && !isRowSolved && !isAnswerSubmitted && (
                                      <form
                                        onSubmit={(e) => {
                                          e.preventDefault();
                                          handleAnswerCrosswordRow(row.id, row.answer);
                                        }}
                                        className="mt-3 pt-3 border-t border-amber-200 space-y-2 animate-fadeIn"
                                      >
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="text"
                                            value={crosswordRowInput}
                                            onChange={(e) => setCrosswordRowInput(e.target.value)}
                                            placeholder={`Nhập từ gồm ${row.answer.replace(/\s+/g, '').length} chữ cái...`}
                                            className="flex-1 px-3 py-2 rounded-xl bg-white border-2 border-amber-300 text-xs sm:text-sm font-semibold outline-hidden focus:border-amber-500"
                                            autoFocus
                                          />
                                          <button
                                            type="submit"
                                            disabled={!crosswordRowInput.trim()}
                                            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs transition-colors cursor-pointer"
                                          >
                                            Kiểm tra
                                          </button>
                                        </div>
                                        {crosswordRowError && (
                                          <p className="text-xs text-rose-600 font-medium animate-shake">
                                            {crosswordRowError}
                                          </p>
                                        )}
                                      </form>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* ======================================================== */}
                  {/* COMPACT & STREAMLINED FEEDBACK BANNER & EXPLANATION      */}
                  {/* ======================================================== */}
                  {isAnswerSubmitted && (
                    <div className="mt-4 pt-3.5 border-t border-gray-200 space-y-3 animate-fadeIn">
                      {/* 1. Result Banner with Compact Timer Controls */}
                      <div
                        className={`p-3 sm:py-3 sm:px-4 rounded-xl border-2 flex items-center justify-between gap-3 shadow-2xs ${
                          lastAnswerCorrect
                            ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950'
                            : 'bg-rose-50/90 border-rose-300 text-rose-950'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {lastAnswerCorrect ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                          )}
                          <div>
                            <h4 className="font-black text-sm sm:text-base leading-tight">
                              {lastAnswerCorrect ? 'CHÍNH XÁC! (+15 ĐIỂM) 🎉' : 'CHƯA ĐÚNG RỒI! ❌'}
                            </h4>
                            <p className="text-[11px] sm:text-xs text-gray-600">
                              {lastAnswerCorrect
                                ? 'Bạn đã nắm vững luận điểm của tác phẩm.'
                                : 'Đừng nản lòng, hãy xem lý do và dẫn chứng bên dưới.'}
                            </p>
                          </div>
                        </div>

                        {/* Timer control */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setIsReviewPaused(!isReviewPaused)}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-gray-50 border border-gray-300 text-xs font-semibold text-gray-700 shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                            title={isReviewPaused ? 'Tiếp tục đếm ngược' : 'Tạm dừng để đọc kỹ không giới hạn'}
                          >
                            {isReviewPaused ? (
                              <>
                                <Play className="w-3 h-3 text-emerald-600" />
                                <span>▶️ Đếm tiếp</span>
                              </>
                            ) : (
                              <>
                                <Pause className="w-3 h-3 text-amber-600" />
                                <span>⏸️ Đọc kỹ ({reviewTimerSeconds}s)</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Side-by-side Answer Comparison if wrong */}
                      {!lastAnswerCorrect && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl border bg-rose-50/70 border-rose-200 text-rose-950">
                            <span className="font-semibold text-gray-500 block text-[11px] mb-0.5">
                              Lựa chọn của bạn:
                            </span>
                            <span className="font-bold text-xs sm:text-sm">
                              {lastUserAnswerText || '(Chưa điền / chọn)'}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl border bg-emerald-50/90 border-emerald-300 text-emerald-950">
                            <span className="font-semibold text-emerald-800 block text-[11px] mb-0.5">
                              Đáp án chính xác:
                            </span>
                            <span className="font-bold text-xs sm:text-sm text-emerald-800">
                              {getQuizCorrectAnswer(activeQuiz)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Consolidated Compact Knowledge & Explanation Card */}
                      <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2.5 text-xs sm:text-sm text-stone-900 shadow-2xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs uppercase tracking-wider">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Lý do & Lời giải thích:</span>
                          </div>
                          <p className="leading-relaxed text-stone-800 pl-5">
                            {activeQuiz.explanation}
                          </p>
                        </div>

                        {getQuizEvidence(activeQuiz) && (
                          <div className="pt-2 border-t border-amber-200/70 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs uppercase tracking-wider">
                              <Quote className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>Dẫn chứng từ tác phẩm:</span>
                            </div>
                            <p className="italic text-stone-800 leading-relaxed pl-5 font-serif border-l-2 border-amber-400 ml-1">
                              "{getQuizEvidence(activeQuiz)}"
                            </p>
                          </div>
                        )}

                        {activeQuiz.didYouKnow && (
                          <div className="pt-1.5 text-[11px] sm:text-xs text-amber-950 flex items-start gap-1.5 bg-amber-100/60 p-2 rounded-lg">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <strong>Có thể bạn chưa biết:</strong> {activeQuiz.didYouKnow}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom Action Controls */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsQuizCompleted(true)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                          <span>Bảng tổng hợp</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleNextOrFinish}
                          className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer ml-auto"
                        >
                          <span>
                            {currentIdx >= questions.length - 1
                              ? 'Hoàn thành & Xem kết quả 🏁'
                              : 'Câu tiếp theo'}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-amber-200 p-8 text-center space-y-4 shadow-xs">
                <Sparkles className="w-10 h-10 text-amber-500 mx-auto animate-bounce" />
                <h3 className="font-bold text-gray-900 text-base">Đang tải bộ câu hỏi đố vui...</h3>
                <p className="text-xs text-gray-500">
                  Hệ thống đang chuẩn bị các thử thách tri thức tinh hoa cho cuốn sách này.
                </p>
                <button
                  type="button"
                  onClick={handleRestartQuiz}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer"
                >
                  Tải lại câu hỏi
                </button>
              </div>
            )
          )}
        </div>

        {/* Milestone Surprise Lore Modal Drop */}
        {showSurpriseModal && surpriseBonusMilestone && (
          <div
            className="absolute inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
            onClick={() => setShowSurpriseModal(false)}
          >
            <div
              className="bg-gradient-to-b from-[#FFFDF9] to-[#F5EFE6] w-full max-w-md p-6 rounded-2xl border-2 border-amber-400 shadow-2xl text-center space-y-4 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg animate-bounce">
                <Award className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold uppercase tracking-wider">
                  Mở khóa Kho báu Tri thức Bất ngờ
                </span>
                <h3 className="text-base font-black text-gray-900 pt-2">
                  {surpriseBonusMilestone.title}
                </h3>
              </div>

              <div className="bg-white p-4 rounded-xl border border-amber-200 text-xs italic text-gray-800 leading-relaxed shadow-2xs font-serif">
                "{surpriseBonusMilestone.quote}"
                <div className="text-right font-bold text-amber-900 not-italic mt-2">
                  — {surpriseBonusMilestone.author}
                </div>
              </div>

              <div className="text-xs font-bold text-amber-700">
                Thưởng thêm: <span className="text-base text-amber-600">+{surpriseBonusMilestone.pointsBonus} Điểm</span>!
              </div>

              <button
                type="button"
                onClick={() => setShowSurpriseModal(false)}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Nhận thưởng & Tiếp tục đố vui 🚀
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
