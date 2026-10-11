'use client';

import React, { useState } from 'react';
import { SchoolLogo } from './SchoolLogo';
import { Play, LayoutGrid, FileText, Volume2, VolumeX, QrCode, Shield, Menu, X } from 'lucide-react';

interface HeaderProps {
  currentMode: 'hero' | 'presentation' | 'gallery' | 'inspection' | 'admin';
  setMode: (mode: 'hero' | 'presentation' | 'gallery' | 'inspection' | 'admin') => void;
  isAudioPlaying: boolean;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  onOpenQR: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  setMode,
  isAudioPlaying,
  isAudioMuted,
  onToggleAudio,
  onOpenQR,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#060e1a]/90 backdrop-blur-md border-b border-[#1e3557]/60 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & School Title */}
          <button 
            onClick={() => setMode('hero')} 
            className="text-left focus:outline-none hover:opacity-95 transition-opacity"
          >
            <SchoolLogo size="md" />
          </button>

          {/* Desktop Navigation Modes */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-[#0b172a] rounded-xl border border-[#1e3557]">
            <button
              onClick={() => setMode('presentation')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentMode === 'presentation'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b89028] text-slate-950 shadow-md shadow-[#d4af37]/20 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Presentation
            </button>

            <button
              onClick={() => setMode('gallery')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentMode === 'gallery'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b89028] text-slate-950 shadow-md shadow-[#d4af37]/20 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Gallery
            </button>

            <button
              onClick={() => setMode('inspection')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentMode === 'inspection'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b89028] text-slate-950 shadow-md shadow-[#d4af37]/20 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Inspection Dossier
            </button>
          </nav>

          {/* Action Buttons: Audio, QR, Admin */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Background Music Toggle */}
            <button
              onClick={onToggleAudio}
              title={isAudioPlaying ? (isAudioMuted ? 'Unmute Ceremonial Music' : 'Mute Music') : 'Play Ceremonial Music'}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                isAudioPlaying && !isAudioMuted
                  ? 'bg-amber-500/15 border-amber-400/40 text-amber-200'
                  : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              {isAudioPlaying && !isAudioMuted ? (
                <>
                  <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="hidden lg:inline text-[11px]">Music Playing</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span className="hidden lg:inline text-[11px]">{isAudioPlaying ? 'Muted' : 'Music Off'}</span>
                </>
              )}
            </button>

            {/* QR Code Booklet Button */}
            <button
              onClick={onOpenQR}
              title="Inspection Booklet QR Code"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#10213b] hover:bg-[#162c4e] text-amber-200 border border-[#d4af37]/30 transition-all"
            >
              <QrCode className="w-4 h-4 text-[#d4af37]" />
              <span className="hidden xl:inline">Booklet QR</span>
            </button>

            {/* Admin CMS Access */}
            <button
              onClick={() => setMode('admin')}
              title="Administrator CMS"
              className={`p-2 rounded-lg text-xs border transition-all ${
                currentMode === 'admin'
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={onToggleAudio}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-amber-300"
            >
              {isAudioPlaying && !isAudioMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden px-4 pt-2 pb-4 bg-[#0b172a] border-b border-slate-800 space-y-2">
          <button
            onClick={() => { setMode('presentation'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold ${
              currentMode === 'presentation' ? 'bg-[#d4af37] text-slate-950 font-bold' : 'text-slate-200 bg-slate-800/40'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            Cinematic Presentation
          </button>
          <button
            onClick={() => { setMode('gallery'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold ${
              currentMode === 'gallery' ? 'bg-[#d4af37] text-slate-950 font-bold' : 'text-slate-200 bg-slate-800/40'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Achievement Gallery (All 28)
          </button>
          <button
            onClick={() => { setMode('inspection'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold ${
              currentMode === 'inspection' ? 'bg-[#d4af37] text-slate-950 font-bold' : 'text-slate-200 bg-slate-800/40'
            }`}
          >
            <FileText className="w-4 h-4" />
            Inspection Reading Dossier
          </button>
          <div className="pt-2 flex gap-2">
            <button
              onClick={() => { onOpenQR(); setMobileMenuOpen(false); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-800 text-amber-200 text-xs font-medium border border-amber-400/30"
            >
              <QrCode className="w-4 h-4" /> Booklet QR
            </button>
            <button
              onClick={() => { setMode('admin'); setMobileMenuOpen(false); }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700"
            >
              <Shield className="w-4 h-4" /> Admin CMS
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
