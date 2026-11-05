import { expect, test } from "./fixtures";

// Self-test of the error-collecting fixture. `test.fail()` makes each of these
// pass only if the fixture fails the test, so a fixture that stops catching
// late errors turns this suite red.

test("passes when the page stays quiet", async ({ page }) => {
  await page.goto("about:blank");
  await page.evaluate(() => {
    setTimeout(() => console.log("late but harmless"), 100);
  });
  await expect(page.locator("body")).toBeAttached();
});

test("fails on a console error raised after the test body", async ({
  page,
}) => {
  test.fail();
  await page.goto("about:blank");
  await page.evaluate(() => {
    setTimeout(() => console.error("late console error"), 100);
  });
});

test("fails on an uncaught page error raised after the test body", async ({
  page,
}) => {
  test.fail();
  await page.goto("about:blank");
  await page.evaluate(() => {
    setTimeout(() => {
      throw new Error("late page error");
    }, 100);
  });
});

test("passes when the test closes the page itself", async ({ page }) => {
  await page.goto("about:blank");
  await page.close();
});
