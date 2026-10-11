'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AchievementRecord } from '../../types/achievement';
import { getAchievements, saveAchievements, loadAchievementsAsync } from '../../lib/storage';
import { AdminCMS } from '../../components/AdminCMS';

export default function AdminPage() {
  const router = useRouter();
  const [achievements, setAchievements] = useState<AchievementRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loaded = getAchievements();
    setAchievements(loaded);
    setIsLoaded(true);

    loadAchievementsAsync().then((cloudData) => {
      if (cloudData && cloudData.length > 0) {
        setAchievements(cloudData);
      }
    });
  }, []);

  const handleUpdateAchievements = (updated: AchievementRecord[]) => {
    setAchievements(updated);
    saveAchievements(updated);
  };

  const handleExit = () => {
    router.push('/');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-blue-900 font-mono text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading Exhibition CMS...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900">
      <AdminCMS
        achievements={achievements}
        onUpdateAchievements={handleUpdateAchievements}
        onExit={handleExit}
      />
    </main>
  );
}
