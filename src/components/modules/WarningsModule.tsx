import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { WarningPenalty, BranchId } from '../../types';
import { BranchSelectorBar } from '../common/BranchSelectorBar';
import {
  AlertOctagon,
  PlusCircle,
  AlertTriangle,
  User,
  ArrowRight,
  Database,
  MessageSquare,
  BellRing,
  Link2,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  FileText,
  Filter,
  Layers,
  ArrowDown,
  Building2,
} from 'lucide-react';

interface WarningsModuleProps {
  onBack: () => void;
}

export const WarningsModule: React.FC<WarningsModuleProps> = ({ onBack }) => {
  const { currentUser, canManageStaff, activeBranch, effectiveBranch, isMainAdmin } = useAuth();
  const [warnings, setWarnings] = useState<WarningPenalty[]>(() => storageService.getWarnings(activeBranch));
  const [activeTab, setActiveTab] = useState<'linked_log' | 'all_records'>('linked_log');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'إنذار' | 'عقوبة'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedWarnForAppeal, setSelectedWarnForAppeal] = useState<WarningPenalty | null>(null);
  const [appealText, setAppealText] = useState('');
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  useEffect(() => {
    setWarnings(storageService.getWarnings(activeBranch));
  }, [activeBranch]);

  // Form State for Admin
  const staffMembers = useMemo(
    () => storageService.getUsers(activeBranch).filter((u) => u.role !== 'main_admin'),
    [activeBranch]
  );
  const [targetUserId, setTargetUserId] = useState(staffMembers[0]?.id || '');
  const [warnBranchId, setWarnBranchId] = useState<BranchId>(effectiveBranch);
  const [category, setCategory] = useState<'إنذار' | 'عقوبة'>('إنذار');
  const [warnType, setWarnType] = useState<WarningPenalty['type']>('إنذار أولي');
  const [escalationLevel, setEscalationLevel] = useState<1 | 2 | 3>(1);
  const [linkedWarningId, setLinkedWarningId] = useState<string>('');
  const [reason, setReason] = useState('');

  if (!currentUser) return null;

  // Filter existing warnings of target user for linked parent selection
  const userPriorWarnings = warnings.filter((w) => w.userId === targetUserId && w.category === 'إنذار');

  // Linked Disciplinary Log from storage
  const linkedLog = useMemo(() => {
    const allLogs = storageService.getLinkedDisciplinaryLog(
      currentUser.role === 'staff' ? currentUser.id : undefined
    );
    if (activeBranch && activeBranch !== 'all') {
      return allLogs.filter((l) => l.branchId === activeBranch);
    }
    return allLogs;
  }, [warnings, currentUser, activeBranch]);

  const handleAddWarning = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = storageService.getUserById(targetUserId);
    if (!targetUser || !reason.trim()) return;

    const prefix = category === 'عقوبة' ? 'عقوبة' : 'إنذار';
    const recordNumber = `${prefix}-2026/${Math.floor(100 + Math.random() * 900)}`;

    const newWarn = storageService.addWarning({
      recordNumber,
      category,
      branchId: targetUser.branchId || (isMainAdmin ? warnBranchId : effectiveBranch),
      userId: targetUser.id,
      userName: targetUser.fullName,
      type: warnType,
      escalationLevel,
      linkedWarningId: linkedWarningId || undefined,
      reason: reason.trim(),
      issuedBy: currentUser.fullName,
      issueDate: new Date().toISOString().split('T')[0],
      status: 'نافذ',
    });

    setWarnings(storageService.getWarnings(activeBranch));
    setShowAddModal(false);
    setReason('');
    setLinkedWarningId('');
    setStatusFeedback(
      `تم إصدار ${category} (${warnType}) وإرسال إشعار مباشر وفوري لهاتف المنتسب (${targetUser.fullName})`
    );
    setTimeout(() => setStatusFeedback(null), 5000);
  };

  const handleAppealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarnForAppeal || !appealText.trim()) return;

    storageService.updateWarningStatus(selectedWarnForAppeal.id, 'قيد الاستئناف', appealText.trim());
    setWarnings(storageService.getWarnings(activeBranch));
    setSelectedWarnForAppeal(null);
    setAppealText('');
    setStatusFeedback('تم رفع طلب الاستئناف الرسمي إلى الإدارة للنظر والبت فيه');
    setTimeout(() => setStatusFeedback(null), 4000);
  };

  const filteredWarnings = warnings.filter((w) => {
    if (currentUser.role === 'staff' && w.userId !== currentUser.id) return false;
    if (categoryFilter === 'all') return true;
    return w.category === categoryFilter;
  });

  return (
    <div className="min-h-full bg-[#F5F7FA] dark:bg-[#0c1322] text-[#1B2A4A] dark:text-white text-right pb-12" dir="rtl">
      {/* Top Bar Header */}
      <div className="sticky top-0 z-20 bg-[#1B2A4A] text-white p-4 shadow-md flex items-center justify-between border-b border-red-500/20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
          <div>
            <h2 className="text-base font-bold">الإنذارات والعقوبات الإدارية</h2>
            <p className="text-[11px] text-amber-300">السجل الانضباطي ونظام التدرج والتنبيه الفوري</p>
          </div>
        </div>

        {canManageStaff && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>إصدار إجراء انضباطي</span>
          </button>
        )}
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Branch Selector Bar */}
        <BranchSelectorBar />

        {/* Real-time Push Notification Feedback Banner */}
        {statusFeedback && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-start gap-2.5 shadow-sm animate-in fade-in duration-200">
            <BellRing className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 animate-bounce" />
            <span>{statusFeedback}</span>
          </div>
        )}

        {/* Informational Guidance Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-[#1B2A4A] via-[#24355a] to-[#3a1d28] text-white shadow-md border border-red-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              لائحة الانضباط الوظيفي لمركز الفضيل بن يسار البصري
            </span>
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-bold">
              تدرج رسمي
            </span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">
            يخضع التدرج الانضباطي لنظام مستويات تصعيدية تبدأ من (تنبيه / لفت نظر) ثم (إنذار رسمي) وصولاً إلى (عقوبة إدارية مع الخصم)، مع ربط السجلات إلكترونياً وإشعار المنتسب فورياً على هاتفه.
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 p-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('linked_log')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'linked_log'
                ? 'bg-[#1B2A4A] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Link2 className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>السجل المتسلسل المرتبط (Linked Log)</span>
          </button>

          <button
            onClick={() => setActiveTab('all_records')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'all_records'
                ? 'bg-[#1B2A4A] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>كافة القرارات ({warnings.length})</span>
          </button>
        </div>

        {/* ================= TAB 1: LINKED DISCIPLINARY LOG ================= */}
        {activeTab === 'linked_log' && (
          <div className="space-y-4">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 px-1">
              يعرض هذا السجل التسلسل الإداري بين الإنذارات الصادرة والعقوبات المترتبة عليها وفق التدرج القانوني:
            </div>

            <div className="space-y-4">
              {linkedLog.length === 0 ? (
                <div className="p-8 text-center rounded-3xl bg-white dark:bg-[#162238] border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  لا توجد إجراءات أو عقوبات مقيدة حالياً.
                </div>
              ) : (
                linkedLog.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-3xl bg-white dark:bg-[#162238] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                  >
                    {/* Item Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                              item.category === 'عقوبة'
                                ? 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40'
                                : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                            }`}
                          >
                            {item.category}: {item.type}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {item.recordNumber}
                          </span>
                          <span
                            className="px-1.5 py-0.2 rounded-full text-[9px] font-bold text-white"
                            style={{
                              backgroundColor: item.branchId === 'najaf' ? '#2E8B57' : '#1B2A4A',
                            }}
                          >
                            {item.branchId === 'najaf' ? 'فرع النجف' : 'فرع البصرة'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-[#1B2A4A] dark:text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>{item.userName}</span>
                        </h4>
                      </div>

                      {/* Escalation Level Badge */}
                      <span className="px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                        مستوى التصعيد: {item.escalationLevel}
                      </span>
                    </div>

                    {/* Reason */}
                    <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#0f172a] p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 leading-relaxed">
                      {item.reason}
                    </p>

                    {/* Visually Linked Parent Warning (If this is a penalty resulting from a warning) */}
                    {item.linkedParent && (
                      <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                        <div className="flex items-center gap-1 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                          <Link2 className="w-3.5 h-3.5" />
                          <span>إجراء مرتبط بسابق إنذار رسمي:</span>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300">
                          صادر استناداً إلى: <strong>{item.linkedParent.type}</strong> ({item.linkedParent.recordNumber}) لتكرار المخالفة.
                        </p>
                      </div>
                    )}

                    {/* Visually Linked Child Penalties */}
                    {item.linkedChildren && item.linkedChildren.length > 0 && (
                      <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs space-y-1">
                        <div className="flex items-center gap-1 text-red-700 dark:text-red-300 font-bold text-[10px]">
                          <ArrowDown className="w-3.5 h-3.5" />
                          <span>ترتب على هذا الإنذار تصعيد إداري لاحق:</span>
                        </div>
                        {item.linkedChildren.map((child) => (
                          <p key={child.id} className="text-[11px] text-slate-700 dark:text-slate-300">
                            • تم فرض <strong>{child.type}</strong> ({child.recordNumber}) بتاريخ {child.issueDate}.
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Appeal Section (If present or allowed) */}
                    {item.appealNotes ? (
                      <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-[11px] text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <strong>لائحة الاستئناف المقدمة من المنتسب: </strong>
                        <span>{item.appealNotes}</span>
                      </div>
                    ) : (
                      currentUser.role === 'staff' && item.userId === currentUser.id && item.status === 'نافذ' && (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => setSelectedWarnForAppeal(item)}
                            className="px-3 py-1.5 rounded-xl bg-[#1B2A4A] text-white text-[11px] font-bold flex items-center gap-1 shadow-sm"
                          >
                            <MessageSquare className="w-3 h-3 text-[#D4AF37]" />
                            <span>تقديم طلب استئناف للإدارة</span>
                          </button>
                        </div>
                      )
                    )}

                    {/* Footer Metadata */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                      <span>الجهة المصدرة: {item.issuedBy}</span>
                      <span>تاريخ الإصدار: {item.issueDate}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: ALL RECORDS CHRONOLOGICAL ================= */}
        {activeTab === 'all_records' && (
          <div className="space-y-3">
            {/* Filter chips */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                <Filter className="w-3 h-3" />
                تصنيف:
              </span>
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1 rounded-full font-bold transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-[#1B2A4A] text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                }`}
              >
                الكل ({warnings.length})
              </button>
              <button
                onClick={() => setCategoryFilter('إنذار')}
                className={`px-3 py-1 rounded-full font-bold transition-colors ${
                  categoryFilter === 'إنذار'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                }`}
              >
                الإنذارات ({warnings.filter((w) => w.category === 'إنذار').length})
              </button>
              <button
                onClick={() => setCategoryFilter('عقوبة')}
                className={`px-3 py-1 rounded-full font-bold transition-colors ${
                  categoryFilter === 'عقوبة'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                }`}
              >
                العقوبات ({warnings.filter((w) => w.category === 'عقوبة').length})
              </button>
            </div>

            <div className="space-y-3">
              {filteredWarnings.map((w) => (
                <div
                  key={w.id}
                  className="p-4 rounded-3xl bg-white dark:bg-[#162238] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                          w.category === 'عقوبة'
                            ? 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40'
                            : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {w.category}: {w.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">{w.recordNumber}</span>
                      <span
                        className="px-1.5 py-0.2 rounded-full text-[9px] font-bold text-white"
                        style={{
                          backgroundColor: w.branchId === 'najaf' ? '#2E8B57' : '#1B2A4A',
                        }}
                      >
                        {w.branchId === 'najaf' ? 'فرع النجف' : 'فرع البصرة'}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                      {w.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                    المنتسب: <strong>{w.userName}</strong>
                  </p>

                  <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#0f172a] p-2 rounded-xl">
                    {w.reason}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                    <span>مصدر القرار: {w.issuedBy}</span>
                    <span>محفوظ 5 سنوات في الأرشيف</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: Issue Warning / Penalty (Admin Only) */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#162238] w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-red-500/30 space-y-4 text-right">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-red-600 flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4" />
                  <span>إصدار إجراء انضباطي رسمي</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddWarning} className="space-y-3 text-xs">
                {/* Branch Selection */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الفرع المعني بالإجراء:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={!isMainAdmin}
                      onClick={() => setWarnBranchId('basra')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        warnBranchId === 'basra'
                          ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                      } ${!isMainAdmin ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>فرع البصرة</span>
                    </button>
                    <button
                      type="button"
                      disabled={!isMainAdmin}
                      onClick={() => setWarnBranchId('najaf')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        warnBranchId === 'najaf'
                          ? 'bg-[#2E8B57] text-white border-[#2E8B57]'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                      } ${!isMainAdmin ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>فرع النجف</span>
                    </button>
                  </div>
                </div>

                {/* Staff selection */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">المنتسب المستهدف:</label>
                  <select
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs font-bold"
                  >
                    {staffMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.department || 'كادر المركز'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Selection: Warning vs Penalty */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCategory('إنذار');
                      setWarnType('إنذار أولي');
                    }}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      category === 'إنذار'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    إنذار إداري
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCategory('عقوبة');
                      setWarnType('خصم إداري');
                    }}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      category === 'عقوبة'
                        ? 'bg-red-600 text-white border-red-700 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    عقوبة رسمية
                  </button>
                </div>

                {/* Specific Type */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نوع الإجراء:</label>
                  <select
                    value={warnType}
                    onChange={(e) => setWarnType(e.target.value as WarningPenalty['type'])}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs font-bold"
                  >
                    {category === 'إنذار' ? (
                      <>
                        <option value="لفت نظر">لفت نظر</option>
                        <option value="تنبيه شفهي">تنبيه شفهي</option>
                        <option value="إنذار أولي">إنذار أولي</option>
                        <option value="إنذار ثانٍ">إنذار ثانٍ</option>
                        <option value="إنذار نهائي">إنذار نهائي</option>
                      </>
                    ) : (
                      <>
                        <option value="خصم إداري">خصم إداري من الراتب/المكافأة</option>
                        <option value="حرمان من مخصصات">حرمان من مخصصات النشاط</option>
                        <option value="تجميد ترقية">تجميد الترقية الإدارية</option>
                        <option value="إنهاء تكليف">إنهاء تكليف من الشعبة</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Escalation Level */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">مستوى التصعيد:</label>
                    <select
                      value={escalationLevel}
                      onChange={(e) => setEscalationLevel(Number(e.target.value) as 1 | 2 | 3)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs font-bold"
                    >
                      <option value={1}>المستوى 1 (أولى)</option>
                      <option value={2}>المستوى 2 (ثانية)</option>
                      <option value={3}>المستوى 3 (نهائية)</option>
                    </select>
                  </div>

                  {/* Link with prior warning (Linked Log requirement) */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ربط بإنذار سابق:</label>
                    <select
                      value={linkedWarningId}
                      onChange={(e) => setLinkedWarningId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs truncate"
                    >
                      <option value="">بدون ربط (إجراء مستقل)</option>
                      {userPriorWarnings.map((pw) => (
                        <option key={pw.id} value={pw.id}>
                          {pw.type} ({pw.recordNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">أسباب ومسوغات القرار:</label>
                  <textarea
                    rows={3}
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="بيان تفاصيل المخالفة والأسس القانونية والإدارية..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs resize-none"
                  />
                </div>

                {/* Push Notification Notice */}
                <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-[10px] text-red-700 dark:text-red-300 flex items-center gap-1.5 font-bold">
                  <BellRing className="w-3.5 h-3.5 shrink-0" />
                  <span>سيتم إرسال إشعار فوري مباشر إلى جهاز المنتسب عند الحفظ.</span>
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
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                  >
                    إصدار وتوثيق
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Submit Formal Appeal */}
        {selectedWarnForAppeal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#162238] w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-[#D4AF37]/30 space-y-4 text-right">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-[#1B2A4A] dark:text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
                  <span>تقديم لائحة استئناف للإدارة</span>
                </h3>
                <button
                  onClick={() => setSelectedWarnForAppeal(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAppealSubmit} className="space-y-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">الإجراء المعترض عليه:</span>
                  <span className="font-bold text-[#1B2A4A] dark:text-white">
                    {selectedWarnForAppeal.type} ({selectedWarnForAppeal.recordNumber})
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    أسباب ولائحة التظلم والاستئناف:
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={appealText}
                    onChange={(e) => setAppealText(e.target.value)}
                    placeholder="وضح الأسباب والمبررات الرسمية التي تستدعي مراجعة القرار..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedWarnForAppeal(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#1B2A4A] text-white font-bold"
                  >
                    إرسال الاستئناف
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
