import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService, formatAttendanceStatus } from '../../services/storageService';
import { AttendanceRecord, BranchId, User } from '../../types';
import { BranchSelectorBar } from '../common/BranchSelectorBar';
import { AttendanceJsonModal } from './AttendanceJsonModal';
import { PushNotificationManagerModal } from './PushNotificationManagerModal';
import { pushNotificationService } from '../../services/pushNotificationService';
import {
  Clock,
  CheckCircle2,
  Calendar,
  Fingerprint,
  ArrowRight,
  Database,
  CalendarCheck,
  Bell,
  UserX,
  ShieldCheck,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  Layers,
  Table as TableIcon,
  LayoutGrid,
  FileJson,
  Building2,
  Check,
  Edit3,
  X,
  AlertCircle,
  UserCheck,
} from 'lucide-react';

interface AttendanceModuleProps {
  onBack: () => void;
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({ onBack }) => {
  const { currentUser, canManageStaff, activeBranch, effectiveBranch } = useAuth();

  // Access Control: Restrict attendance editing privileges strictly to Main Admin and Sub-Admins
  const isAdmin = currentUser?.role === 'main_admin' || currentUser?.role === 'sub_admin';

  // Branch-aware registered users list
  const branchUsers = storageService.getUsers(activeBranch);
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser?.id || '');

  // Year & Month selector (defaults to current date e.g. September 2026)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(9); // 9 = أيلول / سبتمبر

  // Current live time ticker for local mobile 12h display
  const [currentLiveTime, setCurrentLiveTime] = useState<string>(storageService.formatTime12h());
  const [currentLiveDate, setCurrentLiveDate] = useState<string>(
    new Date().toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  );

  // View style: 'table' or 'cards'
  const [viewStyle, setViewStyle] = useState<'table' | 'cards'>('cards');

  // JSON Modal State
  const [isJsonModalOpen, setIsJsonModalOpen] = useState<boolean>(false);

  // Push Notification Manager Modal State
  const [isPushManagerOpen, setIsPushManagerOpen] = useState<boolean>(false);

  // Attendance list state
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>(() =>
    storageService.getAttendance(activeBranch)
  );

