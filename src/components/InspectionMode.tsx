'use client';

import React, { useState, useMemo } from 'react';
import { AchievementRecord } from '../types/achievement';
import { EXHIBITION_CONFIG } from '../data/initialAchievements';
import { FileText, Printer, CheckCircle, Search, Filter, Download, ExternalLink, ShieldCheck, Award, Eye, ArrowLeft } from 'lucide-react';
import { exportToCSV } from '../lib/storage';

interface InspectionModeProps {
  achievements: AchievementRecord[];
  onSelectAchievement: (index: number) => void;
  onBackToHome?: () => void;
}

export const InspectionMode: React.FC<InspectionModeProps> = ({
  achievements,
  onSelectAchievement,
  onBackToHome,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter records
  const filteredRecords = useMemo(() => {
    return achievements.filter((item) => {
      const matchCat = filterCategory === 'All' || item.category === filterCategory;
      if (!matchCat) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchAward = (item.award || '').toLowerCase().includes(q);
      const matchEvent = (item.event || '').toLowerCase().includes(q);
      const matchStudents = (item.studentList || []).some(
        (s) => s.name.toLowerCase().includes(q) || (s.details || '').toLowerCase().includes(q)
      );
      return matchTitle || matchAward || matchEvent || matchStudents;
    });
  }, [achievements, filterCategory, searchTerm]);

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle CSV export
  const handleExportCSV = () => {
    const csv = exportToCSV(achievements);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `IES_Achievements_Inspection_Dossier_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 text-slate-900">
      
      {/* Top Navigation Row */}
      {onBackToHome && (
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-[#0f2b5c] text-xs font-bold transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600" />
            <span>Return to Home</span>
          </button>
        </div>
      )}

      {/* Formal Header Dossier Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold font-mono uppercase tracking-wider">
                FORMAL INSPECTION DOSSIER
              </span>
              <span className="flex items-center gap-1 text-emerald-700 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% Authenticated Records
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#0f2b5c]">
              Achievement Presentation (2024 - 2026)
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Curated for the Official School Inspection Committee. Contains complete student rosters, CBSE board metrics, state-level ranks, talent search citations, and primary evidence cross-references.
            </p>
          </div>

          {/* Action buttons: Print & CSV Export */}
          <div className="flex items-center gap-3 no-print">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>Print Dossier</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0f2b5c] to-[#1e40af] text-white text-xs font-bold shadow-md hover:scale-102 active:scale-98 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV Audit</span>
            </button>
          </div>
        </div>

        {/* Institution Metadata Summary */}
        <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px] font-semibold">School Institution</span>
            <span className="font-bold text-[#0f2b5c]">{EXHIBITION_CONFIG.schoolName}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px] font-semibold">Affiliation Details</span>
            <span className="font-bold text-blue-900">{EXHIBITION_CONFIG.affiliationNumber}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px] font-semibold">Campus Location</span>
            <span className="font-bold text-slate-800">Melattur, Malappuram (679326)</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px] font-semibold">Verified Records Count</span>
            <span className="font-bold text-slate-800">{achievements.length} Achievement Sets</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between no-print">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-blue-700 flex-shrink-0" />
          {['All', 'Academic Excellence & Board Examinations', 'Science & Talent Olympiads', 'Arts, Literature & Quizzes', 'Sports, Athletics & Martial Arts', 'Institutional Excellence & Accreditations'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterCategory === cat
                  ? 'bg-[#0f2b5c] text-white font-bold shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
              }`}
            >
              {cat === 'All' ? 'All Records' : cat.split(' ')[0]}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit records..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-xs"
          />
        </div>
      </div>

      {/* Structured Formal Inspection Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Achievement Title & Category</th>
                <th className="py-3 px-4">Award & Event</th>
                <th className="py-3 px-4">Featured Achievers</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredRecords.map((item) => {
                const isExpanded = expandedId === item.id;
                const originalIndex = achievements.findIndex((a) => a.id === item.id);
                return (
                  <React.Fragment key={item.id}>
                    <tr 
                      className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${
                        isExpanded ? 'bg-blue-50/60' : ''
                      }`}
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    >
                      <td className="py-4 px-4 font-mono font-bold text-blue-900 text-center">
                        {String(item.order).padStart(2, '0')}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-[#0f2b5c] text-sm font-serif">
                          {item.title}
                        </div>
                        <span className="inline-block mt-0.5 px-2 py-0.2 rounded text-[10px] font-semibold bg-blue-50 border border-blue-200 text-blue-900">
                          {item.category}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-amber-900">{item.award}</div>
                        <div className="text-slate-600 text-[11px]">{item.event}</div>
                        <div className="text-slate-400 text-[10px]">{item.academicYear}</div>
                      </td>

                      <td className="py-4 px-4 max-w-xs">
                        {item.featuredStudent ? (
                          <div className="font-bold text-slate-900">{item.featuredStudent}</div>
                        ) : item.studentList && item.studentList.length > 0 ? (
                          <div className="text-slate-700 text-[11px]">
                            {item.studentList.slice(0, 3).map((s) => s.name).join(', ')}
                            {item.studentList.length > 3 && (
                              <span className="text-blue-700 font-bold ml-1">
                                +{item.studentList.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Institutional Team Record</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right no-print">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectAchievement(originalIndex);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-[11px] border border-blue-200 flex items-center gap-1 shadow-2xs"
                          >
                            <Eye className="w-3 h-3" /> View Slide
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row for Inspection Details */}
                    {isExpanded && (
                      <tr className="bg-slate-50 border-y border-slate-200">
                        <td colSpan={6} className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            
                            {/* Evidence Image Thumbnail */}
                            <div className="md:col-span-3">
                              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white aspect-[3/4] flex items-center justify-center shadow-md p-1">
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="relative z-10 w-full h-full object-contain"
                                />
                              </div>
                              <span className="text-[10px] text-slate-500 text-center block mt-1 font-medium">
                                Primary Source: Official School Poster Archive
                              </span>
                            </div>

                            {/* Detailed Breakdown */}
                            <div className="md:col-span-9 space-y-4">
                              <div>
                                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
                                  Full Description & Inspection Notes
                                </h4>
                                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal bg-white p-3.5 rounded-xl border border-slate-200">
                                  {item.description}
                                </p>
                              </div>

                              {/* Student Achiever Roster */}
                              {item.studentList && item.studentList.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Complete Student Marks & Rank Roster
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {item.studentList.map((st, sIdx) => (
                                      <div key={sIdx} className="p-2 rounded-lg bg-white border border-slate-200 text-xs flex justify-between items-center shadow-2xs">
                                        <div>
                                          <div className="font-bold text-[#0f2b5c]">{st.name}</div>
                                          {st.class && <div className="text-[10px] text-slate-500">{st.class}</div>}
                                        </div>
                                        <div className="text-right">
                                          {st.score && <div className="text-blue-900 font-bold font-mono">{st.score}</div>}
                                          {st.rank && <div className="text-amber-800 text-[10px] font-bold">{st.rank}</div>}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
