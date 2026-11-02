import { test, expect, type Page } from "@playwright/test";

// WebKit + touch/viewport emulation is a regression gate, not a claim that a
// physical iPhone or Add to Home Screen installation has been tested.
async function choose(page: Page, family: "folktale" | "fable") {
  await page.goto("/");
  if (family === "fable") {
    await page.getByTestId("family-fable").click();
    await page.getByTestId("fable-lion-and-the-mouse").click();
  } else {
    await page.getByTestId("tale-type-cinderella").click();
  }
  await page.getByTestId("hero-name").fill("Amara");
  await page.getByTestId("age-band-6-8").click();
  await page.getByTestId("length-long").click();
}

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

for (const family of ["folktale", "fable"] as const) {
  test(`${family}: choices, streaming, reading, saved and offline reopen`, async ({ page, context }) => {
    await choose(page, family);
    await noOverflow(page);
    await page.getByTestId("generate-button").click();
    await expect(page.getByTestId("stop-button")).toBeVisible();
    await expect(page.getByTestId("story-body")).toContainText(/goodnight/i, { timeout: 20_000 });
    await expect(page.getByTestId("save-button")).toBeVisible();
    await expect(page.getByTestId("streaming-indicator")).toHaveCount(0);
    await noOverflow(page);
    const title = await page.getByTestId("story-title").innerText();
    const body = await page.getByTestId("story-body").innerText();
    if (family === "fable") {
      const provenance = page.getByTestId("behind-the-story");
      await provenance.getByText("Behind the story").click();
      await expect(provenance).toContainText("not an authentic traditional telling");
      await expect(provenance).toContainText("Perry 150");
    }
    await page.getByTestId("save-button").click();
    await expect(page.getByTestId("save-button")).toHaveText(/saved/i);
    await page.getByTestId("library-link").click();
    await page.getByRole("listitem").filter({ hasText: title }).getByRole("button", { name: "Read", exact: true }).click();
    await expect(page.getByTestId("story-body")).toHaveText(body);
    await noOverflow(page);

    // Real installed worker + a fresh offline document, not a source-string
    // assertion or retained React state. Warm the library's route assets first.
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await context.setOffline(true);
    await page.reload();
    await page.getByRole("listitem").filter({ hasText: title }).getByRole("button", { name: "Read", exact: true }).click();
    await expect(page.getByTestId("story-body")).toHaveText(body);
    await noOverflow(page);
    await context.setOffline(false);
  });

  test(`${family}: incomplete response offers a working retry with the same choices`, async ({ page }) => {
    let attempt = 0;
    const requests: unknown[] = [];
    await page.route("**/api/tale", async (route) => {
      requests.push(route.request().postDataJSON());
      attempt++;
      if (attempt === 1) {
        await route.fulfill({ contentType: "application/x-ndjson", body: JSON.stringify({ t: "delta", text: "# Interrupted tale\n\nNot finished." }) + "\n" });
      } else {
        await route.continue();
      }
    });
    await choose(page, family);
    await page.getByTestId("generate-button").click();
    await expect(page.getByText(/check your connection/i)).toBeVisible();
    await expect(page.getByTestId("streaming-indicator")).toHaveCount(0);
    await page.getByTestId("regenerate-button").click();
    await expect(page.getByTestId("story-body")).toContainText(/goodnight/i, { timeout: 20_000 });
    await expect(page.getByText(/check your connection/i)).toHaveCount(0);
    await expect(page.getByTestId("save-button")).toBeVisible();
    expect(requests).toHaveLength(2);
    expect(requests[0]).toMatchObject({
      heroName: "Amara", ageBand: "6-8", length: "long",
      ...(family === "fable"
        ? { kind: "fable", fableId: "lion-and-the-mouse" }
        : { kind: "atu", taleTypeId: "cinderella" }),
    });
    expect(requests[1]).toEqual(requests[0]);
    await noOverflow(page);
  });
}

// A separate deliberately long fixture tests reading geometry, not model quality.
test("a long story stays readable without horizontal overflow", async ({ page }) => {
  const paragraph = "Amara walked softly beneath the stars, listening to the quiet trees and feeling safe beside a kind friend. ";
  const text = "# A Long Gentle Evening\n\n" + Array(70).fill(paragraph).join("\n\n") + "\n\nGoodnight, Amara.";
  await page.route("**/api/tale", (route) => route.fulfill({
    contentType: "application/x-ndjson",
    body: JSON.stringify({ t: "delta", text }) + "\n" + JSON.stringify({ t: "done" }) + "\n",
  }));
  await choose(page, "folktale");
  await page.getByTestId("generate-button").click();
  await expect(page.getByTestId("story-body")).toContainText("Goodnight, Amara.");
  expect((await page.getByTestId("story-body").innerText()).split(/\s+/).length).toBeGreaterThan(1300);
  await page.getByTestId("save-button").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("save-button")).toBeInViewport();
  await noOverflow(page);
});
