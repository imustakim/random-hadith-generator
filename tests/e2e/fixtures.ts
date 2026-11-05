import { expect, test as base } from "@playwright/test";

/** How long teardown waits for late errors before asserting. */
export const SETTLE_MS = 300;

/** The check teardown runs on the collected errors; it throws if there are any. */
export type BrowserErrorCheck = (errors: string[]) => Promise<void>;

/** Fails with every collected error in the message. */
export const assertNoBrowserErrors: BrowserErrorCheck = async (errors) => {
  expect(errors, "browser errors during the test").toEqual([]);
};

/**
 * Journeys import `test` and `expect` from here instead of `@playwright/test`.
 * The auto fixture records console errors and uncaught page errors on every
 * page of the test's browser context (including pages opened with
 * `context.newPage()`) and asserts in teardown, so an error raised shortly
 * after the last assertion (for example a hydration mismatch) still fails the
 * test. Teardown waits `SETTLE_MS` for stragglers; an error later than that is
 * not caught. `tests/e2e/fixtures.spec.ts` checks this behaviour.
 *
 * `browserErrorCheck` is the final assertion, exposed so that spec can verify
 * the failure; journeys do not use it.
 */
export const test = base.extend<{
  browserErrors: string[];
  browserErrorCheck: BrowserErrorCheck;
}>({
  // Tuple form: the `use` callback is not a React hook (rules-of-hooks).
  browserErrorCheck: [
    async ({}, use) => {
      await use(assertNoBrowserErrors);
    },
    { scope: "test" },
  ],
  browserErrors: [
    async ({ context, browserErrorCheck }, use) => {
      const browserErrors: string[] = [];
      context.on("console", (message) => {
        if (message.type() === "error") browserErrors.push(message.text());
      });
      context.on("weberror", (webError) =>
        browserErrors.push(webError.error().message),
      );

      await use(browserErrors);

      // A test may have closed every page; there is nothing left to wait for then.
      if (context.pages().some((page) => !page.isClosed())) {
        await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
      }
      await browserErrorCheck(browserErrors);
    },
    { auto: true },
  ],
});

export { expect };
