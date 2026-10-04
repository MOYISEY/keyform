import { test, expect } from "@playwright/test";
test("touch rotate/pinch and desktop ray selection", async ({
  browser,
  baseURL,
}) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.goto(baseURL!);
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForTimeout(900);
  const before = await page.locator("canvas").screenshot();
  const session = await ctx.newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 160, y: 400 }],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: 225, y: 425 }],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.waitForTimeout(400);
  expect((await page.locator("canvas").screenshot()).equals(before)).toBe(
    false,
  );
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: 130, y: 380 },
      { x: 220, y: 400 },
    ],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { x: 100, y: 370 },
      { x: 260, y: 410 },
    ],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.getByRole("button", { name: "Вернуть ракурс" }).click();
  await page.screenshot({ path: "evidence/mobile-ru.png", fullPage: true });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.waitForTimeout(300);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "evidence/mobile-320.png", fullPage: true });
  await ctx.close();
  const desktop = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await desktop.goto(baseURL!);
  await expect(desktop.locator("canvas")).toBeVisible();
  await desktop.waitForTimeout(600);
  await desktop.mouse.click(710, 445);
  await expect(desktop.locator(".part-info")).toBeVisible();
  await desktop.close();
});
test("keyboard focus, blocked storage and runtime context loss stay usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    });
  });
  await page.goto("./");
  await expect(page.locator("canvas")).toBeVisible();
  await page.getByRole("button", { name: "Моя сборка" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Сохранить на устройстве" }).click();
  await expect(page.locator(".inline-status")).toContainText(
    "Хранилище недоступно",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Моя сборка" })).toBeFocused();
  await page
    .locator("canvas")
    .evaluate((c) =>
      c.dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
    );
  await expect(
    page.getByRole("heading", { name: "3D недоступно" }),
  ).toBeVisible();
  await expect(page.locator("footer")).toContainText("2D mode");
});
