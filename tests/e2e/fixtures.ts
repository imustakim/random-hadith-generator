import { expect, test as base } from "@playwright/test";

/** How long teardown waits for late errors before asserting. */
export const SETTLE_MS = 300;

/**
 * Journeys import `test` and `expect` from here instead of `@playwright/test`.
 * The auto fixture records console errors and uncaught page errors for the whole
 * test and asserts in teardown, so an error raised shortly after the last
 * assertion (for example a hydration mismatch) still fails the test. Teardown
 * waits `SETTLE_MS` for stragglers; an error later than that is not caught.
 * `tests/e2e/fixtures.spec.ts` checks this behaviour.
 */
export const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [
    async ({ page }, use) => {
      const browserErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") browserErrors.push(message.text());
      });
      page.on("pageerror", (error) => browserErrors.push(error.message));

      await use(browserErrors);

      // A test may have closed the page; there is nothing left to wait for then.
      if (!page.isClosed()) {
        await page.waitForTimeout(SETTLE_MS).catch(() => {});
      }
      expect(browserErrors).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
