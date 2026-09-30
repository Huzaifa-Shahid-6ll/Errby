import { defineConfig } from "@playwright/test";

// Opt-in development-instance checks only. No traces/screenshots containing
// credentials, cookies or learner content are saved by this suite.
export default defineConfig({
  testDir: "./tests/clerk-browser",
  workers: 1,
  use: {
    baseURL: process.env.ERRBY_APP_ORIGIN,
    trace: "off",
    screenshot: "off",
    video: "off",
  },
});
