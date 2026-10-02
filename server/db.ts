import fs from 'fs';
import path from 'path';
import { Book, Category, AnalyticsData } from '../src/types.js';
import { BOOK_DETAILED_INSIGHTS } from '../src/data/bookDetailedInsights.js';

const DATA_FILE = path.join(process.cwd(), 'data', 'library-data.json');
const SEED_FILE = path.join(process.cwd(), 'data', 'seed-books.json');
const BACKUP_FILE = path.join(process.cwd(), 'data', 'library-backup.json');
const DELETED_FILE = path.join(process.cwd(), 'data', 'deleted-book-ids.json');
const SRC_BOOKS_TS = path.join(process.cwd(), 'src', 'data', 'booksData.ts');
const SRC_BOOKS_JSON = path.join(process.cwd(), 'src', 'data', 'booksData.json');

export interface ScanLog {
  id: string;
  bookId?: string;
  isbn: string;
  scannedAt: string;
  source: 'camera' | 'manual' | 'kiosk-scanner';
  success: boolean;
}

export interface SearchLog {
  id: string;
  query: string;
  category?: string;
  resultsCount: number;
  timestamp: string;
}

export interface StoredCategoryConfig {
  name: string;
  icon: string;
  description: string;
  gradient: string;
}

const DEFAULT_CATEGORY_CONFIGS: Record<string, StoredCategoryConfig> = {
  'Văn học': {
    name: 'Văn học',
    icon: 'BookOpen',
    description: 'Tác phẩm văn học kinh điển, tiểu thuyết và truyện thiếu nhi bất hủ',
    gradient: 'from-orange-500 to-amber-500',
  },
  'Khoa học': {
    name: 'Khoa học',
    icon: 'Atom',
    description: 'Vật lý vũ trụ, sinh học phân tử, thuyết tương đối và khám phá tự nhiên',
    gradient: 'from-blue-500 to-cyan-500',
  },
  'Địa lý': {
    name: 'Địa lý',
    icon: 'Globe2',
    description: 'Địa chính trị thế giới, bản đồ, biến đổi khí hậu và hệ sinh thái Trái Đất',
    gradient: 'from-emerald-500 to-teal-500',
  },
  'Tâm lý': {
    name: 'Tâm lý',
    icon: 'Brain',
    description: 'Tư duy nhận thức, tâm lý học hành vi, trí tuệ cảm xúc và thấu hiểu bản thân',
    gradient: 'from-purple-500 to-indigo-500',
  },
  'Công nghệ': {
    name: 'Công nghệ',
    icon: 'Laptop',
    description: 'Kỷ nguyên AI, khoa học máy tính, kỹ nghệ phần mềm và kiến trúc mã nguồn',
    gradient: 'from-violet-500 to-fuchsia-500',
  },
  'Nghệ thuật': {
    name: 'Nghệ thuật',
    icon: 'Palette',
    description: 'Lịch sử hội họa, thẩm mỹ thị giác, điêu khắc và tư duy sáng tạo nghệ thuật',
    gradient: 'from-pink-500 to-rose-500',
  },
  'Lịch sử': {
    name: 'Lịch sử',
    icon: 'Scroll',
    description: 'Quốc sử Đại Việt hào hùng, tiến hóa nhân loại và những bước ngoặt văn minh',
    gradient: 'from-amber-600 to-yellow-600',
  },
  'Kỹ năng sống': {
    name: 'Kỹ năng sống',
    icon: 'Sparkles',
    description: '7 thói quen thành đạt, thuật đắc nhân tâm, quản lý thời gian và hướng nghiệp',
    gradient: 'from-teal-500 to-emerald-600',
  },
};

