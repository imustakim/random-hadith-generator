import { expect, test as base } from "@playwright/test";

/**
 * Journeys import `test` and `expect` from here instead of `@playwright/test`.
 * The auto fixture records console errors and uncaught page errors for the whole
 * test and asserts in teardown, so an error raised after the last assertion
 * (for example a hydration mismatch) still fails the test.
 */
export const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: [
    async ({ page }, use) => {
      const pageErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") pageErrors.push(message.text());
      });
      page.on("pageerror", (error) => pageErrors.push(error.message));

      await use(pageErrors);

      await page.waitForLoadState("networkidle");
      expect(pageErrors).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
