-- ==============================================================================
-- IRSHAD ENGLISH SCHOOL CMS V2: DYNAMIC SECTIONS & MULTI-PHOTO GALLERY SCHEMA
-- ==============================================================================

-- 1. Create Sections Table
CREATE TABLE IF NOT EXISTS public.sections (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    cover_image TEXT,
    icon TEXT DEFAULT 'Trophy',
    order_num INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    is_archived BOOLEAN DEFAULT false,
    categories JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    enable_categories BOOLEAN DEFAULT true,
    enable_tags BOOLEAN DEFAULT true,
    background_music_url TEXT,
    slideshow_autoplay BOOLEAN DEFAULT true,
    slideshow_interval INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Content Items Table (Supports Multiple Photographs per Item)
CREATE TABLE IF NOT EXISTS public.content_items (
    id TEXT PRIMARY KEY,
    section_id TEXT NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    section_slug TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT NOT NULL,
    images JSONB DEFAULT '[]'::jsonb, -- Array of { id, url, caption, order }
    student_name TEXT,
    student_class TEXT,
    student_list JSONB DEFAULT '[]'::jsonb, -- Array of { name, class, score, rank, details }
    event_date TEXT,
    award TEXT,
    category TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    order_num INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Indexes for High-Speed Queries
CREATE INDEX IF NOT EXISTS idx_sections_slug ON public.sections(slug);
CREATE INDEX IF NOT EXISTS idx_sections_published ON public.sections(is_published, is_archived, order_num);
CREATE INDEX IF NOT EXISTS idx_content_items_section ON public.content_items(section_id, is_published, order_num);
CREATE INDEX IF NOT EXISTS idx_content_items_slug ON public.content_items(section_slug, is_published);
CREATE INDEX IF NOT EXISTS idx_content_items_category ON public.content_items(category);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

-- 5. Sections RLS Policies
DROP POLICY IF EXISTS "Public can view published sections" ON public.sections;
CREATE POLICY "Public can view published sections"
    ON public.sections
    FOR SELECT
    USING (is_published = true AND is_archived = false);

DROP POLICY IF EXISTS "Allow all for authenticated/service/anon cms operations" ON public.sections;
CREATE POLICY "Allow all for authenticated/service/anon cms operations"
    ON public.sections
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 6. Content Items RLS Policies
DROP POLICY IF EXISTS "Public can view published items of published sections" ON public.content_items;
CREATE POLICY "Public can view published items of published sections"
    ON public.content_items
    FOR SELECT
    USING (
        is_published = true 
        AND EXISTS (
            SELECT 1 FROM public.sections s 
            WHERE s.id = content_items.section_id 
            AND s.is_published = true 
            AND s.is_archived = false
        )
    );

DROP POLICY IF EXISTS "Allow all for authenticated/service/anon items cms operations" ON public.content_items;
CREATE POLICY "Allow all for authenticated/service/anon items cms operations"
    ON public.content_items
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 7. Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_cms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sections_updated_at ON public.sections;
CREATE TRIGGER trg_sections_updated_at
    BEFORE UPDATE ON public.sections
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_cms_updated_at();

DROP TRIGGER IF EXISTS trg_content_items_updated_at ON public.content_items;
CREATE TRIGGER trg_content_items_updated_at
    BEFORE UPDATE ON public.content_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_cms_updated_at();
