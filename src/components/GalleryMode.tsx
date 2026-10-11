import React, { useState, useMemo } from 'react';
import { AchievementRecord } from '../types/achievement';
import { Search, Filter, Award, Calendar, Users, Eye, Play, X, Download, ZoomIn, ArrowLeft, Volume2, VolumeX, CheckCircle2 } from 'lucide-react';

interface GalleryModeProps {
  achievements: AchievementRecord[];
  onOpenPresentationAt: (index: number) => void;
  onBackToHome?: () => void;
  isAudioPlaying?: boolean;
  isAudioMuted?: boolean;
  onToggleAudio?: () => void;
}

export const GalleryMode: React.FC<GalleryModeProps> = ({
  achievements,
  onOpenPresentationAt,
  onBackToHome,
  isAudioPlaying,
  isAudioMuted,
  onToggleAudio,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalItem, setActiveModalItem] = useState<AchievementRecord | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Extract categories dynamically with counts
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = { All: achievements.length };
    achievements.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [achievements]);

  // Filtered list
  const filteredAchievements = useMemo(() => {
    return achievements.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchAward = (item.award || '').toLowerCase().includes(q);
      const matchEvent = (item.event || '').toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      const matchStudent = (item.studentList || []).some(
        (s) => s.name.toLowerCase().includes(q) || (s.details || '').toLowerCase().includes(q)
      );

      return matchTitle || matchAward || matchEvent || matchDesc || matchStudent;
    });
  }, [achievements, selectedCategory, searchQuery]);

  const openModal = (item: AchievementRecord) => {
    setActiveModalItem(item);
    setModalImage(item.image);
  };

  const closeModal = () => {
    setActiveModalItem(null);
    setModalImage(null);
  };

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 text-slate-900">
      
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-[#0f2b5c] text-xs font-bold transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-blue-600" />
          <span>Return to Home</span>
        </button>

        <div className="flex items-center gap-2">
          {onToggleAudio && (
            <button
              onClick={onToggleAudio}
              className="p-2 rounded-xl bg-white border border-slate-200 text-blue-900 hover:border-blue-400 text-xs font-medium shadow-xs"
              title="Toggle Music"
            >
              {isAudioPlaying && !isAudioMuted ? <Volume2 className="w-4 h-4 text-blue-600 animate-pulse" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
          )}

          <button
            onClick={() => onOpenPresentationAt(0)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0f2b5c] to-[#1e40af] text-white font-bold text-xs shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Slideshow</span>
          </button>
        </div>
      </div>

      {/* Header and Search Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold uppercase tracking-wider mb-2 shadow-2xs">
            Interactive Achievement Gallery
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#0f2b5c]">
            Exhibition Catalog
            <span className="text-blue-700 font-sans text-base font-semibold ml-3">
              ({filteredAchievements.length} of {achievements.length} records)
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
            Browse all authenticated achievement posters, certificates, sports medals, and examination toppers. Click any card for complete details.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student, award, event..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-4 h-4 text-blue-700 flex-shrink-0 mr-1" />
        {Object.entries(categoriesWithCounts).map(([cat, count]) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-[#0f2b5c] text-white font-bold shadow-sm'
                : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
            }`}
          >
            <span>{cat}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Achievements Card Grid */}
      {filteredAchievements.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-slate-500 text-sm">No achievement records match your search criteria.</p>
          <button
            onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
            className="mt-3 px-4 py-2 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold hover:bg-blue-100"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAchievements.map((item) => {
            const originalIndex = achievements.findIndex((a) => a.id === item.id);
            return (
              <div
                key={item.id}
                onClick={() => openModal(item)}
                className="group cursor-pointer rounded-2xl bg-white border border-slate-200/90 hover:border-blue-400 overflow-hidden shadow-xs hover:shadow-xl hover:shadow-blue-900/10 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Poster Preview with Ambient Blurred Background & Fit */}
                <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                  {/* Ambient blurred background */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                    <img
                      src={item.image}
                      alt=""
                      className="w-full h-full object-cover blur-xl scale-125 opacity-25"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-white/60" />
                  </div>

                  <img
                    src={item.image}
                    alt={item.title}
                    className="relative z-10 w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500 select-none"
                    loading="lazy"
                  />
                  
                  {/* Badge */}
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-white/90 text-blue-900 border border-blue-200 shadow-xs backdrop-blur-xs">
                    {item.badge || 'VERIFIED'}
                  </div>

                  {/* Order number */}
                  <div className="absolute top-2.5 left-2.5 w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-mono font-bold text-blue-900 flex items-center justify-center shadow-xs">
                    {originalIndex + 1}
                  </div>

                  {/* Hover Quick View Overlay */}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-2xs">
                    <span className="px-3 py-1.5 rounded-lg bg-[#0f2b5c] text-white text-xs font-bold flex items-center gap-1.5 shadow-lg">
                      <Eye className="w-3.5 h-3.5" /> Inspect Details
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700">
                      {item.category}
                    </span>
                    <h3 className="text-sm font-serif font-bold text-[#0f2b5c] group-hover:text-blue-800 transition-colors line-clamp-2 mt-0.5">
                      {item.title}
                    </h3>
                  </div>

                  {/* Award and Event snippet */}
                  <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    {item.award && (
                      <div className="flex items-center gap-1.5 text-amber-800 font-semibold truncate">
                        <Award className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span className="truncate">{item.award}</span>
                      </div>
                    )}
                    {item.featuredStudent && (
                      <div className="flex items-center gap-1.5 text-slate-700 truncate">
                        <Users className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <span className="truncate font-medium">{item.featuredStudent}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Trigger */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{item.academicYear}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPresentationAt(originalIndex);
                      }}
                      className="text-blue-800 hover:text-blue-950 flex items-center gap-1 font-bold"
                    >
                      <Play className="w-3 h-3 fill-current" /> Play
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Quick-View Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden text-slate-900">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200">
                  {activeModalItem.category}
                </span>
                <h2 className="text-base sm:text-lg font-serif font-black text-[#0f2b5c] truncate">
                  {activeModalItem.title}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: Poster Image */}
              <div className="md:col-span-6 flex flex-col items-center">
                <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] max-h-[55vh] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shadow-md">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
                    <img
                      key={`modal-blur-${modalImage || activeModalItem.image}`}
                      src={modalImage || activeModalItem.image}
                      alt=""
                      className="w-full h-full object-cover blur-2xl scale-125 opacity-25"
                    />
                    <div className="absolute inset-0 bg-white/70" />
                  </div>

                  <img
                    key={`modal-img-${modalImage || activeModalItem.image}`}
                    src={modalImage || activeModalItem.image}
                    alt={activeModalItem.title}
                    className="relative z-10 max-h-full max-w-full w-auto h-auto object-contain p-2 select-none"
                  />
                </div>

                {/* Alternate Photos Switcher */}
                {activeModalItem.galleryImages && activeModalItem.galleryImages.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setModalImage(activeModalItem.image)}
                      className={`px-2.5 py-1 rounded text-xs border font-bold ${
                        modalImage === activeModalItem.image ? 'border-blue-600 text-white bg-[#0f2b5c]' : 'border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      Poster
                    </button>
                    {activeModalItem.galleryImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setModalImage(img)}
                        className={`px-2.5 py-1 rounded text-xs border font-bold ${
                          modalImage === img ? 'border-blue-600 text-white bg-[#0f2b5c]' : 'border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        Photo {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Complete Verified Information */}
              <div className="md:col-span-6 space-y-4">
                
                {/* Meta list */}
                <div className="space-y-2 text-xs">
                  {activeModalItem.award && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <span className="text-amber-800 text-[10px] uppercase font-bold block">Award / Honors</span>
                      <span className="text-amber-950 font-bold text-sm">{activeModalItem.award}</span>
                    </div>
                  )}

                  {activeModalItem.event && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Event / Competition</span>
                      <span className="text-[#0f2b5c] font-semibold">{activeModalItem.event}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Academic Year</span>
                      <span className="text-slate-800 font-semibold">{activeModalItem.academicYear}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                      <span className="text-emerald-800 text-[10px] uppercase font-bold block">Status</span>
                      <span className="text-emerald-900 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Authenticated</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-1">
                    Achievement Summary
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {activeModalItem.description}
                  </p>
                </div>

                {/* Student Achievers */}
                {activeModalItem.studentList && activeModalItem.studentList.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-1.5 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>Student Achievers ({activeModalItem.studentList.length})</span>
                    </h4>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {activeModalItem.studentList.map((stu, i) => (
                        <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                          <span className="font-bold text-slate-800">{stu.name}</span>
                          <div className="flex items-center gap-1">
                            {stu.rank && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                                {stu.rank}
                              </span>
                            )}
                            {stu.score && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-mono font-bold">
                                {stu.score}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modal Footer CTA */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      const idx = achievements.findIndex((a) => a.id === activeModalItem.id);
                      closeModal();
                      onOpenPresentationAt(idx >= 0 ? idx : 0);
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0f2b5c] to-[#1e40af] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>View in Inspection Presentation Mode</span>
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
