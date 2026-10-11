import { SchoolSection, SectionContentItem } from '../types/schoolCms';
import { INITIAL_SECTIONS, INITIAL_CONTENT_ITEMS } from '../data/initialSections';
import { getSupabaseClient, isSupabaseConnected } from './supabaseClient';

const LS_SECTIONS_KEY = 'ies_school_sections_v2';
const LS_CONTENT_ITEMS_KEY = 'ies_school_content_items_v2';

// -------------------------------------------------------------
// SECTIONS MANAGEMENT
// -------------------------------------------------------------

export function getSections(): SchoolSection[] {
  if (typeof window === 'undefined') return INITIAL_SECTIONS;
  try {
    const raw = localStorage.getItem(LS_SECTIONS_KEY);
    if (!raw) {
      localStorage.setItem(LS_SECTIONS_KEY, JSON.stringify(INITIAL_SECTIONS));
      return INITIAL_SECTIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SECTIONS;
  } catch (err) {
    console.error('Failed to read sections from localStorage:', err);
    return INITIAL_SECTIONS;
  }
}

export function saveSections(sections: SchoolSection[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_SECTIONS_KEY, JSON.stringify(sections));

    if (isSupabaseConnected()) {
      syncSectionsToSupabase(sections).catch((err) => {
        console.warn('Background Supabase sections sync warning:', err);
      });
    }
  } catch (err) {
    console.error('Failed to save sections:', err);
  }
}

