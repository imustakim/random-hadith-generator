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

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Hadith API](https://github.com/fawazahmed0/hadith-api)
