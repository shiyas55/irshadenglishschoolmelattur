'use client';

import React, { useState, useEffect } from 'react';
import { AchievementRecord } from '../types/achievement';
import { INITIAL_ACHIEVEMENTS } from '../data/initialAchievements';
import { getAchievements, saveAchievements, loadAchievementsAsync } from '../lib/storage';
import { backgroundMusic } from '../lib/audioService';
import { HeroWelcome } from '../components/HeroWelcome';
import { PresentationMode } from '../components/PresentationMode';
import { GalleryMode } from '../components/GalleryMode';
import { InspectionMode } from '../components/InspectionMode';
import { AdminCMS } from '../components/AdminCMS';
import { QRCodeModal } from '../components/QRCodeModal';

export default function HomePage() {
  const [achievements, setAchievements] = useState<AchievementRecord[]>(INITIAL_ACHIEVEMENTS);
  const [currentMode, setCurrentMode] = useState<'hero' | 'presentation' | 'gallery' | 'inspection' | 'admin'>('hero');
  const [presentationStartIndex, setPresentationStartIndex] = useState<number>(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);

  // Load persisted achievements on mount (synchronous local + async cloud sync)
  useEffect(() => {
    const loaded = getAchievements();
    if (loaded && loaded.length > 0) {
      setAchievements(loaded);
    }
    loadAchievementsAsync().then((data) => {
      if (data && data.length > 0) {
        setAchievements(data);
      }
    });
  }, []);

  // Autoplay unmuted ceremonial audio on first open
  useEffect(() => {
    let started = false;

    const playUnmuted = async () => {
      if (started) return;
      try {
        const success = await backgroundMusic.start();
        if (success) {
          started = true;
          setIsAudioPlaying(true);
          setIsAudioMuted(false);
          cleanup();
        }
      } catch {
        // Autoplay policy delayed until interaction
      }
    };

    const handleFirstGesture = () => {
      playUnmuted();
    };

    const cleanup = () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };

    // 1. Immediately attempt unmuted autoplay upon opening
    playUnmuted();

    // 2. Also listen for the very first tap/click anywhere to guarantee immediate start
    window.addEventListener('pointerdown', handleFirstGesture, { passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { passive: true });
    window.addEventListener('click', handleFirstGesture, { passive: true });
    window.addEventListener('keydown', handleFirstGesture, { passive: true });

    return () => {
      cleanup();
    };
  }, []);

  // Filter only published records for visitor-facing modes
  const publishedAchievements = achievements.filter((a) => a.isPublished);

  // Audio Toggle
  const handleToggleAudio = async () => {
    if (!isAudioPlaying || isAudioMuted) {
      await backgroundMusic.start();
      setIsAudioPlaying(true);
      setIsAudioMuted(false);
    } else {
      const muted = backgroundMusic.toggleMute();
      setIsAudioMuted(muted);
    }
  };

  // Start presentation at given index
  const handleStartPresentation = (index: number = 0) => {
    setPresentationStartIndex(index);
    setCurrentMode('presentation');
    // Start audio automatically on presentation start
    backgroundMusic.start().then(() => {
      setIsAudioPlaying(true);
      setIsAudioMuted(false);
    }).catch((err) => {
      console.info('Presentation audio autoplay waiting for first user click:', err);
    });
  };

  // Update achievements from CMS
  const handleUpdateAchievements = (updated: AchievementRecord[]) => {
    setAchievements(updated);
    saveAchievements(updated);
  };

  return (
    <main className={`min-h-screen flex flex-col justify-between ${currentMode === 'hero' ? 'bg-slate-950 text-slate-900' : 'bg-[#f8fafc] text-slate-900'}`}>
      
      {/* Mode Renderers (No Navbar Header) */}
      <div className="flex-1">
        {currentMode === 'hero' && (
          <HeroWelcome
            onStartPresentation={() => handleStartPresentation(0)}
            onExploreGallery={() => setCurrentMode('gallery')}
            onOpenInspection={() => setCurrentMode('inspection')}
            onEnableAudio={handleToggleAudio}
            isAudioPlaying={isAudioPlaying && !isAudioMuted}
            totalAchievements={publishedAchievements.length}
          />
        )}

        {currentMode === 'presentation' && (
          <PresentationMode
            achievements={publishedAchievements}
            initialIndex={presentationStartIndex}
            onExit={() => setCurrentMode('hero')}
            isAudioPlaying={isAudioPlaying}
            isAudioMuted={isAudioMuted}
            onToggleAudio={handleToggleAudio}
          />
        )}

        {currentMode === 'gallery' && (
          <GalleryMode
            achievements={publishedAchievements}
            onOpenPresentationAt={(idx) => handleStartPresentation(idx)}
            onBackToHome={() => setCurrentMode('hero')}
            isAudioPlaying={isAudioPlaying}
            isAudioMuted={isAudioMuted}
            onToggleAudio={handleToggleAudio}
          />
        )}

        {currentMode === 'inspection' && (
          <InspectionMode
            achievements={publishedAchievements}
            onSelectAchievement={(idx) => handleStartPresentation(idx)}
            onBackToHome={() => setCurrentMode('hero')}
          />
        )}

        {currentMode === 'admin' && (
          <AdminCMS
            achievements={achievements}
            onUpdateAchievements={handleUpdateAchievements}
            onExit={() => setCurrentMode('hero')}
          />
        )}
      </div>

      {/* QR Code Booklet Modal */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />

      {/* Dignified Footer */}
      {currentMode !== 'presentation' && (
        <footer className={`border-t py-6 px-4 sm:px-6 lg:px-8 text-center text-xs space-y-1.5 no-print relative z-10 ${
          currentMode === 'hero' 
            ? 'border-white/10 bg-slate-950/80 backdrop-blur-md text-slate-300' 
            : 'border-slate-800/80 bg-[#040913] text-slate-300'
        }`}>
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
            <span className="font-serif font-bold text-slate-200">Irshad English School</span>
            <span>•</span>
            <span>Melattur - 679 326, Malappuram Dist, Kerala</span>
            <span>•</span>
            <span className="text-amber-300/90 font-medium">CBSE Affiliation No. 930636</span>
            <span>•</span>
            <span>Run by IET Kozhikode</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Prepared exclusively for the Official School Inspection Committee.
          </p>
        </footer>
      )}

    </main>
  );
}
