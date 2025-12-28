# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Start Next.js development server
npm run build    # Build for production (static export)
npm run lint     # Run ESLint checks
npm start        # Start production server
```

**Note**: This project uses static export (`output: 'export'`) for GitHub Pages. All pages must support static generation or use `generateStaticParams()` for dynamic routes.

## Architecture Overview

### Route Structure (Next.js App Router)
- `(main)/` - Standard layout with header/footer
- `(editor)/` - Editor layout without header (full-screen focused)

### Core Layers
| Layer | Location | Purpose |
|-------|----------|---------|
| Pages | `src/app/` | Route handlers and page components |
| Components | `src/components/` | Reusable UI and feature components |
| Hooks | `src/hooks/` | Custom React hooks for data fetching/state |
| Stores | `src/stores/` | Zustand global state (editor, subscription, marketplace) |
| Types | `src/types/` | TypeScript types and domain models |

### State Management (Zustand)
- `editorStore.ts` - Editor canvas state (slots, history, selection, zoom)
- `subscriptionStore.ts` - Premium tier state (localStorage persisted)
- `marketplaceStore.ts` - Purchases, sales, creator earnings

### Backend Integration (Supabase)
- `lib/supabase/client.ts` - Browser client with demo mode support
- `lib/supabase/server.ts` - Server-side client
- `lib/supabase/storage.ts` - Image upload utilities

## Demo Mode Pattern

The app supports running without Supabase backend using `IS_DEMO_MODE` flag:

```typescript
import { IS_DEMO_MODE } from '@/lib/supabase/client'

if (IS_DEMO_MODE) {
  // Use localStorage or mock data
} else {
  // Use Supabase
}
```

This enables GitHub Pages static hosting without a backend.

## Key Conventions

### Design System
- **Primary**: `#FFD9D9` (pastel pink) - Strawberry Cream theme
- **Accent**: `#D7FAFA` (pastel mint)
- Uses Tailwind CSS v4 with custom color tokens

### Component Patterns
- Server Components by default (App Router)
- Client Components marked with `'use client'`
- Page-specific client components in `components/pages/`
- Reusable UI in `components/ui/`

### Hook Pattern
All data hooks follow this structure:
- Support demo mode with localStorage fallback
- Return `{ data, isLoading, error }` states
- Handle Supabase operations with proper error handling

### Path Alias
```typescript
import { Button } from '@/components/ui'  // @/* maps to ./src/*
```

## Static Export Requirements

For dynamic routes, implement `generateStaticParams()`:

```typescript
// Required for [username] routes
export function generateStaticParams() {
  return [
    { username: 'strawberry123' },
    { username: 'fairy_art' },
    // ... predefined paths
  ]
}
```

## Documentation

- `/docs/master-prompt/` - Detailed specifications (design system, API, database schema)
- `/PROGRESS.md` - Development progress tracking
- `/OPERATIONS.md` - Revenue model and operations
