'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AchievementRecord } from '../types/achievement';
import { 
  ChevronLeft, 
  ChevronRight, 
  Pause, 
  Play, 
  X, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Award, 
  Calendar, 
  MapPin, 
  Users, 
  Building,
  CheckCircle2,
  Trophy,
  FileText,
  Eye,
} from 'lucide-react';

interface PresentationModeProps {
  achievements: AchievementRecord[];
  initialIndex?: number;
  onExit: () => void;
  onOpenGalleryItem?: (item: AchievementRecord) => void;
  isAudioPlaying: boolean;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  achievements,
  initialIndex = 0,
  onExit,
  isAudioPlaying,
  isAudioMuted,
  onToggleAudio,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [slideDuration, setSlideDuration] = useState(8000); // 8s default
  const [isRepeat, setIsRepeat] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [mobileViewMode, setMobileViewMode] = useState<'split' | 'posterOnly'>('split');

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const currentItem = achievements[currentIndex] || achievements[0];

  // Update selected photo when slide changes
  useEffect(() => {
    setSelectedPhoto(currentItem.image);
    setProgress(0);
  }, [currentIndex, currentItem]);

  // Next Slide Handler
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev >= achievements.length - 1) {
        return isRepeat ? 0 : prev;
      }
      return prev + 1;
    });
    setProgress(0);
  }, [achievements.length, isRepeat]);

  // Prev Slide Handler
  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? achievements.length - 1 : prev - 1));
    setProgress(0);
  }, [achievements.length]);

  // Slideshow progress and auto-advance timer
  useEffect(() => {
    if (isPaused) return;

    const intervalStep = 100; // ms
    const increment = (intervalStep / slideDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNext();
          return 0;
        }
        return prev + increment;
      });
    }, intervalStep);

    return () => clearInterval(timer);
  }, [isPaused, slideDuration, goToNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goToNext();
      else if (e.key === 'ArrowLeft') goToPrev();
      else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      } else if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onExit]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Touch Swipe handlers for the poster stage
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = (touchStartY.current || 0) - e.changedTouches[0].clientY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX > 0) goToNext();
      else goToPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Current photo being viewed
  const activeImage = selectedPhoto || currentItem.image;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 h-[100dvh] w-full bg-[#f8fafc] text-slate-900 flex flex-col overflow-hidden select-none"
    >
      {/* Top Floating Control Bar */}
      <header className="relative z-40 flex items-center justify-between px-3 sm:px-6 py-2 sm:py-2.5 bg-white/95 border-b border-slate-200 shadow-xs flex-shrink-0">
        
        {/* Left: School Logo & Slide Counter */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 rounded-full bg-white p-0.5 border border-blue-200 overflow-hidden flex-shrink-0 shadow-xs flex items-center justify-center">
            <img src="/assets/school-logo.png" alt="Logo" className="w-full h-full object-contain rounded-full" />
          </div>
          <div className="px-2.5 sm:px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-[11px] sm:text-xs font-mono font-bold tracking-wider shadow-xs">
            {String(currentIndex + 1).padStart(2, '0')} / {String(achievements.length).padStart(2, '0')}
          </div>
          <span className="hidden lg:inline-block text-xs font-serif tracking-wide text-slate-600 font-semibold">
            Irshad English School • Digital Inspection Exhibition
          </span>
        </div>

        {/* Center: Slide Progress Bar */}
        <div className="flex-1 max-w-[140px] xs:max-w-xs sm:max-w-md mx-2 sm:mx-4">
          <div className="w-full bg-slate-200/90 rounded-full h-1.5 overflow-hidden border border-slate-300/60">
            <div 
              className={`h-full bg-gradient-to-r from-blue-600 to-[#0f2b5c] ${isReducedMotion ? '' : 'transition-all duration-100 ease-linear'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Right: Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile View Toggle: Dossier Details vs Full Poster */}
          <button
            onClick={() => setMobileViewMode(mobileViewMode === 'split' ? 'posterOnly' : 'split')}
            title={mobileViewMode === 'split' ? 'View Poster Fullscreen' : 'Show Full Achievement Details'}
            className="md:hidden px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-bold flex items-center gap-1 shadow-xs"
          >
            {mobileViewMode === 'split' ? (
              <>
                <Eye className="w-3.5 h-3.5 text-blue-700" />
                <span>Poster</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-blue-700" />
                <span>Details</span>
              </>
            )}
          </button>

          {/* Audio toggle */}
          <button
            onClick={onToggleAudio}
            title={isAudioPlaying && !isAudioMuted ? 'Mute Music' : 'Enable Ceremonial Music'}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-blue-900 border border-slate-200 shadow-xs"
          >
            {isAudioPlaying && !isAudioMuted ? <Volume2 className="w-4 h-4 text-blue-600 animate-pulse" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Pause / Resume */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume Presentation' : 'Pause Presentation'}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-xs"
          >
            {isPaused ? <Play className="w-4 h-4 fill-current text-blue-600" /> : <Pause className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Fullscreen (Desktop/Tablet) */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="hidden sm:flex p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-xs"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Exit Button */}
          <button
            onClick={onExit}
            title="Exit Presentation Mode"
            className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors shadow-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </header>

      {/* Main Content Arena: Responsive Split Layout */}
      <div className="relative flex-1 min-h-0 w-full flex flex-col md:flex-row overflow-hidden">
        
        {/* ========================================================== */}
        {/* LEFT COLUMN (ON DESKTOP) / TOP SECTION (ON MOBILE): POSTER */}
        {/* ========================================================== */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={`relative flex items-center justify-center overflow-hidden transition-all duration-300 bg-slate-100/60 ${
            mobileViewMode === 'posterOnly' 
              ? 'h-full w-full' 
              : 'h-[44dvh] xs:h-[46dvh] md:h-full md:w-[54%] lg:w-[56%] flex-shrink-0'
          }`}
        >
          {/* Ambient Blurred Background of the Active Poster */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
            <img
              key={`blur-${activeImage}`}
              src={activeImage}
              alt=""
              className="w-full h-full object-cover blur-3xl scale-125 opacity-25 transform-gpu transition-all duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]" />
          </div>

          {/* Previous Slide Button */}
          <button
            onClick={goToPrev}
            title="Previous Achievement"
            className="absolute left-2 sm:left-4 z-30 p-2.5 sm:p-3 rounded-full bg-white/95 hover:bg-white text-blue-950 border border-slate-200 shadow-xl backdrop-blur-md transition-transform hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Centered Poster Display - 100% Fit & Crisp White Border */}
          <div className="relative z-10 h-full w-full max-w-4xl flex items-center justify-center p-2 sm:p-4 min-h-0">
            <div className="relative h-full w-full max-h-full max-w-full flex items-center justify-center min-h-0">
              <img
                key={activeImage}
                src={activeImage}
                alt={currentItem.title}
                className={`max-h-full max-w-full w-auto h-auto object-contain rounded-xl shadow-2xl border border-slate-200/90 bg-white p-1 block select-none ${
                  isReducedMotion ? '' : 'transition-opacity duration-300 ease-in-out'
                }`}
              />

              {/* Verification Watermark */}
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-md border border-blue-200 text-[9px] sm:text-[10px] text-blue-900 font-mono tracking-wider font-bold shadow-md pointer-events-none">
                {currentItem.badge || 'VERIFIED RECORD'}
              </div>

              {/* Ceremony Photos switcher (if multiple photos exist) */}
              {currentItem.galleryImages && currentItem.galleryImages.length > 0 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-200 shadow-md z-20">
                  <button
                    onClick={() => setSelectedPhoto(currentItem.image)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      activeImage === currentItem.image ? 'bg-[#0f2b5c] text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Photo 1
                  </button>
                  {currentItem.galleryImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedPhoto(img)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        activeImage === img ? 'bg-[#0f2b5c] text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Photo {i + 2}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Next Slide Button */}
          <button
            onClick={goToNext}
            title="Next Achievement"
            className="absolute right-2 sm:right-4 z-30 p-2.5 sm:p-3 rounded-full bg-white/95 hover:bg-white text-blue-950 border border-slate-200 shadow-xl backdrop-blur-md transition-transform hover:scale-110 active:scale-95"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* ========================================================== */}
        {/* RIGHT COLUMN (DESKTOP) / BOTTOM SHEET (MOBILE): ALL DETAILS */}
        {/* ========================================================== */}
        <div 
          className={`flex-1 min-h-0 overflow-y-auto overscroll-contain bg-white border-t md:border-t-0 md:border-l border-slate-200 p-3.5 sm:p-6 lg:p-7 space-y-4 select-text transition-all ${
            mobileViewMode === 'posterOnly' ? 'hidden md:block' : 'block'
          }`}
          onMouseEnter={() => setIsPaused(true)}
          onTouchStart={() => setIsPaused(true)}
        >
          {/* Category & Badge Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs">
                {currentItem.category}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Authenticated</span>
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 font-semibold">
              Record #{String(currentItem.order).padStart(2, '0')}
            </span>
          </div>

          {/* Main Title & Malayalam Subtitle */}
          <div>
            <h1 className="text-base sm:text-xl lg:text-2xl font-serif font-black text-[#0f2b5c] leading-snug tracking-tight">
              {currentItem.title}
            </h1>
            {currentItem.malayalamTitle && (
              <p className="text-xs sm:text-sm text-[#1e40af] font-semibold mt-1">
                {currentItem.malayalamTitle}
              </p>
            )}
          </div>

          {/* Award / Honors Callout Card */}
          {currentItem.award && (
            <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200 shadow-xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5 text-amber-700">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 block">
                  Honor & Recognition
                </span>
                <span className="text-xs sm:text-sm font-bold text-amber-950 leading-snug block">
                  {currentItem.award}
                </span>
              </div>
            </div>
          )}

          {/* Metadata Grid (Event, Date, Location) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {currentItem.event && (
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/90 flex items-start gap-2">
                <Award className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase text-slate-500 block font-bold">Event / Exam</span>
                  <span className="text-slate-800 font-semibold leading-tight block">{currentItem.event}</span>
                </div>
              </div>
            )}

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/90 flex items-start gap-2">
              <Calendar className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase text-slate-500 block font-bold">Academic Period</span>
                <span className="text-slate-800 font-semibold leading-tight block">
                  {currentItem.academicYear} {currentItem.date ? `• ${currentItem.date}` : ''}
                </span>
              </div>
            </div>

            {currentItem.location && (
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/90 flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase text-slate-500 block font-bold">Location / Level</span>
                  <span className="text-slate-800 font-semibold leading-tight block">{currentItem.location}</span>
                </div>
              </div>
            )}

            {currentItem.organizer && (
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/90 flex items-start gap-2">
                <Building className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase text-slate-500 block font-bold">Organizer / Body</span>
                  <span className="text-slate-800 font-semibold leading-tight block">{currentItem.organizer}</span>
                </div>
              </div>
            )}
          </div>

          {/* Featured Student / Achiever Roster */}
          {(currentItem.featuredStudent || (currentItem.studentList && currentItem.studentList.length > 0)) && (
            <div className="space-y-2 p-3 rounded-xl bg-blue-50/50 border border-blue-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0f2b5c]">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Student Achievers & Honorees</span>
                {currentItem.studentClass && (
                  <span className="text-slate-500 font-normal">({currentItem.studentClass})</span>
                )}
              </div>

              {currentItem.featuredStudent && (
                <div className="text-xs sm:text-sm font-bold text-[#0f2b5c] bg-white p-2 rounded-lg border border-blue-200 shadow-2xs">
                  {currentItem.featuredStudent}
                </div>
              )}

              {/* Student Achievers Table / Chips */}
              {currentItem.studentList && currentItem.studentList.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {currentItem.studentList.map((stu, sIdx) => (
                    <div 
                      key={sIdx}
                      className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] flex items-center justify-between gap-1 shadow-2xs"
                    >
                      <span className="font-bold text-slate-800 truncate">{stu.name}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {stu.rank && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                            {stu.rank}
                          </span>
                        )}
                        {stu.score && (
                          <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 text-[10px] font-mono font-bold">
                            {stu.score}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Full Narrative Description */}
          <div className="space-y-1.5">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Full Narrative & Performance Record</span>
            </h2>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                {currentItem.description}
              </p>
            </div>
          </div>

          {/* Detailed Verification Notes */}
          {currentItem.detailedNotes && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 leading-normal flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-800 block">Inspection Note:</span>
                <span>{currentItem.detailedNotes}</span>
              </div>
            </div>
          )}

          {/* Highlight Statistics Cards */}
          {currentItem.highlightStats && currentItem.highlightStats.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                Verified Statistical Metrics
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {currentItem.highlightStats.map((stat, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-white border border-blue-100 text-center shadow-xs">
                    <span className="text-base sm:text-lg font-black text-[#0f2b5c] font-mono block leading-none">
                      {stat.value}
                    </span>
                    <span className="text-[10px] text-slate-600 block mt-1 leading-tight font-medium">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extra bottom padding to ensure zero cut-off on mobile browsers */}
          <div className="h-10 sm:h-4" />

        </div>

      </div>

    </div>
  );
};
