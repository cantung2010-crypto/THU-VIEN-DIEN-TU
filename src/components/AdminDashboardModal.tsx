import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  FolderTree,
  Check,
  AlertTriangle,
  Layers,
  Search,
  BookPlus,
  Save,
  CheckCircle2,
  Palette,
  Download,
  UploadCloud,
  FileText,
  RefreshCw,
  FileCode,
  Database,
  Sparkles,
} from 'lucide-react';
import { Book, Category } from '../types.js';
import { AddBookModal } from './AddBookModal.js';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  categories: Category[];
  onDataRefresh: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  onBookAdded?: (book: Book) => void;
  onBookUpdated?: (book: Book) => void;
  onBookDeleted?: (bookId: string) => void;
}

const CATEGORY_ICONS = [
  'BookOpen',
  'Atom',
  'Globe2',
  'Brain',
  'Laptop',
  'Palette',
  'Scroll',
  'Sparkles',
  'Compass',
  'Bookmark',
];

const GRADIENT_PRESETS = [
  { label: 'Cam Amber', value: 'from-amber-500 to-orange-500' },
  { label: 'Xanh Biển', value: 'from-blue-500 to-cyan-500' },
  { label: 'Xanh Lá', value: 'from-emerald-500 to-teal-500' },
  { label: 'Tím Indigo', value: 'from-purple-500 to-indigo-500' },
  { label: 'Hồng Đào', value: 'from-rose-500 to-pink-500' },
  { label: 'Tím Violet', value: 'from-violet-500 to-fuchsia-500' },
  { label: 'Ngọc Lục Bảo', value: 'from-teal-500 to-emerald-600' },
  { label: 'Vàng Hoàng Gia', value: 'from-amber-600 to-yellow-600' },
];

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  books,
  categories,
  onDataRefresh,
  onShowToast,
  onBookAdded,
  onBookUpdated,
  onBookDeleted,
}) => {
  const [activeTab, setActiveTab] = useState<'books' | 'categories'>('books');
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);

  const [isSavingDataFile, setIsSavingDataFile] = useState(false);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // Handle Export / Download .json
  const handleExportDataFile = () => {
    try {
      const blob = new Blob([JSON.stringify(books, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `library-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onShowToast('✓ Đã tải file dữ liệu sách (.json) về máy của bạn!');
    } catch {
      window.open('/api/admin/export-data', '_blank');
    }
  };

  // Handle Import .json from Computer
  const handleImportFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const booksList = Array.isArray(parsed) ? parsed : parsed.books;
      if (!Array.isArray(booksList) || booksList.length === 0) {
        onShowToast('File tải lên không chứa danh sách sách hợp lệ.', 'error');
        return;
      }

      setIsSavingDataFile(true);
      const res = await fetch('/api/admin/import-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ books: booksList }),
      });
      const data = await res.json();
      if (data.success) {
        onShowToast(`✓ Đã nhập thành công ${data.count} cuốn sách từ file và lưu vĩnh viễn vào hệ thống!`);
        onDataRefresh();
      } else {
        onShowToast(data.error || 'Lỗi khi nhập dữ liệu.', 'error');
      }
    } catch (err: any) {
      onShowToast(`Lỗi đọc file: ${err.message}`, 'error');
    } finally {
      setIsSavingDataFile(false);
      if (importFileInputRef.current) {
        importFileInputRef.current.value = '';
      }
    }
  };

  const mainScrollRef = useRef<HTMLDivElement>(null);

  // Reset scroll to top on tab switch
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Book search & filter in admin
  const [searchBookTerm, setSearchBookTerm] = useState('');
  const [selectedBookCategory, setSelectedBookCategory] = useState('all');

  // Book Editing state
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editShelfLocation, setEditShelfLocation] = useState('');
  const [editIsbn, setEditIsbn] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editPublisher, setEditPublisher] = useState('');
  const [editYear, setEditYear] = useState('');
  const [isSavingBook, setIsSavingBook] = useState(false);

  // Deleting Book state
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);

  // Category state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatGradient, setNewCatGradient] = useState(GRADIENT_PRESETS[0].value);
  const [isAddingCat, setIsAddingCat] = useState(false);

  // Editing Category state
  const [editingCatName, setEditingCatName] = useState<string | null>(null);
  const [editCatNewName, setEditCatNewName] = useState('');
  const [editCatNewDesc, setEditCatNewDesc] = useState('');
  const [editCatNewGrad, setEditCatNewGrad] = useState('');
  const [isUpdatingCat, setIsUpdatingCat] = useState(false);

  // Deleting category state
  const [deletingCatName, setDeletingCatName] = useState<string | null>(null);

  // Custom confirmation dialog states for iFrame reliability
  const [bookToDelete, setBookToDelete] = useState<{ id: string; title: string } | null>(null);
  const [catToDelete, setCatToDelete] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filtered books
  const filteredBooks = books.filter((b) => {
    const matchesQuery =
      !searchBookTerm.trim() ||
      b.title.toLowerCase().includes(searchBookTerm.toLowerCase()) ||
      b.author.toLowerCase().includes(searchBookTerm.toLowerCase()) ||
      b.isbn.toLowerCase().includes(searchBookTerm.toLowerCase());
    const matchesCat =
      selectedBookCategory === 'all' || b.category.toLowerCase() === selectedBookCategory.toLowerCase();
    return matchesQuery && matchesCat;
  });

  // Handle Start Edit Book
  const handleStartEditBook = (book: Book) => {
    setBookToEdit(book);
    setIsAddBookOpen(true);
  };

  // Handle Save Book Changes
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;

    if (!editTitle.trim() || !editAuthor.trim() || !editCategory.trim()) {
      onShowToast('Tên sách, tác giả và thể loại không được để trống.', 'error');
      return;
    }

    setIsSavingBook(true);
    try {
      const res = await fetch(`/api/books/${editingBook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingBook,
          title: editTitle.trim(),
          author: editAuthor.trim(),
          category: editCategory.trim(),
          shelfLocation: editShelfLocation.trim(),
          isbn: editIsbn.trim(),
          summary: editSummary.trim(),
          publisher: editPublisher.trim(),
          year: parseInt(editYear, 10) || editingBook.year,
        }),
      });
      const data = await res.json();
      if (data.success && data.book) {
        try {
          const keys = ['smart_library_books_v3', 'smart_library_books_v2', 'smart_library_books'];
          for (const k of keys) {
            const booksRaw = localStorage.getItem(k);
            if (booksRaw) {
              const parsed = JSON.parse(booksRaw);
              const updated = parsed.map((b: any) => (b.id === data.book.id ? data.book : b));
              localStorage.setItem(k, JSON.stringify(updated));
            }
          }
        } catch {}
        onShowToast(`✓ Đã cập nhật cuốn sách "${editTitle.trim()}"!`);
        if (onBookUpdated) onBookUpdated(data.book);
        setEditingBook(null);
        onDataRefresh();
      } else {
        onShowToast(data.error || 'Lỗi khi cập nhật sách.', 'error');
      }
    } catch {
      onShowToast('Không thể kết nối máy chủ.', 'error');
    } finally {
      setIsSavingBook(false);
    }
  };

  // Handle Delete Book
  const handleDeleteBook = async (bookId: string, bookTitle: string) => {
    setDeletingBookId(bookId);
    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        // Permanently record deletion in client storage across all keys
        try {
          const delKeys = ['smart_library_deleted_ids_v3', 'smart_library_deleted_ids_v2', 'smart_library_deleted_ids'];
          for (const dk of delKeys) {
            const raw = localStorage.getItem(dk);
            const deleted = raw ? JSON.parse(raw) : [];
            if (!deleted.includes(bookId)) {
              deleted.push(bookId);
              localStorage.setItem(dk, JSON.stringify(deleted));
            }
          }
          const bookKeys = ['smart_library_books_v3', 'smart_library_books_v2', 'smart_library_books'];
          for (const bk of bookKeys) {
            const booksRaw = localStorage.getItem(bk);
            if (booksRaw) {
              const parsed = JSON.parse(booksRaw);
              localStorage.setItem(bk, JSON.stringify(parsed.filter((b: any) => b.id !== bookId)));
            }
          }
        } catch {}
        if (onBookDeleted) onBookDeleted(bookId);
        onShowToast(`✓ Đã xóa vĩnh viễn cuốn sách "${bookTitle}" khỏi thư viện.`);
        if (editingBook?.id === bookId) setEditingBook(null);
        onDataRefresh();
      } else {
        onShowToast(data.error || 'Lỗi khi xóa sách.', 'error');
      }
    } catch {
      onShowToast('Không thể kết nối máy chủ.', 'error');
    } finally {
      setDeletingBookId(null);
    }
  };

  // Handle Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) return;

    setIsAddingCat(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: newCatDesc.trim(),
          gradient: newCatGradient,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onShowToast(`✓ Đã thêm thể loại mới: "${name}"!`);
        setNewCatName('');
        setNewCatDesc('');
        onDataRefresh();
      } else {
        onShowToast(data.error || 'Lỗi khi thêm thể loại.', 'error');
      }
    } catch {
      onShowToast('Không thể kết nối máy chủ.', 'error');
    } finally {
      setIsAddingCat(false);
    }
  };

  // Handle Start Edit Category
  const handleStartEditCategory = (cat: Category) => {
    setEditingCatName(cat.name);
    setEditCatNewName(cat.name);
    setEditCatNewDesc(cat.description || '');
    setEditCatNewGrad(cat.gradient || GRADIENT_PRESETS[0].value);
  };

  // Handle Save Category Changes
  const handleSaveCategory = async (oldName: string) => {
    if (!editCatNewName.trim()) {
      onShowToast('Tên thể loại không được để trống.', 'error');
      return;
    }

    setIsUpdatingCat(true);
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editCatNewName.trim(),
          description: editCatNewDesc.trim(),
          gradient: editCatNewGrad,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onShowToast(`✓ Đã cập nhật thể loại "${editCatNewName.trim()}"!`);
        setEditingCatName(null);
        onDataRefresh();
      } else {
        onShowToast(data.error || 'Lỗi khi cập nhật thể loại.', 'error');
      }
    } catch {
      onShowToast('Không thể kết nối máy chủ.', 'error');
    } finally {
      setIsUpdatingCat(false);
    }
  };

  // Handle Delete Category
  const handleDeleteCategory = async (catName: string) => {
    setDeletingCatName(catName);
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(catName)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        onShowToast(`✓ Đã xóa thể loại "${catName}".`);
        onDataRefresh();
      } else {
        onShowToast(data.error || 'Lỗi khi xóa thể loại.', 'error');
      }
    } catch {
      onShowToast('Không thể kết nối máy chủ.', 'error');
    } finally {
      setDeletingCatName(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs overflow-hidden overscroll-contain">
      <div
        id="admin-dashboard-modal-container"
        className="relative w-full max-w-4xl bg-white sm:rounded-2xl shadow-2xl border-0 sm:border border-gray-100 overflow-hidden flex flex-col h-[100dvh] sm:h-auto sm:max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="p-1.5 sm:p-2 bg-gray-900 text-white rounded-xl shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-base font-bold text-gray-900 truncate">
                Quản trị & Điều chỉnh Thư viện
              </h2>
              <p className="text-[10px] sm:text-[11px] text-gray-500 truncate">
                Thêm, sửa, xóa sách và quản lý các danh mục thể loại
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-100 px-4 sm:px-5 bg-gray-50/70 text-xs font-semibold shrink-0 gap-4 sm:gap-6 overflow-x-auto no-scrollbar overscroll-contain">
          <button
            type="button"
            onClick={() => setActiveTab('books')}
            className={`py-2.5 sm:py-3 flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'books'
                ? 'border-gray-900 text-gray-900 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Quản lý Sách ({books.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`py-2.5 sm:py-3 flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'categories'
                ? 'border-gray-900 text-gray-900 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Quản lý Thể loại ({categories.length})</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div ref={mainScrollRef} className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-5">
          {/* Hidden file input for importing book data */}
          <input
            type="file"
            ref={importFileInputRef}
            accept=".json,application/json"
            onChange={handleImportFileSelect}
            className="hidden"
          />

          {/* TAB 1: BOOKS MANAGEMENT */}
          {activeTab === 'books' && (
            <div className="space-y-4">
              {/* Action Bar: Add Book Button + Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchBookTerm}
                      onChange={(e) => setSearchBookTerm(e.target.value)}
                      placeholder="Tìm kiếm sách theo tên, tác giả..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                    />
                  </div>

                  <select
                    value={selectedBookCategory}
                    onChange={(e) => setSelectedBookCategory(e.target.value)}
                    className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none"
                  >
                    <option value="all">Tất cả thể loại</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setBookToEdit(null);
                      setIsAddBookOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gray-950 hover:bg-[#FF7A00] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm sách mới</span>
                  </button>
                </div>
              </div>

              {/* Book Edit In-place Panel (if editing) */}
              {editingBook && (
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                      Chỉnh sửa thông tin sách: {editingBook.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingBook(null)}
                      className="text-[11px] text-gray-500 hover:text-gray-800"
                    >
                      Hủy bỏ
                    </button>
                  </div>

                  <form onSubmit={handleSaveBook} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] font-medium text-gray-700 block mb-1">Tên sách:</label>
                      <input
                        type="text"
                        required
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-gray-700 block mb-1">Tác giả:</label>
                      <input
                        type="text"
                        required
                        value={editAuthor}
                        onChange={(e) => setEditAuthor(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-gray-700 block mb-1">Thể loại:</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-gray-700 block mb-1">Vị trí kệ sách:</label>
                      <input
                        type="text"
                        value={editShelfLocation}
                        onChange={(e) => setEditShelfLocation(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-gray-700 block mb-1">Mã vạch ISBN:</label>
                      <input
                        type="text"
                        value={editIsbn}
                        onChange={(e) => setEditIsbn(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-gray-700 block mb-1">Nhà xuất bản:</label>
                      <input
                        type="text"
                        value={editPublisher}
                        onChange={(e) => setEditPublisher(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-medium text-gray-700 block mb-1">Tóm tắt nội dung:</label>
                      <textarea
                        rows={2}
                        value={editSummary}
                        onChange={(e) => setEditSummary(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingBook(null)}
                        className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingBook}
                        className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-black flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingBook ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Mobile View: Book Cards for screens < sm */}
              <div className="block sm:hidden space-y-2.5">
                {filteredBooks.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400 bg-white rounded-xl border border-gray-200">
                    Không có cuốn sách nào khớp với tìm kiếm.
                  </div>
                ) : (
                  filteredBooks.map((book) => (
                    <div
                      key={book.id}
                      className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs flex gap-3 items-start"
                    >
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-12 h-16 object-cover rounded shadow-2xs border border-gray-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs text-gray-900 leading-snug line-clamp-2">
                          {book.title}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate mt-0.5">{book.author}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700">
                            {book.category}
                          </span>
                          {book.shelfLocation && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
                              {book.shelfLocation}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditBook(book)}
                          className="p-1.5 text-gray-600 hover:text-amber-700 bg-gray-50 hover:bg-amber-50 rounded-lg border border-gray-200 transition-colors cursor-pointer"
                          title="Sửa sách"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={deletingBookId === book.id}
                          onClick={() => setBookToDelete({ id: book.id, title: book.title })}
                          className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg border border-gray-200 transition-colors cursor-pointer"
                          title="Xóa sách"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop View: Books Table (sm and up) */}
              <div className="hidden sm:block border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Bìa</th>
                        <th className="py-2.5 px-3">Tên tác phẩm & Tác giả</th>
                        <th className="py-2.5 px-3">Thể loại</th>
                        <th className="py-2.5 px-3">Kệ sách</th>
                        <th className="py-2.5 px-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredBooks.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-400">
                            Không có cuốn sách nào khớp với tìm kiếm.
                          </td>
                        </tr>
                      ) : (
                        filteredBooks.map((book) => (
                          <tr key={book.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-2 px-3 w-12">
                              <img
                                src={book.coverImage}
                                alt={book.title}
                                className="w-9 h-12 object-cover rounded shadow-2xs border border-gray-200"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <div className="font-semibold text-gray-900 leading-tight">{book.title}</div>
                              <div className="text-[11px] text-gray-500">{book.author}</div>
                              <div className="text-[10px] text-gray-400 font-mono mt-0.5">ISBN: {book.isbn}</div>
                            </td>
                            <td className="py-2 px-3">
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700">
                                {book.category}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-gray-600 text-[11px]">
                              {book.shelfLocation || 'Chưa đặt kệ'}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <div className="inline-flex items-center gap-1 justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditBook(book)}
                                  className="p-1.5 text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                                  title="Chỉnh sửa thông tin sách"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={deletingBookId === book.id}
                                  onClick={() => setBookToDelete({ id: book.id, title: book.title })}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                  title="Xóa cuốn sách này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CATEGORIES MANAGEMENT */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* Form to Add New Category */}
              <div className="bg-gray-50/90 rounded-xl p-4 sm:p-5 border border-gray-200">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5 mb-3">
                  <Plus className="w-4 h-4 text-[#FF7A00]" />
                  Thêm thể loại mới vào hệ thống
                </span>

                <form onSubmit={handleAddCategory} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">Tên thể loại:</label>
                      <input
                        type="text"
                        required
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1.5 flex items-center justify-between">
                        <span>Màu sắc chủ đạo:</span>
                        <span className="text-[10px] text-gray-500 font-normal">
                          {GRADIENT_PRESETS.find((g) => g.value === newCatGradient)?.label}
                        </span>
                      </label>
                      <div className="flex flex-wrap items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg">
                        {GRADIENT_PRESETS.map((g) => {
                          const isSelected = newCatGradient === g.value;
                          return (
                            <button
                              key={g.value}
                              type="button"
                              onClick={() => setNewCatGradient(g.value)}
                              title={g.label}
                              className={`relative w-7 h-7 rounded-full bg-gradient-to-tr ${g.value} transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'ring-2 ring-offset-2 ring-gray-900 scale-110 shadow-sm'
                                  : 'hover:scale-105 opacity-85 hover:opacity-100'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-xs" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Mô tả tóm tắt:</label>
                    <input
                      type="text"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isAddingCat}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-[#FF7A00] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isAddingCat ? 'Đang thêm...' : 'Tạo thể loại mới'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Categories List */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <FolderTree className="w-4 h-4 text-gray-500" />
                  Danh sách thể loại hiện tại ({categories.length})
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories.map((cat) => {
                    const isEditing = editingCatName === cat.name;

                    if (isEditing) {
                      return (
                        <div
                          key={cat.id}
                          className="p-3.5 bg-amber-50/80 border border-amber-300 rounded-xl space-y-2 text-xs"
                        >
                          <div className="font-semibold text-amber-900">Sửa thể loại: {cat.name}</div>
                          <div>
                            <label className="text-[11px] font-medium text-gray-700 block mb-0.5">Tên mới:</label>
                            <input
                              type="text"
                              required
                              value={editCatNewName}
                              onChange={(e) => setEditCatNewName(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-medium text-gray-700 block mb-0.5">Mô tả:</label>
                            <input
                              type="text"
                              value={editCatNewDesc}
                              onChange={(e) => setEditCatNewDesc(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-medium text-gray-700 block mb-1 flex items-center justify-between">
                              <span>Màu sắc:</span>
                              <span className="text-[10px] text-gray-500 font-normal">
                                {GRADIENT_PRESETS.find((g) => g.value === editCatNewGrad)?.label}
                              </span>
                            </label>
                            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border border-gray-300 rounded-lg">
                              {GRADIENT_PRESETS.map((g) => {
                                const isSelected = editCatNewGrad === g.value;
                                return (
                                  <button
                                    key={g.value}
                                    type="button"
                                    onClick={() => setEditCatNewGrad(g.value)}
                                    title={g.label}
                                    className={`relative w-6 h-6 rounded-full bg-gradient-to-tr ${g.value} transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                                      isSelected
                                        ? 'ring-2 ring-offset-1 ring-gray-900 scale-110 shadow-xs'
                                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                                    }`}
                                  >
                                    {isSelected && <Check className="w-3 h-3 text-white drop-shadow-xs" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingCatName(null)}
                              className="px-2.5 py-1 border border-gray-300 rounded text-xs text-gray-600 hover:bg-white"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              disabled={isUpdatingCat}
                              onClick={() => handleSaveCategory(cat.name)}
                              className="px-3 py-1 bg-gray-900 text-white rounded text-xs font-medium hover:bg-black"
                            >
                              {isUpdatingCat ? 'Đang lưu...' : 'Cập nhật'}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={cat.id}
                        className="p-3.5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-all flex items-start justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${cat.gradient || 'from-amber-500 to-orange-500'} text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs`}
                          >
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-gray-900 truncate">{cat.name}</h4>
                              <span className="text-[10px] px-2 py-0.2 bg-gray-100 text-gray-600 rounded-full">
                                {cat.count} cuốn
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                              {cat.description || 'Chuyên mục sách'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditCategory(cat)}
                            className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                            title="Chỉnh sửa thể loại"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={deletingCatName === cat.name}
                            onClick={() => setCatToDelete(cat.name)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="Xóa thể loại này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Deleting a Book */}
      {bookToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Xác nhận xóa sách?</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Dữ liệu sẽ đồng bộ tức thì trên toàn hệ thống.</p>
              </div>
            </div>
            <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-200 leading-relaxed">
              Bạn có chắc chắn muốn xóa cuốn sách <strong>"{bookToDelete.title}"</strong> khỏi thư viện?
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setBookToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={deletingBookId === bookToDelete.id}
                onClick={async () => {
                  const target = bookToDelete;
                  setBookToDelete(null);
                  await handleDeleteBook(target.id, target.title);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {deletingBookId === bookToDelete.id ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting a Category */}
      {catToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Xác nhận xóa thể loại?</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Dữ liệu sẽ đồng bộ tức thì trên toàn hệ thống.</p>
              </div>
            </div>
            <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-200 leading-relaxed">
              Bạn có chắc muốn xóa thể loại <strong>"{catToDelete}"</strong>? Sách thuộc thể loại này sẽ được tự động chuyển sang thể loại khác.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCatToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={deletingCatName === catToDelete}
                onClick={async () => {
                  const targetCat = catToDelete;
                  setCatToDelete(null);
                  await handleDeleteCategory(targetCat);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {deletingCatName === catToDelete ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Add/Edit Book Modal */}
      <AddBookModal
        isOpen={isAddBookOpen}
        onClose={() => {
          setIsAddBookOpen(false);
          setBookToEdit(null);
        }}
        categories={categories}
        initialBook={bookToEdit}
        onBookAdded={(book) => {
          setIsAddBookOpen(false);
          setBookToEdit(null);
          if (onBookAdded) onBookAdded(book);
          onDataRefresh();
          onShowToast(`✓ Đã thêm sách mới "${book.title}" vào thư viện thành công!`);
        }}
        onBookUpdated={(book) => {
          setIsAddBookOpen(false);
          setBookToEdit(null);
          if (onBookUpdated) onBookUpdated(book);
          onDataRefresh();
          onShowToast(`✓ Đã cập nhật thành công thông tin tác phẩm "${book.title}"!`);
        }}
      />
    </div>
  );
};
