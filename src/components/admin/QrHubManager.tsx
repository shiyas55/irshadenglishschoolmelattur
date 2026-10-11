'use client';

import React, { useState, useEffect } from 'react';
import { SchoolSection, SectionContentItem } from '../../types/schoolCms';
import { 
  QrCode, 
  Download, 
  Share2, 
  ExternalLink, 
  Check, 
  Sparkles, 
  Search,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { generateQrDataUrl, downloadQrCodePng, downloadQrCodeSvg, copyToClipboard } from '../../lib/qrHelper';

interface QrHubManagerProps {
  sections: SchoolSection[];
  items: SectionContentItem[];
  showToast: (msg: string) => void;
}

interface QrEntry {
  id: string;
  type: 'section' | 'item';
  title: string;
  subtitle?: string;
  slug: string;
  url: string;
  isPublished: boolean;
  qrPreview?: string;
}

export const QrHubManager: React.FC<QrHubManagerProps> = ({
  sections,
  items,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'sections' | 'items'>('sections');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [qrPreviews, setQrPreviews] = useState<Record<string, string>>({});

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://irshadenglishschool.edu';

  // Build list of Section QR entries
  const sectionEntries: QrEntry[] = sections
    .filter((s) => s.isPublished)
    .map((s) => ({
      id: s.id,
      type: 'section',
      title: s.title,
      subtitle: s.subtitle || `/${s.slug}`,
      slug: s.slug,
      url: `${origin}/school/${s.slug}`,
      isPublished: s.isPublished,
    }));

  // Build list of Item QR entries
  const itemEntries: QrEntry[] = items
    .filter((it) => it.isPublished)
    .map((it) => ({
      id: it.id,
      type: 'item',
      title: it.title,
      subtitle: `${it.sectionSlug} • ${it.studentName || 'Exhibit'}`,
      slug: it.sectionSlug,
      url: `${origin}/school/${it.sectionSlug}?item=${it.id}`,
      isPublished: it.isPublished,
    }));

  const activeEntries = activeTab === 'sections' ? sectionEntries : itemEntries;

  const filteredEntries = activeEntries.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return e.title.toLowerCase().includes(q) || (e.subtitle || '').toLowerCase().includes(q);
  });

  // Pre-generate low-res QR preview thumbnails for visible entries
  useEffect(() => {
    filteredEntries.slice(0, 12).forEach(async (entry) => {
      if (!qrPreviews[entry.id]) {
        try {
          const dataUrl = await generateQrDataUrl(entry.url, { width: 180, margin: 1 });
          setQrPreviews((prev) => ({ ...prev, [entry.id]: dataUrl }));
        } catch (err) {
          console.warn('QR preview error:', err);
        }
      }
    });
  }, [filteredEntries]);

  const handleCopyLink = async (url: string, title: string) => {
    const ok = await copyToClipboard(url);
    if (ok) {
      showToast(`Copied public URL for ${title}: ${url}`);
    } else {
      alert(`Public URL: ${url}`);
    }
  };

  const handleDownloadPng = async (url: string, filename: string, title: string) => {
    await downloadQrCodePng(url, `${filename}.png`);
    showToast(`Downloaded Print PNG QR for ${title}`);
  };

  const handleDownloadSvg = async (url: string, filename: string, title: string) => {
    await downloadQrCodeSvg(url, `${filename}.svg`);
    showToast(`Downloaded High-Res SVG QR for ${title}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-serif font-black text-[#0f2b5c]">
              Public QR Code Distribution Hub
            </h3>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Instantly download high-contrast QR codes for any school section or exhibit. Perfect for school notice boards, brochure prints, inspection dossiers, and campus signage.
          </p>
        </div>

        {/* Tab Toggle: Sections vs Exhibits */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('sections')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'sections'
                ? 'bg-[#0f2b5c] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sections ({sectionEntries.length})
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'items'
                ? 'bg-[#0f2b5c] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Individual Exhibits ({itemEntries.length})
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter QR codes by title or slug..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800"
        />
      </div>

      {/* QR Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEntries.map((entry) => {
          const filename = `IES_${entry.slug}_${entry.id}_QR`;
          const previewSrc = qrPreviews[entry.id];

          return (
            <div
              key={entry.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                      {entry.type === 'section' ? 'School Section' : 'Content Exhibit'}
                    </span>
                    <h4 className="text-sm font-bold text-[#0f2b5c] truncate">
                      {entry.title}
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex-shrink-0">
                    Public
                  </span>
                </div>

                {/* QR Code Canvas Preview */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center">
                  {previewSrc ? (
                    <img
                      src={previewSrc}
                      alt={`QR code for ${entry.title}`}
                      className="w-36 h-36 object-contain rounded-lg shadow-2xs bg-white p-1"
                    />
                  ) : (
                    <div className="w-36 h-36 flex items-center justify-center bg-white rounded-lg border border-slate-200">
                      <QrCode className="w-12 h-12 text-slate-300 animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Encoded URL display */}
                <div className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 truncate">
                  {entry.url}
                </div>
              </div>

              {/* Instant Download & Copy Actions */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDownloadPng(entry.url, filename, entry.title)}
                    className="px-3 py-2 rounded-xl bg-[#0f2b5c] hover:bg-blue-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95"
                    title="Print-ready PNG (1024x1024)"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-300" />
                    <span>Print PNG</span>
                  </button>

                  <button
                    onClick={() => handleDownloadSvg(entry.url, filename, entry.title)}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-slate-200"
                    title="Scalable Vector Graphic (SVG)"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-700" />
                    <span>Vector SVG</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => handleCopyLink(entry.url, entry.title)}
                    className="px-2.5 py-1.5 rounded-lg hover:bg-blue-50 text-blue-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>Copy URL</span>
                  </button>

                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Open Public URL</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
