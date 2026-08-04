import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

/**
 * A second server, identical but with a passcode set.
 *
 * The lock is a security boundary, so it is worth exercising end to end rather
 * than only in unit tests — but it cannot share the main server, because a
 * locked one would fail every other spec. Two servers is the cheap way to test
 * both states of a global setting.
 */
const LOCKED_PORT = 3101;
const lockedBaseURL = `http://localhost:${LOCKED_PORT}`;
const PASSCODE = "open-sesame";

/**
 * The e2e suite runs entirely against the offline mock storyteller
 * (MOCK_TALE=1), so it needs no ANTHROPIC_API_KEY and is fully deterministic.
 *
 * PW_CHROMIUM_PATH lets an environment with a preinstalled browser point
 * Playwright at it (e.g. `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium`). When
 * unset, Playwright uses its own managed browser from `playwright install`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    launchOptions: process.env.PW_CHROMIUM_PATH
      ? { executablePath: process.env.PW_CHROMIUM_PATH }
      : {},
  },
  projects: [
    {
      name: "chromium",
      testIgnore: /(mobile|passcode)\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    // The phone is the point of this app now, so it gets its own run rather
    // than a resized desktop window: Pixel 5 brings a real touch-enabled
    // context and a 393px viewport, which is where the layout actually breaks.
    {
      name: "mobile",
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "locked",
      testMatch: /passcode\.spec\.ts/,
      use: { ...devices["Pixel 5"], baseURL: lockedBaseURL },
    },
  ],
  webServer: [
    {
      // Both servers only serve — `npm run test:e2e` builds first. Playwright
      // starts every entry in a webServer array in parallel, so building inside
      // one of them races the other into `next start` on a clean checkout.
      command: `npm run start -- -p ${PORT}`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: { MOCK_TALE: "1" },
    },
    {
      command: `npm run start -- -p ${LOCKED_PORT}`,
      url: lockedBaseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: { MOCK_TALE: "1", PARENT_PASSCODE: PASSCODE },
    },
  ],
});
