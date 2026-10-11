'use client';

import React, { useState, useMemo } from 'react';
import { SchoolSection, SectionContentItem, SectionItemImage } from '../../types/schoolCms';
import { StudentAchiever } from '../../types/achievement';
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
  Upload, 
  Image as ImageIcon, 
  Tag, 
  User, 
  Users,
  UserPlus,
  Calendar, 
  Award, 
  Layers,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { downloadQrCodePng, downloadQrCodeSvg, copyToClipboard } from '../../lib/qrHelper';
import { uploadImageToCloudinary, getOptimizedImageUrl } from '../../lib/cloudinary';

interface ContentItemsManagerProps {
  sections: SchoolSection[];
  items: SectionContentItem[];
  onUpdateItems: (items: SectionContentItem[]) => void;
  selectedSectionSlug?: string;
  showToast: (msg: string) => void;
}

export const ContentItemsManager: React.FC<ContentItemsManagerProps> = ({
  sections,
  items,
  onUpdateItems,
  selectedSectionSlug,
  showToast,
}) => {
  const [currentSectionSlug, setCurrentSectionSlug] = useState<string>(
    selectedSectionSlug || (sections[0]?.slug ?? 'achievements')
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Edit / Add Item state
  const [editingItem, setEditingItem] = useState<SectionContentItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [tagInput, setTagInput] = useState<string>('');

  // Selected section object
  const currentSection = useMemo(() => {
    return sections.find((s) => s.slug === currentSectionSlug) || sections[0];
  }, [sections, currentSectionSlug]);

  // Items for the selected section
  const sectionItems = useMemo(() => {
    return items.filter((it) => it.sectionSlug === currentSectionSlug);
  }, [items, currentSectionSlug]);

  // Filtered items
  const displayedItems = useMemo(() => {
    return sectionItems.filter((it) => {
      if (categoryFilter !== 'All' && it.category !== categoryFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        it.title.toLowerCase().includes(q) ||
        (it.subtitle || '').toLowerCase().includes(q) ||
        (it.description || '').toLowerCase().includes(q) ||
        (it.studentName || '').toLowerCase().includes(q) ||
        (it.award || '').toLowerCase().includes(q)
      );
    });
  }, [sectionItems, categoryFilter, searchQuery]);

  // Open Create Item modal
  const handleAddNewItem = () => {
    const newItem: SectionContentItem = {
      id: `item-${Date.now()}`,
      sectionId: currentSection?.id || 'sec-default',
      sectionSlug: currentSectionSlug,
      title: '',
      subtitle: '',
      description: '',
      images: [],
      studentName: '',
      studentClass: '',
      studentList: [],
      eventDate: '',
      award: '',
      category: currentSection?.categories?.[0] || 'General',
      tags: [],
      order: sectionItems.length + 1,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingItem(newItem);
    setIsCreatingNew(true);
  };

  // Student Roster Handlers for Multiple Students
  const handleAddStudent = () => {
    if (!editingItem) return;
    const currentList = editingItem.studentList || [];
    setEditingItem({
      ...editingItem,
      studentList: [
        ...currentList,
        { name: '', class: editingItem.studentClass || '', rank: '', details: '' },
      ],
    });
  };

  const handleRemoveStudent = (index: number) => {
    if (!editingItem || !editingItem.studentList) return;
    const updated = editingItem.studentList.filter((_, i) => i !== index);
    setEditingItem({
      ...editingItem,
      studentList: updated,
    });
  };

  const handleUpdateStudent = (index: number, field: keyof StudentAchiever, value: string) => {
    if (!editingItem || !editingItem.studentList) return;
    const updated = [...editingItem.studentList];
    updated[index] = { ...updated[index], [field]: value };
    setEditingItem({
      ...editingItem,
      studentList: updated,
    });
  };

  // Save Item
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.title.trim()) {
      alert('Exhibit Title is required');
      return;
    }

    // Clean up student list (remove empty rows where name is blank)
    const validStudents = (editingItem.studentList || []).filter(
      (s) => s.name && s.name.trim().length > 0
    );

    // Auto-populate or preserve studentName summary for search and backward compatibility
    let summaryStudentName = editingItem.studentName || '';
    if (!summaryStudentName.trim() && validStudents.length > 0) {
      summaryStudentName = validStudents.map((s) => s.name.trim()).join(', ');
    }

    const updatedItem: SectionContentItem = {
      ...editingItem,
      studentName: summaryStudentName,
      studentList: validStudents,
      sectionId: currentSection?.id || editingItem.sectionId,
      sectionSlug: currentSectionSlug,
      updatedAt: new Date().toISOString(),
    };

    let newItems: SectionContentItem[];
    if (isCreatingNew) {
      newItems = [...items, { ...updatedItem, order: sectionItems.length + 1 }];
      showToast(`Exhibit "${updatedItem.title}" created with ${updatedItem.images.length} photos!`);
    } else {
      newItems = items.map((it) => (it.id === updatedItem.id ? updatedItem : it));
      showToast(`Exhibit "${updatedItem.title}" updated successfully.`);
    }

    onUpdateItems(newItems);
    setEditingItem(null);
    setIsCreatingNew(false);
  };

  // Delete Item
  const handleDeleteItem = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete exhibit "${title}"?`)) {
      const updated = items.filter((it) => it.id !== id);
      onUpdateItems(updated);
      showToast(`Exhibit "${title}" deleted.`);
    }
  };

  // Toggle publish
  const handleTogglePublish = (id: string) => {
    const updated = items.map((it) => (it.id === id ? { ...it, isPublished: !it.isPublished } : it));
    onUpdateItems(updated);
    const target = updated.find((it) => it.id === id);
    showToast(`Exhibit status set to ${target?.isPublished ? 'Published' : 'Draft'}.`);
  };

  // Reorder Item Up / Down
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const currentList = [...sectionItems];
    const temp = currentList[index];
    currentList[index] = currentList[index - 1];
    currentList[index - 1] = temp;
    currentList.forEach((it, i) => (it.order = i + 1));

    // Merge back
    const otherItems = items.filter((it) => it.sectionSlug !== currentSectionSlug);
    onUpdateItems([...otherItems, ...currentList]);
  };

  const handleMoveDown = (index: number) => {
    if (index === sectionItems.length - 1) return;
    const currentList = [...sectionItems];
    const temp = currentList[index];
    currentList[index] = currentList[index + 1];
    currentList[index + 1] = temp;
    currentList.forEach((it, i) => (it.order = i + 1));

    const otherItems = items.filter((it) => it.sectionSlug !== currentSectionSlug);
    onUpdateItems([...otherItems, ...currentList]);
  };

  // Multi-photo file upload handler (Cloudinary integrated)
  const handleMultiplePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingItem) return;

    setIsUploadingPhoto(true);
    showToast(`Uploading ${files.length} photo(s) to Cloudinary...`);

    try {
      const uploadPromises = Array.from(files).map((f) => uploadImageToCloudinary(f, 'school-gallery'));
      const results = await Promise.all(uploadPromises);

      const existingImages = editingItem.images || [];
      const newImages: SectionItemImage[] = results.map((res, i) => ({
        id: `img-${Date.now()}-${i}`,
        url: res.url,
        caption: '',
        order: existingImages.length + i + 1,
      }));

      setEditingItem({
        ...editingItem,
        images: [...existingImages, ...newImages],
      });

      const anyCloudinary = results.some((r) => r.isCloudinary);
      showToast(
        anyCloudinary
          ? `Successfully added ${newImages.length} photo(s) to Cloudinary!`
          : `Added ${newImages.length} photo(s) locally.`
      );
    } catch (err) {
      console.error('Error uploading gallery photos:', err);
      showToast('Error uploading photos.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Reorder photos inside an item
  const handleMovePhoto = (pIdx: number, direction: 'up' | 'down') => {
    if (!editingItem) return;
    const imgs = [...editingItem.images];
    if (direction === 'up' && pIdx > 0) {
      const temp = imgs[pIdx];
      imgs[pIdx] = imgs[pIdx - 1];
      imgs[pIdx - 1] = temp;
    } else if (direction === 'down' && pIdx < imgs.length - 1) {
      const temp = imgs[pIdx];
      imgs[pIdx] = imgs[pIdx + 1];
      imgs[pIdx + 1] = temp;
    }
    imgs.forEach((img, i) => (img.order = i + 1));
    setEditingItem({ ...editingItem, images: imgs });
  };

  // Remove photo from item
  const handleRemovePhoto = (pIdx: number) => {
    if (!editingItem) return;
    const imgs = editingItem.images.filter((_, i) => i !== pIdx);
    imgs.forEach((img, i) => (img.order = i + 1));
    setEditingItem({ ...editingItem, images: imgs });
  };

  // Update photo caption
  const handlePhotoCaptionChange = (pIdx: number, caption: string) => {
    if (!editingItem) return;
    const imgs = [...editingItem.images];
    imgs[pIdx] = { ...imgs[pIdx], caption };
    setEditingItem({ ...editingItem, images: imgs });
  };

  const handleCopyItemLink = async (itemId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/school/${currentSectionSlug}?item=${itemId}`;
    const ok = await copyToClipboard(url);
    if (ok) {
      showToast(`Copied exhibit public link: ${url}`);
    } else {
      alert(`Public link: ${url}`);
    }
  };

  const handleDownloadItemQr = async (itemId: string, title: string, format: 'png' | 'svg') => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/school/${currentSectionSlug}?item=${itemId}`;
    const filename = `IES_${currentSectionSlug}_${itemId}_QR.${format}`;
    if (format === 'svg') {
      await downloadQrCodeSvg(url, filename);
    } else {
      await downloadQrCodePng(url, filename);
    }
    showToast(`Downloaded QR code for ${title}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar: Section Selector + Add Exhibit button */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-700" />
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
              Active Section:
            </label>
          </div>
          <select
            value={currentSectionSlug}
            onChange={(e) => {
              setCurrentSectionSlug(e.target.value);
              setCategoryFilter('All');
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-[#0f2b5c] focus:outline-none focus:border-blue-600"
          >
            {sections.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.title} ({items.filter((it) => it.sectionSlug === s.slug).length} items)
              </option>
            ))}
          </select>

          <a
            href={`/school/${currentSectionSlug}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-xl bg-blue-50 text-blue-900 text-xs font-bold hover:bg-blue-100 flex items-center gap-1.5 border border-blue-200 transition-colors"
          >
            <span>Preview Section</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <button
          onClick={handleAddNewItem}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Add Exhibit / Item</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search exhibits in ${currentSection?.title}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
          />
        </div>

        {currentSection?.categories && currentSection.categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setCategoryFilter('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                categoryFilter === 'All'
                  ? 'bg-[#0f2b5c] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {currentSection.categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  categoryFilter === c
                    ? 'bg-[#0f2b5c] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Exhibits Grid */}
      {displayedItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <ImageIcon className="w-12 h-12 mx-auto text-slate-300" />
          <h4 className="text-base font-bold text-[#0f2b5c]">No exhibits in this section yet</h4>
          <p className="text-xs text-slate-500">
            Click &quot;Add Exhibit / Item&quot; to create your first entry and add multiple photographs.
          </p>
          <button
            onClick={handleAddNewItem}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
          >
            Create Exhibit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedItems.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Image Preview Banner */}
              <div className="relative h-44 bg-slate-900 overflow-hidden">
                {item.images && item.images.length > 0 ? (
                  <img
                    src={getOptimizedImageUrl(item.images[0].url, { width: 500 })}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}

                {/* Multiple Photographs Badge */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 flex items-center gap-1.5 shadow-md">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                  <span>{item.images?.length || 0} Photos</span>
                </div>

                {/* Category Badge */}
                {item.category && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-blue-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-white/20">
                    {item.category}
                  </div>
                )}
              </div>

              {/* Content Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-[#0f2b5c] line-clamp-2">
                      {item.title}
                    </h4>
                    <button
                      onClick={() => handleTogglePublish(item.id)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex-shrink-0 ${
                        item.isPublished
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {item.isPublished ? 'Live' : 'Draft'}
                    </button>
                  </div>

                  {item.subtitle && (
                    <p className="text-xs text-slate-500 line-clamp-1">{item.subtitle}</p>
                  )}
                  <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
                </div>

                {/* Student & Event Meta */}
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
                  {item.studentList && item.studentList.length > 0 ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[11px]">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span>{item.studentList.length} Student{item.studentList.length > 1 ? 's' : ''}:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.studentList.slice(0, 5).map((st, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-medium border border-blue-200"
                          >
                            <span>{st.name}</span>
                            {st.class && <span className="text-slate-500">({st.class})</span>}
                            {st.rank && <span className="text-amber-700 font-bold">• {st.rank}</span>}
                          </span>
                        ))}
                        {item.studentList.length > 5 && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                            +{item.studentList.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  ) : item.studentName ? (
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <User className="w-3 h-3 text-blue-600" />
                      <span className="truncate">{item.studentName}</span>
                      {item.studentClass && <span className="text-slate-400">({item.studentClass})</span>}
                    </div>
                  ) : null}

                  {item.award && (
                    <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
                      <Award className="w-3 h-3 text-amber-500" />
                      <span className="truncate">{item.award}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      className="p-1 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-30 text-slate-600"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === displayedItems.length - 1}
                      className="p-1 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-30 text-slate-600"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleCopyItemLink(item.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-blue-700"
                      title="Copy Item Link"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDownloadItemQr(item.id, item.title, 'png')}
                      className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-700"
                      title="Download Item QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setIsCreatingNew(false);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit ({item.images?.length || 0})</span>
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id, item.title)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================= */}
      {/* MULTI-PHOTOGRAPH EXHIBIT ADD / EDIT MODAL */}
      {/* ======================================================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-700" />
                <h3 className="text-base font-serif font-black text-[#0f2b5c]">
                  {isCreatingNew
                    ? `Add Exhibit to ${currentSection?.title}`
                    : `Edit Exhibit: ${editingItem.title}`}
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveItem} className="p-6 overflow-y-auto space-y-5 text-xs">
              
              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Exhibit Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Student Art Exhibition: Expressions & Colors"
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Subtitle / Theme
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Annual Creative Arts Showcase"
                    value={editingItem.subtitle || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, subtitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Full Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Description *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed background, artistic philosophy, event accomplishments, or milestone notes..."
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              {/* ======================================================= */}
              {/* MULTIPLE PHOTOGRAPHS GALLERY SECTION (KEY FEATURE) */}
              {/* ======================================================= */}
              <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-blue-700" />
                      <h4 className="text-sm font-bold text-[#0f2b5c]">
                        Multi-Photograph Gallery ({editingItem.images?.length || 0} Photos)
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Add multiple photographs (such as 7 photos for an exhibition). Caption, reorder, or replace any image dynamically.
                    </p>
                  </div>

                  <label className="px-3 py-2 rounded-xl bg-[#0f2b5c] hover:bg-blue-900 text-white font-bold cursor-pointer flex items-center gap-1.5 flex-shrink-0 shadow-sm transition-all active:scale-95">
                    <Upload className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isUploadingPhoto ? 'Uploading...' : 'Upload Photos (Cloudinary)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleMultiplePhotoUpload}
                      disabled={isUploadingPhoto}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Photos List / Grid */}
                {editingItem.images && editingItem.images.length > 0 ? (
                  <div className="space-y-3">
                    {editingItem.images.map((img, pIdx) => (
                      <div
                        key={img.id || pIdx}
                        className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                      >
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                          #{pIdx + 1}
                        </span>

                        <img
                          src={getOptimizedImageUrl(img.url, { width: 120, height: 120 })}
                          alt={`Exhibit photo ${pIdx + 1}`}
                          className="w-16 h-16 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                        />

                        {/* Caption input */}
                        <div className="flex-1 space-y-1">
                          <label className="block text-[10px] font-bold uppercase text-slate-500">
                            Image Caption / Description
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Oil pastel sunset study by Class IX students"
                            value={img.caption || ''}
                            onChange={(e) => handlePhotoCaptionChange(pIdx, e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800"
                          />
                        </div>

                        {/* Photo controls */}
                        <div className="flex items-center gap-1 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleMovePhoto(pIdx, 'up')}
                            disabled={pIdx === 0}
                            className="p-1 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-30"
                            title="Move Photo Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMovePhoto(pIdx, 'down')}
                            disabled={pIdx === editingItem.images.length - 1}
                            className="p-1 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-30"
                            title="Move Photo Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(pIdx)}
                            className="p-1 rounded-md text-red-600 hover:bg-red-50"
                            title="Remove Photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white rounded-xl border border-dashed border-blue-300 text-slate-500 space-y-2">
                    <ImageIcon className="w-8 h-8 mx-auto text-blue-400" />
                    <p className="font-semibold text-xs text-[#0f2b5c]">No photographs added yet</p>
                    <p className="text-[11px] text-slate-500">
                      Upload one or multiple photographs from your device. Images are uploaded to Cloudinary for instant loading.
                    </p>
                  </div>
                )}
              </div>

              {/* Category, Student, Class, Date & Award Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={editingItem.category || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold"
                  >
                    {currentSection?.categories?.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Student / Team Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Thasna V / Art Collective / Football Team"
                    value={editingItem.studentName || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, studentName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Class / Grade (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Class IX-A"
                    value={editingItem.studentClass || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, studentClass: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Multi-Student Achievers & Participants Roster */}
              <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-700" />
                      <h4 className="font-bold text-sm text-[#0f2b5c]">
                        Multi-Student Roster & Participants
                      </h4>
                      {editingItem.studentList && editingItem.studentList.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-900 font-bold text-xs">
                          {editingItem.studentList.length} Student{editingItem.studentList.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Add multiple students, winners, or team members with their individual classes, ranks, and details.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddStudent}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors self-start sm:self-auto"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ Add Student</span>
                  </button>
                </div>

                {editingItem.studentList && editingItem.studentList.length > 0 ? (
                  <div className="space-y-3">
                    {editingItem.studentList.map((student, sIdx) => (
                      <div
                        key={sIdx}
                        className="bg-white rounded-xl p-3 sm:p-4 border border-blue-200/70 shadow-2xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-xs flex items-center gap-1.5">
                            <User className="w-3 h-3 text-blue-600" />
                            <span>Student #{sIdx + 1}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveStudent(sIdx)}
                            className="p-1 rounded-md text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 text-xs font-semibold"
                            title="Remove this student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                              Student Name *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Muhammed Sinan"
                              value={student.name || ''}
                              onChange={(e) => handleUpdateStudent(sIdx, 'name', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                              Class / Division
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Class X-A / Plus Two"
                              value={student.class || ''}
                              onChange={(e) => handleUpdateStudent(sIdx, 'class', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                              Rank / Role / Prize
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 1st Place / Captain / A+"
                              value={student.rank || ''}
                              onChange={(e) => handleUpdateStudent(sIdx, 'rank', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                              Score / Details (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 98.6% / Gold Medal"
                              value={student.details || student.score || ''}
                              onChange={(e) => handleUpdateStudent(sIdx, 'details', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="pt-1 flex justify-start">
                      <button
                        type="button"
                        onClick={handleAddStudent}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-100/60 font-semibold text-xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Another Student</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center bg-white/80 rounded-xl border border-dashed border-blue-300 text-slate-500 space-y-2">
                    <Users className="w-7 h-7 mx-auto text-blue-400" />
                    <p className="font-semibold text-xs text-[#0f2b5c]">No Individual Students Added</p>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                      For team achievements, group activities, or multiple rank holders, click below to list each student individually.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddStudent}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 font-bold text-xs transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Add First Student</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Event Date / Academic Year
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. December 2025"
                    value={editingItem.eventDate || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, eventDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Award / Honors (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1st Prize / District Champion"
                    value={editingItem.award || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, award: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Tags Input */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tags (comma-separated or enter)
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-300 mb-2 min-h-[36px]">
                  {editingItem.tags?.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-semibold text-[11px] flex items-center gap-1"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingItem.tags.filter((_, i) => i !== idx);
                          setEditingItem({ ...editingItem, tags: updated });
                        }}
                      >
                        <X className="w-3 h-3 text-blue-500 hover:text-red-600" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type a tag and press Enter..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (tagInput.trim()) {
                          setEditingItem({
                            ...editingItem,
                            tags: [...(editingItem.tags || []), tagInput.trim()],
                          });
                          setTagInput('');
                        }
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tagInput.trim()) {
                        setEditingItem({
                          ...editingItem,
                          tags: [...(editingItem.tags || []), tagInput.trim()],
                        });
                        setTagInput('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#0f2b5c] text-white font-bold"
                  >
                    Add Tag
                  </button>
                </div>
              </div>

              {/* Published Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.isPublished}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, isPublished: e.target.checked })
                    }
                    className="rounded text-blue-600 w-4 h-4"
                  />
                  <span className="font-bold text-slate-800">
                    Publish to Public Section Immediately
                  </span>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Save Exhibit ({editingItem.images?.length || 0} Photos)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
