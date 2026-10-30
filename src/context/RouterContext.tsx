import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppRoute, SearchCategory } from '../types';

interface RouterContextType {
  currentRoute: AppRoute;
  searchQuery: string;
  searchCategory: SearchCategory;
  selectedToolId: string | null;
  selectedSymbol: string;
  setSelectedSymbol: (sym: string) => void;
  navigate: (route: AppRoute, params?: { q?: string; category?: SearchCategory; toolId?: string; symbol?: string }) => void;
  setSearchQuery: (q: string) => void;
  setSearchCategory: (cat: SearchCategory) => void;
  setSelectedToolId: (toolId: string | null) => void;
}

const VALID_ROUTES: AppRoute[] = ['/', '/terminal', '/markets', '/portfolio', '/analytics', '/research', '/tools', '/settings'];

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const RouterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    const path = window.location.pathname as AppRoute;
    if (VALID_ROUTES.includes(path)) {
      return path;
    }
    return '/terminal'; // Default to Trading Terminal!
  });

  const [selectedSymbol, setSelectedSymbol] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('symbol') || 'BTC';
  });

  const [searchQuery, setSearchQuery] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || '';
  });

  const [searchCategory, setSearchCategory] = useState<SearchCategory>(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('cat') as SearchCategory;
    return ['all', 'web', 'research', 'markets', 'tools'].includes(cat) ? cat : 'all';
  });

  const [selectedToolId, setSelectedToolId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tool');
  });

  const navigate = (route: AppRoute, params?: { q?: string; category?: SearchCategory; toolId?: string; symbol?: string }) => {
    setCurrentRoute(route);
    const url = new URL(window.location.origin + route);

    if (params?.symbol !== undefined) {
      setSelectedSymbol(params.symbol);
      url.searchParams.set('symbol', params.symbol);
    } else if (selectedSymbol) {
      url.searchParams.set('symbol', selectedSymbol);
    }

    if (params?.q !== undefined) {
      setSearchQuery(params.q);
      if (params.q) url.searchParams.set('q', params.q);
    }

    if (params?.category !== undefined) {
      setSearchCategory(params.category);
      if (params.category !== 'all') url.searchParams.set('cat', params.category);
    }

    if (params?.toolId !== undefined) {
      setSelectedToolId(params.toolId);
      if (params.toolId) url.searchParams.set('tool', params.toolId);
    }

    window.history.pushState({}, '', url.toString());
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname as AppRoute;
      if (VALID_ROUTES.includes(path)) {
        setCurrentRoute(path);
      } else {
        setCurrentRoute('/terminal');
      }

      const params = new URLSearchParams(window.location.search);
      if (params.get('symbol')) setSelectedSymbol(params.get('symbol')!);
      setSearchQuery(params.get('q') || '');
      const cat = params.get('cat') as SearchCategory;
      setSearchCategory(['all', 'web', 'research', 'markets', 'tools'].includes(cat) ? cat : 'all');
      setSelectedToolId(params.get('tool'));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <RouterContext.Provider
      value={{
        currentRoute,
        searchQuery,
        searchCategory,
        selectedToolId,
        selectedSymbol,
        setSelectedSymbol,
        navigate,
        setSearchQuery,
        setSearchCategory,
        setSelectedToolId,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = (): RouterContextType => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};
