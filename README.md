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

The app runs at http://localhost:3000.

## Environment

To configure the app, copy `.env.example` to `.env.local` and fill in what you need. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are public: they are inlined into the browser bundle, so never put a secret in them. `HADITH_API_BASE_URL` is server-only and defaults to the jsDelivr Hadith API. `NEXT_PUBLIC_*` values are baked in at build time, so after changing one in `.env.local` rebuild before `npm start` (and restart `npm run dev`). Empty values count as unset, and the app and every check script run without any env file. A malformed value makes the server log an error naming the variable and exit at startup; a missing required value fails when it is first used.

## Checks

| Script                 | What it does                                   |
| ---------------------- | ---------------------------------------------- |
| `npm run format:check` | Checks formatting with Prettier (never writes) |
| `npm run lint`         | Lints with ESLint and the Next.js rules        |
| `npm run typecheck`    | Type-checks with `tsc --noEmit`                |
| `npm run test`         | Runs the Vitest unit tests in `tests/unit`     |
| `npm run build`        | Builds the production app                      |

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Hadith API](https://github.com/fawazahmed0/hadith-api)
