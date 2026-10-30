import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { ToolDefinition } from '../../types';
import { Wrench, Shield, Code, FileText, Lock, Database, Search, ArrowRight, Check, AlertTriangle, Copy, Play } from 'lucide-react';

export const TOOLS_REGISTRY: ToolDefinition[] = [
  {
    id: 'url-analyzer',
    name: 'SSRF-Safe URL Inspector',
    description: 'Inspect URL authority, detect private IP ranges (RFC1918), basic auth leaks, and port anomalies without network visits.',
    category: 'security',
    icon: 'Shield',
    isRealIntegration: true,
    status: 'active',
  },
  {
    id: 'json-validator',
    name: 'JSON Structural Validator',
    description: 'Validate syntax, calculate byte depth, audit tree keys, format with indentation, and minify payloads.',
    category: 'developer',
    icon: 'Code',
    isRealIntegration: true,
    status: 'active',
  },
  {
    id: 'crypto-hasher',
    name: 'Cryptographic Entropy & Hasher',
    description: 'Calculate Shannon bit-entropy and generate deterministic SHA-256, SHA-512, and MD5 hashes.',
    category: 'security',
    icon: 'Lock',
    isRealIntegration: true,
    status: 'active',
  },
  {
    id: 'text-summarizer',
    name: 'Text & Readability Analyzer',
    description: 'Analyze word counts, estimate token overhead, and compute Flesch-Kincaid readability scoring.',
    category: 'productivity',
    icon: 'FileText',
    isRealIntegration: true,
    status: 'active',
  },
  {
    id: 'research-notes',
    name: 'Research Notebook',
    description: 'Structure and tag research hypotheses, empirical citations, and export markdown summaries.',
    category: 'research',
    icon: 'Database',
    isRealIntegration: true,
    status: 'active',
  },
];

