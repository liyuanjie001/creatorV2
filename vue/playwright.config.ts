import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  projects: [
    { name: 'desktop-1440', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'desktop-1280', use: { viewport: { width: 1280, height: 900 } } },
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4186',
    channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --port 4186 --configLoader runner --strictPort',
    url: 'http://127.0.0.1:4186',
    // A separate preview prevents tests from silently using an older app on the usual preview port.
    reuseExistingServer: false,
  },
});
