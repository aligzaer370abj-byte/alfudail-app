import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, AlertCircle, X, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MASTER_ADMIN_CREDENTIALS } from '../../data/seedData';

interface MasterAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MasterAdminModal: React.FC<MasterAdminModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { loginWithMasterAdmin } = useAuth();
  const [email, setEmail] = useState(MASTER_ADMIN_CREDENTIALS.email);
  const [passcode, setPasscode] = useState(MASTER_ADMIN_CREDENTIALS.passcode);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    setTimeout(() => {
      const res = loginWithMasterAdmin(email, passcode);
      setIsSubmitting(false);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res.message);
      }
    }, 400);
  };

  const fillMasterCredentials = () => {
    setEmail(MASTER_ADMIN_CREDENTIALS.email);
    setPasscode(MASTER_ADMIN_CREDENTIALS.passcode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#0f172a] text-white shadow-2xl ring-1 ring-amber-500/30 text-right"
        dir="rtl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="bg-gradient-to-r from-[#1B2A4A] via-[#1e293b] to-[#0f172a] p-6 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-[#D4AF37]">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-300">منفذ الطوارئ والتحكم السيادي (Master Admin)</h3>
              <p className="text-xs text-slate-400">بوابة الدخول السري الخاصة بالإدارة العليا</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              البريد الإلكتروني السري للمدير العام:
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
                className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-amber-500 font-mono"
                required
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              رمز المرور السيادي الفائق (Super Passcode):
            </label>
            <div className="relative">
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                dir="ltr"
                className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-amber-500 font-mono"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex items-center justify-between">
            <span>تم تجهيز بيانات الاعتماد السيادية للاختبار الفوري</span>
            <button
              type="button"
              onClick={fillMasterCredentials}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold"
            >
              <KeyRound className="w-3 h-3" />
              تعبئة تلقائية
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#0f172a] font-black text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'جارِ التحقق الأمني...' : 'تأكيد الدخول السيادي (Super Admin)'}
          </button>
        </form>
      </div>
    </div>
  );
};
