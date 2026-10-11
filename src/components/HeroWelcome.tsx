import React from 'react';
import { Play, Volume2, VolumeX, Trophy, GraduationCap, Award, Sparkles } from 'lucide-react';
import { EXHIBITION_CONFIG } from '../data/initialAchievements';

interface HeroWelcomeProps {
  onStartPresentation: () => void;
  onExploreGallery?: () => void;
  onOpenInspection?: () => void;
  onEnableAudio: () => void;
  isAudioPlaying: boolean;
  totalAchievements: number;
}

export const HeroWelcome: React.FC<HeroWelcomeProps> = ({
  onStartPresentation,
  onExploreGallery,
  onOpenInspection,
  onEnableAudio,
  isAudioPlaying,
  totalAchievements,
}) => {
  return (
    <div className="relative min-h-[100dvh] flex flex-col justify-between px-3 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-6xl mx-auto text-slate-900">
      
      {/* Immersive School Campus Background with Irshad School Photo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0">
        <img
          src="/assets/irshad-school-hd.jpg"
          alt="Irshad English School Campus"
          className="w-full h-full object-cover object-center transform-gpu scale-100"
        />
        {/* Cinematic contrast overlay to keep school clearly visible while enhancing contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-900/25 to-slate-950/60" />
      </div>

      {/* Subtle Blue Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-[500px] h-60 sm:h-[350px] bg-blue-500/10 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 left-1/4 w-48 sm:w-[300px] h-48 sm:h-[300px] bg-indigo-500/10 blur-[90px] pointer-events-none rounded-full" />

      {/* Main Content Area in White Frosted Glass Container */}
      <div className="relative z-10 my-auto flex flex-col items-center text-center space-y-5 sm:space-y-6 max-w-2xl mx-auto w-full p-6 sm:p-9 rounded-3xl white-frosted-glass">
        
        {/* Inspection Verification Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full white-frosted-pill shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-700 animate-pulse" />
          <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase text-[#0a1e44]">
            Official Inspection Edition 2024–2026
          </span>
        </div>

        {/* Official School Logo Emblem */}
        <div className="relative group flex items-center justify-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full shadow-2xl shadow-blue-950/30 transition-transform hover:scale-105 duration-300 flex items-center justify-center">
            <img
              src="/assets/school-logo.png"
              alt="Irshad English School Logo"
              className="w-full h-full object-contain rounded-full select-none drop-shadow-md"
            />
          </div>
          <div className="absolute -inset-2 rounded-full bg-blue-500/15 blur-xl pointer-events-none group-hover:bg-blue-500/30 transition-all" />
        </div>

        {/* Title & Concise Subtitle */}
        <div className="space-y-1.5 sm:space-y-2 max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-black text-[#0a1e44] tracking-tight leading-tight drop-shadow-xs">
            Irshad English School
            <span className="block text-xl sm:text-3xl md:text-4xl text-[#1e40af] font-serif italic font-bold mt-1">
              Digital Achievement Exhibition
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-800 font-medium max-w-lg mx-auto leading-relaxed">
            Authenticated showcase of {totalAchievements} verified milestones in CBSE board examinations, national olympiads, interschool quizzes, and athletics championships.
          </p>
        </div>

        {/* School Credentials Chip */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-800 font-medium">
          <span className="px-2.5 py-1 rounded-lg white-frosted-pill text-[#0a1e44] font-bold">
            {EXHIBITION_CONFIG.affiliationNumber}
          </span>
          <span className="hidden xs:inline text-slate-400">•</span>
          <span className="font-semibold text-slate-800">Melattur, Malappuram</span>
          <span className="hidden xs:inline text-slate-400">•</span>
          <span className="text-[#0a1e44] italic font-serif font-bold">Light Upon Light</span>
        </div>

        {/* Primary Action Buttons */}
        <div className="w-full max-w-md flex flex-col gap-2.5 pt-2">
          {/* Main Royal Blue Start Button */}
          <button
            onClick={onStartPresentation}
            className="w-full flex items-center justify-center gap-3 py-3.5 sm:py-4 px-6 rounded-xl bg-gradient-to-r from-[#0f2b5c] via-[#1e3a8a] to-[#1d4ed8] hover:from-[#1e3a8a] hover:to-[#2563eb] text-white font-bold text-sm tracking-wide shadow-xl shadow-blue-950/30 hover:scale-[1.01] active:scale-[0.98] transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Start Presentation</span>
            <span className="px-2 py-0.5 rounded-full bg-white/25 text-[11px] font-bold backdrop-blur-sm">
              {totalAchievements} Slides
            </span>
          </button>



          {/* Audio Activation Pill */}
          <button
            onClick={onEnableAudio}
            className={`w-full py-2.5 px-3 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-2 transition-all ${
              isAudioPlaying
                ? 'bg-blue-600/15 border border-blue-400/80 text-blue-950 backdrop-blur-md shadow-xs'
                : 'white-frosted-button text-slate-800'
            }`}
          >
            {isAudioPlaying ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-blue-700 animate-pulse" />
                <span>Ceremonial Music Active (Tap to Mute)</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                <span>Tap to Enable Ceremonial Audio</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Bottom Key Honors Row */}
      <div className="relative z-10 w-full pt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        
        <div className="p-3 sm:p-3.5 rounded-2xl white-frosted-card flex items-center gap-2.5 transition-transform hover:-translate-y-0.5 duration-200">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-900 flex-shrink-0 backdrop-blur-sm">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm sm:text-base font-bold font-serif text-[#0a1e44] leading-tight">100% Pass</div>
            <div className="text-[10px] text-slate-700 font-medium truncate">CBSE 10th (33 Students)</div>
          </div>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl white-frosted-card flex items-center gap-2.5 transition-transform hover:-translate-y-0.5 duration-200">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-900 flex-shrink-0 backdrop-blur-sm">
            <Trophy className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm sm:text-base font-bold font-serif text-[#0a1e44] leading-tight">40 A Grades</div>
            <div className="text-[10px] text-slate-700 font-medium truncate">LEAP Talent Exam</div>
          </div>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl white-frosted-card flex items-center gap-2.5 transition-transform hover:-translate-y-0.5 duration-200">
          <div className="p-1.5 rounded-lg bg-red-500/20 text-red-900 flex-shrink-0 backdrop-blur-sm">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm sm:text-base font-bold font-serif text-[#0a1e44] leading-tight">25 Medals</div>
            <div className="text-[10px] text-slate-700 font-medium truncate">Karate Championship</div>
          </div>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl white-frosted-card flex items-center gap-2.5 transition-transform hover:-translate-y-0.5 duration-200">
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-900 flex-shrink-0 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm sm:text-base font-bold font-serif text-[#0a1e44] leading-tight">State Rank 1</div>
            <div className="text-[10px] text-slate-700 font-medium truncate">Hikma & Hindi Exam</div>
          </div>
        </div>

      </div>

    </div>
  );
};
