# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on http://localhost:8080
npm run build        # Production build (output: /dist)
npm run lint         # Run ESLint
npm test             # Run Vitest unit tests once
npm run test:watch   # Run Vitest in watch mode
```

## Architecture

**AltRealm (StoryWeaver)** is a React SPA for creating and reading interactive branching narratives.

### Stack
- **Vite + React 18 + TypeScript** — built with SWC
- **shadcn-ui + Radix UI + Tailwind CSS** — UI components; import from `@/components/ui/`
- **React Router v6** — client-side routing
- **TanStack React Query** — server state (wraps the mock `db` layer)
- **Framer Motion** — animations
- **React Hook Form + Zod** — form handling and validation

### Path Alias
`@/` maps to `./src/` (configured in `tsconfig.json` and `vite.config.ts`).

### Routing (`src/App.tsx`)
```
/         → redirect to /auth
/auth     → AuthPage
/dashboard → Dashboard
/editor/:id → StoryEditor (use "new" as id for new stories)
/reader/:id → ReaderMode
/community → CommunityFeed
```

### Data Layer (`src/lib/utils.ts`)
All persistence goes through the `db` object — a mock API layer backed by `localStorage` with keys prefixed `sw_`. Designed for easy migration to Firebase. Keys:
- `sw_user` — current session
- `sw_my_stories` — user's stories
- `sw_feed` — community feed
- `sw_nodes_<storyId>` — story node graph for a given story

### Story Data Model
Stories consist of `StoryNode` objects with `choices` arrays that link nodes by `targetId`, forming the branching graph that the editor visualizes and the reader traverses.

### Key Pages
- **StoryEditor** (`src/pages/StoryEditor.tsx`) — node-based canvas editor for building branching narratives
- **ReaderMode** (`src/pages/ReaderMode.tsx`) — interactive reader that traverses the story graph via choices
- **CommunityFeed** (`src/pages/CommunityFeed.tsx`) — discover published stories

### Styling
Tailwind dark mode uses `class` strategy. Custom theme tokens in `tailwind.config.ts` include `sidebar-*`, `node-*`, and `canvas-*` color families used by the editor. Custom fonts: "Public Sans" (sans) and "Source Serif 4" (prose/reader).

### Testing
- **Unit tests:** Vitest + jsdom + `@testing-library/react`, setup in `src/test/setup.ts`
- **E2E tests:** Playwright (`playwright.config.ts`)
