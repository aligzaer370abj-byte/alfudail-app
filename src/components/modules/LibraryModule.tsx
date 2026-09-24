import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { LibraryBook, BookCategory } from '../../types';
import {
  ArrowRight,
  BookOpen,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit,
  Download,
  Eye,
  FileText,
  X,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Bookmark,
  Share2,
  Clock,
  User as UserIcon,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Printer,
} from 'lucide-react';

interface LibraryModuleProps {
  onBack: () => void;
}

export const LibraryModule: React.FC<LibraryModuleProps> = ({ onBack }) => {
  const { currentUser, canManageStaff } = useAuth();

  // Books list state
  const [books, setBooks] = useState<LibraryBook[]>(() => storageService.getBooks());
  const [selectedCategory, setSelectedCategory] = useState<'all' | BookCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Reader Modal State
  const [readingBook, setReadingBook] = useState<LibraryBook | null>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [readerFontSize, setReaderFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [readerTheme, setReaderTheme] = useState<'paper' | 'dark' | 'sepia'>('paper');
  const [isReaderFullscreen, setIsReaderFullscreen] = useState(false);
  const [activeTabMode, setActiveTabMode] = useState<'reader' | 'pdf_view'>('reader');

  // Book Add/Edit Modal State (Admin Only)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    author: string;
    category: BookCategory;
    description: string;
    coverUrl: string;
    pdfFileName: string;
    pdfFileSize: string;
    totalPages: number;
    publishedYear: string;
    pdfUrl: string;
    sampleContent: string;
  }>({
    title: '',
    author: '',
    category: 'دينية',
    description: '',
    coverUrl: '',
    pdfFileName: '',
    pdfFileSize: '',
    totalPages: 100,
    publishedYear: new Date().getFullYear().toString(),
    pdfUrl: '',
    sampleContent: '',
  });

  // Delete confirmation modal state
  const [bookToDelete, setBookToDelete] = useState<LibraryBook | null>(null);

  // Refresh book list from global storage
  const refreshBooks = () => {
    setBooks(storageService.getBooks());
  };

  // 1. Global Storage Synchronization & Instant UI Refresh
  // Ensures that when an Admin adds, edits, or deletes a book, it appears immediately
  // for all user roles (Main Admin, Sub-Admins, and Staff/Members) without requiring a hard reload.
  useEffect(() => {
    // Initial sync from global storage key ('app_books_data')
    setBooks(storageService.getBooks());

    const handleGlobalBooksUpdate = () => {
      setBooks(storageService.getBooks());
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app_books_data' || e.key === 'alfudail_library_books_v1' || !e.key) {
        setBooks(storageService.getBooks());
      }
    };

    window.addEventListener('app_books_data_updated', handleGlobalBooksUpdate);
    window.addEventListener('books_updated', handleGlobalBooksUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('app_books_data_updated', handleGlobalBooksUpdate);
      window.removeEventListener('books_updated', handleGlobalBooksUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesCategory =
        selectedCategory === 'all' || book.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        (book.description && book.description.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [books, selectedCategory, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: books.length,
      religious: books.filter((b) => b.category === 'دينية').length,
      cultural: books.filter((b) => b.category === 'ثقافية').length,
    };
  }, [books]);

  // Handle open add modal
  const handleOpenAddModal = () => {
    setEditingBookId(null);
    setFormData({
      title: '',
      author: currentUser?.fullName || 'سماحة الشيخ د. علي الفضلي',
      category: 'دينية',
      description: '',
      coverUrl: '',
      pdfFileName: '',
      pdfFileSize: '',
      totalPages: 150,
      publishedYear: new Date().getFullYear().toString(),
      pdfUrl: '',
      sampleContent: '',
    });
    setIsFormOpen(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = (book: LibraryBook, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBookId(book.id);
    const combinedContent = book.sampleChapters
      ? book.sampleChapters.map((c) => `=== ${c.title} ===\n${c.content}`).join('\n\n')
      : '';
    setFormData({
      title: book.title,
      author: book.author,
      category: book.category,
      description: book.description || '',
      coverUrl: book.coverUrl || '',
      pdfFileName: book.pdfFileName || '',
      pdfFileSize: book.pdfFileSize || '',
      totalPages: book.totalPages || 100,
      publishedYear: book.publishedYear || new Date().getFullYear().toString(),
      pdfUrl: book.pdfUrl || '',
      sampleContent: combinedContent,
    });
    setIsFormOpen(true);
  };

  // Handle file uploads (Cover Image & PDF)
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormData((prev) => ({
          ...prev,
          coverUrl: event.target?.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    const sizeStr = `${sizeInMb} MB`;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormData((prev) => ({
          ...prev,
          pdfUrl: event.target?.result as string,
          pdfFileName: file.name,
          pdfFileSize: sizeStr,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Save book (Add or Edit)
  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim()) {
      alert('يرجى كتابة عنوان الكتاب واسم المؤلف');
      return;
    }

    // Parse chapters from sample content if provided
    let chapters: { title: string; content: string }[] = [];
    if (formData.sampleContent.trim()) {
      const parts = formData.sampleContent.split(/=== (.*?) ===/);
      if (parts.length > 1) {
        for (let i = 1; i < parts.length; i += 2) {
          const title = parts[i]?.trim();
          const content = parts[i + 1]?.trim();
          if (title && content) {
            chapters.push({ title, content });
          }
        }
      } else {
        chapters = [
          {
            title: 'المحتوى الرئيسي',
            content: formData.sampleContent.trim(),
          },
        ];
      }
    } else {
      chapters = [
        {
          title: 'مقدمة الكتاب',
          content: `${formData.title}\nتأليف: ${formData.author}\n\n${formData.description || 'هذا الكتاب متوفر للقراءة والدراسة ضمن مقتنيات المكتبة الإلكترونية لمركز الفضيل بن يسار البصري الثقافي.'}`,
        },
      ];
    }

    if (editingBookId) {
      storageService.updateBook(editingBookId, {
        title: formData.title.trim(),
        author: formData.author.trim(),
        category: formData.category,
        description: formData.description.trim(),
        coverUrl: formData.coverUrl,
        pdfFileName: formData.pdfFileName || `${formData.title.trim()}.pdf`,
        pdfFileSize: formData.pdfFileSize || '2.5 MB',
        totalPages: Number(formData.totalPages) || 100,
        publishedYear: formData.publishedYear.trim(),
        pdfUrl: formData.pdfUrl,
        sampleChapters: chapters,
      });
      setFeedback('تم تعديل بيانات الكتاب بنجاح في المكتبة الإلكترونية');
    } else {
      storageService.addBook({
        title: formData.title.trim(),
        author: formData.author.trim(),
        category: formData.category,
        description: formData.description.trim(),
        coverUrl: formData.coverUrl,
        pdfFileName: formData.pdfFileName || `${formData.title.trim()}.pdf`,
        pdfFileSize: formData.pdfFileSize || '2.5 MB',
        totalPages: Number(formData.totalPages) || 100,
        publishedYear: formData.publishedYear.trim(),
        pdfUrl: formData.pdfUrl,
        sampleChapters: chapters,
        addedBy: currentUser?.fullName || 'الإدارة المركزية',
        addedByUserId: currentUser?.id || 'admin',
      });
      setFeedback('تمت إضافة الكتاب الجديد بنجاح إلى المكتبة الإلكترونية');
    }

    setIsFormOpen(false);
    refreshBooks();
    setTimeout(() => setFeedback(null), 3500);
  };

  // Delete Book
  const handleConfirmDelete = () => {
    if (!bookToDelete) return;
    storageService.deleteBook(bookToDelete.id);
    setBookToDelete(null);
    refreshBooks();
    setFeedback('تم حذف الكتاب من المكتبة بنجاح');
    setTimeout(() => setFeedback(null), 3500);
  };

  // Start reading book
  const handleStartReading = (book: LibraryBook) => {
    setReadingBook(book);
    setActiveChapterIndex(0);
    setActiveTabMode(book.pdfUrl ? 'pdf_view' : 'reader');
  };

  return (
    <div
      className="min-h-full bg-[#F5F7FA] dark:bg-[#0c1322] text-[#1B2A4A] dark:text-white text-right pb-14"
      dir="rtl"
    >
      {/* Top Bar Header */}
      <div className="sticky top-0 z-20 bg-[#1B2A4A] text-white p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="العودة للرئيسية"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="text-base font-bold text-white">المكتبة الإلكترونية</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-black border border-[#D4AF37]/30">
                قارئ PDF ومصادر
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              مركز الفضيل بن يسار البصري الثقافي • الكتب الدينية والثقافية المعتمدة
            </p>
          </div>
        </div>

        {/* Add Book Button (Visible ONLY to Admins) */}
        {canManageStaff && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-amber-400 text-[#1B2A4A] text-xs font-black shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة كتاب جديد</span>
          </button>
        )}
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Feedback Alert */}
        {feedback && (
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Hero Welcome Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-[#1B2A4A] via-[#1f365d] to-[#124b38] text-white shadow-md border border-[#D4AF37]/30 relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-[#D4AF37] bg-white/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                الرصيد المعرفي للمركز
              </span>
              <span className="text-[11px] text-slate-300 font-mono">
                {books.length} مؤلف متوفر
              </span>
            </div>
            <h3 className="text-sm font-black text-white leading-relaxed">
              المكتبة الرقمية التخصصية لقراءة الكتب وتحميلها
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed">
              تصفح أمهات المصادر الفقهية والعقائدية، والإصدارات التاريخية والثقافية، واقرأ مباشرة عبر قارئ PDF المدمج.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن عنوان كتاب، اسم مؤلف، أو كلمة مفتاحية..."
            className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-white dark:bg-[#152033] border border-slate-200 dark:border-slate-700 text-xs font-medium text-[#1B2A4A] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Tabs: الكل / الكتب الدينية / الكتب الثقافية */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60 text-xs font-bold">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-[#1B2A4A] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white/40'
            }`}
          >
            <span>الكل</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-[#D4AF37]">
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory('دينية')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              selectedCategory === 'دينية'
                ? 'bg-[#1B2A4A] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white/40'
            }`}
          >
            <span>الكتب الدينية</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-[#D4AF37]">
              {counts.religious}
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory('ثقافية')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              selectedCategory === 'ثقافية'
                ? 'bg-[#1B2A4A] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white/40'
            }`}
          >
            <span>الكتب الثقافية</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-[#D4AF37]">
              {counts.cultural}
            </span>
          </button>
        </div>

        {/* Books List Grid */}
        <div className="space-y-3.5">
          {filteredBooks.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-[#152033] rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
              <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300">
                لا توجد كتب مطابقة لخيارات البحث
              </h4>
              <p className="text-[11px] text-slate-400">
                جرب تغيير التصنيف أو مسح عبارة البحث، أو أضف كتاباً جديداً إذا كنت مديراً
              </p>
            </div>
          ) : (
            filteredBooks.map((book) => {
              const isReligious = book.category === 'دينية';
              return (
                <div
                  key={book.id}
                  className="p-4 rounded-3xl bg-white dark:bg-[#152033] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-3 group"
                >
                  <div className="flex gap-3">
                    {/* Book Cover Image or Fallback */}
                    <div className="w-20 h-28 shrink-0 rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-[#1B2A4A] to-[#2e4c7e] relative border border-slate-200 dark:border-slate-700 flex flex-col justify-between p-1.5 text-center text-white">
                      {book.coverUrl ? (
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <>
                          <div className="text-[8px] font-black text-[#D4AF37] truncate">
                            {isReligious ? 'كتاب ديني' : 'كتاب ثقافي'}
                          </div>
                          <BookOpen className="w-6 h-6 text-[#D4AF37] mx-auto opacity-80" />
                          <div className="text-[8px] font-bold line-clamp-2 leading-tight">
                            {book.title}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Book Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              isReligious
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                            }`}
                          >
                            {isReligious ? 'الكتب الدينية' : 'الكتب الثقافية'}
                          </span>

                          <span className="text-[10px] text-slate-400 font-mono">
                            {book.publishedYear ? `${book.publishedYear} م` : ''}
                          </span>
                        </div>

                        <h4 className="text-sm font-black text-[#1B2A4A] dark:text-white leading-snug line-clamp-2">
                          {book.title}
                        </h4>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <UserIcon className="w-3 h-3 text-[#D4AF37]" />
                          <span className="truncate font-medium">{book.author}</span>
                        </div>
                      </div>

                      {/* Meta badges */}
                      <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400 font-mono">
                        {book.totalPages && (
                          <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            <Layers className="w-2.5 h-2.5" />
                            {book.totalPages} صفحة
                          </span>
                        )}
                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          <FileText className="w-2.5 h-2.5 text-red-500" />
                          {book.pdfFileSize || 'PDF'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Book short description */}
                  {book.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl">
                      {book.description}
                    </p>
                  )}

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleStartReading(book)}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#1B2A4A] to-[#253d6b] hover:from-[#233761] hover:to-[#2e4b85] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>قراءة الكتاب الآن (PDF)</span>
                    </button>

                    {/* Admin-Only Edit & Delete Actions */}
                    {canManageStaff && (
                      <div className="flex items-center gap-1 mr-2">
                        <button
                          onClick={(e) => handleOpenEditModal(book, e)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-600 dark:text-slate-300 hover:text-amber-600 transition-colors"
                          title="تعديل بيانات الكتاب"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setBookToDelete(book);
                          }}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-950/40 text-slate-600 dark:text-slate-300 hover:text-red-600 transition-colors"
                          title="حذف الكتاب من المكتبة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ================= EMBEDDED PDF READER & BOOK VIEWER MODAL ================= */}
      {readingBook && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-fadeIn">
          <div
            className={`w-full max-w-3xl mx-auto flex flex-col bg-white dark:bg-[#111827] shadow-2xl overflow-hidden transition-all ${
              isReaderFullscreen
                ? 'fixed inset-0 max-w-none rounded-none z-50 h-screen'
                : 'rounded-t-3xl sm:rounded-3xl max-h-[92vh] h-[90vh]'
            }`}
          >
            {/* Reader Header */}
            <div className="p-3.5 bg-[#1B2A4A] text-white flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center shrink-0 text-[#D4AF37]">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-white truncate">
                    {readingBook.title}
                  </h3>
                  <p className="text-[10px] text-amber-200 truncate">
                    {readingBook.author} • {readingBook.category === 'دينية' ? 'كتاب ديني' : 'كتاب ثقافي'}
                  </p>
                </div>
              </div>

              {/* Reader Controls */}
              <div className="flex items-center gap-1.5">
                {/* Font Size controls */}
                <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded-xl p-0.5">
                  <button
                    onClick={() => setReaderFontSize('sm')}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${readerFontSize === 'sm' ? 'bg-[#D4AF37] text-[#1B2A4A] font-black' : 'text-slate-200'}`}
                    title="خط صغير"
                  >
                    أ-
                  </button>
                  <button
                    onClick={() => setReaderFontSize('base')}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${readerFontSize === 'base' ? 'bg-[#D4AF37] text-[#1B2A4A] font-black' : 'text-slate-200'}`}
                    title="خط عادي"
                  >
                    أ
                  </button>
                  <button
                    onClick={() => setReaderFontSize('lg')}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${readerFontSize === 'lg' ? 'bg-[#D4AF37] text-[#1B2A4A] font-black' : 'text-slate-200'}`}
                    title="خط كبير"
                  >
                    أ+
                  </button>
                </div>

                {/* Theme Mode */}
                <div className="flex items-center gap-1 bg-white/10 rounded-xl p-0.5">
                  <button
                    onClick={() => setReaderTheme('paper')}
                    className={`w-5 h-5 rounded-lg text-[9px] font-bold ${readerTheme === 'paper' ? 'bg-white text-slate-800' : 'text-white'}`}
                    title="ورقي فاتح"
                  >
                    نهاري
                  </button>
                  <button
                    onClick={() => setReaderTheme('sepia')}
                    className={`w-5 h-5 rounded-lg text-[9px] font-bold ${readerTheme === 'sepia' ? 'bg-[#f4ecd8] text-[#5b4636]' : 'text-amber-200'}`}
                    title="دافئ مريح"
                  >
                    دافئ
                  </button>
                  <button
                    onClick={() => setReaderTheme('dark')}
                    className={`w-5 h-5 rounded-lg text-[9px] font-bold ${readerTheme === 'dark' ? 'bg-slate-900 text-amber-300' : 'text-slate-300'}`}
                    title="ليلي"
                  >
                    ليلي
                  </button>
                </div>

                {/* Fullscreen Toggle */}
                <button
                  onClick={() => setIsReaderFullscreen(!isReaderFullscreen)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title={isReaderFullscreen ? 'تصغير' : 'ملء الشاشة'}
                >
                  {isReaderFullscreen ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Close Reader */}
                <button
                  onClick={() => {
                    setReadingBook(null);
                    setIsReaderFullscreen(false);
                  }}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-red-500 text-white transition-colors"
                  title="إغلاق القارئ"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Reader Sub-Bar: Chapters & Mode Switch */}
            <div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-2 flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setActiveTabMode('reader')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    activeTabMode === 'reader'
                      ? 'bg-[#1B2A4A] text-[#D4AF37] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  القارئ الإلكتروني التفاعلي
                </button>
                <button
                  onClick={() => setActiveTabMode('pdf_view')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    activeTabMode === 'pdf_view'
                      ? 'bg-[#1B2A4A] text-[#D4AF37] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-3 h-3 text-red-500" />
                  <span>معاينة وثيقة PDF</span>
                </button>
              </div>

              {/* Download / Print Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => window.print()}
                  className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-[11px] font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                >
                  <Printer className="w-3 h-3 text-slate-500" />
                  <span className="hidden sm:inline">طباعة</span>
                </button>
                <a
                  href={readingBook.pdfUrl || '#'}
                  download={readingBook.pdfFileName || `${readingBook.title}.pdf`}
                  onClick={(e) => {
                    if (!readingBook.pdfUrl) {
                      e.preventDefault();
                      alert('ملف الـ PDF محفوظ ومتاح للقراءة المباشرة داخل المنظومة');
                    }
                  }}
                  className="px-2.5 py-1 rounded-xl bg-[#D4AF37] hover:bg-amber-400 text-[#1B2A4A] text-[11px] font-black flex items-center gap-1 shadow-xs"
                >
                  <Download className="w-3 h-3" />
                  <span>تحميل PDF</span>
                </a>
              </div>
            </div>

            {/* Reader Content Body */}
            <div className="flex-1 overflow-y-auto flex flex-col">
              {activeTabMode === 'pdf_view' ? (
                <div className="flex-1 p-4 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900">
                  {readingBook.pdfUrl && readingBook.pdfUrl.startsWith('data:application/pdf') ? (
                    <iframe
                      src={readingBook.pdfUrl}
                      title={readingBook.title}
                      className="w-full h-full min-h-[500px] rounded-2xl border border-slate-300 dark:border-slate-700 shadow-inner"
                    />
                  ) : (
                    <div className="max-w-md p-6 bg-white dark:bg-[#152033] rounded-3xl border border-slate-200 dark:border-slate-700 text-center space-y-3 shadow-sm">
                      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto">
                        <FileText className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-bold text-[#1B2A4A] dark:text-white">
                        {readingBook.pdfFileName || `${readingBook.title}.pdf`}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        تمت فهرسة هذا الكتاب رسمياً في المكتبة الإلكترونية بحجم ({readingBook.pdfFileSize || '3.5 MB'}) وبعدد ({readingBook.totalPages || 200}) صفحة.
                        يمكنك قراءة الفصول مباشرة عبر "القارئ التفاعلي" المفتوح في التبويب الآخر.
                      </p>
                      <button
                        onClick={() => setActiveTabMode('reader')}
                        className="py-2.5 px-4 rounded-xl bg-[#1B2A4A] text-[#D4AF37] hover:bg-[#253d6b] text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>فتح نصوص وفصول الكتاب في القارئ التفاعلي</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Interactive Reading Mode */
                <div
                  className={`flex-1 p-5 sm:p-8 overflow-y-auto transition-colors ${
                    readerTheme === 'paper'
                      ? 'bg-[#FCFBF7] text-slate-800'
                      : readerTheme === 'sepia'
                      ? 'bg-[#FBF0D9] text-[#433022]'
                      : 'bg-[#0f172a] text-slate-200'
                  }`}
                >
                  <div className="max-w-2xl mx-auto space-y-6">
                    {/* Chapter Selector if multiple chapters exist */}
                    {readingBook.sampleChapters && readingBook.sampleChapters.length > 1 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-black/10 dark:border-white/10">
                        {readingBook.sampleChapters.map((ch, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveChapterIndex(idx)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                              activeChapterIndex === idx
                                ? 'bg-[#1B2A4A] text-[#D4AF37] shadow-sm'
                                : 'bg-black/5 dark:bg-white/10 hover:bg-black/10'
                            }`}
                          >
                            {ch.title}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Chapter Title */}
                    <div className="space-y-1 pb-3 border-b border-black/10 dark:border-white/10 text-center">
                      <span className="text-[10px] font-mono opacity-70">
                        مركز الفضيل بن يسار البصري الثقافي • المكتبة الإلكترونية
                      </span>
                      <h2 className="text-base sm:text-lg font-black tracking-tight">
                        {readingBook.sampleChapters?.[activeChapterIndex]?.title || readingBook.title}
                      </h2>
                    </div>

                    {/* Text Paragraphs */}
                    <div
                      className={`leading-relaxed whitespace-pre-line text-justify font-serif ${
                        readerFontSize === 'sm'
                          ? 'text-xs leading-6'
                          : readerFontSize === 'base'
                          ? 'text-sm leading-7'
                          : readerFontSize === 'lg'
                          ? 'text-base leading-8'
                          : 'text-lg leading-9'
                      }`}
                    >
                      {readingBook.sampleChapters?.[activeChapterIndex]?.content ||
                        readingBook.description ||
                        'محتوى الكتاب جارٍ تهيئته للقراءة الإلكترونية المباشرة.'}
                    </div>

                    {/* Bottom Chapter Navigation */}
                    {readingBook.sampleChapters && readingBook.sampleChapters.length > 1 && (
                      <div className="pt-6 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs font-bold">
                        <button
                          disabled={activeChapterIndex === 0}
                          onClick={() => setActiveChapterIndex(activeChapterIndex - 1)}
                          className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
                        >
                          <ChevronRight className="w-4 h-4" />
                          <span>الفصل السابق</span>
                        </button>
                        <span className="text-[11px] font-mono opacity-60">
                          فصل {activeChapterIndex + 1} من {readingBook.sampleChapters.length}
                        </span>
                        <button
                          disabled={
                            activeChapterIndex === readingBook.sampleChapters.length - 1
                          }
                          onClick={() => setActiveChapterIndex(activeChapterIndex + 1)}
                          className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
                        >
                          <span>الفصل التالي</span>
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= ADMIN ONLY: ADD / EDIT BOOK MODAL ================= */}
      {isFormOpen && canManageStaff && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#152033] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-[#1B2A4A] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-sm font-bold">
                  {editingBookId ? 'تعديل بيانات الكتاب' : 'إضافة كتاب جديد للمكتبة'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveBook} className="p-4 overflow-y-auto space-y-3.5 text-xs">
              {/* Title */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  عنوان الكتاب <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: نهج البلاغة، سيرة الإمام الصادق (ع)..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              {/* Author & Category */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    اسم المؤلف <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="اسم الكاتب أو المحقق"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    الفئة التصنيفية <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as BookCategory })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  >
                    <option value="دينية">الكتب الدينية</option>
                    <option value="ثقافية">الكتب الثقافية</option>
                  </select>
                </div>
              </div>

              {/* Pages & Published Year */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    عدد الصفحات
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalPages}
                    onChange={(e) =>
                      setFormData({ ...formData, totalPages: parseInt(e.target.value) || 100 })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    سنة النشر
                  </label>
                  <input
                    type="text"
                    value={formData.publishedYear}
                    onChange={(e) => setFormData({ ...formData, publishedYear: e.target.value })}
                    placeholder="2025"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  نبذة تعريفية عن الكتاب
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="ملخص محتوى الكتاب وأهميته الفكرية..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              {/* Cover Image Upload / URL */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  صورة غلاف الكتاب
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.coverUrl}
                    onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                    placeholder="رابط صورة الغلاف أو ارفع ملف أدناه..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                  <label className="cursor-pointer px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 flex items-center justify-center shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* PDF File Upload */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  ملف الكتاب بصيغة PDF
                </label>
                <div className="p-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-center space-y-1">
                  <FileText className="w-6 h-6 text-red-500 mx-auto" />
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-bold truncate">
                    {formData.pdfFileName || 'لم يتم اختيار ملف PDF بعد'}
                  </p>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1B2A4A] text-[#D4AF37] hover:bg-[#253d6b] text-[11px] font-black shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع ملف PDF من الجهاز</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Sample Content / Chapters for E-Reader */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  نصوص فصول الكتاب (للقارئ التفاعلي)
                </label>
                <textarea
                  rows={3}
                  value={formData.sampleContent}
                  onChange={(e) => setFormData({ ...formData, sampleContent: e.target.value })}
                  placeholder="اكتب نصوص الكتاب، أو افصل بين الفصول بـ: === عنوان الفصل ==="
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-amber-400 text-[#1B2A4A] font-black text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingBookId ? 'حفظ التعديلات' : 'إدراج الكتاب بالمكتبة'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {bookToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-[#152033] rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-700 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-[#1B2A4A] dark:text-white">
                تأكيد حذف الكتاب
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                هل أنت متأكد من حذف كتاب: <strong className="text-red-600">"{bookToDelete.title}"</strong> نهائياً من المكتبة الإلكترونية؟
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-colors"
              >
                تأكيد الحذف
              </button>
              <button
                onClick={() => setBookToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const DigitalLibraryModule = LibraryModule;
export default LibraryModule;
