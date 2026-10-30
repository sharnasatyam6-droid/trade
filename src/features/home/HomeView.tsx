import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { UniversalSearchBar } from '../../components/search/UniversalSearchBar';
import { SearchResponse, SearchCategory } from '../../types';
import { Brain, TrendingUp, Wrench, Compass, Sparkles, ExternalLink, ShieldCheck, Database, RefreshCw, AlertCircle } from 'lucide-react';

export const HomeView: React.FC = () => {
  const { searchQuery, searchCategory, navigate } = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResponse | null>(null);

  // Perform search when query changes
  useEffect(() => {
    if (!searchQuery) {
      setResults(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery, category: searchCategory, aiSummarize: true }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Search failed with status ${res.status}`);
        }
        return res.json();
      })
      .then((data: SearchResponse) => {
        if (isMounted) {
          setResults(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to retrieve search results.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [searchQuery, searchCategory]);

  const quickFeatures = [
    {
      title: 'AI Research Workspace',
      description: 'Execute deep scientific, economic, and technical investigations with structured synthesis.',
      route: '/research' as const,
      icon: Brain,
      color: 'text-[#48C8FF]',
    },
    {
      title: 'Market Intelligence',
      description: 'Analyze real-time market data, interactive candlestick charts, and paper-trading simulation.',
      route: '/markets' as const,
      icon: TrendingUp,
      color: 'text-[#4ADE80]',
    },
    {
      title: 'Modular Tool Lab',
      description: 'Direct access to SSRF-safe URL analyzers, cryptographic hashers, and JSON validators.',
      route: '/tools' as const,
      icon: Wrench,
      color: 'text-[#9875FF]',
    },
    {
      title: 'Personal Workspace',
      description: 'Manage saved dossiers, watchlists, paper-trading portfolio, and system preferences.',
      route: '/workspace' as const,
      icon: Compass,
      color: 'text-[#FBBF24]',
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Focal Search Section */}
      <div className="w-full max-w-3xl mx-auto text-center space-y-6 pt-4 md:pt-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A1022]/80 border border-[#48C8FF]/30 text-xs text-[#48C8FF] shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="font-medium tracking-wide">Autonomous Intelligence Engine</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#EDF4FF] leading-tight">
          NEXORA
        </h1>

        <p className="text-sm sm:text-base text-[#94A3B8] max-w-xl mx-auto leading-relaxed">
          Explore the web. Understand the universe. Control your digital world with AI-powered search, deep research, and modular tools.
        </p>

        {/* Central Search Component */}
        <div className="pt-2">
          <UniversalSearchBar
            initialQuery={searchQuery}
            onSearch={(q, cat) => navigate('/', { q, category: cat })}
          />
        </div>

        {/* Trending Queries */}
        {!searchQuery && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-400">
            <span className="text-slate-500">Trending:</span>
            {[
              'James Webb Space Telescope observations',
              'Quantum fault-tolerant error correction',
              'NVIDIA Blackwell chip architecture',
              'Zero Trust post-quantum algorithms',
            ].map((topic) => (
              <button
                key={topic}
                onClick={() => navigate('/', { q: topic })}
                className="hover:text-[#48C8FF] hover:underline underline-offset-4 transition-colors"
              >
                {topic}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Results Area */}
      {searchQuery && (
        <div className="w-full max-w-4xl mx-auto my-10 space-y-6">
          {loading && (
            <div className="space-y-4 p-6 bg-[#0A1022]/90 border border-slate-800 rounded-2xl animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-1/3" />
              <div className="h-6 bg-slate-800/60 rounded w-4/5" />
              <div className="h-20 bg-slate-800/40 rounded w-full" />
            </div>
          )}

          {error && (
            <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-semibold text-sm">Search Request Unsuccessful</p>
                <p className="text-xs text-rose-400 mt-1">{error}</p>
                <button
                  onClick={() => navigate('/', { q: searchQuery })}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-xs font-medium text-rose-200 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry Request</span>
                </button>
              </div>
            </div>
          )}

          {results && !loading && (
            <div className="space-y-6">
              {/* AI Overview Box */}
              {results.aiOverview && (
                <div className="p-6 rounded-2xl bg-gradient-to-b from-[#0A1022] to-[#070b16] border border-[#48C8FF]/30 shadow-xl space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2 text-[#48C8FF] font-semibold">
                      <Sparkles className="w-4 h-4 text-[#9875FF]" />
                      <span>AI Intelligence Synthesis</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>Model: {results.aiOverview.modelUsed}</span>
                      <span aria-hidden="true">·</span>
                      <span className={results.aiOverview.isRealTimeAI ? 'text-emerald-400' : 'text-amber-400'}>
                        {results.aiOverview.isRealTimeAI ? 'Live Synthesis' : 'Verified Index'}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm md:text-base text-[#EDF4FF] leading-relaxed">
                    {results.aiOverview.summary}
                  </p>

                  <div className="space-y-1.5 pt-1">
                    {results.aiOverview.keyPoints.map((point, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-[#94A3B8]">
                        <span className="text-[#48C8FF] font-bold mt-0.5">›</span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span>Sourced from:</span>
                    {results.aiOverview.sourcesUsed.map((src, i) => (
                      <span key={i} className="text-slate-400 underline decoration-slate-700">
                        {src}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Result List Items */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                  Verified Search Hits ({results.results.length})
                </div>

                {results.results.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-xl bg-[#0A1022]/80 border border-slate-800 hover:border-[#48C8FF]/40 transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[#48C8FF] font-medium">{item.source}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate text-slate-500">{item.url}</span>
                      </div>
                      {item.isSimulated && (
                        <span className="text-[10px] text-amber-400/80 uppercase font-mono">
                          Demonstration Index
                        </span>
                      )}
                    </div>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-base font-semibold text-[#EDF4FF] group-hover:text-[#48C8FF] transition-colors"
                    >
                      <span>{item.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                    </a>

                    <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                      {item.snippet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feature Navigation Cards */}
      <div className="w-full max-w-5xl mx-auto pt-10 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <button
                key={feat.route}
                onClick={() => navigate(feat.route)}
                className="p-5 rounded-2xl bg-[#0A1022]/70 hover:bg-[#0A1022] border border-slate-800 hover:border-[#48C8FF]/40 transition-all text-left flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className={`p-2.5 rounded-xl bg-[#050713] border border-slate-800 w-fit mb-3 group-hover:scale-105 transition-transform ${feat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-sm text-[#EDF4FF] group-hover:text-[#48C8FF] transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-medium text-slate-400 group-hover:text-[#48C8FF]">
                  <span>Explore</span>
                  <span className="font-bold">→</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* System Status Indicators (Clean, no pulsing dots) */}
      <div className="w-full max-w-5xl mx-auto py-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#4ADE80]" />
            <span>Server Proxy Security Active</span>
          </span>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <span className="hidden sm:flex items-center gap-1.5 text-slate-400">
            <Database className="w-4 h-4 text-[#48C8FF]" />
            <span>Zero Browser Secret Leakage</span>
          </span>
        </div>
        <div>
          <span>NEXORA Platform v1.0.0</span>
        </div>
      </div>
    </div>
  );
};
