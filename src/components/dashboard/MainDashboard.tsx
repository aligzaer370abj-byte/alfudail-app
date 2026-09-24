import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { CenterLogo } from '../common/CenterLogo';
import { NotificationCenterModal } from '../common/NotificationCenterModal';
import { BranchSelectorBar } from '../common/BranchSelectorBar';
import { PushNotificationManagerModal } from '../modules/PushNotificationManagerModal';
import {
  CalendarCheck,
  CalendarDays,
  Award,
  FileText,
  AlertOctagon,
  MessageSquareText,
  BookOpen,
  Database,
  User,
  Bell,
  Smartphone,
  Moon,
  Sun,
  Shield,
  Clock,
  ArrowUpLeft,
  Users,
  UserCog,
  KeyRound,
  ShieldAlert,
  Building2,
  ShoppingBag,
  Printer,
} from 'lucide-react';

export type ActiveScreen =
  | 'home'
  | 'profile'
  | 'attendance'
  | 'leaves'
  | 'performance'
  | 'official_docs'
  | 'warnings'
  | 'complaints'
  | 'library'
  | 'retention_engine'
  | 'staff_directory'
  | 'purchases';

interface MainDashboardProps {
  onNavigate: (screen: ActiveScreen) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  onNavigate,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const {
    currentUser,
    isMainAdmin,
    isSuperAdmin,
    isSubAdmin,
    canManageStaff,
    activeBranch,
    branchInfo,
  } = useAuth();
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isPushManagerOpen, setIsPushManagerOpen] = useState(false);

  if (!currentUser) return null;

  // Requirement: Expiration & auto-deletion alerts are EXCLUSIVELY for Admins.
  // Normal staff/members will NOT receive or view any expiration notifications or archive system alerts.
  const retentionAlerts = canManageStaff ? storageService.getRetentionAlerts() : [];
  const userNotifications = storageService.getNotifications(currentUser.id);
  const unreadGeneralNotifs = userNotifications.filter((n: { isRead: boolean }) => !n.isRead);
  const totalBadgeCount = retentionAlerts.length + unreadGeneralNotifs.length;

  const branchStaffCount = storageService.getUsers(activeBranch).length;

  // The 7 Required Navigation Grid Items
  const navItems = [
    {
      id: 'attendance' as ActiveScreen,
      title: 'الحضور والانصراف',
      subtitle: 'البصمة الحيوية وسجلات الدوام',
      icon: CalendarCheck,
      color: 'from-[#1B2A4A] to-[#2b4170]',
      iconColor: 'text-[#D4AF37]',
      badge: 'يومي',
    },
    {
      id: 'leaves' as ActiveScreen,
      title: 'الاجازات',
      subtitle: 'الطلبات، الموافقات، والرصيد',
      icon: CalendarDays,
      color: 'from-[#2E8B57] to-[#1f5c3a]',
      iconColor: 'text-white',
      badge: 'إداري',
    },
    {
      id: 'performance' as ActiveScreen,
      title: 'تقييم عمل المنتسبين',
      subtitle: 'المعايير الميدانية والمواظبة',
      icon: Award,
      color: 'from-[#D4AF37] to-[#b38f20]',
      iconColor: 'text-[#1B2A4A]',
      badge: 'شهري',
    },
    {
      id: 'official_docs' as ActiveScreen,
      title: 'الكتب الرسمية والمهام',
      subtitle: 'الأوامر الإدارية وكتب الشكر',
      icon: FileText,
      color: 'from-[#1B2A4A] to-[#152542]',
      iconColor: 'text-[#D4AF37]',
      badge: 'توثيق',
    },
    {
      id: 'warnings' as ActiveScreen,
      title: 'الانذارات والعقوبات',
      subtitle: 'السجل الانضباطي واللوائح',
      icon: AlertOctagon,
      color: 'from-red-600 to-red-800',
      iconColor: 'text-white',
      badge: 'انضباط',
    },
    {
      id: 'complaints' as ActiveScreen,
      title: 'الطلبات والشكاوى',
      subtitle: 'قنوات التواصل المباشر والسرية',
      icon: MessageSquareText,
      color: 'from-[#3A506B] to-[#1C2541]',
      iconColor: 'text-teal-300',
      badge: 'تواصل',
    },
    {
      id: 'library' as ActiveScreen,
      title: 'المكتبة الإلكترونية',
      subtitle: 'الكتب الدينية والثقافية وقارئ PDF',
      icon: BookOpen,
      color: 'from-[#142850] via-[#1b3a4b] to-[#006466]',
      iconColor: 'text-[#D4AF37]',
      badge: 'مكتبة PDF',
    },
  ];

  return (
    <div className="min-h-full bg-[#F5F7FA] dark:bg-[#0c1322] text-[#1B2A4A] dark:text-white text-right pb-10" dir="rtl">
      {/* Top Bar Header with Center Logo */}
      <header className="sticky top-0 z-20 bg-[#1B2A4A] text-white px-4 py-3 shadow-lg border-b border-[#D4AF37]/20">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* User Profile avatar (clicking opens Profile screen, where the ONLY logout is located) */}
          <button
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-2 text-right p-1.5 rounded-2xl hover:bg-white/10 transition-colors"
          >
            <div className="relative w-10 h-10 rounded-full ring-2 ring-[#D4AF37]/60 overflow-hidden bg-slate-200">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </div>
            <div className="hidden sm:block text-right">
              <h4 className="text-xs font-bold leading-tight truncate max-w-[110px]">{currentUser.fullName}</h4>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#D4AF37] font-semibold block">
                  {currentUser.role === 'main_admin' ? 'المدير العام' : currentUser.role === 'sub_admin' ? 'أدمن فرع' : 'منتسب'}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-white font-mono">
                  {currentUser.role === 'main_admin'
                    ? (activeBranch === 'all' ? 'كافة الفروع' : activeBranch === 'basra' ? 'البصرة' : 'النجف')
                    : (currentUser.branchId === 'najaf' ? 'النجف' : 'البصرة')}
                </span>
              </div>
            </div>
          </button>

          {/* Center Logo in Top Bar as required */}
          <div className="flex-1 flex justify-center">
            <CenterLogo size="sm" showSubtitle={false} />
          </div>

          {/* Controls: Alerts & Dark Mode Toggle */}
          <div className="flex items-center gap-1.5">
            {/* Mobile Push Notifications Manager (Admins Only) */}
            {canManageStaff && (
              <button
                type="button"
                onClick={() => setIsPushManagerOpen(true)}
                className="relative w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-emerald-400 cursor-pointer"
                title="إدارة إشعارات شاشة الموبايل وقفل الشاشة (FCM / Push)"
              >
                <Smartphone className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </button>
            )}

            {/* Notification Center Bell */}
            <button
              onClick={() => setIsNotifModalOpen(true)}
              className="relative w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-[#D4AF37]"
              title={canManageStaff ? 'مركز التنبيهات والإشعارات وأرشيف 5 سنوات' : 'مركز الإشعارات والتكليفات'}
            >
              <Bell className="w-4 h-4" />
              {totalBadgeCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-[#1B2A4A]">
                  {totalBadgeCount}
                </span>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-amber-300"
              title="تبديل النمط المظلم / الفاتح"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto p-4 space-y-5">
        {/* Multi-Branch Architecture System Bar */}
        <BranchSelectorBar />

        {/* Welcome & Role Card */}
        <div className="p-4 rounded-3xl bg-white dark:bg-[#152033] border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">مرحباً بك مجدداً</span>
            <h2 className="text-base font-black text-[#1B2A4A] dark:text-white mt-0.5">
              {currentUser.fullName}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {currentUser.designation}
            </p>
          </div>

          <button
            onClick={() => onNavigate('profile')}
            className="px-3 py-1.5 rounded-xl bg-[#1B2A4A]/10 dark:bg-slate-800 text-[#1B2A4A] dark:text-[#D4AF37] hover:bg-[#1B2A4A]/20 text-xs font-bold transition-colors flex items-center gap-1 border border-[#1B2A4A]/10 dark:border-slate-700"
          >
            <User className="w-3.5 h-3.5" />
            <span>الملف والصلاحيات</span>
          </button>
        </div>

        {/* Dynamic Admin-Only Directory Card (Visible ONLY to Main Admin & Sub-Admins, completely hidden from staff) */}
        {canManageStaff && (
          <div
            onClick={() => onNavigate('staff_directory')}
            className="p-4 rounded-3xl bg-gradient-to-l from-[#1B2A4A] via-[#22355e] to-[#2e477d] text-white shadow-lg cursor-pointer hover:shadow-xl transition-all border-2 border-[#D4AF37]/50 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#D4AF37] text-[#1B2A4A] flex items-center justify-center shadow-md font-black">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">
                      قائمة المنتسبين / إدارة الحسابات
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#D4AF37] text-[#1B2A4A] text-[10px] font-black">
                      خاص بالإدارة
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-200/90 block">
                    {isMainAdmin ? 'صلاحية سيادية للمدير العام' : 'صلاحية إدارية للأدمن الفرعي'}
                  </span>
                </div>
              </div>

              <div className="w-7 h-7 rounded-xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                <ArrowUpLeft className="w-4 h-4 text-[#D4AF37] transform transition-transform group-hover:-translate-x-1" />
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed mt-1">
              لوحة الإدارة الحصرية لعرض كافة حسابات المركز، وتعديل بيانات المنتسبين وأرقام هوياتهم، وضبط الرموز السرية مباشرة.
            </p>

            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-[#D4AF37] font-bold">
              <span className="flex items-center gap-1.5">
                <UserCog className="w-3.5 h-3.5" />
                <span>فتح دليل الحسابات وتعديل الاعتمادات</span>
              </span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-md text-white">
                دخول اللوحة ←
              </span>
            </div>
          </div>
        )}

        {/* Dynamic Admin-Only Purchases & Printing Card (Visible ONLY to Main Admin & Sub-Admins, completely hidden from staff) */}
        {canManageStaff && (
          <div
            onClick={() => onNavigate('purchases')}
            className="p-4 rounded-3xl bg-gradient-to-l from-[#1B2A4A] via-[#24375f] to-[#1f483c] text-white shadow-lg cursor-pointer hover:shadow-xl transition-all border-2 border-[#D4AF37]/50 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#D4AF37] text-[#1B2A4A] flex items-center justify-center shadow-md font-black">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">
                      سجل المشتريات والطباعة
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#D4AF37] text-[#1B2A4A] text-[10px] font-black">
                      خاص بالإدارة
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-200/90 block">
                    {isMainAdmin ? 'توثيق مركزي شامل لكافة الفروع' : 'إدارة مشتريات وتجهيزات الفرع'}
                  </span>
                </div>
              </div>

              <div className="w-7 h-7 rounded-xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                <ArrowUpLeft className="w-4 h-4 text-[#D4AF37] transform transition-transform group-hover:-translate-x-1" />
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed mt-1">
              متابعة نفقات التجهيز، وتوثيق مشتريات المواد والمعدات، وإصدار جداول الطباعة والتقارير المالية المعتمدة بضغطة زر.
            </p>

            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-[#D4AF37] font-bold">
              <span className="flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" />
                <span>فتح سجل المشتريات والطباعة</span>
              </span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-md text-white">
                دخول السجل ←
              </span>
            </div>
          </div>
        )}

        {/* 1-Year Institutional Data Retention & Archival Card (Visible ONLY to Admins, strictly hidden from normal staff) */}
        {canManageStaff && (
          <div
            onClick={() => onNavigate('retention_engine')}
            className="p-4 rounded-3xl bg-gradient-to-l from-[#1B2A4A] via-[#1f3156] to-[#283e6b] text-white shadow-md cursor-pointer hover:shadow-lg transition-all border border-[#D4AF37]/30 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                  <Database className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-amber-300">
                  نظام الأرشفة والتوثيق المؤسسي (سنة واحدة)
                </span>
              </div>

              {retentionAlerts.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse">
                  {retentionAlerts.length} تنبيه أرشفة سنوية
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                  أرشفة سنوية (سنة واحدة)
                </span>
              )}
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">
              {retentionAlerts.length > 0
                ? `يوجد ${retentionAlerts.length} سجل قارب على استيفاء مدة الحفظ السنوية المحددة (سنة واحدة - 365 يوماً). اضغط للاطلاع على تنبيهات التقادم وإدارتها.`
                : 'كافة سجلات الحضور والقرارات والمهام خاضعة للأرشفة السنوية (سنة واحدة فقط - 365 يوماً) مع تنبيهات استباقية للمدراء عند اقتراب انتهاء المدة.'}
            </p>

            <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-amber-200 font-bold">
              <span>دخول مركز تحكم الأرشفة والتقارير السنوية</span>
              <ArrowUpLeft className="w-3.5 h-3.5 transform transition-transform group-hover:-translate-x-1" />
            </div>
          </div>
        )}

        {/* External Push Notification & Lockscreen Alert Card (Visible ONLY to Admins) */}
        {canManageStaff && (
          <div
            onClick={() => setIsPushManagerOpen(true)}
            className="p-3.5 rounded-3xl bg-gradient-to-r from-[#111c31] via-[#1B2A4A] to-[#14233c] text-white border border-[#D4AF37]/40 shadow-sm cursor-pointer hover:border-[#D4AF37] transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#ba9629] text-[#1B2A4A] flex items-center justify-center shadow-md font-black shrink-0">
                <Smartphone className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-white">إشعارات شاشة الموبايل وقفل الشاشة</h4>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black border border-emerald-500/30">
                    FCM / Push
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  بث فوري على شاشة القفل عند تسجيل حضور أو انصراف الكوادر بالفروع
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-xl bg-white/10 text-[#D4AF37] text-[10px] font-black border border-[#D4AF37]/30 shrink-0">
              إدارة الأجهزة ←
            </span>
          </div>
        )}

        {/* Section Title */}
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400">
            أقسام المنظومة الإدارية (تفتح شاشة كاملة)
          </h3>
          <span className="text-[10px] text-[#D4AF37] font-semibold">7 أقسام رئيسية</span>
        </div>

        {/* MAIN NAVIGATION GRID (Opening new full-screen views upon clicking, not expanding inline) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="relative text-right p-4 rounded-3xl bg-white dark:bg-[#152033] border border-slate-100 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-[#D4AF37]/50 transition-all duration-200 group cursor-pointer flex flex-col justify-between min-h-[110px]"
              >
                <div className="flex items-start justify-between w-full">
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md`}
                  >
                    <Icon className={`w-6 h-6 ${item.iconColor}`} />
                  </div>

                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700">
                    {item.badge}
                  </span>
                </div>

                <div className="mt-3">
                  <h4 className="text-sm font-black text-[#1B2A4A] dark:text-white group-hover:text-[#D4AF37] transition-colors flex items-center justify-between">
                    <span>{item.title}</span>
                    <ArrowUpLeft className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#D4AF37] transition-all transform group-hover:-translate-x-1" />
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {item.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Footer Notice */}
        <div className="pt-2 text-center text-[11px] text-slate-400 dark:text-slate-500 space-y-1">
          <p>مركز الفضيل بن يسار البصري الثقافي - محافظة البصرة</p>
          <p className="text-[10px]">
            للخروج من الحساب يرجى التوجه إلى شاشة الملف الشخصي
          </p>
        </div>
      </main>

      {/* Notification Center Modal (Admin-Exclusive Archive Alerts & General Notifications) */}
      <NotificationCenterModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        onNavigateToModule={(screen) => onNavigate(screen as ActiveScreen)}
      />

      {/* External Push Notification & Lockscreen Device Manager Modal */}
      <PushNotificationManagerModal
        isOpen={isPushManagerOpen}
        onClose={() => setIsPushManagerOpen(false)}
        onOpenAttendance={() => onNavigate('attendance')}
      />
    </div>
  );
};
