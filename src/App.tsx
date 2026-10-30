import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RouterProvider, useRouter } from './context/RouterContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { UniverseCanvas } from './components/universe/UniverseCanvas';
import { TopBar } from './components/navigation/TopBar';
import { TerminalView } from './features/terminal/TerminalView';
import { MarketsView } from './features/markets/MarketsView';
import { PortfolioView } from './features/portfolio/PortfolioView';
import { AnalyticsView } from './features/analytics/AnalyticsView';
import { SettingsView } from './features/settings/SettingsView';
import { ResearchView } from './features/research/ResearchView';
import { ToolsView } from './features/tools/ToolsView';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('NEXORA Uncaught Boundary Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050713] text-[#EDF4FF] flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 bg-[#0A1022] border border-rose-500/30 rounded-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#EDF4FF]">Application Recovery Intercept</h2>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              NEXORA caught an unexpected execution boundary error. Your workspace state is safeguarded.
            </p>
            <div className="p-3 bg-[#050713] rounded-lg text-left text-[11px] font-mono text-rose-300 overflow-auto max-h-32">
              {this.state.error?.message || 'Unknown runtime anomaly.'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#48C8FF] text-[#050713] font-bold text-xs rounded-lg hover:bg-[#38b6ed] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Terminal</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const RouteRenderer: React.FC = () => {
  const { currentRoute } = useRouter();

  switch (currentRoute) {
    case '/markets':
      return <MarketsView />;
    case '/portfolio':
      return <PortfolioView />;
    case '/analytics':
      return <AnalyticsView />;
    case '/settings':
      return <SettingsView />;
    case '/research':
      return <ResearchView />;
    case '/tools':
      return <ToolsView />;
    case '/terminal':
    case '/':
    default:
      return <TerminalView />;
  }
};

export default function App() {
  return (
    <GlobalErrorBoundary>
      <RouterProvider>
        <WorkspaceProvider>
          <div className="relative min-h-screen bg-[#050713] text-[#EDF4FF] flex flex-col font-sans selection:bg-[#48C8FF]/20 selection:text-[#48C8FF]">
            {/* Living 3D Universe Canvas Background */}
            <UniverseCanvas />

            {/* Top Navigation Bar */}
            <TopBar />

            {/* Dynamic Active Route View */}
            <main className="relative z-10 flex-grow">
              <RouteRenderer />
            </main>

            {/* Architectural Footer */}
            <footer className="relative z-10 w-full border-t border-slate-900 bg-[#050713]/90 py-4 text-center text-xs text-slate-500">
              <div className="max-w-[1720px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#EDF4FF]">NEXORA TERMINAL</span>
                  <span>·</span>
                  <span>Real-Time Market Data Architecture</span>
                </div>
                <div>
                  <span>Verified Provider Feeds · Zero Synthesized Prices · Paper Trading Environment</span>
                </div>
              </div>
            </footer>
          </div>
        </WorkspaceProvider>
      </RouterProvider>
    </GlobalErrorBoundary>
  );
}
