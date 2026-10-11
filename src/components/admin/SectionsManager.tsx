'use client';

import React, { useState } from 'react';
import { SchoolSection } from '../../types/schoolCms';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Share2, 
  QrCode, 
  Download, 
  ExternalLink, 
  Check, 
  X, 
  Layers, 
  Trophy, 
  Palette, 
  Calendar, 
  GraduationCap, 
  Lightbulb, 
  Medal, 
  Building2, 
  Sparkles,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';
import { downloadQrCodePng, downloadQrCodeSvg, copyToClipboard } from '../../lib/qrHelper';
import { uploadImageToCloudinary, getOptimizedImageUrl } from '../../lib/cloudinary';

interface SectionsManagerProps {
  sections: SchoolSection[];
  onUpdateSections: (sections: SchoolSection[]) => void;
  onSelectSectionForItems?: (sectionSlug: string) => void;
  showToast: (msg: string) => void;
}

const SECTION_ICONS = [
  { name: 'Trophy', icon: Trophy },
  { name: 'Palette', icon: Palette },
  { name: 'Calendar', icon: Calendar },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Lightbulb', icon: Lightbulb },
  { name: 'Medal', icon: Medal },
  { name: 'Building2', icon: Building2 },
  { name: 'Sparkles', icon: Sparkles },
];

