import { test, expect } from "@playwright/test";

test("shows a gentle, recoverable error if the storyteller fails", async ({
  page,
}) => {
  // Simulate the API being unavailable.
  await page.route("**/api/tale", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "not set up" }),
    }),
  );

  await page.goto("/");
  await page.getByTestId("tale-type-cinderella").click();
  await page.getByTestId("hero-name").fill("Milo");
  await page.getByTestId("generate-button").click();

  const error = page.getByTestId("story-error");
  await expect(error).toBeVisible();
  await expect(error).toContainText(/getting ready|ANTHROPIC_API_KEY/i);

  // The child-friendly recovery options are present.
  await expect(page.getByTestId("regenerate-button")).toBeVisible();
  await expect(page.getByTestId("new-tale-button")).toBeVisible();
});
