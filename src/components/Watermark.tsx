'use client';

import React, { useState } from 'react';
import { Phone, MessageCircle, Code2, X } from 'lucide-react';

export const Watermark: React.FC = () => {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <aside
      aria-label="Developer Watermark"
      className="fixed bottom-3 right-3 z-40 no-print font-sans pointer-events-auto"
    >
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="px-2.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-900 text-amber-300 text-[11px] font-bold shadow-lg border border-amber-400/30 backdrop-blur-md flex items-center gap-1.5 transition-all hover:scale-105"
          title="Designed & Developed by Shiyas Ahmad (7012587705)"
        >
          <Code2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Shiyas Ahmad</span>
        </button>
      ) : (
        <div className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-slate-950/90 text-white border border-white/15 shadow-xl backdrop-blur-md text-[11px] font-medium transition-all hover:border-amber-400/50">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Dev by</span>
            <span className="font-bold text-white tracking-wide">Shiyas Ahmad</span>
          </div>

          <span className="text-slate-600">•</span>

          <a
            href="tel:+917012587705"
            className="flex items-center gap-1 text-amber-300 hover:text-amber-200 font-bold transition-colors"
            title="Call Shiyas Ahmad: 7012587705"
          >
            <Phone className="w-3 h-3 text-amber-400" />
            <span>7012587705</span>
          </a>

          <a
            href="https://wa.me/917012587705"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 transition-colors"
            title="Chat on WhatsApp: 7012587705"
          >
            <MessageCircle className="w-3 h-3" />
          </a>

          <button
            onClick={() => setIsMinimized(true)}
            className="p-0.5 rounded-full text-slate-500 hover:text-slate-300 transition-colors ml-0.5"
            title="Minimize Watermark"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </aside>
  );
};
