import React from 'react';

interface SchoolLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
}) => {
  const getDims = () => {
    switch (size) {
      case 'sm': return { width: 36, height: 36, titleSize: 'text-sm', subSize: 'text-[10px]' };
      case 'lg': return { width: 64, height: 64, titleSize: 'text-xl', subSize: 'text-xs' };
      case 'xl': return { width: 88, height: 88, titleSize: 'text-2xl', subSize: 'text-sm' };
      case 'md':
      default: return { width: 48, height: 48, titleSize: 'text-base', subSize: 'text-[11px]' };
    }
  };

  const dims = getDims();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official Emblem Icon */}
      <div 
        className="relative flex-shrink-0 rounded-full flex items-center justify-center border-2 border-[#d4af37] bg-white shadow-md shadow-black/40 overflow-hidden"
        style={{ width: dims.width, height: dims.height }}
      >
        <img
          src="/assets/school-logo.png"
          alt="Irshad English School Logo"
          className="w-full h-full object-contain rounded-full"
        />
      </div>

      {/* Typography */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className={`font-serif font-bold tracking-wider text-white text-xs sm:text-base uppercase truncate`}>
            Irshad English School
          </span>
          <span className="hidden xs:inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#d4af37]/20 text-[#f5e7a9] border border-[#d4af37]/40">
            CBSE 930636
          </span>
        </div>
        {showSubtitle && (
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="tracking-wide text-amber-200/90 font-medium text-[10px] sm:text-[11px] truncate">
              Melattur, Malappuram
            </span>
            <span className="hidden xs:inline text-slate-500">•</span>
            <span className="hidden xs:inline text-slate-400 font-normal italic text-[10px] sm:text-[11px] truncate">
              Light Upon Light
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
