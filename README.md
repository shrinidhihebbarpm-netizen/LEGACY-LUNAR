# Silent Explorers: NASA’s Left-Behind Machines

An interactive 3D solar-system explorer and story-driven astronomy web application chronicling the rovers, landers, space telescopes, scientific experiments, and deep-space probes across the Moon, Mars, the outer planets, and interstellar space.

## Features

- **Editorial Landing Experience (`/`)**: Scroll-driven space storytelling with chapter navigation, artifact spotlights, Lunar/Martian/Deep-Space chapters, a filterable Mission Ledger (`14` verified NASA artifacts), and direct 3D object launch cards.
- **Interactive 3D Solar System Explorer (`/explore`)**:
  - Heliocentric 3D simulation powered by Three.js featuring Keplerian planetary orbits, Earth’s Moon (`/models/moon.glb`), Saturn & Rings (`/models/saturn.glb`), the Asteroid Belt, and outbound deep-space trajectories (`Voyager 1 & 2`, `Pioneer 10 & 11`, `New Horizons`).
  - Time-rate scrubber (`-1YR/S` to `+1YR/S`), live UTC sync, lighting mode switcher (`natural`, `shadow`, `flood`), scene layer toggles, and quick-focus HUD controls.
- **Direct 3D Model Viewer (`ModelViewerModal`)**:
  - Clicking any planet, moon, space telescope, lander, rover, or spacecraft opens its exact 3D model directly with orbit rotation, zoom controls, reset camera, and technical telemetry.
  - Includes **23 GLB 3D meshes** (Draco-supported) plus procedural globes/assemblies—featuring **Earth’s Moon**, **Apollo Lunar Roving Vehicle ("Moon Buggy")**, **Surveyor 3 Lunar Lander**, **Apollo Lunar Module ("Eagle")**, **Saturn & Ring System**, **James Webb Space Telescope**, **Hubble Space Telescope**, **Mars rovers/helicopters/landers** (`Opportunity`, `Perseverance`, `Ingenuity`, `InSight`, `MAVEN`), and deep-space probes (`Juno`, `Cassini-Huygens`, `Voyager`, `Pioneer 10`, `New Horizons`).
  - Objects without an available 3D mesh (such as the Sun) display a clear `"3D model coming soon"` preview state.
- **Ghost Missions Gallery & Mission Timeline**: Chronological exploration of retired, dormant, active, and still-traveling missions across the Solar System.
- **Space Explorer AI**: Persistent astronomy & space-missions assistant available across pages (`POST /api/explorer-guide`), powered by `@google/genai` with a verified offline knowledge fallback and authoritative NASA/ESA citations.

## Tech Stack

- **Frontend**: React 19, TypeScript, React Router DOM 7, Tailwind CSS v4, Lucide React
- **3D Engine**: Three.js (`GLTFLoader`, `DRACOLoader`, `OrbitControls`, `RoomEnvironment`)
- **Backend / Dev Server**: Express + Vite middleware (`server.ts`)
- **AI Integration**: `@google/genai` (server-side `/api/explorer-guide`)
- **Testing**: Node built-in test runner (`node:test`) via `tsx`

## Project Structure

```text
├── index.html                  # HTML entry point & SEO metadata
├── metadata.json               # Application metadata
├── server.ts                   # Express server + /api/explorer-guide + Vite/static serving
├── public/
│   ├── draco/gltf/             # Local Draco GLB/glTF decoder binaries
│   ├── models/                 # 23 GLB 3D models (Moon, Apollo LRV, Surveyor 3, Saturn, JWST, Hubble, etc.)
│   └── textures/planets/       # Equirectangular planetary textures
└── src/
    ├── App.tsx                 # Route definitions (/ and /explore)
    ├── data/
    │   ├── spaceData.ts        # Mission artifacts, 3D model catalog, links & Space Explorer AI helpers
    │   └── spaceData.test.ts   # Unit tests for assets, mappings, and data integrity
    ├── components/
    │   ├── SolarSystemCanvas.tsx   # Interactive 3D Solar System WebGL stage
    │   ├── ModelViewerModal.tsx    # Direct 3D model inspector modal
    │   └── ExplorerGuideChat.tsx   # Space Explorer AI chat widget
    ├── pages/
    │   ├── LandingPage.tsx     # Scroll-driven editorial homepage
    │   └── ExplorePage.tsx     # Full 3D Solar System explorer & archives
    └── utils/
        ├── proceduralModels.ts     # Procedural Three.js globes & assemblies
        ├── solarSystemSim.ts       # Orbital mechanics, trajectories & time-rate simulation
        └── solarSystemSim.test.ts  # Unit tests for orbital mechanics & simulation clock
```

## Getting Started

### Prerequisites

- Node.js 20+ and npm

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` if running locally with live Gemini responses for Space Explorer AI:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

> If `GEMINI_API_KEY` is omitted, Space Explorer AI automatically uses its built-in verified space knowledge base.

### Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Express + Vite development server on `http://localhost:3000` |
| `npm run build` | Build production frontend assets into `dist/` |
| `npm start` | Start the production server (`NODE_ENV=production` serves `dist/`) |
| `npm run lint` | Run TypeScript type checking (`tsc --noEmit`) |
| `npx tsx --test src/data/spaceData.test.ts src/utils/solarSystemSim.test.ts` | Run unit tests for data integrity, asset paths, and orbital math |

## Attribution & Sources

Mission narratives, ephemeris context, and archival references are sourced from public NASA and partner observatory portals including:

- [NASA Science Solar System Exploration](https://science.nasa.gov/solar-system/)
- [NASA 3D Resources](https://science.nasa.gov/3d-resources/)
- [NASA Eyes on the Solar System](https://eyes.nasa.gov/apps/orrery/)
- [NASA James Webb Space Telescope](https://science.nasa.gov/mission/webb/) & [ESA/Webb](https://esawebb.org/)
- [NASA Hubble Space Telescope Archive](https://science.nasa.gov/mission/hubble/)
- [NASA Planetary Data System (PDS)](https://pds.nasa.gov/)
