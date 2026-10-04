import { test, expect } from "@playwright/test";
import { DEFAULT, keysFor, OPTIONS } from "../src/model";
test.beforeEach(async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("canvas")).toBeVisible();
});
test("all layouts and options update real state", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const layout of OPTIONS.layout) {
    await page
      .locator(".layout-options")
      .getByRole("button", {
        name: layout === "tkl" ? "TKL" : layout + "%",
        exact: true,
      })
      .click();
    await expect(page.getByTestId("scene")).toHaveAttribute(
      "data-layout",
      layout,
    );
    await expect(page.locator(".model-label small")).toContainText(
      String(keysFor(layout).length),
    );
  }
  for (const name of [
    "Графит",
    "Шалфей",
    "Серебро",
    "Чернила",
    "Мох",
    "Мел",
    "Тактильные",
    "Кликающие",
    "Линейные",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(
      page.getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  }
  for (const material of ["polycarbonate", "aluminium"])
    await page.getByLabel("Материал корпуса").selectOption(material);
  expect(errors).toEqual([]);
});
test("explode, selection, camera and comparison", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page
    .locator(".layout-options")
    .getByRole("button", { name: "75%", exact: true })
    .click();
  await page.getByRole("button", { name: "По слоям", exact: true }).click();
  await expect(page.getByRole("slider")).toHaveValue("100");
  await page.waitForTimeout(1800);
  await page.screenshot({
    path: "evidence/desktop-exploded.png",
    fullPage: true,
  });
  for (const name of [
    "Кейкапы",
    "Переключатели",
    "Пластина",
    "Плата",
    "Корпус",
  ]) {
    await page.locator(".part-buttons").getByRole("button", { name }).click();
    await expect(page.locator(".part-info h3")).toHaveText(name);
  }
  await page.getByRole("button", { name: "Вернуть ракурс" }).click();
  await expect(page.getByRole("slider")).toHaveValue("0");
  await expect(page.locator(".part-info")).toHaveCount(0);
  for (const name of [
    "Повернуть влево",
    "Повернуть вправо",
    "Приблизить",
    "Отдалить",
    "Вид сверху",
    "Вернуть ракурс",
  ])
    await page.getByRole("button", { name, exact: true }).click();
  await page.getByRole("button", { name: "Сравнить размеры" }).click();
  await expect(page.locator("dialog")).toBeVisible();
  await page.locator(".comparison-card").filter({ hasText: "65%" }).click();
  await expect(page.getByTestId("scene")).toHaveAttribute("data-layout", "65");
  await page.screenshot({ path: "evidence/compare.png", fullPage: true });
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  expect(errors).toEqual([]);
});
test("typing is scoped to opt-in focus; on-screen test and leave clear input", async ({
  page,
}) => {
  await page.keyboard.type("private outside");
  await page.getByRole("button", { name: "Тест клавиш", exact: false }).click();
  await expect(page.getByTestId("tested-count")).toHaveText("0 / 81 проверено");
  await page.keyboard.press("a");
  await expect(page.getByTestId("tested-count")).toHaveText("0 / 81 проверено");
  await page.getByRole("button", { name: "KeyQ", exact: true }).click();
  await expect(page.getByTestId("tested-count")).toHaveText("1 / 81 проверено");
  await page.getByRole("button", { name: "Активировать поле" }).click();
  await page.keyboard.type("abc");
  await expect(page.getByLabel("Поле теста клавиатуры")).toHaveValue("abc");
  await expect(page.getByTestId("tested-count")).toHaveText("4 / 81 проверено");
  await page
    .getByRole("button", { name: "Завершить тест", exact: true })
    .click();
  await expect(page.getByLabel("Поле теста клавиатуры")).toBeDisabled();
  await page.getByRole("button", { name: "Активировать поле" }).click();
  await expect(page.getByLabel("Поле теста клавиатуры")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).toBeVisible();
  await expect(page.getByLabel("Поле теста клавиатуры")).toBeDisabled();
  await page.keyboard.press("z");
  await expect(page.getByTestId("tested-count")).toHaveText("4 / 81 проверено");
  await page.getByRole("button", { name: "Активировать поле" }).click();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Поле теста клавиатуры")).not.toBeFocused();
  await expect(page.getByLabel("Поле теста клавиатуры")).toBeDisabled();
  await page.screenshot({ path: "evidence/typing.png", fullPage: true });
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  await page.getByRole("button", { name: "Тест клавиш", exact: false }).click();
  await expect(page.getByLabel("Поле теста клавиатуры")).toHaveValue("");
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe("{}");
});
test("valid and corrupt import, JSON/text exports, explicit storage and URL", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Моя сборка" }).click();
  const upload = page.locator("input[type=file]");
  await upload.setInputFiles({
    name: "valid.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({ ...DEFAULT, layout: "tkl", finish: "graphite" }),
    ),
  });
  await expect(page.locator(".build-number")).toHaveText("TKL");
  for (const raw of [
    "not json",
    '{"version":1}',
    JSON.stringify({ ...DEFAULT, switch: "unknown" }),
    "x".repeat(5000),
  ]) {
    await upload.setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from(raw),
    });
    await expect(page.getByRole("status")).toContainText("не распознана");
    await expect(page.locator(".build-number")).toHaveText("TKL");
  }
  for (const [name, ext] of [
    ["Экспорт JSON", "json"],
    ["Скачать состав .txt", "txt"],
  ]) {
    const downloaded = page.waitForEvent("download");
    await page.getByRole("button", { name, exact: false }).click();
    const d = await downloaded;
    expect(d.suggestedFilename()).toBe("keyform-tkl." + ext);
    await d.saveAs("test-results/export." + ext);
  }
  await page.getByRole("button", { name: "Сохранить на устройстве" }).click();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([
    "keyform.build.v1",
  ]);
  await upload.setInputFiles({
    name: "valid.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(DEFAULT)),
  });
  await page.getByRole("button", { name: "Восстановить", exact: true }).click();
  await expect(page.locator(".build-number")).toHaveText("TKL");
  await page.getByRole("button", { name: "Ссылка на сборку" }).click();
  const url = await page
    .getByRole("textbox", { name: "Ссылка на сборку" })
    .inputValue();
  await page.getByRole("button", { name: "Удалить сохранение" }).click();
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await page.goto(url);
  await expect(page.getByTestId("scene")).toHaveAttribute("data-layout", "tkl");
  await page.goto("./?build=%7Bbad");
  await expect(page.locator(".toast")).toContainText("не распознана");
  await expect(page.getByTestId("scene")).toHaveAttribute("data-layout", "75");
});
test("RU/EN, mobile resize and touch, reduced motion", async ({ page }) => {
  await page.getByRole("button", { name: "Switch to English" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Form. Feel. Yours.",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(1200);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "evidence/mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Exploded", exact: true }).click();
  await page.waitForTimeout(400);
  await page.screenshot({
    path: "evidence/mobile-exploded.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Your build" }).click();
  await expect(page.locator("dialog")).toBeVisible();
  await page.screenshot({ path: "evidence/mobile-build.png", fullPage: true });
});
test("WebGL context failure retains 2D configuration, test and export", async ({
  browser,
  baseURL,
}) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      type: string,
      ...args: unknown[]
    ) {
      if (type.includes("webgl")) return null;
      return (original as any).call(this, type, ...args);
    } as any;
  });
  await page.goto(baseURL!);
  await expect(
    page.getByRole("heading", { name: "3D недоступно" }),
  ).toBeVisible();
  await page
    .locator(".layout-options")
    .getByRole("button", { name: "65%", exact: true })
    .click();
  await expect(page.locator(".fallback-board span")).toHaveCount(
    keysFor("65").length,
  );
  await page.getByRole("button", { name: "Тест клавиш", exact: false }).click();
  await page.getByRole("button", { name: "KeyA", exact: true }).click();
  await expect(page.getByTestId("tested-count")).toHaveText("1 / 67 проверено");
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  await page.screenshot({
    path: "evidence/webgl-fallback.png",
    fullPage: true,
  });
  await ctx.close();
});
