import { StudentAchiever } from './achievement';

export interface SectionItemImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  order: number;
}

export interface SectionContentItem {
  id: string;
  sectionId: string;
  sectionSlug: string;
  title: string;
  subtitle?: string;
  description: string;
  images: SectionItemImage[];
  studentName?: string;
  studentClass?: string;
  studentList?: StudentAchiever[];
  eventDate?: string;
  award?: string;
  category?: string;
  tags: string[];
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolSection {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  coverImage?: string;
  icon?: string;
  order: number;
  isPublished: boolean;
  isArchived: boolean;
  categories: string[];
  tags: string[];
  enableCategories: boolean;
  enableTags: boolean;
  backgroundMusicUrl?: string;
  slideshowAutoPlay?: boolean;
  slideshowInterval?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset?: string;
  apiKey?: string;
  apiSecret?: string;
}
