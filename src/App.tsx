import React, { useState, useEffect } from 'react';
import {
  Search,
  Camera,
  X,
  BookOpen,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookPlus,
  PlusCircle,
  ArrowRight,
  Sliders,
  Lock,
  Barcode,
} from 'lucide-react';
import { Book, Category, AnalyticsData } from './types.js';
import { initialBooks } from './data/booksData.js';
import { Navbar } from './components/Navbar.js';
import { BookCard } from './components/BookCard.js';
import { BookDetailsModal } from './components/BookDetailsModal.js';
import { BookQuizModal } from './components/BookQuizModal.js';
import { BarcodeScannerModal } from './components/BarcodeScannerModal.js';
import { PersonalityMatchModal } from './components/PersonalityMatchModal.js';
import { AddBookModal } from './components/AddBookModal.js';
import { AdminDashboardModal } from './components/AdminDashboardModal.js';
import { AdminPasswordModal } from './components/AdminPasswordModal.js';

export default function App() {
  const STORAGE_BOOKS_KEY = 'smart_library_books_v3';
  const STORAGE_DELETED_KEY = 'smart_library_deleted_ids_v3';

  // Helper to persist to all local storage keys permanently so data is never lost or reset
  const persistToLocalStorage = (bookList: Book[], deletedIds?: string[]) => {
    try {
      const serializedBooks = JSON.stringify(bookList);
      localStorage.setItem('smart_library_books_v3', serializedBooks);
      localStorage.setItem('smart_library_books_v2', serializedBooks);
      localStorage.setItem('smart_library_books', serializedBooks);
      if (deletedIds) {
        const serializedDel = JSON.stringify(deletedIds);
        localStorage.setItem('smart_library_deleted_ids_v3', serializedDel);
        localStorage.setItem('smart_library_deleted_ids_v2', serializedDel);
        localStorage.setItem('smart_library_deleted_ids', serializedDel);
      }
    } catch {}
  };

  // Initialize books immediately from client persistent storage or code data so there's 0 delay and zero reset
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const stored =
        localStorage.getItem('smart_library_books_v3') ||
        localStorage.getItem('smart_library_books_v2') ||
        localStorage.getItem('smart_library_books');
      const deletedRaw =
        localStorage.getItem('smart_library_deleted_ids_v3') ||
        localStorage.getItem('smart_library_deleted_ids_v2') ||
        localStorage.getItem('smart_library_deleted_ids');
      const deletedIds: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
      if (stored) {
        const parsed: Book[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((b) => b && b.id && !deletedIds.includes(b.id));
        }
      }
      // If client storage is fresh or empty, fallback to codebase data
      if (Array.isArray(initialBooks) && initialBooks.length > 0) {
        const fallback = initialBooks.filter((b) => b && b.id && !deletedIds.includes(b.id));
        persistToLocalStorage(fallback, deletedIds);
        return fallback;
      }
    } catch {}
    return initialBooks || [];
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'title'>('popular');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedQuizBook, setSelectedQuizBook] = useState<Book | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPersonalityOpen, setIsPersonalityOpen] = useState(false);
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [initialIsbnForAdd, setInitialIsbnForAdd] = useState<string>('');
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);
  const [unregisteredScannedIsbn, setUnregisteredScannedIsbn] = useState<string | null>(null);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleBookAdded = (newBook: Book) => {
    setBooks((prev) => {
      const next = [newBook, ...prev.filter((b) => b.id !== newBook.id)];
      // Remove from deleted list if re-added
      const dRaw =
        localStorage.getItem(STORAGE_DELETED_KEY) ||
        localStorage.getItem('smart_library_deleted_ids_v2') ||
        localStorage.getItem('smart_library_deleted_ids');
      const deleted = dRaw ? JSON.parse(dRaw).filter((id: string) => id !== newBook.id) : [];
      persistToLocalStorage(next, deleted);
      return next;
    });
    showNotification(`✓ Đã thêm sách mới thành công: "${newBook.title}"`);
    loadData(true);
    setSelectedBook(newBook);
    setInitialIsbnForAdd('');
    setBookToEdit(null);
  };

  const handleBookUpdated = (updatedBook: Book) => {
    setBooks((prev) => {
      const next = prev.map((b) => (b.id === updatedBook.id ? updatedBook : b));
      persistToLocalStorage(next);
      return next;
    });
    showNotification(`✓ Đã cập nhật thành công thông tin tác phẩm: "${updatedBook.title}"`);
    loadData(true);
    setSelectedBook(updatedBook);
    setBookToEdit(null);
  };

  const handleBookDeleted = (deletedBookId: string) => {
    setBooks((prev) => {
      const next = prev.filter((b) => b.id !== deletedBookId);
      const dRaw =
        localStorage.getItem(STORAGE_DELETED_KEY) ||
        localStorage.getItem('smart_library_deleted_ids_v2') ||
        localStorage.getItem('smart_library_deleted_ids');
      const deleted: string[] = dRaw ? JSON.parse(dRaw) : [];
      if (!deleted.includes(deletedBookId)) {
        deleted.push(deletedBookId);
      }
      persistToLocalStorage(next, deleted);
      return next;
    });
    if (selectedBook?.id === deletedBookId) setSelectedBook(null);
    if (bookToEdit?.id === deletedBookId) setBookToEdit(null);
    loadData(true);
  };

  // Fetch books & categories & analytics with two-way persistent sync
  const loadData = async (syncWithDisk = true) => {
    try {
      let storedBooks: Book[] = [];
      let storedDeleted: string[] = [];
      try {
        const bRaw =
          localStorage.getItem(STORAGE_BOOKS_KEY) ||
          localStorage.getItem('smart_library_books_v2') ||
          localStorage.getItem('smart_library_books');
        if (bRaw) storedBooks = JSON.parse(bRaw);
        const dRaw =
          localStorage.getItem(STORAGE_DELETED_KEY) ||
          localStorage.getItem('smart_library_deleted_ids_v2') ||
          localStorage.getItem('smart_library_deleted_ids');
        if (dRaw) storedDeleted = JSON.parse(dRaw);
      } catch {}

      // 1. Fetch live books from server data file FIRST (Master Source of Truth - Never cached)
      let booksData: any = null;
      try {
        const booksRes = await fetch(`/api/books?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' },
        });
        booksData = await booksRes.json();
      } catch {
        // Fallback to static direct books-data.json
        try {
          const staticRes = await fetch(`/books-data.json?_t=${Date.now()}`, {
            cache: 'no-store',
            headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' },
          });
          const staticList = await staticRes.json();
          if (Array.isArray(staticList) && staticList.length > 0) {
            booksData = { success: true, books: staticList, deletedIds: [] };
          }
        } catch {}
      }

      const [catRes, anaRes] = await Promise.all([
        fetch('/api/categories').catch(() => null),
        fetch('/api/analytics').catch(() => null),
      ]);
      const catData = catRes ? await catRes.json() : null;
      const anaData = anaRes ? await anaRes.json() : null;

      if (booksData && booksData.success && Array.isArray(booksData.books)) {
        const serverBooks: Book[] = booksData.books;
        const serverDeleted: string[] = Array.isArray(booksData.deletedIds) ? booksData.deletedIds : [];
        const allDeletedSet = new Set<string>([...storedDeleted, ...serverDeleted]);
        const allDeletedList = Array.from(allDeletedSet);

        // Check if this client has any local books added offline that server doesn't have yet
        const localNewBooks = storedBooks.filter(
          (b) => b && b.id && !allDeletedSet.has(b.id) && !serverBooks.some((sb) => sb.id === b.id)
        );

        if (localNewBooks.length > 0 && syncWithDisk) {
          try {
            const syncRes = await fetch('/api/books/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ books: localNewBooks, deletedIds: allDeletedList }),
            });
            const syncData = await syncRes.json();
            if (syncData && syncData.success && Array.isArray(syncData.books)) {
              setBooks(syncData.books);
              persistToLocalStorage(syncData.books, syncData.deletedIds || allDeletedList);
              return;
            }
          } catch {}
        }

        // Live server data is the master truth!
        const cleanBooks = serverBooks.filter((b) => b && b.id && !allDeletedSet.has(b.id));
        setBooks(cleanBooks);
        persistToLocalStorage(cleanBooks, allDeletedList);

        // Ensure currently viewed book in modal always receives latest updates without changing reference if unchanged
        setSelectedBook((curr) => {
          if (!curr) return null;
          const fresh = cleanBooks.find((b) => b.id === curr.id);
          if (!fresh) return curr;
          if (
            fresh.updatedAt === curr.updatedAt &&
            fresh.views === curr.views &&
            fresh.scanCount === curr.scanCount &&
            fresh.rating === curr.rating &&
            fresh.title === curr.title &&
            fresh.coverImage === curr.coverImage
          ) {
            return curr;
          }
          return fresh;
        });
      } else if (storedBooks.length > 0) {
        // Fallback to client storage if server is completely offline
        const cleanOffline = storedBooks.filter((b) => !storedDeleted.includes(b.id));
        setBooks(cleanOffline);
      }
      if (catData && catData.success) setCategories(catData.categories);
      if (anaData && anaData.success) setAnalytics(anaData.analytics);
    } catch (err) {
      console.warn('Lỗi khi tải dữ liệu thư viện:', err);
    }
  };

  useEffect(() => {
    loadData(true);

    // Auto-sync polling every 4 seconds
    const interval = setInterval(() => {
      loadData(false);
    }, 4000);

    // Refresh immediately when window gains focus or tab becomes visible
    const handleFocus = () => loadData(false);
    const handleVisibility = () => {
      if (!document.hidden) loadData(false);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Keyboard shortcut Ctrl+K / ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isScannerOpen) setIsScannerOpen(false);
        if (selectedBook) setSelectedBook(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isScannerOpen, selectedBook]);

  // Lock background scrolling whenever any modal is open to avoid mouse scroll leaking
  const isAnyModalOpen = Boolean(
    selectedBook ||
    selectedQuizBook ||
    isAddBookOpen ||
    isAdminOpen ||
    isAdminAuthOpen ||
    isPersonalityOpen ||
    isScannerOpen ||
    unregisteredScannedIsbn
  );

  useEffect(() => {
    if (isAnyModalOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isAnyModalOpen]);

  // Handle scanned ISBN or Library Code
  const handleBarcodeDetected = async (code: string) => {
    setIsScannerOpen(false);
    try {
      const res = await fetch('/api/barcode/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: code, source: 'camera' }),
      });
      const data = await res.json();

      if (data.success && data.book) {
        setSelectedBook(data.book);
        showNotification(
          data.isNewlyCreated
            ? `🎉 ĐÃ CẤP MÃ SÁCH MỚI: [${data.book.libraryCode}]! Cuốn sách đã được lưu. Từ nay chỉ cần quét mã này là ra ngay sách!`
            : `✓ Đã tìm thấy sách: "${data.book.title}" (Mã: ${data.book.libraryCode || data.book.isbn})`
        );
        loadData();
      } else if (data.onlineBookData && data.onlineBookData.title) {
        // Book found online! Pre-fill complete book information for instant adding
        const onlineB: Book = {
          id: `book-online-${Date.now()}`,
          isbn: code,
          libraryCode: `LIB-${code.replace(/[^0-9]/g, '').slice(-5) || Math.floor(10000 + Math.random() * 90000)}`,
          title: data.onlineBookData.title || '',
          author: data.onlineBookData.author || '',
          category: data.onlineBookData.category || 'Văn học',
          shelfLocation: 'Kệ mới - Chờ xếp',
          publisher: data.onlineBookData.publisher || 'Nhà xuất bản',
          year: data.onlineBookData.year || new Date().getFullYear(),
          pageCount: data.onlineBookData.pageCount || 200,
          coverImage: data.onlineBookData.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
          description: data.onlineBookData.description || '',
          summary: data.onlineBookData.summary || data.onlineBookData.description || '',
          message: data.onlineBookData.message || '',
          themes: data.onlineBookData.themes || ['Văn học', 'Đọc sách'],
          keyTakeaways: data.onlineBookData.keyTakeaways || [],
          targetAge: 'Bạn đọc',
          rating: 4.9,
          views: 0,
          scanCount: 1,
          aiContext: data.onlineBookData.description || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          characters: data.onlineBookData.characters,
          plotSynopsis: data.onlineBookData.plotSynopsis,
          authorDetails: data.onlineBookData.authorDetails,
          historicalContext: data.onlineBookData.historicalContext,
        };
        setBookToEdit(onlineB);
        setInitialIsbnForAdd(code);
        setIsAddBookOpen(true);
        showNotification(`✓ Tìm thấy trực tuyến sách "${onlineB.title}"! Đã tự động điền đầy đủ dữ liệu.`);
      } else {
        // Book not yet registered in library database
        setUnregisteredScannedIsbn(code);
      }
    } catch (err) {
      showNotification('Không thể kết nối máy chủ khi quét mã', 'error');
    }
  };

  // Open book modal & record view
  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    // Increment view count on server
    fetch(`/api/books/${book.id}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.success && d.book) {
          loadData();
        }
      })
      .catch(() => {});
  };

  // Filter & sort
  const filteredBooks = books
    .filter((b) => {
      const matchesCat =
        selectedCategory === 'all' ||
        b.category.toLowerCase() === selectedCategory.toLowerCase();
      if (!matchesCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.includes(q) ||
        (b.libraryCode && b.libraryCode.toLowerCase().includes(q)) ||
        b.category.toLowerCase().includes(q) ||
        b.themes.some((t) => t.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return (b.scanCount + b.views) - (a.scanCount + a.views);
      if (sortBy === 'newest') return b.year - a.year;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ backgroundColor: '#ffffff' }}>
      {/* Top Navbar */}
      <Navbar
        onOpenScanner={() => setIsScannerOpen(true)}
        totalBooks={books.length}
        onOpenPersonalityMatch={() => setIsPersonalityOpen(true)}
      />

      {/* Main Content: Focused Library Bookshelf */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 pb-28 md:pb-12">
        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5 sm:top-3" />
            <input
              type="text"
              placeholder="Tìm theo tên sách, tác giả, thể loại, mã mới (LIB-...), mã vạch ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-200 rounded-xl sm:rounded-lg bg-white focus:outline-none focus:border-gray-900 transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3.5 sm:top-3 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-start">
            <span className="text-xs text-gray-500 font-medium">Sắp xếp:</span>
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-medium focus:outline-none cursor-pointer text-xs"
              >
                <option value="popular">Phổ biến nhất</option>
                <option value="newest">Mới nhất</option>
                <option value="title">Tên sách (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 overscroll-contain">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border cursor-pointer shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-gray-900 text-white border-gray-900 shadow-2xs'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Tất cả ({books.length})
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border cursor-pointer shrink-0 ${
                selectedCategory.toLowerCase() === cat.name.toLowerCase()
                  ? 'bg-gray-900 text-white border-gray-900 shadow-2xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>

        {/* Search status if searching */}
        {searchQuery && (
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <span>Kết quả tìm kiếm cho: "{searchQuery}" ({filteredBooks.length} cuốn)</span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-gray-700 underline font-medium cursor-pointer"
            >
              Xóa tìm kiếm
            </button>
          </div>
        )}

        {/* Books Grid */}
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onSelect={handleSelectBook}
                onOpenQuiz={(b) => setSelectedQuizBook(b)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl space-y-2">
            <BookOpen className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-sm font-semibold text-gray-700">Không tìm thấy sách phù hợp</p>
            <p className="text-xs text-gray-500">Hãy thử từ khóa khác hoặc bấm Tất cả thể loại.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-2 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium cursor-pointer"
            >
              Xem tất cả sách
            </button>
          </div>
        )}

      </main>

      {/* Simple Footer */}
      <footer className="border-t border-gray-200 py-6 px-4 text-center text-xs text-gray-500 mb-20 md:mb-0 flex flex-col items-center justify-center gap-2">
        <p className="font-medium tracking-wide">
          DỰ ÁN KHOA HỌC KĨ THUẬT CỦA CẤN VIỆT TÙNG VÀ TẠ NGỌC DIỆP 11A1
        </p>

        {/* Small discreet admin trigger for library management */}
        <button
          id="contribute-new-book-bar"
          type="button"
          onClick={() => setIsAdminAuthOpen(true)}
          className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-600 active:text-gray-900 transition-colors py-1 px-2.5 rounded-md hover:bg-gray-50 cursor-pointer"
          title="Dành cho Quản trị viên: Quản lý sách & Thể loại"
        >
          <Lock className="w-3 h-3 text-gray-400" />
          <span>Quản trị viên</span>
        </button>
      </footer>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <div className="block md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-6 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-lg">
        <div className="max-w-sm mx-auto flex items-center justify-around text-center">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex flex-col items-center justify-center py-1 text-gray-900 active:scale-95 transition-transform flex-1"
          >
            <BookOpen className="w-5 h-5 mb-0.5 text-gray-900" />
            <span className="text-[10px] font-semibold">Kệ sách</span>
          </button>

          {/* Central elevated scanner button */}
          <div className="flex justify-center -mt-6 px-2">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="w-13 h-13 rounded-full bg-gray-950 text-white shadow-xl flex items-center justify-center active:scale-90 transition-transform cursor-pointer ring-4 ring-white"
              title="Quét mã ISBN"
            >
              <Camera className="w-6 h-6" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsPersonalityOpen(true)}
            className="flex flex-col items-center justify-center py-1 text-gray-600 hover:text-gray-950 active:scale-95 transition-transform flex-1 cursor-pointer"
          >
            <Sparkles className="w-5 h-5 mb-0.5 text-[#FF7A00]" />
            <span className="text-[10px] font-medium">Gợi ý AI</span>
          </button>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={handleBarcodeDetected}
      />

      {/* Personality & Preferences Match Modal */}
      <PersonalityMatchModal
        isOpen={isPersonalityOpen}
        onClose={() => setIsPersonalityOpen(false)}
        onSelectBook={handleSelectBook}
      />

      {/* Book Details & AI Q&A Modal */}
      {selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onSelectRelatedBook={(b) => setSelectedBook(b)}
          onOpenQuiz={(b) => setSelectedQuizBook(b)}
          onEditBook={(b) => {
            setSelectedBook(null);
            setBookToEdit(b);
            setIsAddBookOpen(true);
          }}
          onScanCode={(code) => {
            handleBarcodeDetected(code);
          }}
        />
      )}

      {/* Dedicated Corner Book Quiz & Knowledge Hub Modal */}
      {selectedQuizBook && (
        <BookQuizModal
          book={selectedQuizBook}
          onClose={() => setSelectedQuizBook(null)}
          onOpenBookDetails={(b) => {
            setSelectedQuizBook(null);
            setSelectedBook(b);
          }}
        />
      )}

      {/* Add New Book Modal */}
      <AddBookModal
        isOpen={isAddBookOpen}
        onClose={() => {
          setIsAddBookOpen(false);
          setInitialIsbnForAdd('');
          setBookToEdit(null);
        }}
        categories={categories}
        onBookAdded={handleBookAdded}
        onBookUpdated={handleBookUpdated}
        initialIsbn={initialIsbnForAdd}
        initialBook={bookToEdit}
      />

      {/* Scanned ISBN Not in DB Action Modal */}
      {unregisteredScannedIsbn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-inner">
              <Barcode className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-mono font-bold border border-emerald-200">
                ✓ Đã đọc mã: {unregisteredScannedIsbn}
              </span>
              <h3 className="text-base font-bold text-gray-900">
                Sách chưa có trong Thư viện
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                Hệ thống đã nhận diện thành công mã ISBN của cuốn sách này. Bạn có muốn thêm sách vào danh mục thư viện ngay bây giờ không?
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const isbnToAdd = unregisteredScannedIsbn;
                  setUnregisteredScannedIsbn(null);
                  setInitialIsbnForAdd(isbnToAdd);
                  setIsAddBookOpen(true);
                }}
                className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>Thêm sách này vào thư viện ngay</span>
              </button>

              <button
                type="button"
                onClick={() => setUnregisteredScannedIsbn(null)}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Password Verification Modal */}
      <AdminPasswordModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onSuccess={() => {
          setIsAdminAuthOpen(false);
          setIsAdminOpen(true);
          showNotification('✓ Xác thực quản trị viên thành công!');
        }}
      />

      {/* Admin Dashboard Modal (Manage Books & Categories) */}
      <AdminDashboardModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        books={books}
        categories={categories}
        onDataRefresh={() => loadData(true)}
        onShowToast={showNotification}
        onBookAdded={handleBookAdded}
        onBookUpdated={handleBookUpdated}
        onBookDeleted={handleBookDeleted}
      />

      {/* Minimal Toast Notification (Positioned above corner button) */}
      {toast && (
        <div className="fixed bottom-24 right-6 z-50 px-4 py-2.5 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-lg flex items-center gap-2">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
