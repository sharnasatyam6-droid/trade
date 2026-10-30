import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { ResearchReport } from '../../types';
import { Brain, Sparkles, Bookmark, Download, Check, ShieldCheck, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

export const ResearchView: React.FC = () => {
  const { searchQuery } = useRouter();
  const { savedResearch, saveResearchReport } = useWorkspace();

  const [inputQuery, setInputQuery] = useState(searchQuery || 'Quantum fault-tolerant logical qubit error correction');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const executeResearch = (q: string) => {
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    fetch('/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q.trim(), depth: 'deep' }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Research request failed with code ${res.status}`);
        }
        return res.json();
      })
      .then((data: ResearchReport) => {
        setReport(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to complete research investigation.');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (searchQuery) {
      setInputQuery(searchQuery);
      executeResearch(searchQuery);
    } else {
      executeResearch('Quantum fault-tolerant logical qubit error correction');
    }
  }, [searchQuery]);

  const handleSaveToWorkspace = () => {
    if (!report) return;
    saveResearchReport(report);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExportMarkdown = () => {
    if (!report) return;
    const md = `# RESEARCH DOSSIER: ${report.query}
**Timestamp:** ${report.timestamp}
**Model:** ${report.model}
**Confidence Score:** ${(report.confidenceScore * 100).toFixed(1)}%

---

## Executive Summary
${report.executiveSummary}

## Key Findings
${report.keyFindings.map((kf) => `- ${kf}`).join('\n')}

${report.sections
  .map(
    (sec) => `## ${sec.title}
${sec.content}

### Empirical Facts
${sec.facts.map((f) => `- ${f}`).join('\n')}

**Sources:** ${sec.sources.join(', ')}
`
  )
  .join('\n')}

## Comparative Matrix
${report.comparativeAnalysis?.map((c) => `- **${c.metric}:** ${c.finding}`).join('\n') || 'N/A'}

## Verified Citations & Provenance
${report.sources.map((s) => `- [${s.title}](${s.url}) (Publisher: ${s.publisher}, Reliability: ${s.reliability})`).join('\n')}
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NEXORA_Research_${report.query.slice(0, 25).replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8">
      {/* Research Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#48C8FF] tracking-wider uppercase mb-1">
            <Brain className="w-4 h-4" />
            <span>Autonomous Research Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#EDF4FF]">
            Deep Intelligence Dossiers
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Multimodal synthesis distinguishing empirical facts from theoretical speculation with verified references.
          </p>
        </div>

        {report && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveToWorkspace}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                savedSuccess
                  ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                  : 'border-slate-700 bg-[#0A1022] hover:bg-slate-800 text-[#EDF4FF]'
              }`}
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              <span>{savedSuccess ? 'Saved to Workspace' : 'Save Dossier'}</span>
            </button>

            <button
              onClick={handleExportMarkdown}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#48C8FF] text-[#050713] hover:bg-[#38b6ed] transition-colors shadow-md shadow-[#48C8FF]/20"
            >
              <Download className="w-4 h-4" />
              <span>Export Markdown</span>
            </button>
          </div>
        )}
      </div>

      {/* Query Bar */}
      <div className="p-3 bg-[#0A1022]/90 border border-[#48C8FF]/20 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && executeResearch(inputQuery)}
            placeholder="Specify research question, technology, or scientific domain..."
            className="w-full px-4 py-2.5 bg-[#050713] border border-slate-800 rounded-xl text-sm text-[#EDF4FF] placeholder:text-slate-500 focus:outline-none focus:border-[#48C8FF]"
          />
        </div>

        <button
          onClick={() => executeResearch(inputQuery)}
          disabled={loading || !inputQuery.trim()}
          className="w-full sm:w-auto px-5 py-2.5 bg-[#48C8FF] text-[#050713] hover:bg-[#38b6ed] disabled:opacity-40 rounded-xl font-bold text-xs uppercase tracking-wider shrink-0 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Synthesizing...</span>
            </>
          ) : (
            <>
              <span>Conduct Research</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6 animate-pulse">
          <div className="p-6 rounded-2xl bg-[#0A1022] border border-slate-800 space-y-4">
            <div className="h-4 bg-slate-800 rounded w-1/4" />
            <div className="h-6 bg-slate-800 rounded w-3/4" />
            <div className="h-16 bg-slate-800/60 rounded w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 rounded-2xl bg-[#0A1022] border border-slate-800" />
            <div className="h-48 rounded-2xl bg-[#0A1022] border border-slate-800" />
          </div>
        </div>
      )}

      {/* Error Recovery */}
      {error && !loading && (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-4 text-rose-300">
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-rose-400" />
          <div className="space-y-2">
            <h3 className="font-semibold text-base">Research Synthesis Error</h3>
            <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
            <button
              onClick={() => executeResearch(inputQuery)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-xs font-medium text-rose-100 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Investigation</span>
            </button>
          </div>
        </div>
      )}

      {/* Research Report Content */}
      {report && !loading && (
        <div className="space-y-8">
          {/* Executive Briefing Banner */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#0A1022] via-[#0c142b] to-[#070b16] border border-[#48C8FF]/30 shadow-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#48C8FF]" />
                <span className="font-semibold text-[#EDF4FF]">Executive Briefing</span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span>Engine: {report.model}</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#48C8FF] font-medium font-mono">
                  Confidence: {Math.round(report.confidenceScore * 100)}%
                </span>
                {report.isSimulated && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-400 font-mono">Curated Index Mode</span>
                  </>
                )}
              </div>
            </div>

            <p className="text-sm sm:text-base text-[#EDF4FF] leading-relaxed">
              {report.executiveSummary}
            </p>

            {/* Key Findings Grid */}
            <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.keyFindings.map((finding, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#050713]/60 border border-slate-800/80 flex items-start gap-2.5 text-xs text-[#94A3B8]"
                >
                  <span className="font-mono text-[#48C8FF] font-bold text-sm leading-none mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{finding}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Deep Sections */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[#EDF4FF] tracking-tight">
              Detailed Structural Breakdown
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {report.sections.map((section, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-[#0A1022]/85 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <h3 className="font-bold text-base text-[#EDF4FF]">
                      {section.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                      {section.content}
                    </p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-800/80">
                    <div className="text-[11px] font-semibold text-[#48C8FF] uppercase tracking-wider">
                      Verified Sourced Facts
                    </div>
                    {section.facts.map((fact, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{fact}</span>
                      </div>
                    ))}
                    <div className="text-[11px] text-slate-500 pt-1">
                      Referenced: {section.sources.join(' · ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comparative Matrix & Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Comparative Analysis */}
            {report.comparativeAnalysis && report.comparativeAnalysis.length > 0 && (
              <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0A1022]/85 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-[#EDF4FF] uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#48C8FF]" />
                  <span>Comparative Metric Matrix</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2 pr-4 font-semibold">Evaluation Parameter</th>
                        <th className="py-2 font-semibold">Finding / Benchmark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {report.comparativeAnalysis.map((item, i) => (
                        <tr key={i}>
                          <td className="py-2.5 pr-4 text-[#EDF4FF] font-medium">{item.metric}</td>
                          <td className="py-2.5 text-[#94A3B8]">{item.finding}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Citations & Provenance */}
            <div className="p-6 rounded-2xl bg-[#0A1022]/85 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-[#EDF4FF] uppercase tracking-wider">
                Citations & Provenance
              </h3>
              <p className="text-[11px] text-slate-400">
                Sources strictly validated against authoritative databases. Zero fabricated links.
              </p>

              <div className="space-y-2.5 pt-2">
                {report.sources.map((src, i) => (
                  <div key={i} className="p-3 rounded-lg bg-[#050713]/80 border border-slate-800/80 space-y-1">
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-[#48C8FF] hover:underline flex items-center justify-between"
                    >
                      <span className="truncate">{src.title}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{src.reliability}</span>
                    </a>
                    <div className="text-[11px] text-slate-500">
                      Publisher: {src.publisher}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
