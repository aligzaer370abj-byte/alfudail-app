import React from 'react';

interface CenterLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const CenterLogo: React.FC<CenterLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { box: 'w-10 h-10', text: 'text-sm', sub: 'text-[10px]' };
      case 'lg':
        return { box: 'w-20 h-20', text: 'text-lg', sub: 'text-xs' };
      case 'xl':
        return { box: 'w-24 h-24', text: 'text-xl', sub: 'text-sm' };
      case 'md':
      default:
        return { box: 'w-14 h-14', text: 'text-base', sub: 'text-xs' };
    }
  };

  const dim = getDimensions();

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {/* Emblem SVG with Islamic Octagon & Golden Crescent/Calligraphy Motif */}
      <div
        className={`${dim.box} relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B2A4A] via-[#15223c] to-[#0d1627] p-2 shadow-lg ring-2 ring-[#D4AF37]/50 transition-transform duration-300 hover:scale-105`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_2px_8px_rgba(212,175,55,0.4)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Islamic Star Pattern Outer Ring */}
          <polygon
            points="50,5 62,18 79,15 82,32 97,39 90,56 99,71 84,79 80,96 63,92 50,100 37,92 20,96 16,79 1,71 10,56 3,39 18,32 21,15 38,18"
            stroke="#D4AF37"
            strokeWidth="2.5"
            fill="none"
            opacity="0.85"
          />

          {/* Inner Golden Circle */}
          <circle cx="50" cy="50" r="34" stroke="#D4AF37" strokeWidth="2" strokeDasharray="3 2" />

          {/* Book / Mihrab / Lantern Calligraphic Symbol */}
          {/* Open Book Base (Cultural & Scholarly Heritage) */}
          <path
            d="M26 62 C 38 56, 46 62, 50 64 C 54 62, 62 56, 74 62 C 72 44, 60 40, 50 42 C 40 40, 28 44, 26 62 Z"
            fill="#D4AF37"
            opacity="0.95"
          />
          <path
            d="M50 42 L50 64"
            stroke="#1B2A4A"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Minaret / Dome Arch Top */}
          <path
            d="M40 38 C 40 28, 50 20, 50 20 C 50 20, 60 28, 60 38 Z"
            fill="#2E8B57"
            stroke="#D4AF37"
            strokeWidth="1.5"
          />

          {/* Lantern Light Star */}
          <circle cx="50" cy="29" r="2.5" fill="#FFF8DC" />
        </svg>

        {/* Subtle decorative gold badge corner */}
        <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-60"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D4AF37]"></span>
        </span>
      </div>

      <div className="mt-2 text-center">
        <h1 className={`font-bold tracking-tight text-[#1B2A4A] dark:text-slate-100 ${dim.text}`}>
          مركز الفضيل بن يسار البصري الثقافي
        </h1>
        {showSubtitle && (
          <p className={`text-[#D4AF37] font-medium tracking-wide mt-0.5 ${dim.sub}`}>
            المنظومة الإدارية والتوثيقية المتكاملة
          </p>
        )}
      </div>
    </div>
  );
};
