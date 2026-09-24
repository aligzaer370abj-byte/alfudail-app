import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { RetentionAlert, DataRetentionStats } from '../../types';
import { AdminArchiveFileModal } from './AdminArchiveFileModal';
import {
  ShieldAlert,
  Database,
  ArrowRight,
  Download,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Lock,
  Clock,
  Archive,
  RefreshCw,
  Edit3,
  Printer,
  ChevronLeft,
} from 'lucide-react';

interface DataRetentionModuleProps {
  onBack: () => void;
}

export const DataRetentionModule: React.FC<DataRetentionModuleProps> = ({ onBack }) => {
  const { isMainAdmin, isSubAdmin, canManageStaff } = useAuth();
  const [alerts, setAlerts] = useState<RetentionAlert[]>(storageService.getRetentionAlerts());
  const [stats, setStats] = useState<DataRetentionStats>(storageService.getRetentionStats());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedAlertForAction, setSelectedAlertForAction] = useState<RetentionAlert | null>(null);

  const refreshData = () => {
    setAlerts(storageService.getRetentionAlerts());
    setStats(storageService.getRetentionStats());
  };

  const handleDismissAlert = (alertId: string) => {
    storageService.dismissAlert(alertId);
    refreshData();
    setFeedback('تمت معالجة التنبيه بنجاح وأرشفته');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleExportArchive = () => {
    const jsonStr = storageService.exportRetentionArchiveJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alfudail_retention_archive_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setFeedback('تم تصدير نسخة الأرشيف السنوية الشاملة (سنة واحدة) بنجاح بصيغة JSON المعتمدة');
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="min-h-full bg-[#F5F7FA] dark:bg-[#0c1322] text-[#1B2A4A] dark:text-white text-right pb-10" dir="rtl">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-[#1B2A4A] text-white p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
          <div>
            <h2 className="text-base font-bold">محرك أرشفة البيانات (أرشفة سنوية - سنة واحدة فقط)</h2>
            <p className="text-[11px] text-[#D4AF37]">
              إدارة السجلات الحصرية والتحكم الكامل بالملفات المقتربة من سقف الحفظ السنوي (365 يوماً)
            </p>
          </div>
        </div>

        {canManageStaff && (
          <button
            onClick={handleExportArchive}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-amber-400 text-[#1B2A4A] text-xs font-black transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير الأرشيف السنوي</span>
          </button>
        )}
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {feedback && (
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* 1-Year Mandate Banner */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1B2A4A] via-[#16233d] to-[#0c1322] text-white space-y-3 shadow-lg border border-[#D4AF37]/30">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-black border border-[#D4AF37]/40 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              لائحة الحفظ السنوي المعتمدة
            </span>
            <span className="text-xs text-slate-300 font-mono">1-Year Retention Policy</span>
          </div>

          <h3 className="text-sm font-black text-white leading-relaxed">
            محرك التوثيق والأرشفة السنوية لمركز الفضيل بن يسار البصري الثقافي
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed">
            وفق التحديث الإداري الأخير، تحتفظ المنظومة بجميع سجلات الحضور والانصراف، والأوامر الإدارية، واستمارات التقييم، والإنذارات، وسجلات المشتريات لمدة <strong className="text-[#D4AF37]">سنة واحدة فقط (365 يوماً)</strong> من تاريخ الإنشاء، مع إطلاق تنبيهات دورية للمدراء عند الاقتراب من نهاية السنة.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1 text-center font-mono">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="block text-lg font-black text-[#D4AF37]">{stats.totalPreservedRecords}</span>
              <span className="text-[10px] text-slate-300 font-sans">إجمالي السجلات المؤرشفة</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="block text-lg font-black text-emerald-400">سنة واحدة</span>
              <span className="text-[10px] text-slate-300 font-sans">فترة التقادم السنوية (365 يوماً)</span>
            </div>
          </div>
        </div>

        {/* Admin-Exclusive Alerts Section */}
        {canManageStaff && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-[#1B2A4A] dark:text-white flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#D4AF37]" />
                <span>إشعارات انتهاء الصلاحية السنوية (حصرية للمدراء):</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {alerts.length} سجلات مقتربة من نهاية السنة
              </span>
            </div>

            {alerts.length === 0 ? (
              <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  كافة السجلات في نطاق فترة الصلاحية النظامية السنوية ولا توجد وثائق قاربت على الانتهاء
                </p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-3xl bg-white dark:bg-[#152033] border border-amber-200 dark:border-amber-900/60 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#1B2A4A] dark:text-white leading-snug">
                          {alert.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          تاريخ انتهاء السنة: {alert.expirationDate}
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-700 dark:text-red-400 text-[10px] font-black shrink-0">
                      متبقي {alert.daysRemaining} يوم فقط
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[11px] text-amber-900 dark:text-amber-200">
                    تنبيه آلي مبرمج: هذا السجل اقترب من استيفاء مدة الحفظ السنوية المعتمدة (سنة واحدة - 365 يوماً). اضغط أدناه لإدارة الملف بالكامل.
                  </div>

                  {/* Admin Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      onClick={() => setSelectedAlertForAction(alert)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-[#1B2A4A] text-[#D4AF37] hover:bg-[#233761] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>التحكم بالملف (تعديل / تصدير / تمديد / حذف)</span>
                    </button>
                    <button
                      onClick={() => handleDismissAlert(alert.id)}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition-colors"
                    >
                      تجاهل
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 1-Year Retention Timetable Details */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#152033] border border-slate-100 dark:border-slate-800 shadow-xs space-y-3 text-xs">
          <h4 className="font-black text-[#1B2A4A] dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#D4AF37]" />
            جدول أمد الحفظ السنوي وفق اللائحة الإدارية:
          </h4>

          <div className="space-y-2 text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span>سجلات الحضور والانصراف والبصمة</span>
              <span className="font-bold text-[#1B2A4A] dark:text-white">سنة واحدة فقط (365 يوماً)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span>الأوامر الإدارية والكتب والتكليفات</span>
              <span className="font-bold text-[#1B2A4A] dark:text-white">سنة واحدة فقط (365 يوماً)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span>استمارات تقييم أداء المنتسبين</span>
              <span className="font-bold text-[#1B2A4A] dark:text-white">سنة واحدة فقط (365 يوماً)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span>الإنذارات والقرارات الانضباطية</span>
              <span className="font-bold text-[#1B2A4A] dark:text-white">سنة واحدة فقط (365 يوماً)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span>سجلات فواتير المشتروات والتجهيزات</span>
              <span className="font-bold text-[#1B2A4A] dark:text-white">سنة واحدة فقط (365 يوماً)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span>تنبيهات استباقية للإدارة</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">قبل 90 يوماً و 30 يوماً</span>
            </div>
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
    </div>
  );
};
