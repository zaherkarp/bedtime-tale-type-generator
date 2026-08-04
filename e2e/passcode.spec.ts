import { test, expect } from "@playwright/test";

/**
 * Runs against the second server, the one started with PARENT_PASSCODE set.
 * Everything here is about the door: that it is shut, that the wrong code does
 * not open it, that the right one does, and that it stays open afterwards.
 */

const PASSCODE = "open-sesame";

async function fillFormAndGenerate(page: import("@playwright/test").Page) {
  await page.goto("/?type=cinderella");
  await page.getByTestId("hero-name").fill("Amara");
  await page.getByTestId("generate-button").click();
}

test("refuses to tell a story until the passcode is entered", async ({ page }) => {
  await fillFormAndGenerate(page);

  // Not an error card — a door.
  await expect(page.getByTestId("passcode-prompt")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("story-body")).toHaveCount(0);

  // A wrong code says so and nothing else.
  await page.getByTestId("passcode-input").fill("not-the-passcode");
  await page.getByTestId("passcode-submit").click();
  await expect(page.getByTestId("passcode-error")).toBeVisible();
  await expect(page.getByTestId("story-body")).toHaveCount(0);

  // The right one opens it and the held-back story resumes on its own.
  await page.getByTestId("passcode-input").fill(PASSCODE);
  await page.getByTestId("passcode-submit").click();

  await expect(page.getByTestId("story-title")).toContainText("Amara", {
    timeout: 30_000,
  });
  await expect(page.getByTestId("story-body")).toContainText(/goodnight/i, {
    timeout: 30_000,
  });
});

test("stays unlocked on the next visit", async ({ page }) => {
  await page.goto("/");
  await page.request.post("/api/unlock", { data: { passcode: PASSCODE } });

  await fillFormAndGenerate(page);
  await expect(page.getByTestId("story-title")).toContainText("Amara", {
    timeout: 30_000,
  });
  await expect(page.getByTestId("passcode-prompt")).toHaveCount(0);
});

test("the API refuses an unauthenticated request outright", async ({ request }) => {
  const res = await request.post("/api/tale", {
    data: {
      taleTypeId: "cinderella",
      heroName: "Amara",
      ageBand: "6-8",
      length: "short",
    },
  });
  expect(res.status()).toBe(401);
});

test("the unlock endpoint rejects a wrong passcode without leaking anything", async ({
  request,
}) => {
  const status = await request.get("/api/unlock");
  expect(await status.json()).toMatchObject({ locked: true, unlocked: false });

  const wrong = await request.post("/api/unlock", { data: { passcode: "nope" } });
  expect(wrong.status()).toBe(401);
  // The body says ok:false and nothing about why — no length hint, no "close".
  expect(await wrong.json()).toEqual({ ok: false });
});
