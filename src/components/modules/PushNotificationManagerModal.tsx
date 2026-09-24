import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { pushNotificationService } from '../../services/pushNotificationService';
import { storageService } from '../../services/storageService';
import { DevicePushToken, PushNotificationLog } from '../../types';
import {
  Bell,
  Smartphone,
  Shield,
  CheckCircle2,
  X,
  Send,
  RefreshCw,
  Copy,
  Lock,
  Layers,
  Radio,
  Clock,
  History,
  Sliders,
  Check,
  AlertCircle,
  ExternalLink,
  Laptop,
} from 'lucide-react';

interface PushNotificationManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAttendance?: () => void;
}

export const PushNotificationManagerModal: React.FC<PushNotificationManagerModalProps> = ({
  isOpen,
  onClose,
  onOpenAttendance,
}) => {
  const { currentUser } = useAuth();
  const [tokens, setTokens] = useState<DevicePushToken[]>([]);
  const [logs, setLogs] = useState<PushNotificationLog[]>([]);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'devices' | 'logs' | 'settings'>('devices');

  const permStatus = pushNotificationService.getPermissionStatus();

  const loadData = () => {
    setTokens(storageService.getDevicePushTokens());
    setLogs(storageService.getPushNotificationLogs());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleSendTestPush = async () => {
    setIsSendingTest(true);
    setFeedback(null);
    try {
      const res = await pushNotificationService.sendTestLockscreenPush(currentUser);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message,
        });
        loadData();
      } else {
        setFeedback({
          type: 'error',
          message: res.message,
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'حدث خطأ أثناء إرسال الإشعار التجريبي.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleRequestPermission = async () => {
    const res = await pushNotificationService.requestPermission(currentUser);
    if (res.status === 'granted') {
      setFeedback({
        type: 'success',
        message: 'تم تفعيل إشعارات شاشة القفل بنجاح وتسجيل رمز الجهاز.',
      });
      loadData();
    } else {
      setFeedback({
        type: 'error',
        message: res.message,
      });
    }
  };

  const handleToggleLockScreen = (token: DevicePushToken) => {
    const newStatus = !token.isLockScreenEnabled;
    storageService.updateDevicePushTokenStatus(token.id, newStatus, token.permissionStatus);
    loadData();
  };

  const handleCopy = (tokenStr: string, id: string) => {
    navigator.clipboard.writeText(tokenStr);
    setCopiedTokenId(id);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  const handleClearLogs = () => {
    storageService.clearPushNotificationLogs();
    setLogs([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#152033] rounded-3xl shadow-2xl border border-[#D4AF37]/30 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#1B2A4A] via-[#24375d] to-[#1B2A4A] text-white p-5 shrink-0 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B89628] text-[#1B2A4A] flex items-center justify-center font-black shadow-md">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black tracking-wide text-white">
                    إدارة إشعارات شاشة الموبايل (FCM / Push)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black">
                    Live Lockscreen
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  بث تنبيهات الحضور والانصراف الفورية على شاشات هواتف المدراء المقفلة
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10 text-xs font-bold">
            <button
              onClick={() => setActiveTab('devices')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'devices'
                  ? 'bg-[#D4AF37] text-[#1B2A4A] shadow-md font-black'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>الأجهزة المسجلة ({tokens.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'logs'
                  ? 'bg-[#D4AF37] text-[#1B2A4A] shadow-md font-black'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>سجل الإرسال والبث ({logs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-[#D4AF37] text-[#1B2A4A] shadow-md font-black'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>صيغة الرسالة والإعدادات</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all shadow-sm ${
                feedback.type === 'success'
                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Top Quick Action Bar: Test Push Button */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1B2A4A] text-white border border-[#D4AF37]/30 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center shrink-0">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-black text-white">اختبار إشعار شاشة القفل الفوري</h4>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    جاهز للبث
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  يرسل إشعاراً حقيقياً يهتز ويرن على هاتفك لاختبار صيغة وصول التنبيه خارج التطبيق
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {permStatus !== 'granted' && (
                <button
                  onClick={handleRequestPermission}
                  className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-sm"
                >
                  منح الإذن
                </button>
              )}
              <button
                onClick={handleSendTestPush}
                disabled={isSendingTest}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#e2bd44] active:scale-95 text-[#1B2A4A] text-xs font-black transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingTest ? 'جاري الإرسال...' : 'إرسال إشعار تجريبي الآن'}</span>
              </button>
            </div>
          </div>

          {/* TAB 1: REGISTERED DEVICES */}
          {activeTab === 'devices' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">
                  الأجهزة المسجلة للمدراء (قاعدة بيانات FCM Tokens):
                </h4>
                <button
                  onClick={loadData}
                  className="text-[11px] font-bold text-slate-500 hover:text-[#1B2A4A] dark:hover:text-[#D4AF37] flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>تحديث القائمة</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {tokens.map((token) => {
                  const isCurrent = token.userId === currentUser.id;
                  const isMainAdmin = token.userRole === 'main_admin';

                  return (
                    <div
                      key={token.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-[#D4AF37]/40 ring-1 ring-[#D4AF37]/30'
                          : 'bg-white dark:bg-[#1a2942]/60 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-black shadow-xs ${
                              token.platform === 'android'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : token.platform === 'ios'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {token.platform === 'desktop' ? (
                              <Laptop className="w-5 h-5" />
                            ) : (
                              <Smartphone className="w-5 h-5" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-black text-slate-800 dark:text-white">
                                {token.userName}
                              </h5>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded bg-[#1B2A4A] text-[#D4AF37] text-[9px] font-black">
                                  جهازك الحالي
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  isMainAdmin
                                    ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20'
                                    : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                                }`}
                              >
                                {isMainAdmin
                                  ? 'مدير عام (كافة الفروع)'
                                  : token.branchId === 'najaf'
                                  ? 'مدير فرع النجف'
                                  : 'مدير فرع البصرة'}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {token.deviceModel || 'هاتف ذكي بنظام أندرويد'} • مزود الخدمة: {token.provider.toUpperCase()}
                            </p>

                            {/* Token Hash & Copy */}
                            <div className="flex items-center gap-2 mt-2">
                              <div
                                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 font-mono text-[10px] text-slate-600 dark:text-slate-400 truncate max-w-[240px] sm:max-w-xs"
                                dir="ltr"
                              >
                                {token.token}
                              </div>
                              <button
                                onClick={() => handleCopy(token.token, token.id)}
                                className="p-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors"
                                title="نسخ الرمز"
                              >
                                {copiedTokenId === token.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Status Switch */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <button
                            onClick={() => handleToggleLockScreen(token)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 ${
                              token.isLockScreenEnabled
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            <Lock className="w-3 h-3" />
                            <span>{token.isLockScreenEnabled ? 'شاشة القفل مفعلة' : 'متوقف'}</span>
                          </button>
                          <span className="text-[9px] text-slate-400 font-mono">
                            نشط: {token.lastActiveAt ? new Date(token.lastActiveAt).toLocaleDateString('ar-IQ') : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: DISPATCH LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">
                  سجل الإشعارات الخارجية المبثوثة للهواتف:
                </h4>
                {logs.length > 0 && (
                  <button
                    onClick={handleClearLogs}
                    className="text-[11px] font-bold text-red-500 hover:underline"
                  >
                    مسح السجل
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-xs text-slate-400">
                  لم يتم بث أي إشعارات خارجية بعد. قم بتسجيل حضور أو اضغط "إرسال إشعار تجريبي".
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-[#1a2942]/60 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            log.eventType === 'check_in'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : log.eventType === 'check_out'
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-blue-500/10 text-blue-600'
                          }`}
                        >
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-800 dark:text-slate-200">
                              {log.title}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500">
                              {log.eventType === 'check_in'
                                ? 'تسجيل حضور'
                                : log.eventType === 'check_out'
                                ? 'تسجيل خروج'
                                : 'اختبار يدوي'}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 font-bold mt-1 text-[11px]">
                            {log.body}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 font-medium">
                            <span>الفرع: {log.branchName}</span>
                            <span>•</span>
                            <span>الهدف: {log.targetedUserNames.join(', ')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left shrink-0">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/20">
                          تم التسليم للهاتف
                        </span>
                        <span className="block text-[9px] text-slate-400 font-mono mt-1" dir="ltr">
                          {log.timeStr}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SETTINGS & TRIGGER RULES */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1a2942]/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-black text-[#1B2A4A] dark:text-[#D4AF37] flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>قواعد التوجيه والتوزيع (Trigger Rules):</span>
                </h4>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc pr-4 leading-relaxed">
                  <li>
                    <strong>المدير العام (سماحة الشيخ د. علي الفضلي):</strong> يستلم إشعاراً فورياً على شاشة هاتفه المقفلة عند تسجيل أي منتسب في فرعي البصرة والنجف.
                  </li>
                  <li>
                    <strong>مدير فرع البصرة (أ. حيدر جاسم):</strong> يستلم إشعارات منتسبي فرع البصرة حصراً.
                  </li>
                  <li>
                    <strong>مدير فرع النجف الأشرف (أ. فاضل جواد):</strong> يستلم إشعارات منتسبي فرع النجف حصراً.
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1a2942]/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-black text-[#1B2A4A] dark:text-[#D4AF37]">
                  حمولة وصيغة الإشعار المعتمدة (Notification Payload):
                </h4>
                <div className="space-y-2 font-mono text-[11px] bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 font-bold">العنوان (Title): </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">"تسجيل حضور/خروج جديد"</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold">المحتوى (Body): </span>
                    <span className="font-bold text-[#1B2A4A] dark:text-[#D4AF37]">
                      "قام [اسم المنتسب] بتسجيل [الحضور/الخروج] في فرع [البصرة/النجف] - الساعة [الوقت]"
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold">الإجراء (Action): </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      الضغط على الإشعار يفتح التطبيق مباشرة على صفحة سجل الحضور (Attendance Log).
                    </span>
                  </div>
                </div>
              </div>

              {onOpenAttendance && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAttendance();
                  }}
                  className="w-full py-3 rounded-2xl bg-[#1B2A4A] text-white font-black text-xs flex items-center justify-center gap-2 hover:bg-[#233860] transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-[#D4AF37]" />
                  <span>الانتقال المباشر إلى سجل الحضور والانصراف</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-[#111a2b] border-t border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>خادم الـ Service Worker متصل ويعمل في الخلفية</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
