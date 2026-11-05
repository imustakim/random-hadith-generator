# Athar (أثر)

Discover. Reflect. Remember.

Athar is a calm, accessible place to discover, read and share authentic Hadiths. It replaces the old Random Hadith Generator, a static site that was hosted on GitHub Pages, with a Next.js application.

Athar is under construction. Today it serves a minimal home page; Hadith reading, collections, search and accounts follow.

Repository: [github.com/imustakim/athar](https://github.com/imustakim/athar)

## Tech stack

- [Next.js](https://nextjs.org) App Router with TypeScript in strict mode
- [Tailwind CSS](https://tailwindcss.com) v4
- [Supabase](https://supabase.com) (`@supabase/supabase-js` and `@supabase/ssr`), run locally with the Supabase CLI
- [Vitest](https://vitest.dev) for unit tests
- ESLint and Prettier for code quality

## Prerequisites

- Node.js 24 (see `.nvmrc`)
- npm

## Getting started

```bash
git clone https://github.com/imustakim/athar.git
cd athar
npm ci
npm run dev
```

The app runs at http://localhost:3000.

## Environment

To configure the app, copy `.env.example` to `.env.local` and fill in what you need. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are public: they are inlined into the browser bundle, so never put a secret in them (secret and service-role keys are rejected, and `npm run build` fails if one is set). URLs must be https, with no credentials, query or fragment; plain http is allowed only for localhost. `HADITH_API_BASE_URL` is server-only and defaults to the jsDelivr Hadith API. `NEXT_PUBLIC_*` values are baked in at build time, so after changing one in `.env.local` rebuild before `npm start` (and restart `npm run dev`). Empty values count as unset, and the app and every check script run without any env file. A malformed value fails `npm run build`, and makes the server log an error naming the variable and exit at startup; a missing required value fails when it is first used.

## Local Supabase

Local Supabase needs [Docker](https://docs.docker.com/get-docker/) running. The Supabase CLI is a dev dependency, so run it through `npx`. The project lives in `supabase/` (config, an empty `migrations/` folder and an empty `seed.sql`).

```bash
npx supabase start   # start the local stack (first run pulls images)
npx supabase status  # print the URL and keys
npx supabase stop    # stop the stack
npx supabase db reset  # recreate the database from migrations and seed.sql
```

Copy these `npx supabase status` values into `.env.local`, then restart `npm run dev`:

| `supabase status` value                | `.env.local` variable                  |
| -------------------------------------- | -------------------------------------- |
| Project URL (`API_URL` in JSON output) | `NEXT_PUBLIC_SUPABASE_URL`             |
| Publishable key (`PUBLISHABLE_KEY`)    | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |

Use only these two. Never copy the secret key or the service role key anywhere: Athar declares no variable for them.

## Checks

| Script                 | What it does                                    |
| ---------------------- | ----------------------------------------------- |
| `npm run format`       | Formats the whole project with Prettier         |
| `npm run format:check` | Checks formatting with Prettier (never writes)  |
| `npm run lint`         | Lints with ESLint and the Next.js rules         |
| `npm run typecheck`    | Type-checks with `tsc --noEmit`                 |
| `npm run test`         | Runs the Vitest unit tests in `tests/unit`      |
| `npm run build`        | Builds the production app                       |
| `npm run start`        | Serves the production build (run `build` first) |

## End-to-end tests

The Playwright suite in `tests/e2e` drives a real browser against the production build, on a desktop and a mobile Chromium project. It is not part of the checks above; run it on its own.

```bash
npx playwright install chromium   # once per machine
npm run test:e2e
```

The suite builds and starts the app on port 3100. Outside CI it reuses a server already running there, so a server left over from another worktree's build can be tested by mistake. Set `E2E_PORT` to use a different port, for example `E2E_PORT=3101 npm run test:e2e`. An empty value means 3100; anything that is not a port number between 1 and 65535 stops the run with an error. The HTML report is written to `playwright-report`.

Import `test` and `expect` from `tests/e2e/fixtures.ts`, not from `@playwright/test`. Its fixture fails any test that logs a console error or throws an uncaught page error, on any page of the test's browser context (including pages opened with `context.newPage()`), while the test runs or within 300 ms after it ends. An error that arrives later than that is not caught. `tests/e2e/fixtures.spec.ts` checks the fixture itself: each "catches" spec passes only if the fixture's final check rejects with the expected error message.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Data source

Hadith texts come from the open [Hadith API](https://github.com/fawazahmed0/hadith-api) by fawazahmed0, served through jsDelivr. Athar shows only authentic Hadiths from real sources, always with their reference and source attribution.
