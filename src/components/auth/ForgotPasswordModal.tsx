import React from 'react';
import { KeyRound, X } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white dark:bg-[#152033] shadow-2xl ring-1 ring-black/10 text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-l from-[#1B2A4A] to-[#253966] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">استعادة كلمة المرور</h3>
              <p className="text-xs text-slate-300">إجراءات الأمان المؤسسية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-center">
          <div className="p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30">
            <p className="text-base font-bold text-[#1B2A4A] dark:text-amber-200 leading-relaxed py-2">
              يرجى التوجه إلى مدير المركز لإعادة تعيين كلمة المرور
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              حفاظاً على سرية وخصوصية سجلات المركز، يتم تعيين الرمز السري حصراً من خلال إدارة المركز.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#1B2A4A] hover:bg-[#253966] text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
          >
            حسناً، فهمت
          </button>
        </div>
      </div>
    </div>
  );
};
