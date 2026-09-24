import React, { useState } from 'react';
import { Clock, Calendar, Check, X, User, AlertCircle, Edit3 } from 'lucide-react';

export interface AttendanceEditRecord {
  id?: string;
  date: string;
  status: 'present' | 'absent' | 'leave' | 'حاضر' | 'غائب' | 'مجاز' | string;
  checkIn?: string | null;
  checkOut?: string | null;
  userId?: string;
  userName?: string;
  branchId?: string;
  notes?: string;
}

export interface EditAttendanceModalProps {
  record: AttendanceEditRecord;
  onSave: (updatedData: AttendanceEditRecord) => void;
  onClose: () => void;
}

const normalizeInitialStatus = (st?: string): 'present' | 'absent' | 'leave' => {
  if (!st) return 'present';
  const lower = st.toLowerCase().trim();
  if (lower === 'present' || lower === 'حاضر' || lower === 'متأخر') return 'present';
  if (lower === 'absent' || lower === 'غائب') return 'absent';
  if (lower === 'leave' || lower === 'مجاز' || lower === 'إجازة') return 'leave';
  return 'present';
};

export const EditAttendanceModal: React.FC<EditAttendanceModalProps> = ({ record, onSave, onClose }) => {
  const [status, setStatus] = useState<'present' | 'absent' | 'leave'>(() =>
    normalizeInitialStatus(record.status)
  );
  const [checkIn, setCheckIn] = useState<string>(record.checkIn || '08:00');
  const [checkOut, setCheckOut] = useState<string>(record.checkOut || '16:00');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // إذا كانت الحالة غائب أو إجازة، نصفر الأوقات تلقائياً
    const updatedData: AttendanceEditRecord = {
      ...record,
      status,
      checkIn: status === 'present' ? checkIn : null,
      checkOut: status === 'present' ? checkOut : null,
    };

    onSave(updatedData);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-[#152033] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right">
        {/* Header */}
        <div className="p-4 bg-[#1B2A4A] text-white flex items-center justify-between border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black leading-tight">تعديل سجل يوم: {record.date}</h3>
              {record.userName && (
                <p className="text-[11px] text-[#D4AF37] flex items-center gap-1 mt-0.5">
                  <User className="w-3 h-3" />
                  <span>المنتسب: {record.userName}</span>
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Status Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              حالة الدوام (Status Selector):
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'present' | 'absent' | 'leave')}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-[#1B2A4A] dark:text-white focus:ring-2 focus:ring-[#D4AF37] outline-none"
            >
              <option value="present">حاضر (Present)</option>
              <option value="absent">غائب (Absent)</option>
              <option value="leave">إجازة (Leave)</option>
            </select>
          </div>

          {/* Time Pickers: "وقت الحضور" (Check-In) and "وقت الانصراف" (Check-Out) - visible only when status is 'present' */}
          {status === 'present' ? (
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>وقت الحضور (Check-In):</span>
                </label>
                <input
                  type="time"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
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
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-center text-[#1B2A4A] dark:text-white focus:ring-2 focus:ring-[#D4AF37] outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                {status === 'absent'
                  ? 'تم تحديد الحالة كـ (غائب). سيتم تصفير أوقات الحضور والانصراف تلقائياً واحتساب ساعات العمل 0.'
                  : 'تم تحديد الحالة كـ (إجازة). سيتم تصفير أوقات الحضور والانصراف تلقائياً وإعفاء المنتسب من الخصم.'}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#1B2A4A] hover:bg-[#253966] text-[#D4AF37] text-xs font-black shadow-md flex items-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>حفظ التغييرات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAttendanceModal;
