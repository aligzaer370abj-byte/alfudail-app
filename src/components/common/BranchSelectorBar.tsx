import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BranchFilter } from '../../types';
import { Building2, MapPin, Check, SlidersHorizontal, ShieldCheck } from 'lucide-react';

interface BranchSelectorBarProps {
  compact?: boolean;
}

export const BranchSelectorBar: React.FC<BranchSelectorBarProps> = ({ compact = false }) => {
  const {
    currentUser,
    activeBranch,
    switchBranch,
    isSuperAdmin,
    branchInfo,
    availableBranches,
  } = useAuth();

  if (!currentUser) return null;

  // Super Admin toggle between: All branches, Basra branch, Najaf branch
  if (isSuperAdmin) {
    return (
      <div className="bg-white dark:bg-[#152033] rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-[#1B2A4A] dark:text-white">
                  النظام متعدد الفروع (المدير العام الأعلى)
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#D4AF37] text-[#1B2A4A]">
                  صلاحية سيادية
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                التحكم بالرؤية الميدانية للفرعين والتقارير الموحدة
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="font-bold">
              {activeBranch === 'all'
                ? 'عرض شامل (فرع البصرة + فرع النجف)'
                : activeBranch === 'basra'
                ? 'فرع البصرة (مركز المدينة)'
                : 'فرع النجف الأشرف (الحنانة)'}
            </span>
          </div>
        </div>

        {/* 3-Way Branch Switcher Pills */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => switchBranch('all')}
            className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeBranch === 'all'
                ? 'bg-[#1B2A4A] text-white shadow-sm ring-1 ring-[#D4AF37]/40'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>كافة الفروع</span>
            {activeBranch === 'all' && <Check className="w-3 h-3 text-[#D4AF37]" />}
          </button>

          <button
            type="button"
            onClick={() => switchBranch('basra')}
            className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeBranch === 'basra'
                ? 'bg-[#1B2A4A] text-white shadow-sm ring-1 ring-[#D4AF37]/40'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>فرع البصرة</span>
            {activeBranch === 'basra' && <Check className="w-3 h-3 text-[#D4AF37]" />}
          </button>

          <button
            type="button"
            onClick={() => switchBranch('najaf')}
            className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeBranch === 'najaf'
                ? 'bg-[#2E8B57] text-white shadow-sm ring-1 ring-emerald-300/40'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
            <span>فرع النجف</span>
            {activeBranch === 'najaf' && <Check className="w-3 h-3 text-white" />}
          </button>
        </div>
      </div>
    );
  }

  // Branch Admins and Regular Staff view their locked assigned branch
  const assignedBranch =
    availableBranches.find((b) => b.id === currentUser.branchId) || branchInfo;

  return (
    <div className="bg-white dark:bg-[#152033] rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs font-black text-xs"
          style={{ backgroundColor: assignedBranch.id === 'najaf' ? '#2E8B57' : '#1B2A4A' }}
        >
          <Building2 className="w-4 h-4 text-[#D4AF37]" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-[#1B2A4A] dark:text-white">
              {assignedBranch.name} ({assignedBranch.city})
            </span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {currentUser.role === 'sub_admin' ? 'إدارة الفرع المستقلة' : 'نطاق العمل المحدد'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate max-w-[260px]">
            {assignedBranch.address}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>عزل نطاقي آمن</span>
      </div>
    </div>
  );
};
