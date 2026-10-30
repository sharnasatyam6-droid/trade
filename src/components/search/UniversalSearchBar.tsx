import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { SearchCategory } from '../../types';
import { Search, Sparkles, Mic, ArrowRight, CornerDownLeft, Globe, Brain, TrendingUp, Wrench, X } from 'lucide-react';

interface SearchBarProps {
  initialQuery?: string;
  autoFocus?: boolean;
  onSearch?: (query: string, category: SearchCategory, useAi: boolean) => void;
  compact?: boolean;
}

const SAMPLE_SUGGESTIONS: Record<SearchCategory, string[]> = {
  all: [
    'James Webb Space Telescope observations of early galaxies',
    'Quantum fault-tolerant logical qubit error correction',
    'NVIDIA Blackwell architecture HBM3e bandwidth benchmarks',
    'Post-quantum cryptography standards by NIST',
    'Bitcoin Layer 2 zero-knowledge state transitions',
  ],
  web: [
    'Deep space satellite constellations in low Earth orbit',
    'Next generation semiconductor lithography EUV',
    'Autonomous multi-agent orchestration frameworks',
  ],
  research: [
    'Empirical validation of sparse mixture-of-experts inference',
    'CRISPR-Cas9 epigenetic methylation silencing efficacy',
    'Fusion magnetic confinement plasma stability metrics',
  ],
  markets: [
    'NVDA earnings guidance and CoWoS supply constraints',
    'BTC/USD institutional spot ETF cumulative inflows',
    'Federal Reserve balance sheet quantitative tightening rate',
  ],
  tools: [
    'SSRF-safe URL structure and authority inspector',
    'Cryptographic Shannon entropy and hash validator',
    'JSON tree depth and schema formatting benchmark',
  ],
};

