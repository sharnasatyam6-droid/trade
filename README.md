# NEXORA — Intelligence Beyond Search

> "Explore the web. Understand the universe. Control your digital world."

NEXORA combines a living, cinematic WebGL universe with an AI-powered search experience, structured deep research dossiers, real-time financial market analytics, a paper-trading terminal, and an extensible digital tool directory.

---

## 1. Executive Summary & Capabilities

NEXORA transforms passive search into an interactive intelligence workspace:
1. **Living 3D Universe**: Spherical Earth with axial tilt, procedural continents/oceans, night-side metropolitan illumination, multiple deterministic satellite orbital planes, and deep space starfields with WebGL fallback.
2. **Universal Search & AI Synthesis**: Categorized query resolution (Web, AI Research, Markets, Tools) powered server-side by Google Gemini `gemini-3.8-flash` with provenance tracking and zero fabricated links.
3. **Deep AI Research Workspace**: Multimodal research reports differentiating empirical facts from speculative hypothesis, comparative matrices, confidence scoring, and Markdown export.
4. **Market Intelligence & Paper Trading**: Searchable watchlist, interactive candlestick/OHLC and area charts, volume visualization, and a simulated paper-trading desk with real portfolio accounting.
5. **Tool Lab**: Modular utility registry including an SSRF-safe URL inspector, JSON structural validator, Shannon cryptographic entropy calculator, and research note organizers.
6. **User Workspace**: Local-first encrypted workspace preservation, search history, watchlist management, and full JSON export/import.

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion, Lucide Icons
- **3D Graphics**: Three.js (Procedural geometries, PBR materials, ACESFilmic tone mapping, software-WebGL detection)
- **Backend**: Node.js, Express, tsx
- **AI Engine**: `@google/genai` TypeScript SDK (server-side only via proxy routes)
- **Persistence**: LocalStorage with schema validation (Neon PostgreSQL adapter architecture ready)
- **Testing**: Node.js test runner (`node:test`)

---

## 3. Five Primary Application Routes

- `/`: Cinematic Home & Universal Search
- `/research`: AI Research Workspace & Structured Dossiers
- `/markets`: Financial Market Intelligence & Paper Trading Terminal
- `/tools`: Modular Tool Directory & Utilities
- `/workspace`: Personal Intelligence Archives, Portfolio, & Settings

---

## 4. Environment Variables

| Variable | Required | Default / Description |
|---|---|---|
| `GEMINI_API_KEY` | Recommended | Google Gemini API key for server-side search synthesis and deep research. Automatically injected in Google AI Studio. |
| `SEARCH_API_KEY` | Optional | External web search provider API key (Google CSE, Serper, Tavily). When omitted, NEXORA seamlessly operates in high-fidelity curated domain mode with clear provenance tags. |
| `MARKET_DATA_API_KEY` | Optional | External market data provider key (Finnhub, Polygon). When omitted, NEXORA uses verified real-world datasets and labeled simulated paper execution. |
| `DATABASE_URL` | Optional | Neon PostgreSQL connection string. When omitted, NEXORA uses local guest persistence with JSON export/import. |
| `PORT` | Optional | `3000` (Listening port for Express). |

---

## 5. Security & Verification Directives

- **Zero Client-Side Secret Leakage**: All AI and provider keys are accessed strictly on the server (`server.ts`).
- **SSRF Defense**: The URL Inspector evaluates URL strings syntactically and flags RFC1918 private IPs (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.1`, `169.254.0.0/16`) without dispatching network requests to arbitrary destinations.
- **Financial Safety**: Market data and paper-trading executions are explicitly labeled as simulated or historical. No real financial orders can be executed.
- **Citation Integrity**: NEXORA does not invent fake citations or hallucinatory external URLs.

---

## 6. Local Development & Deployment

### Local Development
```bash
# 1. Install dependencies
npm install

# 2. Start full-stack development server (Express + Vite on Port 3000)
npm run dev

# 3. Run validation test suite
npm test

# 4. Type check
npm run lint

# 5. Production build
npm run build
```

### Deployment to Vercel
1. Set the root directory to project root.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add environment variables in Vercel project settings:
   - `GEMINI_API_KEY`: Your Google Gemini API Key
   - `SEARCH_API_KEY`: (Optional)
   - `MARKET_DATA_API_KEY`: (Optional)
   - `DATABASE_URL`: (Optional)
5. Deploy.
