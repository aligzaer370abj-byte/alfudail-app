import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { PerformanceEvaluation, DailyStaffEvaluation } from '../../types';
import { BranchSelectorBar } from '../common/BranchSelectorBar';
import {
  Award,
  Star,
  PlusCircle,
  TrendingUp,
  User,
  ArrowRight,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Info,
  ChevronDown,
  Clock,
  Sparkles,
  Sliders,
  Check,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface PerformanceModuleProps {
  onBack: () => void;
}

export const PerformanceModule: React.FC<PerformanceModuleProps> = ({ onBack }) => {
  const { currentUser, canManageStaff, activeBranch, effectiveBranch, isMainAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'dynamic31' | 'daily_scoring' | 'annual_archive'>('dynamic31');

  // Staff members list filtered by active branch
  const staffMembers = useMemo(
    () => storageService.getUsers(activeBranch).filter((u) => u.role !== 'main_admin'),
    [activeBranch]
  );

  // Selected staff to view/evaluate (defaults to currentUser if staff, or first staff member if admin)
  const [selectedStaffId, setSelectedStaffId] = useState<string>(() => {
    if (currentUser?.role === 'staff') return currentUser.id;
    return staffMembers[0]?.id || currentUser?.id || '';
  });

  // Selected date for daily scoring (defaults to 2026-09-20)
  const [evalDate, setEvalDate] = useState('2026-09-20');

  // Daily scoring sub-aspects (out of 10 total)
  const [punctualityScore, setPunctualityScore] = useState<number>(2.5); // / 2.5
  const [productivityScore, setProductivityScore] = useState<number>(2.5); // / 2.5
  const [culturalEngagementScore, setCulturalEngagementScore] = useState<number>(2.5); // / 2.5
  const [teamworkScore, setTeamworkScore] = useState<number>(2.5); // / 2.5
  const [evalNotes, setEvalNotes] = useState('');

  // Daily evaluations list
  const [dailyEvaluations, setDailyEvaluations] = useState<DailyStaffEvaluation[]>(
    () => storageService.getDailyEvaluations(undefined, activeBranch)
  );

  const [evaluations, setEvaluations] = useState<PerformanceEvaluation[]>(() =>
    storageService.getEvaluations(activeBranch)
  );

  useEffect(() => {
    setDailyEvaluations(storageService.getDailyEvaluations(undefined, activeBranch));
    setEvaluations(storageService.getEvaluations(activeBranch));
    if (currentUser?.role !== 'staff') {
      const currentList = storageService.getUsers(activeBranch).filter((u) => u.role !== 'main_admin');
      if (currentList.length > 0 && !currentList.some((u) => u.id === selectedStaffId)) {
        setSelectedStaffId(currentList[0].id);
      }
    }
  }, [activeBranch]);

  // 31-day data computation
  const monthlyData = useMemo(() => {
    return storageService.getMonthly31DaysEvaluation(selectedStaffId, 2026, 9);
  }, [selectedStaffId, dailyEvaluations]);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Annual Form State for Archive
  const [period, setPeriod] = useState('أيلول 2026');
  const [annualPunctuality, setAnnualPunctuality] = useState(24);
  const [annualProductivity, setAnnualProductivity] = useState(25);
  const [annualCultural, setAnnualCultural] = useState(24);
  const [annualTeamwork, setAnnualTeamwork] = useState(23);
  const [directorNotes, setDirectorNotes] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  if (!currentUser) return null;

  const currentSelectedUser = storageService.getUserById(selectedStaffId);
  const totalDailyScoreCalculated = Number(
    (punctualityScore + productivityScore + culturalEngagementScore + teamworkScore).toFixed(1)
  );

  // Submit Daily Evaluation
  const handleSaveDailyEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = storageService.getUserById(selectedStaffId);
    if (!targetUser) return;

    storageService.setDailyEvaluation({
      userId: targetUser.id,
      userName: targetUser.fullName,
      date: evalDate,
      score: totalDailyScoreCalculated,
      aspects: {
        punctuality: punctualityScore,
        productivity: productivityScore,
        culturalEngagement: culturalEngagementScore,
        teamwork: teamworkScore,
      },
      branchId: targetUser.branchId || (isMainAdmin ? effectiveBranch : targetUser.branchId),
      notes: evalNotes.trim() || 'تقييم يومي معتمد من الإدارة',
      evaluatorId: currentUser.id,
      evaluatorName: currentUser.fullName,
      isExemptedLeave: false,
    });

    setDailyEvaluations(storageService.getDailyEvaluations(undefined, activeBranch));
    setFeedbackMsg(`تم اعتماد التقييم اليومي للمنتسب (${targetUser.fullName}) بنجاح: ${totalDailyScoreCalculated}/10`);
    setEvalNotes('');
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Submit Annual / Periodic Evaluation
  const handleAddAnnualEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = storageService.getUserById(selectedStaffId);
    if (!targetUser) return;

    storageService.addEvaluation({
      userId: targetUser.id,
      userName: targetUser.fullName,
      branchId: targetUser.branchId || (isMainAdmin ? effectiveBranch : targetUser.branchId),
      evaluatorId: currentUser.id,
      evaluatorName: currentUser.fullName,
      period,
      year: 2026,
      scores: {
        punctuality: Number(annualPunctuality),
        productivity: Number(annualProductivity),
        culturalEngagement: Number(annualCultural),
        teamwork: Number(annualTeamwork),
      },
      directorNotes: directorNotes.trim() || 'أداء وظيفي متميز والتزام عالٍ بمبادئ المركز',
    });

    setEvaluations(storageService.getEvaluations(activeBranch));
    setShowAddModal(false);
    setDirectorNotes('');
    setFeedbackMsg('تم اعتماد وحفظ استمارة التقييم السنوية الرسمية بنجاح');
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const getRatingBadgeClass = (rating: PerformanceEvaluation['rating']) => {
    switch (rating) {
      case 'ممتاز':
        return 'bg-[#D4AF37]/20 text-amber-700 dark:text-amber-300 border-[#D4AF37]/40';
      case 'جيد جداً':
        return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      case 'جيد':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30';
      default:
        return 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300';
    }
  };

  return (
    <div className="min-h-full bg-[#F5F7FA] dark:bg-[#0c1322] text-[#1B2A4A] dark:text-white text-right pb-12" dir="rtl">
      {/* Top Bar Header */}
      <div className="sticky top-0 z-20 bg-[#1B2A4A] text-white p-4 shadow-md flex items-center justify-between border-b border-[#D4AF37]/20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
          <div>
            <h2 className="text-base font-bold">تقييم عمل وأداء المنتسبين</h2>
            <p className="text-[11px] text-[#D4AF37]">التقييم اليومي والجدول الشهري المعتمد</p>
          </div>
        </div>

        {canManageStaff && (
          <button
            onClick={() => setActiveTab('daily_scoring')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2E8B57] hover:bg-[#257347] text-white text-xs font-bold transition-all shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>تسجيل تقييم اليوم</span>
          </button>
        )}
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Branch Selector Bar */}
        <BranchSelectorBar />

        {feedbackMsg && (
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Staff Selector (Admins can toggle staff; regular staff view their own) */}
        {canManageStaff ? (
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#162238] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>اختر المنتسب لعرض وتقييم الأداء:</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {staffMembers.map((m) => {
                const isSelected = m.id === selectedStaffId;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedStaffId(m.id)}
                    className={`p-2.5 rounded-xl border text-right transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[#1B2A4A] text-white border-[#D4AF37] shadow-sm'
                        : 'bg-slate-50 dark:bg-[#0f172a] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-[#D4AF37]/50'
                    }`}
                  >
                    <img
                      src={m.avatarUrl}
                      alt={m.fullName}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-[#D4AF37]/50"
                      referrerPolicy="no-referrer"
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold truncate leading-tight">{m.fullName}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-[#D4AF37] truncate">{m.department || 'كادر المركز'}</span>
                        <span
                          className="px-1 py-0.2 rounded text-[8px] font-bold text-white shrink-0"
                          style={{
                            backgroundColor: m.branchId === 'najaf' ? '#2E8B57' : '#1B2A4A',
                          }}
                        >
                          {m.branchId === 'najaf' ? 'نجف' : 'بصرة'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-white dark:bg-[#162238] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-[#D4AF37]"
                referrerPolicy="no-referrer"
              />
              <div>
                <h4 className="text-xs font-bold">{currentUser.fullName}</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {currentUser.department} • رقم البطاقة: {currentUser.nationalId}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300">
              ملفك الشخصي
            </span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 p-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('dynamic31')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'dynamic31'
                ? 'bg-[#1B2A4A] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>الجدول الشهري (31 يوماً)</span>
          </button>

          {canManageStaff && (
            <button
              onClick={() => setActiveTab('daily_scoring')}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'daily_scoring'
                  ? 'bg-[#1B2A4A] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>التقييم اليومي (10)</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('annual_archive')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'annual_archive'
                ? 'bg-[#1B2A4A] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>الأرشيف التراكمي</span>
          </button>
        </div>

        {/* ================= TAB 1: DYNAMIC 31-DAY EVALUATION TABLE ================= */}
        {activeTab === 'dynamic31' && (
          <div className="space-y-4">
            {/* Top Score Aggregation Card */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-[#1B2A4A] to-[#253966] text-white shadow-md border border-[#D4AF37]/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  نتيجة التقييم الشهري التراكمي: {monthlyData.period}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${getRatingBadgeClass(monthlyData.summary.rating)}`}>
                  {monthlyData.summary.rating}
                </span>
              </div>

              {/* Big Score Counter */}
              <div className="flex items-baseline justify-between border-y border-white/10 py-3">
                <div>
                  <p className="text-3xl font-black text-[#D4AF37] leading-none">
                    {monthlyData.summary.finalMonthlyScore}
                    <span className="text-base text-slate-300 font-normal mr-1">/ 100 نقطة</span>
                  </p>
                  <p className="text-[11px] text-slate-300 mt-1">
                    متوسط النقاط اليومية: <strong className="text-white">{monthlyData.summary.averageDailyScore}</strong> من 10
                  </p>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-300 block">أيام الحضور المقيمة:</span>
                  <span className="text-lg font-bold text-emerald-400">{monthlyData.summary.presentDaysCount} يوماً</span>
                </div>
              </div>

              {/* Leave Exemption Sync Banner */}
              <div className="p-2.5 rounded-2xl bg-[#2E8B57]/20 border border-[#2E8B57]/50 flex items-start gap-2 text-[11px] text-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-white">
                    نظام الإعفاء التلقائي للإجازات المعتمدة (Sync Logic):
                  </p>
                  <p className="text-[10px] leading-relaxed text-emerald-100">
                    أيام الإجازة المقبولة ({monthlyData.summary.exemptedLeavesCount} يوم) مستثناة تلقائياً ولا تخصم من المعدل التراكمي النهائي.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-2xl bg-white dark:bg-[#162238] border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">أيام الشهر</span>
                <span className="text-base font-bold text-[#1B2A4A] dark:text-white">31</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-white dark:bg-[#162238] border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">أيام الحضور</span>
                <span className="text-base font-bold text-emerald-600">{monthlyData.summary.presentDaysCount}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-white dark:bg-[#162238] border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">إجازات معفاة</span>
                <span className="text-base font-bold text-[#D4AF37]">{monthlyData.summary.exemptedLeavesCount}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-white dark:bg-[#162238] border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">الغياب</span>
                <span className="text-base font-bold text-red-500">{monthlyData.summary.absentDaysCount}</span>
              </div>
            </div>

            {/* 31-Day Dynamic Table */}
            <div className="bg-white dark:bg-[#162238] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-3.5 bg-slate-50 dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs font-bold">جدول الأيام الـ 31 التفصيلي لشهر أيلول</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {currentSelectedUser?.fullName}
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[460px] overflow-y-auto">
                {monthlyData.days.map((day) => {
                  const isLeave = day.status === 'مجاز';
                  const isPresent = day.status === 'حاضر';
                  const isAbsent = day.status === 'غائب';
                  const isFuture = day.status === 'لم يحن بعد';
                  const isHoliday = day.status === 'عطلة رسمية';

                  return (
                    <div
                      key={day.dayNumber}
                      className={`p-3 text-xs flex items-center justify-between transition-colors ${
                        isLeave
                          ? 'bg-amber-50/50 dark:bg-amber-950/20'
                          : isPresent
                          ? 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                          : isAbsent
                          ? 'bg-red-50/40 dark:bg-red-950/20'
                          : 'opacity-70'
                      }`}
                    >
                      {/* Day and Date */}
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold flex items-center justify-center text-xs text-[#1B2A4A] dark:text-[#D4AF37]">
                          {day.dayNumber}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold">{day.dayName}</span>
                            <span className="text-[10px] text-slate-400">({day.dateStr})</span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                            {day.notes || (isPresent ? 'حضور تام' : '')}
                          </p>
                        </div>
                      </div>

                      {/* Status and Score */}
                      <div className="flex items-center gap-2">
                        {isLeave ? (
                          <div className="text-left">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300">
                              <ShieldCheck className="w-3 h-3" />
                              <span>مجاز (معفى)</span>
                            </span>
                            <span className="text-[9px] text-[#D4AF37] block mt-0.5">لا يخصم من النتيجة</span>
                          </div>
                        ) : isPresent ? (
                          <div className="text-left">
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                              حاضر
                            </span>
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                              {day.score} / 10
                            </span>
                          </div>
                        ) : isAbsent ? (
                          <div className="text-left">
                            <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-[10px] font-bold">
                              غائب
                            </span>
                            <span className="text-xs font-black text-red-600 block mt-0.5">0 / 10</span>
                          </div>
                        ) : isHoliday ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                            عطلة
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">قادم</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: DAILY EVALUATION SCORING (ADMIN SCORES STAFF OUT OF 10) ================= */}
        {activeTab === 'daily_scoring' && canManageStaff && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl bg-white dark:bg-[#162238] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-[#1B2A4A] dark:text-white flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-[#D4AF37]" />
                    <span>تسجيل التقييم اليومي المباشر (10 نقاط)</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    يتجدد يومياً تلقائياً مع خيار التقييم بأثر رجعي
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-black border border-amber-500/30">
                  {totalDailyScoreCalculated} / 10
                </span>
              </div>

              <form onSubmit={handleSaveDailyEvaluation} className="space-y-4 text-xs">
                {/* Selected staff preview */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={currentSelectedUser?.avatarUrl}
                      alt={currentSelectedUser?.fullName}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-[#D4AF37]"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <span className="font-bold block">{currentSelectedUser?.fullName}</span>
                      <span className="text-[10px] text-slate-500">{currentSelectedUser?.department}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#2E8B57] font-bold">المنتسب المستهدف</span>
                </div>

                {/* Date Picker */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ التقييم اليومي:
                  </label>
                  <input
                    type="date"
                    value={evalDate}
                    onChange={(e) => setEvalDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs font-bold"
                  />
                </div>

                {/* The 4 Standard Sub-Aspects (2.5 pts each = 10 total) */}
                <div className="space-y-3 pt-2">
                  <label className="font-bold text-slate-800 dark:text-slate-200 block">
                    توزيع المحاور الأربعة للدرجة اليومية (من 10):
                  </label>

                  {/* 1. Punctuality */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        1. الانضباط والمواظبة على البصمة (2.5):
                      </span>
                      <span className="font-black text-[#D4AF37]">{punctualityScore} / 2.5</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2.5"
                      step="0.5"
                      value={punctualityScore}
                      onChange={(e) => setPunctualityScore(Number(e.target.value))}
                      className="w-full accent-[#1B2A4A]"
                    />
                  </div>

                  {/* 2. Productivity */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        2. الإنجاز والإنتاجية وسرعة المهام (2.5):
                      </span>
                      <span className="font-black text-[#D4AF37]">{productivityScore} / 2.5</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2.5"
                      step="0.5"
                      value={productivityScore}
                      onChange={(e) => setProductivityScore(Number(e.target.value))}
                      className="w-full accent-[#1B2A4A]"
                    />
                  </div>

                  {/* 3. Cultural Engagement */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        3. التفاعل مع الأنشطة الثقافية والفكرية (2.5):
                      </span>
                      <span className="font-black text-[#D4AF37]">{culturalEngagementScore} / 2.5</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2.5"
                      step="0.5"
                      value={culturalEngagementScore}
                      onChange={(e) => setCulturalEngagementScore(Number(e.target.value))}
                      className="w-full accent-[#1B2A4A]"
                    />
                  </div>

                  {/* 4. Teamwork */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        4. روح التعاون والعمل الجماعي (2.5):
                      </span>
                      <span className="font-black text-[#D4AF37]">{teamworkScore} / 2.5</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2.5"
                      step="0.5"
                      value={teamworkScore}
                      onChange={(e) => setTeamworkScore(Number(e.target.value))}
                      className="w-full accent-[#1B2A4A]"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ملاحظات المقيم / الإدارة:
                  </label>
                  <textarea
                    rows={2}
                    value={evalNotes}
                    onChange={(e) => setEvalNotes(e.target.value)}
                    placeholder="اكتب ملاحظات حول أداء المنتسب لهذا اليوم..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs resize-none"
                  />
                </div>

                {/* Save button */}
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#2E8B57] hover:bg-[#257347] text-white font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>اعتماد التقييم اليومي ({totalDailyScoreCalculated} / 10)</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= TAB 3: ANNUAL / PERIODIC OFFICIAL ARCHIVE ================= */}
        {activeTab === 'annual_archive' && (
          <div className="space-y-4">
            {canManageStaff && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#1B2A4A] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-[#253966]"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>إصدار استمارة تقييم رسمية</span>
                </button>
              </div>
            )}

            <div className="space-y-3">
              {evaluations.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 rounded-3xl bg-white dark:bg-[#162238] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#1B2A4A] dark:text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{ev.userName}</span>
                        <span
                          className="px-1.5 py-0.2 rounded-full text-[9px] font-bold text-white"
                          style={{
                            backgroundColor: ev.branchId === 'najaf' ? '#2E8B57' : '#1B2A4A',
                          }}
                        >
                          {ev.branchId === 'najaf' ? 'فرع النجف' : 'فرع البصرة'}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        فترة التقييم: {ev.period} • المقيم: {ev.evaluatorName}
                      </p>
                    </div>

                    <div className="text-left">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${getRatingBadgeClass(ev.rating)}`}>
                        {ev.rating} ({ev.totalScore}%)
                      </span>
                    </div>
                  </div>

                  {/* Criteria Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#0f172a] flex justify-between">
                      <span className="text-slate-500">الانضباط والمواظبة:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{ev.scores.punctuality}/25</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#0f172a] flex justify-between">
                      <span className="text-slate-500">الإنتاجية وسرعة الإنجاز:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{ev.scores.productivity}/25</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#0f172a] flex justify-between">
                      <span className="text-slate-500">النشاط الثقافي والفكري:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{ev.scores.culturalEngagement}/25</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#0f172a] flex justify-between">
                      <span className="text-slate-500">التعاون والعمل الجماعي:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{ev.scores.teamwork}/25</strong>
                    </div>
                  </div>

                  {ev.directorNotes && (
                    <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 text-slate-700 dark:text-slate-300 text-[11px] border border-amber-200/50">
                      <strong>ملاحظة الإدارة: </strong>
                      <span>{ev.directorNotes}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#2E8B57]" />
                      <span>موثق ومحفوظ في الأرشيف لمدة 5 سنوات</span>
                    </span>
                    <span>الصلاحية حتى {ev.expiresAt.split('T')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: Add Periodic / Annual Evaluation */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#162238] w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-[#D4AF37]/30 space-y-4 text-right">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-[#1B2A4A] dark:text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#D4AF37]" />
                  <span>استمارة تقييم أداء رسمي</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddAnnualEvaluation} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">المنتسب:</label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs font-bold"
                  >
                    {staffMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.department || 'كادر المركز'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الفترة:</label>
                  <input
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">الانضباط (25):</label>
                    <input
                      type="number"
                      max="25"
                      min="0"
                      value={annualPunctuality}
                      onChange={(e) => setAnnualPunctuality(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">الإنتاجية (25):</label>
                    <input
                      type="number"
                      max="25"
                      min="0"
                      value={annualProductivity}
                      onChange={(e) => setAnnualProductivity(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">النشاط الفكري (25):</label>
                    <input
                      type="number"
                      max="25"
                      min="0"
                      value={annualCultural}
                      onChange={(e) => setAnnualCultural(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">العمل الجماعي (25):</label>
                    <input
                      type="number"
                      max="25"
                      min="0"
                      value={annualTeamwork}
                      onChange={(e) => setAnnualTeamwork(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ملاحظات الإدارة:
                  </label>
                  <textarea
                    rows={2}
                    value={directorNotes}
                    onChange={(e) => setDirectorNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs resize-none"
                    placeholder="ملاحظات تفصيلية..."
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
                    className="flex-1 py-2.5 rounded-xl bg-[#1B2A4A] text-white font-bold"
                  >
                    حفظ واعتماد
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
