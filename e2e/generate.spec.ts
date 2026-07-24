import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const SHOT_DIR = process.env.SHOT_DIR;

async function shot(page: Page, name: string) {
  if (!SHOT_DIR) return;
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(SHOT_DIR, name), fullPage: true });
}

test("pick a tale, generate a streamed story, and save it to the library", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /what kind of tale tonight/i }),
  ).toBeVisible();
  await shot(page, "01-picker.png");

  // Choose a tale type → the form appears.
  await page.getByTestId("tale-type-cinderella").click();
  await expect(page.getByTestId("hero-name")).toBeVisible();

  // Fill in the details.
  await page.getByTestId("hero-name").fill("Amara");
  await page.getByTestId("age-band-6-8").click();
  await page.getByTestId("length-short").click();
  await shot(page, "02-form.png");

  // Generate.
  await page.getByTestId("generate-button").click();

  // The title streams in and features the hero...
  const title = page.getByTestId("story-title");
  await expect(title).toBeVisible({ timeout: 20_000 });
  await expect(title).toContainText("Amara");

  // ...and, per the product's promise, the tale ends in sleep.
  await expect(page.getByTestId("story-body")).toContainText(/goodnight/i, {
    timeout: 20_000,
  });

  // When streaming finishes, the actions appear.
  const save = page.getByTestId("save-button");
  await expect(save).toBeVisible({ timeout: 20_000 });
  await shot(page, "03-story.png");

  // Save to the library.
  await save.click();
  await expect(save).toHaveText(/saved/i);

  // The library shows the saved tale.
  await page.getByTestId("library-link").click();
  await expect(
    page.getByRole("heading", { name: /my library/i }),
  ).toBeVisible();
  await expect(page.getByText(/Amara and the Sleepy Cinderella/i)).toBeVisible();
  await shot(page, "04-library.png");
});
