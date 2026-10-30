import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Compass, Bookmark, Clock, Eye, Download, Upload, Trash2, Globe, Orbit, Moon, Shield, ExternalLink, Check, AlertCircle } from 'lucide-react';

export const WorkspaceView: React.FC = () => {
  const { navigate } = useRouter();
  const {
    searchHistory,
    clearSearchHistory,
    savedResearch,
    removeSavedResearch,
    watchlist,
    removeFromWatchlist,
    cashBalance,
    positions,
    preferences,
    updatePreferences,
    exportWorkspace,
    importWorkspace,
    resetAllData,
  } = useWorkspace();

  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);

  const handleExport = () => {
    const jsonStr = exportWorkspace();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NEXORA_Workspace_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) return;

    const ok = importWorkspace(importJsonText.trim());
    if (ok) {
      setImportStatus({ success: true, message: 'Workspace successfully imported!' });
      setTimeout(() => {
        setImportStatus(null);
        setShowImportModal(false);
        setImportJsonText('');
      }, 1500);
    } else {
      setImportStatus({ success: false, message: 'Invalid JSON workspace structure.' });
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#48C8FF] tracking-wider uppercase mb-1">
            <Compass className="w-4 h-4" />
            <span>Personal Intelligence Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#EDF4FF]">
            User Workspace & Archives
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Locally preserved research sessions, simulated portfolio holdings, watchlists, and rendering configurations.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0A1022] hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-[#EDF4FF] transition-colors"
          >
            {copiedExport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
            <span>{copiedExport ? 'Downloaded' : 'Export JSON'}</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0A1022] hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-[#EDF4FF] transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Reset all local research, portfolio, and preferences data?')) {
                resetAllData();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Data</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Saved Research & Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Saved Research Reports */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0A1022]/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#EDF4FF] flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#48C8FF]" />
                <span>Saved Research Dossiers ({savedResearch.length})</span>
              </h2>
            </div>

            {savedResearch.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <p className="text-xs text-slate-500">No saved research sessions in your workspace yet.</p>
                <button
                  onClick={() => navigate('/research')}
                  className="px-4 py-2 bg-[#48C8FF]/15 hover:bg-[#48C8FF]/25 border border-[#48C8FF]/30 rounded-lg text-xs font-semibold text-[#48C8FF] transition-colors"
                >
                  Conduct First Investigation
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {savedResearch.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#050713]/80 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3
                        onClick={() => navigate('/research', { q: item.query })}
                        className="font-bold text-sm text-[#EDF4FF] hover:text-[#48C8FF] cursor-pointer truncate"
                      >
                        {item.query}
                      </h3>
                      <button
                        onClick={() => item.id && removeSavedResearch(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Remove dossier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">
                      {item.executiveSummary}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-500">
                      <span>Model: {item.model}</span>
                      <span>Confidence: {Math.round(item.confidenceScore * 100)}%</span>
                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search History */}
          <div className="p-6 rounded-2xl bg-[#0A1022]/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#EDF4FF] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#9875FF]" />
                <span>Search History ({searchHistory.length})</span>
              </h2>
              {searchHistory.length > 0 && (
                <button
                  onClick={clearSearchHistory}
                  className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
                >
                  Clear History
                </button>
              )}
            </div>

            {searchHistory.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No recent searches recorded.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((query, i) => (
                  <button
                    key={i}
                    onClick={() => navigate('/', { q: query })}
                    className="px-3 py-1.5 rounded-lg bg-[#050713] hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-[#EDF4FF] transition-colors flex items-center gap-2"
                  >
                    <span>{query}</span>
                    <span className="text-slate-600">↗</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3): Preferences & Portfolio Summary */}
        <div className="space-y-6">
          {/* Simulated Account Overview */}
          <div className="p-5 rounded-2xl bg-[#0A1022]/90 border border-slate-800 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Paper Portfolio Snapshot
            </h2>
            <div className="p-3 bg-[#050713] rounded-xl border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Simulated Balance:</span>
                <span className="font-mono font-bold text-[#EDF4FF] tabular-nums">
                  ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Active Holdings:</span>
                <span className="font-mono text-[#48C8FF] font-semibold">{positions.length} instruments</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/markets')}
              className="w-full py-2 bg-[#48C8FF]/10 hover:bg-[#48C8FF]/20 border border-[#48C8FF]/30 rounded-xl text-xs font-bold text-[#48C8FF] transition-colors"
            >
              Open Trading Terminal
            </button>
          </div>

          {/* Watchlist Quick Access */}
          <div className="p-5 rounded-2xl bg-[#0A1022]/90 border border-slate-800 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Active Watchlist
            </h2>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {watchlist.map((sym) => (
                <div
                  key={sym}
                  className="p-2 rounded-lg bg-[#050713] border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <span
                    onClick={() => navigate('/markets')}
                    className="font-bold text-[#EDF4FF] hover:text-[#48C8FF] cursor-pointer"
                  >
                    {sym}
                  </span>
                  <button
                    onClick={() => removeFromWatchlist(sym)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Preferences */}
          <div className="p-5 rounded-2xl bg-[#0A1022]/90 border border-slate-800 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Living Universe Settings
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#48C8FF]" />
                  <span>3D Rendering:</span>
                </span>
                <select
                  value={preferences.webglQuality}
                  onChange={(e) => updatePreferences({ webglQuality: e.target.value as any })}
                  className="bg-[#050713] border border-slate-800 rounded px-2 py-1 text-xs text-[#EDF4FF] focus:outline-none"
                >
                  <option value="high">High (GPU 60fps)</option>
                  <option value="medium">Medium</option>
                  <option value="off">Off (CSS Fallback)</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Orbit className="w-3.5 h-3.5 text-[#48C8FF]" />
                  <span>Satellite Orbits:</span>
                </span>
                <input
                  type="checkbox"
                  checked={preferences.enableSatellites}
                  onChange={(e) => updatePreferences({ enableSatellites: e.target.checked })}
                  className="rounded bg-[#050713] border-slate-800 text-[#48C8FF] focus:ring-0"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-[#9875FF]" />
                  <span>City Night Lights:</span>
                </span>
                <input
                  type="checkbox"
                  checked={preferences.enableNightLights}
                  onChange={(e) => updatePreferences({ enableNightLights: e.target.checked })}
                  className="rounded bg-[#050713] border-slate-800 text-[#9875FF] focus:ring-0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* JSON Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 bg-[#0A1022] border border-[#48C8FF]/30 rounded-2xl shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#EDF4FF]">Import Workspace JSON</h3>
            <p className="text-xs text-slate-400">
              Paste the exported NEXORA JSON structure to restore saved dossiers, preferences, and watchlists.
            </p>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <textarea
                rows={8}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='{"version": "1.0", "savedResearch": [...] }'
                className="w-full p-3 bg-[#050713] border border-slate-800 rounded-xl text-xs text-[#EDF4FF] font-mono focus:outline-none focus:border-[#48C8FF]"
              />

              {importStatus && (
                <div
                  className={`p-2.5 rounded-lg text-xs ${
                    importStatus.success ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {importStatus.message}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#48C8FF] text-[#050713] hover:bg-[#38b6ed] rounded-lg text-xs font-bold"
                >
                  Restore Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
