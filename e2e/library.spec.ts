import { test, expect } from "@playwright/test";

test("the library shows a friendly empty state before anything is saved", async ({
  page,
}) => {
  await page.goto("/library");
  await expect(page.getByRole("heading", { name: /my library/i })).toBeVisible();
  await expect(page.getByTestId("library-empty")).toBeVisible();
  await expect(page.getByRole("link", { name: /create a tale/i })).toBeVisible();
});
