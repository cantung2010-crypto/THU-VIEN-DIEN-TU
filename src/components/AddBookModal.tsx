import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Barcode,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  Building,
  Sparkles,
  RefreshCw,
  ScanLine,
  User,
  Tag,
  Link as LinkIcon,
  Users,
  GitCommit,
  PenTool,
  Plus,
  Trash2,
  Globe,
  Quote,
  ExternalLink,
  Clock,
  Edit3,
  Database,
  Save,
} from 'lucide-react';
import { Book, Category, Character, StoryArcPhase, PlotSynopsis, AuthorDetails, HistoricalContext } from '../types.js';
import { getEnrichedBookDetails } from '../data/bookDetailedInsights.js';
import { BarcodeScannerModal } from './BarcodeScannerModal.js';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onBookAdded: (book: Book) => void;
  onBookUpdated?: (book: Book) => void;
  initialIsbn?: string;
  initialBook?: Book | null;
}

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80';

export const AddBookModal: React.FC<AddBookModalProps> = ({
  isOpen,
  onClose,
  categories,
  onBookAdded,
  onBookUpdated,
  initialIsbn,
  initialBook,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!initialBook;

  // Form states
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Văn học');
  const [customCategory, setCustomCategory] = useState('');
  const [isbn, setIsbn] = useState(initialIsbn || '');
  const [libraryCode, setLibraryCode] = useState('');
  const [shelfLocation, setShelfLocation] = useState('');
  const [publisher, setPublisher] = useState('');
  const [year, setYear] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [description, setDescription] = useState('');
  const [summary, setSummary] = useState('');
  const [message, setMessage] = useState('');

  // Form states - Detailed Characters List
  const [characters, setCharacters] = useState<Character[]>([
    {
      id: 'char-1',
      name: '',
      role: '',
      description: '',
      personality: '',
      symbolicMeaning: '',
      keyQuote: '',
    },
  ]);

  // Form states - Plot & Story Arc
  const [plotOverview, setPlotOverview] = useState('');
  const [storyArcPhases, setStoryArcPhases] = useState<StoryArcPhase[]>([
    { phase: 'Mở đầu', title: '', description: '' },
    { phase: 'Biến cố', title: '', description: '' },
    { phase: 'Cao trào', title: '', description: '' },
    { phase: 'Mở nút & Kết thúc', title: '', description: '' },
  ]);
  const [keyPlotEvents, setKeyPlotEvents] = useState<string[]>(['', '']);

  // Form states - Author Profile
  const [authorBio, setAuthorBio] = useState('');
  const [authorYears, setAuthorYears] = useState('');
  const [authorCountry, setAuthorCountry] = useState('');
  const [authorWritingStyle, setAuthorWritingStyle] = useState('');
  const [authorFamousQuote, setAuthorFamousQuote] = useState('');

  // Form states - Historical Context
  const [historicalPeriod, setHistoricalPeriod] = useState('');
  const [historicalCircumstance, setHistoricalCircumstance] = useState('');
  const [historicalSocietalImpact, setHistoricalSocietalImpact] = useState('');

  // Grounded search sources returned by Google Search
  const [searchSources, setSearchSources] = useState<Array<{ title?: string; uri?: string }>>([]);

  // Active sub-section under Literary Content
  const [activeContentTab, setActiveContentTab] = useState<'summary' | 'characters' | 'plot' | 'author' | 'history'>('summary');

  // Cover image states
  const [coverImage, setCoverImage] = useState(DEFAULT_COVER);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Barcode scanner states
  const [isLiveScannerOpen, setIsLiveScannerOpen] = useState(false);
  const [isScanningCover, setIsScanningCover] = useState(false);

  // AI Auto-completion state
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiSuccessNotice, setAiSuccessNotice] = useState<string | null>(null);

  // Submission & UI feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initialBook or initialIsbn when modal opens
  React.useEffect(() => {
    if (!isOpen) return;

    if (initialBook) {
      setTitle(initialBook.title || '');
      setAuthor(initialBook.author || '');

      const foundCat = categories.find((c) => c.name === initialBook.category);
      if (foundCat) {
        setCategory(initialBook.category);
        setCustomCategory('');
      } else {
        setCategory('Khác');
        setCustomCategory(initialBook.category || '');
      }

      setIsbn(initialBook.isbn || '');
      setLibraryCode(initialBook.libraryCode || '');
      setShelfLocation(initialBook.shelfLocation || '');
      setPublisher(initialBook.publisher || '');
      setYear(initialBook.year ? initialBook.year.toString() : '');
      setPageCount(initialBook.pageCount ? initialBook.pageCount.toString() : '');
      setDescription(initialBook.description || '');
      setSummary(initialBook.summary || initialBook.description || '');
      setMessage(initialBook.message || '');
      setCoverImage(initialBook.coverImage || DEFAULT_COVER);

      // Get full enriched data (characters, plot, author, history) to ensure 100% sync with Book Details
      const enriched = getEnrichedBookDetails(initialBook);

      // Characters
      if (initialBook.characters && initialBook.characters.length > 0) {
        setCharacters(initialBook.characters);
      } else if (enriched.detailedCharacters && enriched.detailedCharacters.length > 0) {
        setCharacters(
          enriched.detailedCharacters.map((c, i) => ({
            id: c.id || `char-${i}`,
            name: c.name,
            role: c.role,
            description: c.description,
            personality: c.personality || '',
            symbolicMeaning: c.symbolicMeaning || '',
            keyQuote: c.keyQuote || c.quote || '',
            avatarUrl: c.avatarUrl || c.avatar,
          }))
        );
      } else {
        setCharacters([
          {
            id: 'char-1',
            name: '',
            role: '',
            description: '',
            personality: '',
            symbolicMeaning: '',
            keyQuote: '',
          },
        ]);
      }

      // Plot synopsis
      const plot = initialBook.plotSynopsis || enriched.plotSynopsis;
      if (plot) {
        setPlotOverview(plot.overview || initialBook.summary || initialBook.description || '');
        if (plot.arc && plot.arc.length > 0) {
          setStoryArcPhases(
            plot.arc.map((a) => ({
              phase: a.phase || (a as any).stage || 'Diễn biến',
              title: a.title || '',
              description: a.description || '',
            }))
          );
        } else {
          setStoryArcPhases([
            { phase: 'Mở đầu', title: '', description: '' },
            { phase: 'Biến cố', title: '', description: '' },
            { phase: 'Cao trào', title: '', description: '' },
            { phase: 'Mở nút & Kết thúc', title: '', description: '' },
          ]);
        }
        if (plot.keyEvents && plot.keyEvents.length > 0) {
          setKeyPlotEvents(plot.keyEvents);
        } else {
          setKeyPlotEvents(
            initialBook.keyTakeaways && initialBook.keyTakeaways.length > 0
              ? initialBook.keyTakeaways
              : ['', '']
          );
        }
      } else {
        setPlotOverview('');
        setStoryArcPhases([
          { phase: 'Mở đầu', title: '', description: '' },
          { phase: 'Biến cố', title: '', description: '' },
          { phase: 'Cao trào', title: '', description: '' },
          { phase: 'Mở nút & Kết thúc', title: '', description: '' },
        ]);
        setKeyPlotEvents(['', '']);
      }

      // Author details
      const author = initialBook.authorDetails || enriched.authorDetails;
      if (author) {
        setAuthorBio(author.bio || (author as any).biography || '');
        setAuthorYears(author.years || '');
        setAuthorCountry(author.country || '');
        setAuthorWritingStyle(author.writingStyle || (author as any).style || '');
        setAuthorFamousQuote(author.famousQuote || (author as any).quote || '');
      } else {
        setAuthorBio('');
        setAuthorYears('');
        setAuthorCountry('');
        setAuthorWritingStyle('');
        setAuthorFamousQuote('');
      }

      // Historical context
      const hist = initialBook.historicalContext || enriched.historicalContext;
      if (hist) {
        setHistoricalPeriod(hist.period || '');
        setHistoricalCircumstance(hist.creationCircumstance || '');
        setHistoricalSocietalImpact(hist.societalImpact || '');
      } else {
        setHistoricalPeriod('');
        setHistoricalCircumstance('');
        setHistoricalSocietalImpact('');
      }

      setErrorMessage(null);
      setAiSuccessNotice(null);
    } else {
      // Reset form to blank when adding a new book
      setTitle('');
      setAuthor('');
      setCategory(categories[0]?.name || 'Văn học');
      setCustomCategory('');
      const baseIsbn = initialIsbn || '';
      setIsbn(baseIsbn);
      const cleanDigits = baseIsbn.replace(/[^0-9]/g, '');
      const suffix = cleanDigits.length >= 4 ? cleanDigits.slice(-5) : Math.floor(10000 + Math.random() * 90000).toString();
      setLibraryCode(`LIB-${suffix}`);
      setShelfLocation('');
      setPublisher('');
      setYear('');
      setPageCount('');
      setDescription('');
      setSummary('');
      setMessage('');
      setCoverImage(DEFAULT_COVER);
      setCharacters([
        {
          id: 'char-1',
          name: '',
          role: '',
          description: '',
          personality: '',
          symbolicMeaning: '',
          keyQuote: '',
        },
      ]);
      setPlotOverview('');
      setStoryArcPhases([
        { phase: 'Mở đầu', title: '', description: '' },
        { phase: 'Biến cố', title: '', description: '' },
        { phase: 'Cao trào', title: '', description: '' },
        { phase: 'Mở nút & Kết thúc', title: '', description: '' },
      ]);
      setKeyPlotEvents(['', '']);
      setAuthorBio('');
      setAuthorYears('');
      setAuthorCountry('');
      setAuthorWritingStyle('');
      setAuthorFamousQuote('');
      setHistoricalPeriod('');
      setHistoricalCircumstance('');
      setHistoricalSocietalImpact('');
      setSearchSources([]);
      setErrorMessage(null);
      setAiSuccessNotice(null);
    }
  }, [isOpen, initialBook, initialIsbn]);

  if (!isOpen) return null;

  // Handle Cover image file upload (converts to base64 Data URL)
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Kích thước tệp ảnh tối đa là 5MB.');
      return;
    }

    setIsUploadingImage(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCoverImage(reader.result);
      }
      setIsUploadingImage(false);
    };
    reader.onerror = () => {
      setErrorMessage('Không thể đọc tệp hình ảnh. Vui lòng thử lại.');
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  // Scan and analyze ISBN numbers directly from current cover/back-cover image
  const handleScanCoverForIsbn = async () => {
    if (!coverImage) {
      setErrorMessage('Vui lòng tải ảnh bìa hoặc ảnh mã vạch trước khi quét.');
      return;
    }

    setIsScanningCover(true);
    setErrorMessage(null);
    setAiSuccessNotice(null);

    try {
      // 1. First try instant client-side ZXing decoding
      try {
        const reader = new BrowserMultiFormatReader();
        const zxingRes = await reader.decodeFromImageUrl(coverImage);
        if (zxingRes && zxingRes.getText()) {
          const clean = zxingRes.getText().replace(/[^0-9X]/gi, '').toUpperCase();
          if (clean.length >= 8) {
            setIsbn(clean);
            setAiSuccessNotice(`✓ Đã nhận diện trực tiếp số ISBN: ${clean}`);
            setIsScanningCover(false);
            return;
          }
        }
      } catch {
        // Fallback to server AI analysis
      }

      const res = await fetch('/api/barcode/read-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: coverImage }),
      });

      const data = await res.json();
      if (data.success && data.isbn) {
        setIsbn(data.isbn);
        setAiSuccessNotice(`✓ Đã phân tích thành công số ISBN: ${data.isbn}`);
        if (data.bookTitle && !title.trim()) {
          setTitle(data.bookTitle);
        }
      } else {
        setErrorMessage(data.message || 'Không tìm thấy dãy số mã vạch từ ảnh bìa này. Bạn có thể mở máy ảnh quét trực tiếp.');
      }
    } catch (err: any) {
      setErrorMessage('Lỗi khi phân tích mã vạch từ ảnh bìa.');
    } finally {
      setIsScanningCover(false);
    }
  };

  const isContentUnlocked = Boolean(title.trim() && author.trim());

  // AI Auto-completion of book metadata & content
  const handleAiAutoComplete = async () => {
    if (!title.trim() || !author.trim()) {
      setErrorMessage(
        'Vui lòng nhập Tên sách và Tác giả ở trên trước khi yêu cầu AI viết nội dung!'
      );
      return;
    }

    setIsAiGenerating(true);
    setErrorMessage(null);
    setAiSuccessNotice(null);

    try {
      const res = await fetch('/api/ai/auto-complete-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim(),
          publisher: publisher.trim(),
          category: category === 'Khác' ? customCategory : category,
          coverImage,
          isbn: isbn.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.book) {
        const b = data.book;
        if (b.publisher && !publisher.trim()) setPublisher(b.publisher);
        if (b.category && category === 'Văn học') {
          const matchCat = categories.find(
            (c) => c.name.toLowerCase() === b.category.toLowerCase()
          );
          if (matchCat) {
            setCategory(matchCat.name);
          } else {
            setCategory('Khác');
            setCustomCategory(b.category);
          }
        }
        if (b.year && !year) setYear(b.year.toString());
        if (b.pageCount && !pageCount) setPageCount(b.pageCount.toString());
        if (b.shelfLocation && !shelfLocation) setShelfLocation(b.shelfLocation);
        if (b.description) setDescription(b.description);
        if (b.summary) setSummary(b.summary);
        if (b.message) setMessage(b.message);
        if (b.isbn && !isbn.trim()) setIsbn(b.isbn);

        // Populate Characters if returned
        if (Array.isArray(b.characters) && b.characters.length > 0) {
          setCharacters(b.characters);
        }

        // Populate Plot Synopsis if returned
        if (b.plotSynopsis) {
          if (b.plotSynopsis.overview) setPlotOverview(b.plotSynopsis.overview);
          if (Array.isArray(b.plotSynopsis.arc) && b.plotSynopsis.arc.length > 0) {
            setStoryArcPhases(b.plotSynopsis.arc);
          }
          if (Array.isArray(b.plotSynopsis.keyEvents) && b.plotSynopsis.keyEvents.length > 0) {
            setKeyPlotEvents(b.plotSynopsis.keyEvents);
          }
        }

        // Populate Author details if returned
        if (b.authorDetails) {
          if (b.authorDetails.bio) setAuthorBio(b.authorDetails.bio);
          if (b.authorDetails.years) setAuthorYears(b.authorDetails.years);
          if (b.authorDetails.country) setAuthorCountry(b.authorDetails.country);
          if (b.authorDetails.writingStyle) setAuthorWritingStyle(b.authorDetails.writingStyle);
          if (b.authorDetails.famousQuote) setAuthorFamousQuote(b.authorDetails.famousQuote);
        }

        // Store Grounded Search Sources
        if (Array.isArray(b.sources)) {
          setSearchSources(b.sources);
        }

        setAiSuccessNotice(
          `✓ AI đã tra cứu Google Search từ các nguồn văn học uy tín và tổng hợp đầy đủ cốt truyện, nhân vật, tác giả và nội dung!`
        );
      } else {
        throw new Error(data.error || 'Không thể tự động viết nội dung sách');
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Có lỗi xảy ra khi gọi AI tự động viết nội dung. Vui lòng thử lại.'
      );
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Character management helpers
  const handleAddCharacter = () => {
    setCharacters((prev) => [
      ...prev,
      {
        id: `char-${Date.now()}`,
        name: '',
        role: '',
        description: '',
        personality: '',
        symbolicMeaning: '',
        keyQuote: '',
      },
    ]);
  };

  const handleUpdateCharacter = (index: number, field: keyof Character, value: string) => {
    setCharacters((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveCharacter = (index: number) => {
    if (characters.length <= 1) return;
    setCharacters((prev) => prev.filter((_, i) => i !== index));
  };

  // Story Arc Phase helper
  const handleUpdateStoryArc = (index: number, field: 'title' | 'description', value: string) => {
    setStoryArcPhases((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Key Event helper
  const handleUpdateKeyEvent = (index: number, value: string) => {
    setKeyPlotEvents((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleAddKeyEvent = () => {
    setKeyPlotEvents((prev) => [...prev, '']);
  };

  const handleRemoveKeyEvent = (index: number) => {
    if (keyPlotEvents.length <= 1) return;
    setKeyPlotEvents((prev) => prev.filter((_, i) => i !== index));
  };

  // Generate random ISBN helper
  const handleGenerateIsbn = () => {
    const generated = `978604${Math.floor(1000000 + Math.random() * 9000000)}`;
    setIsbn(generated);
    if (!libraryCode || libraryCode.startsWith('LIB-')) {
      setLibraryCode(`LIB-${generated.slice(-5)}`);
    }
  };

  // Generate new Library Code helper
  const handleGenerateLibraryCode = () => {
    const suffix = Math.floor(10000 + Math.random() * 90000);
    setLibraryCode(`LIB-${suffix}`);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tên sách.');
      return;
    }
    if (!author.trim()) {
      setErrorMessage('Vui lòng nhập tên tác giả.');
      return;
    }

    const finalCategory = category === 'Khác' ? customCategory.trim() || 'Khác' : category;
    const finalIsbn = isbn.trim() || `978604${Date.now().toString().slice(-7)}`;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Filter out empty characters
      const filteredCharacters = characters.filter((c) => c.name.trim() !== '');

      // Build plotSynopsis if any data is present
      const validPlotArc = storyArcPhases.filter((p) => p.title.trim() || p.description.trim());
      const validKeyEvents = keyPlotEvents.filter((ev) => ev.trim() !== '');

      const plotSynopsis: PlotSynopsis | undefined =
        plotOverview.trim() || validPlotArc.length > 0 || validKeyEvents.length > 0
          ? {
              overview: plotOverview.trim() || summary.trim() || description.trim(),
              arc:
                validPlotArc.length > 0
                  ? storyArcPhases
                  : [
                      { phase: 'Mở đầu', title: 'Mở đầu câu chuyện', description: summary.trim() },
                      { phase: 'Biến cố', title: 'Biến cố & Thử thách', description: 'Các xung đột và bước ngoặt diễn ra.' },
                      { phase: 'Cao trào', title: 'Điểm nút cao trào', description: 'Đỉnh điểm kịch tính của tác phẩm.' },
                      { phase: 'Mở nút & Kết thúc', title: 'Hồi kết & Bài học', description: message.trim() },
                    ],
              keyEvents: validKeyEvents.length > 0 ? validKeyEvents : undefined,
            }
          : undefined;

      const authorDetails: AuthorDetails | undefined =
        authorBio.trim() || authorYears.trim() || authorCountry.trim() || authorWritingStyle.trim() || authorFamousQuote.trim()
          ? {
              name: author.trim(),
              years: authorYears.trim() || undefined,
              country: authorCountry.trim() || undefined,
              bio: authorBio.trim() || undefined,
              writingStyle: authorWritingStyle.trim() || undefined,
              famousQuote: authorFamousQuote.trim() || undefined,
            }
          : undefined;

      const historicalContext: HistoricalContext | undefined =
        historicalPeriod.trim() || historicalCircumstance.trim() || historicalSocietalImpact.trim()
          ? {
              period: historicalPeriod.trim(),
              creationCircumstance: historicalCircumstance.trim(),
              societalImpact: historicalSocietalImpact.trim(),
            }
          : undefined;

      const payload = {
        title: title.trim(),
        author: author.trim(),
        isbn: finalIsbn,
        libraryCode: libraryCode.trim() || undefined,
        category: finalCategory,
        shelfLocation: shelfLocation.trim() || 'Kệ A1 - Tầng 1',
        publisher: publisher.trim() || 'Thư viện thông minh',
        year: parseInt(year, 10) || new Date().getFullYear(),
        pageCount: parseInt(pageCount, 10) || 200,
        coverImage: coverImage || DEFAULT_COVER,
        description: description.trim() || `Giới thiệu cuốn sách ${title.trim()}`,
        summary: summary.trim() || description.trim() || 'Nội dung tóm tắt của tác phẩm.',
        message: message.trim() || 'Mở rộng tri thức mỗi ngày cùng thư viện.',
        themes: [finalCategory, 'Đọc sách', 'Khám phá'],
        keyTakeaways: validKeyEvents.length > 0
          ? validKeyEvents
          : [
              'Hiểu rõ bối cảnh và ý nghĩa tác phẩm',
              'Rút ra bài học thực tiễn áp dụng vào cuộc sống',
            ],
        targetAge: 'Học sinh & Bạn đọc',
        rating: 4.9,
        characters: filteredCharacters.length > 0 ? filteredCharacters : undefined,
        plotSynopsis,
        authorDetails,
        historicalContext,
      };

      const url = isEditMode && initialBook ? `/api/books/${initialBook.id}` : '/api/books';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success && data.book) {
        if (isEditMode && onBookUpdated) {
          onBookUpdated(data.book);
        } else {
          onBookAdded(data.book);
        }
        onClose();
      } else {
        setErrorMessage(data.error || 'Có lỗi xảy ra khi lưu sách.');
      }
    } catch (err: any) {
      setErrorMessage('Không thể kết nối với máy chủ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-sm overflow-hidden overscroll-contain">
      <div
        id="add-book-modal-container"
        className="relative w-full max-w-3xl my-6 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isEditMode ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
              {isEditMode ? <Edit3 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="font-bold text-base text-gray-900 leading-tight">
                {isEditMode ? `Chỉnh sửa tác phẩm: ${initialBook?.title || title}` : 'Thêm sách mới vào thư viện'}
              </h2>
              <p className="text-[11px] text-gray-500">
                {isEditMode
                  ? 'Chỉnh sửa cốt truyện, tuyến nhân vật, tác giả và bối cảnh lịch sử'
                  : 'Nhập thông tin hoặc dùng AI tự động điền cốt truyện & nhân vật'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body - Optimized ergonomic layout */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start justify-between gap-2.5 text-xs text-red-700">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-400 hover:text-red-700 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {aiSuccessNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between gap-2.5 text-xs text-emerald-800">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{aiSuccessNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setAiSuccessNotice(null)}
                className="text-emerald-500 hover:text-emerald-800 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Main Form Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Left: Book Cover Preview & Upload */}
            <div className="md:col-span-4 flex flex-col items-center">
              <div className="relative w-32 h-44 sm:w-36 sm:h-50 rounded-xl bg-gray-100 shadow-md border border-gray-200 overflow-hidden group">
                <img
                  src={coverImage}
                  alt="Bìa sách"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold cursor-pointer gap-1"
                >
                  <Upload className="w-4 h-4" />
                  Đổi ảnh
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />

              <div className="mt-2.5 flex items-center gap-1.5 w-32 sm:w-36">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-1.5 px-2 bg-white hover:bg-orange-50 text-gray-700 hover:text-orange-700 border border-gray-200 hover:border-orange-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5 text-orange-500" />
                  <span>{isUploadingImage ? 'Đang tải...' : 'Tải ảnh'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="p-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 cursor-pointer"
                  title="Dán đường dẫn ảnh"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Action: Scan ISBN from current cover photo */}
              <button
                type="button"
                onClick={handleScanCoverForIsbn}
                disabled={isScanningCover}
                className="mt-1.5 w-32 sm:w-36 py-1.5 px-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-200/90 dark:border-purple-800/40 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                title="Phân tích ảnh này để trích xuất dãy số ISBN"
              >
                <ScanLine className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>{isScanningCover ? 'Đang phân tích số...' : 'Quét số từ ảnh này'}</span>
              </button>

              {showUrlInput && (
                <div className="mt-2 flex gap-1 w-full max-w-[200px]">
                  <input
                    type="url"
                    placeholder="Dán URL ảnh..."
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 bg-white"
                  />
                  {customImageUrl.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setCoverImage(customImageUrl.trim());
                        setShowUrlInput(false);
                      }}
                      className="px-2 py-1 bg-gray-900 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      Dùng
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Book Details */}
            <div className="md:col-span-8 space-y-3">
              {/* Row 1: Title */}
              <div className="space-y-1">
                <label className="h-5 text-xs font-bold text-gray-800 flex items-center gap-1">
                  Tên sách <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên sách..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-9 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white"
                />
              </div>

              {/* Row 2: Author & Publisher */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                <div className="space-y-1">
                  <label className="h-5 text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>Tác giả</span> <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập tên tác giả..."
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full h-9 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="h-5 text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-gray-400" />
                    <span>Nhà xuất bản</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập nhà xuất bản..."
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    className="w-full h-9 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 bg-white"
                  />
                </div>
              </div>

              {/* Row 3: ISBN & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                <div className="space-y-1">
                  <label className="h-5 text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Barcode className="w-3.5 h-3.5 text-gray-400" />
                    <span>Mã ISBN / Mã vạch gốc</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="Nhập mã ISBN..."
                      value={isbn}
                      onChange={(e) => {
                        const val = e.target.value;
                        setIsbn(val);
                        if (!libraryCode || libraryCode.startsWith('LIB-')) {
                          const digits = val.replace(/[^0-9]/g, '');
                          if (digits.length >= 4) {
                            setLibraryCode(`LIB-${digits.slice(-5)}`);
                          }
                        }
                      }}
                      className="w-full h-9 pl-3 pr-28 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white"
                    />
                    <div className="absolute right-1 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setIsLiveScannerOpen(true)}
                        className="h-7 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Quét mã vạch trực tiếp bằng camera"
                      >
                        <ScanLine className="w-3 h-3 text-purple-600" />
                        <span>Quét</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateIsbn}
                        className="h-7 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200/80 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
                        title="Tự tạo mã ISBN ngẫu nhiên"
                      >
                        Tạo mã
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="h-5 text-xs font-bold text-orange-950 flex items-center gap-1.5">
                      <Barcode className="w-3.5 h-3.5 text-orange-500" />
                      <span>Mã Thư Viện Mới</span>
                    </label>
                    <span className="text-[10px] text-orange-700 bg-orange-100 px-1.5 py-0.2 rounded font-semibold">
                      Quét ra ngay
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="VD: LIB-18324..."
                      value={libraryCode}
                      onChange={(e) => setLibraryCode(e.target.value.toUpperCase())}
                      className="w-full h-9 pl-3 pr-20 text-xs font-mono font-bold text-orange-950 bg-orange-50/50 border border-orange-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                    <div className="absolute right-1 flex items-center">
                      <button
                        type="button"
                        onClick={handleGenerateLibraryCode}
                        className="h-7 px-2 bg-white hover:bg-orange-100 text-orange-800 border border-orange-300 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                        title="Đổi mã thư viện mới"
                      >
                        Đổi mã
                      </button>
                    </div>
                  </div>
                </div>
              </div>

                <div className="space-y-1">
                  <label className="h-5 text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-gray-400" />
                    <span>Thể loại sách</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-9 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="Khác">+ Thể loại khác...</option>
                  </select>
                  {category === 'Khác' && (
                    <input
                      type="text"
                      placeholder="Nhập tên thể loại mới..."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full h-9 mt-1.5 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 bg-white"
                    />
                  )}
                </div>

              {/* Row 4: Shelf, Year, PageCount */}
              <div className="grid grid-cols-3 gap-3 items-start">
                <div className="space-y-1">
                  <label className="h-5 text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>Vị trí kệ</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập vị trí kệ..."
                    value={shelfLocation}
                    onChange={(e) => setShelfLocation(e.target.value)}
                    className="w-full h-9 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="h-5 text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>Năm XB</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Năm XB..."
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full h-9 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="h-5 text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-gray-400" />
                    <span>Số trang</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Số trang..."
                    value={pageCount}
                    onChange={(e) => setPageCount(e.target.value)}
                    className="w-full h-9 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 bg-white"
                  />
                </div>
              </div>

              {/* SECTION: PHẦN NỘI DUNG & PHÂN TÍCH TÁC PHẨM (Unlocks when Title & Author are provided) */}
              <div className="pt-3 border-t border-gray-100 space-y-3">
                {!isContentUnlocked && (
                  <div className="p-3 bg-amber-50/90 border border-amber-200/80 rounded-xl flex items-center gap-2.5 text-xs text-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Vui lòng nhập <strong>Tên sách</strong> và <strong>Tác giả</strong> ở trên trước để viết nội dung, thêm nhân vật, cốt truyện hoặc để AI tra cứu thông tin đầy đủ.
                    </span>
                  </div>
                )}

                {/* Section Header & Sub-Tabs Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                      Nội dung, Nhân vật & Cốt truyện
                    </span>
                  </div>
                </div>

                {/* Grounded Search Sources Citation Badge (if available) */}
                {searchSources.length > 0 && (
                  <div className="p-2.5 bg-blue-50/90 border border-blue-200/80 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-blue-900">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      <span>Nguồn tài liệu tra cứu Google Search đã tham khảo:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {searchSources.map((src, idx) => (
                        <a
                          key={idx}
                          href={src.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-900 hover:underline bg-white px-2 py-0.5 rounded border border-blue-200"
                        >
                          <span className="truncate max-w-[200px]">{src.title || src.uri}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category Sub-Tabs for Content, Characters, Plot, and Author */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveContentTab('summary')}
                    className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      activeContentTab === 'summary'
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-orange-500" />
                    <span>1. Tóm tắt & Bài học</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveContentTab('characters')}
                    className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      activeContentTab === 'characters'
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <span>2. Tuyến nhân vật ({characters.filter((c) => c.name.trim()).length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveContentTab('plot')}
                    className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      activeContentTab === 'plot'
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <GitCommit className="w-3.5 h-3.5 text-indigo-500" />
                    <span>3. Cốt truyện & Diễn biến</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveContentTab('author')}
                    className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      activeContentTab === 'author'
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5 text-emerald-500" />
                    <span>4. Hồ sơ tác giả</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveContentTab('history')}
                    className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      activeContentTab === 'history'
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>5. Bối cảnh & Lịch sử</span>
                  </button>
                </div>

                {/* TAB 1: SUMMARY & MESSAGE */}
                {activeContentTab === 'summary' && (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-800 flex items-center gap-1">
                        <span>Tóm tắt nội dung cốt lõi tác phẩm</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        disabled={!isContentUnlocked}
                        placeholder={
                          isContentUnlocked
                            ? 'Nhập tóm tắt chi tiết, đầy đủ về tác phẩm...'
                            : 'Mục này sẽ mở sau khi bạn điền tên sách và tác giả ở trên...'
                        }
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none leading-relaxed transition-colors ${
                          !isContentUnlocked
                            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-white border-gray-200 text-gray-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="h-5 text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <Quote className="w-3.5 h-3.5 text-gray-400" />
                        <span>Thông điệp & Bài học nhân sinh ý nghĩa nhất</span>
                      </label>
                      <input
                        type="text"
                        disabled={!isContentUnlocked}
                        placeholder={
                          isContentUnlocked
                            ? 'Nhập thông điệp, bài học ý nghĩa...'
                            : 'Mục này sẽ mở sau khi bạn điền tên sách và tác giả ở trên...'
                        }
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className={`w-full h-9 px-3 text-xs border rounded-lg focus:outline-none transition-colors ${
                          !isContentUnlocked
                            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-white border-gray-200 text-gray-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="h-5 text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-gray-400" />
                        <span>Lời giới thiệu tổng quan (Dành cho thẻ sách)</span>
                      </label>
                      <textarea
                        rows={2}
                        disabled={!isContentUnlocked}
                        placeholder="Đoạn văn ngắn giới thiệu bối cảnh và vị thế cuốn sách..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none leading-relaxed transition-colors ${
                          !isContentUnlocked
                            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-white border-gray-200 text-gray-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500'
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: CHARACTERS LIST */}
                {activeContentTab === 'characters' && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          <span>Danh sách nhân vật trong tác phẩm</span>
                        </h4>
                        <p className="text-[11px] text-gray-500">
                          Khai báo các nhân vật chính/phụ, tính cách và ý nghĩa biểu tượng để người đọc tìm hiểu sâu
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddCharacter}
                        disabled={!isContentUnlocked}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm nhân vật</span>
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-[320px] overflow-y-auto overscroll-contain pr-1">
                      {characters.map((char, idx) => (
                        <div
                          key={char.id || idx}
                          className="p-3 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-gray-500 uppercase">
                              Nhân vật #{idx + 1}
                            </span>
                            {characters.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveCharacter(idx)}
                                className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                                title="Xóa nhân vật này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[11px] font-medium text-gray-600 block mb-0.5">
                                Tên nhân vật:
                              </label>
                              <input
                                type="text"
                                disabled={!isContentUnlocked}
                                placeholder="Nhập tên nhân vật..."
                                value={char.name}
                                onChange={(e) => handleUpdateCharacter(idx, 'name', e.target.value)}
                                className="w-full h-8 px-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-medium text-gray-600 block mb-0.5">
                                Vai trò trong truyện:
                              </label>
                              <input
                                type="text"
                                disabled={!isContentUnlocked}
                                placeholder="Nhân vật chính / Người bạn / Kẻ phản diện..."
                                value={char.role}
                                onChange={(e) => handleUpdateCharacter(idx, 'role', e.target.value)}
                                className="w-full h-8 px-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[11px] font-medium text-gray-600 block mb-0.5">
                                Tính cách / Ngoại hình:
                              </label>
                              <input
                                type="text"
                                disabled={!isContentUnlocked}
                                placeholder="Mô tả tính cách hoặc diện mạo..."
                                value={char.personality || ''}
                                onChange={(e) => handleUpdateCharacter(idx, 'personality', e.target.value)}
                                className="w-full h-8 px-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-medium text-gray-600 block mb-0.5">
                                Ý nghĩa biểu tượng / Câu nói tiêu biểu:
                              </label>
                              <input
                                type="text"
                                disabled={!isContentUnlocked}
                                placeholder="Ý nghĩa biểu tượng hoặc câu nói ấn tượng..."
                                value={char.symbolicMeaning || ''}
                                onChange={(e) => handleUpdateCharacter(idx, 'symbolicMeaning', e.target.value)}
                                className="w-full h-8 px-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: PLOT & STORY ARC */}
                {activeContentTab === 'plot' && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <GitCommit className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Cốt truyện & Tuyến diễn biến</span>
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Chi tiết các hồi, cao trào và sự kiện then chốt của câu chuyện
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-gray-700 block">
                        Tổng quan diễn biến toàn bộ cốt truyện:
                      </label>
                      <textarea
                        rows={2}
                        disabled={!isContentUnlocked}
                        placeholder="Tổng thể diễn biến câu chuyện từ khởi đầu đến kết thúc..."
                        value={plotOverview}
                        onChange={(e) => setPlotOverview(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                      />
                    </div>

                    {/* 4 Story Arc Phases */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide block">
                        4 Hồi phát triển diễn biến câu chuyện:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {storyArcPhases.map((phase, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                                {phase.phase}
                              </span>
                            </div>
                            <input
                              type="text"
                              disabled={!isContentUnlocked}
                              placeholder={`Tiêu đề giai đoạn ${phase.phase}...`}
                              value={phase.title}
                              onChange={(e) => handleUpdateStoryArc(idx, 'title', e.target.value)}
                              className="w-full h-7 px-2 text-xs font-medium border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500 bg-white"
                            />
                            <textarea
                              rows={2}
                              disabled={!isContentUnlocked}
                              placeholder={`Mô tả diễn biến cụ thể của giai đoạn ${phase.phase}...`}
                              value={phase.description}
                              onChange={(e) => handleUpdateStoryArc(idx, 'description', e.target.value)}
                              className="w-full px-2 py-1 text-[11px] border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500 bg-white"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Key Events List */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                          Các sự kiện & Điểm nhấn quan trọng:
                        </label>
                        <button
                          type="button"
                          onClick={handleAddKeyEvent}
                          disabled={!isContentUnlocked}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer disabled:opacity-50"
                        >
                          + Thêm điểm nhấn
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {keyPlotEvents.map((ev, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="text-[11px] text-gray-400 font-mono w-4 shrink-0">
                              {idx + 1}.
                            </span>
                            <input
                              type="text"
                              disabled={!isContentUnlocked}
                              placeholder="Nhập sự kiện hoặc điểm nhấn..."
                              value={ev}
                              onChange={(e) => handleUpdateKeyEvent(idx, e.target.value)}
                              className="flex-1 h-7 px-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500 bg-white"
                            />
                            {keyPlotEvents.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveKeyEvent(idx)}
                                className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: AUTHOR PROFILE */}
                {activeContentTab === 'author' && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Hồ sơ & Phong cách tác giả ({author || 'Chưa nhập tên tác giả'})</span>
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Thông tin tiểu sử, phong cách bút pháp nghệ thuật và câu danh ngôn của tác giả
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-medium text-gray-700 block mb-0.5">
                          Năm sinh - Năm mất:
                        </label>
                        <input
                          type="text"
                          disabled={!isContentUnlocked}
                          placeholder="Ví dụ: 1920 – 1951..."
                          value={authorYears}
                          onChange={(e) => setAuthorYears(e.target.value)}
                          className="w-full h-8 px-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-gray-700 block mb-0.5">
                          Quốc gia / Quê quán:
                        </label>
                        <input
                          type="text"
                          disabled={!isContentUnlocked}
                          placeholder="Ví dụ: Việt Nam, Pháp, Nhật Bản..."
                          value={authorCountry}
                          onChange={(e) => setAuthorCountry(e.target.value)}
                          className="w-full h-8 px-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-gray-700 block">
                        Tiểu sử & Cống hiến văn học:
                      </label>
                      <textarea
                        rows={3}
                        disabled={!isContentUnlocked}
                        placeholder="Tiểu sử cuộc đời, sự nghiệp sáng tác..."
                        value={authorBio}
                        onChange={(e) => setAuthorBio(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-medium text-gray-700 block mb-0.5">
                          Phong cách sáng tác đặc trưng:
                        </label>
                        <input
                          type="text"
                          disabled={!isContentUnlocked}
                          placeholder="Lối hành văn, bút pháp nghệ thuật..."
                          value={authorWritingStyle}
                          onChange={(e) => setAuthorWritingStyle(e.target.value)}
                          className="w-full h-8 px-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-gray-700 block mb-0.5">
                          Danh ngôn / Câu nói nổi tiếng của tác giả:
                        </label>
                        <input
                          type="text"
                          disabled={!isContentUnlocked}
                          placeholder="Câu nói đáng nhớ..."
                          value={authorFamousQuote}
                          onChange={(e) => setAuthorFamousQuote(e.target.value)}
                          className="w-full h-8 px-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: HISTORICAL CONTEXT & CIRCUMSTANCES */}
                {activeContentTab === 'history' && (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Thời kỳ & Giai đoạn bối cảnh lịch sử</span>
                      </label>
                      <input
                        type="text"
                        disabled={!isContentUnlocked}
                        placeholder="Ví dụ: Nửa đầu thế kỷ XX, Thời kỳ Kháng chiến chống Pháp, Thời kỳ Đổi mới..."
                        value={historicalPeriod}
                        onChange={(e) => setHistoricalPeriod(e.target.value)}
                        className="w-full h-8.5 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5 text-amber-500" />
                        <span>Hoàn cảnh ra đời & Động lực sáng tác của tác giả</span>
                      </label>
                      <textarea
                        rows={3}
                        disabled={!isContentUnlocked}
                        placeholder="Hoàn cảnh lịch sử, xã hội hoặc sự kiện thực tế đã thúc đẩy tác giả chắp bút sáng tác nên tác phẩm..."
                        value={historicalCircumstance}
                        onChange={(e) => setHistoricalCircumstance(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-amber-500" />
                        <span>Giá trị thời đại & Tầm ảnh hưởng xã hội</span>
                      </label>
                      <textarea
                        rows={3}
                        disabled={!isContentUnlocked}
                        placeholder="Sức lan tỏa, tác động tới độc giả đương thời và giá trị tư tưởng vượt thời gian của tác phẩm..."
                        value={historicalSocietalImpact}
                        onChange={(e) => setHistoricalSocietalImpact(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white leading-relaxed"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3.5 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 rounded-lg transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer active:scale-95 ${
                isEditMode
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                  : 'bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700'
              }`}
            >
              {isSubmitting ? (
                <>Đang lưu sách...</>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditMode ? 'Cập nhật sách' : 'Lưu sách'}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live Camera Barcode Scanner Modal */}
        <BarcodeScannerModal
          isOpen={isLiveScannerOpen}
          onClose={() => setIsLiveScannerOpen(false)}
          onDetected={async (detectedIsbn) => {
            setIsbn(detectedIsbn);
            const cleanNum = detectedIsbn.replace(/[^0-9]/g, '');
            const codeSuffix = cleanNum.length >= 4 ? cleanNum.slice(-5) : Math.floor(10000 + Math.random() * 90000).toString();
            const newLib = `LIB-${codeSuffix}`;
            setLibraryCode(newLib);
            setIsLiveScannerOpen(false);
            setAiSuccessNotice(`✓ Đã quét mã thành công: ${detectedIsbn} & tự động cấp mã thư viện mới: ${newLib}!`);

            // If title is not filled yet, check if there's any book in library or online
            if (!title.trim()) {
              try {
                const lookupRes = await fetch('/api/barcode/lookup-online', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ isbn: detectedIsbn }),
                });
                const lookupData = await lookupRes.json();
                const b = lookupData.book || lookupData.bookData;
                if (lookupData.success && b) {
                  if (b.title) setTitle(b.title);
                  if (b.author) setAuthor(b.author);
                  if (b.category) setCategory(b.category);
                  if (b.publisher) setPublisher(b.publisher);
                  if (b.year) setYear(b.year ? b.year.toString() : '');
                  if (b.pageCount) setPageCount(b.pageCount ? b.pageCount.toString() : '');
                  if (b.coverImage) setCoverImage(b.coverImage);
                  if (b.description) setDescription(b.description);
                  if (b.summary) setSummary(b.summary);
                  if (b.message) setMessage(b.message);
                  if (b.shelfLocation) setShelfLocation(b.shelfLocation);
                  if (Array.isArray(b.characters) && b.characters.length > 0) {
                    setCharacters(b.characters);
                  }
                  if (b.plotSynopsis) {
                    if (b.plotSynopsis.overview) setPlotOverview(b.plotSynopsis.overview);
                    if (Array.isArray(b.plotSynopsis.arc) && b.plotSynopsis.arc.length > 0) {
                      setStoryArcPhases(b.plotSynopsis.arc);
                    }
                    if (Array.isArray(b.plotSynopsis.keyEvents) && b.plotSynopsis.keyEvents.length > 0) {
                      setKeyPlotEvents(b.plotSynopsis.keyEvents);
                    }
                  }
                  if (b.authorDetails) {
                    if (b.authorDetails.bio) setAuthorBio(b.authorDetails.bio);
                    if (b.authorDetails.years) setAuthorYears(b.authorDetails.years);
                    if (b.authorDetails.country) setAuthorCountry(b.authorDetails.country);
                    if (b.authorDetails.writingStyle) setAuthorWritingStyle(b.authorDetails.writingStyle);
                    if (b.authorDetails.famousQuote) setAuthorFamousQuote(b.authorDetails.famousQuote);
                  }
                  if (b.historicalContext) {
                    if (b.historicalContext.period) setHistoricalPeriod(b.historicalContext.period);
                    if (b.historicalContext.creationCircumstance || b.historicalContext.circumstance) {
                      setHistoricalCircumstance(b.historicalContext.creationCircumstance || b.historicalContext.circumstance);
                    }
                    if (b.historicalContext.societalImpact) setHistoricalSocietalImpact(b.historicalContext.societalImpact);
                  }
                  setAiSuccessNotice(`✓ Đã phân tích ISBN ${detectedIsbn} và tự động điền đầy đủ dữ liệu tác phẩm "${b.title}"!`);
                }
              } catch {
                // Ignore
              }
            }
          }}
        />
      </div>
    </div>
  );
};
