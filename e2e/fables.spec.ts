import { test, expect } from "@playwright/test";

test("pick a fable, generate a story, and read the provenance panel", async ({
  page,
}) => {
  await page.goto("/");

  // The folktale door is the default; the fable door is one tap away.
  await expect(
    page.getByRole("heading", { name: /what kind of tale tonight/i }),
  ).toBeVisible();
  await page.getByTestId("family-fable").click();
  await expect(
    page.getByRole("heading", { name: /tonight, travel to/i }),
  ).toBeVisible();

  // Cards carry the parent-facing metadata: tradition, setup, themes.
  const card = page.getByTestId("fable-lion-and-the-mouse");
  await expect(card).toContainText("Aesopic");
  await expect(card).toContainText(/kindness returned/i);

  await card.click();
  await expect(page.getByTestId("hero-name")).toBeVisible();

  // The fable family reinterprets the three length buttons: "Bedtime", not
  // "Medium", because a fable's shortest bedtime story is already 600 words.
  await expect(page.getByTestId("length-medium")).toContainText(/bedtime/i);

  await page.getByTestId("hero-name").fill("Amara");
  await page.getByTestId("age-band-6-8").click();
  await page.getByTestId("generate-button").click();

  const title = page.getByTestId("story-title");
  await expect(title).toBeVisible({ timeout: 20_000 });
  await expect(title).toContainText("Amara");
  await expect(page.getByTestId("story-body")).toContainText(/goodnight/i, {
    timeout: 20_000,
  });

  // Provenance appears only once the tale is over, and says plainly that the
  // story is original rather than an authentic traditional telling.
  const behind = page.getByTestId("behind-the-story");
  await expect(behind).toBeVisible({ timeout: 20_000 });
  await behind.getByText("Behind the story").click();
  await expect(behind).toContainText(/original/i);
  await expect(behind).toContainText(/not an authentic traditional telling/i);
  await expect(behind).toContainText(/Perry 150/);

  // And it saves to the same library as a folktale.
  await page.getByTestId("save-button").click();
  await page.getByTestId("library-link").click();
  await expect(
    page.getByText(/Amara and the Sleepy Lion and the Mouse/i),
  ).toBeVisible();
});

test("surprise me picks a fable and goes straight to the form", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("family-fable").click();
  await page.getByTestId("fable-surprise").click();
  await expect(page.getByTestId("hero-name")).toBeVisible();
});

test("a fable deep link opens the form directly", async ({ page }) => {
  await page.goto("/?fable=the-old-man-and-the-mountains");
  await expect(page.getByTestId("hero-name")).toBeVisible();
  await expect(
    page.getByText("The Old Man Who Moved the Mountains"),
  ).toBeVisible();
});

test("the folktale path is unchanged by the second door", async ({ page }) => {
  await page.goto("/?type=cinderella");
  await expect(page.getByTestId("hero-name")).toBeVisible();
  // The folktale family keeps its own length labels.
  await expect(page.getByTestId("length-medium")).toContainText(/medium/i);
  await expect(page.getByTestId("behind-the-story")).toHaveCount(0);
});