export const UniversalSearchBar: React.FC<SearchBarProps> = ({
  initialQuery = '',
  autoFocus = false,
  onSearch,
  compact = false,
}) => {
  const { searchQuery, setSearchQuery, searchCategory, setSearchCategory, navigate } = useRouter();
  const { searchHistory, addSearchHistory } = useWorkspace();

  const [localQuery, setLocalQuery] = useState(initialQuery || searchQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [useAi, setUseAi] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // Sync external search query
  useEffect(() => {
    if (searchQuery !== localQuery && searchQuery) {
      setLocalQuery(searchQuery);
    }
  }, [searchQuery]);

  // Handle typing trail effect
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => setIsTyping(false), 350);
  };

  const currentSuggestions = (SAMPLE_SUGGESTIONS[searchCategory] || SAMPLE_SUGGESTIONS.all).filter(
    (s) => !localQuery || s.toLowerCase().includes(localQuery.toLowerCase())
  );

  const handleSubmit = (queryToSubmit?: string) => {
    const q = (queryToSubmit ?? localQuery).trim();
    if (!q) return;

    addSearchHistory(q);
    setSearchQuery(q);
    setIsFocused(false);

    if (onSearch) {
      onSearch(q, searchCategory, useAi);
    } else {
      if (searchCategory === 'research') {
        navigate('/research', { q });
      } else if (searchCategory === 'markets') {
        navigate('/markets', { q });
      } else if (searchCategory === 'tools') {
        navigate('/tools', { q });
      } else {
        // Universal search route
        navigate('/', { q, category: searchCategory });
      }
    }
  };

  // Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < currentSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : currentSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < currentSuggestions.length) {
        setLocalQuery(currentSuggestions[selectedIndex]);
        handleSubmit(currentSuggestions[selectedIndex]);
      } else {
        handleSubmit();
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      setSelectedIndex(-1);
    }
  };

  // Voice Search Web Speech API
  const handleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice search is not supported in this browser version.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setLocalQuery(transcript);
          handleSubmit(transcript);
        }
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  const categories: { id: SearchCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'all', label: 'All', icon: Globe },
    { id: 'web', label: 'Web', icon: Search },
    { id: 'research', label: 'AI Research', icon: Brain },
    { id: 'markets', label: 'Markets', icon: TrendingUp },
    { id: 'tools', label: 'Tools', icon: Wrench },
  ];

  return (
    <div className={`relative w-full ${compact ? 'max-w-2xl' : 'max-w-3xl'} mx-auto`}>
      {/* Search Container with Astrologer-inspired Illuminated Border */}
      <div
        className={`relative rounded-2xl bg-[#0A1022]/90 backdrop-blur-xl transition-all duration-300 border ${
          isFocused
            ? 'border-[#48C8FF] shadow-[0_0_35px_rgba(72,200,255,0.22)]'
            : 'border-[#48C8FF]/20 hover:border-[#48C8FF]/40 shadow-xl'
        }`}
      >
        {/* Subtle luminous typing line along the top perimeter */}
        <div
          className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#48C8FF] to-transparent transition-opacity duration-300 ${
            isTyping ? 'opacity-100 scale-x-100' : isFocused ? 'opacity-40 scale-x-75' : 'opacity-0 scale-x-0'
          }`}
        />

        {/* Category Tabs Strip */}
        <div className="flex items-center gap-1 px-4 pt-3 pb-1 border-b border-slate-800/60 overflow-x-auto no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = searchCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSearchCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'text-[#48C8FF] bg-[#48C8FF]/15 border border-[#48C8FF]/30'
                    : 'text-[#94A3B8] hover:text-[#EDF4FF] hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}

          <div className="ml-auto flex items-center gap-2 pl-2">
            {/* AI Toggle */}
            <button
              type="button"
              onClick={() => setUseAi(!useAi)}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors border ${
                useAi
                  ? 'border-[#9875FF]/40 text-[#9875FF] bg-[#9875FF]/15'
                  : 'border-slate-800 text-slate-500 hover:text-slate-400'
              }`}
              title="Toggle Gemini AI Synthesis"
            >
              <Sparkles className="w-3 h-3 text-[#9875FF]" />
              <span>AI Synthesis</span>
            </button>
          </div>
        </div>

        {/* Input Row */}
        <div className="flex items-center px-4 py-3 gap-3">
          <Search className={`w-5 h-5 shrink-0 transition-colors ${isFocused ? 'text-[#48C8FF]' : 'text-slate-500'}`} />

          <input
            ref={inputRef}
            type="text"
            value={localQuery}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={handleKeyDown}
            autoFocus={autoFocus}
            placeholder={
              searchCategory === 'research'
                ? 'Ask a deep scientific, economic, or technical question...'
                : searchCategory === 'markets'
                ? 'Search tickers, cryptos, or indices (e.g. NVDA, BTC/USD)...'
                : searchCategory === 'tools'
                ? 'Find or run a digital utility...'
                : 'Explore the web or examine deep intelligence...'
            }
            className="w-full bg-transparent text-[#EDF4FF] placeholder:text-slate-500 text-base md:text-lg focus:outline-none selection:bg-[#48C8FF]/30"
          />

          {localQuery && (
            <button
              type="button"
              onClick={() => {
                setLocalQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-500 hover:text-slate-300 rounded"
              aria-label="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Voice Search Button */}
          <button
            type="button"
            onClick={handleVoiceSearch}
            className={`p-1.5 rounded-lg border transition-colors ${
              isListening
                ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                : 'border-slate-800 text-slate-400 hover:text-[#EDF4FF] hover:border-slate-700'
            }`}
            title="Voice search"
            aria-label="Voice search"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Submit Action */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!localQuery.trim()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#48C8FF] text-[#050713] hover:bg-[#38b6ed] disabled:opacity-40 disabled:hover:bg-[#48C8FF] transition-all font-semibold text-xs shrink-0 shadow-md shadow-[#48C8FF]/20"
          >
            <span>Search</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Suggestions and History Flyout */}
      {isFocused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A1022]/98 border border-[#48C8FF]/25 rounded-xl shadow-2xl p-2 z-50 backdrop-blur-xl">
          {searchHistory.length > 0 && !localQuery && (
            <div className="mb-2 pb-2 border-b border-slate-800/80">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-500 tracking-wider">
                RECENT QUERIES
              </div>
              {searchHistory.slice(0, 3).map((item) => (
                <button
                  key={item}
                  type="button"
                  onMouseDown={() => {
                    setLocalQuery(item);
                    handleSubmit(item);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-[#EDF4FF] hover:bg-[#48C8FF]/10 hover:text-[#48C8FF] transition-colors text-left"
                >
                  <span className="truncate">{item}</span>
                  <span className="text-[10px] text-slate-500">History</span>
                </button>
              ))}
            </div>
          )}

          <div className="px-3 py-1 text-[11px] font-semibold text-[#48C8FF]/80 tracking-wider">
            SUGGESTED EXPLORATIONS
          </div>
          {currentSuggestions.slice(0, 5).map((suggestion, idx) => (
            <button
              key={suggestion}
              type="button"
              onMouseDown={() => {
                setLocalQuery(suggestion);
                handleSubmit(suggestion);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left ${
                selectedIndex === idx
                  ? 'bg-[#48C8FF]/20 text-[#48C8FF] font-medium'
                  : 'text-[#94A3B8] hover:text-[#EDF4FF] hover:bg-slate-800/50'
              }`}
            >
              <span className="truncate">{suggestion}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
