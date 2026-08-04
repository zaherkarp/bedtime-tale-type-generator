import { test, expect } from "@playwright/test";

/**
 * The phone run. These assertions are all about the things that only go wrong
 * at 393px — nothing here duplicates the desktop happy path in generate.spec.
 */

/** Fails if the page can be scrolled sideways, which is the classic phone bug. */
async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
  expect(overflow, "horizontal overflow in px").toBeLessThanOrEqual(1);
}

test("the whole flow fits a phone, with reachable controls", async ({ page }) => {
  await page.goto("/");
  await expectNoHorizontalOverflow(page);

  await page.getByTestId("tale-type-cinderella").click();
  await expect(page.getByTestId("generate-button")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  // Every tap target on the form is at least 44px tall.
  for (const testId of ["length-short", "length-medium", "generate-button"]) {
    const box = await page.getByTestId(testId).boundingBox();
    expect(box, testId).not.toBeNull();
    expect(box!.height, `${testId} height`).toBeGreaterThanOrEqual(44);
  }

  await page.getByTestId("hero-name").fill("Amara");
  await page.getByTestId("generate-button").click();

  await expect(page.getByTestId("story-title")).toContainText("Amara", {
    timeout: 30_000,
  });
  await expect(page.getByTestId("save-button")).toBeVisible({ timeout: 30_000 });
  await expectNoHorizontalOverflow(page);

  // The action row is a 2-up grid on a phone. Each button has to be reachable
  // by scrolling and big enough to hit — not wrapped off the side, which is
  // what the old `flex flex-wrap` row did once there were five of them.
  for (const testId of ["save-button", "regenerate-button", "new-tale-button"]) {
    const button = page.getByTestId(testId);
    await button.scrollIntoViewIfNeeded();
    await expect(button, testId).toBeInViewport();
    const box = await button.boundingBox();
    expect(box!.height, `${testId} height`).toBeGreaterThanOrEqual(44);
    expect(box!.x, `${testId} left edge`).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width, `${testId} right edge`).toBeLessThanOrEqual(394);
  }
});

test("the reading controls resize the story and persist across pages", async ({
  page,
}) => {
  await page.goto("/?type=cinderella");
  await page.getByTestId("hero-name").fill("Amara");
  await page.getByTestId("generate-button").click();
  await expect(page.getByTestId("story-body")).toBeVisible({ timeout: 30_000 });

  const sizeOf = () =>
    page
      .getByTestId("story-body")
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

  const before = await sizeOf();
  await page.getByTestId("text-larger").click();
  await expect.poll(sizeOf).toBeGreaterThan(before);

  // The setting belongs to the device, so it survives a navigation.
  const enlarged = await sizeOf();
  await page.goto("/library");
  const scale = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--story-scale"),
  );
  expect(parseFloat(scale)).toBeGreaterThan(1);
  expect(enlarged).toBeGreaterThan(before);
});

test("deep night dims the page", async ({ page }) => {
  await page.goto("/?type=cinderella");
  await page.getByTestId("hero-name").fill("Amara");
  await page.getByTestId("generate-button").click();
  await expect(page.getByTestId("story-body")).toBeVisible({ timeout: 30_000 });

  await page.getByTestId("deep-night-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-deep-night", "true");
});

test("the browse catalogue paginates instead of rendering everything", async ({
  page,
}) => {
  await page.goto("/browse");
  await expectNoHorizontalOverflow(page);

  const cards = page.locator('[data-testid^="browse-type-"]');
  const first = await cards.count();
  expect(first).toBeLessThanOrEqual(72);

  await page.getByTestId("browse-more").click();
  await expect.poll(() => cards.count()).toBeGreaterThan(first);
});
