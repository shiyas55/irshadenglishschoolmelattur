import { AchievementRecord } from '../types/achievement';
import { INITIAL_ACHIEVEMENTS } from '../data/initialAchievements';
import { 
  fetchAchievementsFromSupabase, 
  upsertAchievementToSupabase, 
  deleteAchievementFromSupabase, 
  syncAllToSupabase,
  isSupabaseConnected 
} from './supabaseClient';

const STORAGE_KEY = 'ies_exhibition_achievements_v5';

// Synchronous getter for instant render (from localStorage or defaults)
export function getAchievements(): AchievementRecord[] {
  if (typeof window === 'undefined') {
    return INITIAL_ACHIEVEMENTS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First time initialization: seed with INITIAL_ACHIEVEMENTS
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ACHIEVEMENTS));
      return INITIAL_ACHIEVEMENTS;
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }

    return INITIAL_ACHIEVEMENTS;
  } catch (e) {
    console.error('Failed to read from localStorage:', e);
    return INITIAL_ACHIEVEMENTS;
  }
}

// Asynchronous loader (checks Supabase first if connected, falls back to localStorage)
export async function loadAchievementsAsync(): Promise<AchievementRecord[]> {
  if (typeof window === 'undefined') {
    return INITIAL_ACHIEVEMENTS;
  }

  // 1. If Supabase is connected, fetch from cloud database
  if (isSupabaseConnected()) {
    try {
      const cloudData = await fetchAchievementsFromSupabase();
      if (cloudData && cloudData.length > 0) {
        // Cache to localStorage for fast offline loads
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
        return cloudData;
      } else if (cloudData && cloudData.length === 0) {
        // Supabase table is empty: seed it with current records
        const local = getAchievements();
        await syncAllToSupabase(local);
        return local;
      }
    } catch (err) {
      console.warn('Could not load from Supabase, using local cache:', err);
    }
  }

  // 2. Return local storage
  return getAchievements();
}

// Save complete list of achievements (persists to localStorage + Supabase)
export function saveAchievements(items: AchievementRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    // 1. Immediately persist locally
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

    // 2. Sync to Supabase in background if connected
    if (isSupabaseConnected()) {
      syncAllToSupabase(items).catch(err => {
        console.warn('Background Supabase sync error:', err);
      });
    }
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

// Save single achievement (insert or update)
export function saveSingleAchievement(item: AchievementRecord): AchievementRecord[] {
  const current = getAchievements();
  const existingIdx = current.findIndex(a => a.id === item.id);
  let updated: AchievementRecord[];

  if (existingIdx >= 0) {
    updated = current.map(a => a.id === item.id ? item : a);
  } else {
    updated = [...current, { ...item, order: current.length + 1 }];
  }

  saveAchievements(updated);

  if (isSupabaseConnected()) {
    upsertAchievementToSupabase(item).catch(err => {
      console.warn('Supabase upsert error:', err);
    });
  }

  return updated;
}

// Delete single achievement
export function deleteAchievement(id: string): AchievementRecord[] {
  const current = getAchievements();
  const updated = current.filter(a => a.id !== id).map((a, idx) => ({ ...a, order: idx + 1 }));

  saveAchievements(updated);

  if (isSupabaseConnected()) {
    deleteAchievementFromSupabase(id).catch(err => {
      console.warn('Supabase delete error:', err);
    });
  }

  return updated;
}

// Reset to authoritative defaults
export function resetToDefaults(): AchievementRecord[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ACHIEVEMENTS));
    if (isSupabaseConnected()) {
      syncAllToSupabase(INITIAL_ACHIEVEMENTS).catch(err => {
        console.warn('Supabase reset sync error:', err);
      });
    }
  }
  return INITIAL_ACHIEVEMENTS;
}

export function exportToCSV(items: AchievementRecord[]): string {
  const headers = ['Order', 'ID', 'Title', 'Category', 'Award', 'Event', 'Academic Year', 'Featured Student', 'Description', 'Published', 'Verified'];
  const rows = items.map(item => [
    item.order,
    `"${item.id}"`,
    `"${(item.title || '').replace(/"/g, '""')}"`,
    `"${(item.category || '').replace(/"/g, '""')}"`,
    `"${(item.award || '').replace(/"/g, '""')}"`,
    `"${(item.event || '').replace(/"/g, '""')}"`,
    `"${(item.academicYear || '').replace(/"/g, '""')}"`,
    `"${(item.featuredStudent || '').replace(/"/g, '""')}"`,
    `"${(item.description || '').replace(/"/g, '""')}"`,
    item.isPublished ? 'YES' : 'NO',
    item.isVerified ? 'YES' : 'NO',
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function exportToJSON(items: AchievementRecord[]): string {
  return JSON.stringify(items, null, 2);
}
