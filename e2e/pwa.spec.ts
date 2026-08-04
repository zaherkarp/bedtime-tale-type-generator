import { test, expect } from "@playwright/test";

test("serves an installable web manifest", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBe(true);

  const manifest = await res.json();
  expect(manifest.name).toBeTruthy();
  expect(manifest.short_name).toBeTruthy();
  expect(manifest.start_url).toBe("/");
  expect(manifest.display).toBe("standalone");
  expect(manifest.theme_color).toBe("#0b1026");

  // An installable icon set needs a 512px icon, and Android needs a maskable
  // one or it pastes the whole square into a circle.
  const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
  expect(sizes).toContain("512x512");
  expect(
    manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable"),
  ).toBe(true);

  for (const icon of manifest.icons) {
    const iconRes = await request.get(icon.src);
    expect(iconRes.ok(), `${icon.src} resolves`).toBe(true);
    expect(iconRes.headers()["content-type"]).toContain("image/png");
  }
});

test("links the manifest and a theme colour from the document head", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#0b1026",
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
});

test("serves the service worker without caching the streaming endpoint", async ({
  request,
}) => {
  const res = await request.get("/sw.js");
  expect(res.ok()).toBe(true);
  const body = await res.text();
  // The one rule that must never regress: a service worker in front of the
  // NDJSON stream would buffer the story instead of letting it trickle in.
  expect(body).toContain('url.pathname.startsWith("/api/")');
});
