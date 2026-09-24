import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { pushNotificationService } from '../../services/pushNotificationService';
import {
  Bell,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  Volume2,
  Lock,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';

interface PushNotificationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
}

export const PushNotificationPromptModal: React.FC<PushNotificationPromptModalProps> = ({
  isOpen,
  onClose,
  onPermissionGranted,
}) => {
  const { currentUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen || !currentUser) return null;

  // Only admins need this prompt
  if (currentUser.role !== 'main_admin' && currentUser.role !== 'sub_admin') {
    return null;
  }

  const handleRequest = async () => {
    setIsProcessing(true);
    setFeedback(null);

    try {
      const res = await pushNotificationService.requestPermission(currentUser);

      if (res.status === 'granted') {
        setFeedback({
          type: 'success',
          message: 'تم تفعيل إشعارات شاشة القفل ورمز جهازك بنجاح! تم إرسال إشعار ترحيبي لجهازك.',
        });
        setTimeout(() => {
          onPermissionGranted?.();
          onClose();
        }, 2200);
      } else if (res.status === 'denied') {
        setFeedback({
          type: 'error',
          message: 'تم رفض الإذن من إعدادات المتصفح. يمكنك تفعيله من إعدادات الموقع أعلى شريط العنوان.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'تعذر الحصول على إذن الإشعارات.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'حدث خطأ غير متوقع أثناء تفعيل الإشعارات.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const branchName =
    currentUser.branchId === 'najaf'
      ? 'فرع النجف الأشرف'
      : currentUser.role === 'main_admin'
      ? 'كافة فروع المركز (البصرة والنجف)'
      : 'فرع البصرة';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#152033] rounded-3xl shadow-2xl border border-[#D4AF37]/30 overflow-hidden">
        {/* Top Decorative Header */}
        <div className="bg-gradient-to-r from-[#1B2A4A] via-[#24375d] to-[#1B2A4A] text-white p-6 relative">
          <div className="absolute top-3 left-3">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B89628] text-[#1B2A4A] flex items-center justify-center shadow-lg font-bold">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-black border border-[#D4AF37]/30 mb-1">
                تحديث أمني وإداري (FCM / Web Push)
              </span>
              <h3 className="text-lg font-black tracking-wide text-white">
                تفعيل إشعارات شاشة الموبايل الخارجية
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-300 pr-1 leading-relaxed">
            مرحباً <span className="text-[#D4AF37] font-bold">{currentUser.fullName}</span>، بصفتك مسؤولاً إدارياً، يمكنك تفعيل التنبيهات الفورية على هاتفك المحمول.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Feature Highlights Card */}
          <div className="space-y-3 bg-slate-50 dark:bg-[#1a2942]/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <h4 className="font-black text-slate-800 dark:text-slate-200">
                  ظهور فوري على شاشة القفل (Lock Screen)
                </h4>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  تظهر الإشعارات على شاشة هاتفك المقفلة مع الاهتزاز والنغمة حتى لو كان التطبيق مغلقاً.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <h4 className="font-black text-slate-800 dark:text-slate-200">
                  إشعار فوري عند كل تسجيل حضور أو انصراف
                </h4>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  يتلقى هاتفك رسالة بالصيغة: <br />
                  <span className="font-mono text-[11px] font-bold text-[#1B2A4A] dark:text-[#D4AF37] bg-white dark:bg-slate-900 px-2 py-0.5 rounded inline-block mt-1">
                    "قام [اسم المنتسب] بتسجيل [الحضور/الخروج] في فرع [{branchName}] - الساعة [الوقت]"
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <h4 className="font-black text-slate-800 dark:text-slate-200">
                  ربط موثق وآمن لرمز جهازك (Device Token)
                </h4>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  تسجيل الرمز في قاعدة البيانات حصراً للمدير العام ومدراء الفروع المعنية لمنع التداخل.
                </p>
              </div>
            </div>
          </div>

          {/* Feedback Alert */}
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all ${
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleRequest}
              disabled={isProcessing}
              className="w-full sm:flex-1 py-3.5 px-4 rounded-2xl bg-[#1B2A4A] hover:bg-[#233860] active:scale-95 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md border border-[#D4AF37]/50 disabled:opacity-50 cursor-pointer"
            >
              <Bell className="w-4 h-4 text-[#D4AF37]" />
              <span>{isProcessing ? 'جاري طلب الإذن وتسجيل الرمز...' : 'السماح بالإشعارات وتفعيل رمز الجهاز'}</span>
            </button>

            <button
              onClick={onClose}
              disabled={isProcessing}
              className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              تخطي الآن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
