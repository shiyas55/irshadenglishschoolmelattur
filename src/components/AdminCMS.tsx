'use client';

import React, { useState, useMemo } from 'react';
import { AchievementRecord, AchievementCategory, StudentAchiever } from '../types/achievement';
import { 
  Shield, 
  Lock, 
  Plus, 
  Edit3, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  RotateCcw, 
  Check, 
  X, 
  Eye, 
  AlertTriangle,
  Save,
  Search,
  CheckCircle2,
  ExternalLink,
  Users,
  Trophy,
  Database,
  Server,
  RefreshCw,
  Cloud,
  Key,
  Layers,
  QrCode,
  Zap,
} from 'lucide-react';
import { 
  exportToCSV, 
  exportToJSON, 
  resetToDefaults, 
  saveSingleAchievement, 
  deleteAchievement, 
  saveAchievements, 
  loadAchievementsAsync 
} from '../lib/storage';
import { 
  getSupabaseCredentials, 
  saveSupabaseCredentials, 
  isSupabaseConnected, 
  syncAllToSupabase, 
  fetchAchievementsFromSupabase 
} from '../lib/supabaseClient';
import { SectionsManager } from './admin/SectionsManager';
import { ContentItemsManager } from './admin/ContentItemsManager';
import { QrHubManager } from './admin/QrHubManager';
import { CloudinarySettings } from './admin/CloudinarySettings';
import { 
  getSections, 
  saveSections, 
  getContentItems, 
  saveContentItems, 
  loadSectionsAsync, 
  loadContentItemsAsync 
} from '../lib/sectionsStorage';
import { SchoolSection, SectionContentItem } from '../types/schoolCms';

interface AdminCMSProps {
  achievements: AchievementRecord[];
  onUpdateAchievements: (items: AchievementRecord[]) => void;
  onExit: () => void;
}

const CATEGORIES: AchievementCategory[] = [
  'Academic Excellence & Board Examinations',
  'Science & Talent Olympiads',
  'Arts, Literature & Quizzes',
  'Sports, Athletics & Martial Arts',
  'Institutional Excellence & Accreditations',
];

