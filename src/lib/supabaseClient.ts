import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AchievementRecord, AchievementCategory } from '../types/achievement';

// Local storage keys for dynamic UI configuration if env vars are not set
const LS_SUPABASE_URL_KEY = 'ies_supabase_url';
const LS_SUPABASE_KEY_KEY = 'ies_supabase_anon_key';

export function getSupabaseCredentials(): { url: string; key: string } {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

  if (typeof window !== 'undefined') {
    if (!url) {
      url = localStorage.getItem(LS_SUPABASE_URL_KEY) || '';
    }
    if (!key) {
      key = localStorage.getItem(LS_SUPABASE_KEY_KEY) || '';
    }
  }

  return { url: url.trim(), key: key.trim() };
}

export function saveSupabaseCredentials(url: string, key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LS_SUPABASE_URL_KEY, url.trim());
    localStorage.setItem(LS_SUPABASE_KEY_KEY, key.trim());
  }
}

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) return null;

  if (cachedClient && lastUrl === url && lastKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key);
    lastUrl = url;
    lastKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function isSupabaseConnected(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key);
}

// Map database record (snake_case) to AchievementRecord (camelCase)
export function mapFromDbRecord(row: any): AchievementRecord {
  return {
    id: row.id,
    order: Number(row.order) || 1,
    title: row.title || '',
    malayalamTitle: row.malayalam_title || undefined,
    category: (row.category as AchievementCategory) || 'Academic Excellence & Board Examinations',
    award: row.award || '',
    event: row.event || '',
    organizer: row.organizer || undefined,
    date: row.date || undefined,
    academicYear: row.academic_year || '2024–2026',
    location: row.location || undefined,
    featuredStudent: row.featured_student || undefined,
    studentClass: row.student_class || undefined,
    studentList: Array.isArray(row.student_list) ? row.student_list : [],
    description: row.description || '',
    detailedNotes: row.detailed_notes || undefined,
    image: row.image || '',
    galleryImages: Array.isArray(row.gallery_images) ? row.gallery_images : [],
    pdfPageSource: row.pdf_page_source ? Number(row.pdf_page_source) : undefined,
    badge: row.badge || undefined,
    isPublished: row.is_published ?? true,
    isVerified: row.is_verified ?? true,
    highlightStats: Array.isArray(row.highlight_stats) ? row.highlight_stats : [],
  };
}

// Map AchievementRecord to database record (snake_case)
export function mapToDbRecord(rec: AchievementRecord): any {
  return {
    id: rec.id,
    order: rec.order,
    title: rec.title,
    malayalam_title: rec.malayalamTitle || null,
    category: rec.category,
    award: rec.award,
    event: rec.event,
    organizer: rec.organizer || null,
    date: rec.date || null,
    academic_year: rec.academicYear,
    location: rec.location || null,
    featured_student: rec.featuredStudent || null,
    student_class: rec.studentClass || null,
    student_list: rec.studentList || [],
    description: rec.description,
    detailed_notes: rec.detailedNotes || null,
    image: rec.image,
    gallery_images: rec.galleryImages || [],
    pdf_page_source: rec.pdfPageSource || null,
    badge: rec.badge || null,
    is_published: rec.isPublished,
    is_verified: rec.isVerified,
    highlight_stats: rec.highlightStats || [],
  };
}

// Fetch all achievements from Supabase
export async function fetchAchievementsFromSupabase(): Promise<AchievementRecord[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('achievements')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      console.warn('Supabase select error:', error.message);
      return null;
    }

    if (Array.isArray(data)) {
      return data.map(mapFromDbRecord);
    }
    return [];
  } catch (err) {
    console.error('Error fetching achievements from Supabase:', err);
    return null;
  }
}

// Upsert single achievement in Supabase
export async function upsertAchievementToSupabase(rec: AchievementRecord): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = mapToDbRecord(rec);
    const { error } = await client
      .from('achievements')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('Supabase upsert error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase upsert exception:', err);
    return false;
  }
}

// Delete single achievement in Supabase
export async function deleteAchievementFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('achievements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase delete exception:', err);
    return false;
  }
}

// Bulk sync achievements to Supabase
export async function syncAllToSupabase(items: AchievementRecord[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const rows = items.map(mapToDbRecord);
    const { error } = await client
      .from('achievements')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('Supabase bulk sync error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase bulk sync exception:', err);
    return false;
  }
}
