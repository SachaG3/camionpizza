import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  reporter: "line",
  use: { baseURL: "http://127.0.0.1:3041", trace: "retain-on-failure" },
  webServer: {
    command: "FOURCHETTE_DATA_DIR=/tmp/fourchette-e2e SMTP_HOST=127.0.0.1 SMTP_PORT=1 npm run start -- --hostname 127.0.0.1 --port 3041",
    url: "http://127.0.0.1:3041",
    reuseExistingServer: false,
    timeout: 120000,
  },
  projects: [{ name: "mobile-chromium", use: { ...devices["iPhone 13"], browserName: "chromium", viewport: { width: 390, height: 844 } } }],
});
