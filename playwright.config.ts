import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './e2e',
  outputDir: 'artifacts/playwright',
  reporter: [
    ['list'],
    ['junit', { outputFile: 'artifacts/e2e-junit.xml' }],
  ],
  use: {
    baseURL,
    browserName: 'chromium',
    viewport: { width: 1440, height: 960 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: baseURL,
    reuseExistingServer: false,
  },
});
