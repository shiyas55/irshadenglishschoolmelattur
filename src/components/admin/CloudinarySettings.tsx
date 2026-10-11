'use client';

import React, { useState } from 'react';
import { CloudinaryConfig, SchoolSection, SectionContentItem } from '../../types/schoolCms';
import { 
  getCloudinaryConfig, 
  saveCloudinaryConfig, 
  uploadImageToCloudinary, 
  getOptimizedImageUrl 
} from '../../lib/cloudinary';
import { 
  getSupabaseCredentials, 
  saveSupabaseCredentials, 
  isSupabaseConnected 
} from '../../lib/supabaseClient';
import { 
  syncSectionsToSupabase, 
  syncContentItemsToSupabase, 
  loadSectionsAsync, 
  loadContentItemsAsync 
} from '../../lib/sectionsStorage';
import { 
  Cloud, 
  Database, 
  Check, 
  RefreshCw, 
  Upload, 
  Download, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Key, 
  Image as ImageIcon,
  Server
} from 'lucide-react';

interface CloudinarySettingsProps {
  sections: SchoolSection[];
  items: SectionContentItem[];
  onUpdateSections: (sections: SchoolSection[]) => void;
  onUpdateItems: (items: SectionContentItem[]) => void;
  showToast: (msg: string) => void;
}

