import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService, formatAttendanceStatus } from '../../services/storageService';
import { AttendanceRecord, BranchId } from '../../types';
import {
  Code,
  CheckCircle2,
  AlertCircle,
  X,
  FileJson,
  Upload,
  Play,
  Copy,
  Clock,
  Calendar,
  Building2,
} from 'lucide-react';

interface AttendanceJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordProcessed?: (record: AttendanceRecord) => void;
}

const SAMPLE_PAYLOAD = `{
  "id": "101",
  "date": "2026-09-22",
  "status": "present",
  "checkIn": "08:00",
  "checkOut": "16:00"
}`;

export const AttendanceJsonModal: React.FC<AttendanceJsonModalProps> = ({
  isOpen,
  onClose,
  onRecordProcessed,
}) => {
  const { effectiveBranch, availableBranches } = useAuth();
  const [jsonText, setJsonText] = useState<string>(SAMPLE_PAYLOAD);
  const [targetBranch, setTargetBranch] = useState<BranchId>(effectiveBranch);
  const [result, setResult] = useState<{
    success: boolean;
    record?: AttendanceRecord;
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleProcess = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.date) {
        setResult({
          success: false,
          message: 'خطأ: حقل التاريخ (date) مطلوب في حمولة JSON',
        });
        return;
      }
      if (!parsed.status) {
        setResult({
          success: false,
          message: 'خطأ: حقل الحالة (status) مطلوب (الحالات: present | absent | leave)',
        });
        return;
      }

      const res = storageService.processAttendancePayload({
        ...parsed,
        branchId: targetBranch,
      });

      setResult(res);
      if (res.success && res.record && onRecordProcessed) {
        onRecordProcessed(res.record);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setResult({
        success: false,
        message: `خطأ في صياغة JSON: ${msg}`,
      });
    }
  };

  const handleLoadSample = (type: 'present' | 'absent' | 'leave') => {
    const sample = {
      id: type === 'present' ? '101' : `att_${Date.now().toString().slice(-4)}`,
      date: '2026-09-22',
      status: type,
      checkIn: type === 'absent' ? undefined : '08:00',
      checkOut: type === 'absent' ? undefined : '16:00',
    };
    setJsonText(JSON.stringify(sample, null, 2));
  };

  const copySample = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-right" dir="rtl">
      <div className="bg-white dark:bg-[#152033] rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-[#1B2A4A] text-white flex items-center justify-between border-b border-[#D4AF37]/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center">
              <FileJson className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black flex items-center gap-1.5">
                <span>معالجة بيانات الحضور بتنسيق JSON</span>
                <span className="px-1.5 py-0.2 rounded bg-[#D4AF37] text-[#1B2A4A] text-[9px] font-black">
                  معتمد
                </span>
              </h3>
              <p className="text-[10px] text-slate-300">
                مطابق للمعيار المعتمد: 'present' (حاضر)، 'absent' (غائب)، 'leave' (إجازة)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {/* Quick preset chips */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              قوالب سريعة جاهزة:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleLoadSample('present')}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 transition-colors"
              >
                سجل #101 (حاضر 08:00 - 16:00)
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('absent')}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/20 transition-colors"
              >
                غائب (absent)
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('leave')}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 transition-colors"
              >
                إجازة (leave)
              </button>
            </div>
          </div>

          {/* Branch Target for Attendance Record */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                تعيين فرع التوثيق:
              </span>
            </div>
            <div className="flex items-center gap-2">
              {availableBranches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setTargetBranch(b.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    targetBranch === b.id
                      ? 'bg-[#1B2A4A] text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          {/* JSON Textarea with Code Box Styling */}
          <div className="relative">
            <div className="flex items-center justify-between px-3 py-1.5 rounded-t-xl bg-slate-800 text-slate-300 text-[11px] font-mono">
              <span className="flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-[#D4AF37]" />
                payload.json
              </span>
              <button
                type="button"
                onClick={copySample}
                className="hover:text-white flex items-center gap-1 text-[10px]"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
              </button>
            </div>
            <textarea
              dir="ltr"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={9}
              className="w-full p-3 rounded-b-xl font-mono text-xs bg-slate-950 text-emerald-400 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
              placeholder="ضع كود الـ JSON هنا..."
            />
          </div>

          {/* Feedback & Result Card */}
          {result && (
            <div
              className={`p-3 rounded-2xl text-xs font-bold flex items-start gap-2.5 border ${
                result.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <div className="space-y-1">
                <p>{result.message}</p>
                {result.record && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 flex flex-wrap gap-2 pt-1">
                    <span className="bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded">
                      رقم السجل: #{result.record.id}
                    </span>
                    <span className="bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded">
                      التاريخ: {result.record.date}
                    </span>
                    <span className="bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded">
                      الحالة:{' '}
                      {formatAttendanceStatus(result.record.status).label}
                    </span>
                    {result.record.checkIn && (
                      <span className="bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded">
                        دخول: {result.record.checkIn}
                      </span>
                    )}
                    {result.record.checkOut && (
                      <span className="bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded">
                        خروج: {result.record.checkOut}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            إغلاق
          </button>
          <button
            type="button"
            onClick={handleProcess}
            className="px-5 py-2 rounded-xl text-xs font-black bg-[#1B2A4A] text-[#D4AF37] hover:bg-[#253966] shadow-md transition-all flex items-center gap-1.5 cursor-pointer border border-[#D4AF37]/30"
          >
            <Play className="w-3.5 h-3.5" />
            <span>معالجة وتثبيت السجل</span>
          </button>
        </div>
      </div>
    </div>
  );
};
