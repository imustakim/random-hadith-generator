import { expect, test } from "./fixtures";

test("home page shows Athar's name, Arabic name and tagline", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Athar");
  await expect(
    page.getByText("Discover. Reflect. Remember.", { exact: true }),
  ).toBeVisible();

  const arabicName = page.locator('[lang="ar"][dir="rtl"]');
  await expect(arabicName).toHaveText("أثر");
  await expect(arabicName).toBeVisible();
});