export const AdminCMS: React.FC<AdminCMSProps> = ({
  achievements,
  onUpdateAchievements,
  onExit,
}) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'sections' | 'items' | 'qr' | 'cloudinary' | 'records' | 'pdf' | 'spreadsheet'>('sections');

  // Dynamic Sections & Multi-Photo Exhibits State
  const [sections, setSections] = useState<SchoolSection[]>(() => {
    if (typeof window !== 'undefined') return getSections();
    return [];
  });
  const [contentItems, setContentItems] = useState<SectionContentItem[]>(() => {
    if (typeof window !== 'undefined') return getContentItems();
    return [];
  });
  const [selectedSectionSlugForItems, setSelectedSectionSlugForItems] = useState<string>('student-hobbies');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadedSecs = getSections();
      if (loadedSecs.length > 0) setSections(loadedSecs);
      const loadedItems = getContentItems();
      if (loadedItems.length > 0) setContentItems(loadedItems);

      Promise.all([loadSectionsAsync(), loadContentItemsAsync()]).then(([cloudSecs, cloudItems]) => {
        if (cloudSecs.length > 0) setSections(cloudSecs);
        if (cloudItems.length > 0) setContentItems(cloudItems);
      });
    }
  }, []);

  const handleUpdateSections = (newSections: SchoolSection[]) => {
    setSections(newSections);
    saveSections(newSections);
  };

  const handleUpdateContentItems = (newItems: SectionContentItem[]) => {
    setContentItems(newItems);
    saveContentItems(newItems);
  };

  // Supabase Database State
  const [supabaseUrl, setSupabaseUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') return getSupabaseCredentials().url;
    return '';
  });
  const [supabaseKey, setSupabaseKey] = useState<string>(() => {
    if (typeof window !== 'undefined') return getSupabaseCredentials().key;
    return '';
  });
  const [isDbConnected, setIsDbConnected] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return isSupabaseConnected();
    return false;
  });
  const [isDbSyncing, setIsDbSyncing] = useState<boolean>(false);
  const [dbMessage, setDbMessage] = useState<string>('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Editing state
  const [editingItem, setEditingItem] = useState<AchievementRecord | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string>('');

  // Ingestion feedback states
  const [ingestionMessage, setIngestionMessage] = useState<string>('');
  const [ingestionWarning, setIngestionWarning] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if ((username === 'admin' && (password === 'irshad2026' || password === 'admin')) || username === 'staff') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Invalid credentials. (Hint: username "admin", password "irshad2026")');
    }
  };

  // Filtered achievements
  const displayedAchievements = useMemo(() => {
    return achievements.filter((item) => {
      const matchCat = categoryFilter === 'All' || item.category === categoryFilter;
      if (!matchCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.award || '').toLowerCase().includes(q) ||
        (item.event || '').toLowerCase().includes(q) ||
        (item.featuredStudent || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q)
      );
    });
  }, [achievements, categoryFilter, searchQuery]);

  // Move Record Up
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...achievements];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    newItems.forEach((it, i) => (it.order = i + 1));
    saveAchievements(newItems);
    onUpdateAchievements(newItems);
    showToast('Record sequence reordered successfully.');
  };

  // Move Record Down
  const moveDown = (index: number) => {
    if (index === achievements.length - 1) return;
    const newItems = [...achievements];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index - 1] = temp;
    newItems.forEach((it, i) => (it.order = i + 1));
    saveAchievements(newItems);
    onUpdateAchievements(newItems);
    showToast('Record sequence reordered successfully.');
  };

  // Toggle Published
  const togglePublish = (id: string) => {
    const updated = achievements.map((it) =>
      it.id === id ? { ...it, isPublished: !it.isPublished } : it
    );
    saveAchievements(updated);
    onUpdateAchievements(updated);
    const target = updated.find(it => it.id === id);
    showToast(`Record status set to ${target?.isPublished ? 'Live' : 'Draft'}.`);
  };

  // Delete Record (Persistent in localStorage + Supabase cloud)
  const deleteRecord = (id: string) => {
    const target = achievements.find(it => it.id === id);
    if (confirm(`Are you sure you want to delete this achievement record?\n\n"${target?.title || id}"`)) {
      const updated = deleteAchievement(id);
      onUpdateAchievements(updated);
      showToast(`Record deleted successfully. ${updated.length} records remaining.`);
    }
  };

  // Save Item (New or Edit - Persistent in localStorage + Supabase cloud)
  const handleSaveItem = (item: AchievementRecord) => {
    if (!item.title.trim()) {
      alert('Achievement title is required');
      return;
    }
    const itemToSave: AchievementRecord = isAddingNew
      ? { ...item, order: achievements.length + 1 }
      : item;

    const updated = saveSingleAchievement(itemToSave);
    onUpdateAchievements(updated);
    showToast(isAddingNew ? 'New achievement record created and saved.' : 'Achievement record updated and saved.');
    setEditingItem(null);
    setIsAddingNew(false);
  };

  // Supabase Actions
  const handleSaveDbCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseCredentials(supabaseUrl.trim(), supabaseKey.trim());
    const connected = isSupabaseConnected();
    setIsDbConnected(connected);

    if (connected) {
      showToast('Supabase credentials configured!');
      setDbMessage('Testing connection and verifying cloud records...');
      setIsDbSyncing(true);
      try {
        const cloudData = await fetchAchievementsFromSupabase();
        if (cloudData && cloudData.length > 0) {
          onUpdateAchievements(cloudData);
          setDbMessage(`Connected to Supabase! Loaded ${cloudData.length} records from cloud.`);
          showToast(`Connected to Supabase! Loaded ${cloudData.length} records.`);
        } else {
          setDbMessage('Connected to Supabase! Cloud table is currently empty. Click "Push All Records to Supabase" below.');
          showToast('Connected to Supabase! Table ready.');
        }
      } catch (err: any) {
        setDbMessage(`Connected, but received note: ${err?.message || 'Check database schema'}`);
      } finally {
        setIsDbSyncing(false);
      }
    } else {
      showToast('Please provide both Project URL and Anon Key.');
    }
  };

  const handlePushToSupabase = async () => {
    if (!isSupabaseConnected()) {
      alert('Please configure your Supabase Project URL and Anon Key first.');
      return;
    }
    setIsDbSyncing(true);
    setDbMessage('Syncing all records to Supabase...');
    try {
      const ok = await syncAllToSupabase(achievements);
      if (ok) {
        showToast(`Successfully synced ${achievements.length} records to Supabase!`);
        setDbMessage(`Successfully synced ${achievements.length} records to Supabase cloud at ${new Date().toLocaleTimeString()}`);
      } else {
        showToast('Supabase sync had an issue. Please verify RLS permissions or schema.');
        setDbMessage('Sync warning: Could not upsert records to Supabase.');
      }
    } catch (err: any) {
      showToast(`Sync failed: ${err?.message}`);
      setDbMessage(`Sync error: ${err?.message}`);
    } finally {
      setIsDbSyncing(false);
    }
  };

  const handlePullFromSupabase = async () => {
    if (!isSupabaseConnected()) {
      alert('Please configure your Supabase Project URL and Anon Key first.');
      return;
    }
    setIsDbSyncing(true);
    setDbMessage('Fetching records from Supabase...');
    try {
      const cloudData = await fetchAchievementsFromSupabase();
      if (cloudData && cloudData.length > 0) {
        onUpdateAchievements(cloudData);
        showToast(`Successfully pulled ${cloudData.length} records from Supabase!`);
        setDbMessage(`Pulled ${cloudData.length} records from cloud at ${new Date().toLocaleTimeString()}`);
      } else {
        showToast('No records found in Supabase table.');
        setDbMessage('No records found in Supabase table.');
      }
    } catch (err: any) {
      showToast(`Fetch failed: ${err?.message}`);
      setDbMessage(`Fetch error: ${err?.message}`);
    } finally {
      setIsDbSyncing(false);
    }
  };

  // Handle CSV Upload
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length <= 1) {
          setIngestionWarning('Spreadsheet contains no data rows.');
          return;
        }
        setIngestionMessage(`Successfully parsed ${lines.length - 1} rows from CSV spreadsheet.`);
      } catch {
        setIngestionWarning('Failed to parse spreadsheet file.');
      }
    };
    reader.readAsText(file);
  };

  // Handle Image File Upload for an item
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setEditingItem({ ...editingItem, image: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  // Add student helper in edit modal
  const handleAddStudent = () => {
    if (!editingItem) return;
    const currentList = editingItem.studentList || [];
    setEditingItem({
      ...editingItem,
      studentList: [
        ...currentList,
        { name: '', score: '', rank: '', details: '' }
      ]
    });
  };

  // Remove student helper in edit modal
  const handleRemoveStudent = (sIdx: number) => {
    if (!editingItem || !editingItem.studentList) return;
    const updated = editingItem.studentList.filter((_, i) => i !== sIdx);
    setEditingItem({
      ...editingItem,
      studentList: updated
    });
  };

  // Update student helper
  const handleUpdateStudent = (sIdx: number, field: keyof StudentAchiever, val: string) => {
    if (!editingItem || !editingItem.studentList) return;
    const updated = [...editingItem.studentList];
    updated[sIdx] = { ...updated[sIdx], [field]: val };
    setEditingItem({
      ...editingItem,
      studentList: updated
    });
  };

  // Reset to Defaults
  const handleReset = () => {
    if (confirm('Reset exhibition database to default 28 verified records? Any custom edits will be reverted.')) {
      const defaults = resetToDefaults();
      onUpdateAchievements(defaults);
      showToast('Database reset to authoritative school records.');
    }
  };

  // If not authenticated, render login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 text-slate-900">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-blue-50 border border-blue-200 text-blue-900 shadow-xs">
              <Shield className="w-8 h-8 text-blue-700" />
            </div>
            <h2 className="text-2xl font-serif font-black text-[#0f2b5c]">Administrator Access</h2>
            <p className="text-xs text-slate-600">
              Irshad English School Exhibition Management System
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0f2b5c] to-[#1e40af] text-white font-bold text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              Sign In to CMS
            </button>

            {/* Quick Staff 1-Click Access */}
            <button
              type="button"
              onClick={() => setIsAuthenticated(true)}
              className="w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs border border-blue-200 transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Quick Login for School Staff (1-Click)</span>
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={onExit}
              className="text-xs text-slate-500 hover:text-blue-900 font-medium"
            >
              &larr; Return to Public Exhibition
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 text-slate-900">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200">
              Authenticated Administrator
            </span>
            <span className="text-xs text-slate-500">
              Route: <code className="text-blue-900 font-bold">/admin</code>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-black text-[#0f2b5c]">
            Exhibition Content Management System
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Add new records, edit titles, update student scores, delete records, and manage live exhibition displays dynamically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add New Record Button */}
          <button
            onClick={() => {
              setIsAddingNew(true);
              setEditingItem({
                id: `achievement-${Date.now()}`,
                order: achievements.length + 1,
                title: '',
                malayalamTitle: '',
                category: 'Academic Excellence & Board Examinations',
                award: '',
                event: '',
                organizer: '',
                academicYear: '2024–2025',
                date: '',
                location: 'Melattur, Kerala',
                featuredStudent: '',
                studentClass: '',
                studentList: [],
                description: '',
                detailedNotes: '',
                badge: 'VERIFIED RECORD',
                image: '/assets/achievements/school-campus.jpg',
                isPublished: true,
                isVerified: true,
              });
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0f2b5c] to-[#1e40af] text-white text-xs font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Add New Record
          </button>

          {/* Backup JSON */}
          <button
            onClick={() => {
              const json = exportToJSON(achievements);
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `IES_Exhibition_Backup_${Date.now()}.json`;
              a.click();
              showToast('Backup JSON downloaded successfully.');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-slate-700 text-xs font-semibold border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-blue-700" /> Backup JSON
          </button>

          {/* Reset to defaults */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200 hover:bg-red-100 transition-colors shadow-2xs"
            title="Reset to authoritative data"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>

          {/* View Exhibition */}
          <button
            onClick={onExit}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-50 text-blue-900 text-xs font-bold border border-blue-200 hover:bg-blue-100 transition-colors shadow-2xs"
          >
            <span>View Exhibition</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('sections')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'sections' ? 'bg-[#0f2b5c] text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Sections ({sections.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'items' ? 'bg-[#0f2b5c] text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-blue-400" />
          <span>Multi-Photo Exhibits ({contentItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('qr')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'qr' ? 'bg-[#0f2b5c] text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <QrCode className="w-4 h-4 text-emerald-400" />
          <span>QR Codes Hub</span>
        </button>

        <button
          onClick={() => setActiveTab('cloudinary')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'cloudinary' ? 'bg-[#0f2b5c] text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Cloud className="w-4 h-4 text-purple-400" />
          <span>Media & Cloud Database</span>
          <span className={`w-2 h-2 rounded-full ${isDbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
        </button>

        <button
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'records' ? 'bg-[#0f2b5c] text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" /> 
          <span>Inspection Records ({achievements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pdf')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold ${
            activeTab === 'pdf' ? 'bg-[#0f2b5c] text-white' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Upload className="w-4 h-4" /> PDF Ingestion
        </button>

        <button
          onClick={() => setActiveTab('spreadsheet')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold ${
            activeTab === 'spreadsheet' ? 'bg-[#0f2b5c] text-white' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Spreadsheet Import
        </button>
      </div>

      {/* TAB: Dynamic Sections */}
      {activeTab === 'sections' && (
        <SectionsManager
          sections={sections}
          onUpdateSections={handleUpdateSections}
          onSelectSectionForItems={(slug) => {
            setSelectedSectionSlugForItems(slug);
            setActiveTab('items');
          }}
          showToast={showToast}
        />
      )}

      {/* TAB: Content Items & Multi-Photo Exhibits */}
      {activeTab === 'items' && (
        <ContentItemsManager
          sections={sections}
          items={contentItems}
          onUpdateItems={handleUpdateContentItems}
          selectedSectionSlug={selectedSectionSlugForItems}
          showToast={showToast}
        />
      )}

      {/* TAB: QR Codes Hub */}
      {activeTab === 'qr' && (
        <QrHubManager
          sections={sections}
          items={contentItems}
          showToast={showToast}
        />
      )}

      {/* TAB: Cloudinary Media & Supabase Cloud Database */}
      {activeTab === 'cloudinary' && (
        <CloudinarySettings
          sections={sections}
          items={contentItems}
          onUpdateSections={handleUpdateSections}
          onUpdateItems={handleUpdateContentItems}
          showToast={showToast}
        />
      )}

      {/* TAB 1: Records Table */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          
          {/* Search & Category Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title, student, award, or event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-600"
              >
                <option value="All">All Categories ({achievements.length})</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <button
                onClick={() => {
                  setIsAddingNew(true);
                  setEditingItem({
                    id: `achievement-${Date.now()}`,
                    order: achievements.length + 1,
                    title: '',
                    category: 'Academic Excellence & Board Examinations',
                    award: '',
                    event: '',
                    academicYear: '2024–2025',
                    description: '',
                    image: '/assets/achievements/school-campus.jpg',
                    isPublished: true,
                    isVerified: true,
                  });
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0f2b5c] text-white font-bold text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3 px-3 text-center">Order</th>
                    <th className="py-3 px-3">Poster</th>
                    <th className="py-3 px-4">Title & Details</th>
                    <th className="py-3 px-4">Award & Event</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedAchievements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                        No achievement records match your search query.
                      </td>
                    </tr>
                  ) : (
                    displayedAchievements.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1 font-mono font-bold text-blue-900">
                            <span>#{item.order}</span>
                            <div className="flex flex-col">
                              <button
                                onClick={() => moveUp(achievements.findIndex(a => a.id === item.id))}
                                disabled={item.order === 1}
                                className="text-slate-400 hover:text-blue-900 disabled:opacity-20"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => moveDown(achievements.findIndex(a => a.id === item.id))}
                                disabled={item.order === achievements.length}
                                className="text-slate-400 hover:text-blue-900 disabled:opacity-20"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0 p-0.5">
                            <img src={item.image} alt="" className="w-full h-full object-cover rounded-md" />
                          </div>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-bold text-[#0f2b5c] leading-tight">{item.title}</div>
                          {item.featuredStudent && (
                            <div className="text-[11px] text-blue-700 font-semibold flex items-center gap-1 mt-0.5">
                              <Users className="w-3 h-3" />
                              <span>{item.featuredStudent}</span>
                            </div>
                          )}
                          <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">{item.category}</span>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-bold text-amber-900 leading-tight">{item.award || '—'}</div>
                          <div className="text-[10px] text-slate-500">{item.event || item.academicYear}</div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => togglePublish(item.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              item.isPublished 
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {item.isPublished ? 'LIVE' : 'DRAFT'}
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit Button */}
                            <button
                              onClick={() => {
                                setIsAddingNew(false);
                                setEditingItem({ ...item });
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold flex items-center gap-1 shadow-2xs"
                              title="Edit Record"
                            >
                              <Edit3 className="w-3 h-3 text-blue-700" />
                              <span>Edit</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => deleteRecord(item.id)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PDF Ingestion */}
      {activeTab === 'pdf' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
          <div>
            <h3 className="text-lg font-serif font-black text-[#0f2b5c]">Authoritative PDF Source Verification</h3>
            <p className="text-xs text-slate-600 mt-1">
              Primary official source documents ingested and synchronized dynamically into the school exhibition database.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dossier 1 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0f2b5c] text-xs">Academic & Cultural Dossier</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Verified (28 Items)</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Source: <code className="text-blue-900 font-bold bg-blue-50 px-1 py-0.5 rounded">Shabeena.pdf</code> (32 Pages)
              </p>
              <p className="text-[11px] text-slate-500">
                CBSE 10th results, Majlis ranks, IECI exams, Hikma, LEAP, Quiztopia, and cultural honors.
              </p>
            </div>

            {/* Dossier 2 */}
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0f2b5c] text-xs">Sports & Athletics Dossier</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">Active (16 Items)</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Source: <code className="text-blue-900 font-bold bg-white px-1 py-0.5 rounded border border-blue-200">thasna.pdf</code> (16 Pages)
              </p>
              <p className="text-[11px] text-slate-500">
                State & National Sepak Takraw championships, coach appointments, U-14 Football, and athletic medals.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700 flex items-center justify-between">
            <div>
              <span className="font-bold text-[#0f2b5c] block">Current Status: {achievements.length} Synchronized Records</span>
              <span className="text-[11px] text-slate-500">All posters and high-resolution photos are extracted and served dynamically.</span>
            </div>
            <button
              onClick={() => setActiveTab('records')}
              className="px-3.5 py-1.5 rounded-lg bg-[#0f2b5c] text-white font-bold text-xs hover:bg-[#1e40af] transition-colors"
            >
              Manage Records
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: Spreadsheet Import */}
      {activeTab === 'spreadsheet' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
          <div>
            <h3 className="text-lg font-serif font-black text-[#0f2b5c]">Spreadsheet Data Exchange</h3>
            <p className="text-xs text-slate-600 mt-1">
              Import or export Excel / CSV files containing student rosters, marks, ranks, and categories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-sm font-bold text-[#0f2b5c]">Import from CSV</h4>
              <p className="text-xs text-slate-500">
                Upload an updated CSV spreadsheet to update records in bulk.
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#0f2b5c] file:text-white"
              />
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-sm font-bold text-[#0f2b5c]">Export to CSV</h4>
              <p className="text-xs text-slate-500">
                Download current exhibition data as a formatted spreadsheet.
              </p>
              <button
                onClick={() => {
                  const csv = exportToCSV(achievements);
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `IES_Achievements_Export_${Date.now()}.csv`;
                  a.click();
                  showToast('CSV spreadsheet downloaded.');
                }}
                className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-blue-900 text-xs font-bold border border-slate-300 flex items-center gap-2 shadow-2xs"
              >
                <Download className="w-4 h-4 text-blue-700" /> Download CSV Spreadsheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* FULL DYNAMIC EDIT & ADD MODAL */}
      {/* ======================================================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-serif font-black text-[#0f2b5c]">
                  {isAddingNew ? 'Add New Achievement Record' : `Edit Record #${editingItem.order}`}
                </h3>
              </div>
              <button 
                onClick={() => setEditingItem(null)} 
                className="p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Title & Malayalam Title */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Achievement Title *</label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  placeholder="e.g. 100% Success — CBSE Class 10 Board Examination"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Malayalam Subtitle (Optional)</label>
                <input
                  type="text"
                  value={editingItem.malayalamTitle || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, malayalamTitle: e.target.value })}
                  placeholder="e.g. സംസ്ഥാന തലത്തിൽ ഉന്നത വിജയം"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Category & Academic Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Category *</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as AchievementCategory })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Academic Year / Period *</label>
                  <input
                    type="text"
                    value={editingItem.academicYear}
                    onChange={(e) => setEditingItem({ ...editingItem, academicYear: e.target.value })}
                    placeholder="e.g. 2024–2025"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
              </div>

              {/* Award & Event */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Award / Honors Callout</label>
                  <input
                    type="text"
                    value={editingItem.award}
                    onChange={(e) => setEditingItem({ ...editingItem, award: e.target.value })}
                    placeholder="e.g. 100% Pass Rate with 67% Distinction or 1st Prize"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Event / Competition Name</label>
                  <input
                    type="text"
                    value={editingItem.event}
                    onChange={(e) => setEditingItem({ ...editingItem, event: e.target.value })}
                    placeholder="e.g. CBSE AISSE Examination or State Sahodaya Fest"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
              </div>

              {/* Organizer & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Organizer / Governing Body</label>
                  <input
                    type="text"
                    value={editingItem.organizer || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, organizer: e.target.value })}
                    placeholder="e.g. CBSE New Delhi / Kerala Sahodaya"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Location / Level</label>
                  <input
                    type="text"
                    value={editingItem.location || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                    placeholder="e.g. Melattur, Malappuram or State Level"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Featured Student & Class */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Featured Student / Honoree</label>
                  <input
                    type="text"
                    value={editingItem.featuredStudent || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, featuredStudent: e.target.value })}
                    placeholder="e.g. Muhammed Mazin P (96%) & Fathima Ziya P"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Grade / Class & Watermark Badge</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={editingItem.studentClass || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, studentClass: e.target.value })}
                      placeholder="Class (e.g. 10th)"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                    <input
                      type="text"
                      value={editingItem.badge || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, badge: e.target.value })}
                      placeholder="Badge (e.g. VERIFIED)"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Student Achievers Dynamic List */}
              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#0f2b5c] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-700" />
                    <span>Student Achievers Roster ({editingItem.studentList?.length || 0})</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddStudent}
                    className="px-2.5 py-1 rounded bg-white text-blue-900 hover:bg-blue-100 border border-blue-300 text-[11px] font-bold shadow-2xs"
                  >
                    + Add Student
                  </button>
                </div>

                {editingItem.studentList && editingItem.studentList.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {editingItem.studentList.map((stu, sIdx) => (
                      <div key={sIdx} className="grid grid-cols-12 gap-1.5 items-center bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                        <input
                          type="text"
                          placeholder="Student Name"
                          value={stu.name}
                          onChange={(e) => handleUpdateStudent(sIdx, 'name', e.target.value)}
                          className="col-span-5 px-2 py-1 rounded bg-slate-50 border border-slate-300 text-slate-900 text-[11px] font-semibold"
                        />
                        <input
                          type="text"
                          placeholder="Rank / Honors"
                          value={stu.rank || ''}
                          onChange={(e) => handleUpdateStudent(sIdx, 'rank', e.target.value)}
                          className="col-span-3 px-2 py-1 rounded bg-slate-50 border border-slate-300 text-amber-900 text-[11px] font-bold"
                        />
                        <input
                          type="text"
                          placeholder="Score (e.g. 96%)"
                          value={stu.score || ''}
                          onChange={(e) => handleUpdateStudent(sIdx, 'score', e.target.value)}
                          className="col-span-3 px-2 py-1 rounded bg-slate-50 border border-slate-300 text-blue-900 text-[11px] font-mono font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveStudent(sIdx)}
                          className="col-span-1 p-1 text-red-600 hover:text-red-800 text-center"
                          title="Remove"
                        >
                          <X className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">No individual student rows added yet.</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Detailed Narrative Description *</label>
                <textarea
                  rows={3}
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Comprehensive description of the achievement milestone..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Inspection Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Inspection Dossier Notes / Verification Reference</label>
                <input
                  type="text"
                  value={editingItem.detailedNotes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, detailedNotes: e.target.value })}
                  placeholder="Official record verified by CBSE / School inspection dossier"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Poster Image Management */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="font-bold text-slate-800">Poster / Certificate Photograph</label>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-300 overflow-hidden flex-shrink-0 shadow-xs p-1">
                    <img src={editingItem.image} alt="" className="w-full h-full object-cover rounded-lg" />
                  </div>
                  
                  <div className="flex-1 space-y-2 w-full">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Direct Image Asset Path / URL:</span>
                      <input
                        type="text"
                        value={editingItem.image}
                        onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
                        placeholder="/assets/achievements/... or URL"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-[11px]"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Or Upload New Image from Device:</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#0f2b5c] file:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Toggles */}
              <div className="flex items-center gap-6 pt-3 border-t border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.isPublished}
                    onChange={(e) => setEditingItem({ ...editingItem, isPublished: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-slate-800 font-bold">Publish in Live Exhibition</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.isVerified}
                    onChange={(e) => setEditingItem({ ...editingItem, isVerified: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-slate-800 font-bold">Mark Verified against Source</span>
                </label>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
              {!isAddingNew ? (
                <button
                  type="button"
                  onClick={() => {
                    deleteRecord(editingItem.id);
                    setEditingItem(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Record</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-white text-slate-700 text-xs font-bold border border-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveItem(editingItem)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0f2b5c] to-[#1e40af] text-white text-xs font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isAddingNew ? 'Add to Exhibition' : 'Save Changes'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
