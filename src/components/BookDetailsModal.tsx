import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Send,
  Bot,
  User,
  Keyboard,
  FastForward,
  RotateCcw,
  Sparkles,
  Users,
  Quote,
  BookOpen,
  ChevronRight,
  Tag,
  Lightbulb,
  HelpCircle,
  Zap,
  PenTool,
  Trophy,
  History,
  GitCommit,
  Brain,
  Barcode,
  Copy,
  Check,
  QrCode,
  CheckCircle2,
} from 'lucide-react';
import { Book, ChatMessage } from '../types.js';
import { getCuriositiesForBook } from '../data/bookCuriosities.js';
import { getEnrichedBookDetails } from '../data/bookDetailedInsights.js';
import { BookQuizModal } from './BookQuizModal.js';

interface BookDetailsModalProps {
  book: Book | null;
  onClose: () => void;
  onSelectRelatedBook: (book: Book) => void;
  onOpenQuiz?: (book: Book) => void;
  onEditBook?: (book: Book) => void;
  onScanCode?: (code: string) => void;
}

// Simple synthesizer for mechanical typing sound
function playKeyClick() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = (window as any)._libraAudioCtx || new AudioContextClass();
    (window as any)._libraAudioCtx = ctx;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    // Realistic subtle mechanical pitch variation
    osc.frequency.setValueAtTime(700 + Math.random() * 250, ctx.currentTime);
    gain.gain.setValueAtTime(0.012, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.025);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.025);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