class LibraryDatabase {
  private books: Book[] = [];
  private scanLogs: ScanLog[] = [];
  private searchLogs: SearchLog[] = [];
  private customCategories: Record<string, StoredCategoryConfig> = { ...DEFAULT_CATEGORY_CONFIGS };
  private deletedBookIds: string[] = [];
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.isInitialized) return;

    try {
      // 1. Load permanent deleted IDs list first
      if (fs.existsSync(DELETED_FILE)) {
        try {
          const deletedRaw = fs.readFileSync(DELETED_FILE, 'utf-8');
          const parsedDeleted = JSON.parse(deletedRaw);
          if (Array.isArray(parsedDeleted)) {
            this.deletedBookIds = parsedDeleted;
          }
        } catch {}
      }

      // 2. Load primary data file
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.books = parsed.books || [];
        this.scanLogs = parsed.scanLogs || [];
        this.searchLogs = parsed.searchLogs || [];
        if (Array.isArray(parsed.deletedBookIds)) {
          this.deletedBookIds = Array.from(new Set([...this.deletedBookIds, ...parsed.deletedBookIds]));
        }
        if (parsed.customCategories && typeof parsed.customCategories === 'object') {
          this.customCategories = { ...DEFAULT_CATEGORY_CONFIGS, ...parsed.customCategories };
        }
      } else if (fs.existsSync(BACKUP_FILE)) {
        // Fallback to backup if primary data was wiped
        const raw = fs.readFileSync(BACKUP_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.books = parsed.books || [];
        this.scanLogs = parsed.scanLogs || [];
        this.searchLogs = parsed.searchLogs || [];
        if (Array.isArray(parsed.deletedBookIds)) {
          this.deletedBookIds = Array.from(new Set([...this.deletedBookIds, ...parsed.deletedBookIds]));
        }
      } else if (fs.existsSync(SRC_BOOKS_JSON)) {
        // Fallback to codebase data
        try {
          const raw = fs.readFileSync(SRC_BOOKS_JSON, 'utf-8');
          const parsed = JSON.parse(raw);
          this.books = Array.isArray(parsed) ? parsed : parsed.books || [];
          this.scanLogs = [];
          this.searchLogs = [];
          this.customCategories = { ...DEFAULT_CATEGORY_CONFIGS };
        } catch {}
      } else if (fs.existsSync(SEED_FILE)) {
        const raw = fs.readFileSync(SEED_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.books = parsed.map((b: Book) => ({
          ...b,
          views: b.views || 0,
          scanCount: b.scanCount || 0,
        }));
        this.scanLogs = [];
        this.searchLogs = [];
        this.customCategories = { ...DEFAULT_CATEGORY_CONFIGS };
      }

      // Strictly purge any books that were deleted by admin
      if (this.deletedBookIds.length > 0) {
        this.books = this.books.filter((b) => !this.deletedBookIds.includes(b.id));
      }

      // Ensure every book has complete enriched literary details (characters, author, plot, history)
      for (const b of this.books) {
        const insight = BOOK_DETAILED_INSIGHTS[b.id];
        if (insight) {
          if (!b.characters || b.characters.length === 0) {
            if (insight.detailedCharacters && insight.detailedCharacters.length > 0) {
              b.characters = insight.detailedCharacters.map((c, i) => ({
                id: c.id || `char-${i}`,
                name: c.name,
                role: c.role,
                description: c.description,
                avatarUrl: c.avatarUrl || c.avatar,
                personality: c.personality,
                symbolicMeaning: c.symbolicMeaning,
                keyQuote: c.keyQuote || c.quote,
              }));
            }
          }
          if (!b.authorDetails && insight.authorDetails) {
            b.authorDetails = insight.authorDetails;
          }
          if (!b.plotSynopsis && insight.plotSynopsis) {
            b.plotSynopsis = {
              overview: insight.plotSynopsis.overview,
              arc: insight.plotSynopsis.arc.map((a, i) => {
                const defaultPhases = ['Mở đầu', 'Biến cố', 'Cao trào', 'Mở nút & Kết thúc'] as const;
                return {
                  phase: a.phase || a.stage || defaultPhases[i % 4],
                  title: a.title,
                  description: a.description,
                };
              }),
              keyEvents: insight.plotSynopsis.keyEvents,
            };
          }
          if (!b.historicalContext && insight.historicalContext) {
            b.historicalContext = insight.historicalContext;
          }
        }

        // Ensure every book has a unique libraryCode (e.g. LIB-18324) for instant scanning
        const assignedCodes = new Set<string>();
        for (const b of this.books) {
          if (!b.libraryCode) {
            const cleanIsbnDigits = (b.isbn || '').replace(/[^0-9]/g, '');
            const suffix = cleanIsbnDigits && cleanIsbnDigits.length >= 4
              ? cleanIsbnDigits.slice(-5)
              : Math.floor(10000 + Math.random() * 90000).toString();
            let code = `LIB-${suffix}`;
            let cnt = 1;
            while (assignedCodes.has(code)) {
              code = `LIB-${suffix}-${cnt++}`;
            }
            b.libraryCode = code;
          }
          assignedCodes.add(b.libraryCode.toUpperCase());
        }
      }

      // Synchronize all persistent files on disk immediately
      this.persist();
    } catch (err) {
      console.error('Error initializing library database:', err);
    }
    this.isInitialized = true;
  }

  private persist() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Filter out deleted books
      if (this.deletedBookIds.length > 0) {
        this.books = this.books.filter((b) => !this.deletedBookIds.includes(b.id));
      }

      const fullPayload = {
        books: this.books,
        scanLogs: this.scanLogs,
        searchLogs: this.searchLogs,
        customCategories: this.customCategories,
        deletedBookIds: this.deletedBookIds,
        lastSavedAt: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(fullPayload, null, 2);

      // 1. Primary data file
      fs.writeFileSync(DATA_FILE, jsonString, 'utf-8');

      // 2. Redundant backup file
      fs.writeFileSync(BACKUP_FILE, jsonString, 'utf-8');

      // 3. Keep SEED_FILE in sync so fresh server starts never revert to old books!
      fs.writeFileSync(SEED_FILE, JSON.stringify(this.books, null, 2), 'utf-8');

      // 4. Record deleted book IDs permanently
      fs.writeFileSync(DELETED_FILE, JSON.stringify(this.deletedBookIds, null, 2), 'utf-8');

      // 5. Keep code data files in src/data/ exactly synchronized in real-time
      try {
        const srcDir = path.dirname(SRC_BOOKS_TS);
        if (!fs.existsSync(srcDir)) {
          fs.mkdirSync(srcDir, { recursive: true });
        }
        const tsContent = `import { Book } from '../types.js';\n\nexport const initialBooks: Book[] = ${JSON.stringify(this.books, null, 2)};\n`;
        fs.writeFileSync(SRC_BOOKS_TS, tsContent, 'utf-8');
        fs.writeFileSync(SRC_BOOKS_JSON, JSON.stringify(this.books, null, 2), 'utf-8');
      } catch (srcErr) {
        console.warn('Could not write to src/data/booksData.ts:', srcErr);
      }

      // 6. Keep static public/books-data.json synchronized for instant dynamic fetch on web publish
      try {
        const pubDir = path.join(process.cwd(), 'public');
        if (!fs.existsSync(pubDir)) {
          fs.mkdirSync(pubDir, { recursive: true });
        }
        fs.writeFileSync(path.join(pubDir, 'books-data.json'), JSON.stringify(this.books, null, 2), 'utf-8');
      } catch (pubErr) {
        console.warn('Could not write public/books-data.json:', pubErr);
      }

      // 7. Keep dist/books-data.json synchronized if production build directory exists
      try {
        const distDir = path.join(process.cwd(), 'dist');
        if (fs.existsSync(distDir)) {
          fs.writeFileSync(path.join(distDir, 'books-data.json'), JSON.stringify(this.books, null, 2), 'utf-8');
        }
      } catch {}
    } catch (err) {
      console.error('Failed to persist library data to disk:', err);
    }
  }

  // --- Public Methods ---

  public getAllBooks(filters?: {
    query?: string;
    category?: string;
    featured?: boolean;
    limit?: number;
    sort?: 'popular' | 'rating' | 'newest' | 'title';
  }): Book[] {
    let result = [...this.books];

    if (filters?.category && filters.category !== 'all') {
      result = result.filter(
        (b) => b.category.toLowerCase() === filters.category!.toLowerCase()
      );
    }

    if (filters?.featured) {
      result = result.filter((b) => b.featured);
    }

    if (filters?.query) {
      const q = filters.query.toLowerCase().trim();
      const cleanQ = q.replace(/[-\s]/g, '');
      result = result.filter((b) => {
        const cleanIsbn = b.isbn.replace(/[-\s]/g, '');
        return (
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          cleanIsbn.includes(cleanQ) ||
          b.description.toLowerCase().includes(q) ||
          b.themes.some((t) => t.toLowerCase().includes(q))
        );
      });

      // Log search query
      this.searchLogs.push({
        id: `search-${Date.now()}`,
        query: filters.query,
        category: filters.category,
        resultsCount: result.length,
        timestamp: new Date().toISOString(),
      });
      this.persist();
    }

    if (filters?.sort === 'popular') {
      result.sort((a, b) => b.scanCount + b.views - (a.scanCount + a.views));
    } else if (filters?.sort === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (filters?.sort === 'newest') {
      result.sort((a, b) => b.year - a.year);
    } else if (filters?.sort === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (filters?.limit && filters.limit > 0) {
      result = result.slice(0, filters.limit);
    }

    return result;
  }

  public getBookById(id: string, incrementView = true): Book | null {
    const book = this.books.find((b) => b.id === id);
    if (!book) return null;

    if (incrementView) {
      book.views = (book.views || 0) + 1;
      this.persist();
    }
    return book;
  }

  public getBookByIsbn(queryCode: string): Book | null {
    if (!queryCode) return null;
    const rawTrimmed = queryCode.toString().trim();
    if (!rawTrimmed) return null;

    const upper = rawTrimmed.toUpperCase();
    const cleanAlphaNum = upper.replace(/[^0-9A-Z]/g, '');
    const cleanDigits = upper.replace(/[^0-9]/g, '');

    // 1. Exact match on raw trimmed libraryCode, isbn, or id
    let found = this.books.find((b) => {
      const bookLib = (b.libraryCode || '').trim().toUpperCase();
      const bookIsbn = (b.isbn || '').trim().toUpperCase();
      const bookId = (b.id || '').trim().toUpperCase();

      if (bookLib && bookLib === upper) return true;
      if (bookIsbn && bookIsbn === upper) return true;
      if (bookId && bookId === upper) return true;
      return false;
    });
    if (found) return found;

    // 2. Normalized alphanumeric match (ignores hyphens, spaces, underscores: e.g. LIB-18324 vs LIB18324)
    if (cleanAlphaNum.length >= 3) {
      found = this.books.find((b) => {
        const bookLibClean = (b.libraryCode || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
        const bookIsbnClean = (b.isbn || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
        const bookIdClean = (b.id || '').toUpperCase().replace(/[^0-9A-Z]/g, '');

        if (bookLibClean && bookLibClean === cleanAlphaNum) return true;
        if (bookIsbnClean && bookIsbnClean === cleanAlphaNum) return true;
        if (bookIdClean && bookIdClean === cleanAlphaNum) return true;
        return false;
      });
      if (found) return found;
    }

    // 3. Match numeric suffix or part (e.g. searching '18324' finds 'LIB-18324' or '9786042183246')
    if (cleanDigits.length >= 4) {
      found = this.books.find((b) => {
        const bookLibDigits = (b.libraryCode || '').replace(/[^0-9]/g, '');
        const bookIsbnDigits = (b.isbn || '').replace(/[^0-9]/g, '');

        if (bookLibDigits && (bookLibDigits === cleanDigits || bookLibDigits.endsWith(cleanDigits) || cleanDigits.endsWith(bookLibDigits))) {
          return true;
        }
        if (bookIsbnDigits && (bookIsbnDigits === cleanDigits || bookIsbnDigits.endsWith(cleanDigits) || cleanDigits.endsWith(bookIsbnDigits))) {
          return true;
        }
        return false;
      });
      if (found) return found;
    }

    // 4. Substring inclusion if query length >= 4
    if (cleanAlphaNum.length >= 4) {
      found = this.books.find((b) => {
        const bookLibClean = (b.libraryCode || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
        const bookIsbnClean = (b.isbn || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
        return (
          (bookLibClean && (bookLibClean.includes(cleanAlphaNum) || cleanAlphaNum.includes(bookLibClean))) ||
          (bookIsbnClean && (bookIsbnClean.includes(cleanAlphaNum) || cleanAlphaNum.includes(bookIsbnClean)))
        );
      });
      if (found) return found;
    }

    // 5. Fallback: match by ID or title substring
    return (
      this.books.find(
        (b) =>
          b.id.toLowerCase() === rawTrimmed.toLowerCase() ||
          b.title.toLowerCase().includes(rawTrimmed.toLowerCase())
      ) || null
    );
  }

  public recordScan(isbn: string, source: 'camera' | 'manual' | 'kiosk-scanner'): {
    book: Book | null;
    success: boolean;
  } {
    const book = this.getBookByIsbn(isbn);
    const success = !!book;

    if (book) {
      book.scanCount = (book.scanCount || 0) + 1;
      book.views = (book.views || 0) + 1;
    }

    this.scanLogs.push({
      id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      bookId: book?.id,
      isbn,
      scannedAt: new Date().toISOString(),
      source,
      success,
    });

    this.persist();
    return { book, success };
  }

  public recordAiQuery(bookId: string, question: string) {
    this.searchLogs.push({
      id: `ai-query-${Date.now()}`,
      query: `[AI Q&A] ${question}`,
      category: 'AI Assistant',
      resultsCount: 1,
      timestamp: new Date().toISOString(),
    });
    this.persist();
  }

  public getCategories(): Category[] {
    const counts: Record<string, number> = {};
    for (const book of this.books) {
      counts[book.category] = (counts[book.category] || 0) + 1;
    }

    return Object.entries(this.customCategories).map(([catName, config]) => ({
      id: catName.toLowerCase().replace(/\s+/g, '-'),
      name: catName,
      icon: config.icon || 'BookOpen',
      description: config.description || `Các đầu sách thuộc chuyên mục ${catName}`,
      count: counts[catName] || 0,
      gradient: config.gradient || 'from-amber-500 to-orange-500',
    }));
  }

  public addCategory(cat: { name: string; description?: string; icon?: string; gradient?: string }): { success: boolean; error?: string; category?: Category } {
    const trimmed = cat.name.trim();
    if (!trimmed) {
      return { success: false, error: 'Tên thể loại không được để trống.' };
    }
    if (this.customCategories[trimmed]) {
      return { success: false, error: `Thể loại "${trimmed}" đã tồn tại.` };
    }

    const gradients = [
      'from-amber-500 to-orange-500',
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500',
      'from-purple-500 to-indigo-500',
      'from-rose-500 to-pink-500',
      'from-violet-500 to-fuchsia-500',
      'from-teal-500 to-emerald-600',
    ];
    const randomGrad = gradients[Object.keys(this.customCategories).length % gradients.length];

    this.customCategories[trimmed] = {
      name: trimmed,
      icon: cat.icon || 'Bookmark',
      description: cat.description?.trim() || `Tuyển tập các tác phẩm ${trimmed}`,
      gradient: cat.gradient || randomGrad,
    };

    this.persist();
    const created = this.getCategories().find((c) => c.name === trimmed);
    return { success: true, category: created };
  }

  public updateCategory(oldName: string, updates: { name?: string; description?: string; icon?: string; gradient?: string }): { success: boolean; error?: string } {
    if (!this.customCategories[oldName]) {
      return { success: false, error: 'Không tìm thấy thể loại cần cập nhật.' };
    }

    const newName = updates.name?.trim() || oldName;
    const existing = this.customCategories[oldName];

    if (newName !== oldName && this.customCategories[newName]) {
      return { success: false, error: `Thể loại "${newName}" đã tồn tại.` };
    }

    delete this.customCategories[oldName];
    this.customCategories[newName] = {
      name: newName,
      icon: updates.icon || existing.icon,
      description: updates.description !== undefined ? updates.description : existing.description,
      gradient: updates.gradient || existing.gradient,
    };

    // Also update existing books in this category if name changed
    if (newName !== oldName) {
      for (const book of this.books) {
        if (book.category === oldName) {
          book.category = newName;
        }
      }
    }

    this.persist();
    return { success: true };
  }

  public deleteCategory(name: string): { success: boolean; error?: string; affectedBooksCount?: number } {
    if (!this.customCategories[name]) {
      return { success: false, error: 'Không tìm thấy thể loại cần xóa.' };
    }

    delete this.customCategories[name];

    // Reassign books in deleted category to "Văn học" or first available category
    const remainingCats = Object.keys(this.customCategories);
    const fallback = remainingCats[0] || 'Chung';

    let affectedCount = 0;
    for (const book of this.books) {
      if (book.category === name) {
        book.category = fallback;
        affectedCount++;
      }
    }

    this.persist();
    return { success: true, affectedBooksCount: affectedCount };
  }

  public getRecommendations(bookId: string, limit = 4): Book[] {
    const current = this.books.find((b) => b.id === bookId);
    if (!current) {
      return this.books.slice(0, limit);
    }

    // Match by same category, overlapping themes, or author
    const scored = this.books
      .filter((b) => b.id !== bookId)
      .map((b) => {
        let score = 0;
        if (b.category === current.category) score += 5;
        if (b.author === current.author) score += 4;
        const sharedThemes = b.themes.filter((t) => current.themes.includes(t));
        score += sharedThemes.length * 3;
        score += b.rating;
        return { book: b, score };
      });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.book);
  }

  public getAnalytics(): AnalyticsData {
    const totalBooks = this.books.length;
    const totalScans = this.scanLogs.length;
    const totalQueries = this.searchLogs.length;
    const totalViews = this.books.reduce((acc, b) => acc + (b.views || 0), 0);

    // Group daily scans over last 7 days
    const dailyMap: Record<string, { scans: number; searches: number }> = {};
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * oneDay).toISOString().split('T')[0];
      dailyMap[d] = { scans: 0, searches: 0 };
    }

    for (const log of this.scanLogs) {
      const d = log.scannedAt.split('T')[0];
      if (dailyMap[d]) {
        dailyMap[d].scans += 1;
      }
    }

    for (const log of this.searchLogs) {
      const d = log.timestamp.split('T')[0];
      if (dailyMap[d]) {
        dailyMap[d].searches += 1;
      }
    }

    const dailyScans = Object.entries(dailyMap).map(([date, counts]) => ({
      date,
      scans: counts.scans,
      searches: counts.searches,
    }));

    // Category distribution
    const catCounts: Record<string, number> = {};
    for (const b of this.books) {
      catCounts[b.category] = (catCounts[b.category] || 0) + 1;
    }
    const categoryStats = Object.entries(catCounts).map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / (totalBooks || 1)) * 100),
    }));

    // Top books by scans + views
    const topBooks = [...this.books]
      .sort((a, b) => (b.scanCount || 0) + (b.views || 0) - ((a.scanCount || 0) + (a.views || 0)))
      .slice(0, 5)
      .map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        coverImage: b.coverImage,
        category: b.category,
        scanCount: b.scanCount || 0,
        views: b.views || 0,
      }));

    return {
      totalBooks,
      totalScans,
      totalQueries,
      totalViews,
      dailyScans,
      categoryStats,
      topBooks,
    };
  }

  // Admin CRUD
  public addBook(bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'scanCount'>): Book {
    const slug = bookData.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newBookId = `${slug}-${Date.now().toString().slice(-4)}`;

    // If this ID was ever in deletedBookIds, remove it so the book is fully active
    this.deletedBookIds = this.deletedBookIds.filter((dId) => dId !== newBookId);

    // Ensure a unique libraryCode is assigned!
    let libraryCode = bookData.libraryCode?.trim();
    if (!libraryCode) {
      const cleanNum = (bookData.isbn || '').replace(/[^0-9]/g, '');
      const suffix = cleanNum.length >= 4 ? cleanNum.slice(-5) : Math.floor(10000 + Math.random() * 90000).toString();
      libraryCode = `LIB-${suffix}`;
    }
    // Guarantee uniqueness
    let counter = 1;
    let finalLibCode = libraryCode;
    while (this.books.some((b) => b.libraryCode?.toUpperCase() === finalLibCode.toUpperCase())) {
      finalLibCode = `${libraryCode}-${counter}`;
      counter++;
    }

    const newBook: Book = {
      ...bookData,
      id: newBookId,
      libraryCode: finalLibCode,
      views: 1,
      scanCount: 0,
      rating: bookData.rating || 4.8,
      keyTakeaways: bookData.keyTakeaways || [],
      themes: bookData.themes || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.books.unshift(newBook);
    this.persist();
    return newBook;
  }

  public updateBook(id: string, updates: Partial<Book>): Book | null {
    const index = this.books.findIndex((b) => b.id === id);
    if (index === -1) return null;

    this.books[index] = {
      ...this.books[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.persist();
    return this.books[index];
  }

  public deleteBook(id: string): boolean {
    // Permanently record in deletedBookIds so it will NEVER be restored by any seed or reset
    if (!this.deletedBookIds.includes(id)) {
      this.deletedBookIds.push(id);
    }
    const initialLen = this.books.length;
    this.books = this.books.filter((b) => b.id !== id);
    this.persist();
    return true;
  }

  public getDeletedBookIds(): string[] {
    return [...this.deletedBookIds];
  }

  public syncWithClient(clientBooks: Book[], clientDeletedIds: string[]): Book[] {
    // 1. Permanently register all deleted IDs
    if (Array.isArray(clientDeletedIds)) {
      for (const dId of clientDeletedIds) {
        if (!this.deletedBookIds.includes(dId)) {
          this.deletedBookIds.push(dId);
        }
      }
    }

    // 2. Remove all deleted books from database
    this.books = this.books.filter((b) => !this.deletedBookIds.includes(b.id));

    // 3. Integrate any new or updated client books that are not deleted
    if (Array.isArray(clientBooks)) {
      for (const cBook of clientBooks) {
        if (!cBook || !cBook.id || this.deletedBookIds.includes(cBook.id)) continue;

        const existingIdx = this.books.findIndex((b) => b.id === cBook.id);
        if (existingIdx >= 0) {
          const serverUpdated = new Date(this.books[existingIdx].updatedAt || 0).getTime();
          const clientUpdated = new Date(cBook.updatedAt || 0).getTime();
          if (clientUpdated >= serverUpdated) {
            this.books[existingIdx] = { ...this.books[existingIdx], ...cBook };
          }
        } else {
          this.books.unshift(cBook);
        }
      }
    }

    // Deduplicate books by ID
    const seen = new Set<string>();
    this.books = this.books.filter((b) => {
      if (seen.has(b.id) || this.deletedBookIds.includes(b.id)) return false;
      seen.add(b.id);
      return true;
    });

    this.persist();
    return this.books;
  }

  public getDataFileInfo(): {
    books: Book[];
    rawJson: string;
    filePath: string;
    lastSavedAt: string;
    count: number;
    categories: Record<string, StoredCategoryConfig>;
  } {
    let rawJson = '';
    let lastSavedAt = new Date().toISOString();
    try {
      if (fs.existsSync(DATA_FILE)) {
        rawJson = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(rawJson);
        if (parsed.lastSavedAt) lastSavedAt = parsed.lastSavedAt;
      } else {
        rawJson = JSON.stringify({ books: this.books, lastSavedAt }, null, 2);
      }
    } catch {
      rawJson = JSON.stringify({ books: this.books, lastSavedAt }, null, 2);
    }

    return {
      books: this.books,
      rawJson,
      filePath: 'data/library-data.json',
      lastSavedAt,
      count: this.books.length,
      categories: this.customCategories,
    };
  }

  public updateEntireDataFile(
    newBooks: Book[],
    updatedRawCategories?: Record<string, StoredCategoryConfig>
  ): {
    success: boolean;
    count: number;
    error?: string;
  } {
    if (!Array.isArray(newBooks)) {
      return { success: false, count: 0, error: 'Dữ liệu sách phải là một danh sách các cuốn sách (JSON Array).' };
    }

    const validBooks: Book[] = [];
    for (let i = 0; i < newBooks.length; i++) {
      const b = newBooks[i];
      if (!b || typeof b !== 'object') continue;
      if (!b.title || !b.author) {
        return { success: false, count: 0, error: `Cuốn sách ở vị trí ${i + 1} thiếu Tên sách hoặc Tác giả.` };
      }
      const slug = b.id || b.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
      validBooks.push({
        ...b,
        id: b.id || `${slug}-${Date.now().toString().slice(-4)}`,
        category: b.category || 'Văn học',
        views: typeof b.views === 'number' ? b.views : 1,
        scanCount: typeof b.scanCount === 'number' ? b.scanCount : 0,
        rating: typeof b.rating === 'number' ? b.rating : 4.9,
        updatedAt: new Date().toISOString(),
      });
    }

    // Reset deleted IDs for any re-imported or newly provided book IDs
    const newBookIds = new Set(validBooks.map((b) => b.id));
    this.deletedBookIds = this.deletedBookIds.filter((dId) => !newBookIds.has(dId));

    this.books = validBooks;
    if (updatedRawCategories && typeof updatedRawCategories === 'object') {
      this.customCategories = { ...this.customCategories, ...updatedRawCategories };
    }

    this.persist();
    return { success: true, count: this.books.length };
  }
}

export const db = new LibraryDatabase();
