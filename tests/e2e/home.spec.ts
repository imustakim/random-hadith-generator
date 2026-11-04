import { expect, test } from "@playwright/test";

test("home page shows Athar's name, Arabic name and tagline without console errors", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Athar");
  await expect(page.getByText("Discover. Reflect. Remember.")).toBeVisible();

  const arabicName = page.locator('[lang="ar"][dir="rtl"]');
  await expect(arabicName).toHaveText("أثر");
  await expect(arabicName).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
