import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { ProviderCapability } from '../../types/market';
import {
  Settings,
  Key,
  ShieldCheck,
  Globe,
  Radio,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Info,
  Orbit,
  Moon,
  Trash2,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { preferences, updatePreferences, resetAllData } = useWorkspace();
  const [capabilities, setCapabilities] = useState<ProviderCapability[]>([]);
  const [streamingConfig, setStreamingConfig] = useState<any>(null);

  useEffect(() => {
    fetch('/api/market/providers')
      .then((res) => res.json())
      .then((data) => {
        if (data.providers) setCapabilities(data.providers);
      })
      .catch(console.error);

    fetch('/api/market/ws-config')
      .then((res) => res.json())
      .then((data) => setStreamingConfig(data))
      .catch(console.error);
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#48C8FF] tracking-wider uppercase mb-1">
          <Settings className="w-4 h-4" />
          <span>Market Feeds & Infrastructure Configuration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#EDF4FF]">
          Data Provider Entitlements & System Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
          Inspect real-time feed connectivity, server environment variable configuration, and streaming parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Market Data Provider Status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0A1022]/90 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#EDF4FF] flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#48C8FF]" />
              <span>Configured Financial Providers</span>
            </h2>

            <div className="space-y-4">
              {capabilities.map((prov) => (
                <div
                  key={prov.name}
                  className="p-4 rounded-xl bg-[#050713]/80 border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#EDF4FF]">{prov.name}</span>
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      {prov.configured ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>ACTIVE</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-400">
                          <XCircle className="w-4 h-4" />
                          <span>NOT CONFIGURED</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                    <div>
                      <span className="text-slate-500 block">Equities:</span>
                      <span className={prov.supportsEquities ? 'text-white' : 'text-slate-600'}>
                        {prov.supportsEquities ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Crypto Spot:</span>
                      <span className={prov.supportsCrypto ? 'text-white' : 'text-slate-600'}>
                        {prov.supportsCrypto ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Candles/OHLC:</span>
                      <span className={prov.supportsCandles ? 'text-white' : 'text-slate-600'}>
                        {prov.supportsCandles ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">WebSocket:</span>
                      <span className={prov.supportsRealTimeWs ? 'text-emerald-400' : 'text-slate-600'}>
                        {prov.supportsRealTimeWs ? 'Available' : 'REST Only'}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-500 pt-1">
                    Rate Limits: {prov.rateLimitInfo}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Streaming Infrastructure Status */}
          {streamingConfig && (
            <div className="p-6 rounded-2xl bg-[#0A1022]/90 border border-slate-800 space-y-3 font-mono text-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#EDF4FF]">
                Streaming Engine Architecture
              </h2>
              <div className="p-4 bg-[#050713] rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Engine Type:</span>
                  <span className="text-[#48C8FF] font-bold uppercase">{streamingConfig.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Refresh Frequency:</span>
                  <span className="text-[#EDF4FF]">{streamingConfig.pollingIntervalMs}ms</span>
                </div>
                <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 leading-relaxed">
                  {streamingConfig.note}
                </p>
              </div>
            </div>
          )}

          {/* Environment Variables Documentation */}
          <div className="p-6 rounded-2xl bg-[#0A1022]/90 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#EDF4FF] flex items-center gap-2">
              <Key className="w-4 h-4 text-[#48C8FF]" />
              <span>Environment Configuration Guide</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Add your private credentials to the server environment (in Google AI Studio Settings &gt; Secrets, or your local <code className="text-slate-300">.env</code> file). Keys are never sent to the browser client.
            </p>

            <pre className="p-4 bg-[#050713] rounded-xl text-xs font-mono text-[#EDF4FF] overflow-x-auto border border-slate-800">
{`# Finnhub API Key (Free tier 60 calls/min, real-time quotes & WebSocket)
FINNHUB_API_KEY="your_finnhub_key_here"

# Twelve Data API Key (Alternative equity provider)
TWELVE_DATA_API_KEY="your_twelve_data_key_here"

# Gemini AI API Key (For intelligence synthesis)
GEMINI_API_KEY="your_gemini_key_here"`}
            </pre>
          </div>
        </div>

        {/* Right Column (1/3): Visual Universe & Workspace Settings */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#0A1022]/90 border border-slate-800 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Living Universe Visuals
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
                  <span>Satellites:</span>
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

          {/* Account Reset */}
          <div className="p-5 rounded-2xl bg-[#0A1022]/90 border border-slate-800 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Clear Storage
            </h2>
            <p className="text-xs text-slate-400">
              Reset all local watchlists, paper-trading ledger, and stored preferences.
            </p>
            <button
              onClick={() => {
                if (window.confirm('Reset all local data?')) {
                  resetAllData();
                }
              }}
              className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold font-mono transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Local Workspace</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
