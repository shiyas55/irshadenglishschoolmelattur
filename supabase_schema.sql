-- ==============================================================================
-- IRSHAD ENGLISH SCHOOL — SUPABASE DATABASE SCHEMA
-- Digital Achievement Exhibition
-- ==============================================================================

-- 1. Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id TEXT PRIMARY KEY,
  "order" INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  malayalam_title TEXT,
  category TEXT NOT NULL,
  award TEXT NOT NULL,
  event TEXT NOT NULL,
  organizer TEXT,
  date TEXT,
  academic_year TEXT NOT NULL,
  location TEXT,
  featured_student TEXT,
  student_class TEXT,
  student_list JSONB DEFAULT '[]'::jsonb,
  description TEXT NOT NULL DEFAULT '',
  detailed_notes TEXT,
  image TEXT NOT NULL,
  gallery_images JSONB DEFAULT '[]'::jsonb,
  pdf_page_source INTEGER,
  badge TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT true,
  highlight_stats JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create index on order and category
CREATE INDEX IF NOT EXISTS idx_achievements_order ON public.achievements ("order");
CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements (category);
CREATE INDEX IF NOT EXISTS idx_achievements_published ON public.achievements (is_published);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- 4. Policies (Allow anonymous access for the exhibition app)
DROP POLICY IF EXISTS "Public can view achievements" ON public.achievements;
CREATE POLICY "Public can view achievements" 
ON public.achievements 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Public can insert achievements" ON public.achievements;
CREATE POLICY "Public can insert achievements" 
ON public.achievements 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update achievements" ON public.achievements;
CREATE POLICY "Public can update achievements" 
ON public.achievements 
FOR UPDATE 
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Public can delete achievements" ON public.achievements;
CREATE POLICY "Public can delete achievements" 
ON public.achievements 
FOR DELETE 
USING (true);

-- 5. Helpful trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = timezone('utc'::text, now());
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_achievements_updated_at ON public.achievements;
CREATE TRIGGER update_achievements_updated_at
BEFORE UPDATE ON public.achievements
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
