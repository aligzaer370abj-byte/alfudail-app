import React, { useState } from 'react';
import { Fingerprint, KeyRound, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface BiometricModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BiometricModal: React.FC<BiometricModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { loginWithBiometrics, loginWithPin } = useAuth();
  const [mode, setMode] = useState<'fingerprint' | 'pin'>('fingerprint');
  const [pin, setPin] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleFingerprintScan = () => {
    setIsScanning(true);
    setErrorMsg('');
    setSuccessMsg('');

    setTimeout(() => {
      setIsScanning(false);
      const res = loginWithBiometrics();
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 800);
      } else {
        setErrorMsg(res.message);
      }
    }, 1200);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setErrorMsg('رمز PIN يتكون من 4 أرقام على الأقل');
      return;
    }
    const res = loginWithPin(pin);
    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white dark:bg-[#152033] shadow-2xl ring-1 ring-black/10 text-right"
        dir="rtl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#1B2A4A]/10 dark:bg-[#1B2A4A] flex items-center justify-center text-[#1B2A4A] dark:text-[#D4AF37] mb-4">
            {mode === 'fingerprint' ? (
              <Fingerprint className="w-9 h-9" />
            ) : (
              <KeyRound className="w-8 h-8" />
            )}
          </div>

          <h3 className="text-lg font-bold text-[#1B2A4A] dark:text-white">
            {mode === 'fingerprint' ? 'التحقق بالبصمة الحيوية' : 'تسجيل الدخول برمز PIN'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تسجيل دخول سريع وآمن للجلسات المسجلة سابقاً
          </p>

          {errorMsg && (
            <div className="mt-4 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mt-4 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'fingerprint' ? (
            <div className="mt-6 flex flex-col items-center">
              <button
                type="button"
                onClick={handleFingerprintScan}
                disabled={isScanning}
                className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isScanning
                    ? 'bg-[#2E8B57] text-white shadow-lg ring-8 ring-[#2E8B57]/30 scale-105'
                    : 'bg-[#1B2A4A] text-[#D4AF37] hover:bg-[#253a66] shadow-md hover:scale-105'
                }`}
              >
                <Fingerprint className={`w-14 h-14 ${isScanning ? 'animate-pulse' : ''}`} />
                {isScanning && (
                  <span className="absolute inset-0 rounded-full border-2 border-white animate-ping opacity-60"></span>
                )}
              </button>

              <span className="text-xs text-slate-600 dark:text-slate-300 mt-4 font-medium">
                {isScanning ? 'جارِ فحص البصمة ومطابقة الهوية...' : 'المس مستشعر البصمة للمتابعة'}
              </span>

              <button
                type="button"
                onClick={() => setMode('pin')}
                className="mt-5 text-xs text-[#1B2A4A] dark:text-[#D4AF37] font-semibold hover:underline"
              >
                أو استخدم رمز PIN الخاص بك
              </button>
            </div>
          ) : (
            <form onSubmit={handlePinSubmit} className="mt-6 space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full text-center text-2xl tracking-[0.5em] py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#1B2A4A]"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#1B2A4A] text-white text-sm font-bold shadow-md hover:bg-[#253a66]"
              >
                تأكيد الرمز
              </button>

              <button
                type="button"
                onClick={() => setMode('fingerprint')}
                className="text-xs text-[#1B2A4A] dark:text-[#D4AF37] font-semibold hover:underline block mx-auto"
              >
                العودة إلى البصمة الحيوية
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