export const SectionsManager: React.FC<SectionsManagerProps> = ({
  sections,
  onUpdateSections,
  onSelectSectionForItems,
  showToast,
}) => {
  const [editingSection, setEditingSection] = useState<SchoolSection | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [isUploadingCover, setIsUploadingCover] = useState<boolean>(false);
  const [newCategoryInput, setNewCategoryInput] = useState<string>('');
  const [newTagInput, setNewTagInput] = useState<string>('');

  // Handle URL slug generation from title
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleCreateNew = () => {
    const newSec: SchoolSection = {
      id: `sec-${Date.now()}`,
      slug: `section-${Date.now()}`,
      title: '',
      subtitle: '',
      description: '',
      coverImage: '/Irshad School.jpg',
      icon: 'Palette',
      order: sections.length + 1,
      isPublished: true,
      isArchived: false,
      categories: ['General'],
      tags: ['Student'],
      enableCategories: true,
      enableTags: true,
      slideshowAutoPlay: true,
      slideshowInterval: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingSection(newSec);
    setIsCreatingNew(true);
  };

  const handleSaveSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection || !editingSection.title.trim()) {
      alert('Section title is required');
      return;
    }

    const slug = editingSection.slug.trim() || slugify(editingSection.title);

    // Check slug collision
    const slugCollision = sections.find(
      (s) => s.slug === slug && s.id !== editingSection.id
    );
    if (slugCollision) {
      alert(`The URL slug "${slug}" is already in use by another section. Please choose a unique slug.`);
      return;
    }

    const updatedSection: SchoolSection = {
      ...editingSection,
      slug,
      updatedAt: new Date().toISOString(),
    };

    let newSections: SchoolSection[];
    if (isCreatingNew) {
      newSections = [...sections, { ...updatedSection, order: sections.length + 1 }];
      showToast(`Section "${updatedSection.title}" created successfully!`);
    } else {
      newSections = sections.map((s) => (s.id === updatedSection.id ? updatedSection : s));
      showToast(`Section "${updatedSection.title}" updated successfully!`);
    }

    onUpdateSections(newSections);
    setEditingSection(null);
    setIsCreatingNew(false);
  };

  const handleDeleteSection = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete or archive section "${title}"?`)) {
      const updated = sections.filter((s) => s.id !== id).map((s, idx) => ({ ...s, order: idx + 1 }));
      onUpdateSections(updated);
      showToast(`Section "${title}" removed.`);
    }
  };

  const handleTogglePublish = (id: string) => {
    const updated = sections.map((s) => (s.id === id ? { ...s, isPublished: !s.isPublished } : s));
    onUpdateSections(updated);
    const target = updated.find((s) => s.id === id);
    showToast(`Section status set to ${target?.isPublished ? 'Published' : 'Hidden'}.`);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...sections];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    newItems.forEach((s, i) => (s.order = i + 1));
    onUpdateSections(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const newItems = [...sections];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    newItems.forEach((s, i) => (s.order = i + 1));
    onUpdateSections(newItems);
  };

  const handleCopyLink = async (slug: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/school/${slug}`;
    const ok = await copyToClipboard(url);
    if (ok) {
      showToast(`Copied public URL: ${url}`);
    } else {
      alert(`Public URL: ${url}`);
    }
  };

  const handleDownloadQr = async (slug: string, title: string, format: 'png' | 'svg') => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/school/${slug}`;
    const filename = `IES_${slug}_QR.${format}`;
    if (format === 'svg') {
      await downloadQrCodeSvg(url, filename);
    } else {
      await downloadQrCodePng(url, filename);
    }
    showToast(`Downloaded ${format.toUpperCase()} QR code for ${title}`);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingSection) return;
    setIsUploadingCover(true);
    try {
      const res = await uploadImageToCloudinary(file, 'section-covers');
      setEditingSection({ ...editingSection, coverImage: res.url });
      showToast(res.isCloudinary ? 'Cover uploaded to Cloudinary!' : 'Cover saved locally.');
    } catch {
      showToast('Error uploading cover image.');
    } finally {
      setIsUploadingCover(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with prominent Create New Section Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-700" />
            <h3 className="text-base font-serif font-black text-[#0f2b5c]">
              Dynamic School Sections Management
            </h3>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Create, rename, reorder, customize categories, and download QR codes for independent school sections.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0f2b5c] to-blue-700 hover:from-blue-900 hover:to-blue-800 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>Create New Section</span>
        </button>
      </div>

      {/* Sections Table / Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section, idx) => (
          <div
            key={section.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                    {section.order}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-[#0f2b5c] truncate">
                      {section.title}
                    </h4>
                    <span className="text-[11px] font-mono text-blue-700 truncate block">
                      /school/{section.slug}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTogglePublish(section.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                      section.isPublished
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {section.isPublished ? 'Live' : 'Hidden'}
                  </button>
                </div>
              </div>

              {section.subtitle && (
                <p className="text-xs text-slate-500 font-medium line-clamp-1">
                  {section.subtitle}
                </p>
              )}

              {section.description && (
                <p className="text-xs text-slate-600 line-clamp-2">
                  {section.description}
                </p>
              )}

              {/* Category tags preview */}
              {section.categories && section.categories.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {section.categories.slice(0, 4).map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-semibold border border-blue-100"
                    >
                      {c}
                    </span>
                  ))}
                  {section.categories.length > 4 && (
                    <span className="px-1.5 py-0.5 text-[10px] text-slate-400">
                      +{section.categories.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleMoveUp(idx)}
                  disabled={idx === 0}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 text-slate-600"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleMoveDown(idx)}
                  disabled={idx === sections.length - 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 text-slate-600"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleCopyLink(section.slug)}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold border border-blue-200 flex items-center gap-1"
                  title="Copy permanent public URL"
                >
                  <Share2 className="w-3 h-3 text-blue-700" />
                  <span>Copy Link</span>
                </button>
                <button
                  onClick={() => handleDownloadQr(section.slug, section.title, 'png')}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 flex items-center gap-1"
                  title="Download instant QR code for print"
                >
                  <QrCode className="w-3 h-3 text-amber-700" />
                  <span>QR Code</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                {onSelectSectionForItems && (
                  <button
                    onClick={() => onSelectSectionForItems(section.slug)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                  >
                    Manage Items
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingSection(section);
                    setIsCreatingNew(false);
                  }}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-blue-700"
                  title="Edit Section Settings"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteSection(section.id, section.title)}
                  className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600"
                  title="Delete Section"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <a
                  href={`/school/${section.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                  title="View Public Page"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ======================================================= */}
      {/* EDIT / CREATE SECTION MODAL */}
      {/* ======================================================= */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
              <h3 className="text-base font-serif font-black text-[#0f2b5c]">
                {isCreatingNew ? 'Create New School Section' : `Edit Section: ${editingSection.title}`}
              </h3>
              <button
                onClick={() => setEditingSection(null)}
                className="p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSection} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Section Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Student Hobbies"
                    value={editingSection.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setEditingSection({
                        ...editingSection,
                        title,
                        slug: isCreatingNew ? slugify(title) : editingSection.slug,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Public URL Slug *
                  </label>
                  <div className="flex items-center">
                    <span className="px-2.5 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-slate-500 font-mono text-[11px]">
                      /school/
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="student-hobbies"
                      value={editingSection.slug}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection,
                          slug: slugify(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-r-lg border border-slate-300 bg-white text-slate-900 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Creativity Beyond the Classroom"
                  value={editingSection.subtitle || ''}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, subtitle: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. A showcase of students' artistic talents, creative interests, and personal projects."
                  value={editingSection.description || ''}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              {/* Cover Image with Cloudinary Upload */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cover Image URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingSection.coverImage || ''}
                    onChange={(e) =>
                      setEditingSection({ ...editingSection, coverImage: e.target.value })
                    }
                    placeholder="/Irshad School.jpg or https://res.cloudinary.com/..."
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                  />
                  <label className="px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold cursor-pointer border border-blue-200 flex items-center gap-1.5 flex-shrink-0">
                    <Upload className="w-3.5 h-3.5 text-blue-700" />
                    <span>{isUploadingCover ? 'Uploading...' : 'Upload Cover'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Categories Management for this section */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-slate-800 block">
                      Section Categories
                    </label>
                    <span className="text-slate-500 text-[11px]">
                      Items in this section can be tagged with these categories (e.g. Drawing, Painting, Music).
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingSection.enableCategories}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection,
                          enableCategories: e.target.checked,
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="text-[11px] font-bold text-slate-700">Enable in UI</span>
                  </label>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg bg-white border border-slate-200">
                  {editingSection.categories?.map((cat, cIdx) => (
                    <span
                      key={cIdx}
                      className="px-2 py-1 rounded bg-blue-100 text-blue-900 font-semibold text-[11px] flex items-center gap-1"
                    >
                      <span>{cat}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingSection.categories.filter((_, i) => i !== cIdx);
                          setEditingSection({ ...editingSection, categories: updated });
                        }}
                        className="text-blue-500 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add category (e.g. Fine Arts, Photography, Robotics)..."
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newCategoryInput.trim()) {
                          setEditingSection({
                            ...editingSection,
                            categories: [...(editingSection.categories || []), newCategoryInput.trim()],
                          });
                          setNewCategoryInput('');
                        }
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newCategoryInput.trim()) {
                        setEditingSection({
                          ...editingSection,
                          categories: [...(editingSection.categories || []), newCategoryInput.trim()],
                        });
                        setNewCategoryInput('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#0f2b5c] text-white font-bold text-xs"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Status toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSection.isPublished}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        isPublished: e.target.checked,
                      })
                    }
                    className="rounded text-blue-600 w-4 h-4"
                  />
                  <span className="font-bold text-slate-800">Publish Immediately</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSection.slideshowAutoPlay}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        slideshowAutoPlay: e.target.checked,
                      })
                    }
                    className="rounded text-blue-600 w-4 h-4"
                  />
                  <span className="font-bold text-slate-800">Enable Gallery Slideshow Autoplay</span>
                </label>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0f2b5c] hover:bg-blue-900 text-white font-bold"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