export function saveSingleSection(section: SchoolSection): SchoolSection[] {
  const current = getSections();
  const existingIdx = current.findIndex((s) => s.id === section.id || s.slug === section.slug);
  let updated: SchoolSection[];

  if (existingIdx >= 0) {
    updated = current.map((s, idx) => (idx === existingIdx ? { ...section, updatedAt: new Date().toISOString() } : s));
  } else {
    updated = [
      ...current,
      {
        ...section,
        order: current.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  saveSections(updated);
  return updated;
}

export function deleteSection(id: string): SchoolSection[] {
  const current = getSections();
  const updated = current
    .filter((s) => s.id !== id)
    .map((s, idx) => ({ ...s, order: idx + 1 }));

  saveSections(updated);

  if (isSupabaseConnected()) {
    const client = getSupabaseClient();
    if (client) {
      Promise.resolve(client.from('sections').delete().eq('id', id)).catch(() => {});
    }
  }

  return updated;
}

export function getSectionBySlug(slug: string): SchoolSection | undefined {
  const sections = getSections();
  return sections.find((s) => s.slug === slug);
}

// -------------------------------------------------------------
// CONTENT ITEMS MANAGEMENT
// -------------------------------------------------------------

export function getContentItems(): SectionContentItem[] {
  if (typeof window === 'undefined') return INITIAL_CONTENT_ITEMS;
  try {
    const raw = localStorage.getItem(LS_CONTENT_ITEMS_KEY);
    if (!raw) {
      localStorage.setItem(LS_CONTENT_ITEMS_KEY, JSON.stringify(INITIAL_CONTENT_ITEMS));
      return INITIAL_CONTENT_ITEMS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CONTENT_ITEMS;
  } catch (err) {
    console.error('Failed to read content items from localStorage:', err);
    return INITIAL_CONTENT_ITEMS;
  }
}

export function saveContentItems(items: SectionContentItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_CONTENT_ITEMS_KEY, JSON.stringify(items));

    if (isSupabaseConnected()) {
      syncContentItemsToSupabase(items).catch((err) => {
        console.warn('Background Supabase items sync warning:', err);
      });
    }
  } catch (err) {
    console.error('Failed to save content items:', err);
  }
}

export function saveSingleContentItem(item: SectionContentItem): SectionContentItem[] {
  const current = getContentItems();
  const existingIdx = current.findIndex((it) => it.id === item.id);
  let updated: SectionContentItem[];

  if (existingIdx >= 0) {
    updated = current.map((it, idx) => (idx === existingIdx ? { ...item, updatedAt: new Date().toISOString() } : it));
  } else {
    const itemsInSameSection = current.filter((it) => it.sectionSlug === item.sectionSlug);
    updated = [
      ...current,
      {
        ...item,
        order: itemsInSameSection.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  saveContentItems(updated);
  return updated;
}

export function deleteContentItem(id: string): SectionContentItem[] {
  const current = getContentItems();
  const target = current.find((it) => it.id === id);
  const updated = current.filter((it) => it.id !== id);

  // Reorder items in that section
  if (target) {
    let sectionOrder = 1;
    updated.forEach((it) => {
      if (it.sectionSlug === target.sectionSlug) {
        it.order = sectionOrder++;
      }
    });
  }

  saveContentItems(updated);

  if (isSupabaseConnected()) {
    const client = getSupabaseClient();
    if (client) {
      Promise.resolve(client.from('content_items').delete().eq('id', id)).catch(() => {});
    }
  }

  return updated;
}

export function getItemsBySectionSlug(slug: string, publishedOnly = true): SectionContentItem[] {
  const items = getContentItems();
  return items.filter((it) => {
    if (it.sectionSlug !== slug) return false;
    if (publishedOnly && !it.isPublished) return false;
    return true;
  }).sort((a, b) => a.order - b.order);
}

// -------------------------------------------------------------
// SUPABASE SYNC HELPERS
// -------------------------------------------------------------

export async function loadSectionsAsync(): Promise<SchoolSection[]> {
  if (typeof window === 'undefined') return INITIAL_SECTIONS;
  if (isSupabaseConnected()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('sections')
          .select('*')
          .order('order_num', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: SchoolSection[] = data.map((row: any) => ({
            id: row.id,
            slug: row.slug,
            title: row.title,
            subtitle: row.subtitle || '',
            description: row.description || '',
            coverImage: row.cover_image || '',
            icon: row.icon || 'Trophy',
            order: row.order_num || 0,
            isPublished: row.is_published ?? true,
            isArchived: row.is_archived ?? false,
            categories: Array.isArray(row.categories) ? row.categories : [],
            tags: Array.isArray(row.tags) ? row.tags : [],
            enableCategories: row.enable_categories ?? true,
            enableTags: row.enable_tags ?? true,
            backgroundMusicUrl: row.background_music_url || '',
            slideshowAutoPlay: row.slideshow_autoplay ?? true,
            slideshowInterval: row.slideshow_interval ?? 5,
            createdAt: row.created_at || new Date().toISOString(),
            updatedAt: row.updated_at || new Date().toISOString(),
          }));

          localStorage.setItem(LS_SECTIONS_KEY, JSON.stringify(mapped));
          return mapped;
        }
      } catch (err) {
        console.warn('Could not fetch sections from Supabase:', err);
      }
    }
  }
  return getSections();
}

export async function loadContentItemsAsync(sectionSlug?: string): Promise<SectionContentItem[]> {
  if (typeof window === 'undefined') return INITIAL_CONTENT_ITEMS;
  if (isSupabaseConnected()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        let query = client.from('content_items').select('*').order('order_num', { ascending: true });
        if (sectionSlug) {
          query = query.eq('section_slug', sectionSlug);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const mapped: SectionContentItem[] = data.map((row: any) => ({
            id: row.id,
            sectionId: row.section_id,
            sectionSlug: row.section_slug,
            title: row.title,
            subtitle: row.subtitle || '',
            description: row.description || '',
            images: Array.isArray(row.images) ? row.images : [],
            studentName: row.student_name || '',
            studentClass: row.student_class || '',
            studentList: Array.isArray(row.student_list) 
              ? row.student_list 
              : (row.student_name ? [{ name: row.student_name, class: row.student_class }] : []),
            eventDate: row.event_date || '',
            award: row.award || '',
            category: row.category || '',
            tags: Array.isArray(row.tags) ? row.tags : [],
            order: row.order_num || 0,
            isPublished: row.is_published ?? true,
            createdAt: row.created_at || new Date().toISOString(),
            updatedAt: row.updated_at || new Date().toISOString(),
          }));

          if (!sectionSlug) {
            localStorage.setItem(LS_CONTENT_ITEMS_KEY, JSON.stringify(mapped));
          }
          return mapped;
        }
      } catch (err) {
        console.warn('Could not fetch items from Supabase:', err);
      }
    }
  }
  return sectionSlug ? getItemsBySectionSlug(sectionSlug, false) : getContentItems();
}

export async function syncSectionsToSupabase(sections: SchoolSection[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const rows = sections.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      subtitle: s.subtitle || '',
      description: s.description || '',
      cover_image: s.coverImage || '',
      icon: s.icon || 'Trophy',
      order_num: s.order,
      is_published: s.isPublished,
      is_archived: s.isArchived,
      categories: s.categories || [],
      tags: s.tags || [],
      enable_categories: s.enableCategories,
      enable_tags: s.enableTags,
      background_music_url: s.backgroundMusicUrl || '',
      slideshow_autoplay: s.slideshowAutoPlay,
      slideshow_interval: s.slideshowInterval,
    }));

    const { error } = await client.from('sections').upsert(rows, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase sections upsert error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase sections upsert exception:', err);
    return false;
  }
}

export async function syncContentItemsToSupabase(items: SectionContentItem[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const rows = items.map((it) => ({
      id: it.id,
      section_id: it.sectionId,
      section_slug: it.sectionSlug,
      title: it.title,
      subtitle: it.subtitle || '',
      description: it.description || '',
      images: it.images || [],
      student_name: it.studentName || '',
      student_class: it.studentClass || '',
      student_list: it.studentList || [],
      event_date: it.eventDate || '',
      award: it.award || '',
      category: it.category || '',
      tags: it.tags || [],
      order_num: it.order,
      is_published: it.isPublished,
    }));

    const { error } = await client.from('content_items').upsert(rows, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase content_items upsert error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase content_items upsert exception:', err);
    return false;
  }
}