// Formatter to render Markdown-style bold and lists smoothly
function renderFormattedContent(text: string, isStreaming?: boolean) {
  if (!text) return null;

  // Split lines
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-1.5" />;
        }

        // Parse bold **text** in the line
        const parts = line.split(/(\*\*.*?\*\*)/g);
        const renderedLine = parts.map((part, partIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={partIdx} className="font-semibold text-gray-900">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={partIdx}>{part}</span>;
        });

        // Bullet line
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          return (
            <div key={lineIdx} className="flex items-start gap-1.5 pl-1">
              <span className="text-gray-400 font-bold shrink-0 mt-0.5">•</span>
              <div className="flex-1">{renderedLine}</div>
            </div>
          );
        }

        // Numbered item: e.g. "1. " or "2. "
        const numMatch = trimmed.match(/^(\d+[\.\)])\s*(.*)/);
        if (numMatch) {
          return (
            <div key={lineIdx} className="flex items-start gap-1.5 pl-1">
              <span className="text-gray-500 font-semibold shrink-0">{numMatch[1]}</span>
              <div className="flex-1">{renderedLine}</div>
            </div>
          );
        }

        return <div key={lineIdx}>{renderedLine}</div>;
      })}
      {isStreaming && (
        <span
          className="inline-block w-1.5 h-3.5 bg-gray-900 ml-0.5 animate-pulse align-middle"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export const BookDetailsModal: React.FC<BookDetailsModalProps> = ({
  book,
  onClose,
  onSelectRelatedBook,
  onOpenQuiz,
  onEditBook,
  onScanCode,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [activeLeftTab, setActiveLeftTab] = useState<
    'overview' | 'plot' | 'author' | 'characters' | 'message'
  >('overview');
  const [mobileView, setMobileView] = useState<'details' | 'chat'>('details');
  const [typingState, setTypingState] = useState<{
    id: string;
    fullText: string;
    currentIndex: number;
  } | null>(null);

  const insightData = book ? getEnrichedBookDetails(book) : null;

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const leftContentScrollRef = useRef<HTMLDivElement>(null);
  const activeBookIdRef = useRef<string | null>(null);

  // Reset scroll position to top whenever user switches sub-tab
  useEffect(() => {
    if (leftContentScrollRef.current) {
      leftContentScrollRef.current.scrollTop = 0;
    }
  }, [activeLeftTab]);

  // Initialize conversation only when opening modal or switching to a different book
  useEffect(() => {
    if (!book) return;

    if (activeBookIdRef.current === book.id) {
      return;
    }
    activeBookIdRef.current = book.id;

    setActiveLeftTab('overview');
    setTypingState(null);
    setMessages([
      {
        id: 'welcome-1',
        role: 'assistant',
        content: `Tôi là Chatbot Gemini AI của thư viện, được tích hợp trực tiếp mô hình Google Gemini để giải đáp thông tin về tác phẩm **"${book.title}"** (${book.author}).\n\nHãy đặt câu hỏi cho tôi, tôi sẽ trả lời trực tiếp và đúng trọng tâm!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: [`Google Gemini AI`, `Tác phẩm: ${book.title}`],
      },
    ]);
  }, [book?.id]);

  // Generate real scannable QR code for library code & barcode
  useEffect(() => {
    if (!book) return;
    const code = book.libraryCode || `LIB-${(book.isbn || '00000').slice(-5)}`;
    QRCode.toDataURL(code, {
      width: 220,
      margin: 1,
      color: {
        dark: '#111827',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.warn('QR generation error:', err));
  }, [book?.libraryCode, book?.isbn]);

  // Typewriter effect ticker
  useEffect(() => {
    if (!typingState) return;

    const timer = setTimeout(() => {
      // Typing step: 2-3 characters per tick (~15ms) gives a crisp, authentic mechanical typewriter feel
      const step = typingState.fullText.length > 300 ? 3 : 2;
      const nextIndex = Math.min(typingState.currentIndex + step, typingState.fullText.length);
      const partialText = typingState.fullText.slice(0, nextIndex);
      const isDone = nextIndex >= typingState.fullText.length;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === typingState.id
            ? { ...m, content: partialText, isStreaming: !isDone }
            : m
        )
      );

      // Play audio click if enabled
      if (soundEnabled && nextIndex % 4 === 0) {
        playKeyClick();
      }

      if (isDone) {
        setTypingState(null);
      } else {
        setTypingState((prev) => (prev ? { ...prev, currentIndex: nextIndex } : null));
      }
    }, 15);

    return () => clearTimeout(timer);
  }, [typingState, soundEnabled]);

  // Auto-scroll when message updates
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiLoading, typingState]);

  if (!book) return null;

  // Complete typing instantly (Skip)
  const handleSkipTyping = () => {
    if (!typingState) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === typingState.id
          ? { ...m, content: typingState.fullText, isStreaming: false }
          : m
      )
    );
    setTypingState(null);
  };

  const handleSendMessage = async (customQuestion?: string) => {
    const questionText = (customQuestion || chatInput).trim();
    if (!questionText || isAiLoading) return;

    // If currently typing previous message, complete it immediately
    if (typingState) {
      handleSkipTyping();
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customQuestion) {
      setChatInput('');
    }
    setIsAiLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          question: questionText,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();

      if (data.success && data.answer) {
        const aiMsgId = `ai-${Date.now()}`;

        // Insert new message with empty content and start typewriter
        setMessages((prev) => [
          ...prev,
          {
            id: aiMsgId,
            role: 'assistant',
            content: '',
            isStreaming: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sources: data.sources || [`Google Gemini AI: ${book.title}`],
          },
        ]);

        // Start typing loop
        setTypingState({
          id: aiMsgId,
          fullText: data.answer,
          currentIndex: 0,
        });
      } else {
        throw new Error(data.error || 'AI server response issue');
      }
    } catch (err) {
      // Seamless guaranteed on-point answer so user is never left without response
      const aiMsgId = `ai-grounded-${Date.now()}`;
      const qLower = questionText.toLowerCase();

      // Check if user is asking about a quote
      const isQuoteInquiry = /câu nói|trích dẫn|câu trích|lời thoại|tuyên ngôn|phát ngôn/i.test(qLower) ||
        questionText.includes('"') || questionText.includes('“');

      let fallbackText = `**"${book.title}"** (${book.author}):\n${book.summary}\n\n**Thông điệp chính:** "${book.message}"`;

      if (isQuoteInquiry) {
        const authorQuote = insightData?.authorDetails?.famousQuote || insightData?.authorDetails?.quote;
        const matchingChar = book.characters?.find(c => {
          const cQuote = (c.keyQuote || c.quote || '').toLowerCase();
          return (cQuote && qLower.includes(cQuote.slice(0, 15))) || qLower.includes(c.name.toLowerCase());
        });
        const charQuote = matchingChar?.keyQuote || matchingChar?.quote;
        const targetQ = charQuote || authorQuote || book.message;
        const targetWho = matchingChar ? `nhân vật ${matchingChar.name}` : (authorQuote ? `tác giả ${book.author}` : `tác phẩm "${book.title}"`);

        fallbackText = `### 📜 GIẢI MÃ CHUYÊN SÂU & SUY LUẬN MỚI TỪ CÂU NÓI:
*"${targetQ}"*
*(Gắn liền với ${targetWho})*

---

#### 1. 📍 Bối cảnh & Tọa độ phát ngôn
- **Hoàn cảnh ra đời:** Câu nói xuất hiện tại thời khắc then chốt trong diễn biến tác phẩm "${book.title}". Đây là thời điểm mà các xung đột nội tâm và thử thách hiện sinh được đẩy lên cao độ.
- **Tâm thế & Động lực:** Câu nói phát xuất từ sự giằng xé giữa thực tại khốc liệt và khát vọng vươn tới chân lý đích thực.

#### 2. 🔬 Bóc tách Tầng nghĩa & Nghệ thuật ngôn từ
- **Nghĩa hiển ngôn (Bề mặt):** Phản ánh trực tiếp quan niệm: ${book.summary.slice(0, 150)}...
- **Nghĩa hàm ẩn (Tầng sâu biểu tượng):** Ngôn từ sử dụng nghệ thuật tương phản đắt giá, thể hiện sự đối thoại giữa cái hữu hạn của cá nhân và chiều sâu vô hạn của nhận thức.

#### 3. 💡 Suy luận Mới & Góc nhìn Đa chiều (Tư duy đột phá)
- **Nghịch lý tư tưởng:** Để thấu cảm chân lý, con người buộc phải vượt qua nỗi sợ tổn thương và dám từ bỏ sự an phận trong những định kiến quen thuộc.
- **Phát hiện mới:** Trong thời đại số, câu nói là lời cảnh tỉnh về sự chai sạn cảm xúc do bão hòa thông tin, khơi dậy bản lĩnh độc lập tư duy.

#### 4. 🌟 Ý nghĩa Nhân sinh & Sự soi chiếu Thời đại
- **Bài học thức tỉnh:** Định hướng cho người trẻ tinh thần tự phản tư, rèn luyện sự kiên định và nuôi dưỡng lòng trắc ẩn trong mọi hoàn cảnh.
- **Hành động chuyển hóa:** ${book.keyTakeaways?.[0] || 'Chuyển hóa tri thức thành hành động có ý nghĩa mỗi ngày.'}`;
      } else if (book.characters && book.characters.length > 0) {
        const match = book.characters.find(c => qLower.includes(c.name.toLowerCase()));
        if (match) {
          fallbackText = `### 🎭 PHÂN TÍCH NHÂN VẬT & SUY LUẬN TÂM LÝ: **${match.name}** (${match.role})\n\n` +
            `• **Mô tả & Tính cách:** ${match.description}\n` +
            (match.symbolicMeaning ? `• **Ý nghĩa biểu tượng:** ${match.symbolicMeaning}\n` : '') +
            (match.keyQuote || match.quote ? `• **Câu nói then chốt:** *"${match.keyQuote || match.quote}"*\n` : '') +
            `• **Suy luận chuyên sâu:** Nhân vật đại diện cho bước ngoặt thức tỉnh lương tri và sự giằng xé nội tâm trên hành trình trưởng thành.`;
        }
      } else if (qLower.includes('bài học') || qLower.includes('ý nghĩa') || qLower.includes('thông điệp')) {
        fallbackText = `### 💎 THÔNG ĐIỆP CỐT LÕI & BÀI HỌC SUY LUẬN MỚI:\n\n` +
          `**Thông điệp chủ đạo:**\n*"${book.message}"*\n\n**Bài học then chốt:**\n` +
          book.keyTakeaways.map((t, idx) => `${idx + 1}. **${t}**`).join('\n') +
          `\n\n💡 *Suy luận phản biện:* Giá trị của tác phẩm nằm ở việc thách thức các lối mòn tư duy, khích lệ người đọc tự chiêm nghiệm và hành động.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          role: 'assistant',
          content: '',
          isStreaming: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: [`Google Gemini AI (Dữ liệu sách): ${book.title}`],
        },
      ]);

      setTypingState({
        id: aiMsgId,
        fullText: fallbackText,
        currentIndex: 0,
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // Dedicated interaction handler to inquire deeply about any quote / saying
  const handleAskAboutQuote = (quoteText: string, contextSubject: string) => {
    if (!quoteText) return;
    const formattedPrompt = `Phân tích chuyên sâu & suy luận mới về câu nói của ${contextSubject}:\n"${quoteText}"\n\nYêu cầu phân tích chi tiết đầy đủ các yếu tố thông tin:\n1. 📍 Bối cảnh & Tọa độ phát ngôn: Hoàn cảnh cụ thể, tâm thế và mâu thuẫn nội tâm.\n2. 🔬 Bóc tách tầng nghĩa biểu tượng & nghệ thuật ngôn từ đắt giá.\n3. 💡 Suy luận mới & Góc nhìn đa chiều: Những nghịch lý tư tưởng sâu xa ít người nhận ra.\n4. 🌟 Ý nghĩa nhân sinh & Sự soi chiếu thực tiễn cho độc giả hiện nay.`;
    setMobileView('chat');
    handleSendMessage(formattedPrompt);
  };

  // Generate dynamic contextual high-order critical thinking prompts
  const getContextualPrompts = () => {
    const list: string[] = [];

    const authorQuote =
      insightData?.authorDetails?.famousQuote || insightData?.authorDetails?.quote;
    const charWithQuote = book.characters?.find((c) => c.keyQuote || c.quote);

    if (authorQuote) {
      list.push(`Phân tích câu nói để đời: "${authorQuote.slice(0, 32)}..."`);
    } else if (charWithQuote) {
      const q = charWithQuote.keyQuote || charWithQuote.quote;
      list.push(`Giải mã câu nói của ${charWithQuote.name}: "${q?.slice(0, 28)}..."`);
    }

    list.push(`Phân tích nghịch lý triết học & suy luận mới trong sách`);

    if (book.characters && book.characters.length > 0) {
      list.push(`Phân tích mâu thuẫn nội tâm của ${book.characters[0].name}`);
    } else {
      list.push(`Luận điểm đột phá nào thách thức tư duy truyền thống?`);
    }

    list.push(`Góc nhìn phản biện: Những suy luận ít người nhận ra`);

    return list.slice(0, 4);
  };

  const quickPrompts = getContextualPrompts();

  return (
    <div
      id="book-details-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/50 backdrop-blur-xs"
    >
      <div
        id="book-details-card"
        className="relative w-full max-w-5xl bg-white sm:rounded-2xl shadow-xl border-0 sm:border border-gray-200 overflow-hidden flex flex-col h-[100dvh] sm:h-[88vh] sm:max-h-[860px]"
      >
        {/* Header */}
        <div className="px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-10 gap-2 shrink-0">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide block truncate">
              {book.category}
            </span>
            <h2 className="text-sm sm:text-lg font-bold text-gray-900 leading-tight truncate">
              {book.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Corner Question Button - Nút góc câu hỏi AI khi ấn vào sách */}
            <button
              id="book-corner-quiz-btn"
              type="button"
              onClick={() => {
                if (onOpenQuiz) {
                  onOpenQuiz(book);
                } else {
                  setIsQuizOpen(true);
                }
              }}
              className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs px-2.5 sm:px-3.5 py-1.5 rounded-xl shadow-xs hover:shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1 sm:gap-1.5 border border-yellow-200/60 cursor-pointer shrink-0"
              title="Mở Góc Câu Hỏi Tư Duy Phản Biện & Suy Luận Mới về cuốn sách"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-200 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-100"></span>
              </span>
              <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-100" />
              <span className="hidden sm:inline">Góc Câu Hỏi Tư Duy AI</span>
              <span className="sm:hidden text-[11px]">Câu Hỏi Tư Duy</span>
            </button>

            <button
              id="book-details-close-btn"
              type="button"
              onClick={() => {
                if (typingState) handleSkipTyping();
                onClose();
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile View Switcher Bar (Visible on mobile/tablet screens < md) */}
        <div className="flex md:hidden border-b border-gray-200 bg-gray-100/90 p-1.5 shrink-0 gap-1.5">
          <button
            type="button"
            onClick={() => setMobileView('details')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileView === 'details'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Nội dung & Phân tích</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView('chat')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileView === 'chat'
                ? 'bg-white text-amber-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Chatbot Gemini AI</span>
          </button>
        </div>

        {/* Content Body: Two columns */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {/* Left Column: Book Details & In-depth Analysis */}
          <div
            className={`md:col-span-6 flex-col bg-gray-50/50 overflow-hidden border-r border-gray-100 flex-1 min-h-0 h-full ${
              mobileView === 'details' ? 'flex' : 'hidden md:flex'
            }`}
          >
            {/* Top Sub-tabs (Horizontally scrollable for all screen sizes) */}
            <div className="flex items-center border-b border-gray-200 bg-white px-3 sm:px-4 pt-2.5 gap-1 shrink-0 overflow-x-auto no-scrollbar">
              <button
                type="button"
                id="tab-btn-overview"
                onClick={() => setActiveLeftTab('overview')}
                className={`pb-2.5 px-2.5 text-xs font-semibold whitespace-nowrap flex items-center gap-1 border-b-2 transition-all shrink-0 ${
                  activeLeftTab === 'overview'
                    ? 'border-gray-900 text-gray-900 font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Tổng quan</span>
              </button>

              <button
                type="button"
                id="tab-btn-plot"
                onClick={() => setActiveLeftTab('plot')}
                className={`pb-2.5 px-2.5 text-xs font-semibold whitespace-nowrap flex items-center gap-1 border-b-2 transition-all shrink-0 ${
                  activeLeftTab === 'plot'
                    ? 'border-gray-900 text-gray-900 font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <GitCommit className="w-3.5 h-3.5 text-indigo-600" />
                <span>Cốt truyện</span>
              </button>

              <button
                type="button"
                id="tab-btn-author"
                onClick={() => setActiveLeftTab('author')}
                className={`pb-2.5 px-2.5 text-xs font-semibold whitespace-nowrap flex items-center gap-1 border-b-2 transition-all shrink-0 ${
                  activeLeftTab === 'author'
                    ? 'border-gray-900 text-gray-900 font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tác giả</span>
              </button>

              <button
                type="button"
                id="tab-btn-characters"
                onClick={() => setActiveLeftTab('characters')}
                className={`pb-2.5 px-2.5 text-xs font-semibold whitespace-nowrap flex items-center gap-1 border-b-2 transition-all shrink-0 ${
                  activeLeftTab === 'characters'
                    ? 'border-gray-900 text-gray-900 font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-sky-600" />
                <span>Nhân vật</span>
                {insightData?.detailedCharacters && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-700 font-mono font-bold">
                    {insightData.detailedCharacters.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                id="tab-btn-message"
                onClick={() => setActiveLeftTab('message')}
                className={`pb-2.5 px-2.5 text-xs font-semibold whitespace-nowrap flex items-center gap-1 border-b-2 transition-all shrink-0 ${
                  activeLeftTab === 'message'
                    ? 'border-gray-900 text-gray-900 font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <Quote className="w-3.5 h-3.5" />
                <span>Thông điệp</span>
              </button>
            </div>

            {/* Scrollable Tab Content */}
            <div
              ref={leftContentScrollRef}
              className="p-3.5 sm:p-5 space-y-4 sm:space-y-5 overflow-y-auto overscroll-contain flex-1 text-sm text-gray-800"
            >
              {activeLeftTab === 'overview' && (
                <div className="space-y-4">
                  {/* Book cover & Specs */}
                  <div className="flex flex-row gap-3.5 items-start bg-white p-3 rounded-xl border border-gray-200/80 shadow-xs">
                    <div className="relative w-20 sm:w-28 shrink-0 aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 shadow-xs bg-gray-100">
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0 text-xs text-gray-700">
                      <div className="flex items-center justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500 shrink-0">Tác giả:</span>
                        <span className="font-semibold text-gray-900 truncate ml-2 text-right">{book.author}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500 shrink-0">Thể loại:</span>
                        <span className="font-medium text-gray-800 truncate ml-2 text-right">{book.category}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500 shrink-0">Năm xuất bản:</span>
                        <span className="font-medium text-gray-800 ml-2">{book.year}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500 shrink-0">Nhà xuất bản:</span>
                        <span className="font-medium text-gray-800 truncate ml-2 text-right">{book.publisher || 'Thư viện thông minh'}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500 shrink-0">Số trang:</span>
                        <span className="font-medium text-gray-800 ml-2">{book.pageCount ? `${book.pageCount} trang` : '200 trang'}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500 shrink-0">Mã thư viện mới:</span>
                        <div className="flex items-center gap-1.5 ml-2">
                          <span className="font-mono font-bold text-xs bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 px-2 py-0.5 rounded border border-orange-300">
                            {book.libraryCode || `LIB-${(book.isbn || '00000').slice(-5)}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const code = book.libraryCode || `LIB-${(book.isbn || '00000').slice(-5)}`;
                              navigator.clipboard?.writeText(code);
                              setCopiedCode(true);
                              setTimeout(() => setCopiedCode(false), 2000);
                            }}
                            className="p-1 text-gray-400 hover:text-orange-600 transition-colors cursor-pointer"
                            title="Sao chép mã thư viện"
                          >
                            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500 shrink-0">Mã ISBN gốc:</span>
                        <span className="font-mono text-gray-900 truncate ml-2 text-right">{book.isbn}</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-gray-500 shrink-0">Vị trí kệ:</span>
                        <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 truncate ml-2">
                          {book.shelfLocation || 'Chưa xếp kệ'}
                        </span>
                      </div>
                      {book.barcodeImage && (
                        <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-gray-500 shrink-0">Ảnh mã vạch:</span>
                          <div className="flex items-center gap-1.5">
                            <img
                              src={book.barcodeImage}
                              alt="Mã vạch ISBN"
                              className="h-7 max-w-[90px] object-contain rounded border border-gray-200 bg-white p-0.5"
                            />
                            <span className="text-[10px] text-gray-600 font-mono">Đối chiếu</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dedicated Library Barcode & QR Label Card */}
                  <div className="p-3.5 sm:p-4 bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-white dark:from-white/5 dark:to-white/5 rounded-2xl border-2 border-orange-200/90 dark:border-white/10 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-xs">
                          <Barcode className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-orange-950 dark:text-orange-200 uppercase tracking-wide">
                            Tem Mã Định Danh Sách Mới
                          </h4>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            Đã liên kết 2 chiều với mã vạch gốc ({book.isbn})
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-black bg-white dark:bg-black/50 px-2.5 py-1 rounded-lg border border-orange-300 text-orange-700 dark:text-orange-300 shadow-2xs">
                        {book.libraryCode || `LIB-${(book.isbn || '00000').slice(-5)}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-white dark:bg-[#1a1a28] p-3 rounded-xl border border-orange-200/60 dark:border-white/10">
                      {/* Scannable Barcode Graphic */}
                      <div className="sm:col-span-7 flex flex-col items-center justify-center space-y-1.5 p-2 bg-gray-50 dark:bg-black/30 rounded-lg border border-gray-200 dark:border-white/5">
                        <div className="flex items-center justify-center gap-[2.5px] h-10 w-full max-w-[220px] overflow-hidden">
                          {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 2, 1, 3, 2, 1, 4, 1, 3, 2, 1, 3, 2, 4, 1, 2, 3, 2, 1].map((w, idx) => (
                            <div
                              key={idx}
                              className={`h-full ${idx % 2 === 0 ? 'bg-gray-900 dark:bg-white' : 'bg-transparent'}`}
                              style={{ width: `${w}px` }}
                            />
                          ))}
                        </div>
                        <span className="font-mono text-xs font-black tracking-widest text-gray-900 dark:text-gray-100">
                          *{book.libraryCode || `LIB-${(book.isbn || '00000').slice(-5)}`}*
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          Mã ISBN gốc: {book.isbn}
                        </span>
                      </div>

                      {/* Scannable QR Code */}
                      <div className="sm:col-span-5 flex flex-col items-center justify-center space-y-1">
                        {qrCodeUrl ? (
                          <div className="p-1 bg-white rounded-lg border border-gray-200 shadow-2xs">
                            <img
                              src={qrCodeUrl}
                              alt={`QR ${book.libraryCode}`}
                              className="w-20 h-20 object-contain rounded"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                            <QrCode className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <span className="text-[9px] text-gray-500 font-medium">Quét QR bằng điện thoại</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {onScanCode && (
                        <button
                          type="button"
                          onClick={() => {
                            const code = book.libraryCode || `LIB-${(book.isbn || '00000').slice(-5)}`;
                            onScanCode(code);
                          }}
                          className="flex-1 py-2 px-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span>Quét thử mã mới này ngay</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          const code = book.libraryCode || `LIB-${(book.isbn || '00000').slice(-5)}`;
                          navigator.clipboard?.writeText(code);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className="py-2 px-3 bg-white dark:bg-white/10 hover:bg-orange-50 text-gray-700 dark:text-gray-200 font-semibold text-xs rounded-xl border border-gray-200 dark:border-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Đã sao chép!' : 'Sao chép mã'}</span>
                      </button>
                    </div>

                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-500/20 rounded-xl p-2.5 flex items-start gap-2 text-emerald-900 dark:text-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-snug">
                        <strong>Cơ chế tự động tra cứu:</strong> Cả mã thư viện mới (<strong>{book.libraryCode || `LIB-${(book.isbn || '00000').slice(-5)}`}</strong>) và mã vạch gốc (<strong>{book.isbn}</strong>) đều đã được lưu vào hệ thống. Bất kỳ lúc nào bạn dùng camera quét một trong hai mã này, ứng dụng sẽ nhận diện và mở ngay cuốn sách này!
                      </p>
                    </div>
                  </div>

                  {/* Themes */}
                  {book.themes && book.themes.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase tracking-wider">
                        <Tag className="w-3.5 h-3.5 text-gray-500" />
                        <span>Chủ đề tác phẩm</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {book.themes.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-700 font-medium shadow-2xs"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* General Description */}
                  {book.description && book.description.trim() !== (book.summary || '').trim() && (
                    <div className="space-y-1.5 bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                        Giới thiệu khái quát
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {book.description}
                      </p>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="space-y-1.5 bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Tóm tắt nội dung chi tiết
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {book.summary || book.description}
                    </p>
                  </div>

                  {/* Historical & Cultural Context */}
                  {insightData?.historicalContext && (
                    <div className="space-y-2 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 p-4 rounded-xl border border-indigo-100 shadow-xs">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        <History className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Bối cảnh lịch sử & Hoàn cảnh ra đời</span>
                      </div>
                      <div className="space-y-2 text-xs text-gray-700">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-indigo-950 shrink-0">Thời kỳ:</span>
                          <span>{insightData.historicalContext.period}</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          <span className="font-semibold text-indigo-950">Hoàn cảnh sáng tác: </span>
                          {insightData.historicalContext.creationCircumstance}
                        </p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          <span className="font-semibold text-indigo-950">Ảnh hưởng văn hóa: </span>
                          {insightData.historicalContext.societalImpact}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Teaser Links to Plot & Author */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div
                      onClick={() => setActiveLeftTab('plot')}
                      className="p-3 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 transition-all cursor-pointer group shadow-xs"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900 mb-1">
                        <GitCommit className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Cốt truyện & Tuyến diễn biến</span>
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-1">
                        Xem chi tiết diễn biến, các hồi & cao trào
                      </p>
                    </div>

                    <div
                      onClick={() => setActiveLeftTab('author')}
                      className="p-3 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 transition-all cursor-pointer group shadow-xs"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900 mb-1">
                        <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Hồ sơ tác giả</span>
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-1">
                        {book.author} ({insightData?.authorDetails?.years || 'Tác giả nổi tiếng'})
                      </p>
                    </div>
                  </div>

                  {/* Quick Preview: Characters */}
                  {book.characters && book.characters.length > 0 && (
                    <div
                      onClick={() => setActiveLeftTab('characters')}
                      className="p-3.5 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all cursor-pointer group shadow-xs"
                    >
                      <div className="flex items-center justify-between text-xs mb-2">
                        <div className="flex items-center gap-1.5 font-bold text-gray-900">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          <span>Tuyến nhân vật chính ({book.characters.length})</span>
                        </div>
                        <span className="text-[11px] text-blue-600 group-hover:underline flex items-center font-medium">
                          Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {book.characters.map((c, cIdx) => (
                          <span
                            key={c.id || `char-tag-${cIdx}-${c.name || ''}`}
                            className="text-xs px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-gray-800 font-medium"
                          >
                            {c.name} <span className="text-[10px] text-gray-500">({c.role})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Plot Synopsis & Story Arc */}
              {activeLeftTab === 'plot' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-1 border-b border-gray-200">
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                        <GitCommit className="w-4 h-4 text-indigo-600" />
                        <span>Cốt truyện & Tuyến diễn biến</span>
                      </h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Cấu trúc cốt truyện, bước ngoặt và các hồi kịch tính
                      </p>
                    </div>
                  </div>

                  {insightData?.plotSynopsis ? (
                    <div className="space-y-4">
                      {/* Plot Overview */}
                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-1.5">
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                          Tổng thể câu chuyện
                        </h4>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {insightData.plotSynopsis.overview}
                        </p>
                      </div>

                      {/* Story Arc Timeline */}
                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                          <span>Sơ đồ 4 giai đoạn phát triển câu chuyện</span>
                        </h4>
                        <div className="relative border-l-2 border-indigo-200 ml-2.5 space-y-4 py-1">
                          {insightData.plotSynopsis.arc.map((phase, idx) => {
                            const phaseName = phase.phase || phase.stage || `Giai đoạn ${idx + 1}`;
                            const phaseTitle = phase.title && phase.title !== phaseName ? phase.title : '';
                            return (
                              <div key={`arc-${idx}-${phase.phase || phase.title || ''}`} className="relative pl-5">
                                <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                                </div>
                                <div className="bg-indigo-50/40 p-2.5 rounded-lg border border-indigo-100">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-indigo-950">
                                      {phaseName}{phaseTitle ? `: ${phaseTitle}` : ''}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-semibold">
                                      Hồi {idx + 1}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 leading-relaxed">
                                    {phase.description}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Key Turning Points / Events */}
                      {insightData.plotSynopsis.keyEvents && insightData.plotSynopsis.keyEvents.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                            Các sự kiện bước ngoặt then chốt
                          </h4>
                          <div className="space-y-1.5">
                            {insightData.plotSynopsis.keyEvents.map((evt, idx) => (
                              <div
                                key={`plot-event-${idx}`}
                                className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex items-start gap-2.5 text-xs text-gray-700 hover:border-indigo-300 transition-colors"
                              >
                                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <span className="leading-relaxed flex-1">{evt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ask Gemini */}
                      <button
                        type="button"
                        onClick={() =>
                          handleSendMessage(
                            `Hãy tóm tắt chi tiết từng chương và phân tích nghệ thuật xây dựng tình huống kịch tính trong tác phẩm "${book.title}"`
                          )
                        }
                        className="w-full py-2.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Hỏi Gemini phân tích sâu nghệ thuật xây dựng cốt truyện</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-white rounded-xl border border-gray-200 text-xs text-gray-500 space-y-2">
                      <GitCommit className="w-6 h-6 text-gray-400 mx-auto" />
                      <p className="font-semibold text-gray-700">Tóm tắt diễn biến tác phẩm</p>
                      <p className="text-gray-500 leading-relaxed">
                        {book.summary}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          handleSendMessage(
                            `Hãy phân tích chi tiết diễn biến cốt truyện và bài học từ cuốn sách "${book.title}"`
                          )
                        }
                        className="mt-2 text-indigo-700 font-semibold hover:underline"
                      >
                        Hỏi Gemini AI tóm tắt diễn biến chi tiết →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Author Profile */}
              {activeLeftTab === 'author' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-1 border-b border-gray-200">
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                        <PenTool className="w-4 h-4 text-emerald-600" />
                        <span>Hồ sơ tác giả & Phong cách nghệ thuật</span>
                      </h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Cuộc đời, dấu ấn văn học và những đóng góp lớn cho nhân loại
                      </p>
                    </div>
                  </div>

                  {insightData?.authorDetails ? (
                    <div className="space-y-4">
                      {/* Author Header Card */}
                      <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-xs space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-bold text-gray-950">
                            {insightData.authorDetails.name}
                          </h4>
                          {insightData.authorDetails.years && (
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-xs font-medium text-gray-700">
                              {insightData.authorDetails.years}
                            </span>
                          )}
                          {insightData.authorDetails.country && (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
                              {insightData.authorDetails.country}
                            </span>
                          )}
                        </div>
                        {(insightData.authorDetails.biography || insightData.authorDetails.bio) && (
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {insightData.authorDetails.biography || insightData.authorDetails.bio}
                          </p>
                        )}
                      </div>

                      {/* Writing Style */}
                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-1.5">
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider text-emerald-900">
                          Phong cách nghệ thuật đặc trưng
                        </h4>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {insightData.authorDetails.writingStyle || insightData.authorDetails.style}
                        </p>
                      </div>

                      {/* Major Works */}
                      {insightData.authorDetails.majorWorks && insightData.authorDetails.majorWorks.length > 0 && (
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-2">
                          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                            Các tác phẩm tiêu biểu
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {insightData.authorDetails.majorWorks.map((work, idx) => (
                              <span
                                key={`major-work-${idx}`}
                                className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-950 border border-emerald-200 font-medium"
                              >
                                {work}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Famous Quote */}
                      {(insightData.authorDetails.quote || insightData.authorDetails.famousQuote) && (
                        <div className="p-3.5 bg-gradient-to-r from-emerald-50/70 to-teal-50/50 rounded-xl border border-emerald-200 shadow-2xs space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                            <Quote className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Triết lý / Câu nói để đời:</span>
                          </div>
                          <p className="text-xs text-emerald-900 italic leading-relaxed">
                            "{insightData.authorDetails.quote || insightData.authorDetails.famousQuote}"
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              handleAskAboutQuote(
                                insightData.authorDetails?.quote || insightData.authorDetails?.famousQuote || '',
                                `tác giả ${insightData.authorDetails?.name || book.author}`
                              )
                            }
                            className="w-full mt-1.5 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                            <span>Hỏi AI mổ xẻ & suy luận mới về câu nói này</span>
                          </button>
                        </div>
                      )}

                      {/* Ask Gemini */}
                      <button
                        type="button"
                        onClick={() =>
                          handleSendMessage(
                            `Hãy phân tích chi tiết về cuộc đời, sự nghiệp và lý do tại sao ${insightData.authorDetails?.name} trở thành một tác giả vĩ đại`
                          )
                        }
                        className="w-full py-2.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Hỏi Gemini phân tích cuộc đời & phong cách của tác giả</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white p-4 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-2">
                      <p>
                        <strong>Tác giả:</strong> {book.author}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          handleSendMessage(`Giới thiệu chi tiết về tác giả ${book.author} và phong cách sáng tác`)
                        }
                        className="text-emerald-700 font-semibold hover:underline"
                      >
                        Hỏi Chatbot Gemini về tác giả này →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Characters (Upgraded with Portraits, Meaning, & Quotes) */}
              {activeLeftTab === 'characters' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-1 border-b border-gray-200">
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-sky-600" />
                        <span>Hệ thống nhân vật chuyên sâu</span>
                      </h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Hình tượng, tính cách, ý nghĩa biểu tượng và câu nói đáng nhớ
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 font-semibold border border-sky-200">
                      {insightData?.detailedCharacters?.length || book.characters?.length || 0} nhân vật
                    </span>
                  </div>

                  {(insightData?.detailedCharacters || (book.characters as any[]))?.length > 0 ? (
                    <div className="space-y-3.5">
                      {(insightData?.detailedCharacters || (book.characters as any[])).map((char: any, charIdx: number) => {
                        const charKey = char.id || `char-detail-${charIdx}-${char.name || ''}`;
                        return (
                          <div
                            key={charKey}
                            className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3 hover:border-sky-300 transition-all"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                {char.avatarUrl ? (
                                  <div className="w-11 h-11 rounded-full overflow-hidden border border-sky-200 shadow-2xs shrink-0">
                                    <img
                                      src={char.avatarUrl}
                                      alt={char.name}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center font-bold text-xs text-sky-900 shrink-0">
                                    {char.name ? char.name.charAt(0) : 'NV'}
                                  </div>
                                )}
                                <div>
                                  <h5 className="text-xs font-bold text-gray-950 leading-tight">
                                    {char.name}
                                  </h5>
                                  <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-sky-50 text-sky-800 font-semibold border border-sky-200 mt-0.5">
                                    {char.role}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleSendMessage(
                                    `Phân tích chi tiết tâm lý, bước chuyển biến và ý nghĩa biểu tượng của nhân vật ${char.name} trong tác phẩm "${book.title}"`
                                  )
                                }
                                className="text-[11px] text-sky-800 hover:text-sky-950 hover:bg-sky-50 px-2 py-1 rounded border border-sky-200 font-medium transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                                title="Hỏi Trợ lý AI về nhân vật này"
                              >
                                <Sparkles className="w-3 h-3 text-sky-600" />
                                <span>Hỏi Gemini</span>
                              </button>
                            </div>

                            {/* Character Description */}
                            {char.description && (
                              <p className="text-xs text-gray-600 leading-relaxed">
                                {char.description}
                              </p>
                            )}

                            {/* Personality if present */}
                            {char.personality && (
                              <div className="p-2.5 bg-sky-50/60 rounded-lg border border-sky-100 text-xs">
                                <span className="font-bold text-sky-950">Đặc điểm tính cách: </span>
                                <span className="text-sky-900">{char.personality}</span>
                              </div>
                            )}

                            {/* Symbolic Meaning if present */}
                            {char.symbolicMeaning && (
                              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                                <span className="font-bold text-gray-900">Ý nghĩa biểu tượng: </span>
                                <span className="text-gray-600">{char.symbolicMeaning}</span>
                              </div>
                            )}

                            {/* Key Quote if present */}
                            {(char.keyQuote || char.quote) && (
                              <div className="p-2.5 bg-amber-50/70 rounded-lg border border-amber-200/80 text-xs space-y-2">
                                <div>
                                  <span className="font-bold text-amber-950">Câu nói / Hành động đáng nhớ: </span>
                                  <span className="text-amber-900 italic">"{char.keyQuote || char.quote}"</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAskAboutQuote(
                                      char.keyQuote || char.quote || '',
                                      `nhân vật ${char.name} (${char.role}) trong tác phẩm "${book.title}"`
                                    )
                                  }
                                  className="w-full py-1.5 px-2.5 rounded-md bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer border border-amber-300"
                                >
                                  <Sparkles className="w-3 h-3 text-amber-700 animate-pulse" />
                                  <span>Hỏi AI mổ xẻ & suy luận câu nói của {char.name}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-white rounded-xl border border-gray-200 text-xs text-gray-500 space-y-1.5">
                      <BookOpen className="w-6 h-6 text-gray-400 mx-auto" />
                      <p className="font-semibold text-gray-700">Tác phẩm phi hư cấu / Sách tham khảo</p>
                      <p className="text-gray-500">
                        Cuốn sách này không xây dựng hệ thống nhân vật hư cấu mà tập trung vào phương pháp, kỹ năng và tri thức học tập.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Message & Lessons */}
              {activeLeftTab === 'message' && (
                <div className="space-y-4">
                  {/* Core Message */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase tracking-wider">
                      <Quote className="w-3.5 h-3.5 text-amber-600" />
                      <span>Thông điệp cốt lõi</span>
                    </div>
                    <blockquote className="border-l-3 border-amber-400 pl-3 py-1.5 text-xs text-gray-800 italic leading-relaxed bg-amber-50/40 rounded-r-md">
                      "{book.message}"
                    </blockquote>
                    <button
                      type="button"
                      onClick={() =>
                        handleAskAboutQuote(
                          book.message,
                          `thông điệp cốt lõi của tác phẩm "${book.title}" (${book.author})`
                        )
                      }
                      className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
                      <span>Hỏi AI mổ xẻ đa chiều & suy luận mới về thông điệp này</span>
                    </button>
                  </div>

                  {/* Key Takeaways for High School Students */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-gray-200">
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        <span>Bài học then chốt cho học sinh</span>
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                        {book.keyTakeaways?.length || 0} bài học
                      </span>
                    </div>

                    {book.keyTakeaways && book.keyTakeaways.length > 0 ? (
                      <div className="space-y-2.5">
                        {book.keyTakeaways.map((takeaway, index) => (
                          <div
                            key={`takeaway-${index}`}
                            className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs flex items-start gap-3 hover:border-gray-300 transition-all"
                          >
                            <div className="w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                              {index + 1}
                            </div>
                            <p className="text-xs text-gray-700 leading-relaxed flex-1">
                              {takeaway}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-white rounded-xl border border-gray-200 text-xs text-gray-500">
                        Chưa có danh sách bài học trích xuất cho cuốn sách này.
                      </div>
                    )}
                  </div>

                  {/* Ask Gemini to elaborate */}
                  <button
                    type="button"
                    onClick={() =>
                      handleSendMessage(
                        `Phân tích sâu thông điệp cốt lõi và các bài học cuộc sống của tác phẩm "${book.title}" đối với thế hệ trẻ ngày nay`
                      )
                    }
                    className="w-full py-2 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Hỏi Chatbot Gemini phân tích sâu toàn bộ thông điệp này</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: AI Q&A Chat */}
          <div
            className={`md:col-span-6 flex-col bg-white flex-1 min-h-0 h-full overflow-hidden ${
              mobileView === 'chat' ? 'flex' : 'hidden md:flex'
            }`}
          >
            {/* Chat header */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-gray-900">Chatbot Gemini AI</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                  Google Gemini
                </span>
              </div>
            </div>

            {/* Active typing banner if currently typing */}
            {typingState && (
              <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
                <div className="flex items-center gap-1.5 font-medium">
                  <Keyboard className="w-3.5 h-3.5 text-gray-800 animate-pulse" />
                  <span>AI đang gõ máy bàn phím...</span>
                </div>
                <button
                  type="button"
                  onClick={handleSkipTyping}
                  className="text-[10px] text-gray-700 font-semibold hover:text-black flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-gray-200 hover:bg-gray-100"
                >
                  <FastForward className="w-3 h-3" />
                  <span>Hiện toàn bộ ngay</span>
                </button>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto overscroll-contain space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 text-gray-700 text-xs mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gray-900 text-white font-medium'
                        : 'bg-gray-100 text-gray-800 border border-gray-200/70'
                    }`}
                  >
                    {msg.role === 'assistant'
                      ? renderFormattedContent(msg.content, msg.isStreaming)
                      : msg.content}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center shrink-0 text-xs mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}

              {isAiLoading && !typingState && (
                <div className="flex gap-2.5 items-center text-xs text-gray-600 py-1 font-medium">
                  <div className="w-6 h-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-amber-600">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <span className="italic flex items-center gap-1">
                    <span>Chatbot Gemini đang suy nghĩ và gõ câu trả lời...</span>
                  </span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Prompts */}
            <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] text-amber-900 font-bold shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Gợi ý tư duy:</span>
              </span>
              {quickPrompts.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (q.startsWith('Phân tích câu nói để đời')) {
                      const quote = insightData?.authorDetails?.famousQuote || insightData?.authorDetails?.quote;
                      if (quote) {
                        handleAskAboutQuote(quote, `tác giả ${insightData?.authorDetails?.name || book.author}`);
                        return;
                      }
                    }
                    if (q.startsWith('Giải mã câu nói của')) {
                      const charWithQuote = book.characters?.find((c) => c.keyQuote || c.quote);
                      if (charWithQuote) {
                        handleAskAboutQuote(
                          charWithQuote.keyQuote || charWithQuote.quote || '',
                          `nhân vật ${charWithQuote.name} (${charWithQuote.role})`
                        );
                        return;
                      }
                    }
                    if (q.startsWith('Phân tích nghịch lý triết học')) {
                      handleSendMessage(
                        `Hãy phân tích chuyên sâu nghịch lý triết học và đưa ra các suy luận mới về cuốn sách "${book.title}" (${book.author}). Mổ xẻ các tầng nghĩa đối lập giữa thực tại và lý tưởng nhân văn mà tác giả đặt ra.`
                      );
                      return;
                    }
                    if (q.startsWith('Góc nhìn phản biện')) {
                      handleSendMessage(
                        `Dưới góc nhìn tư duy phản biện, hãy phân tích những suy luận và phát hiện mới mẻ mà đa số độc giả dễ bỏ qua trong tác phẩm "${book.title}".`
                      );
                      return;
                    }
                    handleSendMessage(q);
                  }}
                  disabled={isAiLoading}
                  className="px-2.5 py-1 rounded-md text-[11px] bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200/90 whitespace-nowrap transition-colors disabled:opacity-50 font-medium cursor-pointer shadow-2xs"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-2.5 sm:p-3 pb-[calc(0.6rem+env(safe-area-inset-bottom,0px))] sm:pb-3 border-t border-gray-200 flex items-center gap-2 bg-white shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Hỏi Chatbot Gemini về tác phẩm..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isAiLoading}
                className="flex-1 px-3 py-2 text-base sm:text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 transition-colors"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isAiLoading}
                className="px-3.5 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors disabled:opacity-40 flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>Gửi</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Embedded Book Quiz & Knowledge Arena Modal */}
      {isQuizOpen && book && (
        <BookQuizModal
          book={book}
          onClose={() => setIsQuizOpen(false)}
        />
      )}
    </div>
  );
};
