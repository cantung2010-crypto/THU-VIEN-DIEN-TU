import { Router, Request, Response } from 'express';
import { db } from './db.js';
import { aiService } from './ai-service.js';

export const apiRouter = Router();

// Ensure all API responses are fresh and never cached across any device
apiRouter.use((req: Request, res: Response, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// 1. Get all books (with search, category filter, sort, limit)
apiRouter.get('/books', (req: Request, res: Response) => {
  try {
    const { q, category, featured, sort, limit } = req.query;
    const books = db.getAllBooks({
      query: typeof q === 'string' ? q : undefined,
      category: typeof category === 'string' ? category : undefined,
      featured: featured === 'true',
      sort: typeof sort === 'string' ? (sort as any) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    res.json({ success: true, count: books.length, books, deletedIds: db.getDeletedBookIds() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1b. Permanent Two-Way Synchronization with Client Storage
apiRouter.post('/books/sync', (req: Request, res: Response) => {
  try {
    const { books = [], deletedIds = [] } = req.body;
    const syncedBooks = db.syncWithClient(books, deletedIds);
    res.json({ success: true, count: syncedBooks.length, books: syncedBooks, deletedIds: db.getDeletedBookIds() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get book by ID
apiRouter.get('/books/:id', (req: Request, res: Response) => {
  try {
    const book = db.getBookById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy cuốn sách này trong hệ thống.' });
    }
    const related = db.getRecommendations(book.id, 4);
    res.json({ success: true, book, related });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Get book by ISBN
apiRouter.get('/books/isbn/:isbn', (req: Request, res: Response) => {
  try {
    const book = db.getBookByIsbn(req.params.isbn);
    if (!book) {
      return res.status(404).json({
        success: false,
        error: `Không tìm thấy sách với mã ISBN: ${req.params.isbn}`,
        suggestion: 'Hãy kiểm tra lại mã vạch hoặc tìm kiếm theo tên sách.',
      });
    }
    res.json({ success: true, book });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Barcode scan endpoint (records scan count & logs history)
apiRouter.post('/barcode/scan', async (req: Request, res: Response) => {
  try {
    const { isbn, barcode, source = 'camera' } = req.body;
    const codeToLookup = (isbn || barcode || '').toString().trim();

    if (!codeToLookup) {
      return res.status(400).json({ success: false, error: 'Mã vạch hoặc ISBN không được để trống.' });
    }

    const { book } = db.recordScan(codeToLookup, source);

    if (book) {
      return res.json({
        success: true,
        foundInDb: true,
        isNewlyCreated: false,
        message: `✓ Đã tìm thấy sách trong thư viện: "${book.title}" (Mã: ${book.libraryCode || book.isbn})!`,
        barcode: codeToLookup,
        book,
      });
    }

    // Book is not yet in local library database:
    // Theo yêu cầu: "từ mã vạch tạo cho cái sách 1 mã mới xong từ mã mới ý chỉ cần quét sẽ ra luôn sách ý"
    // Tự động phân tích, tạo sách mới, cấp mã thư viện và lưu thẳng vào cơ sở dữ liệu!
    let onlineBookData: any = null;
    const cleanDigits = codeToLookup.replace(/[^0-9X]/gi, '').toUpperCase();
    if (cleanDigits.length >= 8) {
      try {
        onlineBookData = await aiService.autoCompleteBookDetails({ isbn: cleanDigits });
      } catch (e) {
        console.warn('Online ISBN lookup fallback failed:', e);
      }
    }

    const cleanNum = codeToLookup.replace(/[^0-9]/g, '');
    const codeSuffix = cleanNum.length >= 4 ? cleanNum.slice(-5) : Math.floor(10000 + Math.random() * 90000).toString();
    const newLibraryCode = `LIB-${codeSuffix}`;

    const newBook = db.addBook({
      isbn: codeToLookup,
      libraryCode: newLibraryCode,
      title: onlineBookData?.title || `Sách Mới (Mã: ${codeToLookup})`,
      author: onlineBookData?.author || 'Tác giả thư viện',
      publisher: onlineBookData?.publisher || 'Nhà xuất bản Thư Viện',
      year: onlineBookData?.year || new Date().getFullYear(),
      category: onlineBookData?.category || 'Sách mới quét',
      description: onlineBookData?.description || `Cuốn sách được ghi nhận tự động từ mã quét ${codeToLookup}. Đã cấp mã thư viện ${newLibraryCode}.`,
      summary: onlineBookData?.summary || onlineBookData?.description || `Tác phẩm nhập từ mã quét ${codeToLookup}.`,
      keyTakeaways: onlineBookData?.keyTakeaways || ['Ấn bản thư viện thông minh', 'Tra cứu mã tức thì', 'Mã thư viện liên kết'],
      themes: onlineBookData?.themes || ['Sách tra cứu', 'Văn hóa đọc'],
      message: onlineBookData?.message || 'Mỗi cuốn sách mở ra một chân trời mới.',
      targetAge: 'Mọi lứa tuổi',
      shelfLocation: onlineBookData?.shelfLocation || 'Kệ sách mới nhập',
      coverImage: onlineBookData?.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
      aiContext: onlineBookData?.description || `Sách mã ${codeToLookup} trong hệ thống thư viện thông minh.`,
      characters: onlineBookData?.characters || [],
      authorDetails: onlineBookData?.authorDetails,
      plotSynopsis: onlineBookData?.plotSynopsis,
      historicalContext: onlineBookData?.historicalContext,
      rating: 5.0,
      pageCount: onlineBookData?.pageCount || 200,
    });

    return res.json({
      success: true,
      foundInDb: true,
      isNewlyCreated: true,
      barcode: codeToLookup,
      newLibraryCode: newBook.libraryCode,
      book: newBook,
      message: `🎉 ĐÃ TẠO MÃ SÁCH MỚI: [${newBook.libraryCode}]! Cuốn sách đã được lưu vào hệ thống. Từ nay bạn chỉ cần quét mã này hoặc mã vạch gốc là ra luôn sách!`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4b. Barcode image reader endpoint (OCR & AI decoding from uploaded photo)
apiRouter.post('/barcode/read-image', async (req: Request, res: Response) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp hình ảnh mã vạch.' });
    }

    const result = await aiService.readBarcodeFromImage(image);
    if (result.detected && result.isbn) {
      const book = db.getBookByIsbn(result.isbn);

      return res.json({
        success: true,
        detected: true,
        isbn: result.isbn,
        rawText: result.rawText,
        bookTitle: result.bookTitle || book?.title,
        confidence: result.confidence,
        book: book || null,
        message: book
          ? `✓ Đã nhận diện mã ISBN ${result.isbn} và tìm thấy sách: "${book.title}"`
          : `✓ Đã trích xuất mã ISBN: ${result.isbn}`,
      });
    }

    res.json({
      success: false,
      detected: false,
      isBusy: result.isBusy || false,
      message:
        result.message ||
        'Chưa thể đọc được số mã vạch từ bức ảnh này. Bạn hãy thử chụp gần hơn, đủ ánh sáng hoặc nhập mã số trực tiếp.',
    });
  } catch (err: any) {
    console.error('Error in /api/barcode/read-image:', err?.message || err);
    res.status(500).json({ success: false, error: err.message || 'Lỗi xử lý ảnh mã vạch' });
  }
});

// 4b-2. Real-time ISBN online lookup for books not yet in DB
apiRouter.post('/barcode/lookup-online', async (req: Request, res: Response) => {
  try {
    const { isbn } = req.body;
    if (!isbn) {
      return res.status(400).json({ success: false, error: 'Mã ISBN không được để trống.' });
    }
    const cleanIsbn = isbn.toString().replace(/[^0-9X]/gi, '').toUpperCase();
    
    // Check local database first
    const existing = db.getBookByIsbn(cleanIsbn);
    if (existing) {
      return res.json({ success: true, fromLocalDb: true, book: existing });
    }

    // Lookup online with Google Search grounded AI service
    const bookData = await aiService.autoCompleteBookDetails({ isbn: cleanIsbn });
    res.json({
      success: true,
      fromLocalDb: false,
      book: bookData,
      bookData,
      message: `✓ Đã tìm thấy thông tin cuốn sách từ mã ISBN ${cleanIsbn}`,
    });
  } catch (err: any) {
    console.error('Error in /api/barcode/lookup-online:', err);
    res.status(500).json({ success: false, error: err.message || 'Lỗi tra cứu trực tuyến' });
  }
});

// 4c. AI Auto-complete book details from cover, author, publisher
apiRouter.post('/ai/auto-complete-book', async (req: Request, res: Response) => {
  try {
    const { title, author, publisher, category, coverImage, barcodeImage, isbn } = req.body;
    const completed = await aiService.autoCompleteBookDetails({
      title,
      author,
      publisher,
      category,
      coverImage,
      barcodeImage,
      isbn,
    });

    res.json({
      success: true,
      book: completed,
      provider: completed.provider,
      message: '✓ AI đã tự động phân tích và tạo đầy đủ thông tin sách!',
    });
  } catch (err: any) {
    console.error('Error in /api/ai/auto-complete-book:', err);
    res.status(500).json({ success: false, error: err.message || 'Lỗi khi tự động điền thông tin sách' });
  }
});

// 5. AI Chat grounded on specific book
apiRouter.post('/ai/chat', async (req: Request, res: Response) => {
  try {
    const { bookId, question } = req.body;

    if (!bookId || !question) {
      return res.status(400).json({ success: false, error: 'Thiếu bookId hoặc câu hỏi cho AI.' });
    }

    const book = db.getBookById(bookId, false);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy cuốn sách này.' });
    }

    const aiResult = await aiService.chatAboutBook(book, question);
    db.recordAiQuery(book.id, question);

    res.json({
      success: true,
      answer: aiResult.answer,
      provider: aiResult.provider,
      model: aiResult.model,
      sources: aiResult.sources,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error in /api/ai/chat:', err);
    res.status(500).json({
      success: false,
      error: '🤖 AI đang gặp chút vấn đề. Hãy thử lại sau.',
    });
  }
});

// 6. Recommendations
apiRouter.get('/recommendations', (req: Request, res: Response) => {
  try {
    const { bookId, limit = '4' } = req.query;
    const books = db.getRecommendations(
      typeof bookId === 'string' ? bookId : '',
      parseInt(limit as string, 10) || 4
    );
    res.json({ success: true, books });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6b. Personalized Recommendation by Traits & Preferences (Google Gemini & Grounded Engine)
apiRouter.post('/ai/personality-match', async (req: Request, res: Response) => {
  try {
    const {
      target = 'self',
      targetName = '',
      personalityTraits = [],
      customPersonality = '',
      favoriteGenres = [],
      readingGoal = '',
    } = req.body;

    const allBooks = db.getAllBooks({ limit: 100 });
    const matchResult = await aiService.matchBooksByPersonality(
      {
        target,
        targetName,
        personalityTraits,
        customPersonality,
        favoriteGenres,
        readingGoal,
      },
      allBooks
    );

    // Hydrate each recommendation with the full book object
    const recommendations = matchResult.recommendations
      .map((rec) => {
        const book = db.getBookById(rec.bookId, false);
        return book ? { ...rec, book } : null;
      })
      .filter(Boolean);

    res.json({
      success: true,
      recommendations,
      aiComment: matchResult.aiComment,
      provider: matchResult.provider,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error in /api/ai/personality-match:', err);
    res.status(500).json({ success: false, error: err.message || 'Lỗi khi phân tích sở thích cá nhân' });
  }
});

// 6c. Book Curiosities & Insights with Vivid Imagery
apiRouter.post('/ai/book-curiosities', async (req: Request, res: Response) => {
  try {
    const { bookId } = req.body;
    if (!bookId) {
      return res.status(400).json({ success: false, error: 'bookId is required' });
    }

    const book = db.getBookById(bookId, false);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy sách trong thư viện.' });
    }

    const result = await aiService.generateBookCuriosities(book);

    res.json({
      success: true,
      bookId: book.id,
      curiosities: result.curiosities,
      provider: result.provider,
    });
  } catch (err: any) {
    console.error('Error in /api/ai/book-curiosities:', err);
    res.status(500).json({ success: false, error: err.message || 'Lỗi khi tạo câu hỏi tò mò về sách' });
  }
});

// 6d. Dynamic AI Book Quiz Generator (Multiple Choice, True/False, Mystery Deduction)
apiRouter.post('/ai/book-quiz-generate', async (req: Request, res: Response) => {
  try {
    const { bookId } = req.body;
    if (!bookId) {
      return res.status(400).json({ success: false, error: 'Thiếu bookId' });
    }

    const book = db.getBookById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy sách' });
    }

    const result = await aiService.generateDynamicBookQuiz(book);
    res.json({
      success: true,
      questions: result.questions,
      provider: result.provider,
    });
  } catch (err: any) {
    console.error('Error in /api/ai/book-quiz-generate:', err);
    res.status(500).json({ success: false, error: err.message || 'Lỗi khi tạo câu hỏi trắc nghiệm' });
  }
});

// 7. Categories
apiRouter.get('/categories', (req: Request, res: Response) => {
  try {
    const categories = db.getCategories();
    res.json({ success: true, categories });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/categories', (req: Request, res: Response) => {
  try {
    const { name, description, icon, gradient } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Tên thể loại không được để trống.' });
    }
    const result = db.addCategory({ name, description, icon, gradient });
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    res.status(201).json({ success: true, category: result.category, message: 'Đã thêm thể loại mới thành công!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/categories/:name', (req: Request, res: Response) => {
  try {
    const oldName = decodeURIComponent(req.params.name);
    const { name, description, icon, gradient } = req.body;
    const result = db.updateCategory(oldName, { name, description, icon, gradient });
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    res.json({ success: true, message: 'Đã cập nhật thể loại thành công!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/categories/:name', (req: Request, res: Response) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const result = db.deleteCategory(name);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    res.json({
      success: true,
      message: `Đã xóa thể loại "${name}" thành công!`,
      affectedBooksCount: result.affectedBooksCount,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Analytics for librarian dashboard
apiRouter.get('/analytics', (req: Request, res: Response) => {
  try {
    const analytics = db.getAnalytics();
    res.json({ success: true, analytics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Admin CRUD - Create book
apiRouter.post('/books', (req: Request, res: Response) => {
  try {
    const {
      title,
      author,
      isbn,
      libraryCode,
      category,
      description,
      summary,
      publisher,
      year,
      coverImage,
      barcodeImage,
      aiContext,
      themes,
      keyTakeaways,
      message,
      targetAge,
      rating,
      shelfLocation,
      pageCount,
      characters,
      plotSynopsis,
      authorDetails,
      historicalContext,
    } = req.body;

    if (!title || !author || !category) {
      return res.status(400).json({ success: false, error: 'Tiêu đề, tác giả và thể loại là bắt buộc.' });
    }

    const generatedIsbn = isbn?.trim() || `978604${Date.now().toString().slice(-7)}`;

    const existing = db.getBookByIsbn(generatedIsbn);
    if (existing) {
      return res.status(409).json({ success: false, error: `Mã ISBN ${generatedIsbn} đã tồn tại trong thư viện (${existing.title}).` });
    }

    const newBook = db.addBook({
      title,
      author,
      isbn: generatedIsbn,
      libraryCode: libraryCode?.trim() || undefined,
      category,
      description: description || 'Mô tả tóm tắt sách',
      summary: summary || description || 'Nội dung cốt lõi của tác phẩm',
      publisher: publisher || 'Thư viện trường học',
      year: parseInt(year, 10) || new Date().getFullYear(),
      coverImage: coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
      barcodeImage: barcodeImage || undefined,
      shelfLocation: shelfLocation || 'Kệ A1 - Tầng 2',
      pageCount: parseInt(pageCount, 10) || 280,
      aiContext: aiContext || `Dữ liệu sách ${title} do bạn đọc đóng góp vào thư viện.`,
      themes: Array.isArray(themes) ? themes : typeof themes === 'string' ? themes.split(',').map((s: string) => s.trim()) : ['Đọc sách', 'Tri thức'],
      keyTakeaways: Array.isArray(keyTakeaways) ? keyTakeaways : typeof keyTakeaways === 'string' ? keyTakeaways.split('\n').filter(Boolean) : ['Trau dồi tri thức mỗi ngày'],
      message: message || 'Mở một cuốn sách, mở ra một thế giới.',
      targetAge: targetAge || 'Học sinh THPT',
      rating: parseFloat(rating) || 4.9,
      featured: false,
      characters: Array.isArray(characters) ? characters : undefined,
      plotSynopsis: plotSynopsis && typeof plotSynopsis === 'object' ? plotSynopsis : undefined,
      authorDetails: authorDetails && typeof authorDetails === 'object' ? authorDetails : undefined,
      historicalContext: historicalContext && typeof historicalContext === 'object' ? historicalContext : undefined,
    });

    res.status(201).json({ success: true, book: newBook, message: 'Đã thêm sách mới thành công!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Admin CRUD - Update book
apiRouter.put('/books/:id', (req: Request, res: Response) => {
  try {
    const updated = db.updateBook(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy sách để cập nhật.' });
    }
    res.json({ success: true, book: updated, message: 'Cập nhật thông tin sách thành công!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Admin CRUD - Delete book
apiRouter.delete('/books/:id', (req: Request, res: Response) => {
  try {
    const deleted = db.deleteBook(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy sách để xóa.' });
    }
    res.json({ success: true, message: 'Đã xóa sách khỏi thư viện thành công.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Smart Kiosk / Raspberry Pi Terminal API
apiRouter.get('/device/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    device: {
      deviceId: 'THU-VIEN-THONG-MINH-KIOSK-01',
      name: 'THƯ VIỆN THÔNG MINH — Smart Discovery Station',
      location: 'Sảnh chính Thư viện Tầng 2',
      status: 'online',
      hardware: {
        board: 'Raspberry Pi 5 (8GB)',
        camera: 'Raspberry Pi Camera Module 3 (Wide-Angle)',
        audio: 'Hi-Fi DAC Speaker Output',
        display: '10.1 inch IPS Capacitive Touchscreen (1280x800)',
      },
      lastHeartbeat: new Date().toISOString(),
      firmwareVersion: 'v2.4-ai-edge',
      geminiConnected: aiService.isGeminiAvailable(),
    },
  });
});

apiRouter.post('/device/scan', (req: Request, res: Response) => {
  try {
    const { barcode, deviceId = 'LIBRA-RPI-KIOSK-01' } = req.body;
    if (!barcode) {
      return res.status(400).json({ success: false, error: 'Mã barcode rỗng từ thiết bị.' });
    }

    const { book, success } = db.recordScan(barcode, 'kiosk-scanner');
    if (!book) {
      return res.status(404).json({
        success: false,
        deviceId,
        ttsText: 'Không tìm thấy sách trong cơ sở dữ liệu thư viện. Vui lòng liên hệ thủ thư.',
        message: 'Mã vạch không khớp sách nào.',
      });
    }

    res.json({
      success: true,
      deviceId,
      book,
      ttsText: `Chào bạn! Cuốn sách ${book.title} của tác giả ${book.author}. ${book.message}`,
      screenAction: 'DISPLAY_BOOK_DETAILS',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. AI Dynamic Book Quiz Generator
apiRouter.post('/ai/book-quiz-generate', async (req: Request, res: Response) => {
  try {
    const { bookId } = req.body;
    if (!bookId) {
      return res.status(400).json({ success: false, error: 'Thiếu bookId trong yêu cầu.' });
    }

    const book = db.getBookById(bookId, false);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy cuốn sách này.' });
    }

    const quizResult = await aiService.generateDynamicBookQuiz(book);

    res.json({
      success: true,
      provider: quizResult.provider,
      questions: quizResult.questions,
    });
  } catch (err: any) {
    console.error('Error in /api/ai/book-quiz-generate:', err);
    res.status(500).json({ success: false, error: 'Không thể sinh câu hỏi AI vào thời điểm này.' });
  }
});

// 14. Admin Direct Book Data File Management (Raw JSON, Live Link, Permanent Storage)
apiRouter.get('/admin/data-file', (req: Request, res: Response) => {
  try {
    const fileInfo = db.getDataFileInfo();
    res.json({
      success: true,
      ...fileInfo,
      message: '✓ Đã tải thông tin file dữ liệu sách gốc thành công.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Lỗi khi đọc file dữ liệu.' });
  }
});

apiRouter.post('/admin/data-file', (req: Request, res: Response) => {
  try {
    const { books, rawJson } = req.body;
    let targetBooks = books;

    if (rawJson && typeof rawJson === 'string') {
      try {
        const parsed = JSON.parse(rawJson);
        targetBooks = Array.isArray(parsed) ? parsed : parsed.books || [];
      } catch (parseErr: any) {
        return res.status(400).json({
          success: false,
          error: `Định dạng JSON không hợp lệ: ${parseErr.message}`,
        });
      }
    }

    if (!Array.isArray(targetBooks)) {
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu sách phải là một danh sách hợp lệ (JSON Array).',
      });
    }

    const result = db.updateEntireDataFile(targetBooks);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      count: result.count,
      books: db.getAllBooks(),
      message: `✓ Đã lưu vĩnh viễn ${result.count} cuốn sách vào file data hệ thống (library-data.json, seed-books.json, booksData.json)! Dữ liệu không bị khóa sửa code khi publish.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Lỗi khi lưu file dữ liệu.' });
  }
});

// 15. Export book data file as .json download
apiRouter.get('/admin/export-data', (req: Request, res: Response) => {
  try {
    const books = db.getAllBooks();
    const jsonContent = JSON.stringify(books, null, 2);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="library-data.json"');
    res.send(jsonContent);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 16. Import book data file (.json upload)
apiRouter.post('/admin/import-data', (req: Request, res: Response) => {
  try {
    const { books, jsonString } = req.body;
    let importedBooks = books;

    if (jsonString && typeof jsonString === 'string') {
      try {
        const parsed = JSON.parse(jsonString);
        importedBooks = Array.isArray(parsed) ? parsed : parsed.books || [];
      } catch (parseErr: any) {
        return res.status(400).json({ success: false, error: `Lỗi đọc file JSON: ${parseErr.message}` });
      }
    }

    if (!Array.isArray(importedBooks) || importedBooks.length === 0) {
      return res.status(400).json({ success: false, error: 'Không tìm thấy cuốn sách nào trong dữ liệu tải lên.' });
    }

    const result = db.updateEntireDataFile(importedBooks);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      count: result.count,
      books: db.getAllBooks(),
      message: `✓ Đã nhập thành công ${result.count} cuốn sách và cập nhật vĩnh viễn vào file data hệ thống!`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Lỗi khi nhập dữ liệu sách.' });
  }
});

// 17. Public Static Direct Book Data Endpoint
apiRouter.get('/books-data.json', (req: Request, res: Response) => {
  try {
    const books = db.getAllBooks();
    res.json(books);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
