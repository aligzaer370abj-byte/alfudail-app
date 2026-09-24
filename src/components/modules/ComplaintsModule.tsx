import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { RequestComplaint } from '../../types';
import { BranchSelectorBar } from '../common/BranchSelectorBar';
import {
  MessageSquareText,
  PlusCircle,
  Lock,
  Send,
  ArrowRight,
  Database,
  CheckCircle2,
  Clock,
  Shield,
  ShieldCheck,
  XCircle,
  Check,
  AlertTriangle,
  FileQuestion,
  User,
  Calendar,
  MessageCircle,
} from 'lucide-react';

interface ComplaintsModuleProps {
  onBack: () => void;
}

export const ComplaintsModule: React.FC<ComplaintsModuleProps> = ({ onBack }) => {
  const { currentUser, isMainAdmin, isSubAdmin, canManageStaff, activeBranch, effectiveBranch } = useAuth();
  const [items, setItems] = useState<RequestComplaint[]>(() =>
    storageService.getComplaints(currentUser || undefined, activeBranch)
  );

  useEffect(() => {
    setItems(storageService.getComplaints(currentUser || undefined, activeBranch));
  }, [activeBranch, currentUser]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [reviewModalItem, setReviewModalItem] = useState<RequestComplaint | null>(null);
  const [decisionChoice, setDecisionChoice] = useState<'مقبول' | 'مرفوض' | 'تم الرد' | 'قيد الدراسة'>('مقبول');
  const [adminReplyText, setAdminReplyText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form State for Staff Submission
  const [type, setType] = useState<RequestComplaint['type']>('طلب احتياجات مكتبية');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [urgency, setUrgency] = useState<'عاجل' | 'عادي'>('عادي');
  const [isConfidential, setIsConfidential] = useState(false);

  if (!currentUser) return null;

  // Exclusive Admin View Logic:
  // - Main Admin and Sub Admin see all incoming requests.
  // - Regular staff can ONLY see their own requests.
  const visibleItems = items.filter((it) => {
    if (canManageStaff) {
      // If Sub Admin and marked confidential to director only:
      if (isSubAdmin && it.isConfidentialToDirector && !isMainAdmin) return false;
      return true;
    }
    return it.userId === currentUser.id;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !details.trim()) return;

    storageService.submitComplaint({
      userId: currentUser.id,
      userName: currentUser.fullName,
      branchId: effectiveBranch,
      type,
      title: title.trim(),
      details: details.trim(),
      urgency,
      isConfidentialToDirector: isConfidential,
    });

    setItems(storageService.getComplaints(currentUser, activeBranch));
    setShowAddModal(false);
    setTitle('');
    setDetails('');
    setIsConfidential(false);
    setFeedback('تم إرسال طلبكم بسرية تامة إلى الإدارة، وستصلكم رسالة فورية عند اتخاذ القرار');
    setTimeout(() => setFeedback(null), 4500);
  };

  const handleAdminDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalItem || !adminReplyText.trim()) return;

    storageService.reviewComplaint(
      reviewModalItem.id,
      decisionChoice,
      adminReplyText.trim(),
      currentUser.fullName
    );

    setItems(storageService.getComplaints(currentUser, activeBranch));
    setReviewModalItem(null);
    setAdminReplyText('');
    setFeedback(`تم اعتماد القرار الإداري (${decisionChoice}) وإرسال إشعار فوري للمنتسب صاحب الطلب`);
    setTimeout(() => setFeedback(null), 4500);
  };

  const getStatusBadgeClass = (status: RequestComplaint['status']) => {
    switch (status) {
      case 'مقبول':
        return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      case 'مرفوض':
        return 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30';
      case 'تم الرد':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30';
      case 'قيد الدراسة':
        return 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300';
    }
  };

  return (
    <div className="min-h-full bg-[#F5F7FA] dark:bg-[#0c1322] text-[#1B2A4A] dark:text-white text-right pb-12" dir="rtl">
      {/* Top Bar Header */}
      <div className="sticky top-0 z-20 bg-[#1B2A4A] text-white p-4 shadow-md flex items-center justify-between border-b border-teal-500/20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
          <div>
            <h2 className="text-base font-bold">الطلبات والشكاوى الإدارية</h2>
            <p className="text-[11px] text-teal-300">قنوات التواصل المباشر والسرية التامة</p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2E8B57] hover:bg-[#257347] text-white text-xs font-bold transition-all shadow-sm"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>تقديم طلب / شكوى</span>
        </button>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Branch Selector Bar */}
        <BranchSelectorBar />

        {/* Feedback Message */}
        {feedback && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Privacy & Confidentiality Guarantee Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-l from-[#1B2A4A] to-[#25375c] text-white border border-[#D4AF37]/30 shadow-sm flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <p className="font-bold text-[#D4AF37]">الخصوصية والأمان الإداري المطلق (Admin Exclusive)</p>
            <p className="text-[11px] text-slate-200 leading-relaxed">
              تصل الشكاوى والطلبات حصراً إلى حسابات الإدارة المخولة، ولا يمكن لأي منتسب أو زميل آخر الاطلاع عليها بأي وسيلة.
            </p>
          </div>
        </div>

        {/* Filter Chips for Status */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              filterStatus === 'all'
                ? 'bg-[#1B2A4A] text-white'
                : 'bg-white dark:bg-[#162238] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            الكل ({visibleItems.length})
          </button>
          <button
            onClick={() => setFilterStatus('جديد')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              filterStatus === 'جديد'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-[#162238] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            جديد ({visibleItems.filter((i) => i.status === 'جديد').length})
          </button>
          <button
            onClick={() => setFilterStatus('مقبول')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              filterStatus === 'مقبول'
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-[#162238] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            مقبول ({visibleItems.filter((i) => i.status === 'مقبول').length})
          </button>
          <button
            onClick={() => setFilterStatus('مرفوض')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              filterStatus === 'مرفوض'
                ? 'bg-red-600 text-white'
                : 'bg-white dark:bg-[#162238] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            مرفوض ({visibleItems.filter((i) => i.status === 'مرفوض').length})
          </button>
        </div>

        {/* Complaints and Requests List */}
        <div className="space-y-3">
          {visibleItems.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-white dark:bg-[#162238] border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              لا توجد طلبات أو شكاوى مسجلة في هذا القسم.
            </div>
          ) : (
            visibleItems
              .filter((it) => filterStatus === 'all' || it.status === filterStatus)
              .map((it) => {
                const isPendingReview = it.status === 'جديد' || it.status === 'قيد الدراسة';

                return (
                  <div
                    key={it.id}
                    className="p-4 rounded-3xl bg-white dark:bg-[#162238] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-[10px] font-bold">
                            {it.type}
                          </span>
                          {it.isConfidentialToDirector && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 text-[9px] font-black border border-red-500/30 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              <span>سري للمدير</span>
                            </span>
                          )}
                          {it.urgency === 'عاجل' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] font-bold">
                              عاجل
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-[#1B2A4A] dark:text-white leading-tight">
                          {it.title}
                        </h4>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(it.status)}`}>
                        {it.status}
                      </span>
                    </div>

                    {/* Submitter info for Admin */}
                    {canManageStaff && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>مقدم الطلب: <strong>{it.userName}</strong></span>
                      </div>
                    )}

                    {/* Content Details */}
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-[#0f172a] p-3 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                      {it.details}
                    </p>

                    {/* Official Admin Decision and Reply */}
                    {it.adminReply && (
                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>القرار والرد الإداري الرسمي ({it.adminDecision || 'معتمد'}):</span>
                          </span>
                          <span className="text-[10px] text-slate-400">{it.replyDate}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                          {it.adminReply}
                        </p>
                        {it.reviewedBy && (
                          <span className="text-[10px] text-slate-500 block">المسؤول المصدر: {it.reviewedBy}</span>
                        )}
                      </div>
                    )}

                    {/* Admin Action Review Button */}
                    {canManageStaff && (
                      <div className="pt-1 flex items-center justify-end">
                        <button
                          onClick={() => {
                            setReviewModalItem(it);
                            setDecisionChoice('مقبول');
                            setAdminReplyText('');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-[#1B2A4A] hover:bg-[#253966] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>البت في الطلب والرد الرسمي</span>
                        </button>
                      </div>
                    )}

                    {/* Footer Date & Retention */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                      <span>تاريخ التقديم: {it.createdAt.split('T')[0]}</span>
                      <span>سجل إداري محفوظ 5 سنوات</span>
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* Modal: Submit New Complaint / Request (Staff View) */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#162238] w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-[#D4AF37]/30 space-y-4 text-right">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-[#1B2A4A] dark:text-white flex items-center gap-1.5">
                  <MessageSquareText className="w-4 h-4 text-[#D4AF37]" />
                  <span>تقديم طلب أو شكوى رسمية</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                {/* Request Type */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نوع المعاملة:</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as RequestComplaint['type'])}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs font-bold"
                  >
                    <option value="طلب احتياجات مكتبية">طلب احتياجات ومستلزمات مكتبية</option>
                    <option value="طلب صيانة أجهزة">طلب صيانة أجهزة وتقنيات</option>
                    <option value="شكوى إدارية">شكوى إدارية رسمية</option>
                    <option value="تظلم وظيفي">تظلم وظيفي</option>
                    <option value="اقتراح تطويري">اقتراح لتطوير عمل المركز</option>
                  </select>
                </div>

                {/* Urgency */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUrgency('عادي')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      urgency === 'عادي'
                        ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                    }`}
                  >
                    أولوية عادية
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgency('عاجل')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      urgency === 'عاجل'
                        ? 'bg-amber-600 text-white border-amber-700'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                    }`}
                  >
                    أولوية عاجلة
                  </button>
                </div>

                {/* Title */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">موضوع الطلب:</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="عنوان مختصر للطلب أو الشكوى..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs font-bold"
                  />
                </div>

                {/* Details */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">التفاصيل والشرح:</label>
                  <textarea
                    rows={4}
                    required
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="اكتب شرحاً وافياً ومفصلاً للطلب..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs resize-none"
                  />
                </div>

                {/* Confidentiality toggle */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-red-500" />
                    <div>
                      <span className="font-bold text-xs block">سري وموجه للمدير العام فقط</span>
                      <span className="text-[10px] text-slate-400">حجب المحتوى عن الإدارة الفرعية</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isConfidential}
                    onChange={(e) => setIsConfidential(e.target.checked)}
                    className="w-4 h-4 accent-red-600 rounded"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#2E8B57] hover:bg-[#257347] text-white font-bold"
                  >
                    إرسال الطلب
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Admin Review & Decision Workflow */}
        {reviewModalItem && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#162238] w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-[#D4AF37]/30 space-y-4 text-right">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-[#1B2A4A] dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                  <span>البت الإداري في المعاملة</span>
                </h3>
                <button
                  onClick={() => setReviewModalItem(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAdminDecision} className="space-y-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block">موضوع المعاملة والمنتسب:</span>
                  <p className="font-bold text-xs text-[#1B2A4A] dark:text-white">
                    {reviewModalItem.title} ({reviewModalItem.userName})
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                    {reviewModalItem.details}
                  </p>
                </div>

                {/* Decision Selection: Accept / Reject / Reply */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    القرار الإداري الرسمي:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDecisionChoice('مقبول')}
                      className={`py-2 rounded-xl font-bold border text-[11px] transition-all flex items-center justify-center gap-1 ${
                        decisionChoice === 'مقبول'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>قبول الطلب</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDecisionChoice('مرفوض')}
                      className={`py-2 rounded-xl font-bold border text-[11px] transition-all flex items-center justify-center gap-1 ${
                        decisionChoice === 'مرفوض'
                          ? 'bg-red-600 text-white border-red-700 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      <XCircle className="w-3 h-3" />
                      <span>رفض الطلب</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDecisionChoice('تم الرد')}
                      className={`py-2 rounded-xl font-bold border text-[11px] transition-all flex items-center justify-center gap-1 ${
                        decisionChoice === 'تم الرد'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      <Send className="w-3 h-3" />
                      <span>رد وإحالة</span>
                    </button>
                  </div>
                </div>

                {/* Reply text */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نص التوجيه / الرد الإداري الرسمي:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    placeholder="اكتب التوجيهات أو أسباب القرار للمنتسب..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewModalItem(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#1B2A4A] text-white font-bold"
                  >
                    اعتماد وإشعار المنتسب
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
