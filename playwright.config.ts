import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  use: { baseURL: 'http://localhost:4321', trace: 'retain-on-failure' },
  webServer: {
    command: 'pnpm preview --port 4321',
    port: 4321,
    reuseExistingServer: true,
    // Astro daemonises `preview` when it detects a coding-agent environment, which makes the
    // command exit before Playwright can use it. Blanking the markers keeps it in the foreground.
    env: { CLAUDECODE: '', AI_AGENT: '' },
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
