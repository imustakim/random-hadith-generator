# Next.js, Supabase and Vercel as the mandated stack

The product owner fixed the stack: Next.js App Router with strict TypeScript, Tailwind CSS with shadcn/ui, Motion for React, Supabase (Postgres, Auth, Row Level Security) for all user data, TanStack Query for client-side server-state only, Zod for runtime validation, Vercel hosting, and Vitest with Playwright for tests. Alternatives are not introduced without a compelling technical reason recorded in a new ADR. The app lives at the repository root, replacing the old static GitHub Pages site, which Athar no longer depends on.
