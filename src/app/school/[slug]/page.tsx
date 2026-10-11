'use client';

import React, { useState, useEffect, useMemo, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  getSectionBySlug, 
  getItemsBySectionSlug, 
  loadSectionsAsync, 
  loadContentItemsAsync 
} from '../../../lib/sectionsStorage';
import { SchoolSection, SectionContentItem, SectionItemImage } from '../../../types/schoolCms';
import { downloadQrCodePng, downloadQrCodeSvg, copyToClipboard } from '../../../lib/qrHelper';
import { getOptimizedImageUrl } from '../../../lib/cloudinary';
import { 
  ArrowLeft, 
  Share2, 
  QrCode, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  Award, 
  User, 
  Users,
  GraduationCap, 
  Tag, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Maximize2, 
  Play, 
  Pause, 
  Check, 
  Sparkles,
  ExternalLink,
  Layers,
  Image as ImageIcon
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function SchoolSectionPublicPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const searchParams = useSearchParams();
  const initialItemId = searchParams.get('item');

  const [section, setSection] = useState<SchoolSection | null>(null);
  const [items, setItems] = useState<SectionContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Multi-Photo Modal & Lightbox
  const [activeItem, setActiveItem] = useState<SectionContentItem | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState<boolean>(false);

  // Notifications & Copy state
  const [copiedMessage, setCopiedMessage] = useState<string>('');

  useEffect(() => {
    // 1. Initial immediate load from local cache
    const sec = getSectionBySlug(slug);
    if (sec) {
      setSection(sec);
      const secItems = getItemsBySectionSlug(slug, true);
      setItems(secItems);
      setIsLoading(false);

      if (initialItemId) {
        const target = secItems.find((it) => it.id === initialItemId);
        if (target) {
          setActiveItem(target);
          setActiveImageIndex(0);
        }
      }
    }

    // 2. Refresh asynchronously from Supabase
    Promise.all([loadSectionsAsync(), loadContentItemsAsync(slug)]).then(([allSecs, allItems]) => {
      const refreshedSec = allSecs.find((s) => s.slug === slug);
      if (refreshedSec) {
        setSection(refreshedSec);
        const filtered = allItems.filter((it) => it.sectionSlug === slug && it.isPublished);
        setItems(filtered);
      }
      setIsLoading(false);
    });
  }, [slug, initialItemId]);

  // Handle Slideshow Autoplay inside modal
  useEffect(() => {
    if (!isSlideshowPlaying || !activeItem || activeItem.images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % activeItem.images.length);
    }, (section?.slideshowInterval || 4) * 1000);

    return () => clearInterval(interval);
  }, [isSlideshowPlaying, activeItem, section?.slideshowInterval]);

  // Derived categories & tags present in published items
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach((it) => {
      if (it.category?.trim()) cats.add(it.category.trim());
    });
    return Array.from(cats);
  }, [items]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach((it) => {
      it.tags?.forEach((t) => {
        if (t?.trim()) tags.add(t.trim());
      });
    });
    return Array.from(tags);
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (selectedCategory !== 'All' && it.category !== selectedCategory) return false;
      if (selectedTag !== 'All' && !it.tags?.includes(selectedTag)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = it.title.toLowerCase().includes(q);
        const matchesSub = (it.subtitle || '').toLowerCase().includes(q);
        const matchesDesc = (it.description || '').toLowerCase().includes(q);
        const matchesStudent = (it.studentName || '').toLowerCase().includes(q);
        const matchesAward = (it.award || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesSub && !matchesDesc && !matchesStudent && !matchesAward) {
          return false;
        }
      }
      return true;
    });
  }, [items, selectedCategory, selectedTag, searchQuery]);

  // Copy Link with message
  const handleCopyLink = async (itemId?: string) => {
    let url = typeof window !== 'undefined' ? `${window.location.origin}/school/${slug}` : '';
    if (itemId) {
      url += `?item=${itemId}`;
    }

    const success = await copyToClipboard(url);
    if (success) {
      setCopiedMessage('Public link copied to clipboard!');
      setTimeout(() => setCopiedMessage(''), 3500);
    } else {
      setCopiedMessage('Could not auto-copy. Please copy from browser bar.');
      setTimeout(() => setCopiedMessage(''), 3500);
    }
  };

  // Download QR Code immediately
  const handleDownloadQr = async (format: 'png' | 'svg' = 'png', itemId?: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://irshadenglishschool.edu';
    let targetUrl = `${origin}/school/${slug}`;
    if (itemId) targetUrl += `?item=${itemId}`;

    const filename = `IES_${slug}_${itemId || 'section'}_QR.${format}`;
    if (format === 'svg') {
      await downloadQrCodeSvg(targetUrl, filename);
    } else {
      await downloadQrCodePng(targetUrl, filename);
    }

    setCopiedMessage(`Downloaded QR code for ${section?.title || slug}!`);
    setTimeout(() => setCopiedMessage(''), 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-800 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Loading School Section...
          </p>
        </div>
      </div>
    );
  }

  if (!section || (!section.isPublished && section.isArchived)) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 text-center text-slate-900">
        <div className="max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-serif font-black text-[#0f2b5c]">Section Not Found or Private</h1>
          <p className="text-xs text-slate-600">
            This school section may be unpublished, archived, or currently under revision by the administration.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f2b5c] text-white text-xs font-bold hover:bg-blue-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Main Exhibition</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-blue-600 selection:text-white">
      
      {/* Top Floating Notification Toast */}
      {copiedMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-slate-900/90 text-white text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copiedMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Return to School Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Irshad English School</span>
                <span className="text-slate-300">•</span>
                <span className="text-[10px] font-medium text-slate-500">Public Section</span>
              </div>
              <h1 className="text-sm sm:text-base font-serif font-black text-[#0f2b5c] truncate max-w-[200px] sm:max-w-md">
                {section.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopyLink()}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0f2b5c] text-xs font-bold border border-blue-200 flex items-center gap-1.5 transition-all shadow-2xs"
              title="Copy shareable link"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-700" />
              <span className="hidden sm:inline">Copy Link</span>
            </button>

            <button
              onClick={() => handleDownloadQr('png')}
              className="px-3 py-1.5 rounded-xl bg-[#0f2b5c] hover:bg-blue-900 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
              title="Download high-contrast QR Code for print"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Download QR</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section Banner */}
      <div className="relative bg-gradient-to-b from-blue-900 via-[#0f2b5c] to-slate-900 text-white overflow-hidden">
        {/* Ambient background decoration */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official School Repository • {items.length} Published Exhibits</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-black tracking-tight text-white max-w-3xl">
            {section.title}
          </h2>

          {section.subtitle && (
            <p className="text-sm sm:text-lg text-blue-100 font-medium max-w-2xl">
              {section.subtitle}
            </p>
          )}

          {section.description && (
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {section.description}
            </p>
          )}

          {/* Quick Sharing & Direct Actions */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => handleDownloadQr('png')}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Printable QR (PNG)</span>
            </button>

            <button
              onClick={() => handleDownloadQr('svg')}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-blue-300" />
              <span>High-Res QR (SVG)</span>
            </button>

            <span className="text-slate-400 text-[11px] ml-1">
              Direct URL: <code className="bg-black/30 px-2 py-0.5 rounded text-amber-200 font-mono">/school/{section.slug}</code>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Search & Category Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search within ${section.title}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 bg-slate-50/50"
              />
            </div>

            <div className="text-xs text-slate-500 font-semibold px-2">
              Showing <span className="text-[#0f2b5c] font-bold">{filteredItems.length}</span> of {items.length} records
            </div>
          </div>

          {/* Category Tabs */}
          {section.enableCategories && availableCategories.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Categories
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedCategory === 'All'
                      ? 'bg-[#0f2b5c] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All ({items.length})
                </button>
                {availableCategories.map((cat) => {
                  const count = items.filter((it) => it.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedCategory === cat
                          ? 'bg-[#0f2b5c] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tag Filter Pills */}
          {section.enableTags && availableTags.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Tags
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSelectedTag('All')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    selectedTag === 'All'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  #All
                </button>
                {availableTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTag(t)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      selectedTag === t
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content Items Gallery Grid */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0f2b5c]">No exhibits match your filter</h3>
            <p className="text-xs text-slate-500">
              Try selecting a different category or clearing your search term.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedTag('All');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const hasMultipleImages = item.images && item.images.length > 1;
              const primaryImage = item.images && item.images.length > 0 ? item.images[0] : null;

              return (
                <article
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden group"
                >
                  {/* Image Showcase Header */}
                  {primaryImage ? (
                    <div 
                      onClick={() => {
                        setActiveItem(item);
                        setActiveImageIndex(0);
                      }}
                      className="relative h-56 bg-slate-900 cursor-pointer overflow-hidden"
                    >
                      <img
                        src={getOptimizedImageUrl(primaryImage.url, { width: 800 })}
                        alt={primaryImage.caption || item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />

                      {/* Multiple photographs badge */}
                      {hasMultipleImages && (
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 flex items-center gap-1.5 shadow-md">
                          <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                          <span>{item.images.length} Photos</span>
                        </div>
                      )}

                      {/* Category Badge */}
                      {item.category && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-blue-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-white/20">
                          {item.category}
                        </div>
                      )}

                      {/* Click to expand overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span className="text-white text-xs font-bold flex items-center gap-1.5">
                          <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                          <span>Open Gallery & Slideshow ({item.images.length} photos)</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-28 bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center border-b border-slate-100">
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                    </div>
                  )}

                  {/* Body Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-base font-serif font-bold text-[#0f2b5c] leading-snug group-hover:text-blue-700 transition-colors">
                        {item.title}
                      </h3>

                      {item.subtitle && (
                        <p className="text-xs font-medium text-slate-500 line-clamp-1">
                          {item.subtitle}
                        </p>
                      )}

                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Metadata tags */}
                    <div className="space-y-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                      {item.studentList && item.studentList.length > 0 ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[#0f2b5c] font-bold text-xs">
                            <Users className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <span>Participating Students ({item.studentList.length}):</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {item.studentList.map((st, sIdx) => (
                              <span
                                key={sIdx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 text-xs font-semibold border border-blue-200/80"
                              >
                                <span>{st.name}</span>
                                {st.class && <span className="text-slate-500 font-normal">({st.class})</span>}
                                {st.rank && <span className="text-amber-800 font-bold">• {st.rank}</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : item.studentName ? (
                        <div className="flex items-center gap-2 text-slate-700">
                          <User className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          <span className="font-semibold truncate">{item.studentName}</span>
                          {item.studentClass && (
                            <span className="text-slate-400">({item.studentClass})</span>
                          )}
                        </div>
                      ) : null}

                      {item.award && (
                        <div className="flex items-center gap-2 text-amber-700 font-semibold">
                          <Award className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span className="truncate">{item.award}</span>
                        </div>
                      )}

                      {item.eventDate && (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{item.eventDate}</span>
                        </div>
                      )}

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.tags.map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setActiveItem(item);
                          setActiveImageIndex(0);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-800 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>View ({item.images?.length || 0})</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyLink(item.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                          title="Copy Link to this item"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownloadQr('png', item.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                          title="Download item QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* ======================================================= */}
      {/* FULL-SCREEN MULTI-PHOTO GALLERY & SLIDESHOW LIGHTBOX */}
      {/* ======================================================= */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col">
          {/* Lightbox Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 text-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                {activeItem.category || section.title}
              </span>
              <span className="text-white/30">•</span>
              <h4 className="text-sm sm:text-base font-serif font-black truncate max-w-sm sm:max-w-xl">
                {activeItem.title}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              {activeItem.images && activeItem.images.length > 1 && (
                <button
                  onClick={() => setIsSlideshowPlaying(!isSlideshowPlaying)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    isSlideshowPlaying 
                      ? 'bg-amber-500 text-slate-900 border-amber-400' 
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                  }`}
                  title={isSlideshowPlaying ? 'Pause Slideshow' : 'Play Slideshow'}
                >
                  {isSlideshowPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Autoplay</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => handleCopyLink(activeItem.id)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                title="Copy Link"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleDownloadQr('png', activeItem.id)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                title="Download QR"
              >
                <QrCode className="w-4 h-4 text-amber-300" />
              </button>

              <button
                onClick={() => {
                  setActiveItem(null);
                  setIsSlideshowPlaying(false);
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white ml-2"
                title="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Main Stage */}
          <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
            {activeItem.images && activeItem.images.length > 0 ? (
              <div className="relative max-w-5xl max-h-full flex flex-col items-center justify-center">
                <img
                  src={getOptimizedImageUrl(activeItem.images[activeImageIndex]?.url, { width: 1400 })}
                  alt={activeItem.images[activeImageIndex]?.caption || activeItem.title}
                  className="max-h-[68vh] sm:max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl transition-all duration-300"
                />

                {/* Caption Overlay */}
                {activeItem.images[activeImageIndex]?.caption && (
                  <p className="mt-3 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs sm:text-sm font-medium text-center max-w-2xl border border-white/10">
                    {activeItem.images[activeImageIndex]?.caption}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-white/60 text-sm">No photographs uploaded for this item.</div>
            )}

            {/* Left / Right Nav Arrows */}
            {activeItem.images && activeItem.images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setActiveImageIndex((prev) => (prev === 0 ? activeItem.images.length - 1 : prev - 1))
                  }
                  className="absolute left-4 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 transition-colors"
                  title="Previous Photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() =>
                    setActiveImageIndex((prev) => (prev + 1) % activeItem.images.length)
                  }
                  className="absolute right-4 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 transition-colors"
                  title="Next Photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Footer & Thumbnail Strip */}
          <div className="px-4 sm:px-6 py-3 border-t border-white/10 bg-black/40 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
            <div className="text-xs text-white/80 space-y-1 max-w-xl">
              <div>
                Photo <span className="font-bold text-white">{activeImageIndex + 1}</span> of{' '}
                <span className="font-bold text-white">{activeItem.images?.length || 0}</span>
                {activeItem.studentName && (!activeItem.studentList || activeItem.studentList.length === 0) && (
                  <span className="ml-2 text-white/60">
                    • Student: <strong className="text-white">{activeItem.studentName}</strong>
                    {activeItem.studentClass && <span className="text-white/50"> ({activeItem.studentClass})</span>}
                  </span>
                )}
              </div>
              {activeItem.studentList && activeItem.studentList.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1">
                  <span className="text-amber-300 font-bold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Students:
                  </span>
                  {activeItem.studentList.map((st, sIdx) => (
                    <span
                      key={sIdx}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white/10 text-white rounded border border-white/20 font-medium"
                    >
                      <span className="text-amber-100 font-semibold">{st.name}</span>
                      {st.class && <span className="text-white/60">({st.class})</span>}
                      {st.rank && <span className="text-amber-300 font-bold">• {st.rank}</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnails row */}
            {activeItem.images && activeItem.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto max-w-md pb-1">
                {activeItem.images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                      activeImageIndex === idx
                        ? 'border-amber-400 scale-105 shadow-md'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={getOptimizedImageUrl(img.url, { width: 100, height: 100, crop: 'thumb' })}
                      alt={`Thumb ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-700">
            Irshad English School • Digital Content Repository & Exhibition
          </p>
          <p className="text-[11px] text-slate-400">
            Affiliated to CBSE, New Delhi • Managed by Irshad Educational Trust, Malappuram
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-blue-700 font-bold hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to School Main Exhibition</span>
            </Link>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <span>Watermark: Designed & Developed by</span>
            <strong className="text-slate-700 font-bold">Shiyas Ahmad</strong>
            <span>•</span>
            <a href="tel:+917012587705" className="text-blue-600 font-medium hover:underline">
              Ph: 7012587705
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
