# Audit of the old Random Hadith Generator

Written before any old file is touched. Nothing here comes from a live call to the provider.

Audited at commit `137d4f1`. The old files are deleted later in the rebuild, so every file,
function and property named below refers to that commit. Read one with
`git show 137d4f1:js/script.js`.

## Old files

| File | Role |
|------|------|
| `index.html` | The single page: nav with "Daily Hadith", `#hadith-text`, `#details`, and a "Read Another!" button wired by `onclick="fetchRandomHadith()"`. |
| `js/script.js` | All behaviour, as globals: edition list, fetch, pick, render, random gradient. |
| `js/config.js` | `config.apiHost`, never read by `script.js`. |
| `css/styles.css` | One `body` font-family rule. |
| `README.md`, `LICENSE` | Old description with a GitHub Pages demo link; MIT license. |

## Provider and endpoints

The fawazahmed0 Hadith API, served from jsDelivr at `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1`.

| Call | URL pattern | Fields the old code reads |
|------|-------------|---------------------------|
| Edition | `GET {base}/editions/{edition}.json` | `metadata.name` (book name) and `metadata.sections`, an object of section number to title. |
| Section | `GET {base}/editions/{edition}/sections/{n}.json` | `hadiths[]`; per item `text` and `hadithnumber`. |

Allowed editions (all English): `eng-bukhari`, `eng-muslim`, `eng-nasai`, `eng-abudawud`,
`eng-tirmidhi`, `eng-ibnmajah`, `eng-malik`.

## How a random Hadith is chosen

1. Pick a random edition from the seven.
2. Fetch the edition and pick a random section from `metadata.sections`.
3. Fetch that section and pick a random item from `hadiths`.

`fetchRandomHadith()` runs once on page load and again on every click, repeating all three steps
with no caching. Choices are uniform at each level, so Hadiths
in small sections are over-represented.

## What the page shows

- The Hadith `text`, in the `#hadith-text` paragraph. The markup holds the placeholder "Click the
  button to get a random hadith.", which shows only until the load-time fetch finishes.
- Under it: book name, section number, section title and Hadith number.
- Fallbacks: `Hadith text not available` (no `text`), `N/A` (no `hadithnumber`), and `Failed to load Hadith data. Please try again later.` on any failure (details are cleared).
- A random two-colour gradient on the page background at load.

## Dependencies and deployment

Tailwind (`cdn.tailwindcss.com`), Flowbite 1.5.2 (unpkg, CSS and JS) and Font Awesome
6.0.0-beta3 (cdnjs), all from CDNs with no integrity attributes. No Flowbite or Font Awesome
component is used by the markup. Deployed on GitHub Pages; the README links the live demo.

## Keep

- The API knowledge: provider, base URL, the two endpoints and the seven English editions.
- The random flow: edition, then section, then Hadith.
- The fields shown: book name, section number and title, Hadith number, text.
- The MIT license.

## Do not copy

- Book name, section number, section title and Hadith number interpolated into `innerHTML` in
  `updateHTML`. The Hadith `text` itself is set with `innerText`, which is safe; render every
  provider field as text.
- The unused `config.apiHost`, which also has no protocol; the base URL becomes an environment variable (ADR 0002).
- `fetch` without timeouts or retry rules, and unvalidated responses.
- The random background gradient.
- CDN scripts and stylesheets without integrity attributes, and unused Flowbite and Font Awesome.
- The inline `onclick` global, and a failure that hides the cause from the user.

## Unverified from the code alone

The old code never reads these, so this audit does not claim them. `hadith-provider` audits each
against the real provider and records the result:

- Whether responses carry Arabic text, and in which editions.
- Whether grades exist, their source, and per-Hadith coverage.
- Narrators and chain information.
- Chapter or book fields beyond the section map, and the exact response shape of unread fields.
- Hadith counts per edition or section, and whether other languages or editions are offered.
- Rate limits, availability and caching behaviour of the jsDelivr endpoint.

## Implementation plan

- Stack (ADR 0001): Next.js App Router at the repository root, strict TypeScript, Tailwind with shadcn/ui, Motion, Supabase, TanStack Query, Zod, Vitest and Playwright, hosted on Vercel.
- Hadith data enters only through a `HadithProvider` and a normalized model (ADR 0002); content integrity rules apply throughout (ADR 0003).
- M1: `foundation` replaces the static files with the scaffold; `design-system` adds tokens, themes, fonts and layout.
- M2: `hadith-provider` verifies the unverified list above, then detail page, random Hadith, Hadith of the Day, collections, home page.
- M3: search, topics, recently viewed.
- M4: authentication, preferences, bookmarks, personal collections, reading history and streak (Supabase with RLS).
- M5: shareable Hadith cards. M6: PWA and offline, accessibility, SEO and performance.
- M7: end-to-end journeys, security review, Vercel readiness and documentation.
