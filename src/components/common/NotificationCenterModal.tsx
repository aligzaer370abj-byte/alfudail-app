import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { AppNotification, RetentionAlert } from '../../types';
import { AdminArchiveFileModal } from '../modules/AdminArchiveFileModal';
import {
  Bell,
  ShieldAlert,
  Clock,
  CheckCircle2,
  X,
  AlertTriangle,
  ArrowRight,
  FileText,
  Calendar,
  Layers,
  ChevronLeft,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToModule?: (screen: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigateToModule,
}) => {
  const { currentUser, canManageStaff } = useAuth();

  const [alerts, setAlerts] = useState<RetentionAlert[]>(storageService.getRetentionAlerts());
  const [notifications, setNotifications] = useState<AppNotification[]>(
    currentUser ? storageService.getUserNotifications(currentUser.id) : []
  );

  // Active Tab for Admins: 'retention_alerts' | 'general_notifs'
  // Normal staff only have 'general_notifs'
  const [activeTab, setActiveTab] = useState<'retention_alerts' | 'general_notifs'>(
    canManageStaff && alerts.length > 0 ? 'retention_alerts' : 'general_notifs'
  );

  // Selected file for Admin Archive File Modal
  const [selectedAlertForAction, setSelectedAlertForAction] = useState<RetentionAlert | null>(null);

  if (!isOpen || !currentUser) return null;

  const refreshData = () => {
    setAlerts(storageService.getRetentionAlerts());
    if (currentUser) {
      setNotifications(storageService.getUserNotifications(currentUser.id));
    }
  };

  const handleAlertTap = (alert: RetentionAlert) => {
    // Specification: "When an expiration notification appears for an Admin, tapping it opens a dedicated Admin Archive Management screen."
    setSelectedAlertForAction(alert);
  };

  const handleMarkAsRead = (notifId: string) => {
    storageService.markNotificationAsRead(notifId);
    refreshData();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div
          className="relative w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white dark:bg-[#152033] shadow-2xl ring-1 ring-black/10 text-right"
          dir="rtl"
        >
          {/* Header Ribbon */}
          <div className="bg-gradient-to-l from-[#1B2A4A] via-[#243760] to-[#2c4375] p-4 text-white shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">مركز الإشعارات والتنبيهات</h3>
                <p className="text-[11px] text-slate-300">
                  {canManageStaff
                    ? 'إشعارات الإدارة العامة وتنبيهات محرك الأرشفة 5 سنوات'
                    : 'التكليفات والمهام الشخصية وقرارات المركز'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ADMIN-EXCLUSIVE TABS (Normal Staff do NOT see expiration alerts tab) */}
          {canManageStaff && (
            <div className="p-2 px-4 bg-slate-50 dark:bg-[#111a2b] border-b border-slate-200 dark:border-slate-800 shrink-0 flex gap-2 text-xs font-bold">
              <button
                onClick={() => setActiveTab('retention_alerts')}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'retention_alerts'
                    ? 'bg-[#1B2A4A] dark:bg-[#D4AF37] text-white dark:text-[#1B2A4A] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>تنبيهات انتهاء الأرشيف (5 سنوات)</span>
                {alerts.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-black mr-1">
                    {alerts.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('general_notifs')}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'general_notifs'
                    ? 'bg-[#1B2A4A] dark:bg-[#D4AF37] text-white dark:text-[#1B2A4A] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>الإشعارات العامة</span>
                {notifications.filter((n) => !n.isRead).length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-500 text-white text-[10px] font-black mr-1">
                    {notifications.filter((n) => !n.isRead).length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* List Content Body */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
            {/* 1. ADMIN EXCLUSIVE: RETENTION & EXPIRATION ALERTS */}
            {canManageStaff && activeTab === 'retention_alerts' && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">إشعارات حصرية للمدير العام والمدراء الفرعيين:</span>
                    تنبهك المنظومة بالملفات والسجلات التي اقتربت من بلوغ دورة الحفظ السنوية المعتمدة (سنة واحدة - 365 يوماً). اضغط على أي تنبيه لفتح لوحة التحكم بالملف (تعديل، تصدير، طباعة، تمديد، أو حذف).
                  </div>
                </div>

                {alerts.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      كافة السجلات محفوظة بنجاح
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      لا توجد حالياً أي ملفات أو جداول تقترب من حد الأرشفة السنوية (سنة واحدة) في الأرشيف
                    </p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => handleAlertTap(alert)}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50/70 dark:hover:bg-amber-950/30 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-300 transition-all cursor-pointer space-y-2 group shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              alert.severity === 'critical'
                                ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                                : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[#1B2A4A] dark:text-white group-hover:text-[#2E8B57] transition-colors leading-snug">
                              {alert.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-mono">
                              تاريخ الانتهاء المحدد: {alert.expirationDate}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                            alert.severity === 'critical'
                              ? 'bg-red-500 text-white animate-pulse'
                              : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/30'
                          }`}
                        >
                          متبقي {alert.daysRemaining} يوم
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <span>التصنيف:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {alert.recordType === 'attendance'
                              ? 'حضور وانصراف'
                              : alert.recordType === 'documents'
                              ? 'كتاب رسمي'
                              : alert.recordType === 'warnings'
                              ? 'عقوبة / إنذار'
                              : alert.recordType === 'leaves'
                              ? 'طلب إجازة'
                              : 'تقييم أداء'}
                          </span>
                        </span>

                        <span className="text-[#2E8B57] dark:text-teal-400 font-black flex items-center gap-1 group-hover:underline">
                          <span>إدارة الملف وتصديره</span>
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 2. GENERAL NOTIFICATIONS (Visible to Staff and Admins) */}
            {(!canManageStaff || activeTab === 'general_notifs') && (
              <div className="space-y-2.5">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-2">
                    <Bell className="w-10 h-10 text-slate-400 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      لا توجد إشعارات جديدة
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      سيتم إشعارك فور ورود أي تكليفات أو قرارات رسمية
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleMarkAsRead(notif.id)}
                      className={`p-3.5 rounded-2xl border transition-all text-xs space-y-1.5 ${
                        notif.isRead
                          ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-80'
                          : 'bg-white dark:bg-slate-800 border-[#D4AF37]/40 shadow-xs ring-1 ring-[#D4AF37]/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1B2A4A] dark:text-white flex items-center gap-1.5">
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                          )}
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(notif.createdAt).toLocaleDateString('ar-IQ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="text-[10px] text-slate-400 pt-1 flex justify-between items-center">
                        <span>المرسل: {notif.senderName}</span>
                        {!notif.isRead && (
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            تحديد كمقروء
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer with Deep Link to Full Retention Engine (For Admins only) */}
          <div className="p-3.5 px-5 bg-slate-100 dark:bg-[#111a2b] border-t border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between text-xs">
            {canManageStaff && onNavigateToModule ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToModule('retention_engine');
                }}
                className="text-[#1B2A4A] dark:text-[#D4AF37] font-bold hover:underline flex items-center gap-1"
              >
                <span>الانتقال لمحرك الأرشفة الكامل (5 سنوات)</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-[11px] text-slate-400">مركز الفضيل بن يسار البصري الثقافي</span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 text-xs transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>

      {/* Admin Archive File Controller Modal */}
      {selectedAlertForAction && (
        <AdminArchiveFileModal
          isOpen={!!selectedAlertForAction}
          onClose={() => {
            setSelectedAlertForAction(null);
            refreshData();
          }}
          recordType={selectedAlertForAction.recordType}
          recordId={selectedAlertForAction.recordId}
          onRecordUpdated={refreshData}
        />
      )}
    </>
  );
};