export const CloudinarySettings: React.FC<CloudinarySettingsProps> = ({
  sections,
  items,
  onUpdateSections,
  onUpdateItems,
  showToast,
}) => {
  // Cloudinary state
  const [cloudinaryConfig, setCloudinaryConfig] = useState<CloudinaryConfig>(getCloudinaryConfig);
  const [isTestingUpload, setIsTestingUpload] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ url: string; isCloudinary: boolean } | null>(null);

  // Supabase state
  const [supabaseUrl, setSupabaseUrl] = useState<string>(() => getSupabaseCredentials().url);
  const [supabaseKey, setSupabaseKey] = useState<string>(() => getSupabaseCredentials().key);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(() => isSupabaseConnected());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [dbStatusMsg, setDbStatusMsg] = useState<string>('');

  // Handle Cloudinary Config Save
  const handleSaveCloudinary = (e: React.FormEvent) => {
    e.preventDefault();
    saveCloudinaryConfig(cloudinaryConfig);
    showToast('Cloudinary configuration saved successfully!');
  };

  // Handle Test Upload
  const handleTestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsTestingUpload(true);
    setTestResult(null);

    try {
      const res = await uploadImageToCloudinary(file, 'test-uploads');
      setTestResult(res);
      if (res.isCloudinary) {
        showToast('Test upload to Cloudinary succeeded!');
      } else {
        showToast('Cloudinary credentials missing or failed; saved locally as fallback.');
      }
    } catch (err: any) {
      showToast(`Test failed: ${err?.message}`);
    } finally {
      setIsTestingUpload(false);
    }
  };

  // Handle Supabase Credentials Save
  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseCredentials(supabaseUrl.trim(), supabaseKey.trim());
    const connected = isSupabaseConnected();
    setIsDbConnected(connected);
    if (connected) {
      showToast('Supabase credentials configured!');
      setDbStatusMsg('Connected to Supabase! You can push your sections and items below.');
    } else {
      showToast('Please provide both Supabase URL and Anon Key.');
    }
  };

  // Push all Sections and Items to Supabase
  const handlePushAllToSupabase = async () => {
    if (!isSupabaseConnected()) {
      alert('Please configure Supabase URL and Anon Key first.');
      return;
    }

    setIsSyncing(true);
    setDbStatusMsg('Syncing sections and content items to Supabase cloud...');

    try {
      const sectionsOk = await syncSectionsToSupabase(sections);
      const itemsOk = await syncContentItemsToSupabase(items);

      if (sectionsOk && itemsOk) {
        showToast(`Successfully synced ${sections.length} sections and ${items.length} items to Supabase!`);
        setDbStatusMsg(`Synced ${sections.length} sections & ${items.length} exhibits at ${new Date().toLocaleTimeString()}`);
      } else {
        showToast('Sync note: Run supabase_cms_v2_schema.sql in Supabase SQL Editor if tables are missing.');
        setDbStatusMsg('Sync notice: Please ensure sections and content_items tables are created in Supabase.');
      }
    } catch (err: any) {
      showToast(`Sync failed: ${err?.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Pull all Sections and Items from Supabase
  const handlePullFromSupabase = async () => {
    if (!isSupabaseConnected()) {
      alert('Please configure Supabase URL and Anon Key first.');
      return;
    }

    setIsSyncing(true);
    setDbStatusMsg('Pulling latest data from Supabase...');

    try {
      const [cloudSecs, cloudItems] = await Promise.all([
        loadSectionsAsync(),
        loadContentItemsAsync(),
      ]);

      if (cloudSecs.length > 0) onUpdateSections(cloudSecs);
      if (cloudItems.length > 0) onUpdateItems(cloudItems);

      showToast(`Pulled ${cloudSecs.length} sections & ${cloudItems.length} items from Supabase!`);
      setDbStatusMsg(`Updated from cloud at ${new Date().toLocaleTimeString()}`);
    } catch (err: any) {
      showToast(`Fetch failed: ${err?.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: CLOUDINARY CONFIGURATION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-serif font-black text-[#0f2b5c]">
                Cloudinary Media Storage & Fast Image Optimization
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Store all gallery photographs in Cloudinary with automatic <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono">f_auto,q_auto</code> WebP/AVIF acceleration for blazing-fast loading on mobile and desktop.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Fast CDN Enabled</span>
          </div>
        </div>

        {/* Cloudinary Config Form */}
        <form onSubmit={handleSaveCloudinary} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Cloud Name *
              </label>
              <input
                type="text"
                placeholder="e.g. your-cloud-name"
                value={cloudinaryConfig.cloudName}
                onChange={(e) =>
                  setCloudinaryConfig({ ...cloudinaryConfig, cloudName: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Upload Preset (Unsigned)
              </label>
              <input
                type="text"
                placeholder="e.g. irshad_school_preset"
                value={cloudinaryConfig.uploadPreset || ''}
                onChange={(e) =>
                  setCloudinaryConfig({ ...cloudinaryConfig, uploadPreset: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                API Key (Optional for Server API)
              </label>
              <input
                type="text"
                placeholder="e.g. 123456789012345"
                value={cloudinaryConfig.apiKey || ''}
                onChange={(e) =>
                  setCloudinaryConfig({ ...cloudinaryConfig, apiKey: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                API Secret (Optional for Server API)
              </label>
              <input
                type="password"
                placeholder="••••••••••••••••••••••••••••"
                value={cloudinaryConfig.apiSecret || ''}
                onChange={(e) =>
                  setCloudinaryConfig({ ...cloudinaryConfig, apiSecret: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#0f2b5c] hover:bg-blue-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Cloudinary Credentials</span>
            </button>

            {/* Test Upload Button */}
            <label className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold border border-blue-200 cursor-pointer flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-blue-700" />
              <span>{isTestingUpload ? 'Uploading Test...' : 'Test Image Upload to Cloudinary'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleTestUpload}
                disabled={isTestingUpload}
                className="hidden"
              />
            </label>
          </div>
        </form>

        {/* Test Result Display */}
        {testResult && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4 text-xs">
            <img
              src={getOptimizedImageUrl(testResult.url, { width: 100, height: 100 })}
              alt="Test Upload"
              className="w-14 h-14 object-cover rounded-lg border border-slate-300 flex-shrink-0"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-800">
                  {testResult.isCloudinary ? 'Successfully Uploaded to Cloudinary!' : 'Saved in local fallback storage'}
                </span>
              </div>
              <p className="font-mono text-[11px] text-slate-500 truncate">
                {testResult.url}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: SUPABASE CLOUD DATABASE CONFIGURATION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-serif font-black text-[#0f2b5c]">
                Supabase Cloud Database Synchronization
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Permanent multi-device database for all dynamic sections and exhibits.
            </p>
          </div>

          <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold ${
            isDbConnected 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isDbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{isDbConnected ? 'Supabase Connected' : 'Local Storage Fallback'}</span>
          </div>
        </div>

        {dbStatusMsg && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-700 flex-shrink-0" />
            <span>{dbStatusMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveSupabase} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Supabase URL
              </label>
              <input
                type="url"
                required
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Supabase Anon (Public) Key
              </label>
              <input
                type="password"
                required
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#0f2b5c] hover:bg-blue-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Supabase Credentials</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePushAllToSupabase}
                disabled={!isDbConnected || isSyncing}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs disabled:opacity-40"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Push All to Supabase</span>
              </button>

              <button
                type="button"
                onClick={handlePullFromSupabase}
                disabled={!isDbConnected || isSyncing}
                className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Pull from Supabase</span>
              </button>
            </div>
          </div>
        </form>

        {/* Setup Schema guide */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-2 font-bold text-[#0f2b5c]">
            <Server className="w-4 h-4 text-blue-700" />
            <span>Database Tables Schema</span>
          </div>
          <p className="text-[11px]">
            To create the <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">sections</code> and <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">content_items</code> tables in your Supabase project, open your Supabase SQL Editor and run the script in <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200 text-blue-700">supabase_cms_v2_schema.sql</code>.
          </p>
        </div>
      </div>

    </div>
  );
};
