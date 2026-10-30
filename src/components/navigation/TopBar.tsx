import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { AppRoute } from '../../types';
import {
  Activity,
  Globe,
  PieChart,
  Settings,
  Sliders,
  Menu,
  X,
  Zap,
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const { currentRoute, navigate, selectedSymbol } = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { label: string; route: AppRoute; icon: React.ComponentType<{ className?: string }> }[] = [
    { label: 'Terminal', route: '/terminal', icon: Sliders },
    { label: 'Markets', route: '/markets', icon: Globe },
    { label: 'Portfolio', route: '/portfolio', icon: PieChart },
    { label: 'Analytics', route: '/analytics', icon: Activity },
    { label: 'Feeds & API', route: '/settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#050713]/90 backdrop-blur-md border-b border-[#48C8FF]/15 transition-colors">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/terminal')}
            className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#48C8FF] rounded"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0A1022] to-[#122244] border border-[#48C8FF]/40 flex items-center justify-center shadow-lg shadow-[#48C8FF]/10 group-hover:border-[#48C8FF] transition-all">
              <span className="font-extrabold text-[#48C8FF] text-xs font-mono tracking-tighter">NX</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold tracking-tight text-[#EDF4FF] whitespace-nowrap">
                NEXORA
              </span>
              <span className="text-[10px] text-[#48C8FF] font-mono uppercase tracking-wider font-semibold">
                TERMINAL
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: 4–5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;
            return (
              <button
                key={item.route}
                onClick={() => navigate(item.route)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap shrink-0 rounded-lg ${
                  isActive
                    ? 'text-[#48C8FF] bg-[#48C8FF]/10 border border-[#48C8FF]/30 shadow-sm'
                    : 'text-[#94A3B8] hover:text-[#EDF4FF] hover:bg-[#0A1022]/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#48C8FF]' : 'text-[#94A3B8]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/terminal', { symbol: selectedSymbol || 'BTC' })}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-[#050713] bg-[#48C8FF] hover:bg-[#38b6ed] rounded-lg transition-all shadow-md shadow-[#48C8FF]/20 active:scale-95 whitespace-nowrap shrink-0 font-mono"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>TRADE {selectedSymbol || 'BTC'}</span>
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#94A3B8] hover:text-[#EDF4FF] rounded-lg border border-slate-800"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#050713] px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;
            return (
              <button
                key={item.route}
                onClick={() => {
                  navigate(item.route);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-[#48C8FF] bg-[#48C8FF]/15 border border-[#48C8FF]/30'
                    : 'text-[#94A3B8] hover:text-[#EDF4FF]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="pt-2">
            <button
              onClick={() => {
                navigate('/research', { q: 'Quantum fault-tolerant error correction' });
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 text-center text-xs font-semibold text-[#050713] bg-[#48C8FF] rounded-lg"
            >
              Launch Query
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
