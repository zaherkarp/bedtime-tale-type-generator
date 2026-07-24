import { test, expect } from "@playwright/test";

test("browse the ATU catalogue, search, and generate from a non-featured type", async ({
  page,
}) => {
  await page.goto("/browse");
  await expect(
    page.getByRole("heading", { name: /browse tale types/i }),
  ).toBeVisible();

  // The catalogue mixes featured and non-featured (catalogue-only) types.
  await expect(page.getByTestId("browse-type-cinderella")).toBeVisible();
  await expect(page.getByTestId("browse-type-stone-soup")).toBeVisible();

  // Free-text search narrows the list.
  await page.getByTestId("browse-search").fill("turnip");
  await expect(
    page.getByTestId("browse-type-the-enormous-turnip"),
  ).toBeVisible();
  await expect(page.getByTestId("browse-type-cinderella")).toHaveCount(0);

  // Clearing the search and picking a non-featured type hands off to the generator.
  await page.getByTestId("browse-search").fill("");
  await page.getByTestId("browse-type-stone-soup").click();

  // The form appears, preselected to the chosen tale type.
  await expect(page.getByTestId("hero-name")).toBeVisible();
  await page.getByTestId("hero-name").fill("Amara");
  await page.getByTestId("age-band-6-8").click();
  await page.getByTestId("length-short").click();
  await page.getByTestId("generate-button").click();

  // A story streams in, features the hero, and winds down to sleep.
  const title = page.getByTestId("story-title");
  await expect(title).toBeVisible({ timeout: 20_000 });
  await expect(title).toContainText("Amara");
  await expect(page.getByTestId("story-body")).toContainText(/goodnight/i, {
    timeout: 20_000,
  });
});
