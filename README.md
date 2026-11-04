# Athar (أثر)

Discover. Reflect. Remember.

Athar is a calm, accessible place to discover, read and share authentic Hadiths. It replaces the old Random Hadith Generator, a static site that was hosted on GitHub Pages, with a Next.js application.

Athar is under construction. Today it serves a minimal home page; Hadith reading, collections, search and accounts follow.

Repository: [github.com/imustakim/athar](https://github.com/imustakim/athar)

## Tech stack

- [Next.js](https://nextjs.org) App Router with TypeScript in strict mode
- [Tailwind CSS](https://tailwindcss.com) v4
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

The app runs at http://localhost:3000. No environment file is needed yet.

## Checks

| Script                 | What it does                                   |
| ---------------------- | ---------------------------------------------- |
| `npm run format:check` | Checks formatting with Prettier (never writes) |
| `npm run lint`         | Lints with ESLint and the Next.js rules        |
| `npm run typecheck`    | Type-checks with `tsc --noEmit`                |
| `npm run test`         | Runs the Vitest unit tests in `tests/unit`     |
| `npm run build`        | Builds the production app                      |

## End-to-end tests

The Playwright suite in `tests/e2e` drives a real browser against the production build, on a desktop and a mobile Chromium project. It is not part of the checks above; run it on its own.

```bash
npx playwright install chromium   # once per machine
npm run test:e2e
```

The suite builds and starts the app on port 3100. Outside CI it reuses a server already running there, so a server left over from another worktree's build can be tested by mistake. Set `E2E_PORT` to use a different port, for example `E2E_PORT=3101 npm run test:e2e`. The HTML report is written to `playwright-report`.

Import `test` and `expect` from `tests/e2e/fixtures.ts`, not from `@playwright/test`. Its fixture fails any test that logs a console error or throws an uncaught page error, including one that arrives after the last assertion.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Data source

Hadith texts come from the open [Hadith API](https://github.com/fawazahmed0/hadith-api) by fawazahmed0, served through jsDelivr. Athar shows only authentic Hadiths from real sources, always with their reference and source attribution.
