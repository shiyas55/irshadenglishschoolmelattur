export type AchievementCategory = 
  | 'Academic Excellence & Board Examinations'
  | 'Science & Talent Olympiads'
  | 'Arts, Literature & Quizzes'
  | 'Sports, Athletics & Martial Arts'
  | 'Institutional Excellence & Accreditations';

export interface StudentAchiever {
  name: string;
  class?: string;
  rank?: string;
  score?: string;
  details?: string;
}

export interface AchievementRecord {
  id: string;
  order: number;
  title: string;
  malayalamTitle?: string;
  category: AchievementCategory;
  award: string;
  event: string;
  organizer?: string;
  date?: string;
  academicYear: string;
  location?: string;
  featuredStudent?: string;
  studentClass?: string;
  studentList?: StudentAchiever[];
  description: string;
  detailedNotes?: string;
  image: string;
  galleryImages?: string[];
  pdfPageSource?: number;
  badge?: string;
  isPublished: boolean;
  isVerified: boolean;
  highlightStats?: {
    label: string;
    value: string;
  }[];
}

export interface ExhibitionConfig {
  schoolName: string;
  schoolSubtitle: string;
  motto: string;
  tagline: string;
  affiliationNumber: string;
  affiliationBody: string;
  establishedYear: number;
  location: string;
  contactPhone: string;
  contactEmail: string;
  website: string;
  inspectionTitle: string;
  slideDurationSeconds: number;
}
