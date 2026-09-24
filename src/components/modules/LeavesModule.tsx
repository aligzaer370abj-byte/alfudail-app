import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { LeaveRequest, LeaveSubCategory } from '../../types';
import { BranchSelectorBar } from '../common/BranchSelectorBar';
import {
  CalendarDays,
  PlusCircle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Send,
  Database,
  User,
  FileText,
  Stethoscope,
  Timer,
  ShieldCheck,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';

interface LeavesModuleProps {
  onBack: () => void;
}

export const LeavesModule: React.FC<LeavesModuleProps> = ({ onBack }) => {
  const { currentUser, canManageStaff, activeBranch, effectiveBranch } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => storageService.getLeaves(activeBranch));

  useEffect(() => {
    setLeaves(storageService.getLeaves(activeBranch));
  }, [activeBranch]);

  // 1. SUB-CATEGORIES (3 SUB-BUTTONS)
  // 1. الإجازات الرسمية (Official Holidays)
  // 2. الإجازات المرضية (Sick Leaves)
  // 3. الإجازات الزمنية (Hourly/Time-bound Leaves)
  const [activeSubCategory, setActiveSubCategory] = useState<LeaveSubCategory>('رسمية');

  // Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reviewModalLeave, setReviewModalLeave] = useState<LeaveRequest | null>(null);
  const [reviewDecisionNotes, setReviewDecisionNotes] = useState('');

  // Form Inputs
  const [leaveSpecificType, setLeaveSpecificType] = useState('إجازة اعتيادية سنوية');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [fromTime, setFromTime] = useState('09:00 ص');
  const [toTime, setToTime] = useState('12:00 م');
  const [totalHours, setTotalHours] = useState<number>(3);
  const [totalDays, setTotalDays] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [hasMedicalReport, setHasMedicalReport] = useState<boolean>(false);
  const [medicalReportName, setMedicalReportName] = useState('');

  // Status feedback toast
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  if (!currentUser) return null;

  // Filter leaves based on selected sub-category
  const filteredLeaves = leaves.filter((l) => {
    // If category is not set on older data, map it intelligently
    const cat = l.category || (l.type.includes('مرض') ? 'مرضية' : l.type.includes('زمن') ? 'زمنية' : 'رسمية');
    return cat === activeSubCategory;
  });

  // Open modal with presets for that specific sub-category
  const handleOpenRequestModal = (category: LeaveSubCategory) => {
    setActiveSubCategory(category);
    if (category === 'رسمية') {
      setLeaveSpecificType('إجازة اعتيادية سنوية');
    } else if (category === 'مرضية') {
      setLeaveSpecificType('إجازة مرضية مع تقرير طبي');
      setHasMedicalReport(true);
    } else if (category === 'زمنية') {
      setLeaveSpecificType('إجازة زمنية ساعية خلال الدوام');
      setTotalHours(2);
    }
    setShowRequestModal(true);
  };

  // Submit Leave Request
  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !reason.trim()) return;

    let computedDays = Number(totalDays) || 1;
    if (activeSubCategory === 'زمنية') {
      computedDays = 1;
    }

    storageService.submitLeave({
      userId: currentUser.id,
      userName: currentUser.fullName,
      branchId: currentUser.branchId || effectiveBranch,
      category: activeSubCategory,
      type: leaveSpecificType,
      startDate,
      endDate: activeSubCategory === 'زمنية' ? startDate : endDate,
      fromTime: activeSubCategory === 'زمنية' ? fromTime : undefined,
      toTime: activeSubCategory === 'زمنية' ? toTime : undefined,
      totalHours: activeSubCategory === 'زمنية' ? Number(totalHours) : undefined,
      totalDays: computedDays,
      reason,
      medicalReportAttached: activeSubCategory === 'مرضية' ? hasMedicalReport : false,
      medicalReportName: activeSubCategory === 'مرضية' && hasMedicalReport ? medicalReportName.trim() || 'تقرير طبي معتمد' : undefined,
    });

    setLeaves(storageService.getLeaves(activeBranch));
    setShowRequestModal(false);
    setReason('');
    setMedicalReportName('');
    setFeedback({
      text: 'تم إرسال طلب الإجازة بنجاح، وهو بانتظار موافقة الإدارة (Pending Admin Approval)',
      type: 'success',
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Admin Action: Approve or Reject
  const handleAdminReview = (status: 'موافق عليها' | 'مرفوضة') => {
    if (!reviewModalLeave) return;

    storageService.reviewLeave(
      reviewModalLeave.id,
      status,
      currentUser.fullName,
      reviewDecisionNotes.trim() || (status === 'موافق عليها' ? 'تمت الموافقة الرسمية واعتماد الإجازة' : 'تم الرفض وفق مقتضيات العمل')
    );

    setLeaves(storageService.getLeaves(activeBranch));
    setReviewModalLeave(null);
    setReviewDecisionNotes('');

    if (status === 'موافق عليها') {
      setFeedback({
        text: 'تمت الموافقة على الإجازة وتحديث سجل الدوام والشبكة الشهرية تلقائياً كـ (مجاز) مع الإعفاء من التقييم السلبي',
        type: 'success',
      });
    } else {
      setFeedback({
        text: 'تم تسجيل قرار رفض طلب الإجازة وإشعار المنتسب بذلك',
        type: 'info',
      });
    }
    setTimeout(() => setFeedback(null), 4500);
  };

  const getSubCategoryLabel = (cat: LeaveSubCategory) => {
    switch (cat) {
      case 'رسمية':
        return 'الإجازات الرسمية والاعتيادية';
      case 'مرضية':
        return 'الإجازات المرضية';
      case 'زمنية':
        return 'الإجازات الزمنية الساعية';
    }
  };

  return (
    <div className="min-h-full bg-[#F5F7FA] dark:bg-[#0c1322] text-[#1B2A4A] dark:text-white text-right pb-14" dir="rtl">
      {/* Top Bar Header */}
      <header className="sticky top-0 z-20 bg-[#1B2A4A] text-white p-4 shadow-md flex items-center justify-between border-b border-[#D4AF37]/20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="الرجوع للرئيسية"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
          <div>
            <h2 className="text-base font-bold flex items-center gap-1.5">
              <span>إدارة وسجلات الإجازات</span>
              <span className="px-2 py-0.5 rounded-md bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-black border border-[#D4AF37]/30">
                الجزء الثاني
              </span>
            </h2>
            <p className="text-[11px] text-slate-300">الطلبات، الموافقات التلقائية، والتزامن مع الحضور</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 text-xs text-slate-200">
          <Database className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="hidden sm:inline">أرشفة 5 سنوات</span>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Branch Selector Bar */}
        <BranchSelectorBar />

        {/* Feedback Alert Toast */}
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm ${
              feedback.type === 'success'
                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="leading-snug">{feedback.text}</span>
          </div>
        )}

        {/* SECTION 1: SUB-CATEGORIES (3 SUB-BUTTONS) */}
        {/*
          1. الإجازات الرسمية (Official Holidays)
          2. الإجازات المرضية (Sick Leaves)
          3. الإجازات الزمنية (Hourly/Time-bound Leaves)
        */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-slate-500 dark:text-slate-400">
              أقسام الإجازات المعتمدة (اختر القسم):
            </h3>
            <span className="text-[10px] text-[#D4AF37] font-semibold">3 فئات رئيسية</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* 1. الإجازات الرسمية */}
            <button
              onClick={() => setActiveSubCategory('رسمية')}
              className={`p-3 rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-2 transition-all shadow-xs border ${
                activeSubCategory === 'رسمية'
                  ? 'bg-[#1B2A4A] text-white border-[#D4AF37] shadow-md ring-2 ring-[#1B2A4A]/20'
                  : 'bg-white dark:bg-[#152033] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  activeSubCategory === 'رسمية' ? 'bg-white/10 text-[#D4AF37]' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
              </div>
              <span className="text-center text-[11px] leading-tight">الإجازات الرسمية</span>
            </button>

            {/* 2. الإجازات المرضية */}
            <button
              onClick={() => setActiveSubCategory('مرضية')}
              className={`p-3 rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-2 transition-all shadow-xs border ${
                activeSubCategory === 'مرضية'
                  ? 'bg-[#1B2A4A] text-white border-[#D4AF37] shadow-md ring-2 ring-[#1B2A4A]/20'
                  : 'bg-white dark:bg-[#152033] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  activeSubCategory === 'مرضية' ? 'bg-white/10 text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
              </div>
              <span className="text-center text-[11px] leading-tight">الإجازات المرضية</span>
            </button>

            {/* 3. الإجازات الزمنية */}
            <button
              onClick={() => setActiveSubCategory('زمنية')}
              className={`p-3 rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-2 transition-all shadow-xs border ${
                activeSubCategory === 'زمنية'
                  ? 'bg-[#1B2A4A] text-white border-[#D4AF37] shadow-md ring-2 ring-[#1B2A4A]/20'
                  : 'bg-white dark:bg-[#152033] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  activeSubCategory === 'زمنية' ? 'bg-white/10 text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}
              >
                <Timer className="w-4 h-4" />
              </div>
              <span className="text-center text-[11px] leading-tight">الإجازات الزمنية</span>
            </button>
          </div>
        </section>

        {/* Category Description & Primary "طلب إجازة" Button inside each category */}
        <section className="bg-white dark:bg-[#152033] rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">الفئة المحددة حالياً:</span>
              <h4 className="text-sm font-black text-[#1B2A4A] dark:text-white">
                {getSubCategoryLabel(activeSubCategory)}
              </h4>
            </div>

            {/* "طلب إجازة" button inside this category */}
            <button
              onClick={() => handleOpenRequestModal(activeSubCategory)}
              className="py-2 px-3.5 rounded-xl bg-[#2E8B57] hover:bg-[#257347] text-white text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5 text-white" />
              <span>طلب إجازة {activeSubCategory}</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
            {activeSubCategory === 'رسمية' &&
              'تشمل الإجازات الاعتيادية السنوية، العطلات، والمناسبات الدينية والرسمية المقرة وفق اللوائح الإدارية للمركز.'}
            {activeSubCategory === 'مرضية' &&
              'تتطلب إرفاق تقرير طبي أو بيان جهة العلاج، وتعفى بموجبها الأيام المعتمدة من أي خصم أو تقييم سلبي.'}
            {activeSubCategory === 'زمنية' &&
              'إجازة ساعية مقتطعة خلال ساعات الدوام اليومي (من ساعة محددة إلى ساعة محددة) للظروف والمراجعات الطارئة.'}
          </p>
        </section>

        {/* SECTION 2: LEAVE REQUESTS LIST & ADMIN ACTION / AUTO-SYNC */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-slate-500 dark:text-slate-400">
              سجل الطلبات الحالية ({filteredLeaves.length})
            </h3>
            <span className="text-[10px] text-slate-400">
              {canManageStaff ? 'صلاحية المراجعة والاعتماد متاحة' : 'حالة طلباتك'}
            </span>
          </div>

          {filteredLeaves.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-[#152033] rounded-3xl border border-slate-200 dark:border-slate-800">
              <CalendarDays className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">لا توجد طلبات إجازة مسجلة في هذا القسم حالياً</p>
              <button
                onClick={() => handleOpenRequestModal(activeSubCategory)}
                className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1B2A4A] text-white text-xs font-bold"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>تقديم أول طلب إجازة</span>
              </button>
            </div>
          ) : (
            filteredLeaves.map((item) => {
              const isPending = item.status === 'قيد المراجعة';
              const isApproved = item.status === 'موافق عليها';
              const isRejected = item.status === 'مرفوضة';

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-3xl bg-white dark:bg-[#152033] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-[#1B2A4A]/10 text-[#1B2A4A] dark:text-[#D4AF37] flex items-center justify-center text-xs font-bold">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-[#1B2A4A] dark:text-white">{item.userName}</h4>
                          <span
                            className="px-1.5 py-0.2 rounded-full text-[9px] font-bold text-white"
                            style={{
                              backgroundColor: item.branchId === 'najaf' ? '#2E8B57' : '#1B2A4A',
                            }}
                          >
                            {item.branchId === 'najaf' ? 'فرع النجف' : 'فرع البصرة'}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#D4AF37] font-semibold">{item.type}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col items-end">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          isApproved
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                            : isRejected
                            ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-300'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300'
                        }`}
                      >
                        {item.status}
                      </span>

                      {/* Auto-Sync & Exemption Indicator */}
                      {isApproved && item.exemptFromEvaluation && (
                        <span className="mt-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3" />
                          <span>معفى من الخصم والتقييم السلبي</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Timing details depending on Sub-Category */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300 space-y-1.5 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                      {item.category === 'زمنية' ? (
                        <span>
                          التاريخ: {item.startDate} • التوقيت: من {item.fromTime || '09:00 ص'} إلى {item.toTime || '12:00 م'} ({item.totalHours || 2} ساعات)
                        </span>
                      ) : (
                        <span>
                          الفترة: من {item.startDate} إلى {item.endDate} ({item.totalDays} أيام)
                        </span>
                      )}
                      <span className="text-[10px] font-mono">سجل #{item.id.slice(-4)}</span>
                    </div>

                    <p className="text-xs leading-relaxed font-medium pt-1">
                      <span className="text-slate-400 font-bold block text-[10px] mb-0.5">سبب ومبررات الإجازة:</span>
                      {item.reason}
                    </p>

                    {/* Medical report attachment indicator if sick leave */}
                    {item.medicalReportAttached && (
                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-bold">مرفق تقرير طبي:</span>
                        <span>{item.medicalReportName || 'تقرير مستشفى الصدر التعليمي بالبصرة'}</span>
                      </div>
                    )}
                  </div>

                  {/* Review Notes from Admin if already approved/rejected */}
                  {item.reviewNotes && (
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                      <span>توجيه الإدارة: {item.reviewNotes}</span>
                      {item.approvedBy && <span className="font-bold">الموقع: {item.approvedBy}</span>}
                    </div>
                  )}

                  {/* ADMIN ACTION WORKFLOW BUTTONS */}
                  {/* When Admin approves: automatically reflects in Leave Register AND 31-day attendance grid as 'مجاز' */}
                  {canManageStaff && isPending && (
                    <div className="pt-1 flex gap-2">
                      <button
                        onClick={() => {
                          setReviewModalLeave(item);
                          setReviewDecisionNotes('موافقة رسمية، إجازة معتمدة ويعفى من أي تقييم سلبي');
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-[#2E8B57] hover:bg-[#257347] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>موافقة واعتماد بالجدول الشهري</span>
                      </button>

                      <button
                        onClick={() => {
                          setReviewModalLeave(item);
                          setReviewDecisionNotes('يتعذر القبول لضرورة تواجد الكادر في هذا التاريخ');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center justify-center gap-1 transition-all"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>رفض</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>
      </main>

      {/* MODAL 1: DYNAMIC LEAVE REQUEST FORM */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#152033] p-6 shadow-2xl space-y-4 text-right max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-[#1B2A4A] dark:text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
                <span>تقديم طلب {getSubCategoryLabel(activeSubCategory)}</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-[#1B2A4A]/10 text-[#1B2A4A] dark:text-[#D4AF37] text-[10px] font-bold">
                {currentUser.fullName}
              </span>
            </div>

            <form onSubmit={handleSubmitLeave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1">نوع الإجازة الفرعي:</label>
                <input
                  type="text"
                  value={leaveSpecificType}
                  onChange={(e) => setLeaveSpecificType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-[#1B2A4A] dark:text-white"
                  required
                />
              </div>

              {/* Form Inputs for HOURLY LEAVE (الإجازات الزمنية) */}
              {activeSubCategory === 'زمنية' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold mb-1">تاريخ اليوم المحدد:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold mb-1">من الساعة (From Hour):</label>
                      <input
                        type="text"
                        value={fromTime}
                        onChange={(e) => setFromTime(e.target.value)}
                        placeholder="مثال: 09:30 ص"
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">إلى الساعة (To Hour):</label>
                      <input
                        type="text"
                        value={toTime}
                        onChange={(e) => setToTime(e.target.value)}
                        placeholder="مثال: 12:30 م"
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">إجمالي الساعات المطلوبة:</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={totalHours}
                      onChange={(e) => setTotalHours(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                      required
                    />
                  </div>
                </div>
              ) : (
                /* Form Inputs for OFFICIAL & SICK LEAVES (الإجازات الرسمية والمرضية) */
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold mb-1">من تاريخ:</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">إلى تاريخ:</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">إجمالي عدد الأيام:</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={totalDays}
                      onChange={(e) => setTotalDays(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Medical Report Fields if SICK LEAVE */}
              {activeSubCategory === 'مرضية' && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="medical_report_check"
                      checked={hasMedicalReport}
                      onChange={(e) => setHasMedicalReport(e.target.checked)}
                      className="w-4 h-4 rounded-md accent-[#2E8B57]"
                    />
                    <label htmlFor="medical_report_check" className="font-black text-emerald-900 dark:text-emerald-200 cursor-pointer">
                      هل يوجد تقرير طبي مرفق؟ (نعم / لا)
                    </label>
                  </div>

                  {hasMedicalReport && (
                    <div>
                      <label className="block font-bold text-[11px] mb-1 text-emerald-950 dark:text-emerald-300">
                        بيان التقرير الطبي أو اسم المستشفى / العيادة:
                      </label>
                      <input
                        type="text"
                        value={medicalReportName}
                        onChange={(e) => setMedicalReportName(e.target.value)}
                        placeholder="مثال: تقرير مستشفى الصدر التعليمي - راحة 3 أيام"
                        className="w-full p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Justification / Reason */}
              <div>
                <label className="block font-bold mb-1">شرح المبررات وأسباب الإجازة:</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="بيان المسوغات الإدارية أو الظرف الشخصي..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[10px] text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  عند اعتماد الطلب من قبل الإدارة، سينعكس تلقائياً في جدول الحضور والانصراف كـ (مجاز) ويعفى المنتسب من أي تقييم سلبي.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#2E8B57] hover:bg-[#257347] text-white font-black shadow-md transition-all"
                >
                  إرسال الطلب للاعتماد
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADMIN APPROVAL WORKFLOW MODAL */}
      {reviewModalLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#152033] p-6 shadow-2xl space-y-4 text-right border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-black text-[#1B2A4A] dark:text-white">
              البت الإداري في طلب الإجازة
            </h3>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
              <div><span className="font-bold">المقدم:</span> {reviewModalLeave.userName}</div>
              <div><span className="font-bold">الفئة:</span> {reviewModalLeave.type} ({reviewModalLeave.category})</div>
              <div><span className="font-bold">الفترة:</span> من {reviewModalLeave.startDate} إلى {reviewModalLeave.endDate}</div>
              <div><span className="font-bold">السبب:</span> {reviewModalLeave.reason}</div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">الملاحظات أو التوجيه الإداري:</label>
              <textarea
                rows={3}
                value={reviewDecisionNotes}
                onChange={(e) => setReviewDecisionNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleAdminReview('موافق عليها')}
                className="flex-1 py-3 rounded-xl bg-[#2E8B57] hover:bg-[#257347] text-white text-xs font-black shadow-md flex items-center justify-center gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                <span>اعتماد الموافقة (تزامن فوري كـ مجاز)</span>
              </button>

              <button
                onClick={() => handleAdminReview('مرفوضة')}
                className="px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center justify-center gap-1"
              >
                <XCircle className="w-4 h-4" />
                <span>رفض الطلب</span>
              </button>

              <button
                type="button"
                onClick={() => setReviewModalLeave(null)}
                className="px-3 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
