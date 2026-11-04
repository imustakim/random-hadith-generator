# Athar (أثر)

Discover. Reflect. Remember.

Athar is a Hadith reading platform, rebuilt from the old Random Hadith Generator on Next.js, TypeScript and Tailwind CSS. It is under construction: today it serves a minimal home page.

## Prerequisites

- Node.js 24 (see `.nvmrc`)
- npm

## Getting started

```bash
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

The suite builds and starts the app on port 3100. Outside CI it reuses a server already running there. The HTML report is written to `playwright-report`.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Hadith API](https://github.com/fawazahmed0/hadith-api)
