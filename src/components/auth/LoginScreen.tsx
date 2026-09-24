import React, { useState } from 'react';
import { CenterLogo } from '../common/CenterLogo';
import { SEED_USERS } from '../../data/seedData';
import { useAuth } from '../../context/AuthContext';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { BiometricModal } from './BiometricModal';
import { MasterAdminModal } from './MasterAdminModal';
import {
  CreditCard,
  Lock,
  Fingerprint,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginWithNationalId, hasSavedSession } = useAuth();

  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isBiometricOpen, setIsBiometricOpen] = useState(false);
  const [isMasterAdminOpen, setIsMasterAdminOpen] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    setTimeout(() => {
      const res = loginWithNationalId(nationalId, password);
      setIsSubmitting(false);
      if (!res.success) {
        setErrorMsg(res.message);
      }
    }, 400);
  };

  const selectTestAccount = (userNationalId: string, defaultPw: string = '123456') => {
    setNationalId(userNationalId);
    setPassword(defaultPw);
    setErrorMsg('');
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-4 sm:p-6 bg-[#F5F7FA] dark:bg-[#0d1424] text-right" dir="rtl">
      {/* Top Bar with Master Admin secret entrance */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>منظومة الحماية والأمان الموحدة</span>
        </div>

        <button
          type="button"
          onClick={() => setIsMasterAdminOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1B2A4A]/10 dark:bg-slate-800 text-[#1B2A4A] dark:text-amber-300 hover:bg-[#1B2A4A]/20 text-xs font-bold transition-all border border-[#1B2A4A]/10 dark:border-amber-400/20 cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>المنفذ السيادي للمشرف العام</span>
        </button>
      </div>

      {/* Main Minimalist Authentication Container */}
      <div className="max-w-md w-full mx-auto my-auto space-y-6">
        {/* Prominent Center Logo */}
        <div className="py-2 text-center">
          <CenterLogo size="xl" showSubtitle={true} />
        </div>

        {/* Clean Login Form Card */}
        <div className="bg-white dark:bg-[#152033] rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-black text-[#1B2A4A] dark:text-white">تسجيل الدخول للمنتسبين</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              يرجى إدخال رقم البطاقة الوطنية والرمز السري الخاص بك
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-semibold">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* National ID Field */}
            <div>
              <label className="block text-xs font-bold text-[#1B2A4A] dark:text-slate-200 mb-1.5">
                رقم البطاقة الوطنية:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="مثال: 198510203040"
                  className="w-full px-4 py-3.5 pr-11 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[#1B2A4A] dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1B2A4A] dark:focus:ring-[#D4AF37] transition-all font-mono text-left placeholder:text-right"
                  required
                />
                <CreditCard className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#1B2A4A] dark:text-slate-200">
                  الرمز السري:
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs text-[#2E8B57] dark:text-teal-400 hover:text-[#1B2A4A] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  نسيت كلمة المرور؟
                </button>
              </div>

              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 pr-11 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[#1B2A4A] dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1B2A4A] dark:focus:ring-[#D4AF37] transition-all"
                  required
                />
                <Lock className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-[#1B2A4A] hover:bg-[#233863] active:scale-[0.99] text-white font-black text-sm shadow-lg shadow-[#1B2A4A]/25 transition-all cursor-pointer mt-2"
            >
              {isSubmitting ? 'جارِ التحقق...' : 'تسجيل الدخول'}
            </button>
          </form>

          {/* Quick Biometrics / PIN Login Button for returning sessions */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setIsBiometricOpen(true)}
              className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-[#D4AF37] bg-slate-50/70 dark:bg-slate-800/50 text-[#1B2A4A] dark:text-slate-200 hover:text-[#D4AF37] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Fingerprint className="w-4 h-4 text-[#D4AF37]" />
              <span>تسجيل الدخول بالبصمة الحيوية / PIN {hasSavedSession ? '(جلسة محفوظة)' : ''}</span>
            </button>
          </div>

          {/* Quick Role Tester Switcher */}
          <div className="mt-4 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-2 text-center flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              اختبار سريع للحسابات:
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => selectTestAccount(SEED_USERS[0].nationalId)}
                className="p-1.5 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 font-bold border border-amber-500/20 truncate cursor-pointer"
              >
                المدير العام
              </button>
              <button
                type="button"
                onClick={() => selectTestAccount(SEED_USERS[1].nationalId)}
                className="p-1.5 rounded-xl bg-blue-500/10 text-blue-800 dark:text-blue-300 hover:bg-blue-500/20 font-bold border border-blue-500/20 truncate cursor-pointer"
              >
                أدمن فرعي
              </button>
              <button
                type="button"
                onClick={() => selectTestAccount(SEED_USERS[2].nationalId)}
                className="p-1.5 rounded-xl bg-teal-500/10 text-teal-800 dark:text-teal-300 hover:bg-teal-500/20 font-bold border border-teal-500/20 truncate cursor-pointer"
              >
                منتسب
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <footer className="py-3 text-center text-[11px] text-slate-400 dark:text-slate-500">
        مركز الفضيل بن يسار البصري الثقافي © 2026 - نظام الإدارة الموحد
      </footer>

      {/* Modals */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />

      <BiometricModal
        isOpen={isBiometricOpen}
        onClose={() => setIsBiometricOpen(false)}
        onSuccess={() => setIsBiometricOpen(false)}
      />

      <MasterAdminModal
        isOpen={isMasterAdminOpen}
        onClose={() => setIsMasterAdminOpen(false)}
        onSuccess={() => setIsMasterAdminOpen(false)}
      />
    </div>
  );
};
