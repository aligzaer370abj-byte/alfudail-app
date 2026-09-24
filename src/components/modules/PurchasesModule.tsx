import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { PurchaseRecord, PurchaseCategory, BranchId } from '../../types';
import { BranchSelectorBar } from '../common/BranchSelectorBar';
import {
  ArrowRight,
  Plus,
  Printer,
  Search,
  Filter,
  Trash2,
  Edit3,
  Download,
  ShoppingBag,
  Receipt,
  FileSpreadsheet,
  Building2,
  Calendar,
  DollarSign,
  Package,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';

interface PurchasesModuleProps {
  onBack: () => void;
}

const CATEGORIES: PurchaseCategory[] = [
  'أجهزة وإلكترونيات',
  'قرطاسية ومطبوعات',
  'ضيافة ومؤن',
  'أثاث وتجهيزات',
  'صيانة وخدمات',
  'كتب ومصادر',
  'أخرى',
];

export const PurchasesModule: React.FC<PurchasesModuleProps> = ({ onBack }) => {
  const { currentUser, canManageStaff, isMainAdmin, isSuperAdmin, activeBranch } = useAuth();

  // Guard: Admin-only access (visible ONLY to Main Admin and Sub-Admins)
  if (!canManageStaff || !currentUser) {
    return (
      <div className="min-h-full bg-[#F5F7FA] dark:bg-[#0c1322] text-[#1B2A4A] dark:text-white p-6 text-center" dir="rtl">
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-white dark:bg-[#152033] shadow-md border border-red-200 dark:border-red-900/40 space-y-3">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-base font-black">غير مصرح بالدخول</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            سجل المشتريات والتجهيزات والطباعة مخصص حصرياً للمدير العام والمدراء الفرعيين.
          </p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 rounded-xl bg-[#1B2A4A] text-white text-xs font-bold"
          >
            العودة إلى الشاشة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() =>
    storageService.getPurchases(activeBranch)
  );

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PurchaseRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<PurchaseRecord | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form State
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<PurchaseCategory>('أجهزة وإلكترونيات');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [purchaserName, setPurchaserName] = useState<string>(currentUser.fullName);
  const [branchId, setBranchId] = useState<BranchId>(
    activeBranch !== 'all' ? activeBranch : currentUser.branchId || 'basra'
  );
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const refreshList = () => {
    setPurchases(storageService.getPurchases(activeBranch));
  };

  // Sync with activeBranch
  React.useEffect(() => {
    setPurchases(storageService.getPurchases(activeBranch));
  }, [activeBranch]);

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((item) => {
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = item.itemName.toLowerCase().includes(term);
        const matchPurchaser = item.purchaserName.toLowerCase().includes(term);
        const matchNotes = item.notes?.toLowerCase().includes(term);
        const matchInv = item.invoiceNumber?.toLowerCase().includes(term);
        if (!matchName && !matchPurchaser && !matchNotes && !matchInv) return false;
      }

      // Category
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Date Range
      if (startDate && item.purchaseDate < startDate) return false;
      if (endDate && item.purchaseDate > endDate) return false;

      return true;
    });
  }, [purchases, searchTerm, selectedCategory, startDate, endDate]);

  // Summary Metrics
  const totalCostSum = useMemo(() => {
    return filteredPurchases.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
  }, [filteredPurchases]);

  const totalQuantitySum = useMemo(() => {
    return filteredPurchases.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  }, [filteredPurchases]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setItemName('');
    setCategory('أجهزة وإلكترونيات');
    setQuantity(1);
    setUnitPrice(0);
    setTotalCost(0);
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setPurchaserName(currentUser.fullName);
    setBranchId(activeBranch !== 'all' ? activeBranch : currentUser.branchId || 'basra');
    setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
    setNotes('');
    setEditingRecord(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: PurchaseRecord) => {
    setItemName(item.itemName);
    setCategory(item.category as PurchaseCategory);
    setQuantity(item.quantity);
    setUnitPrice(item.unitPrice || Math.round(item.totalCost / (item.quantity || 1)));
    setTotalCost(item.totalCost);
    setPurchaseDate(item.purchaseDate);
    setPurchaserName(item.purchaserName);
    setBranchId(item.branchId);
    setInvoiceNumber(item.invoiceNumber || '');
    setNotes(item.notes || '');
    setEditingRecord(item);
    setIsAddModalOpen(true);
  };

  // Handle Submit (Add or Edit)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    if (editingRecord) {
      // Edit
      storageService.updatePurchase(editingRecord.id, {
        itemName: itemName.trim(),
        category,
        quantity: Number(quantity) || 1,
        unitPrice: Number(unitPrice) || 0,
        totalCost: Number(totalCost) || (Number(quantity) * Number(unitPrice)),
        purchaseDate,
        purchaserName: purchaserName.trim(),
        branchId,
        invoiceNumber: invoiceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setFeedback('تم تحديث بيانات سجل الشراء بنجاح');
    } else {
      // Add
      storageService.addPurchase({
        itemName: itemName.trim(),
        category,
        quantity: Number(quantity) || 1,
        unitPrice: Number(unitPrice) || 0,
        totalCost: Number(totalCost) || (Number(quantity) * Number(unitPrice)),
        purchaseDate,
        purchaserName: purchaserName.trim(),
        purchaserId: currentUser.id,
        branchId,
        invoiceNumber: invoiceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setFeedback('تمت إضافة مادة الشراء الجديدة بنجاح إلى السجل المركزي');
    }

    setIsAddModalOpen(false);
    refreshList();
    setTimeout(() => setFeedback(null), 3000);
  };

  // Handle Delete
  const handleConfirmDelete = () => {
    if (!recordToDelete) return;
    storageService.deletePurchase(recordToDelete.id);
    setRecordToDelete(null);
    refreshList();
    setFeedback('تم حذف سجل الشراء من المنظومة بنجاح');
    setTimeout(() => setFeedback(null), 3000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'رقم الوصل',
      'اسم المادة / المشتروات',
      'الفئة',
      'الكمية',
      'السعر المفرد (د.ع)',
      'التكلفة الإجمالية (د.ع)',
      'تاريخ الشراء',
      'اسم المشترِي / الأدمن',
      'الفرع',
      'ملاحظات',
    ];

    const rows = filteredPurchases.map((p) => [
      `"${p.invoiceNumber || p.id}"`,
      `"${p.itemName.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.quantity,
      p.unitPrice || '',
      p.totalCost,
      `"${p.purchaseDate}"`,
      `"${p.purchaserName}"`,
      `"${p.branchId === 'najaf' ? 'فرع النجف الأشرف' : 'فرع البصرة'}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `سجل_مشتريات_مركز_الفضيل_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(
      {
        title: 'سجل مشتريات وتجهيزات مركز الفضيل بن يسار البصري الثقافي',
        exportedAt: new Date().toISOString(),
        branch: activeBranch,
        totalCostSum,
        totalItemsCount: filteredPurchases.length,
        records: filteredPurchases,
      },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alfudail_purchases_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-full bg-[#F5F7FA] dark:bg-[#0c1322] text-[#1B2A4A] dark:text-white text-right pb-12" dir="rtl">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-20 bg-[#1B2A4A] text-white p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold">سجل المشتريات والطباعة</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#1B2A4A] text-[10px] font-black">
                خاص بالإدارة
              </span>
            </div>
            <p className="text-[11px] text-[#D4AF37]">
              توثيق نفقات التجهيز والشراء وحسابات الفروع وإصدار جداول الطباعة المعتمدة
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Dedicated Print Button */}
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-amber-400 text-[#1B2A4A] text-xs font-black transition-all shadow-sm"
            title="طباعة وتصدير سجل المشتريات"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة سجل المشتريات</span>
          </button>

          {/* Add New Record Button */}
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة مشتروات</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Multi-Branch Selector if Super Admin */}
        <BranchSelectorBar />

        {/* Feedback Alert */}
        {feedback && (
          <div className="p-3.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Summary Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#152033] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>إجمالي النفقات</span>
            </div>
            <div className="text-base sm:text-lg font-black text-[#1B2A4A] dark:text-white font-mono">
              {totalCostSum.toLocaleString()} <span className="text-[10px] font-sans">د.ع</span>
            </div>
            <span className="text-[10px] text-slate-400">مجموع التكاليف المحسوبة</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#152033] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
              <Receipt className="w-4 h-4 text-[#D4AF37]" />
              <span>عدد الفواتير</span>
            </div>
            <div className="text-base sm:text-lg font-black text-[#1B2A4A] dark:text-white font-mono">
              {filteredPurchases.length} <span className="text-[10px] font-sans">سجل</span>
            </div>
            <span className="text-[10px] text-slate-400">فواتير شراء موثقة</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#152033] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
              <Package className="w-4 h-4 text-blue-500" />
              <span>إجمالي المواد</span>
            </div>
            <div className="text-base sm:text-lg font-black text-[#1B2A4A] dark:text-white font-mono">
              {totalQuantitySum} <span className="text-[10px] font-sans">قطعة / وحدة</span>
            </div>
            <span className="text-[10px] text-slate-400">كميات مشتراة للمركز</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#152033] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <span>نطاق العرض</span>
            </div>
            <div className="text-xs sm:text-sm font-black text-[#1B2A4A] dark:text-white">
              {activeBranch === 'all'
                ? 'كافة فروع المركز'
                : activeBranch === 'basra'
                ? 'فرع البصرة'
                : 'فرع النجف الأشرف'}
            </div>
            <span className="text-[10px] text-slate-400">حسب التصفية النشطة</span>
          </div>
        </div>

        {/* Search, Category & Date Filter Bar */}
        <div className="p-4 rounded-3xl bg-white dark:bg-[#152033] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث عن مادة، اسم المشترِي، رقم الوصل..."
                className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-[#1B2A4A] dark:text-white focus:outline-hidden focus:border-[#D4AF37]"
              />
            </div>

            {/* Category Dropdown */}
            <div className="sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-[#1B2A4A] dark:text-white focus:outline-hidden focus:border-[#D4AF37]"
              >
                <option value="all">كافة الفئات</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Range Inputs & Clear Button */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-bold">
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>فترة الشراء:</span>
            </span>

            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[10px]">من</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-[#1B2A4A] dark:text-white font-mono"
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[10px]">إلى</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-[#1B2A4A] dark:text-white font-mono"
              />
            </div>

            {(searchTerm || selectedCategory !== 'all' || startDate || endDate) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setStartDate('');
                  setEndDate('');
                }}
                className="mr-auto px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[11px] font-bold hover:bg-red-100"
              >
                إلغاء التصفية
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Data Table */}
        <div className="rounded-3xl bg-white dark:bg-[#152033] border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-3.5 px-4 bg-slate-50 dark:bg-[#111a2b] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="font-bold text-xs text-[#1B2A4A] dark:text-white">
                جدول بيانات المشتروات والتجهيزات ({filteredPurchases.length})
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 text-[11px] font-bold flex items-center gap-1"
                title="تصدير ملف إكسل CSV"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                <span>تصدير Excel</span>
              </button>
              <button
                onClick={handleExportJSON}
                className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 text-[11px] font-bold flex items-center gap-1"
                title="تصدير ملف JSON"
              >
                <Download className="w-3 h-3 text-blue-500" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {filteredPurchases.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400">
                لا توجد سجلات مشتريات مطابقة
              </h4>
              <p className="text-[11px] text-slate-400">
                يمكنك إضافة أول مادة بالضغط على زر "إضافة مشتروات" بالأعلى
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3 px-4">رقم الوصل</th>
                    <th className="p-3">اسم المادة / المشتروات</th>
                    <th className="p-3">الفئة</th>
                    <th className="p-3 text-center">الكمية</th>
                    <th className="p-3">السعر والتكلفة الإجمالية</th>
                    <th className="p-3">تاريخ الشراء</th>
                    <th className="p-3">اسم المشترِي / الأدمن</th>
                    <th className="p-3">الفرع</th>
                    <th className="p-3 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPurchases.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors"
                    >
                      {/* Invoice # */}
                      <td className="p-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {item.invoiceNumber || item.id}
                      </td>

                      {/* Item Name & Notes */}
                      <td className="p-3">
                        <div className="font-bold text-[#1B2A4A] dark:text-white leading-snug">
                          {item.itemName}
                        </div>
                        {item.notes && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {item.notes}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                          {item.category}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="p-3 text-center font-bold font-mono">
                        {item.quantity}
                      </td>

                      {/* Cost */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-black text-emerald-700 dark:text-emerald-400 font-mono">
                          {item.totalCost.toLocaleString()} د.ع
                        </div>
                        {item.unitPrice ? (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.unitPrice.toLocaleString()} د.ع / مفرد
                          </div>
                        ) : null}
                      </td>

                      {/* Purchase Date */}
                      <td className="p-3 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {item.purchaseDate}
                      </td>

                      {/* Purchaser */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold text-xs text-[#1B2A4A] dark:text-white">
                          {item.purchaserName}
                        </div>
                      </td>

                      {/* Branch */}
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.branchId === 'najaf'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {item.branchId === 'najaf' ? 'النجف' : 'البصرة'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-[#D4AF37] hover:bg-[#1B2A4A] hover:text-[#D4AF37] flex items-center justify-center transition-colors"
                            title="تعديل السجل"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setRecordToDelete(item)}
                            className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors"
                            title="حذف السجل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ================= ADD / EDIT MODAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#152033] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 text-right">
            {/* Header */}
            <div className="p-4 bg-[#1B2A4A] text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="font-bold text-sm">
                  {editingRecord ? 'تعديل سجل المشتروات' : 'إضافة مادة / مشتروات جديدة'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  اسم المادة / المشتروات *
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="مثال: منظومة صوتية لاسلكية، كتب للمكتبة، طابعة وثائق..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B2A4A] dark:text-white focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    فئة المشتروات
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PurchaseCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B2A4A] dark:text-white focus:outline-hidden focus:border-[#D4AF37]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    الفرع
                  </label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value as BranchId)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B2A4A] dark:text-white focus:outline-hidden focus:border-[#D4AF37]"
                  >
                    <option value="basra">فرع البصرة</option>
                    <option value="najaf">فرع النجف الأشرف</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    الكمية *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => {
                      const q = Number(e.target.value) || 1;
                      setQuantity(q);
                      if (unitPrice > 0) {
                        setTotalCost(q * unitPrice);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B2A4A] dark:text-white font-mono focus:outline-hidden focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    سعر المفرد (د.ع)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={unitPrice}
                    onChange={(e) => {
                      const p = Number(e.target.value) || 0;
                      setUnitPrice(p);
                      setTotalCost(quantity * p);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B2A4A] dark:text-white font-mono focus:outline-hidden focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    التكلفة الإجمالية (د.ع) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={totalCost}
                    onChange={(e) => setTotalCost(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B2A4A] dark:text-white font-mono focus:outline-hidden focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    تاريخ الشراء *
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B2A4A] dark:text-white font-mono focus:outline-hidden focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    رقم الوصل / الفاتورة
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="INV-2026-001"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B2A4A] dark:text-white font-mono focus:outline-hidden focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  اسم المشترِي / الأدمن المسجل *
                </label>
                <input
                  type="text"
                  required
                  value={purchaserName}
                  onChange={(e) => setPurchaserName(e.target.value)}
                  placeholder="اسم الشخص أو الإدارة المسؤولة عن الشراء"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B2A4A] dark:text-white focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  ملاحظات وتفاصيل الاستخدام
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات حول جهة الشراء، الغرض، مكان التجهيز..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B2A4A] dark:text-white focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#1B2A4A] hover:bg-[#263c69] text-[#D4AF37] font-black text-xs transition-colors shadow-sm"
                >
                  {editingRecord ? 'حفظ التعديلات' : 'تثبيت السجل'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#152033] rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-red-200 dark:border-red-900/40 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-sm text-[#1B2A4A] dark:text-white">
              تأكيد حذف سجل المشتروات
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              هل أنت متأكد من رغبتك في حذف مادة "{recordToDelete.itemName}" بقيمة ({recordToDelete.totalCost.toLocaleString()} د.ع) نهائياً من السجل؟
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-sm"
              >
                تأكيد الحذف
              </button>
              <button
                onClick={() => setRecordToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DEDICATED PRINT & PDF EXPORT MODAL ================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white text-[#1B2A4A] rounded-3xl max-w-3xl w-full max-h-[94vh] overflow-y-auto shadow-2xl text-right flex flex-col">
            {/* Modal Top Control Bar (Hidden on Print) */}
            <div className="p-4 bg-[#1B2A4A] text-white flex items-center justify-between sticky top-0 z-10 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#D4AF37]" />
                <div>
                  <h3 className="font-bold text-sm">معاينة وطباعة سجل المشتريات والتجهيزات</h3>
                  <p className="text-[10px] text-[#D4AF37]">
                    مستند رسمي صادر عن إدارة مركز الفضيل بن يسار البصري الثقافي
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-[#D4AF37] text-[#1B2A4A] font-black text-xs hover:bg-amber-400 flex items-center gap-1 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة فورية / PDF</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div id="printable-purchases-table" className="p-6 sm:p-8 space-y-6 text-xs bg-white text-black print:p-0">
              {/* Official Letterhead */}
              <div className="border-b-2 border-[#1B2A4A] pb-4 flex items-center justify-between gap-4">
                <div className="text-right">
                  <h4 className="text-[11px] font-bold text-slate-700">جمهورية العراق</h4>
                  <h4 className="text-[11px] font-bold text-slate-700">الأمانة العامة للمراكز الثقافية</h4>
                  <h3 className="text-sm font-black text-[#1B2A4A]">مركز الفضيل بن يسار البصري الثقافي</h3>
                  <span className="text-[10px] text-slate-500">
                    {activeBranch === 'najaf' ? 'فرع النجف الأشرف' : activeBranch === 'basra' ? 'فرع البصرة الفيحاء' : 'الإدارة المركزية العامة'}
                  </span>
                </div>

                {/* Center Emblem Text */}
                <div className="text-center px-4 py-2 border border-[#D4AF37] rounded-2xl bg-amber-50/50">
                  <span className="block text-xs font-black text-[#1B2A4A]">سجل المشتريات والتجهيزات</span>
                  <span className="text-[10px] text-[#D4AF37] font-bold">نموذج الإدارة والمالية المعتمد</span>
                </div>

                <div className="text-left font-mono text-[11px] text-slate-600">
                  <div><strong>التاريخ:</strong> {new Date().toLocaleDateString('ar-IQ')}</div>
                  <div><strong>رقم القيد:</strong> PUR-{new Date().getFullYear()}/{filteredPurchases.length}</div>
                  <div><strong>عدد البنود:</strong> {filteredPurchases.length}</div>
                </div>
              </div>

              {/* Document Overview Subtitle */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold block text-[#1B2A4A]">تقرير تفصيلي بمصروفات ومشتريات المركز:</span>
                  <span className="text-[10px] text-slate-500">
                    الفترة: {startDate || 'منذ البداية'} إلى {endDate || 'تاريخ اليوم'} | الفرع:{' '}
                    {activeBranch === 'all' ? 'جميع الفروع' : activeBranch === 'basra' ? 'فرع البصرة' : 'فرع النجف'}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-500 block">المبلغ الإجمالي المعتمد:</span>
                  <span className="font-black text-sm text-[#1B2A4A] font-mono">
                    {totalCostSum.toLocaleString()} د.ع
                  </span>
                </div>
              </div>

              {/* Formatted Printable Table */}
              <table className="w-full text-right text-[11px] border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-black border-b border-slate-300">
                    <th className="border border-slate-300 p-2 text-center w-8">#</th>
                    <th className="border border-slate-300 p-2">اسم المادة والمواصفات</th>
                    <th className="border border-slate-300 p-2 text-center">الفئة</th>
                    <th className="border border-slate-300 p-2 text-center w-12">الكمية</th>
                    <th className="border border-slate-300 p-2 text-left">السعر المفرد</th>
                    <th className="border border-slate-300 p-2 text-left">التكلفة الإجمالية</th>
                    <th className="border border-slate-300 p-2 text-center">تاريخ الشراء</th>
                    <th className="border border-slate-300 p-2">اسم المشترِي / الأدمن</th>
                    <th className="border border-slate-300 p-2 text-center">الفرع</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map((p, idx) => (
                    <tr key={p.id} className="border-b border-slate-200">
                      <td className="border border-slate-300 p-2 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-300 p-2 font-bold text-slate-900">
                        {p.itemName}
                        {p.notes && <div className="text-[9px] text-slate-500 font-normal">{p.notes}</div>}
                      </td>
                      <td className="border border-slate-300 p-2 text-center text-slate-700">{p.category}</td>
                      <td className="border border-slate-300 p-2 text-center font-mono font-bold">{p.quantity}</td>
                      <td className="border border-slate-300 p-2 text-left font-mono">
                        {p.unitPrice ? `${p.unitPrice.toLocaleString()} د.ع` : '-'}
                      </td>
                      <td className="border border-slate-300 p-2 text-left font-mono font-black text-slate-900">
                        {p.totalCost.toLocaleString()} د.ع
                      </td>
                      <td className="border border-slate-300 p-2 text-center font-mono text-[10px]">{p.purchaseDate}</td>
                      <td className="border border-slate-300 p-2">{p.purchaserName}</td>
                      <td className="border border-slate-300 p-2 text-center text-[10px]">
                        {p.branchId === 'najaf' ? 'النجف' : 'البصرة'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black border-t-2 border-slate-400">
                    <td colSpan={3} className="border border-slate-300 p-2 text-right">
                      المجموع الكلي المالي:
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-mono">{totalQuantitySum}</td>
                    <td className="border border-slate-300 p-2"></td>
                    <td className="border border-slate-300 p-2 text-left font-mono text-sm text-[#1B2A4A]">
                      {totalCostSum.toLocaleString()} د.ع
                    </td>
                    <td colSpan={3} className="border border-slate-300 p-2 text-slate-500 text-[10px]">
                      فقط {totalCostSum.toLocaleString()} دينار عراقي لا غير
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Official Signatures & Seal Block */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs">
                <div className="space-y-6">
                  <span className="font-bold block text-slate-700">مسؤول المشتريات والتجهيزات</span>
                  <div className="h-10 border-b border-dashed border-slate-400 w-36 mx-auto"></div>
                  <span className="text-[10px] text-slate-500">التوقيع والاسم</span>
                </div>

                <div className="space-y-6">
                  <span className="font-bold block text-slate-700">المعاون الإداري والمالي</span>
                  <div className="h-10 border-b border-dashed border-slate-400 w-36 mx-auto"></div>
                  <span className="text-[10px] text-slate-500">التدقيق والمطابقة</span>
                </div>

                <div className="space-y-6">
                  <span className="font-bold block text-slate-700">مصادقة المدير العام للمركز</span>
                  <div className="h-10 border-b border-dashed border-slate-400 w-36 mx-auto flex items-center justify-center">
                    <div className="w-16 h-10 border-2 border-[#D4AF37] rounded-full flex items-center justify-center text-[9px] font-black text-[#D4AF37] rotate-[-5deg]">
                      ختم المركز
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500">الشيخ د. علي الفضلي</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
