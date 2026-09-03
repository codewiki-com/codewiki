import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  use: { baseURL: 'http://localhost:4321', trace: 'retain-on-failure' },
  webServer: { command: 'pnpm preview --port 4321', port: 4321, reuseExistingServer: true },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
