import React, { useState } from 'react';
import { Smartphone, Monitor, Wifi, Battery, Signal } from 'lucide-react';

interface MobileContainerProps {
  children: React.ReactNode;
  isDarkMode: boolean;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ children, isDarkMode }) => {
  const [viewMode, setViewMode] = useState<'mobile' | 'responsive'>('mobile');

  const currentTime = new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-slate-200 dark:bg-slate-950 flex flex-col items-center justify-start p-0 sm:p-4 transition-colors duration-300">
      {/* Top Floating Viewport Control Bar */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-md mb-2 px-3 py-1.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border border-slate-200 dark:border-slate-800 text-xs">
        <span className="font-bold text-[#1B2A4A] dark:text-slate-300 text-[11px] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          معاينة تطبيق الجوال (Cross-Platform Mobile Frame)
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('mobile')}
            className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 text-[11px] transition-colors ${
              viewMode === 'mobile'
                ? 'bg-[#1B2A4A] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>شاشة هاتف</span>
          </button>
          <button
            onClick={() => setViewMode('responsive')}
            className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 text-[11px] transition-colors ${
              viewMode === 'responsive'
                ? 'bg-[#1B2A4A] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>عرض متجاوب</span>
          </button>
        </div>
      </div>

      {/* Main Device Housing */}
      <div
        className={`w-full transition-all duration-300 ${
          viewMode === 'mobile'
            ? 'sm:max-w-[420px] sm:my-2 sm:rounded-[44px] sm:ring-12 sm:ring-slate-800 sm:dark:ring-slate-900 sm:shadow-2xl overflow-hidden border-0 sm:border-4 sm:border-slate-700 relative'
            : 'max-w-xl my-0 sm:my-2 sm:rounded-3xl shadow-xl overflow-hidden'
        } bg-[#F5F7FA] dark:bg-[#0c1322] min-h-screen sm:min-h-[860px] flex flex-col`}
      >
        {/* Mobile Phone Simulated Notch & Status Bar (visible in mobile preview) */}
        {viewMode === 'mobile' && (
          <div className="hidden sm:flex items-center justify-between px-7 pt-3 pb-1 text-slate-800 dark:text-slate-200 text-xs font-bold select-none bg-[#1B2A4A] text-white">
            <span dir="ltr" className="text-[11px] font-mono">
              {currentTime}
            </span>

            {/* Dynamic Island / Speaker Pill */}
            <div className="w-24 h-4 rounded-full bg-black/60 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700"></span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        )}

        {/* Inner App Content */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {children}
        </div>

        {/* Mobile Bottom Home Indicator */}
        {viewMode === 'mobile' && (
          <div className="hidden sm:flex justify-center pb-2 pt-1 bg-[#F5F7FA] dark:bg-[#0c1322]">
            <div className="w-32 h-1 bg-slate-400/40 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
};
