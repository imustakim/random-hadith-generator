# Coding standards

## Language and style

- TypeScript in strict mode. No `any` unless unavoidable, and then with a comment saying why;
  prefer `unknown` plus a Zod parse.
- Shared types live in reusable definitions (`src/types` or the feature's own types), not
  redeclared per component. API responses and database rows are strongly typed.
- Styling with Tailwind and shadcn/ui. No ad hoc custom CSS or inline `style` unless Tailwind
  cannot express it; colors and design tokens come from CSS variables, never hard-coded hex in
  components.
- Clean, maintainable code: no oversized components; split when a component does more than one
  job.

## Structure and naming

- Feature-oriented layout: feature logic in `src/features/<feature>`, shared UI in
  `src/components`, infrastructure in `src/lib`. No deep nesting or abstraction without a second
  real use.
- Server Components by default. A `"use client"` file needs a real interactivity reason.
- TanStack Query only for client-side server-state; data a Server Component can fetch is fetched
  there.
- Hadith API integrations stay in the provider layer; UI imports the normalized model, never a
  provider response type.
- Every visible button and link works in the PR that adds it; no placeholder content.
- Arabic text is rendered with `dir="rtl"` and `lang="ar"`, never forced into an LTR layout.
- Animations use Motion, stay subtle, and respect `prefers-reduced-motion`.
- Responsive and accessible by default: semantic HTML, keyboard reachable controls, labels,
  sufficient contrast.
- New dependencies are justified in the PR body; no alternative frameworks to the mandated
  stack.

## Errors, logging and observability

- Every external input (Hadith API responses, forms, route params, env vars, Supabase inputs) is
  parsed with Zod before use. Invalid data degrades gracefully; it is never shown as if valid.
- Never fabricate Hadith content: missing fields (Arabic, narrator, grade, chapter) are shown as
  unavailable, never filled in. Grades only from the source, with the source named. Source
  reference and attribution are never dropped.
- Every data-driven view has loading, empty and error states.
- Authorization is enforced on the server and by RLS; client checks are only for UX. Every
  user-owned table has RLS policies in its migration.
- Secrets stay server-only: no service role key or private credential in client code or in a
  `NEXT_PUBLIC_` variable.
- User and external content is rendered as text, never through unsanitized HTML.
- External calls have timeouts; retries only where the call is safe to repeat.

## Testing

- Tests verify behaviour through public interfaces (seams), never implementation details.
- Expected values come from an independent source of truth (a literal, a worked example, the spec).
- Logic (normalization, selection algorithms, validation, utilities) gets Vitest tests under
  `tests/unit`; user journeys get Playwright tests under `tests/e2e`. No superficial tests that
  only assert a render happened.
- Hadith fixtures are recorded from the real provider and stay in tests; they never ship as
  product content.
- Cover RTL text, long Arabic and English content, and failure paths where the feature touches
  them.

## Commits and pull requests

- One-line Conventional Commit subjects ending with the ticket key: `feat(auth): add login form [auth/01]`.
- One ticket per branch and PR; no changes outside the ticket's scope.
- An architectural decision that is hard to reverse gets an ADR in `docs/adr/` in the same PR.