  // Explicit state variables for Attendance Editing (Fixing ReferenceError)
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editStatus, setEditStatus] = useState<string>('present');
  const [editCheckIn, setEditCheckIn] = useState<string>('');
  const [editCheckOut, setEditCheckOut] = useState<string>('');

  // Feedback message
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Trigger re-render state
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Keep attendance list in sync with active branch and data changes
  useEffect(() => {
    setAttendanceList(storageService.getAttendance(activeBranch));
  }, [activeBranch, refreshKey]);

  // Live timer update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentLiveTime(storageService.formatTime12h(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Ensure selectedUserId is valid within branchUsers
  useEffect(() => {
    if (branchUsers.length > 0 && !branchUsers.some((u) => u.id === selectedUserId)) {
      const defaultUser = branchUsers.find((u) => u.id === currentUser?.id) || branchUsers[0];
      if (defaultUser) {
        setSelectedUserId(defaultUser.id);
      }
    }
  }, [activeBranch, branchUsers, currentUser, selectedUserId]);

  if (!currentUser) return null;

  const targetUser = branchUsers.find((u) => u.id === selectedUserId) || currentUser;

  // Compute 31-Day dynamic grid and top counters
  const gridData = storageService.getMonthAttendanceGrid(targetUser.id, selectedYear, selectedMonth);

  // Today's record for logged-in user (for Check-In / Check-Out buttons)
  const todayStr = new Date().toISOString().split('T')[0];
  const allAttendance = storageService.getAttendance(activeBranch);
  const currentUserTodayRecord = allAttendance.find(
    (a) => a.userId === currentUser.id && a.date === todayStr
  );

  // Filtered electronic logs (including #101)
  const recentLogs = allAttendance.slice(0, 5);

  // 1. PRIMARY ACTION: تسجيل الحضور
  const handleCheckIn = () => {
    // Automatically grabs local mobile date and time in 12-hour format (AM/PM)
    const res = storageService.checkIn(currentUser, 'بصمة حيوية');
    if (res.success) {
      setMessage({ text: res.message, type: 'success' });
      setRefreshKey((k) => k + 1);

      // Trigger Mobile Web Push Notification to Main Admin & Branch Admin
      pushNotificationService.dispatchAttendancePushNotification({
        type: 'check_in',
        employee: currentUser,
        branchId: currentUser.branchId || activeBranch,
        timeStr: storageService.formatTime12h(),
      });
    } else {
      setMessage({ text: res.message, type: 'error' });
    }
    setTimeout(() => setMessage(null), 5000);
  };

  // 2. PRIMARY ACTION: تسجيل الانصراف
  const handleCheckOut = () => {
    // Automatically grabs local mobile date and time in 12-hour format (AM/PM)
    const res = storageService.checkOut(currentUser);
    if (res.success) {
      setMessage({ text: res.message, type: 'success' });
      setRefreshKey((k) => k + 1);

      // Trigger Mobile Web Push Notification to Main Admin & Branch Admin
      pushNotificationService.dispatchAttendancePushNotification({
        type: 'check_out',
        employee: currentUser,
        branchId: currentUser.branchId || activeBranch,
        timeStr: storageService.formatTime12h(),
      });
    } else {
      setMessage({ text: res.message, type: 'error' });
    }
    setTimeout(() => setMessage(null), 5000);
  };

  // Helper to normalize status values
  const normalizeAttendanceStatus = (statusStr?: string): 'present' | 'absent' | 'leave' => {
    if (!statusStr) return 'present';
    const s = String(statusStr).toLowerCase().trim();
    if (s === 'absent' || s === 'غائب') return 'absent';
    if (s === 'leave' || s === 'مجاز' || s === 'إجازة') return 'leave';
    return 'present';
  };

  // Open Edit Attendance Modal for a specific day in the monthly grid (ADMIN ONLY)
  const handleOpenEditDay = (day: {
    dateStr: string;
    status: string;
    checkInTime?: string;
    checkOutTime?: string;
  }) => {
    if (!isAdmin) {
      setMessage({ text: 'غير مصرح: تعديل سجلات الحضور مخصص للمدير العام والمدراء الفرعيين فقط', type: 'error' });
      return;
    }

    const rawRecord = allAttendance.find((a) => a.userId === targetUser.id && a.date === day.dateStr);

    let checkIn24 = rawRecord?.checkIn || '';
    let checkOut24 = rawRecord?.checkOut || '';

    if (!checkIn24 && day.checkInTime && day.checkInTime !== '-') {
      const match = day.checkInTime.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        let h = parseInt(match[1], 10);
        const m = match[2];
        if (day.checkInTime.includes('م') && h < 12) h += 12;
        checkIn24 = `${String(h).padStart(2, '0')}:${m}`;
      }
    }
    if (!checkOut24 && day.checkOutTime && day.checkOutTime !== '-') {
      const match = day.checkOutTime.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        let h = parseInt(match[1], 10);
        const m = match[2];
        if (day.checkOutTime.includes('م') && h < 12) h += 12;
        checkOut24 = `${String(h).padStart(2, '0')}:${m}`;
      }
    }

    const statusVal = normalizeAttendanceStatus(rawRecord?.status || day.status);
    const inTime = checkIn24 || '08:00';
    const outTime = checkOut24 || '16:00';

    setEditingRecord({
      id: rawRecord?.id || `att_${Date.now()}`,
      date: day.dateStr,
      status: statusVal,
      checkIn: inTime,
      checkOut: outTime,
      userId: targetUser.id,
      userName: targetUser.fullName,
      branchId: targetUser.branchId || activeBranch,
    });
    setEditStatus(statusVal);
    setEditCheckIn(inTime);
    setEditCheckOut(outTime);
  };

  // Open Edit Attendance Modal for recent electronic logs (ADMIN ONLY)
  const handleOpenEditRecentLog = (log: AttendanceRecord) => {
    if (!isAdmin) {
      setMessage({ text: 'غير مصرح: تعديل سجلات الحضور مخصص للمدير العام والمدراء الفرعيين فقط', type: 'error' });
      return;
    }

    let inTime = log.checkIn || '';
    if (!inTime && log.checkInTime && log.checkInTime !== '-') {
      const match = log.checkInTime.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        let h = parseInt(match[1], 10);
        const m = match[2];
        if (log.checkInTime.includes('م') && h < 12) h += 12;
        inTime = `${String(h).padStart(2, '0')}:${m}`;
      }
    }
    if (!inTime) inTime = '08:00';

    let outTime = log.checkOut || '';
    if (!outTime && log.checkOutTime && log.checkOutTime !== '-') {
      const match = log.checkOutTime.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        let h = parseInt(match[1], 10);
        const m = match[2];
        if (log.checkOutTime.includes('م') && h < 12) h += 12;
        outTime = `${String(h).padStart(2, '0')}:${m}`;
      }
    }
    if (!outTime) outTime = '16:00';

    const statusVal = normalizeAttendanceStatus(log.status);

    setEditingRecord({
      id: log.id,
      date: log.date,
      status: statusVal,
      checkIn: inTime,
      checkOut: outTime,
      userId: log.userId,
      userName: log.userName,
      branchId: log.branchId,
    });
    setEditStatus(statusVal);
    setEditCheckIn(inTime);
    setEditCheckOut(outTime);
  };

  // Save changes from Edit Attendance Modal (ADMIN ONLY)
  const handleSaveEditedRecord = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingRecord) return;

    if (!isAdmin) {
      setMessage({ text: 'غير مصرح: لا تملك صلاحية تعديل سجلات الحضور', type: 'error' });
      setEditingRecord(null);
      return;
    }

    // Automatically clears check-in/check-out timestamps if status is set to 'absent' or 'leave'
    const finalCheckIn = editStatus === 'present' ? (editCheckIn || '08:00') : undefined;
    const finalCheckOut = editStatus === 'present' ? (editCheckOut || '16:00') : undefined;

    const previousStatus = editingRecord.status;
    const previousCheckIn = editingRecord.checkIn;
    const previousCheckOut = editingRecord.checkOut;

    const targetUserId = editingRecord.userId || targetUser?.id || currentUser?.id;
    const targetUserName = editingRecord.userName || targetUser?.fullName || currentUser?.fullName;
    const targetBranchId: BranchId =
      (editingRecord.branchId as BranchId) ||
      (activeBranch === 'all' ? (currentUser.branchId || 'basra') : activeBranch);

    const res = storageService.processAttendancePayload({
      id: editingRecord.id,
      date: editingRecord.date,
      status: editStatus,
      checkIn: finalCheckIn,
      checkOut: finalCheckOut,
      userId: targetUserId,
      userName: targetUserName,
      branchId: targetBranchId,
    });

    if (res.success) {
      // Log the admin action for auditing
      storageService.logAttendanceAudit({
        adminId: currentUser.id,
        adminName: currentUser.fullName,
        adminRole: currentUser.role,
        targetUserId,
        targetUserName,
        recordId: res.record.id,
        date: editingRecord.date,
        previousStatus: String(previousStatus || ''),
        newStatus: editStatus,
        previousCheckIn: previousCheckIn ? String(previousCheckIn) : undefined,
        newCheckIn: finalCheckIn,
        previousCheckOut: previousCheckOut ? String(previousCheckOut) : undefined,
        newCheckOut: finalCheckOut,
        branchId: targetBranchId,
        notes: `تعديل سجل دوام بواسطة ${currentUser.fullName} (${currentUser.role === 'main_admin' ? 'المدير العام' : 'مدير الفرع'})`,
      });

      // Updates local state and syncs with storage/backend
      setAttendanceList(storageService.getAttendance(activeBranch));
      setRefreshKey((k) => k + 1);
      setMessage({ text: `تم تحديث وتثبيت سجل يوم (${editingRecord.date}) بنجاح`, type: 'success' });
    } else {
      setMessage({ text: res.message, type: 'error' });
    }

    setEditingRecord(null);
    setEditStatus('present');
    setEditCheckIn('');
    setEditCheckOut('');
    setTimeout(() => setMessage(null), 5000);
  };

  const monthNamesArabic = [
    'كانون الثاني (1)',
    'شباط (2)',
    'آذار (3)',
    'نيسان (4)',
    'أيار (5)',
    'حزيران (6)',
    'تموز (7)',
    'آب (8)',
    'أيلول (9)',
    'تشرين الأول (10)',
    'تشرين الثاني (11)',
    'كانون الأول (12)',
  ];

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
              <span>الحضور والانصراف</span>
              <span className="px-2 py-0.5 rounded-md bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-black border border-[#D4AF37]/30">
                الجزء الثاني
              </span>
            </h2>
            <p className="text-[11px] text-slate-300">تسجيل الدوام والشبكة الشهرية (31 يوماً)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManageStaff && (
            <button
              type="button"
              onClick={() => setIsPushManagerOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#D4AF37] hover:bg-[#e2bd44] text-[#1B2A4A] text-xs font-black transition-all shadow-xs cursor-pointer"
              title="إدارة إشعارات شاشة الموبايل وقفل الشاشة (FCM)"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إشعارات الموبايل</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 text-xs text-slate-200">
            <Database className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="hidden sm:inline">أرشفة نظامية 5 سنوات</span>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Branch Selector Bar (for Multi-Branch system) */}
        <BranchSelectorBar />

        {/* Banner Alert Message */}
        {message && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all shadow-sm ${
              message.type === 'success'
                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="leading-snug">{message.text}</span>
          </div>
        )}

        {/* JSON Payload Integration Bar */}
        <div className="bg-gradient-to-l from-[#1B2A4A] to-[#253966] text-white p-3.5 rounded-3xl border border-[#D4AF37]/30 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#D4AF37] text-[#1B2A4A] flex items-center justify-center font-black shadow-xs">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-black">معالجة سجل بتنسيق JSON</h4>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-white text-[9px] font-bold">
                  سجل #101
                </span>
              </div>
              <p className="text-[10px] text-slate-300">
                إدخال / استيراد سجلات الدوام (حاضر، غائب، إجازة)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsJsonModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#D4AF37] text-[#1B2A4A] hover:bg-[#e0bc44] text-xs font-black transition-all shadow-xs flex items-center gap-1"
          >
            <span>فتح المحرر</span>
          </button>
        </div>

        {/* SECTION 1: TWO PRIMARY BUTTONS [تسجيل الحضور] & [تسجيل الانصراف] with Local Mobile 12h Clock */}
        <section className="bg-white dark:bg-[#152033] rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-[#1B2A4A] text-[#D4AF37] flex items-center justify-center shadow-md">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">التوقيت المحلي لجهاز الهاتف:</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-[#1B2A4A] dark:text-white font-mono tracking-wide" dir="ltr">
                    {currentLiveTime}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    12H (AM/PM)
                  </span>
                </div>
              </div>
            </div>

            {/* Shift Status Tag for currently logged in User (Admin or Staff) */}
            <div>
              {currentUserTodayRecord?.checkOutTime ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-black border border-emerald-500/30">
                  دوام مكتمل
                </span>
              ) : currentUserTodayRecord?.checkInTime ? (
                <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[11px] font-black border border-blue-500/30 animate-pulse">
                  قيد الدوام حالياً
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-black border border-amber-500/30">
                  لم يسجل بعد
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {currentLiveDate} • يلزم كلا المدراء والمنتسبين بتثبيت بصمة الحضور والانصراف اليومية بدقة.
          </p>

          {/* TWO PRIMARY ACTION BUTTONS: [تسجيل الحضور] and [تسجيل الانصراف] */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleCheckIn}
              disabled={!!currentUserTodayRecord}
              className={`py-3.5 px-3 rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 ${
                currentUserTodayRecord
                  ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
                  : 'bg-[#1B2A4A] hover:bg-[#253966] text-white border border-[#D4AF37]/40 ring-2 ring-[#1B2A4A]/20 cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Fingerprint className={`w-4 h-4 ${currentUserTodayRecord ? 'text-slate-400' : 'text-[#D4AF37]'}`} />
                <span className="text-sm">تسجيل الحضور</span>
              </div>
              <span className="text-[10px] font-normal text-slate-300">
                {currentUserTodayRecord
                  ? `حضر الساعة (${currentUserTodayRecord.checkInTime})`
                  : 'التقاط الوقت آلياً (AM/PM)'}
              </span>
            </button>

            <button
              onClick={handleCheckOut}
              disabled={!currentUserTodayRecord || !!currentUserTodayRecord.checkOutTime}
              className={`py-3.5 px-3 rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 ${
                !currentUserTodayRecord || !!currentUserTodayRecord.checkOutTime
                  ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
                  : 'bg-[#2E8B57] hover:bg-[#257347] text-white border border-emerald-400/40 ring-2 ring-emerald-500/20 cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Clock className={`w-4 h-4 ${!currentUserTodayRecord || currentUserTodayRecord.checkOutTime ? 'text-slate-400' : 'text-white'}`} />
                <span className="text-sm">تسجيل الانصراف</span>
              </div>
              <span className="text-[10px] font-normal text-slate-200">
                {currentUserTodayRecord?.checkOutTime
                  ? `انصرف الساعة (${currentUserTodayRecord.checkOutTime})`
                  : !currentUserTodayRecord
                  ? 'يتطلب الحضور أولاً'
                  : 'إنهاء الدوام واحتساب الساعات'}
              </span>
            </button>
          </div>
        </section>

        {/* SECTION 2: COUNTERS BLOCK AT TOP OF PAGE */}
        {/*
          Counters Block at top of page: 
          * عدد أيام الحضور
          * عدد أيام الغياب
          * عدد أيام الإجازات
          * إجمالي ساعات العمل
        */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>إحصائيات الشهر ({monthNamesArabic[selectedMonth - 1]} {selectedYear})</span>
            </h3>
            <span className="text-[10px] text-slate-400">تحديث فوري تلقائي</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 1. عدد أيام الحضور */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#152033] border border-emerald-100 dark:border-emerald-950/60 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">عدد أيام الحضور</span>
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CalendarCheck className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {gridData.presentCount}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">يوم</span>
              </div>
            </div>

            {/* 2. عدد أيام الغياب */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#152033] border border-red-100 dark:border-red-950/60 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">عدد أيام الغياب</span>
                <div className="w-6 h-6 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <UserX className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-red-600 dark:text-red-400">
                  {gridData.absentCount}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">يوم</span>
              </div>
            </div>

            {/* 3. عدد أيام الإجازات */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#152033] border border-amber-100 dark:border-amber-950/60 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">عدد أيام الإجازات</span>
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-[#D4AF37] flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#D4AF37]">
                  {gridData.leavesCount}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">يوم مجاز</span>
              </div>
            </div>

            {/* 4. إجمالي ساعات العمل */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#152033] border border-blue-100 dark:border-blue-950/60 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">إجمالي ساعات العمل</span>
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#1B2A4A] dark:text-blue-400">
                  {gridData.totalWorkingHours}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">ساعة</span>
              </div>
            </div>
          </div>
        </section>

        {/* User Switcher (For Admins to inspect any Staff or their own) & Layout Selector */}
        <section className="bg-white dark:bg-[#152033] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                عرض سجل الدوام للمنتسب/الإداري:
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#1B2A4A] dark:text-white"
              >
                {branchUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} - {u.designation} {u.id === currentUser.id ? '(أنت)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
              <button
                onClick={() => setViewStyle('cards')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${
                  viewStyle === 'cards'
                    ? 'bg-[#1B2A4A] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="عرض بطاقات تفصيلية"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="text-[11px]">بطاقات</span>
              </button>

              <button
                onClick={() => setViewStyle('table')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${
                  viewStyle === 'table'
                    ? 'bg-[#1B2A4A] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="عرض جدول ديناميكي"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="text-[11px]">جدول 31 يوم</span>
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 3: MONTHLY GRID / TABLE (31-DAY TABLE DYNAMIC GRID) */}
        {/*
          Showing:
          - Status (حاضر، غائب، مجاز)
          - Working Hours calculated between Check-In and Check-Out
          - 31 days representation
        */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-xs font-black text-[#1B2A4A] dark:text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#D4AF37]" />
                <span>الجدول الشهري الشامل (31 يوماً ديناميكياً)</span>
              </h3>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                حالة اليوم • الحضور • الانصراف • ساعات العمل المحتسبة
              </span>
            </div>

            <span className="px-2 py-0.5 rounded-md bg-[#1B2A4A]/10 dark:bg-slate-800 text-[10px] font-bold text-[#1B2A4A] dark:text-[#D4AF37]">
              {targetUser.fullName}
            </span>
          </div>

          {/* Render Style 1: DYNAMIC 31-DAY TABLE */}
          {viewStyle === 'table' ? (
            <div className="bg-white dark:bg-[#152033] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#1B2A4A] text-white text-[11px] font-bold select-none">
                    <tr>
                      <th className="py-3 px-2.5 text-center">اليوم</th>
                      <th className="py-3 px-2.5">التاريخ واليوم</th>
                      <th className="py-3 px-2.5 text-center">الحالة</th>
                      <th className="py-3 px-2.5 text-center">الحضور</th>
                      <th className="py-3 px-2.5 text-center">الانصراف</th>
                      <th className="py-3 px-2.5 text-center">ساعات العمل</th>
                      {isAdmin && <th className="py-3 px-2 text-center">إجراء</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {gridData.days.map((item) => (
                      <tr
                        key={item.dayNumber}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                          item.dateStr === todayStr ? 'bg-amber-50/50 dark:bg-amber-950/20 font-bold' : ''
                        }`}
                      >
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-400">
                          {item.dayNumber}
                        </td>
                        <td className="py-2.5 px-2.5 whitespace-nowrap">
                          <div className="font-bold text-[#1B2A4A] dark:text-white flex items-center gap-1">
                            <span>{item.dayName}</span>
                            {item.dateStr === todayStr && (
                              <span className="px-1.5 py-0.2 rounded-sm bg-amber-500 text-white text-[9px] font-black">
                                اليوم
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block">{item.dateStr}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {item.status === 'حاضر' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                              حاضر
                            </span>
                          ) : item.status === 'مجاز' ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-[#D4AF37] font-black text-[10px] border border-[#D4AF37]/30">
                                مجاز
                              </span>
                              {item.exemptFromEvaluation && (
                                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                                  معفى من الخصم
                                </span>
                              )}
                            </div>
                          ) : item.status === 'غائب' ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold text-[10px]">
                              غائب
                            </span>
                          ) : item.status === 'عطلة رسمية' ? (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium text-[10px]">
                              عطلة
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-900 text-slate-400 text-[10px]">
                              قادم
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {item.checkInTime}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {item.checkOutTime}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                          {item.workingHours > 0 ? `${item.workingHours} س` : '-'}
                        </td>
                        {isAdmin && (
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenEditDay(item)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#1B2A4A] text-slate-600 hover:text-[#D4AF37] dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                              title="تعديل سجل اليوم (للمدراء فقط)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Render Style 2: CARD GRID (Mobile optimized) */
            <div className="space-y-2">
              {gridData.days.map((item) => (
                <div
                  key={item.dayNumber}
                  className={`p-3.5 rounded-2xl bg-white dark:bg-[#152033] border transition-all ${
                    item.dateStr === todayStr
                      ? 'border-amber-400 dark:border-amber-500/80 shadow-md ring-1 ring-amber-400/20'
                      : 'border-slate-100 dark:border-slate-800 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-[#1B2A4A]/10 dark:bg-slate-800 text-[#1B2A4A] dark:text-[#D4AF37] font-mono text-xs font-black flex items-center justify-center">
                        {item.dayNumber}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-[#1B2A4A] dark:text-white">{item.dayName}</h4>
                          {item.dateStr === todayStr && (
                            <span className="px-1.5 py-0.2 rounded-sm bg-amber-500 text-white text-[9px] font-black">
                              اليوم الحالي
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{item.dateStr}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {item.status === 'حاضر' ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black text-[10px] border border-emerald-300/40">
                          حاضر
                        </span>
                      ) : item.status === 'مجاز' ? (
                        <div className="flex flex-col items-end">
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-black text-[10px] border border-[#D4AF37]/40">
                            مجاز (إجازة معتمدة)
                          </span>
                          {item.exemptFromEvaluation && (
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                              معفى من الخصم والتقييم السلبي
                            </span>
                          )}
                        </div>
                      ) : item.status === 'غائب' ? (
                        <span className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-black text-[10px] border border-red-300/40">
                          غائب بدون عذر
                        </span>
                      ) : item.status === 'عطلة رسمية' ? (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-[10px]">
                          عطلة رسمية / جمعة
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-900 text-slate-400 text-[10px]">
                          تاريخ قادم
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Timing & Hours Bar */}
                  <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-400 block">الحضور:</span>
                      <span className="font-mono font-bold text-[#1B2A4A] dark:text-slate-200">
                        {item.checkInTime}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">الانصراف:</span>
                      <span className="font-mono font-bold text-[#1B2A4A] dark:text-slate-200">
                        {item.checkOutTime}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">ساعات العمل:</span>
                      <span className="font-mono font-black text-blue-600 dark:text-blue-400">
                        {item.workingHours > 0 ? `${item.workingHours} ساعة` : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Leave details note if on leave */}
                  {item.leaveInfo && (
                    <div className="mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-900 dark:text-amber-200 flex items-center justify-between">
                      <span>السبب: {item.leaveInfo.reason}</span>
                      <span className="font-bold">فئة الإجازة: {item.leaveInfo.category}</span>
                    </div>
                  )}

                  {/* Management action button if isAdmin */}
                  {isAdmin && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">إدارة السجل لهذا اليوم:</span>
                      <button
                        type="button"
                        onClick={() => handleOpenEditDay(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-[#1B2A4A] hover:text-[#D4AF37] dark:bg-slate-800 dark:hover:bg-[#1B2A4A] text-slate-700 dark:text-slate-300 text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>تعديل السجل</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 4: ELECTRONIC LOGS & JSON PAYLOAD RECORDS (Includes Record #101) */}
        <section className="bg-white dark:bg-[#152033] rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#1B2A4A] text-[#D4AF37] flex items-center justify-center">
                <FileJson className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-[#1B2A4A] dark:text-white">
                  سجلات الحضور الإلكترونية وحمولات JSON الموثقة
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  تتضمن السجل النظامي المعتمد (#101) مع توزيع الفروع (البصرة والنجف)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsJsonModalOpen(true)}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#1B2A4A]/10 dark:bg-slate-800 text-[#1B2A4A] dark:text-[#D4AF37] hover:bg-[#1B2A4A]/20 transition-colors"
            >
              + معالجة حمولة جديدة
            </button>
          </div>

          <div className="space-y-2">
            {recentLogs.map((log) => {
              const statusInfo = formatAttendanceStatus(log.status);
              const isPayload101 = log.id === '101';
              return (
                <div
                  key={log.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    isPayload101
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 border-[#D4AF37] ring-1 ring-[#D4AF37]/40'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-[#1B2A4A] text-[#D4AF37] font-mono text-xs font-black">
                        #{log.id}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#1B2A4A] dark:text-white">
                            {log.userName || 'منتسب نظامي'}
                          </span>
                          {isPayload101 && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#D4AF37] text-[#1B2A4A]">
                              حمولة معتمدة
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {log.date}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${statusInfo.bg}`}
                      >
                        {statusInfo.label}
                      </span>

                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                        style={{
                          backgroundColor: log.branchId === 'najaf' ? '#2E8B57' : '#1B2A4A',
                        }}
                      >
                        {log.branchId === 'najaf' ? 'فرع النجف' : 'فرع البصرة'}
                      </span>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditRecentLog(log)}
                          className="p-1 rounded-lg bg-slate-100 hover:bg-[#1B2A4A] text-slate-500 hover:text-[#D4AF37] dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                          title="تعديل السجل (للمدراء فقط)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 dark:text-slate-400">
                        وقت الدخول:{' '}
                        <strong className="text-slate-800 dark:text-slate-200 font-mono">
                          {log.checkIn || log.checkInTime || '-'}
                        </strong>
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        وقت الخروج:{' '}
                        <strong className="text-slate-800 dark:text-slate-200 font-mono">
                          {log.checkOut || log.checkOutTime || '-'}
                        </strong>
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400">
                      طريقة التسجيل: {log.verificationMethod || 'معالجة إلكترونية'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* JSON Payload Modal */}
      <AttendanceJsonModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        onRecordProcessed={(rec) => {
          setMessage({
            text: `تمت معالجة وتثبيت سجل الحضور #${rec.id} بنجاح`,
            type: 'success',
          });
          setRefreshKey((k) => k + 1);
        }}
      />

      {/* Attendance Edit Modal (Admin Only) */}
      {editingRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          dir="rtl"
        >
          <div className="relative w-full max-w-md bg-white dark:bg-[#152033] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right">
            {/* Modal Header */}
            <div className="p-4 bg-[#1B2A4A] text-white flex items-center justify-between border-b border-[#D4AF37]/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black leading-tight">تعديل سجل الدوام - {editingRecord.date}</h3>
                  {editingRecord.userName && (
                    <p className="text-[11px] text-[#D4AF37] flex items-center gap-1 mt-0.5">
                      <UserCheck className="w-3 h-3" />
                      <span>المنتسب: {editingRecord.userName}</span>
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingRecord(null);
                  setEditStatus('present');
                  setEditCheckIn('');
                  setEditCheckOut('');
                }}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEditedRecord} className="p-5 space-y-4">
              {/* Status Selector: [حاضر (Present), غائب (Absent), إجازة (Leave)] */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  حالة الدوام (Status Selector):
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-[#1B2A4A] dark:text-white focus:ring-2 focus:ring-[#D4AF37] outline-none"
                >
                  <option value="present">حاضر (Present)</option>
                  <option value="absent">غائب (Absent)</option>
                  <option value="leave">إجازة (Leave)</option>
                </select>
              </div>

              {/* Time Pickers: "وقت الحضور" (Check-In) and "وقت الانصراف" (Check-Out) - visible only when status is 'present' */}
              {editStatus === 'present' ? (
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 animate-in fade-in duration-200">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>وقت الحضور (Check-In):</span>
                    </label>
                    <input
                      type="time"
                      value={editCheckIn}
                      onChange={(e) => setEditCheckIn(e.target.value)}
                      required
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-center text-[#1B2A4A] dark:text-white focus:ring-2 focus:ring-[#D4AF37] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>وقت الانصراف (Check-Out):</span>
                    </label>
                    <input
                      type="time"
                      value={editCheckOut}
                      onChange={(e) => setEditCheckOut(e.target.value)}
                      required
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-center text-[#1B2A4A] dark:text-white focus:ring-2 focus:ring-[#D4AF37] outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span className="leading-relaxed">
                    {editStatus === 'absent'
                      ? 'تم تحديد الحالة كـ (غائب). سيتم مسح وتصفير أوقات الحضور والانصراف تلقائياً واحتساب ساعات العمل 0.'
                      : 'تم تحديد الحالة كـ (إجازة). سيتم مسح وتصفير أوقات الحضور والانصراف تلقائياً وإعفاء المنتسب من الخصم والتقييم السلبي.'}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingRecord(null);
                    setEditStatus('present');
                    setEditCheckIn('');
                    setEditCheckOut('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1B2A4A] hover:bg-[#253966] text-[#D4AF37] text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ التغييرات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Push Notification & Device FCM Manager Modal */}
      <PushNotificationManagerModal
        isOpen={isPushManagerOpen}
        onClose={() => setIsPushManagerOpen(false)}
      />
    </div>
  );
};
