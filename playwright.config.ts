import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

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
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { MOCK_TALE: "1" },
  },
});
