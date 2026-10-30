export type AppRoute = '/' | '/terminal' | '/markets' | '/portfolio' | '/analytics' | '/research' | '/tools' | '/settings' | '/workspace';

export type SearchCategory = 'all' | 'web' | 'research' | 'markets' | 'tools';

export * from './market';

export interface PaperPosition {
  symbol: string;
  name: string;
  shares: number;
  avgEntryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export interface PaperTradeOrder {
  id: string;
  timestamp: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  shares: number;
  price: number;
  totalValue: number;
  status: 'FILLED' | 'REJECTED';
  isSimulated: true;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: 'research' | 'productivity' | 'markets' | 'developer' | 'security' | 'data';
  icon: string;
  isRealIntegration: boolean;
  status: 'active' | 'beta' | 'offline';
  requiresConfig?: boolean;
}

export interface UserPreferences {
  webglQuality: 'high' | 'medium' | 'low' | 'off';
  earthRotationSpeed: number;
  enableSatellites: boolean;
  enableNightLights: boolean;
  cameraPreset: 'orbit' | 'polar' | 'nightside' | 'horizon';
  soundEnabled: boolean;
  theme: 'dark';
}

export interface ResearchSection {
  title: string;
  content: string;
  facts: string[];
  sources: string[];
}

export interface ResearchSource {
  title: string;
  url: string;
  publisher: string;
  reliability: string;
}

export interface ComparativeAnalysis {
  metric: string;
  finding: string;
}

export interface ResearchReport {
  id?: string;
  query: string;
  timestamp: string;
  model: string;
  confidenceScore: number;
  executiveSummary: string;
  keyFindings: string[];
  sections: ResearchSection[];
  comparativeAnalysis?: ComparativeAnalysis[];
  sources: ResearchSource[];
  isSimulated?: boolean;
}

export interface SearchItem {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  timestamp?: string;
  isSimulated?: boolean;
}

export interface SearchOverview {
  summary: string;
  keyPoints: string[];
  sourcesUsed: string[];
  modelUsed: string;
  isRealTimeAI: boolean;
}

export interface SearchResponse {
  query: string;
  category: SearchCategory;
  results: SearchItem[];
  aiOverview?: SearchOverview;
  cached?: boolean;
}

