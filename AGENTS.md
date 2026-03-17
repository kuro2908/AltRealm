# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains all application code.
- `src/pages/` holds route-level screens used by React Router.
- `src/components/` is for shared UI; `src/components/ui/` is the shadcn-style primitives.
- `src/hooks/` and `src/lib/` contain reusable logic (e.g., Firebase, themes, utilities).
- `src/test/` includes Vitest setup and example tests.
- `public/` is for static assets served by Vite.
- Root configs to know: `vite.config.ts`, `tailwind.config.ts`, `eslint.config.js`, `vitest.config.ts`, `playwright.config.ts`.

## Build, Test, and Development Commands
Use npm or Bun; scripts are defined in `package.json`.
- `npm install` or `bun install`: install dependencies.
- `npm run dev`: start the Vite dev server.
- `npm run build`: production build to `dist/`.
- `npm run build:dev`: dev-mode build (useful for debugging build issues).
- `npm run preview`: serve the production build locally.
- `npm run lint`: run ESLint across the repo.
- `npm run test`: run Vitest once.
- `npm run test:watch`: run Vitest in watch mode.

## Coding Style & Naming Conventions
- TypeScript + React with JSX in `.tsx`.
- Match existing formatting: 2-space indentation, double quotes, and semicolons.
- Prefer the `@/` alias for imports from `src/` (configured in `vitest.config.ts`).
- Component files use `PascalCase` (e.g., `StoryEditor.tsx`), hooks use `useX` naming, and utilities are `camelCase`.
- Styling is primarily Tailwind; keep global styles in `src/index.css` or `src/App.css`.

## Testing Guidelines
- Unit/component tests use Vitest with `jsdom`.
- Test files must match `src/**/*.{test,spec}.{ts,tsx}`.
- Shared setup lives in `src/test/setup.ts`.
- If you add Playwright tests later, keep them under a dedicated folder and run `npx playwright test`.

## Commit & Pull Request Guidelines
- Commit messages are short, lowercase phrases (e.g., `responsive and dialogue update`).
- Keep PRs focused; include a summary, test commands run, and screenshots for UI changes.
- Link related issues or tasks when available.

## Security & Configuration Tips
- Client-side environment variables live in `.env` and use the `VITE_` prefix.
- Do not hardcode secrets in source; use `.env` overrides for local development.
