import { test, expect } from "@playwright/test";
test("first visual", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForTimeout(2500);
  await page.screenshot({
    path: "evidence/desktop-initial.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
