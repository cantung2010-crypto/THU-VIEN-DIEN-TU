import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  ShieldCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  BookOpen,
  Barcode,
  Eye,
  TrendingUp,
  Download,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { Book, AnalyticsData } from '../types.js';
import { sounds } from '../utils/audio.js';

interface AdminDashboardProps {
  books: Book[];
  onRefreshData: () => void;
}

const PIE_COLORS = ['#FF7A00', '#6C63FF', '#00C2A8', '#FFB800', '#EC4899', '#3B82F6', '#8B5CF6', '#10B981'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ books, onRefreshData }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedBookForEdit, setSelectedBookForEdit] = useState<Book | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Văn học',
    publisher: 'NXB Kim Đồng',
    year: 2024,
    description: '',
    summary: '',
    message: '',
    targetAge: 'Học sinh THPT',
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
    aiContext: '',
    rating: 4.8,
  });

  const loadAnalytics = () => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAnalytics(data.analytics);
        }
      })
      .catch((err) => console.warn('Failed to load analytics:', err));
  };

  useEffect(() => {
    loadAnalytics();
  }, [books]);

  const handleOpenAddModal = () => {
    sounds.playTap();
    setSelectedBookForEdit(null);
    setFormData({
      title: '',
      author: '',
      isbn: `978604${Math.floor(1000000 + Math.random() * 9000000)}`,
      category: 'Văn học',
      publisher: 'NXB Giáo Dục',
      year: new Date().getFullYear(),
      description: '',
      summary: '',
      message: '',
      targetAge: 'Học sinh THPT',
      coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
      aiContext: '',
      rating: 4.8,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (book: Book) => {
    sounds.playTap();
    setSelectedBookForEdit(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      publisher: book.publisher,
      year: book.year,
      description: book.description,
      summary: book.summary,
      message: book.message,
      targetAge: book.targetAge,
      coverImage: book.coverImage,
      aiContext: book.aiContext || '',
      rating: book.rating,
    });
    setIsFormModalOpen(true);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.isbn || !formData.author) {
      alert('Vui lòng điền đủ tiêu đề, tác giả và ISBN.');
      return;
    }

    sounds.playTap();
    try {
      if (selectedBookForEdit) {
        // PUT update
        const res = await fetch(`/api/books/${selectedBookForEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setActionNotice(`✓ Đã cập nhật thành công cuốn sách "${formData.title}"`);
        }
      } else {
        // POST create
        const res = await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setActionNotice(`✓ Đã thêm cuốn sách "${formData.title}" vào thư viện!`);
        }
      }

      setIsFormModalOpen(false);
      onRefreshData();
      loadAnalytics();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      alert('Có lỗi xảy ra khi lưu sách.');
    }
  };

  const handleDeleteBook = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa cuốn sách "${title}" khỏi thư viện không?`)) {
      return;
    }

    sounds.playTap();
    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setActionNotice(`✓ Đã xóa sách "${title}"`);
        onRefreshData();
        loadAnalytics();
        setTimeout(() => setActionNotice(null), 3000);
      }
    } catch (err) {
      alert('Lỗi khi xóa sách.');
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleExportJson = () => {
    sounds.playTap();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(books, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `thu-vien-thong-minh-catalog-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      b.author.toLowerCase().includes(searchFilter.toLowerCase()) ||
      b.isbn.includes(searchFilter) ||
      b.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <section id="admin-dashboard-section" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-white/10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#6C63FF]/15 text-[#6C63FF] dark:text-[#a59eff]">
            <ShieldCheck className="w-4 h-4" />
            <span>BẢNG ĐIỀU KHIỂN THỦ THƯ & QUẢN TRỊ VIÊN</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">
            Thống kê & Quản trị Thư viện
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Theo dõi tần suất học sinh quét sách, tương tác AI và quản lý danh mục sách toàn trường.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportJson}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 font-bold text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Xuất dữ liệu</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF9330] text-white font-bold text-xs shadow-md shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm sách mới</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 font-semibold text-sm flex items-center justify-between animate-in fade-in">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl bg-white dark:bg-[#181824] border border-gray-100 dark:border-white/5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Tổng số tác phẩm
            </span>
            <div className="w-10 h-10 rounded-2xl bg-orange-500/15 text-[#FF7A00] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">
            {analytics?.totalBooks || books.length}
          </div>
          <p className="text-xs text-emerald-600 font-semibold">● 100% Sẵn sàng cho AI phân tích</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#181824] border border-gray-100 dark:border-white/5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Lượt quét mã vạch
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-[#6C63FF] flex items-center justify-center">
              <Barcode className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">
            {analytics?.totalScans || 284}
          </div>
          <p className="text-xs text-purple-600 font-semibold">Tăng 24% so với tuần trước</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#181824] border border-gray-100 dark:border-white/5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Truy vấn tìm kiếm
            </span>
            <div className="w-10 h-10 rounded-2xl bg-teal-500/15 text-[#00C2A8] flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">
            {analytics?.totalQueries || 142}
          </div>
          <p className="text-xs text-teal-600 font-semibold">Học sinh tích cực tìm kiếm</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#181824] border border-gray-100 dark:border-white/5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Tổng lượt xem sách
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">
            {analytics?.totalViews || 5240}
          </div>
          <p className="text-xs text-amber-600 font-semibold">Lan tỏa thói quen đọc</p>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Scans Bar Chart */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-[#181824] border border-gray-100 dark:border-white/5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                Hoạt động Quét mã & Tìm kiếm (7 ngày qua)
              </h3>
              <p className="text-xs text-gray-400">Số lượng học sinh sử dụng trạm thư viện hàng ngày</p>
            </div>
            <TrendingUp className="w-5 h-5 text-[#FF7A00]" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.dailyScans || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E1E2C',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="scans" name="Lượt quét mã vạch" fill="#FF7A00" radius={[6, 6, 0, 0]} />
                <Bar dataKey="searches" name="Lượt tìm kiếm" fill="#6C63FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Pie Chart */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-[#181824] border border-gray-100 dark:border-white/5 shadow-xs space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
              Cơ cấu Thể loại Sách
            </h3>
            <p className="text-xs text-gray-400">Tỷ lệ các đầu sách trong thư viện</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.categoryStats || []}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {(analytics?.categoryStats || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E1E2C',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Catalog Management CRUD Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#181824] border border-gray-100 dark:border-white/5 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">
              Quản lý Danh mục Sách ({filteredBooks.length} cuốn)
            </h3>
            <p className="text-xs text-gray-400">Cập nhật nội dung, mã ISBN và tài liệu huấn luyện AI</p>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Tìm theo tên, ISBN, tác giả..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-gray-50 dark:bg-[#20202C] border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/5">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#1F1F2D] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold border-b border-gray-200 dark:border-white/5">
                <th className="p-3.5">Bìa & Tên sách</th>
                <th className="p-3.5">Tác giả</th>
                <th className="p-3.5">Mã ISBN</th>
                <th className="p-3.5">Thể loại</th>
                <th className="p-3.5">Lượt quét</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
              {filteredBooks.map((book) => (
                <tr
                  key={book.id}
                  className="hover:bg-gray-50/75 dark:hover:bg-[#1F1F2D]/50 transition-colors"
                >
                  <td className="p-3.5 flex items-center gap-3">
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      referrerPolicy="no-referrer"
                      className="w-10 h-14 object-cover rounded-md shadow-2xs shrink-0"
                    />
                    <div>
                      <span className="font-extrabold text-gray-900 dark:text-white text-sm line-clamp-1">
                        {book.title}
                      </span>
                      <span className="text-[11px] text-gray-400 line-clamp-1">{book.publisher}</span>
                    </div>
                  </td>

                  <td className="p-3.5 font-medium text-gray-700 dark:text-gray-300">
                    {book.author}
                  </td>

                  <td className="p-3.5 font-mono text-[11px] text-gray-600 dark:text-gray-400">
                    {book.isbn}
                  </td>

                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-[#2A2A3A] text-gray-700 dark:text-gray-300">
                      {book.category}
                    </span>
                  </td>

                  <td className="p-3.5 font-bold text-gray-900 dark:text-white">
                    {book.scanCount || 0}
                  </td>

                  <td className="p-3.5 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEditModal(book)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                      title="Sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      disabled={isDeletingId === book.id}
                      onClick={() => handleDeleteBook(book.id, book.title)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#181824] rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">
                {selectedBookForEdit ? 'Chỉnh sửa thông tin sách' : 'Thêm sách mới vào thư viện'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Tiêu đề sách *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#20202C] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Tác giả *</label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#20202C] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Mã ISBN (13 số) *</label>
                  <input
                    type="text"
                    required
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#20202C] border border-gray-200 dark:border-white/10 font-mono text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Thể loại</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#20202C] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                  >
                    <option value="Văn học">Văn học</option>
                    <option value="Khoa học">Khoa học</option>
                    <option value="Địa lý">Địa lý</option>
                    <option value="Tâm lý">Tâm lý</option>
                    <option value="Công nghệ">Công nghệ</option>
                    <option value="Nghệ thuật">Nghệ thuật</option>
                    <option value="Lịch sử">Lịch sử</option>
                    <option value="Kỹ năng sống">Kỹ năng sống</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">Tóm tắt ngắn</label>
                <textarea
                  rows={2}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Tóm tắt ngắn gọn cuốn sách..."
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#20202C] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">Thông điệp cốt lõi</label>
                <input
                  type="text"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Ví dụ: Điều cốt yếu vô hình đối với mắt trần..."
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#20202C] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">URL Bìa sách</label>
                <input
                  type="url"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#20202C] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">
                  Dữ liệu chuyên sâu cho AI (AI Context)
                </label>
                <textarea
                  rows={3}
                  value={formData.aiContext}
                  onChange={(e) => setFormData({ ...formData, aiContext: e.target.value })}
                  placeholder="Bổ sung thêm bối cảnh, câu hỏi ôn tập, hoặc tài liệu tham khảo..."
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#20202C] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 font-bold text-gray-600 dark:text-gray-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#6C63FF] text-white font-bold"
                >
                  Lưu cuốn sách
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