export const ToolsView: React.FC = () => {
  const { selectedToolId, setSelectedToolId } = useRouter();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTool, setActiveTool] = useState<ToolDefinition>(
    TOOLS_REGISTRY.find((t) => t.id === selectedToolId) || TOOLS_REGISTRY[0]
  );

  // Tool 1: URL Analyzer State
  const [urlInput, setUrlInput] = useState('https://user:pass@internal.dev.local:8443/api/v1/telemetry?debug=true');
  const [urlResult, setUrlResult] = useState<any>(null);
  const [urlLoading, setUrlLoading] = useState(false);

  // Tool 2: JSON Validator State
  const [jsonInput, setJsonInput] = useState('{\n  "service": "NEXORA",\n  "cluster": "node-alpha",\n  "latencyMs": 14.2,\n  "verified": true\n}');
  const [jsonResult, setJsonResult] = useState<any>(null);

  // Tool 3: Cryptographic Hasher State
  const [hashInput, setHashInput] = useState('Autonomous decentralized intelligence beyond search');
  const [hashResult, setHashResult] = useState<any>(null);

  // Tool 4: Text Summarizer State
  const [textInput, setTextInput] = useState('Fault-tolerant quantum computation relies on topological surface codes where physical qubits are arranged in a 2D lattice. The continuous measurement of stabilizer operators detects Pauli X and Z errors without collapsing the underlying superposition.');
  const [textStats, setTextStats] = useState<any>(null);

  // Tool 5: Research Notes State
  const [notes, setNotes] = useState<{ id: string; title: string; content: string; tag: string }[]>([
    {
      id: '1',
      title: 'HBM4 Interface Specification',
      content: '16-high stacks transitioning to 2048-bit wide interface requiring hybrid bonding to meet thermal constraints.',
      tag: 'Hardware',
    },
    {
      id: '2',
      title: 'Post-Quantum NIST Standards',
      content: 'ML-KEM-768 designated for general key encapsulation; 1184 byte public key footprint.',
      tag: 'Cryptography',
    },
  ]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTag, setNewNoteTag] = useState('General');

  // URL Inspector Execution
  const handleAnalyzeUrl = () => {
    setUrlLoading(true);
    fetch('/api/tools/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId: 'url-analyzer', input: { url: urlInput } }),
    })
      .then((res) => res.json())
      .then((res) => {
        setUrlResult(res.data);
        setUrlLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setUrlLoading(false);
      });
  };

  // JSON Validator Execution
  const handleValidateJson = () => {
    fetch('/api/tools/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId: 'json-validator', input: { content: jsonInput } }),
    })
      .then((res) => res.json())
      .then((res) => setJsonResult(res.data))
      .catch(console.error);
  };

  // Hasher Execution
  const handleCalculateHashes = () => {
    fetch('/api/tools/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId: 'crypto-hasher', input: { text: hashInput } }),
    })
      .then((res) => res.json())
      .then((res) => setHashResult(res.data))
      .catch(console.error);
  };

  // Text Stats Execution (Local computation)
  const handleAnalyzeText = () => {
    const words = textInput.trim().split(/\s+/).filter(Boolean);
    const sentences = textInput.split(/[.!?]+/).filter(Boolean);
    const characters = textInput.length;
    const syllablesEstimate = words.reduce((acc, word) => {
      const match = word.match(/[aeiouy]{1,2}/gi);
      return acc + (match ? match.length : 1);
    }, 0);

    // Flesch-Kincaid Grade Level formula
    const wordsCount = words.length || 1;
    const sentencesCount = sentences.length || 1;
    const gradeLevel =
      0.39 * (wordsCount / sentencesCount) + 11.8 * (syllablesEstimate / wordsCount) - 15.59;

    setTextStats({
      wordsCount,
      sentencesCount,
      characters,
      estimatedTokens: Math.ceil(characters / 4),
      readingTimeMinutes: (wordsCount / 200).toFixed(1),
      gradeLevel: Math.max(1, Math.round(gradeLevel * 10) / 10),
    });
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;
    setNotes([
      { id: Date.now().toString(), title: newNoteTitle.trim(), content: newNoteContent.trim(), tag: newNoteTag },
      ...notes,
    ]);
    setNewNoteTitle('');
    setNewNoteContent('');
  };

  const filteredTools = TOOLS_REGISTRY.filter((tool) => {
    const matchCategory = activeCategory === 'all' || tool.category === activeCategory;
    const matchSearch =
      !searchQuery ||
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="relative min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#48C8FF] tracking-wider uppercase mb-1">
          <Wrench className="w-4 h-4" />
          <span>Extensible Utility Registry</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#EDF4FF]">
          Tool Lab & Digital Utilities
        </h1>
        <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
          Local zero-overhead tools and server-verified utilities. Add and execute utilities without full app refactors.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tool Directory */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search utilities..."
              className="w-full pl-9 pr-3 py-2 bg-[#0A1022] border border-slate-800 rounded-xl text-xs text-[#EDF4FF] focus:outline-none focus:border-[#48C8FF]"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1">
            {['all', 'security', 'developer', 'productivity', 'research'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`capitalize px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-[#48C8FF]/20 text-[#48C8FF] border border-[#48C8FF]/40'
                    : 'text-slate-400 hover:text-slate-200 bg-[#0A1022]/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Tool Cards */}
          <div className="space-y-2">
            {filteredTools.map((tool) => {
              const isSelected = activeTool.id === tool.id;
              return (
                <div
                  key={tool.id}
                  onClick={() => {
                    setActiveTool(tool);
                    setSelectedToolId(tool.id);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-[#48C8FF]/10 border-[#48C8FF]/50 shadow-md'
                      : 'bg-[#0A1022]/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#EDF4FF]">{tool.name}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">OPERATIONAL</span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] leading-relaxed line-clamp-2">
                    {tool.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Tool Workbench */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0A1022]/90 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#EDF4FF]">{activeTool.name}</h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">{activeTool.description}</p>
            </div>
            <div className="px-2.5 py-1 rounded bg-[#48C8FF]/10 text-[#48C8FF] text-[11px] font-mono border border-[#48C8FF]/20">
              CATEGORY: {activeTool.category.toUpperCase()}
            </div>
          </div>

          {/* Tool Implementation 1: SSRF-Safe URL Analyzer */}
          {activeTool.id === 'url-analyzer' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium">Target URL String:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#050713] border border-slate-800 rounded-xl text-xs text-[#EDF4FF] focus:outline-none focus:border-[#48C8FF]"
                  />
                  <button
                    onClick={handleAnalyzeUrl}
                    disabled={urlLoading}
                    className="px-4 py-2 bg-[#48C8FF] text-[#050713] hover:bg-[#38b6ed] rounded-xl text-xs font-bold shrink-0 transition-colors"
                  >
                    {urlLoading ? 'Inspecting...' : 'Analyze'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Strictly local syntactic & security evaluation. No network requests are dispatched to destination.
                </p>
              </div>

              {urlResult && (
                <div className="p-4 rounded-xl bg-[#050713] border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300">Security Assessment:</span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                        urlResult.securityAssessment.riskLevel === 'LOW'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      RISK: {urlResult.securityAssessment.riskLevel}
                    </span>
                  </div>

                  {urlResult.securityAssessment.flags.length > 0 && (
                    <div className="space-y-1">
                      {urlResult.securityAssessment.flags.map((flag: string, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 text-rose-300 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>{flag}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                    <div><span className="text-slate-500">Host:</span> {urlResult.hostname}</div>
                    <div><span className="text-slate-500">Port:</span> {urlResult.port}</div>
                    <div><span className="text-slate-500">Protocol:</span> {urlResult.protocol}</div>
                    <div><span className="text-slate-500">Path:</span> {urlResult.pathname}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tool Implementation 2: JSON Validator */}
          {activeTool.id === 'json-validator' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium">JSON Input Payload:</label>
                <textarea
                  rows={6}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[#050713] border border-slate-800 rounded-xl text-xs text-[#EDF4FF] font-mono focus:outline-none focus:border-[#48C8FF]"
                />
                <button
                  onClick={handleValidateJson}
                  className="px-4 py-2 bg-[#48C8FF] text-[#050713] hover:bg-[#38b6ed] rounded-xl text-xs font-bold transition-colors"
                >
                  Format & Validate
                </button>
              </div>

              {jsonResult && (
                <div className="p-4 rounded-xl bg-[#050713] border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300">Validation Status:</span>
                    <span className={`font-bold font-mono ${jsonResult.valid ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {jsonResult.valid ? 'VALID JSON' : 'SYNTAX ERROR'}
                    </span>
                  </div>

                  {jsonResult.valid ? (
                    <div className="space-y-2">
                      <div className="flex gap-4 text-[11px] text-slate-400">
                        <span>Type: {jsonResult.type}</span>
                        <span>Keys: {jsonResult.keysCount}</span>
                        <span>Size: {jsonResult.sizeBytes} B</span>
                      </div>
                      <pre className="p-3 bg-[#0A1022] rounded-lg text-[11px] font-mono text-[#EDF4FF] max-h-48 overflow-auto">
                        {jsonResult.formatted}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-rose-300 text-xs font-mono">{jsonResult.error}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tool Implementation 3: Cryptographic Hasher */}
          {activeTool.id === 'crypto-hasher' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium">Input Plaintext / Token:</label>
                <input
                  type="text"
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[#050713] border border-slate-800 rounded-xl text-xs text-[#EDF4FF] focus:outline-none focus:border-[#48C8FF]"
                />
                <button
                  onClick={handleCalculateHashes}
                  className="px-4 py-2 bg-[#48C8FF] text-[#050713] hover:bg-[#38b6ed] rounded-xl text-xs font-bold transition-colors"
                >
                  Generate Hashes & Calculate Entropy
                </button>
              </div>

              {hashResult && (
                <div className="p-4 rounded-xl bg-[#050713] border border-slate-800 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-300">Shannon Entropy:</span>
                    <span className="font-mono text-[#48C8FF] font-bold">
                      {hashResult.shannonEntropy} bits/byte ({hashResult.entropyClassification})
                    </span>
                  </div>

                  <div className="space-y-2 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-500 block">SHA-256:</span>
                      <span className="text-[#EDF4FF] break-all">{hashResult.sha256}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">MD5:</span>
                      <span className="text-slate-400 break-all">{hashResult.md5}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tool Implementation 4: Text Summarizer */}
          {activeTool.id === 'text-summarizer' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium">Text Body:</label>
                <textarea
                  rows={4}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[#050713] border border-slate-800 rounded-xl text-xs text-[#EDF4FF] focus:outline-none focus:border-[#48C8FF]"
                />
                <button
                  onClick={handleAnalyzeText}
                  className="px-4 py-2 bg-[#48C8FF] text-[#050713] hover:bg-[#38b6ed] rounded-xl text-xs font-bold transition-colors"
                >
                  Analyze Complexity
                </button>
              </div>

              {textStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-[#050713] rounded-xl border border-slate-800 text-center">
                    <div className="text-slate-500 uppercase text-[10px]">Words</div>
                    <div className="font-bold text-[#EDF4FF] text-base mt-1">{textStats.wordsCount}</div>
                  </div>
                  <div className="p-3 bg-[#050713] rounded-xl border border-slate-800 text-center">
                    <div className="text-slate-500 uppercase text-[10px]">Est. Tokens</div>
                    <div className="font-bold text-[#48C8FF] text-base mt-1">{textStats.estimatedTokens}</div>
                  </div>
                  <div className="p-3 bg-[#050713] rounded-xl border border-slate-800 text-center">
                    <div className="text-slate-500 uppercase text-[10px]">Grade Level</div>
                    <div className="font-bold text-[#9875FF] text-base mt-1">{textStats.gradeLevel}</div>
                  </div>
                  <div className="p-3 bg-[#050713] rounded-xl border border-slate-800 text-center">
                    <div className="text-slate-500 uppercase text-[10px]">Read Time</div>
                    <div className="font-bold text-slate-300 text-base mt-1">{textStats.readingTimeMinutes}m</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tool Implementation 5: Research Notes Organizer */}
          {activeTool.id === 'research-notes' && (
            <div className="space-y-4">
              <form onSubmit={handleAddNote} className="space-y-2 p-3 bg-[#050713] rounded-xl border border-slate-800">
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Note headline..."
                    className="col-span-2 px-3 py-1.5 bg-[#0A1022] border border-slate-800 rounded-lg text-xs text-[#EDF4FF] focus:outline-none focus:border-[#48C8FF]"
                  />
                  <input
                    type="text"
                    value={newNoteTag}
                    onChange={(e) => setNewNoteTag(e.target.value)}
                    placeholder="Tag..."
                    className="px-3 py-1.5 bg-[#0A1022] border border-slate-800 rounded-lg text-xs text-[#EDF4FF] focus:outline-none focus:border-[#48C8FF]"
                  />
                </div>
                <textarea
                  rows={2}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Note content, citation, or key finding..."
                  className="w-full px-3 py-1.5 bg-[#0A1022] border border-slate-800 rounded-lg text-xs text-[#EDF4FF] focus:outline-none focus:border-[#48C8FF]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#48C8FF] text-[#050713] rounded-lg font-bold text-xs hover:bg-[#38b6ed] transition-colors"
                >
                  Save Note
                </button>
              </form>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {notes.map((n) => (
                  <div key={n.id} className="p-3 rounded-lg bg-[#050713]/80 border border-slate-800 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-xs text-[#EDF4FF]">{n.title}</span>
                      <span className="text-[10px] text-[#48C8FF] uppercase font-mono">{n.tag}</span>
                    </div>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">{n.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
