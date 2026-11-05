import {
  assertNoBrowserErrors,
  expect,
  test,
  type BrowserErrorCheck,
} from "./fixtures";

// Self-test of the error-collecting fixture. Each "catches" test replaces the
// fixture's final check with one that requires the real check to reject with a
// given message, and fails if the fixture never ran it. A "catches" test thus
// passes only when the fixture's own check rejects with that message, so an
// unrelated failure cannot turn it green. The message match is a substring, so
// extra errors collected alongside the expected one would not fail it.
// One coarse spec runs the unmodified fixture, to cover its default wiring.

function expectingFailure(message: string) {
  return test.extend({
    browserErrorCheck: [
      async ({}, use) => {
        let called = false;
        const check: BrowserErrorCheck = async (errors) => {
          called = true;
          await expect(assertNoBrowserErrors(errors)).rejects.toThrow(message);
        };
        await use(check);
        expect(called, "fixture teardown never ran the error check").toBe(true);
      },
      { scope: "test" },
    ],
  });
}

test("fails the test on a console error with the default wiring", async ({
  page,
}) => {
  test.fail();
  await page.goto("about:blank");
  await page.evaluate(() => {
    setTimeout(() => console.error("default wiring error"), 100);
  });
});

test("passes when the page stays quiet", async ({ page }) => {
  await page.goto("about:blank");
  await page.evaluate(() => {
    setTimeout(() => console.log("late but harmless"), 100);
  });
  await expect(page.locator("body")).toBeAttached();
});

expectingFailure("late console error")(
  "catches a console error raised after the test body",
  async ({ page }) => {
    await page.goto("about:blank");
    await page.evaluate(() => {
      setTimeout(() => console.error("late console error"), 100);
    });
  },
);

expectingFailure("late page error")(
  "catches an uncaught page error raised after the test body",
  async ({ page }) => {
    await page.goto("about:blank");
    await page.evaluate(() => {
      setTimeout(() => {
        throw new Error("late page error");
      }, 100);
    });
  },
);

expectingFailure("console error on an extra page")(
  "catches a console error on a page opened with context.newPage()",
  async ({ context }) => {
    const extra = await context.newPage();
    await extra.goto("about:blank");
    await extra.evaluate(() => {
      setTimeout(() => console.error("console error on an extra page"), 100);
    });
  },
);

expectingFailure("page error on an extra page")(
  "catches an uncaught error on a page opened with context.newPage()",
  async ({ context }) => {
    const extra = await context.newPage();
    await extra.goto("about:blank");
    await extra.evaluate(() => {
      setTimeout(() => {
        throw new Error("page error on an extra page");
      }, 100);
    });
  },
);

test("passes when the test closes the page itself", async ({ page }) => {
  await page.goto("about:blank");
  await page.close();
});
