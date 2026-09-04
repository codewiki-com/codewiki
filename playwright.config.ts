import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  use: { baseURL: 'http://localhost:4321', trace: 'retain-on-failure' },
  webServer: {
    command: 'pnpm preview --port 4321',
    port: 4321,
    reuseExistingServer: false,
    // Astro daemonises `preview` when it detects a coding-agent environment, which makes the
    // command exit before Playwright can use it. This opt-out keeps it in the foreground; the
    // older agent markers stay blank for Astro versions that inspect them directly.
    env: { ASTRO_PREVIEW_BACKGROUND: '0', CLAUDECODE: '', AI_AGENT: '' },
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
